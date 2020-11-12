const winston = require("winston");
const bookingService = require("../services/booking-service");
const petService = require("../services/pet-service");
const paymentService = require("../services/payment-service");
const renterService = require("../services/renter-service");
const stripeService = require("../services/stripe-service");
const transactionHelper = require("../services/util/transaction-helper");
const errorUtil = require("./util/error-util");
const moment = require("moment");

/*
This is a multi-step process:
1. Retrieve the pet and it's current bookings.
2. Validate the proposed booking to make sure there aren't
  existing bookings for overlapping dates.
3. Store the payment info with stripe and get a token use later
  The token refers to the card. We will charge it later when the
  owner accepts the booking.
4. Update the renter with the stripe token.
5. Create a payment record.

Note: I'm following my patern of having controllers talk to multiple services.
No service should talk to any other service. Controllers (for now) don't talk to
other controllers, just services.
*/
exports.createBooking = function (req, res) {
  const { startAt, endAt, totalPrice, days, petId, paymentToken } = req.body;
  const user = req.user;

  const {pet: foundPet, errGetPet } = petService.getPetByIdWithOwnerAndBookings(petId);
  if ( errGetPet ){
    return errorUtil.errorRes( res, 422, "Booking error", errGetPet)
  }
      // this will have to check sub, not id
      if (foundPet.owner.id === user.id) {
        return errorUtil.errorRes( res, 422, "Booking error",
          "Cannot create booking on your pet.")
      }

      if (!isValidBooking(startAt, endAt, foundPet)) {
        return errorUtil.errorRes( res, 422, "Booking error",
        "The dates selected are no longer available")
      }

        const { customer, errStripe } = await stripeService.createStripeCustomer(booking.renter, paymentToken);
        if (errStripe) {
          return errorUtil.errorRes( res, 422, "Booking error",
          "Cannot process payment.")
        }

        ///////////////////////////////////////////////////////////////
        // All the operations below should be in a transaction
        // Fail fast and return an error
        const session = await transactionHelper.startTransaction();

        // can't go on if this fails.
        const { renter, err: errRenter } = await renterService.updateSwipeCustomerId(renter._id, customer.id, session);
        if (errRenter) {
          await transactionHelper.abortTransaction(session);
          return errorUtil.errorRes( res, 422, "Payment error", errRenter)
        }

        // create payment record
        const { payment, errPayment } = await paymentService.createPayment( customer,
          booking_id, renter._id, foundPet.owner_id, paymentToken, session);
        if (errPayment) {
          await transactionHelper.abortTransaction(session);
          return errorUtil.errorRes( res, 422, "Payment error", errPayment)
        }

        let bookingData = {
          startAt,
          endAt,
          totalPrice,
          days,
          renterId: renter._id,
          ownerId: owner._id,
          petId: foundPet._id,
          paymentId: payment._id,
        };

        // save booking
        const { booking, err: errBooking } = await bookingService.addBooking(bookingData, session);
        if (errBooking) {
          await transactionHelper.abortTransaction(session);
          return errorUtil.errorRes( res, 422, "Payment error", errBooking)
        }

        // update pet
        const { pet: petUpdated, err: errPet } = petService.addBookingToPet(foundPet._id, booking._id, session);
        if (errPet) {
          await transactionHelper.abortTransaction(session);
          return errorUtil.errorRes( res, 422, "Payment error", errPet)
        }

        // update renter
        const { renter: renterUpdated, err: errRenter } = renterService.addBookingToRenter(renter._id, booking._id, session)
        if (errRenter) {
          await transactionHelper.abortTransaction(session);
          return errorUtil.errorRes( res, 422, "Payment error", errRenter)
        }

        await transactionHelper.commitTransaction(session);
        ///////////////////////////////////////////////////////////////

        return res.json({ startAt: startAt, endAt: endAt });
}

/*
  Make sure that the proposed booking doesn't overlap
  with any current bookings.
  (Ignore any CANCELLED bookings
    though they should have been removed from
    the pet record when declined.)
*/
function isValidBooking(startAt, endAt, pet) {
  let isValid = true;

  if (pet.bookings && pet.bookings.length > 0) {
    isValid = rental.bookings.every((booking) => {
      if ( booking.status === bookingService.STATUS.CANCELLED) return true;

      const proposedStart = moment(startAt);
      const proposedEnd = moment(endAt);

      const actualStart = moment(booking.startAt);
      const actualEnd = moment(booking.endAt);

      // check to see that any existing bookings begin and end before the proposed
      // or that the proposed begins and ends beforethe others
      // the logic here can be shortened to (actualEnd < proposedStart && proposedEnd < actualStart)
      return (
        (actualStart < proposedStart && actualEnd < proposedStart) ||
        (proposedEnd < actualEnd && proposedEnd < actualStart)
      );
    });
  }
  return isValid;
}

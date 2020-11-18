const winston = require("winston");
const moment = require("moment");
var mongoose = require("mongoose");

const bookingService = require("../services/booking-service");
const ownerService = require("../services/owner-service");
const petService = require("../services/pet-service");
const paymentService = require("../services/payment-service");
const renterService = require("../services/renter-service");
const stripeService = require("../services/stripe-service");
const transactionHelper = require("../services/util/transaction-helper");
const errorUtil = require("./util/error-util");
const jsu = require("./util/json-style-util");

/*
  I might want to move this to the pet controller.
  The booking service should probably not be a Node service.
  I'd break it out. But the get bookings for pets API is fine here.

  Strip out all the details except the dates.

  Return empty rather than 404 if there are no bookings.
*/
exports.getBookingDatesForPet = async function (req, res) {
  const petId = req.params.id;
  const { bookings, err } = await bookingService.getBookingsForPet(petId);
  if (err) {
    return errorUtil.errorRes(res, 500, "Booking Retrieval Error", err);
  }
  let dates = [];
  if (bookings) {
    bookings.map((b) => dates.push({ startAt: b.startAt, endAt: b.endAt }));
  }
  res.json(jsu.payload(dates));
};

//getBookingsForOwner
// consider just using the user id from the authentication
// might want some other admin to be able to use this though .. .
exports.getBookingsForOwner = async function (req, res) {
  const ownerId = req.params.id;

  // TODO seems like a good candidate for middleware!
  const user = req.user;
  // TODO make a get id for authsub and cache it
  const { owner, err: errOwner } = await ownerService.getOwnerByAuth0Sub(
    user.sub
  );
  if (errOwner) return returnOtherError(res, 401, errOwner);
  if (owner._id.toString() !== ownerId) {
    return returnAuthorizationError(res, owner._id, ownerId);
  }

  const { bookings, err } = await bookingService.getBookingsForOwner(ownerId);
  if (err) return returnOtherError(res, 500, err);
  // return null for not found
  res.json(jsu.payload(bookings));
};

//getBookingsForRenter
exports.getBookingsForRenter = async function (req, res) {
  const renterId = req.params.id;

  const user = req.user;
  const { renter, err: errRenter } = await renterService.getRenterByAuth0Sub(
    user.sub
  );
  // should make sure that this is a 404 from the service and not something else
  if (errRenter) returnOtherError(res, 401, errRenter);
  if (renter._id.toString() !== renterId) {
    return returnAuthorizationError(res, renter._id, renterId);
  }

  const { bookings, err } = await bookingService.getBookingsForRenter(renterId);
  if (err) return returnOtherError(res, 500, err);
  // return null for not found
  res.json(jsu.payload(bookings));
};

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

There are 12 steps below!
*/
exports.createBooking = async function (req, res) {
  const { startAt, endAt, totalPrice, days, petId, paymentToken } = req.body;
  const user = req.user;

  // move to booking service
  const bookingId = mongoose.Types.ObjectId();

  winston.info("BookingService. CB1. getRenter");
  const { renter, err: errGetRenter } = await renterService.getRenterByAuth0Sub(
    user.sub
  );

  winston.info("BookingService. CB2. getPet");
  const {
    pet: foundPet,
    errGetPet,
  } = await petService.getPetByIdWithOwnerAndBookings(petId);
  if (errGetPet) {
    return errorUtil.errorRes(res, 422, "Booking error", errGetPet);
  }
  winston.info(foundPet);

  winston.info("BookingService. CB3. checkOwner");
  // this will have to check sub, not id
  if (foundPet.owner._id.toString() === renter._id.toString()) {
    return errorUtil.errorRes(
      res,
      422,
      "Booking error",
      "Cannot create booking on your pet."
    );
  }

  winston.info("BookingService. CB4. isValid");
  if (!isValidBooking(startAt, endAt, foundPet)) {
    return errorUtil.errorRes(
      res,
      422,
      "Availability Error",
      "The dates selected are no longer available"
    );
  }

  winston.info("BookingService. CB5. createStripeCustomer");
  const { customer, errStripe } = await stripeService.createStripeCustomer(
    renter.email,
    paymentToken
  );
  if (errStripe) {
    return errorUtil.errorRes(
      res,
      422,
      "Booking error",
      "Cannot process payment."
    );
  }

  ///////////////////////////////////////////////////////////////
  // All the operations below should be in a transaction
  // Fail fast and return an error
  winston.info("BookingService. CB6. startTransaction");
  const session = await transactionHelper.startTransaction();

  // can't go on if this fails.
  winston.info("BookingService. CB7. updateSwipeCustomerId");
  const {
    renter: renterUpdatedSwipe,
    err: errRenterSwipe,
  } = await renterService.updateSwipeCustomerId(
    renter._id,
    customer.id,
    session
  );
  if (errRenterSwipe) {
    await transactionHelper.abortTransaction(session);
    return errorUtil.errorRes(res, 422, "Payment error", errRenterSwipe);
  }

  // create payment record
  winston.info("BookingService. CB8. createPayment");
  const { payment, errPayment } = await paymentService.createPayment(
    customer,
    bookingId,
    renter._id,
    foundPet.owner_id,
    totalPrice,
    paymentToken,
    session
  );
  if (errPayment) {
    await transactionHelper.abortTransaction(session);
    return errorUtil.errorRes(res, 422, "Payment error", errPayment);
  }

  let bookingData = {
    _id: bookingId,
    startAt,
    endAt,
    totalPrice,
    days,
    renterId: renter._id,
    ownerId: foundPet.owner._id,
    petId: foundPet._id,
    paymentId: payment._id,
  };

  // save booking
  winston.info("BookingService. CB9. addBooking");
  const { booking, err: errBooking } = await bookingService.addBooking(
    bookingData,
    session
  );
  if (errBooking) {
    await transactionHelper.abortTransaction(session);
    return errorUtil.errorRes(res, 422, "Payment error", errBooking);
  }

  // update pet
  winston.info("BookingService. CB10. addBookingToPet");
  const { pet: petUpdated, err: errPet } = await petService.addBookingToPet(
    foundPet._id,
    booking._id,
    session
  );
  if (errPet) {
    await transactionHelper.abortTransaction(session);
    return errorUtil.errorRes(res, 422, "Payment error", errPet);
  }

  // update renter
  winston.info("BookingService. CB11. addBookingToRenter");
  const {
    renter: renterUpdated,
    err: errRenter,
  } = await renterService.addBookingToRenter(renter._id, booking._id, session);
  if (errRenter) {
    await transactionHelper.abortTransaction(session);
    return errorUtil.errorRes(res, 422, "Payment error", errRenter);
  }

  // commit we are done!!!!!!!!!
  winston.info("BookingService. CB12. commitTransaction");
  await transactionHelper.commitTransaction(session);

  ///////////////////////////////////////////////////////////////

  res.json(jsu.payload(booking));
  //return res.json({ startAt: startAt, endAt: endAt });
};

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
    isValid = pet.bookings.every((booking) => {
      if (booking.status === bookingService.STATUS.CANCELLED) return true;

      const proposedStart = moment(startAt, "MM/DD/YYYY");
      const proposedEnd = moment(endAt, "MM/DD/YYYY");

      const actualStart = moment(booking.startAt, "MM/DD/YYYY");
      const actualEnd = moment(booking.endAt, "MM/DD/YYYY");

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

//////////////////////////////////////////////////////////

function returnAuthorizationError(res, userId, requestedId) {
  return errorUtil.errorRes(
    res,
    403,
    "Authorization Error",
    `${userId} does not have access to bookings for ${requestedId}`
  );
}

function returnOtherError(res, code, err) {
  return errorUtil.errorRes(res, code, "Owner Error", err);
}

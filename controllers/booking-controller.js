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
const ControllerError = require("./util/ControllerError");
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
  const {
    ownerId: userOId,
    err: errOwner,
  } = await ownerService.getOwnerIdForAuth0Sub(user.sub);
  if (errOwner) return returnOtherError(res, 500, errOwner);
  if (userOId !== ownerId) {
    return returnAuthorizationError(res, userOId, ownerId);
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
  const {
    renterId: userRId,
    err: errRenter,
  } = await renterService.getRenterIdForAuth0Sub(user.sub);
  // should make sure that this is a 404 from the service and not something else
  if (errRenter) returnOtherError(res, 401, errRenter);
  if (userRId !== renterId) {
    return returnAuthorizationError(res, userRId, renterId);
  }

  const { bookings, err } = await bookingService.getBookingsForRenter(renterId);
  if (err) return returnOtherError(res, 500, err);
  // return null for not found
  return res.json(jsu.payload(bookings));
};

/*
This is a multi-step process:
. Retrieve the pet and it's current bookings.
. Validate the proposed booking to make sure there aren't
  existing bookings for overlapping dates.
. Store the payment info with stripe and get a token use later
  The token refers to the card. We will charge it later when the
  owner accepts the booking.
. Update the renter with the stripe token.
. Create a payment record.

Note: I'm following my patern of having controllers talk to multiple services.
No service should talk to any other service. Controllers (for now) don't talk to
other controllers, just services.

There are 12 steps below!
*/
exports.createBooking = async function (req, res) {
  // TODO validate the input
  const { startAt, endAt, totalPrice, days, petId, paymentToken } = req.body;
  const user = req.user;

  // TODO move to booking service
  const bookingId = mongoose.Types.ObjectId();

  let renter;
  let customer;
  let pet;
  try {
    winston.info("BookingService. CB1. getRenter");
    renter = await getRenter(user.sub);

    winston.info("BookingService. CB2. getPet");
    pet = await getPet(petId);

    winston.info("BookingService. CB3. checkOwner");
    checkIfAllowed(pet, renter);

    winston.info("BookingService. CB4. isValid");
    checkIfBookingValid(startAt, endAt, pet);

    winston.info("BookingService. CB5. createStripeCustomer");
    customer = await callCreateStripeCustomer(renter, paymentToken);
  } catch (error) {
    winston.log("error", "Booking failed before transaction. " + error.message);
    return returnOtherError(res, 422, error);
  }

  ///////////////////////////////////////////////////////////////
  // All the operations below should be in a transaction
  // Fail fast and return an error
  winston.info("BookingService. CB6. startTransaction");
  const session = await transactionHelper.startTransaction();

  let booking;
  try {
    winston.info("BookingService. CB7. updateSwipeCustomerId");
    await updateRenterWithStripe(renter, customer, session);

    winston.info("BookingService. CB8. createPayment");
    const paymentData = {
      customer,
      bookingId,
      renterId: renter._id,
      ownerId: pet.owner._id,
      totalPrice,
      paymentToken,
    };
    let payment = await createPayment(paymentData, session);

    winston.info("BookingService. CB9. addBooking");
    const bookingData = {
      _id: bookingId,
      startAt,
      endAt,
      totalPrice,
      days,
      renterId: renter._id,
      ownerId: pet.owner._id,
      petId: pet._id,
      paymentId: payment._id,
    };
    booking = await addBooking(bookingData, session);

    winston.info("BookingService. CB10. addBookingToPet");
    await addBookingToPet(pet, booking, session);

    winston.info("BookingService. CB11. addBookingToRenter");
    await addBookingToRenter(renter, booking, session);

    winston.info("BookingService. CB12. commitTransaction");
    await transactionHelper.commitTransaction(session);
  } catch (error) {
    winston.log("error", "Booking failed during transaction. " + error.message);
    await transactionHelper.abortTransaction(session);
    return returnOtherError(res, 422, error);
  }

  return res.json(jsu.payload(booking));
};

//////////////////////////////////////////////////////////////
// CREATE BOOKING STEP 1
async function getRenter(sub) {
  const { renter, err: errGetRenter } = await renterService.getRenterByAuth0Sub(
    sub
  );
  if (!renter || !renter._id) {
    const message = "No renter for sub found.";
    throw new ControllerError("Booking error", message);
  }
  if (errGetRenter) {
    throw new ControllerError("Booking error", errGetRenter);
  }
  return renter;
}

// CREATE BOOKING STEP 2
async function getPet(petId) {
  const {
    pet: pet,
    errGetPet,
  } = await petService.getPetByIdWithOwnerAndBookings(petId);
  if (!pet || !pet._id) {
    const message = "No pet found for id.";
    throw new ControllerError("Booking error", message);
  }
  if (errGetPet) {
    throw new ControllerError("Booking error", errGetPet);
  }
  winston.info(pet);
  return pet;
}

// CREATE BOOKING STEP 3
function checkIfAllowed(pet, renter) {
  if (pet.owner._id.toString() === renter._id.toString()) {
    throw new ControllerError(
      "Booking error",
      "Cannot create booking on your pet."
    );
  }
}
// CREATE BOOKING STEP 4
function checkIfBookingValid(startAt, endAt, pet) {
  if (!isValidBooking(startAt, endAt, pet)) {
    throw new ControllerError(
      "Availability Error",
      "The dates selected are no longer available"
    );
  }
}

// CREATE BOOKING STEP 5
async function callCreateStripeCustomer(renter, paymentToken) {
  const { customer, err: errStripe } = await stripeService.createStripeCustomer(
    renter.email,
    paymentToken
  );
  if (errStripe) {
    throw new ControllerError("Booking error", "Cannot process payment.");
  }
  return customer;
}

// CREATE BOOKING STEP 7
async function updateRenterWithStripe(renter, customer, session) {
  const {
    renter: renterUpdatedSwipe,
    err: errRenterSwipe,
  } = await renterService.updateSwipeCustomerId(
    renter._id,
    customer.id,
    session
  );
  if (errRenterSwipe) {
    throw new ControllerError("Payment error", errRenterSwipe);
  }
}

// CREATE BOOKING STEP 8
async function createPayment(paymentData, session) {
  const { payment, err: errPayment } = await paymentService.createPayment(
    paymentData.customer,
    paymentData.bookingId,
    paymentData.renterId,
    paymentData.ownerId,
    paymentData.totalPrice,
    paymentData.paymentToken,
    session
  );
  if (errPayment) {
    throw new ControllerError("Payment error", errPayment);
  }
  return payment;
}

// CREATE BOOKING STEP 9
async function addBooking(bookingData, session) {
  const { booking, err: errBooking } = await bookingService.addBooking(
    bookingData,
    session
  );
  if (errBooking) {
    throw new ControllerError("Booking error", errBooking);
  }
  return booking;
}

// CREATE BOOKING STEP 10
async function addBookingToPet(pet, booking, session) {
  const { pet: petUpdated, err: errPet } = await petService.addBookingToPet(
    pet._id,
    booking._id,
    session
  );
  if (errPet) {
    throw new ControllerError("Booking error", errPet);
  }
}

// CREATE BOOKING STEP 11
async function addBookingToRenter(renter, booking, session) {
  const {
    renter: renterUpdated,
    err: errRenter,
  } = await renterService.addBookingToRenter(renter._id, booking._id, session);
  if (errRenter) {
    throw new ControllerError("Booking error", errRenter);
  }
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
  let title = err.title ? err.title : "Booking Error";
  let message = err.message ? err.message : err;
  return errorUtil.errorRes(res, code, title, message);
}

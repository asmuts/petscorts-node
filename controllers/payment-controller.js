const winston = require("winston");
const bookingService = require("../services/booking-service");
const ownerService = require("../services/owner-service");
const petService = require("../services/pet-service");
const paymentService = require("../services/payment-service");
const stripeService = require("../services/stripe-service");
const errorUtil = require("./util/error-util");
const transactionHelper = require("../services/util/transaction-helper");

// TODO finish. This is a sketch.

exports.getPendingPayments = async function (req, res) {
  // TODO take this as a param
  // have middleware match the ids
  const user = req.user;
  const { ownerId, err: errOwner } = await ownerService.getOwnerIdForAuth0Sub(
    user.sub
  );
  if (ownerId) return returnOtherError(res, 401, errOwner);

  const { payments, err } = await paymentService.getPendingPayments(ownerId);
  if (err) {
    return errorUtil.errorRes(
      res,
      422,
      "Payment error",
      "Could not retrieve pending payments."
    );
  }
  return res.json(payments.payments);
};

/*
Mark the booking status as cancelled.
Set the payment status to declined.
This is called when an owner declines a booking.

TODO clean this up. Add transaction support.
*/
exports.declinePayment = async function (req, res) {
  const paymentId = req.params.id;

  // Can't go on if this fails.
  let { payment, err } = await paymentService.getPaymentById(paymentId);
  if (err) {
    return errorUtil.errorRes(res, 422, "Payment error", err);
  }

  // TODO Fail fast or get as much done as possible?
  // Gather the errors and report on them at the end.
  const errors = [];
  const { booking, err: error2 } = await bookingService.updateBookingStatus(
    payment.booking._id,
    bookingService.STATUS.CANCELLED
  );
  if (error2) {
    errors.push(error2);
  }

  let { err: error3 } = await paymentService.declinePayment(payment._id);
  if (error3) {
    errors.push(error3);
  }

  // Booking references the pet id, so it could be retrieved.
  // Removing it from the pet record might simplify things.
  const { err: error4 } = await petService.removeBookingFromPet(
    payment.pet._id,
    payment.booking._id
  );
  if (error4) {
    errors.push(error4);
  }

  if (errors.length > 0) {
    return errorUtil.errorRes(res, 422, "Payment error", errors);
  }

  return res.json({ status: "DELETED" });
};

/*
 Refactored to take advantage of the new transaction
  -- features in mongoose as of 8/2020

  The most important record is that of payment.
  Bail if it fails.
  It it succeeds, update the database.
  If there is an erorr, rollback the transaction and try to refund.

  Note: This entire process needs to be more robust. It should be done
  on a different microservice, probably in Java. And we need to be able
  to queue up retries.  Right now I'm just trying 3 times to issue a
  refund. It that fails, I just appologize.  That's not acceptable in a
  a real application.

*/
exports.confirmPayment = async function (req, res) {
  const paymentId = req.params.id;
  let { payment, err } = await paymentService.getPaymentById(paymentId);
  if (err) {
    return errorUtil.errorRes(res, 422, "Payment error", err);
  }

  // TODO seems like a good candidate for middleware!
  const user = req.user;
  // TODO make a get id for authsub and cache it
  const { ownerId, err: errOwner } = await ownerService.getOwnerIdForAuth0Sub(
    user.sub
  );
  if (ownerId) return returnOtherError(res, 401, errOwner);
  if (payment.owner._id.toString() !== ownerId) {
    return returnAuthorizationError(res, payment.owner._id.toString(), ownerId);
  }

  // Might also want to try if it is REFUNDED
  if (payment.status !== paymentService.STATUS.PENDING) {
    return errorUtil.errorRes(
      res,
      422,
      "Payment error",
      "Payment status was not pending."
    );
  }

  // middleware should check  user.id === foundPayment.renter.id
  const booking = payment.booking;

  // call stripe service. Can't go on if this fails.
  // Total price in dollars and cents, the service will *100
  const { charge, err: errorStripe } = await stripeService.charge(
    booking.totalPrice,
    payment.customer.id,
    payment.customer.default_source
  );
  if (err) {
    return errorUtil.errorRes(res, 422, "Payment error", errorStripe);
  }

  ///////////////////////////////////////////////////////////////
  // All the operations below should be in a transaction
  // Fail at end if errors, refund, and return an error
  const session = await transactionHelper.startTransaction();

  // TODO need some kind of transaction
  const errors = [];
  const {
    paymentUpdated,
    err: errorPaid,
  } = await paymentService.setPaymentToPaid(paymentId, charge, session);
  if (errorPaid) errors.push(errorPaid);

  const {
    booking: bookingUpdated,
    err: errorBooking,
  } = await bookingService.updateBookingStatus(
    payment.booking._id,
    bookingService.STATUS.ACTIVE,
    session
  );
  if (errorBooking) errors.push(errorBooking);

  const { renter, err: errorRenter } = await renterService.addToRevenue(
    payment.renter._id,
    paymentUpdated.amount,
    session
  );
  if (errorRenter) errors.push(errorRenter);

  // ABORT AND REFUND IF NEEDED
  if (errors.length > 0) {
    // BAD NEWS
    await transactionHelper.abortTransaction(session);
    return await refundCharge(res, charge, payment);
  }

  await transactionHelper.commitTransaction(session);
  ////////////////////////////////////////

  return res.json({ status: "PAID" });
};

// Refund and store the refundId on the payment record
async function refundCharge(res, charge, payment) {
  const { refund, err: errRefund } = await stripeService.refund(charge.id);
  if (errRefund) {
    // REALLY BAD NEWS!!!! The gods frown upon us.
    return errorUtil.errorRes(
      res,
      422,
      "Refund error",
      "Unfortunately there has been an error. Your card has been charged and we were unable to issue a refund. We are working on the problem."
    );
  }
  const {
    payment: refundPayment,
    err: errRefunStore,
  } = await paymentService.setPaymentToRefunded(payment._id, refund);
  if (errRefunStore) {
    return errorUtil.errorRes(res, 422, "Payment error", errRefunStore);
  }
}

//////////////////////////////////////////////////////////

function returnAuthorizationError(res, userId, requestedId) {
  return errorUtil.errorRes(
    res,
    403,
    "Authorization Error",
    `${userId} does not have access to paymenr for ${requestedId}`
  );
}

function returnOtherError(res, code, err) {
  return errorUtil.errorRes(res, code, "Payment Error", err);
}

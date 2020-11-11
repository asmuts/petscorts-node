const winston = require("winston");
const bookingService = require("../services/booking-service");
const petService = require("../services/pet-service");
const paymentService = require("../services/payment-service");
const stripeService = require("../services/stripe-service");
const errorUtil = require("./util/error-util");

exports.getPendingPayments = function (req, res) {
  // TODO take this as a param
  // have middleware match the ids
  const user = req.user;
  const ownerId = user._id;

  const { payments, err } = paymentService.getPendingPayments(ownerId);
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
*/
exports.declinePayment = function (req, res) {
  const paymentId = req.params.paymentId;

  // Can't go on if this fails.
  let { payment, err } = paymentService.getPaymentById(paymentId);
  if (err) {
    return errorUtil.errorRes(res, 422, "Payment error", err);
  }

  // TODO Fail fast or get as much done as possible?
  // Gather the errors and report on them at the end.
  const errors = [];
  const { booking, err: error2 } = bookingService.updateBookingStatus(
    payment.booking._id,
    bookingService.STATUS.CANCELLED
  );
  if (error2) {
    errors.push(error2);
  }

  let { err: error3 } = paymentService.declinePayment(payment._id);
  if (error3) {
    errors.push(error3);
  }

  // Booking references the pet id, so it could be retrieved.
  // Removing it from the pet record might simplify things.
  const { err: error4 } = petService.removeBookingFromPet(
    payment.pet._id,
    payment.booking._id
  );
  if (error4) {
    errors.push(error4);
  }

  if ( errors.length >0){
    return errorUtil.errorRes(res, 422, "Payment error", errors);
  }

  return res.json({ status: "DELETED" });
};

/*
  Transactionless updating paymnet records!!!
  -- TODO consider refactoring to take advantage of the new transaction
  -- features in mongoose as of 8/2020
  The most important record is that of payment.
  Bail if it fails.  There's no going back at that point. (unless refund)
  Otherwise, get as much done as we can.
  Gather any errors updating the renter, booking, or payment collections
*/
exports.confirmPayment = function (req, res) {
  const paymentId = req.params.paymentId;
  let { payment, err } = paymentService.getPaymentById(paymentId);
  if (err) {
    return errorUtil.errorRes(res, 422, "Payment error", err);
  }

  if ( payment.status !== paymentService.STATUS.PENDING) {
    return errorUtil.errorRes(res, 422, "Payment error", "Payment status was not pending.");
  }

  // middleware should check
  //   user.id === foundPayment.renter.id
  const booking = payment.booking;

    // call stripe service. Can't go on if this fails.
  const { charge, err: errorStripe } = await stripeService.charges(booking.totalPrice * 100, payment.fromStripeCustomerId );
  if (err) {
     return errorUtil.errorRes(res, 422, "Payment error", errorStripe);
  }

  // TODO need some kind of transaction
  const errors = [];
  const { paymentUpdated, err: errorPaid } = paymentService.setPaymentToPaid(paymentId, charge )
  if (errorPaid) errors.push( errorPaid );


  const { booking, err: errorBooking } = bookingService.updateBookingStatus(
    payment.booking._id,
    bookingService.STATUS.ACTIVE
  );
  if (errorBooking) errors.push( errorBooking );

  const { renter, err: errorRenter } = renterService.addToRevenue( payment.renter._id, paymentUpdated.amount );
  if (errorRenter) errors.push( errorRenter );

  return res.json({ status: "PAID", errors });
};

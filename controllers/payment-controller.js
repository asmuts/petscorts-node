const winston = require("winston");
const bookingService = require("../services/booking-service");
const ownerService = require("../services/owner-service");
const renterService = require("../services/renter-service");
const petService = require("../services/pet-service");
const paymentService = require("../services/payment-service");
const stripeService = require("../services/stripe-service");
const errorUtil = require("./util/error-util");
const transactionHelper = require("../services/util/transaction-helper");
const jsu = require("./util/json-style-util");

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

  // TODO reduce duplication with confirmPayment!
  winston.info("PaymentController. DP: getPaymentById");
  let { payment, err: errPLookup } = await paymentService.getPaymentById(
    paymentId
  );
  if (!payment) return returnOtherError(res, 404, "No payment record found.");
  if (errPLookup)
    return errorUtil.errorRes(res, 422, "Payment error", errPLookup);
  winston.info(payment);

  // TODO seems like a good candidate for middleware!
  winston.info("PaymentController. DP: validate owner");
  const user = req.user;
  const { ownerId, err: errOwner } = await ownerService.getOwnerIdForAuth0Sub(
    user.sub
  );
  if (errOwner) return returnOtherError(res, 500, errOwner);
  if (payment.owner !== ownerId) {
    // TODO remove: temp fix for bug. owner wasn't getting stored in payment
    if (payment.booking.owner != ownerId) {
      return returnAuthorizationError(res, payment.owner, ownerId);
    }
  }

  if (payment.status !== paymentService.STATUS.PENDING) {
    return returnOtherError(res, 422, "Payment status was not pending.");
  }

  winston.info("PaymentController. DP: begin transaction");
  const session = await transactionHelper.startTransaction();

  try {
    // fail fast
    winston.info("PaymentController. DP: updateBookingStatus");
    const { booking, err: error2 } = await bookingService.updateBookingStatus(
      payment.booking._id,
      bookingService.STATUS.CANCELLED,
      session
    );
    if (error2) throw new Error(error2);

    winston.info("PaymentController. DP: declinePayment");
    let { err: error3 } = await paymentService.declinePayment(
      payment._id,
      session
    );
    if (error3) throw new Error(error3);

    // Booking references the pet id, so it could be retrieved.
    // Removing it from the pet record might simplify things.
    winston.info("PaymentController. DP: removeBookingFromPet");
    const { pet, err: error4 } = await petService.removeBookingFromPet(
      payment.pet,
      payment.booking._id,
      session
    );
    if (error4) throw new Error(error4);
  } catch (error) {
    winston.log("error", error);
    winston.info("PaymentController. DP: abortTransaction");
    await transactionHelper.abortTransaction(session);
    return errorUtil.errorRes(res, 422, "Payment error", error);
  }

  winston.info("PaymentController. DP: commitTransaction");
  await transactionHelper.commitTransaction(session);

  res.json(jsu.payload(payment));
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
  winston.info("PaymentController. CP: getPayment");
  const paymentId = req.params.id;
  winston.info("PaymentController. CP: getPaymentById");
  let { payment, err: errPLookup } = await paymentService.getPaymentById(
    paymentId
  );
  if (!payment) return returnOtherError(res, 404, "No payment record found.");
  if (errPLookup)
    return errorUtil.errorRes(res, 422, "Payment error", errPLookup);
  winston.info(payment);

  // TODO seems like a good candidate for middleware!
  winston.info("PaymentController. CP: validate owner");
  const user = req.user;
  const { ownerId, err: errOwner } = await ownerService.getOwnerIdForAuth0Sub(
    user.sub
  );
  if (errOwner) return returnOtherError(res, 500, errOwner);
  if (payment.owner !== ownerId) {
    // TODO remove: temp fix for bug. owner wasn't getting stored in payment
    if (payment.booking.owner != ownerId) {
      return returnAuthorizationError(res, payment.owner, ownerId);
    }
  }

  // Might also want to try if it is REFUNDED
  if (payment.status !== paymentService.STATUS.PENDING) {
    return returnOtherError(res, 422, "Payment status was not pending.");
  }

  const booking = payment.booking;

  // call stripe service. Can't go on if this fails.
  // Total price in dollars and cents, the service will *100
  winston.info("PaymentController. CP: Stripe charge");
  const { charge, err: errorStripe } = await stripeService.charge(
    booking.totalPrice,
    payment.stripeCustomerId,
    payment.stripeCustomer.default_source
  );
  if (errorStripe) {
    return errorUtil.errorRes(res, 422, "Payment error", errorStripe);
  }

  ///////////////////////////////////////////////////////////////
  // All the operations below should be in a transaction
  // Fail at end if errors, refund, and return an error
  winston.info("PaymentController. CP: begin transaction");
  const session = await transactionHelper.startTransaction();

  try {
    winston.info("PaymentController. CP: setPaymentToPaid");
    const {
      payment: paymentUpdated,
      err: errorPaid,
    } = await paymentService.setPaymentToPaid(paymentId, charge, session);
    if (errorPaid) throw new Error(errorPaid);

    winston.info("PaymentController. CP: updateBookingStatus");
    const {
      booking: bookingUpdated,
      err: errorBooking,
    } = await bookingService.updateBookingStatus(
      payment.booking._id,
      bookingService.STATUS.ACTIVE,
      session
    );
    if (errorBooking) throw new Error(errorBooking);

    winston.info("PaymentController. CP: addToRevenue");
    const { renter, err: errorRenter } = await renterService.addToRevenue(
      payment.renter._id,
      paymentUpdated.amount,
      session
    );
    if (errorRenter) throw new Error(errorRenter);
  } catch (error) {
    // ABORT AND REFUND IF NEEDED
    winston.log("error", error);
    winston.info("PaymentController. CP: abortTransaction");
    await transactionHelper.abortTransaction(session);
    return await refundCharge(res, charge, payment);
  }

  winston.info("PaymentController. CP: commitTransaction");
  await transactionHelper.commitTransaction(session);
  ////////////////////////////////////////

  res.json(jsu.payload(payment));
};
//////////////////////////////////////////////////////////////

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
    `${userId} does not have access to payment for ${requestedId}`
  );
}

function returnOtherError(res, code, err) {
  if (!err) {
    err = "Unknown error processing payment.";
  }
  return errorUtil.errorRes(res, code, "Payment Error", err);
}

/*
:{"status":"PENDING","_id":"5fb723d74e556b46631417c4","renter":"5fb2fd1f6bfec23c84b9083d",
"stripeCustomerId":"cus_IQFSchPUn5tHmZ",
"stripeCustomer":{"id":"cus_IQFSchPUn5tHmZ","object":"customer","address":null,"balance":0,"created":1605837783,
"currency":null,"default_source":"card_1HpOxlKSKj65FII0aX5uAwTb","delinquent":false,"description":null,
"discount":null,"email":"asmuts@gmail.com","invoice_prefix":"CD8FA44E",
"invoice_settings":{"custom_fields":null,"default_payment_method":null,"footer":null},
"livemode":false,"name":null,"next_invoice_sequence":1,"phone":null,"preferred_locales":[],
"shipping":null,"tax_exempt":"none"},
"booking":{"status":"PENDING","_id":"5fb723d74e556b46631417c3",
"startAt":"2020-12-23T00:00:00.000Z","endAt":"2020-12-24T00:00:00.000Z","totalPrice":12,"days":1,
"renter":"5fb2fd1f6bfec23c84b9083d",
"owner":"5f9c8570dfc3a2027076fa56","pet":"5fb2d30729f9c73f98bc4b4e","payment":"5fb723d74e556b46631417c4",
"createdAt":"2020-11-20T02:03:03.875Z","__v":0},"amount":960,"__v":0},"level":"info"}
{"message":"PaymentController. CP: validate owner","level":"info"}
*/

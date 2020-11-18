const mongoose = require("mongoose");
const winston = require("winston");

const Payment = require("./models/payment");

// crude - TODO make configurable
const CUSTOMER_SHARE = 0.8;

const STATUS = {
  PENDING: "PENDING",
  DECLINED: "DECLINED",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
};

exports.getPaymentById = async function (paymentId) {
  try {
    const payment = await Payment.findById(paymentId)
      .populate("booking")
      .populate("owner")
      .exec();
    winston.info(`Booking for ID: ${paymentId} - ${payment}`);
    return { payment };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// Saving the entire swipe customer records and the id
// for lookup
exports.createPayment = async (
  stripeCustomer,
  bookingId,
  renterId,
  ownerId,
  totalPrice,
  token,
  session
) => {
  const tokenId = token.id || token;

  const payment = new Payment({
    renter: renterId,
    owner: ownerId,
    stripeCustomerId: stripeCustomer.id,
    stripeCustomer: stripeCustomer,
    booking: bookingId,
    tokenId: token.id,
    amount: totalPrice * 100 * CUSTOMER_SHARE,
  });

  try {
    const savedPayment = await payment.save(session);
    return { payment: savedPayment };
  } catch (err) {
    winston.log("erorr", "PaymentService. createPayment " + err.message);
    return { err: err.message };
  }
};

exports.getPendingPayments = async function (ownerId) {
  try {
    const foundPayments = await Payment.where({ owner: ownerId })
      .populate({
        path: "booking",
        populate: { path: "pet" },
      })
      .populate("renter")
      .exec();
    return { payments: foundPayments };
  } catch (err) {
    return { err: err.message };
  }
};

/*
 This is called when an owner declines a
  booking
*/
exports.declinePayment = async function (paymentId) {
  try {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: STATUS.DECLINED,
      },
      {
        new: true,
      }
    ).exec();
    return { payment };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// Saving the entire charge record and the id for lookup
exports.setPaymentToPaid = async function (paymentId, stripeCharge) {
  try {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: STATUS.PAID,
        stripCharge: stripeCharge,
        stripeChargeId: stripeCharge.id,
      },
      {
        new: true,
      }
    ).exec();
    return { payment };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// Saving the entire charge record and the id for lookup
exports.setPaymentToRefunded = async function (paymentId, stripeRefund) {
  try {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: STATUS.REFUNDED,
        stripeRefund: stripeRefund.id,
      },
      {
        new: true,
      }
    ).exec();
    return { payment };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

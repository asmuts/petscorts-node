const winston = require("winston");
const Booking = require("./models/booking");
const mongoose = require("mongoose");
const moment = require("moment");

const STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
};

const CUSTOMER_SHARE = 0.8;

// rough draft partially based on an example

// For testing. Limit the max results for safety.
exports.getAllBookings = async function () {
  try {
    const bookings = await Booking.find().limit(200).exec();
    winston.info(`Found ${bookings.length} bookings.`);
    return { bookings };
  } catch (err) {
    winston.error(err);
    return { err: err.message };
  }
};

exports.getBookingById = async function (bookingId) {
  try {
    const booking = await Booking.findById(bookingId);
    winston.info(`Booking for ID: ${bookingId} - ${booking}`);
    return { booking };
  } catch (err) {
    winston.error(err);
    return { err: err.message };
  }
};

// startAt: { type: Date, required: "Starting date is required" },
// endAt: { type: Date, required: "Ending date is required" },
// totalPrice: Number,
// days: Number,
// createdAt: { type: Date, default: Date.now },
// renter: { type: Schema.Types.ObjectId, ref: "Renter" },
// owner: { type: Schema.Types.ObjectId, ref: "Owner" },
// pet: { type: Schema.Types.ObjectId, ref: "Pet" },
// status: { type: String, enum: ["PENDING", "CONFIRMED"] default: "PENDING" },
exports.addBooking = async function (bookingData) {
  let booking = new Booking({
    startAt: bookingData.startAt,
    endAt: bookingData.endAt,
    totalPrice: bookingData.totalPrice,
    days: bookingData.days,
    //createdAt: bookingData.createdAt,
    renter: bookingData.renterId,
    owner: bookingData.ownerId,
    pet: bookingData.petId,
    payment: bookingData.paymentId,
    //status: bookingData.status,
  });
  try {
    await booking.save();
    return { booking };
  } catch (err) {
    winston.error(err);
    return { err: err.message };
  }
};

exports.getBookingsForOwner = async function (ownerId) {
  try {
    const bookings = await Booking.find({ owner: ownerId })
      .populate("pet")
      .exec();
    winston.info(`Found ${bookings.length} bookings for owner - ${ownerId}`);
    return { bookings };
  } catch (err) {
    winston.error(err);
    return { err: err.message };
  }
};

//  enum: ["PENDING", "ACTIVE", "CANCELLED"],
exports.updateBookingStatus = async function (bookingId, status) {
  try {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: status,
      },
      {
        new: true,
      }
    ).exec();
    return { booking };
  } catch (err) {
    winston.error(err);
    return { err: err.message };
  }
};

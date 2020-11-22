const winston = require("winston");
const Booking = require("./models/booking");

exports.STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
};

// For testing. Limit the max results for safety.
exports.getAllBookings = async function () {
  try {
    const bookings = await Booking.find().limit(200).exec();
    winston.info(`Found ${bookings.length} bookings.`);
    return { bookings };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

exports.getBookingById = async function (bookingId) {
  try {
    const booking = await Booking.findById(bookingId);
    winston.info(`Booking for ID: ${bookingId} - ${booking}`);
    return { booking };
  } catch (err) {
    winston.log("error", err);
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
exports.addBooking = async function (bookingData, session) {
  let booking = new Booking({
    _id: bookingData._id,
    startAt: bookingData.startAt,
    endAt: bookingData.endAt,
    totalPrice: bookingData.totalPrice,
    days: bookingData.days,
    //createdAt: bookingData.createdAt, // use default
    renter: bookingData.renterId,
    owner: bookingData.ownerId,
    pet: bookingData.petId,
    payment: bookingData.paymentId,
    //status: bookingData.status, // useDefault
  });
  try {
    winston.info("BookingService. addBooking" + booking);
    await booking.save(session);
    return { booking };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

exports.getBookingsForOwner = async function (ownerId) {
  try {
    const bookings = await Booking.find({ owner: ownerId })
      .populate("pet")
      .populate("payment")
      .exec();
    winston.info(
      `BookingService. Found ${bookings.length} bookings for owner - ${ownerId}`
    );
    return { bookings };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

exports.getBookingsForRenter = async function (renterId) {
  try {
    const bookings = await Booking.find({ renter: renterId })
      .populate("pet")
      .exec();
    winston.info(
      `BookingService. Found ${bookings.length} bookings for renter - ${renterId}`
    );
    return { bookings };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

exports.getBookingsForPet = async function (petId) {
  try {
    const bookings = await Booking.find({ pet: petId }).lean().exec();
    winston.info(
      `BookingService. Found ${bookings.length} bookings for pet - ${petId}`
    );
    return { bookings };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

//  enum: ["PENDING", "ACTIVE", "CANCELLED"],
exports.updateBookingStatus = async function (bookingId, status, session) {
  try {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: status,
      },
      {
        new: true,
        session,
      }
    ).exec();
    return { booking };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

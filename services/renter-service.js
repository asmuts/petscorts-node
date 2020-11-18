const Joi = require("joi");
const winston = require("winston");
const Renter = require("./models/renter");
const Booking = require("./models/booking");

// for testing only. Limited to 200 reults
exports.getAllRenters = async function () {
  const renters = await Renter.find().limit(200).exec();
  winston.debug(`Found ${renters.length} renters.`);
  return renters;
};

exports.getRenterById = async function (renterId) {
  const renter = await Renter.findById(renterId);
  winston.debug(`Renter for ID: ${renterId} - ${renter}`);
  return renter;
};

exports.getRenterByEmail = async function (email) {
  try {
    const renter = await Renter.findOne({ email }).exec();
    winston.info(`RenterService. Renter for email: ${email} - ${renter}`);
    return { renter };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

exports.getRenterByAuth0Sub = async function (auth0_sub) {
  try {
    const renter = await Renter.findOne({ auth0_sub }).exec();
    winston.info(`RenterService. by auth0_sub: ${auth0_sub} - ${renter}`);
    return { renter };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

//////////////////////////////////////////////////////////

exports.addRenter = async function (renterData) {
  let renter = new Renter({
    username: renterData.username,
    fullname: renterData.fullname,
    email: renterData.email,
    auth0_sub: renterData.auth0_sub,
  });
  await renter.save();
  return renter._id;
};

// if the caller has the entire renter record
// just use the standard update
exports.updateSwipeCustomerId = async function (
  renterId,
  swipeCustomerId,
  session
) {
  try {
    const renter = await Renter.findByIdAndUpdate(
      renterId,
      {
        stripeCustomerId: swipeCustomerId,
      },
      {
        new: true,
        session,
      }
    ).exec();
    return { renter };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

exports.addBookingToRenter = async function (renterId, bookingId, session) {
  try {
    let booking = new Booking({
      _id: bookingId,
    });
    const renter = await Renter.findByIdAndUpdate(
      renterId,
      { $push: { bookings: booking } },
      { session, new: true }
    ).exec();
    return { renter };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// Crude tally
exports.addToRevenue = async function (renterId, amount) {
  Renter.update({ _id: renterId }, { $inc: { revenue: amount } });
};

// TODO: if email has changed, check uniqueness
// TODO distinguish between put and patch
exports.updateRenter = async function (renterData) {
  let renter = {
    username: renterData.username,
    fullname: renterData.fullname,
    email: renterData.email,
    auth0_sub: renterData.auth0_sub,
  };
  const result = await Renter.findByIdAndUpdate(renterData.renterId, renter, {
    new: true,
  }).exec();
  winston.debug("Updated renter " + result);
  return result;
};

exports.deleteRenter = async function (renterId) {
  winston.info(`Deleting renter id: ${renterId}`);
  const renter = await Renter.findByIdAndRemove(renterId);
  return renter;
};

////////////////////////////////////////////////////
exports.validateRenter = function (renter) {
  const schema = Joi.object({
    renterId: Joi.string().optional(),
    username: Joi.string().required().min(5).max(32),
    fullname: Joi.string().required().min(5).max(100),
    email: Joi.string().email().required(),
    auth0_sub: Joi.string().required().min(5).max(128),
  });
  return schema.validate(renter);
};

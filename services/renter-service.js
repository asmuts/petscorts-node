const Joi = require("joi");
const winston = require("winston");
const Renter = require("./models/renter");

// for testing only. Limited to 200 reults
exports.getAllOwnwers = async function () {
  const renters = await Renter.find().limit(200).exec();
  winston.info(`Found ${renters.length} renters.`);
  return renters;
};

exports.getRenterById = async function (renterId) {
  const renter = await Renter.findById(renterId);
  winston.debug(`Renter for ID: ${renterId} - ${renter}`);
  return renter;
};

exports.getRenterByEmail = async function (email) {
  const renter = await Renter.findOne({ email }).exec();
  winston.debug(`Found renter for email: ${email} - ${renter}`);
  return renter;
};

exports.addRenter = async function (renterData) {
  let renter = new Renter({
    username: renterData.username,
    fullname: renterData.fullname,
    email: renterData.email,
  });
  await renter.save();
  return renter._id;
};

// TODO: if email has changed, check uniqueness
exports.updateRenter = async function (renterData) {
  let renter = {
    username: renterData.username,
    fullname: renterData.fullname,
    email: renterData.email,
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

exports.validateRenter = function (renter) {
  const schema = Joi.object({
    renterId: Joi.string().optional(),
    username: Joi.string().required().min(5).max(32),
    fullname: Joi.string().required().min(5).max(100),
    email: Joi.string().email().required(),
  });
  return schema.validate(renter);
};

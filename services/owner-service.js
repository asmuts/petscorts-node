const Joi = require("joi");
const winston = require("winston");
const Owner = require("./models/owner");
const mongoose = require("mongoose");

// For testing. Limit the max results for safety.
exports.getAllOwnwers = async function () {
  const owners = await Owner.find().limit(200).exec();
  winston.debug(`Found ${owners.length} owners.`);
  return owners;
};

exports.getOwnerById = async function (ownerId) {
  const owner = await Owner.findById(ownerId);
  winston.debug(`Owner for ID: ${ownerId} - ${owner}`);
  return owner;
};

exports.getOwnerByEmail = async function (email) {
  const owner = await Owner.findOne({ email }).exec();
  winston.debug(`Found owner for email: ${email} - ${owner}`);
  return owner;
};

exports.addOwner = async function (ownerData) {
  let owner = new Owner({
    username: ownerData.username,
    fullname: ownerData.fullname,
    email: ownerData.email,
  });
  await owner.save();
  return owner._id;
};

exports.removePetFromOwner = async function (ownerId, petId) {
  const owner = await Owner.findById(ownerId);
  const index = owner.pets.indexOf(petId);
  if (index > -1) {
    owner.pets.splice(index, 1);
    winston.debug(`Removing pet from owner ${petId}`);
    owner.save();
  } else {
    winston.info(`No such pet to remove from owner: ${petId}`);
  }
};

exports.addPetToOwner = async function (ownerId, petId) {
  const owner = await Owner.findById(ownerId);
  owner.pets.push(petId);
  winston.debug(`Adding pet to owner ${petId}`);
  owner.save();
};

exports.updateOwner = async function (ownerData) {
  let owner = {
    username: ownerData.username,
    fullname: ownerData.fullname,
    email: ownerData.email,
  };
  const result = await Owner.findByIdAndUpdate(ownerData.ownerId, owner, {
    new: true,
  }).exec();
  winston.debug("Updated owner " + result);
  return result;
};

exports.deleteOwner = async function (ownerId) {
  winston.info(`Deleting owner id: ${ownerId}`);
  const owner = await Owner.findByIdAndRemove(ownerId);
  return owner;
};

exports.validateOwner = function (owner) {
  const schema = Joi.object({
    ownerId: Joi.string().optional(),
    username: Joi.string().required().min(5),
    fullname: Joi.string().required().min(5),
    email: Joi.string().email().required(),
  });
  return schema.validate(owner);
};

// This is now done in middleware.
exports.validateID = function (id) {
  return mongoose.Types.ObjectId.isValid(id);
};

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

// Uniqueness from Auth) can't be garuanteed by email from Auth0
// unless email is verified. Someone could fake another user by signing
// up via username and password with someone elsel's password.
// Auth0's sub is unique. Use it for authentication matching.
// It's also on the JWT, so I can authorize with it as well.
exports.getOwnerByAuth0Sub = async function (auth0_sub) {
  const owner = await Owner.findOne({ auth0_sub }).exec();
  winston.info(`Found owner for auth0_sub: ${auth0_sub} - ${auth0_sub}`);
  return owner;
};

exports.addOwner = async function (ownerData) {
  let owner = new Owner({
    username: ownerData.username,
    fullname: ownerData.fullname,
    email: ownerData.email,
    auth0_sub: ownerData.auth0_sub,
  });
  await owner.save();
  return owner._id;
};

exports.removePetFromOwner = async function (ownerId, petId) {
  const owner = await Owner.findById(ownerId);

  // mondg ids are objects, they can't be compared to strings with ===
  const found = owner.pets.find((pet) => pet._id.equals(petId));
  winston.info("Pet " + found);

  if (found) {
    owner.pets.pull({ _id: petId });
    winston.debug(`Removing pet from owner ${petId}`);
    owner.save();
  } else {
    winston.info(`No such pet to remove from owner: ${petId}`);
  }
  return owner;
};

exports.addPetToOwner = async function (ownerId, petId) {
  const owner = await Owner.findById(ownerId);
  owner.pets.push(petId);
  winston.debug(`Adding pet to owner ${petId}`);
  owner.save();
  return owner;
};

// TODO distinguish between put and patch
exports.updateOwner = async function (ownerData) {
  let owner = {
    username: ownerData.username,
    fullname: ownerData.fullname,
    email: ownerData.email,
    auth0_sub: ownerData.auth0_sub,
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
    auth0_sub: Joi.string().optional(),
  });
  // TODO make sub required after cleaning up the db
  return schema.validate(owner);
};

// This is now done in middleware.
exports.validateID = function (id) {
  return mongoose.Types.ObjectId.isValid(id);
};

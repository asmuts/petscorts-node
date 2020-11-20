const Joi = require("joi");
const winston = require("winston");
const Owner = require("./models/owner");
const mongoose = require("mongoose");

const Cache = require("./util/cache");

const ownerIdCache = new Cache({
  stdTTL: 60 * 60 * 6, // 6 hours
  checkperiod: 3600,
  maxKeys: 10000,
});

// For testing. Limit the max results for safety.
// prod block mw on route
exports.getAllOwners = async function () {
  try {
    const owners = await Owner.find().limit(200).exec();
    winston.debug(`OwnerService. Found ${owners.length} owners.`);
    return { owners };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// null if not found. The controller will return a 404
exports.getOwnerById = async function (ownerId) {
  try {
    const owner = await Owner.findById(ownerId);
    winston.debug(`OwnerService. Owner for ID: ${ownerId} - ${owner}`);
    return { owner };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

exports.getOwnerByIdWithPets = async function (ownerId) {
  try {
    const owner = await Owner.findById(ownerId).populate("pets").exec();
    winston.debug(`OwnerService. Owner for ID: ${ownerId} - ${owner}`);
    return { owner };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

exports.getOwnerByEmail = async function (email) {
  try {
    const owner = await Owner.findOne({ email: email }).exec();
    winston.debug(`OwnerService. owner for email: ${email} - ${owner}`);
    return { owner };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// This is called frequently for authorization. Cache.
// This data will never change.
exports.getOwnerIdForAuth0Sub = async function (auth0_sub) {
  const key = "idForSub:" + auth0_sub;
  let ownerId = ownerIdCache.get(key);
  if (ownerId) {
    //winston.info("Cache hit for sub");
    return { ownerId };
  }
  try {
    const { owner, err } = await this.getOwnerByAuth0Sub(auth0_sub);
    if (err) {
      return { err };
    }
    if (owner) {
      //winston.info("adding id to cache");
      const stringId = owner._id.toString();
      ownerIdCache.put(key, stringId);
      return { ownerId: stringId };
    }
    return {};
  } catch (err) {
    //winston.log("error", err.message);
    return { err: err.message };
  }
};

// Uniqueness from Auth) can't be garuanteed by email from Auth0
// unless email is verified. Someone could fake another user by signing
// up via username and password with someone elsel's password.
// Auth0's sub is unique. Use it for authentication matching.
// It's also on the JWT, so I can authorize with it as well.
exports.getOwnerByAuth0Sub = async function (auth0_sub) {
  try {
    const owner = await Owner.findOne({ auth0_sub: auth0_sub }).exec();
    winston.info(`OwnerService. owner for auth0_sub: ${auth0_sub} - ${owner}`);
    return { owner };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// Making this the default for the api
// can delete the non populated or make another route to it
// if it is userful.
exports.getOwnerByAuth0SubWithPets = async function (auth0_sub) {
  try {
    const owner = await Owner.findOne({ auth0_sub }).populate("pets").exec();
    if (owner) {
      winston.info(
        `OwnerService. owner for auth0_sub with pets: ${auth0_sub} - ${owner._id}`
      );
    }
    return { owner };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

///////////////////////////////////////////////////////////////
// WRITE METHODS

// Create called after first login
exports.addOwner = async function (ownerData) {
  try {
    let owner = new Owner({
      username: ownerData.username,
      fullname: ownerData.fullname,
      email: ownerData.email,
      auth0_sub: ownerData.auth0_sub,
    });
    await owner.save();
    return { owner };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// Return error is pet is not found.
// Problem: the caller will think this is a 500 and not a 422
// TODO consider returning the image and not the owner
// A null would indicate no image???
exports.removePetFromOwner = async function (ownerId, petId) {
  try {
    const owner = await Owner.findById(ownerId);

    // mondg ids are objects, they can't be compared to strings with ===
    const found = owner.pets.find((pet) => pet._id.equals(petId));
    if (found) {
      owner.pets.pull({ _id: petId });
      winston.info(`Removing pet from owner ${petId}`);
      await owner.save();
    } else {
      throw new Error(`No such pet to remove from owner: ${petId}`);
    }
    return { owner };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// Push the pet reference into the list of pets
exports.addPetToOwner = async function (ownerId, petId) {
  try {
    const owner = await Owner.findByIdAndUpdate(
      ownerId,
      { $push: { pets: petId } },
      { new: true }
    ).exec();
    winston.info(`Adding pet to owner ${petId}`);
    return { owner };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// TODO distinguish between put and patch
exports.updateOwner = async function (ownerData) {
  try {
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
    return { owner: result };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

exports.deleteOwner = async function (ownerId) {
  try {
    winston.info(`Deleting owner id: ${ownerId}`);
    const owner = await Owner.findByIdAndRemove(ownerId);
    return { owner };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

///////////////////////////////////////////////////////////////

exports.validateOwner = function (owner) {
  const schema = Joi.object({
    ownerId: Joi.string().optional(),
    username: Joi.string().required().min(5),
    fullname: Joi.string().required().min(5).max(128),
    email: Joi.string().email().required(),
    auth0_sub: Joi.string().required().max(128),
  });
  // TODO make sub required after cleaning up the db
  return schema.validate(owner);
};

// This is now done in middleware.
exports.validateID = function (id) {
  return mongoose.Types.ObjectId.isValid(id);
};

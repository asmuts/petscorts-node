const Joi = require("joi");
const winston = require("winston");
const Pet = require("../services/models/pet");

exports.STATUS = {
  ACTIVE: "ACTIVE",
  HIDDEN: "HIDDEN",
  ARCHIVED: "ARCHIVED",
};

// here for testing purposes.
exports.getAllPets = async function () {
  const pets = await Pet.find().limit(200).exec();
  winston.info(`PetService. Found ${pets.length} pets.`);
  return pets;
};

// I added a populatePets method to the owner service
// This here will be for testing mainly
// The petids are included in the owner record.
exports.getPetsForOwner = async function (ownerId) {
  const pets = await Pet.find({ owner: ownerId }).limit(200).exec();
  winston.info(`PetService. Found ${pets.length} pets for owner ${ownerId}`);
  return pets;
};

exports.getPetById = async function (petId) {
  try {
    const pet = await Pet.findById(petId).exec();
    winston.debug(`PetService. Found pet for ID: ${petId} - ${pet}`);
    return { pet };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// Changed the datamodel so that populate will work
exports.getPetByIdWithOwnerAndBookings = async function (petId) {
  try {
    const pet = await Pet.findById(petId)
      .populate("bookings")
      .populate("owner")
      .exec();
    winston.info(`PetService. Found pet for ID: ${petId} - ${pet}`);
    return { pet };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

// simple search by lowercase city and state code
exports.getPetsInCityAndState = async function (city, state) {
  let pets = [];
  if (city && state) {
    const query = {
      city: city.toLowerCase(),
      state: state.toUpperCase(),
      status: { $nin: ["ARCHIVED", "HIDDEN"] },
    };
    pets = await Pet.find(query).limit(1000).lean().exec();
    winston.info(
      `PetService. Found ${pets.length} pets in city ${city} state ${state}.`
    );
  }
  return pets;
};

exports.getPetsNearLocation = async function (
  latitude,
  longitude,
  maxDistanceMeters
) {
  //**** MONGO 2dsphere store lng|lat NOT lat|lng !!! */
  let pets = await Pet.find({
    location: {
      $near: {
        $maxDistance: maxDistanceMeters,
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },
    },
    status: { $nin: ["ARCHIVED", "HIDDEN"] },
  })
    .lean()
    .exec();
  winston.info("PetService. Found " + pets.length + " for location");
  return pets;
};

//--------------------------------------
//       WRITE METHODS

exports.addPet = async function (petData) {
  let pet = new Pet({
    name: petData.name,
    city: petData.city,
    street: petData.street,
    state: petData.state,
    species: petData.species,
    breed: petData.breed,
    description: petData.description,
    dailyRentalRate: petData.dailyRentalRate,
    owner: petData.ownerId,
    location: { type: "Point", coordinates: [petData.lng, petData.lat] },
  });
  //**** MONGO 2dsphere store lng|lat NOT lat|lng */
  try {
    winston.info(`PetService. About to save pet: ${pet}`);
    await pet.save();
    return { pet };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

exports.addImageToPet = async function (petId, imageUrl) {
  try {
    const pet = await Pet.findById(petId);
    if (!pet) throw new Error("Couldn't find pet for id " + petId);

    pet.images.push({ url: imageUrl });
    winston.info(`PetService. Adding image to pet ${petId}`);
    await pet.save();
    return { pet };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

// Return the image so we can use it to delete it from S3
exports.removeImageFromPet = async function (petId, imageId) {
  try {
    const pet = await Pet.findById(petId);
    if (!pet) throw new Error("PetService. Couldn't find pet for id " + petId);

    winston.info(pet);
    // mongo ids are objects, they can't be compared to strings with ===
    const found = pet.images.find((image) => image._id.equals(imageId));

    // mongoose can do this for me, cool
    pet.images.pull({ _id: imageId });
    await pet.save();
    winston.info(`PetService. Removed image ${imageId} from pet ${petId}`);

    return { pet, image: found };
  } catch (err) {
    winston.log("error", "PetService. " + err.message);
    return { err: err.message };
  }
};

// This method does not find coordinates for addresses.
// That's the reponsiblity of the caller.
exports.updatePet = async function (petData) {
  let pet = {
    name: petData.name,
    city: petData.city,
    street: petData.street,
    state: petData.state,
    species: petData.species,
    breed: petData.breed,
    description: petData.description,
    dailyRentalRate: petData.dailyRentalRate,
    owner: petData.ownerId,
    location: { type: "Point", coordinates: [petData.lng, petData.lat] },
  };
  //**** MONGO 2dsphere store lng|lat NOT lat|lng */
  try {
    const result = await Pet.findByIdAndUpdate(petData.petId, pet, {
      new: true,
    }).exec();
    winston.info("PetService. Updated Pet " + result);
    return { pet: result };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

exports.addBookingToPet = async function (petId, bookingId, session) {
  try {
    const pet = await Pet.findByIdAndUpdate(
      petId,
      { $push: { bookings: { _id: bookingId } } },
      { session, new: true }
    ).exec();
    return { pet };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

exports.removeBookingFromPet = async function (petId, bookingId, session) {
  try {
    const pet = await Pet.findById(petId);
    if (pet) {
      pet.bookings.pull(bookingId);
      await pet.save(session);
    } else {
      winston.info(
        "PetService. removeBookingFromPet. No pet found for id " + petId
      );
    }
    return { pet };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

// A soft delete of a pet.  These will be filtered out of search results.
// TODO make a method to revive
exports.archivePet = async function (petId) {
  winston.info(`PetService. Archiving Pet - id: ${petId}`);
  return await updatePetStatus(petId, this.STATUS.ARCHIVED);
};

exports.activatePet = async function (petId) {
  winston.info(`PetService. Archiving Pet - id: ${petId}`);
  return await updatePetStatus(petId, this.STATUS.ACTIVE);
};

const updatePetStatus = async (petId, newStatus) => {
  try {
    const pet = await Pet.findByIdAndUpdate(
      petId,
      {
        status: newStatus,
      },
      {
        new: true,
        useFindAndModify: false,
      }
    ).exec();
    winston.info("pet = " + pet);
    return { pet };
  } catch (err) {
    winston.log("error", err.message);
    return { err: err.message };
  }
};

exports.deletePet = async function (petId) {
  try {
    winston.info(`PetService. Deleting Pet - id: ${petId}`);
    const pet = await Pet.findByIdAndRemove(petId, { useFindAndModify: false });
    return { pet };
  } catch (err) {
    winston.log("error", err);
    return { err: err.message };
  }
};

exports.validatePet = function (pet) {
  // the petId is not stored in mongo
  const schema = Joi.object({
    petId: Joi.string().optional(),
    name: Joi.string().required().min(3),
    city: Joi.string().required().min(3),
    street: Joi.string().required().min(3),
    state: Joi.string().required().min(2).max(2),
    species: Joi.string().required().min(3),
    breed: Joi.string().optional().min(3),
    description: Joi.string().required().min(3),
    dailyRentalRate: Joi.number().required().min(0),
    ownerId: Joi.objectId().required(),
    lat: Joi.string().optional,
    lng: Joi.string().optional,
  });
  return schema.validate(pet);
};

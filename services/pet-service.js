const Joi = require("joi");
const winston = require("winston");
const Pet = require("../services/models/pet");

// here for testing purposes.
exports.getAllPets = async function () {
  const pets = await Pet.find().limit(200).exec();
  winston.debug(`Found ${pets.length} pets.`);
  return pets;
};

// simple search by lowercase city
exports.getPetsInCityAndState = async function (city, state) {
  let pets = [];
  if (city && state) {
    const query = { city: city.toLowerCase(), state: state.toUpperCase() };
    pets = await Pet.find(query).limit(1000).exec();
    winston.info(`Found ${pets.length} pets in city ${city} state ${state}.`);
  }
  return pets;
};

exports.getPetsNearLocation = async function (
  latitude,
  longitude,
  maxDistanceMeters
) {
  winston.debug("getPetsNearLocation");

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
  }).exec();
  winston.info("Found " + pets.length + " for location");
  return pets;
};

exports.getPetById = async function (petId) {
  const pet = await Pet.findById(petId).exec();
  winston.debug(`Found pet for ID: ${petId} - ${pet}`);
  return pet;
};

//--------------------------------------
//       WRITE METHODS

exports.addPet = async function (petData) {
  let pet = new Pet({
    name: petData.name,
    city: petData.city,
    street: petData.street,
    street: petData.street,
    state: petData.state,
    species: petData.species,
    breed: petData.breed,
    description: petData.description,
    dailyRentalRate: petData.dailyRentalRate,
    owner: {
      _id: petData.ownerId,
      fullname: petData.ownerName,
    },
    location: { type: "Point", coordinates: [petData.lng, petData.lat] },
  });
  //**** MONGO 2dsphere store lng|lat NOT lat|lng */
  winston.debug(`About to save pet: ${pet}`);
  await pet.save();
  return pet._id;
};

exports.addImageToPet = async function (petId, imageUrl) {
  const pet = await Pet.findById(petId);
  pet.images.push({ url: imageUrl });
  winston.info(`Adding image to pet ${petId}`);
  pet.save();
};

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
    owner: {
      _id: petData.ownerId,
      fullname: petData.ownerName,
    },
    location: { type: "Point", coordinates: [petData.lng, petData.lat] },
  };
  //**** MONGO 2dsphere store lng|lat NOT lat|lng */
  const result = await Pet.findByIdAndUpdate(petData.petId, pet, {
    new: true,
  }).exec();
  winston.debug("Updated Pet " + result);
  return result;
};

exports.deletePet = async function (renterId) {
  winston.info(`Deleting Pet - id: ${renterId}`);
  const pet = await Pet.findByIdAndRemove(renterId);
  return pet;
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
    breed: Joi.string().required().min(3),
    description: Joi.string().required().min(3),
    dailyRentalRate: Joi.number().required().min(0),
    ownerId: Joi.objectId().required(),
    lat: Joi.string().optional,
    lng: Joi.string().optional,
  });
  return schema.validate(pet);
};

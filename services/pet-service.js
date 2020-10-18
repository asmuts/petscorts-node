const Joi = require("joi");
const winston = require("winston");
const Pet = require("../services/models/pet");

exports.getAllPets = async function () {
  const pets = await Pet.find().exec();
  winston.debug(`Found ${pets.length} pets.`);
  return pets;
};

exports.getPetById = async function (petId) {
  const pet = await Pet.findById(petId).exec();
  winston.debug(`Found pet for ID: ${petId} - ${pet}`);
  return pet;
};

exports.addPet = async function (petData) {
  let pet = new Pet({
    name: petData.name,
    city: petData.city,
    street: petData.street,
    species: petData.species,
    breed: petData.breed,
    description: petData.description,
    dailyRentalRate: petData.dailyRentalRate,
    owner: {
      _id: petData.ownerId,
      fullname: petData.ownerName,
    },
  });
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

exports.validatePet = function (pet) {
  const schema = Joi.object({
    name: Joi.string().required().min(3),
    city: Joi.string().required().min(3),
    street: Joi.string().required().min(3),
    species: Joi.string().required().min(3),
    breed: Joi.string().required().min(3),
    description: Joi.string().required().min(3),
    dailyRentalRate: Joi.number().required().min(0),
    ownerId: Joi.objectId().required(),
  });
  return schema.validate(pet);
};

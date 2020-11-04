const Joi = require("joi");
const winston = require("winston");
const Pet = require("../services/models/pet");

// here for testing purposes.
exports.getAllPets = async function () {
  const pets = await Pet.find().limit(200).exec();
  winston.info(`Found ${pets.length} pets.`);
  return pets;
};

// TODO add a populatePets method to the owner service
// this will be for testing mainly
// the petids are included in the owner record.
// use a query with multiple ids instead
// model.find({
//   'owner$id': { $in: [
//       mongoose.Types.ObjectId('4ed3ede8844f0f351100000c'),
//       mongoose.Types.ObjectId('4ed3f117a844e0471100000d'),
//       mongoose.Types.ObjectId('4ed3f18132f50c491100000e')
//   ]}
// }
exports.getPetsForOwner = async function (ownerId) {
  const pets = await Pet.find({ "owner._id": ownerId }).limit(200).exec();
  winston.info(`Found ${pets.length} pets for owner ${ownerId}`);
  return pets;
};

exports.getPetById = async function (petId) {
  const pet = await Pet.findById(petId).exec();
  winston.debug(`Found pet for ID: ${petId} - ${pet}`);
  return pet;
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
    owner: {
      _id: petData.ownerId,
      fullname: petData.ownerName,
    },
    location: { type: "Point", coordinates: [petData.lng, petData.lat] },
  });
  //**** MONGO 2dsphere store lng|lat NOT lat|lng */
  winston.info(`About to save pet: ${pet}`);
  await pet.save();
  return pet._id;
};

exports.addImageToPet = async function (petId, imageUrl) {
  const pet = await Pet.findById(petId);
  pet.images.push({ url: imageUrl });
  winston.info(`Adding image to pet ${petId}`);
  pet.save();
  return pet;
};

// Return the image so we can use it to delete it from S3
exports.removeImageFromPet = async function (petId, imageId) {
  const pet = await Pet.findById(petId);

  // mondg ids are objects, they can't be compared to strings with ===
  const found = pet.images.find((image) => image._id.equals(imageId));
  winston.info("Image " + found);

  //  mongoose can do this for me, cool
  pet.images.pull({ _id: imageId });
  winston.info(`Removing image ${imageId} from pet ${petId}`);
  pet.save();

  return found;
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
    breed: Joi.string().optional().min(3),
    description: Joi.string().required().min(3),
    dailyRentalRate: Joi.number().required().min(0),
    ownerId: Joi.objectId().required(),
    lat: Joi.string().optional,
    lng: Joi.string().optional,
  });
  return schema.validate(pet);
};

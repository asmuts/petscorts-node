const winston = require("winston");
const petService = require("../services/pet-service");
const ownerService = require("../services/owner-service");
const errorUtil = require("./util/error-util");

exports.getAll = async function (req, res) {
  const pets = await petService.getAllPets();
  res.json(pets);
};

exports.getPetById = async function (req, res) {
  const petId = req.params.id;
  const pet = await petService.getPetById(petId);

  if (!pet)
    return errorUtil.errorRes(res, 422, "Pet Error", `No pet for id ${petId}`);

  res.json(pet);
};

exports.addPet = async function (req, res) {
  const petData = getPetDataFromRequest(req);
  const { error } = petService.validatePet(petData);
  if (error)
    return errorUtil.errorRes(res, 400, "Pet error", error.details[0].message);

  const ownerId = req.body.ownerId;
  const owner = await ownerService.getOwnerById(ownerId);
  if (!owner) {
    winston.info(`Couldn't find owner for id: ${ownerId}`);
    return errorUtil.errorRes(res, 400, "Invalid owner", ownerId);
  }
  petData.ownerName = owner.fullname;

  const newPetId = await petService.addPet(petData);
  winston.debug(`Added new pet: ${newPetId}`);

  ownerService.addPetToOwner(ownerId, newPetId);

  res.json({ petId: newPetId });
};

function getPetDataFromRequest(req) {
  return {
    name: req.body.name,
    city: req.body.city,
    street: req.body.street,
    species: req.body.species,
    breed: req.body.breed,
    description: req.body.description,
    dailyRentalRate: req.body.dailyRentalRate,
    ownerId: req.body.ownerId,
  };
}

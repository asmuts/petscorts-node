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
  return await updateOrAddPet(req, res);
};

// Note: Might want to seperate the owner update.
exports.updatePet = async function (req, res) {
  return await updateOrAddPet(req, res);
};

async function updateOrAddPet(req, res) {
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

  if (petData.petId) {
    const result = await petService.updatePet(petData);
    res.json(result);
  } else {
    return await addPetAndAssociateOwner(res, petData);
  }
}

async function addPetAndAssociateOwner(res, petData) {
  const newPetId = await petService.addPet(petData);
  winston.debug(`Added new pet: ${newPetId}`);

  await ownerService.addPetToOwner(petData.ownerId, newPetId);
  res.json({ petId: newPetId });
}

exports.deletePet = async function (req, res) {
  const petData = getPetDataFromRequest(req);
  const pet = await petService.deleteOwner(petData.ownerId);
  if (!pet) return returnNotFoundError(res, petData.ownerId);

  res.json(pet);
};

function getPetDataFromRequest(req) {
  let pet = {
    name: req.body.name,
    city: req.body.city,
    street: req.body.street,
    species: req.body.species,
    breed: req.body.breed,
    description: req.body.description,
    dailyRentalRate: req.body.dailyRentalRate,
    ownerId: req.body.ownerId,
  };

  if (req.params.id) {
    pet.petId = req.params.id;
  }
  return pet;
}

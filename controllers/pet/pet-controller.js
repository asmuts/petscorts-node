const winston = require("winston");
const petService = require("../../services/pet-service");
const ownerService = require("../../services/owner-service");
const geoLocationService = require("../../services/location/geo-location-service");
const errorUtil = require("../util/error-util");
const { getPetDataFromRequest } = require("./util/pet-data-util");

require("request").debug = true;

//--------------------------------------------
//                WRITE METHODS
// If this were a real site, I'd move all the write
// methods into a seperate Node.js app. They'd slow down
// the normal site otherwise.

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
  if (error) {
    winston.info("req.body.name = " + req.body.name);
    winston.info("Error with petData: " + petData);
    return errorUtil.errorRes(res, 400, "Pet error", error.details[0].message);
  }

  const ownerId = req.body.ownerId;
  const owner = await ownerService.getOwnerById(ownerId);
  if (!owner) {
    winston.info(`Couldn't find owner for id: ${ownerId}`);
    return errorUtil.errorRes(res, 400, "Invalid owner", ownerId);
  }
  petData.ownerName = owner.fullname;

  // I might have to get the geocode before insert
  // since the field is indexed.
  await addGeolocationToPetData(petData);

  let result = {};
  if (petData.petId) {
    result = await petService.updatePet(petData);
  } else {
    result = await addPetAndAssociateOwner(petData);
  }

  return res.json(result);
}

async function addPetAndAssociateOwner(petData) {
  const newPetId = await petService.addPet(petData);
  winston.debug(`Added new pet: ${newPetId}`);

  await ownerService.addPetToOwner(petData.ownerId, newPetId);
  // TODO don't deal with the response.
  // just add the petId to the petData
  return { petId: newPetId };
}

async function addGeolocationToPetData(petData) {
  const latLng = await geoLocationService.getGeoLocationForAddress(
    petData.street,
    petData.city,
    petData.state
  );

  if (latLng) {
    petData.lat = latLng.lat;
    petData.lng = latLng.lng;
  }
}

exports.deletePet = async function (req, res) {
  const petData = getPetDataFromRequest(req);
  const pet = await petService.deletePet(petData.ownerId);
  if (!pet) return returnNotFoundError(res, petData.ownerId);

  res.json(pet);
};

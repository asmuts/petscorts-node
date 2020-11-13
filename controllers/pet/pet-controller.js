const winston = require("winston");
const petService = require("../../services/pet-service");
const ownerService = require("../../services/owner-service");
const geoLocationService = require("../../services/location/geo-location-service");
const { removeImageFromS3 } = require("../../services/image-upload-service-s3");
const errorUtil = require("../util/error-util");
const jsu = require("../util/json-style-util");
const { getPetDataFromRequest } = require("./util/pet-data-util");

//require("request").debug = true;

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
  let { error } = petService.validatePet(petData);
  if (error) {
    //winston.info("req.body.name = " + req.body.name);
    winston.info("PetController. Error with petData: " + petData);
    return errorUtil.errorRes(res, 400, "Pet error", error.details[0].message);
  }

  const ownerId = req.body.ownerId;
  const owner = await ownerService.getOwnerById(ownerId);
  if (!owner) {
    winston.info(`Couldn't find owner for id: ${ownerId}`);
    return errorUtil.errorRes(res, 400, "Invalid owner", ownerId);
  }

  // I might have to get the geocode before insert
  // since the field is indexed.
  await addGeolocationToPetData(petData);

  let result;
  if (petData.petId) {
    let { pet, err } = await petService.updatePet(petData);
    result = pet;
    error = err;
  } else {
    let { pet, err } = await addPetAndAssociateOwner(petData);
    result = pet;
    error = err;
  }

  if (error)
    errorUtil.errorRes(res, 422, "Pet error", error.details[0].message);
  return res.json(jsu.payload(result));
}

async function addPetAndAssociateOwner(petData) {
  const { pet, err } = await petService.addPet(petData);
  if (err) return { err };
  if (pet) {
    const newPetId = pet._id;
    winston.info(`Added new pet: ${newPetId}`);

    await ownerService.addPetToOwner(petData.ownerId, newPetId);
    return { pet };
  }
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

// hard delete
exports.deletePet = async function (req, res) {
  const petData = getPetDataFromRequest(req);
  const pet = await petService.deletePet(petData.ownerId);
  if (!pet) return returnNotFoundError(res, petData.ownerId);

  return res.json(jsu.payload(pet));
};

// soft delete
exports.archivePet = async function (req, res) {
  const petData = getPetDataFromRequest(req);
  let { pet, err } = await petService.archivePet(petData.petId);
  if (err) {
    return errorUtil.errorRes(res, 422, "Pet error", err);
  }
  if (!pet) return returnNotFoundError(res, petData.petId);
  return res.json(jsu.payload(pet));
};

exports.removeImageFromPet = async function (req, res) {
  const petData = getPetDataFromRequest(req);
  const imageId = req.params.imageId;
  // TODO error handling for params
  // TODO figure out how to remove items from S3
  // as of now, they'll just sit there.
  const removedImage = await petService.removeImageFromPet(
    petData.petId,
    imageId
  );

  if (removedImage && removedImage.url) {
    const url = removedImage.url;
    // don't inlude the /
    const fileName = url.substring(url.lastIndexOf("/") + 1, [url.length]);
    removeImageFromS3(fileName);
  }
  res.json(removedImage);
};

function returnNotFoundError(res, petId) {
  return errorUtil.errorRes(res, 404, "Pet Error", `No pet for id ${petId}`);
}

const winston = require("winston");
const ownerService = require("../services/owner-service");
const errorUtil = require("./util/error-util");

exports.getAllOwners = async function (req, res) {
  const owners = await ownerService.getAllOwnwers();
  res.json(owners);
};

exports.getOwnerById = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  const isValid = ownerService.validateID(ownerData.ownerId);
  if (!isValid) return returnNotFoundError(res, ownerData.ownerId);

  const owner = await ownerService.getOwnerById(ownerData.ownerId);
  if (!owner) return returnNotFoundError(res, ownerData.ownerId);

  res.json(owner);
};

exports.addOwner = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  const { error } = ownerService.validateOwner(ownerData);
  if (error)
    return errorUtil.errorRes(
      res,
      400,
      "Owner error",
      error.details[0].message
    );

  const existing = await ownerService.getOwnerByEmail(ownerData.email);
  if (existing) {
    winston.debug("Email in use");
    return errorUtil.errorRes(res, 422, "Owner error", "Email is in use.");
  }

  const newOwnerId = await ownerService.addOwner(ownerData);
  winston.debug(`Added new owner: ${newOwnerId}`);
  res.json({ ownerId: newOwnerId });
};

exports.updateOwner = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  const isValid = ownerService.validateID(ownerData.ownerId);
  if (!isValid) return returnNotFoundError(res, ownerData.ownerId);

  const { error } = ownerService.validateOwner(ownerData);
  const result = await ownerService.updateOwner(ownerData);
  res.json(result);
};

exports.deleteOwner = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  const isValid = ownerService.validateID(ownerData.ownerId);
  if (!isValid) return returnNotFoundError(res, ownerData.ownerId);

  const owner = await ownerService.deleteOwner(ownerData.ownerId);
  if (!owner) return returnNotFoundError(res, ownerData.ownerId);

  res.json(owner);
};

function getOwnerDataFromRequest(req) {
  return {
    ownerId: req.params.id,
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
  };
}

function returnNotFoundError(res, ownerId) {
  return errorUtil.errorRes(
    res,
    404,
    "Owner Error",
    `No owner for id ${ownerId}`
  );
}

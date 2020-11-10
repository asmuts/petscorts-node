const winston = require("winston");
const owner = require("../services/models/owner");
const ownerService = require("../services/owner-service");
const errorUtil = require("./util/error-util");

// for testing.
exports.getAllOwners = async function (req, res) {
  const owners = await ownerService.getAllOwnwers();
  res.json(owners);
};

exports.getOwnerById = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  const owner = await ownerService.getOwnerById(ownerData.ownerId);
  if (!owner) return returnNotFoundError(res, ownerData.ownerId);

  res.json(owner);
};

exports.getOwnerByEmail = async function (req, res) {
  const email = req.params.email;
  const owner = await ownerService.getOwnerByEmail(email);
  if (!owner) return returnNotFoundError(res, email);

  res.json(owner);
};

exports.getOwnerByAuth0Sub = async function (req, res) {
  const auth0_sub = req.params.auth0_sub;
  const owner = await ownerService.getOwnerByAuth0Sub(auth0_sub);
  if (!owner) return returnNotFoundError(res, auth0_sub);

  res.json(owner);
};

exports.addOwner = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  winston.info("addOwner: " + ownerData);
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
    winston.info("Email in use");
    return errorUtil.errorRes(res, 422, "Owner error", "Email is in use.");
  }

  const newOwnerId = await ownerService.addOwner(ownerData);
  winston.info(`Added new owner: ${newOwnerId}`);
  res.json({ ownerId: newOwnerId });
};

exports.updateOwner = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  const { error } = ownerService.validateOwner(ownerData);
  if (error)
    return errorUtil.errorRes(
      res,
      400,
      "Owner error",
      error.details[0].message
    );
  const result = await ownerService.updateOwner(ownerData);
  res.json(result);
};

exports.deleteOwner = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  const owner = await ownerService.deleteOwner(ownerData.ownerId);
  if (!owner) return returnNotFoundError(res, ownerData.ownerId);

  res.json(owner);
};

function getOwnerDataFromRequest(req) {
  let owner = {
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
    auth0_sub: req.body.auth0_sub,
  };

  if (req.params.id) {
    owner.ownerId = req.params.id;
  }
  return owner;
}

function returnNotFoundError(res, ownerId) {
  return errorUtil.errorRes(
    res,
    404,
    "Owner Error",
    `No owner for id ${ownerId}`
  );
}

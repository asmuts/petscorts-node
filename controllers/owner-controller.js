const winston = require("winston");
const owner = require("../services/models/owner");
const ownerService = require("../services/owner-service");
const errorUtil = require("./util/error-util");
const jsu = require("./util/json-style-util");

// This method is merely for testing.
exports.getAllOwners = async function (req, res) {
  const { owners, err } = await ownerService.getAllOwners();
  if (err) return returnOtherError(res, 500, err);
  if (!owners) return returnNotFoundError(res, ownerData.ownerId);
  res.json(jsu.payload(owners));
};

exports.getOwnerById = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  const { owner, err } = await ownerService.getOwnerById(ownerData.ownerId);
  if (err) return returnOtherError(res, 500, err);
  if (!owner) return returnNotFoundError(res, ownerData.ownerId);
  res.json(jsu.payload(owner));
};

exports.getOwnerByIdWithPets = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  const { owner, err } = await ownerService.getOwnerByIdWithPets(
    ownerData.ownerId
  );
  if (err) return returnOtherError(res, 500, err);
  if (!owner) return returnNotFoundError(res, ownerData.ownerId);
  res.json(jsu.payload(owner));
};

exports.getOwnerByEmail = async function (req, res) {
  const email = req.params.email;
  const { owner, err } = await ownerService.getOwnerByEmail(email);
  if (err) return returnOtherError(res, 500, err);
  if (!owner) return returnNotFoundError(res, email);
  res.json(jsu.payload(owner));
};

exports.getOwnerByAuth0Sub = async function (req, res) {
  const auth0_sub = req.params.auth0_sub;
  const { owner, err } = await ownerService.getOwnerByAuth0Sub(auth0_sub);
  if (err) return returnOtherError(res, 500, err);
  if (!owner) return returnNotFoundError(res, auth0_sub);
  res.json(jsu.payload(owner));
};

exports.getOwnerByAuth0SubWithPets = async function (req, res) {
  const auth0_sub = req.params.auth0_sub;
  const { owner, err } = await ownerService.getOwnerByAuth0SubWithPets(
    auth0_sub
  );
  if (err) return returnOtherError(res, 500, err);
  if (!owner) return returnNotFoundError(res, auth0_sub);
  res.json(jsu.payload(owner));
};

////////////////////////////////////////////////////

exports.addOwner = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  winston.info("addOwner: " + ownerData);
  const { error } = ownerService.validateOwner(ownerData);
  if (error) return returnOtherError(res, 400, error.details[0].message);

  const existing = await ownerService.getOwnerByEmail(ownerData.email);
  if (existing) {
    winston.info("Email in use");
    return returnOtherError(res, 422, "Email is in use.");
  }

  const { owner: newOwner, err } = await ownerService.addOwner(ownerData);
  if (err) return returnOtherError(res, 500, err);
  winston.info(`Added new owner: ${newOwner}`);
  res.json(jsu.payload(nweOwner));
};

exports.updateOwner = async function (req, res) {
  const ownerData = getOwnerDataFromRequest(req);
  const { error } = ownerService.validateOwner(ownerData);
  if (error) return returnOtherError(res, 400, error.details[0].message);
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

//////////////////////////////////////////////////////////

function returnNotFoundError(res, ownerId) {
  return errorUtil.errorRes(
    res,
    404,
    "Owner Error",
    `No owner for id ${ownerId}`
  );
}

function returnOtherError(res, code, err) {
  return errorUtil.errorRes(res, code, "Owner Error", err);
}

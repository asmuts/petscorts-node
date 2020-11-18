const winston = require("winston");
const renterService = require("../services/renter-service");
const errorUtil = require("./util/error-util");
const jsu = require("./util/json-style-util");

//for testing, disabled in prod
exports.getAllRenters = async function (req, res) {
  const renters = await renterService.getAllRenters();
  res.json(renters);
};

exports.getRenterById = async function (req, res) {
  const renterId = req.params.id;
  const renter = await renterService.getRenterById(renterId);

  if (!renter)
    return errorUtil.errorRes(
      res,
      422,
      "Renter Error",
      `No renter for id ${renterId}`
    );
  res.json(renter);
};

exports.getRenterByEmail = async function (req, res) {
  const email = req.params.email;
  const { renter, err } = await renterService.getRenterByEmail(email);
  if (err) return returnOtherError(res, 500, err);
  if (!renter) return returnNotFoundError(res, email);
  res.json(jsu.payload(renter));
};

exports.getRenterByAuth0Sub = async function (req, res) {
  const auth0_sub = req.params.auth0_sub;
  const { renter, err } = await renterService.getRenterByAuth0Sub(auth0_sub);
  if (err) return returnOtherError(res, 500, err);
  if (!renter) return returnNotFoundError(res, auth0_sub);
  res.json(jsu.payload(renter));
};

//////////////////////////////////////////////////////

exports.addRenter = async function (req, res) {
  const renterData = getRenterDataFromRequest(req);
  const { error } = renterService.validateRenter(renterData);
  if (error)
    return errorUtil.errorRes(
      res,
      400,
      "Renter error",
      error.details[0].message
    );

  const { renter: existing, err } = await renterService.getRenterByEmail(
    renterData.email
  );
  if (existing) {
    winston.debug("Email in use");
    return errorUtil.errorRes(res, 422, "Renter error", "Email is in use.");
  }

  winston.info("Adding new renter");
  const newRenterId = await renterService.addRenter(renterData);
  winston.info(`Added new renter: ${newRenterId}`);
  res.json({ renterId: newRenterId });
};

exports.updateRenter = async function (req, res) {
  const renterData = getRenterDataFromRequest(req);
  const { error } = renterService.validateRenter(renterData);
  const result = await renterService.updateRenter(renterData);
  res.json(result);
};

exports.deleteRenter = async function (req, res) {
  const renterData = getRenterDataFromRequest(req);
  const renter = await renterService.deleteRenter(renterData.renterId);
  if (!renter)
    errorUtil.errorRes(
      res,
      422,
      "Renter error",
      `Could not find renter id: ${renterData.renterId}`
    );

  res.json(renter);
};

function getRenterDataFromRequest(req) {
  let renter = {
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
    auth0_sub: req.body.auth0_sub,
  };

  if (req.params.id) {
    renter.renterId = req.params.id;
  }
  return renter;
}

//////////////////////////////////////////////////////////

function returnNotFoundError(res, ownerId) {
  return errorUtil.errorRes(
    res,
    404,
    "Renter Error",
    `No renter for id ${ownerId}`
  );
}

function returnOtherError(res, code, err) {
  return errorUtil.errorRes(res, code, "Renter Error", err);
}

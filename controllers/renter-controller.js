const winston = require("winston");
const renterService = require("../services/renter-service");
const errorUtil = require("./util/error-util");

exports.getAllRenters = async function (req, res) {
  const renters = await renterService.getAllOwnwers();
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

  const existing = await renterService.getRenterByEmail(renterData.email);
  if (existing) {
    winston.debug("Email in use");
    return errorUtil.errorRes(res, 422, "Renter error", "Email is in use.");
  }

  winston.info("Adding new renter");
  const newRenterId = await renterService.addRenter(renterData);
  winston.debug(`Added new renter: ${newRenterId}`);
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
  return {
    renterId: req.params.renterId,
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
  };
}

const winston = require("winston");
const cityService = require("../services/location/city-service");
const errorUtil = require("./util/error-util");

exports.getLargestCities = async function (req, res) {
  const cities = await cityService.getLargestCities();
  res.json({ data: cities });
};

exports.getCitiesForPartialName = async function (req, res) {
  const name = req.params.city;
  const cities = await cityService.getCitiesForPartialName(name);

  if (!cities)
    return errorUtil.errorRes(
      res,
      422,
      "City Error",
      `No cities for name ${name}`
    );
  res.json({ data: cities });
};

exports.getCitiesForCityAndState = async function (req, res) {
  const name = req.params.city;
  const state_id = req.params.state;
  const cities = await cityService.getCitiesForCityAndState(name, state_id);
  if (!cities)
    return errorUtil.errorRes(
      res,
      422,
      "City Error",
      `No cities for city ${name} state ${state_id}`
    );
  res.json({ cities: cities });
};

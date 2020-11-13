const error_mw = require("../routes/middleware/error-mw");
const express = require("express");
const winston = require("winston");

const cities = require("../routes/cities");
const home = require("../routes/home");
const owners = require("../routes/owners");
const pets = require("../routes/pets");
const petsSearch = require("../routes/pets-search");
const renters = require("../routes/renters");
const upload = require("../routes/upload");
const location = require("../routes/location");

module.exports = function (app) {
  winston.info("Start: Setting up routes");

  app.use("/", home);
  app.use("/api/v1/cities", cities);
  app.use("/api/v1/upload", upload);
  app.use("/api/v1/pets", pets);
  app.use("/api/v1/pets-search", petsSearch);
  app.use("/api/v1/owners", owners);
  app.use("/api/v1/renters", renters);
  app.use("/api/v1/location", location);
  app.use(error_mw);

  winston.info("Finish: setting up routes");
};

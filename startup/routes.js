const error_mw = require("../routes/middleware/error-mw");
const express = require("express");
const winston = require("winston");

const booking = require("../routes/booking");
const cities = require("../routes/cities");
const home = require("../routes/home");
const location = require("../routes/location");
const owners = require("../routes/owners");
const payment = require("../routes/payment");
const pets = require("../routes/pets");
const petsSearch = require("../routes/pets-search");
const renters = require("../routes/renters");
const upload = require("../routes/upload");

module.exports = function (app) {
  winston.info("Start: Setting up routes");

  app.use("/", home);
  app.use("/api/v1/booking", booking);
  app.use("/api/v1/cities", cities);
  app.use("/api/v1/location", location);
  app.use("/api/v1/owners", owners);
  app.use("/api/v1/payment", payment);
  app.use("/api/v1/pets", pets);
  app.use("/api/v1/pets-search", petsSearch);
  app.use("/api/v1/renters", renters);
  app.use("/api/v1/upload", upload);
  app.use(error_mw);

  winston.info("Finish: setting up routes");
};

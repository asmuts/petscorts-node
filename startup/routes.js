const error_mw = require("../middleware/error-mw");
const express = require("express");

const home = require("../routes/home");
const owners = require("../routes/owners");
const pets = require("../routes/pets");
const renters = require("../routes/renters");
const upload = require("../routes/upload");

module.exports = function (app) {
  app.use("/", home);
  app.use("/api/v1/upload", upload);
  app.use("/api/v1/pets", pets);
  app.use("/api/v1/owners", owners);
  app.use("/api/v1/renters", renters);
  app.use(error_mw);
};

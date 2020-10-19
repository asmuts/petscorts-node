require("express-async-errors");
const express = require("express");
const morgan = require("morgan");
const winston = require("winston");

const app = express();
app.use(express.json());

console.log("Starting up");

require("./startup/routes")(app);
require("./startup/logging")(app);
require("./startup/mongo")(app);
require("./startup/validation")();

if (app.get("env") === "development" || "dev") {
  app.use(morgan("tiny"));
  winston.info("Morgan enabled");
}

// Note. Don't start the server here.
// Supertest will load the app and start its own server.
// Normal startup should use server.js

module.exports = app;

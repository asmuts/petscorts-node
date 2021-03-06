require("express-async-errors");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

console.log("Starting up");
console.log("NODE_ENV = " + process.env.NODE_ENV);

const app = express();

app.use(morgan("combined"));

// TODO make a configrable whitelist
app.use(cors());
app.use(express.json());

require("./startup/logging")();
require("./startup/mongo")(app);
require("./startup/routes")(app);
require("./startup/validation")();

console.log("Finish: index.js require and app use.");
// Note. Don't start the server here.
// Supertest will load the app and start its own server.
// Normal startup should use server.js

module.exports = app;

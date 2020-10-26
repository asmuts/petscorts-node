const express = require("express");
const winston = require("winston");

const app = require("./index");

const port = process.env.PORT || 3001;
const server = app.listen(port, () =>
  winston.info(`Listening on port ${port}`)
);

module.exports = server;

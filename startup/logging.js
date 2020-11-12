const config = require("config");
require("express-async-errors");
const winston = require("winston");

module.exports = function (app) {
  // can write to the fs in AWS unlike Heroku

  const files = new winston.transports.File({ filename: "combined.log" });
  winston.add(files);

  const console = new winston.transports.Console();
  winston.add(console);

  winston.exceptions.handle([
    new winston.transports.File({ filename: "uncaughtExceptions.log" }),
    new winston.transports.Console(),
  ]);

  //TODO revist this.
  process.on("unhandledRejection", (ex) => {
    console.log(ex);
    throw ex;
  });
};

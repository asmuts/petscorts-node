const config = require("config");
require("express-async-errors");
require("winston-daily-rotate-file");
const winston = require("winston");

// TODO revist the logging
module.exports = function (app) {
  var rotatingFile = new winston.transports.DailyRotateFile({
    filename: "application-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
  });

  const console = new winston.transports.Console({
    format: winston.format.simple(),
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
  });

  winston.configure({
    transports: [rotatingFile, console],
    rejectionHandlers: [
      new winston.transports.File({ filename: "rejections.log" }),
      console,
    ],
    exceptionHandlers: [
      new winston.transports.File({ filename: "uncaughtExceptions.log" }),
      console,
    ],
    exitOnError: false,
  });

  //TODO revist this.
  process.on("unhandledRejection", (ex) => {
    console.log("Unhandled Rejection at:", ex.stack || ex);
    //throw ex;
  });
};

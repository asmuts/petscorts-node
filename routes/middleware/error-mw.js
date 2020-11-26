const winston = require("winston");
// TODO move the errorUtil somewhere common
const errorUtil = require("../../controllers/util/error-util");

let code = 500;
let title = "Server Error";

// "express-async-errors" will invoke this.
// https://github.com/davidbanham/express-async-errors
module.exports = function (err, req, res, next) {
  winston.log("error", "ErrorMW: " + err.message);
  winston.log(err);

  if (err.name === "UnauthorizedError") {
    code = 401;
    title = "UnauthorizedError";
  }

  return errorUtil.errorRes(res, code, title, err.message);
};

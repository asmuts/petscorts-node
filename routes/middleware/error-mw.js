const winston = require("winston");

let code = 500;
let title = "Server Error";

module.exports = function (err, req, res, next) {
  winston.log("error", "ErrorMW: " + err.message);

  if (err.name === "UnauthorizedError") {
    code = 401;
    title = "UnauthorizedError";
  }

  const json = {
    errors: [
      {
        title: title,
        detail: err.message,
      },
    ],
  };
  res.status(code).send(json);
};

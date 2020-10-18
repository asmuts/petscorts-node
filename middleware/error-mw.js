const winston = require("winston");

module.exports = function (err, req, res, next) {
  winston.log("error", err.message);
  const json = {
    errors: [
      {
        title: "Server Error",
        detail: err.message,
      },
    ],
  };
  res.status(500).send(json);
};

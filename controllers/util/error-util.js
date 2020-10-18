const winston = require("winston");

exports.errorRes = function (res, statusCode, title, message) {
  winston.info(`Returning error ${statusCode} | ${title} | ${message}`);
  res.status(statusCode).send(createJSON(title, message));
};

function createJSON(title, message) {
  const json = {
    errors: [
      {
        title: title,
        detail: message,
      },
    ],
  };
  return json;
}

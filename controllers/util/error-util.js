const winston = require("winston");

exports.errorRes = function (res, statusCode, title, message) {
  winston.info(`Returning error ${statusCode} | ${title} | ${message}`);
  res.status(statusCode).json(createJSON(title, message));
};

// TODO either use jsend or google json format
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

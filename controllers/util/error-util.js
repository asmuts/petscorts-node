const winston = require("winston");

exports.errorRes = function (res, statusCode, title, message) {
  winston.info(`Returning error ${statusCode} | ${title} | ${message}`);
  res.status(statusCode).json(createJSON(statusCode, title, message));
};

// TODO either use jsend or google json format
// https://google.github.io/styleguide/jsoncstyleguide.xml#error
// google doesn't user title
/// TODO  they also nest multiple under the first
function createJSON(code, title, message) {
  const json = {
    apiVersion: "1.0",
    error: {
      code: code,
      title: title,
      message: message,
    },
  };
  return json;
}

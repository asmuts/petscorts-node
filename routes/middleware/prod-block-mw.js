const errorUtil = require("../../controllers/util/error-util");

// Block some route in production.
// For instance, I don't want to return all renters
// Some administrative application might need these kinds of calls
// But that should not be mixed with the customer facing web app.
module.exports = function (req, res, next) {
  const env = process.env.NODE_ENV;
  if (env !== "development" && env !== "dev" && env !== "test") {
    return errorUtil.errorRes(
      res,
      403,
      "Route Forbidden",
      `Route [${req.originalUrl}] is not available in production. It's for testing only.`
    );
  }
  next();
};

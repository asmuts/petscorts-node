const mongoose = require("mongoose");
// move the errorUtil somewhere common
const errorUtil = require("../../controllers/util/error-util");

module.exports = function (req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorUtil.errorRes(
      res,
      404,
      "ID Format Error",
      `Invalid ID ${req.params.id}`
    );
  }
  next();
};

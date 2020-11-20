const express = require("express");
const paymentController = require("../controllers/payment-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");
const auth_mw = require("./middleware/auth-mw");
const prodBlock_mw = require("./middleware/prod-block-mw");

const router = express.Router();

router.post(
  "/:id",
  [validateObjectId_mw, auth_mw],
  paymentController.confirmPayment
);

router.delete(
  "/:id",
  [validateObjectId_mw, auth_mw],
  paymentController.declinePayment
);

module.exports = router;

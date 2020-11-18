const express = require("express");
const bookingController = require("../controllers/booking-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");
const auth_mw = require("./middleware/auth-mw");
const prodBlock_mw = require("./middleware/prod-block-mw");

const router = express.Router();

router.post("/", auth_mw, bookingController.createBooking);

router.get(
  "/dates/pet/:id",
  validateObjectId_mw,
  bookingController.getBookingDatesForPet
);

module.exports = router;

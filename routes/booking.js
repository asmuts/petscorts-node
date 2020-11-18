const express = require("express");
const bookingController = require("../controllers/booking-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");
const auth_mw = require("./middleware/auth-mw");
const prodBlock_mw = require("./middleware/prod-block-mw");

const router = express.Router();

router.post("/", auth_mw, bookingController.createBooking);

router.get(
  "/dates/pet/:id",
  [validateObjectId_mw],
  bookingController.getBookingDatesForPet
);

router.get(
  "/owner/:id",
  [validateObjectId_mw, auth_mw],
  bookingController.getBookingsForOwner
);

router.get(
  "/renter/:id",
  [validateObjectId_mw, auth_mw],
  bookingController.getBookingsForRenter
);

module.exports = router;

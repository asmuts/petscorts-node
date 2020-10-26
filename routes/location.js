const express = require("express");
const locationController = require("../controllers/location-controller");

const router = express.Router();

router.get("/clientLocation", locationController.getGeoLocationForClient);
router.get(
  "/geoLocationForAddress",
  locationController.getGeoLocationForAddress
);

module.exports = router;

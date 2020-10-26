const express = require("express");
const petSearchController = require("../controllers/pet/pet-search-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");

const router = express.Router();

// NOTE: I broke out the Read calls so they can be moved to
// a separate Node application.
router.get("/", petSearchController.getPets);
router.get("/city/:city/state/:state", petSearchController.getPetsInCity);
router.get(
  "/near/city/:city/state/:state",
  petSearchController.getPetsInCityAndNearby
);
router.get(
  "/geo/lat/:lat/lng/:lng",
  petSearchController.getPetsNearGeoLocation
);
router.get("/:id", validateObjectId_mw, petSearchController.getPetById);

module.exports = router;

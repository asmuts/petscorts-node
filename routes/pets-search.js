const express = require("express");
const petSearchController = require("../controllers/pet/pet-search-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");
const auth_mw = require("./middleware/auth-mw");
const prodBlock_mw = require("./middleware/prod-block-mw");

const router = express.Router();

// NOTE: I broke out the Read calls so they can be moved to
// a separate Node application.
router.get(
  "/owner/:id",
  [validateObjectId_mw, auth_mw],
  petSearchController.getPetsForOwner
);

// disable in production
router.get("/", prodBlock_mw, petSearchController.getPets);

// search for pets in city
router.get("/city/:city/state/:state", petSearchController.getPetsInCity);

// same as above, but includes those nearby
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

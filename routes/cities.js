const express = require("express");
const cityController = require("../controllers/city-controller");

const router = express.Router();

router.get("", cityController.getLargestCities);
router.get("/name/:city/state/:state", cityController.getCitiesForCityAndState);
router.get("/name/:city", cityController.getCitiesForPartialName);

module.exports = router;

const express = require("express");
const renterController = require("../controllers/renter-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");

const router = express.Router();

router.post("/", renterController.addRenter);
router.get("", renterController.getAllRenters);
router.get("/:id", validateObjectId_mw, renterController.getRenterById);
router.get("/auth0_sub/:auth0_sub", renterController.getRenterByAuth0Sub);
router.put("/:id", validateObjectId_mw, renterController.updateRenter);
router.delete("/:id", validateObjectId_mw, renterController.deleteRenter);

module.exports = router;

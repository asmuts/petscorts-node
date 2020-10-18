const express = require("express");
const renterController = require("../controllers/renter-controller");

const router = express.Router();

router.post("/", renterController.addRenter);
router.get("", renterController.getAllRenters);
router.get("/:id", renterController.getRenterById);
router.put("/:id", renterController.updateRenter);
router.delete("/:id", renterController.deleteRenter);

module.exports = router;

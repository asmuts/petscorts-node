const express = require("express");
const renterController = require("../controllers/renter-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");
const auth_mw = require("./middleware/auth-mw");
const prodBlock_mw = require("./middleware/prod-block-mw");

const router = express.Router();

router.post("/", auth_mw, renterController.addRenter);

// disabled in production
router.get("", prodBlock_mw, renterController.getAllRenters);

router.get(
  "/:id",
  [validateObjectId_mw, auth_mw],
  renterController.getRenterById
);
router.get(
  "/auth0_sub/:auth0_sub",
  auth_mw,
  renterController.getRenterByAuth0Sub
);
router.put(
  "/:id",
  [validateObjectId_mw, auth_mw],
  renterController.updateRenter
);

// TODO change to archive.
// disabling this in prod
router.delete(
  "/:id",
  [validateObjectId_mw, auth_mw, prodBlock_mw],
  renterController.deleteRenter
);

module.exports = router;

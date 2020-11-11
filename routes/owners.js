const express = require("express");
const ownerController = require("../controllers/owner-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");
const auth_mw = require("./middleware/auth-mw");

const router = express.Router();

router.post("/", auth_mw, ownerController.addOwner);
router.get("", auth_mw, ownerController.getAllOwners);

// these two are called after login
// if someone knew the sub, they could get owner data
// should have a jwt at this point. so auth_mw
router.get(
  "/auth0_sub/:auth0_sub",
  auth_mw,
  ownerController.getOwnerByAuth0SubWithPets
);
router.get("/email/:email", auth_mw, ownerController.getOwnerByEmail);
router.get(
  "/:id",
  [validateObjectId_mw, auth_mw],
  ownerController.getOwnerByIdWithPets
);
router.put("/:id", [validateObjectId_mw, auth_mw], ownerController.updateOwner);
router.delete(
  "/:id",
  [validateObjectId_mw, auth_mw],
  ownerController.deleteOwner
);

module.exports = router;

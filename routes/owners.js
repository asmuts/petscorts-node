const express = require("express");
const ownerController = require("../controllers/owner-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");
const auth_mw = require("./middleware/auth-mw");

const router = express.Router();

router.post("/", auth_mw, ownerController.addOwner);
router.get("", auth_mw, ownerController.getAllOwners);
router.get("/auth0_sub/:auth0_sub", ownerController.getOwnerByAuth0Sub);
router.get("/email/:email", ownerController.getOwnerByEmail);
router.get(
  "/:id",
  [validateObjectId_mw, auth_mw],
  ownerController.getOwnerById
);
router.put("/:id", [validateObjectId_mw, auth_mw], ownerController.updateOwner);
router.delete(
  "/:id",
  [validateObjectId_mw, auth_mw],
  ownerController.deleteOwner
);

module.exports = router;

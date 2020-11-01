const express = require("express");
const ownerController = require("../controllers/owner-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");

const router = express.Router();

router.post("/", ownerController.addOwner);
router.get("", ownerController.getAllOwners);
router.get("/email/:email", ownerController.getOwnerByEmail);
router.get("/:id", validateObjectId_mw, ownerController.getOwnerById);
router.put("/:id", validateObjectId_mw, ownerController.updateOwner);
router.delete("/:id", validateObjectId_mw, ownerController.deleteOwner);

module.exports = router;

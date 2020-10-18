const express = require("express");
const ownerController = require("../controllers/owner-controller");

const router = express.Router();

router.post("/", ownerController.addOwner);
router.get("", ownerController.getAllOwners);
router.get("/:id", ownerController.getOwnerById);
router.put("/:id", ownerController.updateOwner);
router.delete("/:id", ownerController.deleteOwner);

module.exports = router;

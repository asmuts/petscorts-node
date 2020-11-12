const express = require("express");
const petController = require("../controllers/pet/pet-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");
const auth_mw = require("./middleware/auth-mw");

const router = express.Router();

router.post("/", auth_mw, petController.addPet);

router.put("/:id", [validateObjectId_mw, auth_mw], petController.updatePet);

router.delete(
  "/:id/image/:imageId",
  [validateObjectId_mw, auth_mw],
  petController.removeImageFromPet
);

// TODO - delete probably shouldn't delete
// it should archive
router.delete("/:id", [validateObjectId_mw, auth_mw], petController.deletePet);

module.exports = router;

const express = require("express");
const petController = require("../controllers/pet-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");

const router = express.Router();

router.post("/", petController.addPet);
router.get("", petController.getAll);
router.get("/:id", validateObjectId_mw, petController.getPetById);
router.put("/:id", validateObjectId_mw, petController.updatePet);
router.delete("/:id", validateObjectId_mw, petController.deletePet);

module.exports = router;

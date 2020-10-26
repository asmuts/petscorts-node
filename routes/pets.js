const express = require("express");
const petController = require("../controllers/pet/pet-controller");
const validateObjectId_mw = require("./middleware/validate-objectId-mw");

const router = express.Router();

router.post("/", petController.addPet);
router.put("/:id", validateObjectId_mw, petController.updatePet);
router.delete("/:id", validateObjectId_mw, petController.deletePet);

module.exports = router;

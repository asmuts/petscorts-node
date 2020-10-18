const express = require("express");
const petController = require("../controllers/pet-controller");

const router = express.Router();

router.post("/", petController.addPet);
router.get("", petController.getAll);
router.get("/:id", petController.getPetById);

module.exports = router;

const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload-controller");
const auth_mw = require("./middleware/auth-mw");

router.post("/", auth_mw, uploadController.upload);

module.exports = router;

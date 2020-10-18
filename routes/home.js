const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  const json = { message: "The API Server is alive!" };
  res.status(400).send(json);
});

module.exports = router;

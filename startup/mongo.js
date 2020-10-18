const mongoose = require("mongoose");
const config = require("config");

const winston = require("winston");

if (!config.get("mongoDBPassword")) {
  console.error("FATAL ERROR: mongoDBPassword is not defined");
  process.exit(1);
}

module.exports = function () {
  const db = config.get("db");
  mongoose
    .connect(
      `mongodb+srv://${config.get("mongoDBUser")}:${config.get(
        "mongoDBPassword"
      )}@${db}?retryWrites=true&w=majority`,
      { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => winston.info(`Connected to MDB: ${db}`));
};
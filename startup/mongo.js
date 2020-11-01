const mongoose = require("mongoose");
const config = require("config");

const winston = require("winston");

if (!config.get("mongoDBPassword")) {
  console.error("FATAL ERROR: mongoDBPassword is not defined");
  process.exit(1);
}

module.exports = function () {
  const db = config.get("db");
  // solves the ensureIndex deprecation warning
  mongoose.set("useCreateIndex", true);
  mongoose
    .connect(
      `mongodb+srv://${config.get("mongoDBUser")}:${config.get(
        "mongoDBPassword"
      )}@${db}?retryWrites=true&w=majority`,
      { useNewUrlParser: true, useUnifiedTopology: false }
    )
    .then(() => winston.info(`Connected to MDB: ${db}`));
};

var fs = require("fs");
const winston = require("winston");

let stateCodes = null;
let stateNames = null;

function getStateCodes() {
  if (!stateCodes) {
    // TODO load location from config
    var path = process.cwd();
    const codefileLoc = "/resources/location/state-codes.json";
    stateCodes = fs.readFileSync(path + codefileLoc);
    rawdata = JSON.parse(rawdata);
    winston.debug("Initialization: " + stateCodes);
  }
  return stateCodes;
}

function getStateNameForCode(code) {
  const data = getStateCodes();
  return data.code;
}

function getStateNames() {
  if (!stateNames) {
    // TODO load location from config
    var path = process.cwd();
    const namesfileLoc = "/resources/location/state-names.json";
    const rawdata = fs.readFileSync(path + namesfileLoc);
    stateNames = JSON.parse(rawdata);
    winston.debug("Initialization: " + stateNames);
  }
  return stateNames;
}

function getStateCodeForName(name) {
  const data = getStateNames();
  let state = data.find((o) => o.name.toLowerCase() === name.toLowerCase());
  if (state) {
    return state.abbreviation.toUpperCase();
  }
  return "";
}

module.exports.getStateNameForCode = getStateNameForCode;
module.exports.getStateCodeForName = getStateCodeForName;

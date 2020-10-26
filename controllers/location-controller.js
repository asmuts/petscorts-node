const winston = require("winston");
const geoLocationService = require("../services/location/geo-location-service");
const errorUtil = require("./util/error-util");

exports.getGeoLocationForClient = async function (req, res) {
  let ipAddress = getClientIP(req);
  // let 1 and local testing ips through for testing
  // don't go to the service if we can't get anything meaningful
  if (ipAddress.IP === null) {
    return res.json(notFoundJSON);
  }

  const geoLocation = await geoLocationService.getGeoLocationForClient(
    ipAddress.IP
  );
  return res.json(geoLocation);
};

function getClientIP(req) {
  // return req.ip;
  var IPs =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  winston.debug(IPs);

  if (IPs.indexOf(":") !== -1) {
    IPs = IPs.split(":")[IPs.split(":").length - 1];
  }

  return { IP: IPs.split(",")[0] };
}

const notFoundJSON = {
  country_code: "Not found",
  country_name: "Not found",
  city: "Not found",
  postal: "Not found",
  latitude: "Not found",
  longitude: "Not found",
  IPv4: "Not found",
  state: "Not found",
};

exports.getGeoLocationForAddress = async function (req, res) {
  const street = req.query.street;
  const city = req.query.city;
  const state = req.query.state;

  // neither stree nor state are required
  // This can be used to get lat|lng for a city
  // Google will default to the APIs country.
  // G is unreliable without state, use the city service.
  const latLng = await geoLocationService.getGeoLocationForAddress(
    street,
    city,
    state
  );
  return res.json(latLng);
};

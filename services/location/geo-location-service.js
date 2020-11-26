const axios = require("axios");
const winston = require("winston");
const config = require("config");

// TODO: convert the response into a common format.
// TODO: try other providers if one fails.
exports.getGeoLocationForClient = async function (ipAddress) {
  // for testing purposes, if it is 1 just use the server loc.
  let ip = ipAddress === "1" || ipAddress.startsWith("192") ? "" : ipAddress;

  //const backUpBaseUrl = "http://ip-api.com/json/24.48.0.1";
  //"https://geolocation-db.com/json/7733a990-ebd4-11ea-b9a6-2955706ddbf3/";

  const baseURL = config.get("geo-service-url");
  const url = baseURL + ip;

  winston.debug("Contacting geolocation url: " + url);
  let res = {};
  try {
    res = await axios.get(url, { timeout: 1000 });
  } catch (e) {
    winston.info(e, url);
    // TODO: try backups
    throw e;
  }
  return res.data;
};

// {
//   "country_code": "US"
//   "country_name": "United States"
//   "city": "Pawtucket"
//   "postal": "02860"
//   "latitude": "41.8729"
//   "longitude": "-71.3907"
//   "IP": "----"
//   "state": "Rhode Island"
//   }

// User non Google city-service for calls without street
exports.getGeoLocationForAddress = async function (street, city, state) {
  // TODO load from config
  const apiKey = config.get("google_map_api_key");

  const baseUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=";
  const url = `${baseUrl}${street},${city},${state}&key=${apiKey}`;

  let res = {};
  try {
    winston.log("trace", "Contacting googleapis for address: " + url);
    res = await axios.get(url, { timeout: 1000 });
  } catch (e) {
    winston.info(e, url);
    throw e;
  }

  winston.debug("Status = " + res.data.status);
  let location = {};
  if (res.data.status === "OK") {
    location.lat = res.data.results[0].geometry.location.lat;
    location.lng = res.data.results[0].geometry.location.lng;
  }
  winston.debug(
    "location.lat = " + location.lat + " location.lng = " + location.lng
  );

  return location;
};

//https://developers.google.com/maps/documentation/geocoding/overview
// {
//   "results" : [
//      {
//         "address_components" : [
//            {
//              . . .

//             ],
//             "formatted_address" : "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
//             "geometry" : {
//                "location" : {
//                   "lat" : 37.4224764,
//                   "lng" : -122.0842499
//                },
//                . . .             "global_code": "849VCWC8+W5"
//               },
//               "types" : [ "street_address" ]
//            }
//         ],
//         "status" : "OK"
//      }

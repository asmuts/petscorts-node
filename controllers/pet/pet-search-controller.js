const winston = require("winston");
const cityService = require("../../services/location/city-service");
const geoLocationService = require("../../services/location/geo-location-service");
const petService = require("../../services/pet-service");
const errorUtil = require("../util/error-util");
const _ = require("lodash");

exports.getPets = async function (req, res) {
  const pets = await petService.getAllPets();
  res.json(pets);
};

exports.getPetsInCity = async function (req, res) {
  const city = req.query.city;
  const state = req.query.state;
  const pets = await petService.getPetsInCityAndState(city, state);
  res.json(pets);
};

// paginating this will be a mess at very large numbers
// TODO rethink the API
// might want to have the client do the supplementation
exports.getPetsInCityAndNearby = async function (req, res) {
  const city = req.params.city;
  const state = req.params.state;

  if (city && state) {
    city.trim();
    state.trim().toUpperCase();
  }

  // super fast call here, then do the others together
  const geoLocation = await getGeoLocationForCity(city, state);

  // TODO add a max distance variable
  // using defaults for now
  const METERS_IN_MILE = 1610;
  const MILES = 5;
  const distance = req.query.meters ? req.query.meters : METERS_IN_MILE * MILES;
  winston.debug("distance = " + distance);

  const nearbyPromise = findNearGeoLocation(
    geoLocation.lat,
    geoLocation.lng,
    distance
  );
  const cityPromise = petService.getPetsInCityAndState(city, state);
  let [petsInCityAndState, petsNearby] = await Promise.allSettled([
    cityPromise,
    nearbyPromise,
  ]);

  let petsComb = petsInCityAndState.value.concat(petsNearby.value);
  winston.info(`PetSearchController. petsComb ${petsComb.length}`);
  //const pets = _.uniqBy(petsComb, (e) => {
  //  return e._id;
  //});
  //_.uniq(pets);
  const pets = _.unionBy(petsComb, "_id");
  //let setOfPets = new Set(petsComb);
  //const pets = Array.from(setOfPets);

  winston.info(`PetSearchController.  Found ${pets.length} pets`);
  res.json(pets);
};

// use the city service rather than Google
async function getGeoLocationForCity(city, state_id) {
  // expensive Google path:
  // await geoLocationService.getGeoLocationForAddress("", city, "");

  const cities = await cityService.getCitiesForCityAndState(city, state_id);

  let result = [];
  if (cities && cities[0]) {
    //winston.deug(cities[0]);
    return { lat: cities[0].lat, lng: cities[0].lng };
  } else {
    winston.info(
      `PetSearchController: Couldn't find request city ${city} and state ${state_id}.`
    );
  }
  return result;
}

async function findNearGeoLocation(latitude, longitude, maxDistanceMeters) {
  const pets = await petService.getPetsNearLocation(
    latitude,
    longitude,
    maxDistanceMeters
  );
  return pets;
}

exports.getPetsNearGeoLocation = async function (req, res) {
  const latitude = req.params.lat;
  const longitude = req.params.lng;
  const maxDistanceMeters = req.query.meters;

  const pets = await findNearGeoLocation(
    latitude,
    longitude,
    maxDistanceMeters
  );
  winston.info(
    `PetSearchController: Found ${pets.length} pets near lat ${latitude}
      lng ${longitude} maxDistanceMeters ${maxDistanceMeters}`
  );
  return res.json(pets);
};

exports.getPetById = async function (req, res) {
  const petId = req.params.id;
  const pet = await petService.getPetById(petId);

  if (!pet)
    return errorUtil.errorRes(res, 422, "Pet Error", `No pet for id ${petId}`);

  res.json(pet);
};

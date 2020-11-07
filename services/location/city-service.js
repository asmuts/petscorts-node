const Joi = require("joi");
const winston = require("winston");
const City = require("../models/city");

const Cache = require("../util/cache");

const cityStateCache = new Cache({
  stdTTL: 3600,
  checkperiod: 300,
  maxKeys: 15000,
});

// 17576 for chars 2-5 in the search string
const cityNameCache = new Cache({
  stdTTL: 3600,
  checkperiod: 300,
  maxKeys: 50000,
});

// TODO move this and the location service into
// a separate Node project called petscorts-api-location

// THIS IS READ ONLY FOR NOW
// data is batch inserted

// For testing only. Limited to 200 reults
// There are 15k in the database.
exports.getLargestCities = async function () {
  //TODO make the numbner configurable
  const cities = await City.find()
    .sort({ population: "descending" })
    .limit(200)
    .exec();
  winston.debug(`Found ${cities.length} cities.`);
  return cities;
};

// TODO Limit this with an option.  It's not useful over about 20.
// bad calls will just slow things down. Hard limit at 25 for now.
// TODO ***just return and cache the cityname, upper name, and state code
// this will save memory, if it's an issue
exports.getCitiesForPartialName = async function (name) {
  let cities = null;

  const key = name + "__CNS";
  // speed up the middle range 26*26*26  = 17576 * 26 = 500k possibiities
  // we'll never see this many given English, so we can go to 4 char with 50k
  if (name && name.length > 2 && name.length < 7) {
    cities = cityNameCache.get(key);
    if (cities) {
      //winston.debug(`Cache hit for cities ${key}`);
    }
  }

  if (!cities) {
    cities = await City.find({
      city_upper: { $regex: `^${name.toUpperCase()}` },
    })
      .sort({
        population: "descending",
      })
      .limit(25)
      .exec();
    if (cities) {
      cityNameCache.put(key, cities);
    }
  }
  winston.debug(`Found ${cities.length} cities for name: ${name}`);
  return cities;
};

// state_id = 2 letter state abbreviation
exports.getCitiesForCityAndState = async function (city, state_id) {
  const key = city + state_id + "_CSS";
  var inCache = false;

  let cities = cityStateCache.get(key);
  if (cities) {
    inCache = true;
    //winston.debug(`Cache hit for cities ${key}`);
  }

  if (!cities) {
    cities = await City.find({
      city_upper: {
        $regex: `^${city.toUpperCase()}`,
      },
      state_id: `${state_id.toUpperCase()}`,
    })
      .sort({
        population: "descending",
      })
      .limit(25)
      .exec();
    // should just be one.  But. . .
    if (cities) {
      cityStateCache.put(key, cities);
    }
  }
  winston.debug(
    `Found ${cities.length} cities for city: ${city} state: {state}, inCache ${inCache}`
  );
  return cities;
};

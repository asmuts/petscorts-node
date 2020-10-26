const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// only handling us cities
const citySchema = new Schema({
  city: { type: String, required: true },
  city_upper: { type: String, required: true, uppercase: true },
  state_id: { type: String, required: true },
  state_name: { type: String, required: true },
  county_name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  population: { type: Number, required: true },
});

//--fields="city.string(),city_upper.string(),state_id.string(),state_name.string(),county_name.string(),
// lat.decimal(),lng.decimal(),population.int32(),timezone.string()"

citySchema.index({ city_upper: "1" });
citySchema.index({ population: "1" });

module.exports = mongoose.model("City", citySchema);

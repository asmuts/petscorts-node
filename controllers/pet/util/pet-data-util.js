const {
  getStateCodeForName,
} = require("../../../services/location/state-service");

exports.getPetDataFromRequest = function (req) {
  let pet = {
    name: req.body.name,
    city: req.body.city,
    street: req.body.street,
    state: req.body.state,
    species: req.body.species,
    breed: req.body.breed,
    description: req.body.description,
    dailyRentalRate: req.body.dailyRentalRate,
    ownerId: req.body.ownerId,
  };

  pet.state = getStateCode(pet.state);

  if (req.params.id) {
    pet.petId = req.params.id;
  }
  return pet;
};

exports.getStateCodeForNameIfNeeded = function (state) {
  return getStateCode(state);
};

function getStateCode(state) {
  // handle full state name conversion if needed
  if (state && state.trim().length > 2) {
    return getStateCodeForName(state.trim());
  }
  return state;
}

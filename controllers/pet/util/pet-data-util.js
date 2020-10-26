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

  // handle full state name conversion if needed
  if (pet.state && pet.state.trim().length > 2) {
    pet.state = getStateCodeForName(pet.state.trim());
  }

  if (req.params.id) {
    pet.petId = req.params.id;
  }
  return pet;
};

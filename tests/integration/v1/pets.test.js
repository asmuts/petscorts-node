let app;
const request = require("supertest");
const Pet = require("../../../services/models/pet");
const Owner = require("../../../services/models/owner");
const petService = require("../../../services/pet-service");

// This is just a crude "Do all the parts roughly fit together?" check
// I wouldn't need this with static typing.
describe("/api/v1/pets-search", () => {
  let owner, pet;

  beforeAll(async () => {
    app = require("../../../index");
    await setupOwner();
    await setupPet();
  });
  afterAll(async () => {
    await Owner.remove({});
    await Pet.remove({});
  });

  async function setupOwner() {
    owner = new Owner({
      username: "owner1",
      fullname: "name 1",
      email: "owner-intp1@own.com",
      auth0_sub: "auth0_sub",
    });
    await owner.save();
  }

  async function setupPet() {
    const petData = {
      name: "TestPet",
      city: "Providence",
      street: "1 Main St.",
      state: "RI",
      species: "Cat",
      breed: "mutt",
      description: "Small hairy beast.",
      dailyRentalRate: "11",
      lng: 2,
      lat: 1,
      ownerId: owner._id,
    };
    const { pet: myPet } = await petService.addPet(petData);
    pet = myPet;
  }

  ////////////////////////////////////////////////////////
  describe("GET /:id", () => {
    it("should return a pet for existing id", async () => {
      const res = await request(app).get("/api/v1/pets-search/" + pet._id);
      expect(res.status).toBe(200);
      // TODO bring the api in line with Google JSON standard
      // check for data, etc.
      expect(res.body.data._id).toBe(pet._id.toString());
    });

    it("should return 404 if invalid id is passed", async () => {
      const res = await request(app).get("/api/v1/pets-search/1");
      expect(res.status).toBe(404);
      // TODO bring the api in line with Google JSON standard
      // check for error, etc.
    });
  });
});

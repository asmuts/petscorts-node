const mongoose = require("mongoose");

const MongoMemHelper = require("../../util/MongoMemHelper").MongoMemHelper;
const Owner = require("../../../services/models/owner");
const Pet = require("../../../services/models/pet");
const ownerService = require("../../../services/owner-service");
const petService = require("../../../services/pet-service");

// May require additional time for downloading MongoDB binaries
//jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

const dbHelper = new MongoMemHelper();

describe("/owner-service", () => {
  beforeAll(async () => {
    await dbHelper.startDB();
  });
  afterAll(async () => {
    await dbHelper.stopDB();
  });

  afterEach(async () => {
    await dbHelper.cleanup();
  });

  async function setupOwner(prefix) {
    let newOwner = new Owner({
      username: "owner1",
      fullname: "name 1",
      email: prefix + "o-s-int@own.com",
      auth0_sub: prefix + "a0s-o-s-int",
    });
    const { owner } = await ownerService.addOwner(newOwner);
    return owner;
  }

  async function deleteOwner(owner) {
    await ownerService.deleteOwner(owner._id);
  }

  ///////////////////////////////////////////////
  describe("getAllOwners", () => {
    jest.setTimeout(10000);

    let owner;

    beforeEach(async () => {
      owner = await setupOwner("getAllOwners");
    });

    afterEach(async () => {
      await deleteOwner(owner);
    });

    it("should return the owners", async () => {
      const { owners, err } = await ownerService.getAllOwners();
      expect(err).toBeFalsy();
      expect(owners).toBeTruthy();
      const found = owners.find(
        (o) => o._id.toString() === owner._id.toString()
      );
      expect(found).toBeTruthy();
    });
  });

  /////////////////////////////////////////////
  describe("getOwnerById", () => {
    let ownerGOBI;

    beforeEach(async () => {
      ownerGOBI = await setupOwner("ownerGOBI");
    });

    afterEach(async () => {
      await deleteOwner(ownerGOBI);
    });

    it("should return the owner by id", async () => {
      const { owner: found, err } = await ownerService.getOwnerById(
        ownerGOBI._id
      );
      expect(err).toBeFalsy();
      expect(found).toBeTruthy();
      expect(ownerGOBI._id.toString()).toBe(found._id.toString());
    });

    it("should return null if not found", async () => {
      var id = mongoose.Types.ObjectId();
      const { owner: found, err } = await ownerService.getOwnerById(id);
      expect(err).toBeFalsy();
      expect(found).toBeFalsy();
    });
  });

  ///////////////////////////////////////////////////////
  async function setUpPet(owner) {
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
    const { pet } = await petService.addPet(petData);
    return pet;
  }

  async function deletePet(pet) {
    await Pet.findByIdAndRemove(pet._id);
  }

  /////////////////////////////////////////////
  describe("getOwnerByIdWithPets_addPetToOwner", () => {
    let ownerGOBIWP;
    let pet;

    beforeEach(async () => {
      ownerGOBIWP = await setupOwner("ownerGOBIWP");
      pet = await setUpPet(ownerGOBIWP);
    });

    afterEach(async () => {
      await deleteOwner(ownerGOBIWP);
      await deletePet(pet);
    });

    it("should return the owner by id with pets", async () => {
      await ownerService.addPetToOwner(ownerGOBIWP._id, pet);
      const { owner: foundOwner, err } = await ownerService.getOwnerById(
        ownerGOBIWP._id
      );
      expect(err).toBeFalsy();
      expect(foundOwner).toBeTruthy();
      const found = foundOwner.pets.find((p) => p._id.equals(pet._id));
      expect(found).toBeTruthy();
    });
  });

  /////////////////////////////////////////////
  describe("getOwnerByEmail", () => {
    let ownerGOBE;

    beforeEach(async () => {
      ownerGOBE = await setupOwner("ownerGOBE");
    });

    afterEach(async () => {
      await deleteOwner(ownerGOBE);
    });

    it("should return the owner by email", async () => {
      const { owner: found, err } = await ownerService.getOwnerByEmail(
        ownerGOBE.email
      );
      expect(err).toBeFalsy();
      expect(found).toBeTruthy();
      expect(ownerGOBE._id.toString()).toBe(found._id.toString());
    });

    it("should return null if not found", async () => {
      const { owner: found2, err } = await ownerService.getOwnerByEmail("none");
      expect(err).toBeFalsy();
      expect(found2).toBeFalsy();
    });
  });

  /////////////////////////////////////////////
  describe("getOwnerByAuth0Sub", () => {
    let ownerGOBAS;

    beforeEach(async () => {
      ownerGOBAS = await setupOwner("ownerGOBAS");
    });

    afterEach(async () => {
      await deleteOwner(ownerGOBAS);
    });

    it("should return the owner by auth0 sub", async () => {
      const { owner: found, err } = await ownerService.getOwnerByAuth0Sub(
        ownerGOBAS.auth0_sub
      );
      expect(err).toBeFalsy();
      expect(found).toBeTruthy();
      expect(ownerGOBAS._id.toString()).toBe(found._id.toString());
    });

    it("should return null if not found", async () => {
      const { owner: found2, err } = await ownerService.getOwnerByAuth0Sub(
        "none"
      );
      expect(err).toBeFalsy();
      expect(found2).toBeFalsy();
    });
  });

  /////////////////////////////////////////////
  describe("getOwnerByAuth0SubWithPets_addPetToOwner", () => {
    let ownerGOBASWP;
    let pet;

    beforeEach(async () => {
      ownerGOBASWP = await setupOwner("ownerGOBASWP");
      pet = await setUpPet(ownerGOBASWP);
    });

    afterEach(async () => {
      await deleteOwner(ownerGOBASWP);
      await deletePet(pet);
    });

    it("should return the owner by auth0_sub with pets", async () => {
      await ownerService.addPetToOwner(ownerGOBASWP._id, pet);
      const {
        owner: foundOwner,
        err,
      } = await ownerService.getOwnerByAuth0SubWithPets(ownerGOBASWP.auth0_sub);
      expect(err).toBeFalsy();
      expect(foundOwner).toBeTruthy();
      const found = foundOwner.pets.find((p) => p._id.equals(pet._id));
      expect(found).toBeTruthy();
    });
  });

  /////////////////////////////////////////////
  describe("addAndRemovePetOwner", () => {
    let ownerAARPO;
    let pet;

    beforeEach(async () => {
      ownerAARPO = await setupOwner("ownerAARPO");
      pet = await setUpPet(ownerAARPO);
    });

    afterEach(async () => {
      await deleteOwner(ownerAARPO);
      await deletePet(pet);
    });

    it("should remove the pet from the owner", async () => {
      await ownerService.addPetToOwner(ownerAARPO._id, pet);
      await ownerService.removePetFromOwner(ownerAARPO._id, pet._id);
      const {
        owner: foundOwner,
        err,
      } = await ownerService.getOwnerByAuth0SubWithPets(ownerAARPO.auth0_sub);
      expect(err).toBeFalsy();
      const found = foundOwner.pets.find((p) => p._id.equals(pet._id));
      expect(found).toBeFalsy();
    });

    it("should return and error for a non existent pet", async () => {
      var id = mongoose.Types.ObjectId();
      const { owner, err } = await ownerService.removePetFromOwner(
        ownerAARPO._id,
        id
      );
      expect(err).toBeTruthy();
    });
  });
});

const Pet = require("../../../services/models/pet");
const Owner = require("../../../services/models/owner");
const Renter = require("../../../services/models/renter");
const Booking = require("../../../services/models/booking");
const petService = require("../../../services/pet-service");
const bookingService = require("../../../services/booking-service");
const transactionHelper = require("../../../services/util/transaction-helper");

describe("/pet-service", () => {
  let owner;
  let renter;

  beforeAll(async () => {
    // need to run the server on a different port than nodemon
    app = require("../../../index");
    await setupOwner();
    await setupRenter();
  });
  afterAll(async () => {
    await Owner.remove({});
    await Renter.remove({});
    await Pet.remove({});
    await Booking.remove({});
  });

  async function setupOwner() {
    owner = new Owner({
      username: "owner1",
      fullname: "name 1",
      email: "ownerPetService@own.com",
      auth0_sub: "auth0_sub",
    });
    await owner.save();
  }

  async function setupRenter() {
    renter = new Renter({
      username: "renter1",
      fullname: "renter 1",
      email: "renter1@own.com",
      auth0_sub: "auth0_sub",
    });
    await renter.save();
  }

  /////////////////////////////////////////////////////
  describe("addPet", () => {
    it("should add a pet", async () => {
      const petData = {
        name: "TestPet",
        city: "Providence",
        street: "100 Colonial Rd.",
        state: "RI",
        species: "Cat",
        breed: "mutt",
        description: "Small hairy beast.",
        dailyRentalRate: "12",
        lng: 2,
        lat: 1,
        ownerId: owner._id,
      };

      const { pet, err } = await petService.addPet(petData);
      expect(err).toBeFalsy();
      expect(pet._id).toBeTruthy();
      // make sure it's lng|lat - that's how mongo needs it.
      expect(pet.location.coordinates[0]).toBe(2);
      expect(pet.location.coordinates[1]).toBe(1);
    });

    it("should fail without location", async () => {
      const petData = {
        name: "TestPet",
        city: "Providence",
        street: "100 Colonial Rd.",
        state: "RI",
        species: "Cat",
        breed: "mutt",
        description: "Small hairy beast.",
        dailyRentalRate: "12",
        ownerId: owner._id,
      };

      const { pet, err } = await petService.addPet(petData);
      expect(pet).toBeFalsy();
      expect(err).toBeTruthy();
    });

    it("should fail with long state name", async () => {
      const petData = {
        name: "TestPet",
        city: "Providence",
        street: "100 Colonial Rd.",
        state: "Rhode Island",
        species: "Cat",
        breed: "mutt",
        description: "Small hairy beast.",
        dailyRentalRate: "12",
        lng: 2,
        lat: 1,
        ownerId: owner._id,
      };

      const { pet, err } = await petService.addPet(petData);
      expect(pet).toBeFalsy();
      expect(err).toBeTruthy();
      expect(err).toMatch(/state code/);
    });
  });

  /////////////////////////////////////////////////
  async function setUpPet() {
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
      ownerId: owner._id.toString(),
    };
    const { pet } = await petService.addPet(petData);
    return pet;
  }

  describe("addImageToPet", () => {
    it("should add an image", async () => {
      pet = await setUpPet();
      const url = "https://petscorts-dev.s3.amazonaws.com/1604351627678";
      const { pet: petUpdated, err } = await petService.addImageToPet(
        pet._id,
        url
      );
      expect(err).toBeFalsy();
      expect(petUpdated.images).toBeTruthy();
      const found = petUpdated.images.find((image) => image.url === url);
      expect(found).toBeTruthy();
    });
  });

  describe("removeImageFromPet", () => {
    it("should remove an image", async () => {
      pet = await setUpPet();
      const url = "https://petscorts-dev.s3.amazonaws.com/1604351627678";
      const { pet: petUpdated, err } = await petService.addImageToPet(
        pet._id,
        url
      );

      const origImageId = petUpdated.images[petUpdated.images.length - 1]._id;
      const {
        pet: petUpdated2,
        imageId,
        err: err2,
      } = await petService.removeImageFromPet(petUpdated._id, origImageId);
      expect(err2).toBeFalsy();
      expect(petUpdated2.images.length).toBe(0);
      expect(imageId).toBeTruthy();
      expect(origImageId.toString()).toBe(imageId.toString());
    });
  });

  describe("updatePet", () => {
    it("should update values", async () => {
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
      petData.name = "RevisedName";
      petData.breed = "RevisedBreed";
      petData.petId = pet._id;
      const { pet: petRevised } = await petService.updatePet(petData);
      expect(petRevised.name).toBe(petData.name);
      expect(petRevised.breed).toBe(petData.breed.toLowerCase());
      // just sampling, not comprenhsive checking
    });

    it("should return an error if the id is bad", async () => {
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
      petData.petId = "asdfasdfsfasfasfasf";
      const { pet, err } = await petService.updatePet(petData);
      expect(pet).toBeFalsy();
      expect(err).toBeTruthy();
      expect(err).toMatch(/ObjectId/);
    });
  });

  ////////////////////////////////////////////////
  async function setUpBooking(pet) {
    const bookingData = {
      startAt: "01/01/2030",
      endAt: "01/05/2030",
      totalPrice: "4",
      days: 4,
      renterId: renter._id,
      ownerId: owner._id,
      petId: pet._id,
      //paymentId: payment._id,
    };

    const { booking } = await bookingService.addBooking(bookingData);
    return booking;
  }

  describe("addBookingToPet", () => {
    it("should add a booking", async () => {
      pet = await setUpPet();
      booking = await setUpBooking(pet);
      const { pet: petUpdated, err } = await petService.addBookingToPet(
        pet._id,
        booking._id
      );
      expect(err).toBeFalsy();
      expect(petUpdated.bookings).toBeTruthy();
      expect(petUpdated.bookings.length).toBe(1);
      const found = petUpdated.bookings.find(
        (bookingF) => booking._id.toString() === bookingF._id.toString()
      );
      expect(found).toBeTruthy();
    });

    it("should rollback if transaction is cancelled", async () => {
      const session = await transactionHelper.startTransaction();
      pet = await setUpPet();
      booking = await setUpBooking(pet);
      await petService.addBookingToPet(pet._id, booking._id, session);
      // ABORT!
      await transactionHelper.abortTransaction(session);
      const { pet: petUpdated, err } = await petService.getPetById(pet._id);
      expect(petUpdated.bookings.length).toBe(0);
    });
  });
});

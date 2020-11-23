const moment = require("moment");

//const mongoose = require("mongoose");

const MongoMemHelper = require("../../util/MongoMemHelper").MongoMemHelper;

const bookingService = require("../../../services/booking-service");
const Owner = require("../../../services/models/owner");
const Renter = require("../../../services/models/renter");
const Pet = require("../../../services/models/pet");
const Booking = require("../../../services/models/booking");

const dbHelper = new MongoMemHelper();

describe("/booking-service", () => {
  let newOwner, newRenter, newPet;

  beforeAll(async () => {
    await dbHelper.startDB();
    await setupOwnerRenterPet();
  });
  afterAll(async () => {
    await dbHelper.stopDB();
  });

  afterEach(async () => {
    await dbHelper.cleanup();
  });

  async function setupOwnerRenterPet() {
    // Setup Owner, Renter, and Pet!
    newOwner = new Owner({
      username: "owner1",
      fullname: "name 1",
      email: "owner1@own.com",
      auth0_sub: "auth0_sub",
    });
    await newOwner.save();

    newRenter = new Renter({
      username: "renter1",
      fullname: "renter 1",
      email: "renter1@own.com",
      auth0_sub: "setupOwnerRenterPet-auth0_sub",
    });
    await newRenter.save();

    newPet = new Pet({
      name: "Test1",
      city: "Providence",
      street: "1 Main St.",
      state: "RI",
      species: "Cat",
      breed: "mutt",
      description: "Small hairy beast.",
      dailyRentalRate: "100",
      location: { type: "Point", coordinates: [1, 2] },
      ownerId: newOwner._id,
    });
    await newPet.save();
  }

  describe("addBooking", () => {
    jest.setTimeout(10000);

    it("should add a booking", async () => {
      let bookingData = {
        startAt: "01/01/2030",
        endAt: "01/05/2030",
        totalPrice: "4",
        days: 4,
        renterId: newRenter._id,
        ownerId: newOwner._id,
        petId: newPet._id,
        //paymentId: payment._id,
      };

      // Store it
      const { booking: storedBooking, err } = await bookingService.addBooking(
        bookingData
      );
      expect(storedBooking._id).toBeTruthy();

      const startInput = moment(bookingData.startAt, "MM/DD/YYYY").format(
        "MM/DD/YYYY"
      );
      const startResult = moment(storedBooking.startAt, "MM/DD/YYYY").format(
        "MM/DD/YYYY"
      );
      expect(startInput).toBe(startResult);

      const endInput = moment(bookingData.endAt, "MM/DD/YYYY").format(
        "MM/DD/YYYY"
      );
      const endResult = moment(storedBooking.endAt, "MM/DD/YYYY").format(
        "MM/DD/YYYY"
      );
      expect(endInput).toBe(endResult);
    });
  });

  describe("getBookingById", () => {
    it("should retrieve booking", async () => {
      let bookingData = {
        startAt: "01/01/2030",
        endAt: "01/05/2030",
        totalPrice: "4",
        days: 4,
        renterId: newRenter._id,
        ownerId: newOwner._id,
        petId: newPet._id,
        //paymentId: payment._id,
      };

      // Store it
      const result = await bookingService.addBooking(bookingData);
      const storedBooking = result.booking;

      //  Retrieve it
      const result2 = await bookingService.getBookingById(storedBooking._id);
      const retrievedBooking = result2.booking;
      //console.log(retrievedBooking);
      expect(retrievedBooking._id).toBeTruthy();
      expect(storedBooking._id.toString()).toBe(
        retrievedBooking._id.toString()
      );
    });
  });

  describe("getBookingsForOwner", () => {
    it("should retrieve booking", async () => {
      let bookingData = {
        startAt: "01/01/2030",
        endAt: "01/05/2030",
        totalPrice: "4",
        days: 4,
        renterId: newRenter._id,
        ownerId: newOwner._id,
        petId: newPet._id,
        //paymentId: payment._id,
      };

      // Store it
      const result = await bookingService.addBooking(bookingData);
      const storedBooking = result.booking;

      // Get the booking by owner
      const { bookings, err } = await bookingService.getBookingsForOwner(
        newOwner._id
      );
      const retrievedBookingsByOwner = bookings;
      expect(retrievedBookingsByOwner[0]._id).toBeTruthy();

      const found = retrievedBookingsByOwner.find((booking) =>
        booking._id.equals(storedBooking._id)
      );
      expect(found).toBeTruthy();
    });
  });

  describe("getBookingsForRenter", () => {
    it("should retrieve booking", async () => {
      let bookingData = {
        startAt: "01/01/2030",
        endAt: "01/05/2030",
        totalPrice: "4",
        days: 4,
        renterId: newRenter._id,
        ownerId: newOwner._id,
        petId: newPet._id,
        //paymentId: payment._id,
      };

      // Store it
      const result = await bookingService.addBooking(bookingData);
      const storedBooking = result.booking;

      // Get the booking by owner
      const { bookings, err } = await bookingService.getBookingsForRenter(
        newRenter._id
      );
      const retrievedBookingsByRenter = bookings;
      expect(retrievedBookingsByRenter[0]._id).toBeTruthy();

      const found = retrievedBookingsByRenter.find((booking) =>
        booking._id.equals(storedBooking._id)
      );
      expect(found).toBeTruthy();
    });
  });

  describe("getBookingsForPet", () => {
    jest.setTimeout(10000);

    it("should retrieve booking", async () => {
      let bookingData = {
        startAt: "01/01/2030",
        endAt: "01/05/2030",
        totalPrice: "4",
        days: 4,
        renterId: newRenter._id,
        ownerId: newOwner._id,
        petId: newPet._id,
        //paymentId: payment._id,
      };

      // Store it
      const result = await bookingService.addBooking(bookingData);
      const storedBooking = result.booking;

      // Get the booking by pet
      const { bookings, err } = await bookingService.getBookingsForPet(
        newPet._id
      );
      const retrievedBookingsByOwner = bookings;
      expect(retrievedBookingsByOwner[0]._id).toBeTruthy();

      const found = retrievedBookingsByOwner.find((booking) =>
        booking._id.equals(storedBooking._id)
      );
      expect(found).toBeTruthy();
    });
  });

  //enum: ["PENDING", "ACTIVE", "CANCELLED"],
  describe("updateBookingStatus", () => {
    it("should update if in enum", async () => {
      let bookingData = {
        startAt: "01/01/2030",
        endAt: "01/05/2030",
        totalPrice: "4",
        days: 4,
        renterId: newRenter._id,
        ownerId: newOwner._id,
        petId: newPet._id,
      };

      // Store it
      const result = await bookingService.addBooking(bookingData);
      const storedBooking = result.booking;

      // Get the booking by owner
      const { booking, err } = await bookingService.updateBookingStatus(
        storedBooking._id,
        "ACTIVE"
      );

      expect(booking.status).toBe("ACTIVE");
    });
  });
});

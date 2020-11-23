require("jest");
var httpMocks = require("node-mocks-http");
const winston = require("winston");
const console = new winston.transports.Console();
winston.add(console);

const bookingData = require("./bookingData");
const bookingController = require("../../../controllers/booking-controller");
const bookingService = require("../../../services/booking-service");
const ownerService = require("../../../services/owner-service");
const renterService = require("../../../services/renter-service");
const paymentService = require("../../../services/payment-service");
const stripeService = require("../../../services/stripe-service");
const petService = require("../../../services/pet-service");
const transactionHelper = require("../../../services/util/transaction-helper");

/////////////////////getBookingDatesForPet
describe("getBookingDatesForPet", () => {
  it("should return empty for none", async () => {
    bookingService.getBookingsForPet = jest.fn().mockReturnValue({});
    var request = httpMocks.createRequest({
      params: {
        id: "000000000000000000000",
      },
    });
    var response = httpMocks.createResponse();

    await bookingController.getBookingDatesForPet(request, response);
    var result = response._getJSONData();
    expect(bookingService.getBookingsForPet).toHaveBeenCalled();
    expect(result.data.length).toBe(0);
  });

  it("should return dates for bookings", async () => {
    bookingService.getBookingsForPet = jest
      .fn()
      .mockReturnValue({ bookings: bookingData.twoBookings });
    var request = httpMocks.createRequest({
      params: {
        id: "000000000000000000000",
      },
    });
    var response = httpMocks.createResponse();

    await bookingController.getBookingDatesForPet(request, response);
    var result = response._getJSONData();
    expect(bookingService.getBookingsForPet).toHaveBeenCalled();
    expect(result.data.length).toBe(2);
    expect(result.data[0].startAt).toBe(bookingData.twoBookings[0].startAt);
    expect(result.data[0].endAt).toBe(bookingData.twoBookings[0].endAt);
  });
});

/////////////////////getBookingsForOwner
describe("getBookingsForOwner", () => {
  it("should return booking if authorized", async () => {
    const ownerId = "000000000000000000000000";
    bookingService.getBookingsForOwner = jest
      .fn()
      .mockReturnValue({ bookings: bookingData.twoBookings });
    ownerService.getOwnerIdForAuth0Sub = jest.fn().mockReturnValue({ ownerId });

    var request = httpMocks.createRequest({
      params: {
        id: ownerId,
      },
      user: {
        sub: "11111",
      },
    });
    var response = httpMocks.createResponse();

    await bookingController.getBookingsForOwner(request, response);
    var result = response._getJSONData();
    expect(bookingService.getBookingsForOwner).toHaveBeenCalled();
    expect(ownerService.getOwnerIdForAuth0Sub).toHaveBeenCalled();
    expect(result.data.length).toBe(2);
  });

  it("should return an error if the owner is different", async () => {
    const ownerId = "000000000000000000000000";
    ownerService.getOwnerIdForAuth0Sub = jest.fn().mockReturnValue({ ownerId });

    var request = httpMocks.createRequest({
      params: {
        id: ownerId + "junk",
      },
      user: {
        sub: "11111",
      },
    });
    var response = httpMocks.createResponse();

    await bookingController.getBookingsForOwner(request, response);
    var result = response._getJSONData();
    expect(ownerService.getOwnerIdForAuth0Sub).toHaveBeenCalled();
    expect(result.error).toBeTruthy();
    expect(result.error.code).toBe(403);
    expect(result.data).toBeFalsy();
  });
});

/////////////////////getBookingsForRenter
describe("getBookingsForRenter", () => {
  it("should return booking if authorized", async () => {
    const renterId = "000000000000000000000000";
    bookingService.getBookingsForRenter = jest
      .fn()
      .mockReturnValue({ bookings: bookingData.twoBookings });
    renterService.getRenterIdForAuth0Sub = jest
      .fn()
      .mockReturnValue({ renterId });

    var request = httpMocks.createRequest({
      params: {
        id: renterId,
      },
      user: {
        sub: "11111",
      },
    });
    var response = httpMocks.createResponse();

    await bookingController.getBookingsForRenter(request, response);
    var result = response._getJSONData();
    expect(bookingService.getBookingsForRenter).toHaveBeenCalled();
    expect(renterService.getRenterIdForAuth0Sub).toHaveBeenCalled();
    expect(result.data.length).toBe(2);
  });

  it("should return an error if the renter is different", async () => {
    const renterId = "000000000000000000000000";
    renterService.getRenterIdForAuth0Sub = jest
      .fn()
      .mockReturnValue({ renterId });

    var request = httpMocks.createRequest({
      params: {
        id: renterId + "junk",
      },
      user: {
        sub: "11111",
      },
    });
    var response = httpMocks.createResponse();

    await bookingController.getBookingsForRenter(request, response);
    var result = response._getJSONData();
    expect(renterService.getRenterIdForAuth0Sub).toHaveBeenCalled();
    expect(result.error).toBeTruthy();
    expect(result.error.code).toBe(403);
    expect(result.data).toBeFalsy();
  });
});

////////////////////////////////////////////////
// These setup a happy path.
// Each can be overridden to make a failure at any
// point in the booking process.
function setupMocksForCreateBooking(mockValues) {
  // renterService.getRenterByAuth0Sub
  renterService.getRenterByAuth0Sub = jest
    .fn()
    .mockReturnValue({ renter: { _id: mockValues.renterId } });

  //petService.getPetByIdWithOwnerAndBookings(petId);
  petService.getPetByIdWithOwnerAndBookings = jest.fn().mockReturnValue({
    pet: { _id: mockValues.petId, owner: { _id: mockValues.ownerId } },
  });

  //stripeService.createStripeCustomer(renter.email,paymentToken);
  stripeService.createStripeCustomer = jest
    .fn()
    .mockReturnValue({ customer: { id: mockValues.stripeCustomerId } });

  //transactionHelper.startTransaction()
  transactionHelper.startTransaction = jest.fn().mockReturnValue({});

  //renterService.updateSwipeCustomerId(
  renterService.updateSwipeCustomerId = jest
    .fn()
    .mockReturnValue({ renter: { _id: mockValues.renterId } });

  //paymentService.createPayment(
  paymentService.createPayment = jest
    .fn()
    .mockReturnValue({ payment: { _id: mockValues.stripePaymentId } });

  //bookingService.addBooking(

  bookingService.addBooking = jest
    .fn()
    .mockReturnValue({ booking: { _id: mockValues.bookingId } });

  //petService.addBookingToPet(

  petService.addBookingToPet = jest
    .fn()
    .mockReturnValue({ pet: { _id: mockValues.petId } });

  //renterService.addBookingToRenter(
  renterService.addBookingToRenter = jest
    .fn()
    .mockReturnValue({ booking: { _id: mockValues.bookingId } });

  //transactionHelper.commitTransaction
  transactionHelper.commitTransaction = jest.fn().mockReturnValue({});
  transactionHelper.abortTransaction = jest.fn().mockReturnValue({});
}

/////////////////////getBookingDatesForPet
describe("createBooking", () => {
  const mockValues = {
    renterId: "RID00000000",
    petId: "PID000000",
    bookingId: "BID777777",
    ownerId: "OID55555",
    stripeCustomerId: "SCID44444",
    stripePaymentId: "SPID33333",
  };
  const inputValues = {
    startAt: new Date(),
    endAt: new Date(),
    totalPrice: 1,
    days: 1,
    petId: "000000",
    paymentToken: "myToken",
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    setupMocksForCreateBooking(mockValues);
  });

  //////////////////////////////////////////////////////////////
  it("should create a booking on happy path", async () => {
    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);

    var result = response._getJSONData();
    //console.log(result);

    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).toHaveBeenCalled();
    expect(stripeService.createStripeCustomer).toHaveBeenCalled();
    expect(transactionHelper.startTransaction).toHaveBeenCalled();
    expect(renterService.updateSwipeCustomerId).toHaveBeenCalled();
    expect(paymentService.createPayment).toHaveBeenCalled();
    expect(bookingService.addBooking).toHaveBeenCalled();
    expect(petService.addBookingToPet).toHaveBeenCalled();
    expect(renterService.addBookingToRenter).toHaveBeenCalled();
    expect(transactionHelper.commitTransaction).toHaveBeenCalled();
    expect(transactionHelper.abortTransaction).not.toHaveBeenCalled();

    expect(result.data).toBeTruthy();
    expect(result.error).toBeFalsy();
    expect(response.statusCode).toBe(200);
    expect(result.data._id).toBe(mockValues.bookingId);
  });

  //////////////////////
  // Working through teh process, one failure after another

  // STEP 1
  it("should fail if there is no renter for sub", async () => {
    const mockValues = {
      renterId: "000000000",
    };

    renterService.getRenterByAuth0Sub = jest.fn();
    renterService.getRenterByAuth0Sub.mockReturnValue({
      renter: {},
    });

    renterService.getRenterByAuth0Sub = jest.fn().mockReturnValue({});

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);

    var result = response._getJSONData();
    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).not.toHaveBeenCalled();
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/renter/);
  });

  ////////////////////////////////////////////////
  // STEP 2
  it("should fail if there is no pet for id", async () => {
    petService.getPetByIdWithOwnerAndBookings = jest.fn().mockReturnValue({});

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);
    var result = response._getJSONData();
    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).toHaveBeenCalled();
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/No pet/);
  });

  ////////////////////////////////////////////////
  // STEP 3
  it("should fail if the owner is the renter", async () => {
    petService.getPetByIdWithOwnerAndBookings = jest.fn().mockReturnValue({
      pet: {
        _id: mockValues.petId,
        owner: { _id: mockValues.renterId },
      },
    });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);
    var result = response._getJSONData();
    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).toHaveBeenCalled();
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/your pet/);
  });

  ////////////////////////////////////////////////
  // STEP 4
  it("should fail if there is a booking with overlapping dates", async () => {
    petService.getPetByIdWithOwnerAndBookings = jest.fn().mockReturnValue({
      pet: {
        _id: mockValues.petId,
        owner: { _id: mockValues.ownerId },
        bookings: [{ startAt: mockValues.startAt, endAt: mockValues.endAt }],
      },
    });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);
    var result = response._getJSONData();
    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).toHaveBeenCalled();
    expect(stripeService.createStripeCustomer).not.toHaveBeenCalled();
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/no longer available/);
  });

  ////////////////////////////////////////////////
  // STEP 5
  it("should fail if stripe returns an error", async () => {
    stripeService.createStripeCustomer = jest
      .fn()
      .mockReturnValue({ err: "Couldn't authorize card." });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);
    var result = response._getJSONData();
    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).toHaveBeenCalled();
    expect(stripeService.createStripeCustomer).toHaveBeenCalled();
    expect(paymentService.createPayment).not.toHaveBeenCalled();
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/Cannot process payment/);
  });

  // STEP 6 is just starting a transaction
  ////////////////////////////////////////////////
  // STEP 7
  it("should abort if renter returns an error", async () => {
    renterService.updateSwipeCustomerId = jest
      .fn()
      .mockReturnValue({ err: "Couldn't update renter" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);
    var result = response._getJSONData();
    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).toHaveBeenCalled();
    expect(stripeService.createStripeCustomer).toHaveBeenCalled();
    expect(transactionHelper.startTransaction).toHaveBeenCalled();
    expect(renterService.updateSwipeCustomerId).toHaveBeenCalled();
    expect(transactionHelper.abortTransaction).toHaveBeenCalled();
    expect(transactionHelper.commitTransaction).not.toHaveBeenCalled();
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/Couldn't update renter/);
  });

  ////////////////////////////////////////////////
  // STEP 8
  it("should abort if payment service returns an error", async () => {
    paymentService.createPayment = jest
      .fn()
      .mockReturnValue({ err: "Couldn't create payment" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);
    var result = response._getJSONData();
    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).toHaveBeenCalled();
    expect(stripeService.createStripeCustomer).toHaveBeenCalled();
    expect(transactionHelper.startTransaction).toHaveBeenCalled();
    expect(renterService.updateSwipeCustomerId).toHaveBeenCalled();
    expect(paymentService.createPayment).toHaveBeenCalled();
    expect(bookingService.addBooking).not.toHaveBeenCalled();
    expect(transactionHelper.abortTransaction).toHaveBeenCalled();
    expect(transactionHelper.commitTransaction).not.toHaveBeenCalled();
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/payment/);
  });

  ////////////////////////////////////////////////
  // STEP 9
  it("should abort if booking service returns an error", async () => {
    bookingService.addBooking = jest
      .fn()
      .mockReturnValue({ err: "Couldn't create booking" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);
    var result = response._getJSONData();
    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).toHaveBeenCalled();
    expect(stripeService.createStripeCustomer).toHaveBeenCalled();
    expect(transactionHelper.startTransaction).toHaveBeenCalled();
    expect(renterService.updateSwipeCustomerId).toHaveBeenCalled();
    expect(paymentService.createPayment).toHaveBeenCalled();
    expect(bookingService.addBooking).toHaveBeenCalled();
    expect(transactionHelper.abortTransaction).toHaveBeenCalled();
    expect(transactionHelper.commitTransaction).not.toHaveBeenCalled();
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/booking/);
  });

  ////////////////////////////////////////////////
  // STEP 10
  it("should abort if booking service returns an error", async () => {
    petService.addBookingToPet = jest
      .fn()
      .mockReturnValue({ err: "Couldn't update pet" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);
    var result = response._getJSONData();
    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).toHaveBeenCalled();
    expect(stripeService.createStripeCustomer).toHaveBeenCalled();
    expect(transactionHelper.startTransaction).toHaveBeenCalled();
    expect(renterService.updateSwipeCustomerId).toHaveBeenCalled();
    expect(paymentService.createPayment).toHaveBeenCalled();
    expect(bookingService.addBooking).toHaveBeenCalled();
    expect(petService.addBookingToPet).toHaveBeenCalled();
    expect(renterService.addBookingToRenter).not.toHaveBeenCalled();
    expect(transactionHelper.abortTransaction).toHaveBeenCalled();
    expect(transactionHelper.commitTransaction).not.toHaveBeenCalled();
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/pet/);
  });

  ////////////////////////////////////////////////
  // STEP 11
  it("should abort if booking service returns an error", async () => {
    renterService.addBookingToRenter = jest
      .fn()
      .mockReturnValue({ err: "Couldn't update renter" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await bookingController.createBooking(request, response);
    var result = response._getJSONData();
    expect(renterService.getRenterByAuth0Sub).toHaveBeenCalled();
    expect(petService.getPetByIdWithOwnerAndBookings).toHaveBeenCalled();
    expect(stripeService.createStripeCustomer).toHaveBeenCalled();
    expect(transactionHelper.startTransaction).toHaveBeenCalled();
    expect(renterService.updateSwipeCustomerId).toHaveBeenCalled();
    expect(paymentService.createPayment).toHaveBeenCalled();
    expect(bookingService.addBooking).toHaveBeenCalled();
    expect(petService.addBookingToPet).toHaveBeenCalled();
    expect(renterService.addBookingToRenter).toHaveBeenCalled();
    expect(transactionHelper.abortTransaction).toHaveBeenCalled();
    expect(transactionHelper.commitTransaction).not.toHaveBeenCalled();
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/renter/);
  });
});

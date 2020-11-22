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
}

/////////////////////getBookingDatesForPet
describe("createBooking", () => {
  it("should create a booking on happy path", async () => {
    // createBooking is going to require a dozen mocks to test
    // There wasn't a good alternative.  Either way, it's a monster.
    const mockValues = {
      petId: "000000",
      renterId: "000000000",
      bookingId: "777777",
      ownerId: "55555",
      stripeCustomerId: "44444",
      stripePaymentId: "33333",
    };
    setupMocksForCreateBooking(mockValues);

    const inputValues = {
      startAt: new Date(),
      endAt: new Date(),
      totalPrice: 1,
      days: 1,
      petId: mockValues.petId,
      paymentToken: "myToken",
    };
    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    //This is hideous.

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

    expect(result.data).toBeTruthy();
    expect(result.error).toBeFalsy();
    expect(response.statusCode).toBe(200);
    expect(result.data._id).toBe(mockValues.bookingId);
  });
});

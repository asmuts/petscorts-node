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

// TODO createBooking is going to require a dozen mocks to test
// There wasn't a good alternative.  Either way, it's a monster.

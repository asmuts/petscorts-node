require("jest");
var httpMocks = require("node-mocks-http");
const winston = require("winston");

const bookingData = require("./bookingData");
const bookingController = require("../../../controllers/booking-controller");
const bookingService = require("../../../services/booking-service");

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

// TODO createBooking is going to require a dozen mocks to test
// There wasn't a good alternative.  Either way, it's a monster.

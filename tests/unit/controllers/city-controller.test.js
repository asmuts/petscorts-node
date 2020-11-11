require("jest");
var httpMocks = require("node-mocks-http");
const winston = require("winston");

const cityData = require("./cityData");
const cityController = require("../../../controllers/city-controller");
const cityService = require("../../../services/location/city-service");

// not much to test here.
describe("getLargestCities", () => {
  it("should return cities", async () => {
    cityService.getLargestCities = jest
      .fn()
      .mockReturnValue(cityData.twoCities);

    var request = httpMocks.createRequest({});
    var response = httpMocks.createResponse();

    await cityController.getLargestCities(request, response);
    var result = response._getJSONData();
    expect(cityService.getLargestCities).toHaveBeenCalled();
    expect(result.data.length).toBe(2);
  });
});

describe("getCitiesForPartialName", () => {
  it("should return cities for name", async () => {
    cityService.getCitiesForPartialName = jest
      .fn()
      .mockReturnValue(cityData.twoCities);
    var request = httpMocks.createRequest({
      params: {
        city: "New Y",
      },
    });
    var response = httpMocks.createResponse();
    winston.info = jest.fn();
    await cityController.getCitiesForPartialName(request, response);

    var result = response._getJSONData();
    expect(cityService.getCitiesForPartialName.mock.calls[0][0]).toBe("New Y");
    expect(cityService.getCitiesForPartialName).toHaveBeenCalled();
    expect(result.data.length).toBe(2);
  });

  it("should return 422 if none found", async () => {
    cityService.getCitiesForPartialName = jest.fn().mockReturnValue(null);
    var request = httpMocks.createRequest({
      params: {
        city: "New Y",
      },
    });
    var response = httpMocks.createResponse();
    await cityController.getCitiesForPartialName(request, response);
    var result = response._getJSONData();
    //console.log(result);
    expect(result.errors[0].title).toBe("City Error");
    expect(result.errors[0].detail).toMatch(/New Y/);
    expect(response.statusCode).toBe(422);
  });
});

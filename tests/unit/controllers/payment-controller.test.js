require("jest");
var httpMocks = require("node-mocks-http");
const winston = require("winston");
const console = new winston.transports.Console();
winston.add(console);
//var mongoose = require("mongoose");
//mongoose.Types.ObjectId();

const paymentController = require("../../../controllers/payment-controller");
const bookingService = require("../../../services/booking-service");
const ownerService = require("../../../services/owner-service");
const renterService = require("../../../services/renter-service");
const paymentService = require("../../../services/payment-service");
const stripeService = require("../../../services/stripe-service");
const petService = require("../../../services/pet-service");
const transactionHelper = require("../../../services/util/transaction-helper");

////////////////////////////////////////////////
// These setup a happy path.
// Each can be overridden to make a failure at any
// point in the booking process.
function setupMocksForConfirmPayment(mockValues) {
  paymentService.getPaymentById = jest.fn().mockReturnValue({
    payment: {
      _id: mockValues.paymentId,
      status: "PENDING",
      booking: { _id: mockValues.bookingId, totalPrice: mockValues.totalPrice },
      stripeCustomer: { default_source: "card" },
      renter: { _id: mockValues.renterId },
    },
  });

  ownerService.getOwnerIdForAuth0Sub = jest
    .fn()
    .mockReturnValue({ owner: { _id: mockValues.ownerId } });

  stripeService.charge = jest
    .fn()
    .mockReturnValue({ charge: { id: mockValues.stripeChargeId } });

  paymentService.setPaymentToPaid = jest.fn().mockReturnValue({
    payment: {
      _id: mockValues.paymentId,
    },
  });

  bookingService.updateBookingStatus = jest
    .fn()
    .mockReturnValue({ booking: { _id: mockValues.bookingId } });

  renterService.addToRevenue = jest
    .fn()
    .mockReturnValue({ renter: { _id: mockValues.renterId } });

  transactionHelper.startTransaction = jest.fn().mockReturnValue({});
  transactionHelper.commitTransaction = jest.fn().mockReturnValue({});
  transactionHelper.abortTransaction = jest.fn().mockReturnValue({});

  stripeService.refund = jest
    .fn()
    .mockReturnValue({ refund: { id: "refund" } });

  paymentService.setPaymentToRefunded = jest
    .fn()
    .mockReturnValue({ payment: { id: mockValues.paymentId } });
}

/////////////////////getBookingDatesForPet
describe("confirmPayment", () => {
  const mockValues = {
    renterId: "RID00000000",
    petId: "PID000000",
    bookingId: "BID777777",
    totalPrice: "100",
    ownerId: "OID55555",
    stripeCustomerId: "SCID44444",
    stripePaymentId: "SPID33333",
    stripeChargeId: "SCID33333",
    paymentId: "PAID222222",
  };
  const inputValues = {
    id: "SPID33333",
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    setupMocksForConfirmPayment(mockValues);
  });

  ////////////////////////////////////////////////////////
  // STEP 1
  it("should fail if payment not found", async () => {
    paymentService.getPaymentById = jest
      .fn()
      .mockReturnValue({ err: "Not found" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await paymentController.confirmPayment(request, response);
    var result = response._getJSONData();

    expect(paymentService.getPaymentById).toHaveBeenCalled();
    expect(result.error).toBeTruthy();
    expect(result.falsy).toBeFalsy();
    expect(response.statusCode).toBe(404);
    expect(result.error.message).toMatch(/payment/);
  });

  ///////////////////////////////////
  // STEP 2
  it("should fail if owner not found", async () => {
    ownerService.getOwnerIdForAuth0Sub = jest
      .fn()
      .mockReturnValue({ err: "Not found" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await paymentController.confirmPayment(request, response);
    var result = response._getJSONData();

    expect(paymentService.getPaymentById).toHaveBeenCalled();
    expect(ownerService.getOwnerIdForAuth0Sub).toHaveBeenCalled();
    expect(result.error).toBeTruthy();
    expect(result.falsy).toBeFalsy();
    expect(response.statusCode).toBe(500);
    expect(result.error.message).toMatch(/Not found/);
  });

  ///////////////////////////////////
  // STEP 3
  it("should fail if payment status isn't pending", async () => {
    paymentService.getPaymentById = jest.fn().mockReturnValue({
      payment: { _id: mockValues.paymentId, status: "REFUNDED" },
    });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await paymentController.confirmPayment(request, response);
    var result = response._getJSONData();

    expect(paymentService.getPaymentById).toHaveBeenCalled();
    expect(ownerService.getOwnerIdForAuth0Sub).toHaveBeenCalled();
    expect(stripeService.charge).not.toHaveBeenCalled();
    expect(result.error).toBeTruthy();
    expect(result.falsy).toBeFalsy();
    expect(response.statusCode).toBe(422);
    expect(result.error.message).toMatch(/not pending/);
  });

  ///////////////////////////////////
  // STEP 4
  it("should fail if stripe returns an error", async () => {
    stripeService.charge = jest
      .fn()
      .mockReturnValue({ err: "Couldn't charge card" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await paymentController.confirmPayment(request, response);
    var result = response._getJSONData();

    expect(paymentService.getPaymentById).toHaveBeenCalled();
    expect(ownerService.getOwnerIdForAuth0Sub).toHaveBeenCalled();
    expect(stripeService.charge).toHaveBeenCalled();
    expect(result.error).toBeTruthy();
    expect(result.falsy).toBeFalsy();
    expect(response.statusCode).toBe(422);
    expect(result.error.message).toMatch(/charge/);
  });

  // STEp 5 = begin transaction
  ///////////////////////////////////
  // STEP 6
  it("should fail if payment service returns an error", async () => {
    paymentService.setPaymentToPaid = jest
      .fn()
      .mockReturnValue({ err: "Couldn't save payment" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await paymentController.confirmPayment(request, response);
    var result = response._getJSONData();

    expect(paymentService.getPaymentById).toHaveBeenCalled();
    expect(ownerService.getOwnerIdForAuth0Sub).toHaveBeenCalled();
    expect(stripeService.charge).toHaveBeenCalled();
    expect(transactionHelper.startTransaction).toHaveBeenCalled();
    expect(paymentService.setPaymentToPaid).toHaveBeenCalled();
    expect(bookingService.updateBookingStatus).not.toHaveBeenCalled();
    expect(transactionHelper.abortTransaction).toHaveBeenCalled();
    expect(transactionHelper.commitTransaction).not.toHaveBeenCalled();
    expect(stripeService.refund).toHaveBeenCalled();
    expect(paymentService.setPaymentToRefunded).toHaveBeenCalled();

    expect(result.error).toBeTruthy();
    expect(result.falsy).toBeFalsy();
    expect(response.statusCode).toBe(422);
    expect(result.error.message).toMatch(/payment/);
  });

  ///////////////////////////////////
  // STEP 7
  it("should fail if booking service returns an error", async () => {
    bookingService.updateBookingStatus = jest
      .fn()
      .mockReturnValue({ err: "Couldn't update booking" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await paymentController.confirmPayment(request, response);
    var result = response._getJSONData();

    expect(paymentService.getPaymentById).toHaveBeenCalled();
    expect(ownerService.getOwnerIdForAuth0Sub).toHaveBeenCalled();
    expect(stripeService.charge).toHaveBeenCalled();
    expect(transactionHelper.startTransaction).toHaveBeenCalled();
    expect(paymentService.setPaymentToPaid).toHaveBeenCalled();
    expect(bookingService.updateBookingStatus).toHaveBeenCalled();
    expect(transactionHelper.abortTransaction).toHaveBeenCalled();
    expect(transactionHelper.commitTransaction).not.toHaveBeenCalled();
    expect(stripeService.refund).toHaveBeenCalled();
    expect(paymentService.setPaymentToRefunded).toHaveBeenCalled();

    expect(result.error).toBeTruthy();
    expect(result.data).toBeFalsy();
    expect(response.statusCode).toBe(422);
    expect(result.error.message).toMatch(/booking/);
  });

  ///////////////////////////////////
  // STEP 8
  it("should fail if renter service returns an error", async () => {
    renterService.addToRevenue = jest
      .fn()
      .mockReturnValue({ err: "Couldn't update renter" });

    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await paymentController.confirmPayment(request, response);
    var result = response._getJSONData();

    expect(paymentService.getPaymentById).toHaveBeenCalled();
    expect(ownerService.getOwnerIdForAuth0Sub).toHaveBeenCalled();
    expect(stripeService.charge).toHaveBeenCalled();
    expect(transactionHelper.startTransaction).toHaveBeenCalled();
    expect(paymentService.setPaymentToPaid).toHaveBeenCalled();
    expect(bookingService.updateBookingStatus).toHaveBeenCalled();
    expect(renterService.addToRevenue).toHaveBeenCalled();
    expect(transactionHelper.abortTransaction).toHaveBeenCalled();
    expect(transactionHelper.commitTransaction).not.toHaveBeenCalled();
    expect(stripeService.refund).toHaveBeenCalled();
    expect(paymentService.setPaymentToRefunded).toHaveBeenCalled();

    expect(result.error).toBeTruthy();
    expect(result.data).toBeFalsy();
    expect(response.statusCode).toBe(422);
    expect(result.error.message).toMatch(/renter/);
  });

  ///////////////////////////////////
  // STEP 9
  it("should succeed if no errors", async () => {
    var request = httpMocks.createRequest({
      params: inputValues,
      user: "auth0-sub",
    });
    var response = httpMocks.createResponse();

    await paymentController.confirmPayment(request, response);
    var result = response._getJSONData();

    expect(paymentService.getPaymentById).toHaveBeenCalled();
    expect(ownerService.getOwnerIdForAuth0Sub).toHaveBeenCalled();
    expect(stripeService.charge).toHaveBeenCalled();
    expect(transactionHelper.startTransaction).toHaveBeenCalled();
    expect(paymentService.setPaymentToPaid).toHaveBeenCalled();
    expect(bookingService.updateBookingStatus).toHaveBeenCalled();
    expect(renterService.addToRevenue).toHaveBeenCalled();
    expect(transactionHelper.commitTransaction).toHaveBeenCalled();

    expect(transactionHelper.abortTransaction).not.toHaveBeenCalled();
    expect(stripeService.refund).not.toHaveBeenCalled();
    expect(paymentService.setPaymentToRefunded).not.toHaveBeenCalled();

    expect(result.data).toBeTruthy();
    expect(result.error).toBeFalsy();
    expect(response.statusCode).toBe(200);
  });
});

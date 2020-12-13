const stripeService = require("../../../services/stripe-service");
require("../../../startup/logging")();

// Stripe testing data
// https://stripe.com/docs/testing
// test visa 4242424242424242, any cvc, any future date
// token: tok_visa
// payment method: pm_card_visa

describe("/stripe-service", () => {
  beforeAll(async () => {
    //
  });
  afterAll(async () => {
    //
  });

  //    { err: 'Invalid string: {:err=>"tokenId is not defined"}' }
  describe("createStripeCustomer", () => {
    it("should create a customer for valid token", async () => {
      const token = "tok_visa";
      const email = "testemail@test.com";
      const { customer, err } = await stripeService.createStripeCustomer(
        email,
        token
      );
      //console.log(customer);

      expect(err).toBeFalsy();
      expect(customer).toBeTruthy();
      expect(customer.email).toBe(email);
    });
  });

  describe("charge", () => {
    it("should charge for a valid customer", async () => {
      const token = "tok_visa";
      const email = "testemail2@test.com";
      const { customer, err } = await stripeService.createStripeCustomer(
        email,
        token
      );
      expect(customer).toBeTruthy();

      const { charge, err: errCharge } = await stripeService.charge(
        Number(10.01),
        customer.id,
        customer.default_source
      );
      //console.log(charge);
      expect(errCharge).toBeFalsy();
      expect(charge).toBeTruthy();
    });
  });

  describe("refund", () => {
    it("should refund for a successful charge", async () => {
      const token = "tok_visa";
      const email = "testemail3@test.com";
      const { customer, err } = await stripeService.createStripeCustomer(
        email,
        token
      );
      expect(customer).toBeTruthy();

      const { charge, err: errCharge } = await stripeService.charge(
        Number(10.01),
        customer.id,
        customer.default_source
      );

      const { refund, errRefund } = await stripeService.refund(charge.id);
      //console.log(refund);
      expect(errRefund).toBeFalsy();
      expect(refund).toBeTruthy();
    });

    // test some of the retry logic, but this is better done with mocks
    // in a unit test
    it("should fail for a previsouly refunded charge", async () => {
      const chargeId = "ch_1HmTYUKSKj65FII0yJilxuwd";
      const { refund, err: errRefund } = await stripeService.refund(chargeId);
      //console.log(refund);
      expect(refund).toBeFalsy();
      expect(errRefund).toBeTruthy();
      expect(errRefund).toMatch(/ times to refund charge/);
    });
  });
});

// TODO test error scenarios

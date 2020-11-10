// This service is responsible for communicating with Stripe
// Keep all API stripe code here

// Stripe testing data
// https://stripe.com/docs/testing
// test visa 4242424242424242, any cvc, any future date
// token: tok_visa
// payment method: pm_card_visa

const config = require("config");
const stripe = require("stripe")(config.get("stripe_secret_key"));

// TODO MOVE TO STRIPE SERVICE!
exports.createStripeCustomer = async (renter, token) => {
  try {
    const customer = await stripe.customers.create({
      source: tokenId,
      email: renter.email,
    });
    if (!customer) {
      throw new Error("Stripe did not return a customer.");
    }
    return { customer };
  } catch (err) {
    winston.error(err);
    return { err: err.message };
  }
};

exports.charge = async function (amount, stripeCustomerId) {
  try {
    const charge = await stripe.charges.create({
      amount: amount,
      currency: "usd",
      customer: stripeCustomerId,
    });
    if (!charge) {
      throw new Error("Stripe did not return a charge.");
    }
    return { charge };
  } catch (err) {
    winston.error(err);
    return { err: err.message };
  }
};

const winston = require("winston");

// This service is responsible for communicating with Stripe
// Keep all API stripe code here

// Stripe testing data
// https://stripe.com/docs/testing
// test visa 4242424242424242, any cvc, any future date
// token: tok_visa
// payment method: pm_card_visa

const config = require("config");
const stripe = require("stripe")(config.get("stripe_secret_key"));

// Should store the entire customer object, not just the id
exports.createStripeCustomer = async (email, token) => {
  try {
    const customer = await stripe.customers.create({
      source: token,
      email: email,
    });
    if (!customer) {
      throw new Error("Stripe did not return a customer.");
    }
    winston.info(`Stripe customer.id ${customer.id}`);
    return { customer };
  } catch (err) {
    winston.info(err.message);
    return { err: err.message };
  }
};

//https://stripe.com/docs/api/charges
// "type":"StripeInvalidRequestError",
// Stripe only takes integers.  Multiple the dollars.cents *100
// Make sure that the caller understands this.
// perhaps seprate out dollars and cents
//- default_source is returned with the customer object
// - it should just be the token used to create the customer
// but I've seen that not work correctly
exports.charge = async function (
  amountInDollars,
  stripeCustomerId,
  default_source
) {
  try {
    const charge = await stripe.charges.create({
      amount: amountInDollars * 100,
      currency: "usd",
      customer: stripeCustomerId,
      source: default_source,
    });
    if (!charge) {
      throw new Error("Stripe did not return a charge.");
    }
    if (charge.type && charge.type.includes("Error")) {
      const message = charge.type;
      if (charge.raw && charge.raw.message) {
        message.concat(": " + charge.raw.message);
      }
      throw new Error(message);
    }
    return { charge };
  } catch (err) {
    winston.info(err.message);
    return { err: err.message };
  }
};

// I made some crude retry logic here
// This should be pushed to a queue and dealt with
// The entire booking and payment API should probably be done in Java
// I'm hogging the server here. We at least need to break this out
// into a seperate microservice.
exports.refund = async function (chargeId) {
  let errorMessage = "";
  const maxAttempts = 3; // temporary

  let attempts;
  for (attempts = 0; attempts < maxAttempts; attempts++) {
    try {
      const refund = await stripe.refunds.create({ charge: chargeId });

      if (!refund) {
        throw new Error("Stripe did not return a refund. Attempt " + attempt);
      }
      if (refund.type && refund.type.includes("Error")) {
        const message = refund.type;
        if (refund.raw && refund.raw.message) {
          message.concat(": " + refund.raw.message + "Attempt " + attempt);
        }
        throw new Error(message);
      }

      return { refund }; // Hurray!!!!!!! Let's ge out of here!
    } catch (err) {
      // THIS IS REALLY BAD.
      // In the real world . . .  put this on a queue to retry . . .
      winston.log("error", err.message);
      errorMessage.concat(err.message);
    }
  }

  // IF WE GOT HERE. WE FAILED! BAD STUFF
  const message = `Tried ${attempts} times to refund charge ${chargeId} and failed! I'm so sorry. I hoped this would never happen.`;
  winston.log("error", message);
  return { err: message.concat(errorMessage) };
};

// TODO implement refund!

///////////////////////////////////////////////////////////

/* ex
        customer: {
          id: 'cus_INBtDYgU5RTWVA',
          object: 'customer',
          address: null,
          balance: 0,
          created: 1605132617,
          currency: null,
          default_source: 'card_1HmRW9KSKj65FII03EanODoK',
          delinquent: false,
          description: null,
          discount: null,
          email: 'testemail@test.com',
          invoice_prefix: '1784B20D',
          invoice_settings: { custom_fields: null, default_payment_method: null, footer: null },
          livemode: false,
          metadata: {},
          name: null,
          next_invoice_sequence: 1,
          phone: null,
          preferred_locales: [],
          shipping: null,
          tax_exempt: 'none'
        }
*/

/*
amount
positive integer or zero
Amount intended to be collected by this payment.
A positive integer representing how much to charge in
the smallest currency unit (e.g., 100 cents to charge $1.00 or 100
  to charge ¥100, a zero-decimal currency).
  The minimum amount is $0.50 US or equivalent in charge currency.
  The amount value supports up to eight digits
(e.g., a value of 99999999 for a USD charge of $999,999.99).
*/

/*Part of a  success response:

 console.log
      {
        id: 'ch_1HmS3UKSKj65FII04iWlwzsF',
        object: 'charge',
        amount: 1001,
        amount_captured: 1001,
        amount_refunded: 0,
        application: null,
        application_fee: null,
        application_fee_amount: null,
        balance_transaction: 'txn_1HmS3UKSKj65FII0fjJzeSIW',
        billing_details: {
          address: {
*/

/*
{"type":"StripeInvalidRequestError",
"raw":{"code":"parameter_missing",
"doc_url":"https://stripe.com/docs/error-codes/parameter-missing",
"message":"Must provide source or customer.",
"type":"invalid_request_error",
"headers":{"server":"nginx","date":"Wed, 11 Nov 2020 22:19:49 GMT",
"content-type":"application/json","content-length":"213","connection":
"keep-alive","access-control-allow-credentials":"true",
"access-control-allow-methods":"GET, POST, HEAD, OPTIONS, DELETE",
"access-control-allow-origin":"*","access-control-expose-headers":
"Request-Id, Stripe-Manage-Version, X-Stripe-External-Auth-Required,
X-Stripe-Privileged-Session-Required","access-control-max-age":"300",
"cache-control":"no-cache, no-store","request-id":"req_eCInboxXadNpR6",
"stripe-version":"2020-08-27","strict-transport-security":
"max-age=31556926; includeSubDomains; preload"},"statusCode":400,
"requestId":"req_eCInboxXadNpR6"},"rawType":"invalid_request_error",
"code":"parameter_missing",
"doc_url":"https://stripe.com/docs/error-codes/parameter-missing",
"headers":{"server":"nginx","date":"Wed, 11 Nov 2020 22:19:49 GMT",
"content-type":"application/json","content-length":"213",
"connection":"keep-alive","access-control-allow-credentials":"true",
"access-control-allow-methods":"GET, POST, HEAD, OPTIONS, DELETE",
"access-control-allow-origin":"*","access-control-expose-headers":
"Request-Id, Stripe-Manage-Version, X-Stripe-External-Auth-Required,
X-Stripe-Privileged-Session-Required","access-control-max-age":"300",
"cache-control":"no-cache, no-store","request-id":"req_eCInboxXadNpR6",
"stripe-version":"2020-08-27","strict-transport-security":
"max-age=31556926; includeSubDomains; preload"},"requestId":
"req_eCInboxXadNpR6","statusCode":400,"level":"info"}
*/

/* ex refund res
 {
        id: 're_1HmTYVKSKj65FII0L22sp2uL',
        object: 'refund',
        amount: 1001,
        balance_transaction: 'txn_1HmTYVKSKj65FII08UJTNoFk',
        charge: 'ch_1HmTYUKSKj65FII0yJilxuwd',
        created: 1605140451,
        currency: 'usd',
        metadata: {},
        payment_intent: null,
        reason: null,
        receipt_number: null,
        source_transfer_reversal: null,
        status: 'succeeded',
        transfer_reversal: null
      }
*/

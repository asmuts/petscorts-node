const config = require("config");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

module.exports = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${config.get("AUTH0_DOMAIN")}/.well-known/jwks.json`,
  }),

  audience: config.get("AUTH0_API_IDENTIFIER"),
  issuer: `https://${config.get("AUTH0_DOMAIN")}/`,
  algorithms: ["RS256"],
});

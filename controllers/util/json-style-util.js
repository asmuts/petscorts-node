// This is an initial step towards standardizing
// the output a little.
// I want it to be closer to the Google JSON standard
// https://google.github.io/styleguide/jsoncstyleguide.xml

// this is probably better done in middleware
exports.payload = function (data) {
  const payload = { apiVersion: "1.0" };
  payload.data = data;
  return payload;
};

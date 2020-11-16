const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const renterSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: [4, "Too short. Min is 4"],
    maxlength: [32, "Too long. Max is 32"],
  },
  fullname: {
    type: String,
    required: true,
    minlength: [4, "Too short. Min is 4"],
    maxlength: [100, "Too long. Max is 100"],
    trim: true,
  },
  email: {
    type: String,
    minlength: [4, "Too short. Min is 4"],
    maxlength: [64, "Too long. Max is 64"],
    unique: true,
    lowercase: true,
    required: "Email is required",
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/],
  },
  auth0_sub: {
    type: String,
    minlength: [4, "Too shart. Min is 4"],
    maxlength: [128, "Too long. Max is 128"],
    unique: true,
    lowercase: true,
    required: "auth0_sub is required",
  },
  revenue: Number,
  stripeCustomerId: String,
  bookings: [{ type: Schema.Types.ObjectId, ref: "Booking" }],
});

//https://community.auth0.com/t/is-256-a-safe-max-length-for-a-user-id/34040/9

module.exports = mongoose.model("Renter", renterSchema);

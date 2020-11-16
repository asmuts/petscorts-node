const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ownerSchema = new Schema({
  username: {
    type: String,
    minlength: [4, "Too shart. Min is 4"],
    maxlength: [32, "Too long. Max is 32"],
  },
  fullname: {
    type: String,
    minlength: [4, "Too shart. Min is 4"],
    maxlength: [64, "Too long. Max is 64"],
  },
  email: {
    type: String,
    minlength: [4, "Too shart. Min is 4"],
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
    //required: "auth0_sub is required",
  },
  pets: [{ type: Schema.Types.ObjectId, ref: "Pet" }],
});

// consider linking back to bookings
//bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }]

//https://community.auth0.com/t/is-256-a-safe-max-length-for-a-user-id/34040/9

module.exports = mongoose.model("Owner", ownerSchema);

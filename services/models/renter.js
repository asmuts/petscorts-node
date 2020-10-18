const mongoose = require("mongoose");

const renterSchema = new mongoose.Schema({
  username: {
    type: String,
    min: [4, "Too short. Min is 4"],
    max: [32, "Too long. Max is 32"],
  },
  fullname: {
    type: String,
    required: true,
    min: [4, "Too short. Min is 4"],
    max: [100, "Too long. Max is 100"],
    trim: true,
  },
  email: {
    type: String,
    min: [4, "Too short. Min is 4"],
    max: [52, "Too long. Max is 52"],
    unique: true,
    lowercase: true,
    required: "Email is required",
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/],
  },
});

module.exports = mongoose.model("Renter", renterSchema);

const mongoose = require("mongoose");
//const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

const ownerSchema = new Schema({
  username: {
    type: String,
    min: [4, "Too shart. Min is 4"],
    max: [32, "Too long. Max is 32"],
  },
  fullname: {
    type: String,
    min: [4, "Too shart. Min is 4"],
    max: [32, "Too long. Max is 32"],
  },
  email: {
    type: String,
    min: [4, "Too shart. Min is 4"],
    max: [32, "Too long. Max is 32"],
    unique: true,
    lowercase: true,
    required: "Email is required",
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/],
  },
  pets: [{ type: Schema.Types.ObjectId, ref: "Pet" }],
});

module.exports = mongoose.model("Owner", ownerSchema);

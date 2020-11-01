const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  startAt: { type: Date, required: "Starting date is required" },
  endAt: { type: Date, required: "Ending date is required" },
  totalPrice: Number,
  days: Number,
  createdAt: { type: Date, default: Date.now },
  renter: { type: Schema.Types.ObjectId, ref: "Renter" },
  pet: { type: Schema.Types.ObjectId, ref: "Pet" },
  status: { type: String, default: "pending" },
});

module.exports = mongoose.model("Booking", bookingSchema);

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// denormalized owner to make lookups by owner easier
const bookingSchema = new Schema({
  startAt: { type: Date, required: "Starting date is required" },
  endAt: { type: Date, required: "Ending date is required" },
  totalPrice: Number,
  days: Number,
  createdAt: { type: Date, default: Date.now },
  renter: { type: Schema.Types.ObjectId, ref: "Renter" },
  owner: { type: Schema.Types.ObjectId, ref: "Owner" },
  pet: { type: Schema.Types.ObjectId, ref: "Pet" },
  payment: { type: Schema.Types.ObjectId, ref: "Payment" },
  status: {
    type: String,
    enum: ["PENDING", "ACTIVE", "CANCELLED"],
    default: "PENDING",
  },
});

module.exports = mongoose.model("Booking", bookingSchema);

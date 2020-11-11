const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  renter: { type: Schema.Types.ObjectId, ref: "Renter" },
  renterStripeCustomerId: String,
  owner: { type: Schema.Types.ObjectId, ref: "Owner" },
  booking: { type: Schema.Types.ObjectId, ref: "Booking" },
  amount: Number,
  tokenId: String,
  charge: Schema.Types.Mixed,
  status: {
    type: String,
    enum: ["PENDING", "DECLINED", "PAID"],
    default: "PENDING",
  },
});

module.exports = mongoose.model("Payment", paymentSchema);

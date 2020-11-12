const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  renter: { type: Schema.Types.ObjectId, ref: "Renter" },
  stripeCustomerId: String,
  stripeCustomer: Schema.Types.Mixed,
  owner: { type: Schema.Types.ObjectId, ref: "Owner" },
  booking: { type: Schema.Types.ObjectId, ref: "Booking" },
  amount: Number,
  tokenId: String,
  stripeChageId: String,
  stripeCharge: Schema.Types.Mixed,
  stripeRefundId: String,
  status: {
    type: String,
    enum: ["PENDING", "DECLINED", "PAID", "REFUNDED"],
    default: "PENDING",
  },
});

module.exports = mongoose.model("Payment", paymentSchema);

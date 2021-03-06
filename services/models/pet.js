const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// TODO add in unavailable days
// or make a separate model akin to booking
// default to available? or make it optional
const petSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: [128, "Too long. Max is 128 chars."],
  },
  city: { type: String, required: true, lowercase: true },
  street: {
    type: String,
    required: true,
    lowercase: true,
    minlength: [4, "Too short. Min is 4 cars."],
  },
  state: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 2,
    // note, this is case sensitive with a lowercase l!
    maxlength: [2, "Use state code, not name"],
  },
  species: { type: String, required: true, lowercase: true },
  breed: { type: String, required: false, lowercase: true },
  images: [
    {
      url: { type: String, required: true, lowercase: true },
      isFeatured: { type: Boolean, default: Boolean.false },
      isPublic: { type: Boolean, default: Boolean.true },
    },
  ],
  description: { type: String, required: true },
  dailyRentalRate: Number,
  createdAt: { type: Date, default: Date.now },
  owner: { type: Schema.Types.ObjectId, ref: "Owner" },
  location: {
    type: { type: String, required: true },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  bookings: [{ type: Schema.Types.ObjectId, ref: "Booking" }],
  status: {
    type: String,
    enum: ["ACTIVE", "HIDDEN", "ARCHIVED"],
    default: "ACTIVE",
  },
});

petSchema.index({ location: "2dsphere" });
//petSchema.index({ "owner._id": 1 });

module.exports = mongoose.model("Pet", petSchema);

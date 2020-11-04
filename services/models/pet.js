const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// TODO add in unavailable days
// or make a separate model akin to booking
// default to available? or make it optional
const petSchema = new Schema({
  name: {
    type: String,
    required: true,
    max: [128, "Too long. Max is 128 chars."],
  },
  city: { type: String, required: true, lowercase: true },
  street: {
    type: String,
    required: true,
    lowercase: true,
    min: [4, "Too short. Min is 4 cars."],
  },
  state: { type: String, required: true, uppercase: true, min: 2, max: 2 },
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
  owner: {
    type: new mongoose.Schema({
      _id: { type: Schema.Types.ObjectId, ref: "Owner" },
      fullname: {
        type: String,
        required: true,
      },
    }),
    required: true,
  },
  location: {
    type: { type: String },
    coordinates: [],
  },
});

petSchema.index({ location: "2dsphere" });
petSchema.index({ "owner._id": 1 });

module.exports = mongoose.model("Pet", petSchema);

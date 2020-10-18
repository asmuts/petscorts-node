const mongoose = require("mongoose");

const Schema = mongoose.Schema;

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
  dailyRate: Number,
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
});

module.exports = mongoose.model("Pet", petSchema);

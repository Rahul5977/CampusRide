import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    googleId: { type: String, required: true, unique: true }, //OAuth
    avatar: { type: String },
    phone: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    hostel: {
      type: String,
      enum: [
        "Kanhar (BH1)",
        "Gopad (BH2)",
        "Indravati (GH1)",
        "Shivnath (MSH)",
        "Day Scholar",
      ],
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);

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
    googleId: { type: String, required: true, unique: true },
    avatar: { type: String },
    phone: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    hostel: {
      type: String,
      enum: [
        "Kanhar (BH1)",
        "Gopad (BH2)",
        "Indravati (GH1)",
        "Shivnath (MSH)",
        "Day Scholar",
      ],
    },
    year: { type: String, trim: true, maxlength: 32 },
    branch: { type: String, trim: true, maxlength: 64 },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);

import mongoose from "mongoose";
import objId from "mongoose.schema.Types.ObjectId";

const groupSchema = new mongoose.Schema(
  {
    creator: {
      type: objId,
      ref: "User",
      required: true,
    },
    destination: {
      type: String,
      required: true,
      enum: ["Durg Junction", "Raipur Station", "Swami Vivekananda Airport"],
    },
    meetupPoint: {
      type: String,
      enum: ["Gate 1", "Gate 2", "Kanhar Parking", "Mess Parking", "Other"],
      default: "Gate 2",
    },
    trainNumber: { type: String },

    departureDate: { type: Date, required: true },
    timeWindowStart: { type: Date, required: true },
    timeWindowEnd: { type: Date, required: true },

    genderPreference: {
      type: String,
      enum: ["Any", "Same Gender Only"],
      default: "Any",
    },
    luggage: {
      type: String,
      enum: ["Light (Backpacks)", "Heavy (Trolleys)"],
      required: true,
    },

    // Capacity tracking
    capacity: { type: Number, default: 4 },
    currentMembers: { type: Number, default: 1 },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    status: {
      type: String,
      enum: ["Open", "Full", "Departed", "Cancelled"],
      default: "Open",
    },
  },
  { timestamps: true },
);

// Ensures rapid searching during high-traffic spikes
groupSchema.index({ destination: 1, departureDate: 1, status: 1 });

export default mongoose.model("Group", groupSchema);

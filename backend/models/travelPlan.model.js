import mongoose from "mongoose";

const DESTINATION_ENUM = [
  "Durg Junction",
  "Raipur Station",
  "Swami Vivekananda Airport",
];

const MEETUP_ENUM = [
  "Gate 1",
  "Gate 2",
  "Kanhar Parking",
  "Mess Parking",
  "Other",
];

const travelPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: { type: String, trim: true, maxlength: 120 },
    destination: {
      type: String,
      required: true,
      enum: DESTINATION_ENUM,
    },
    transportType: {
      type: String,
      enum: ["Train", "Flight"],
      required: true,
    },
    trainNumber: { type: String, trim: true },
    trainName: { type: String, trim: true },
    flightNumber: { type: String, trim: true },
    departureDate: { type: Date, required: true },
    departureTime: { type: Date, required: true },
    campusLeaveTime: { type: Date, required: true },
    meetupPoint: {
      type: String,
      enum: MEETUP_ENUM,
      default: "Gate 2",
    },
    status: {
      type: String,
      enum: ["Upcoming", "Completed", "Cancelled"],
      default: "Upcoming",
    },
    isTemplate: { type: Boolean, default: false },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
  },
  { timestamps: true },
);

travelPlanSchema.index({ userId: 1, departureDate: 1 });
travelPlanSchema.index(
  { destination: 1, departureDate: 1, visibility: 1 },
  { partialFilterExpression: { visibility: "public" } },
);
travelPlanSchema.index({ trainNumber: 1 });
travelPlanSchema.index({ trainName: "text" });

export default mongoose.model("TravelPlan", travelPlanSchema);

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

const GROUP_STATUS_ENUM = [
  "Created",
  "Open",
  "Full",
  "Locked",
  "Booking",
  "Departed",
  "Completed",
  "Cancelled",
];

const pendingRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, maxlength: 500, default: "" },
    requestedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const groupSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    travelPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelPlan",
    },
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
    meetupPoint: {
      type: String,
      enum: MEETUP_ENUM,
      default: "Gate 2",
    },
    departureDate: { type: Date, required: true },
    transportDepartureTime: { type: Date, required: true },
    campusLeaveTime: { type: Date, required: true },
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
    capacity: { type: Number, default: 5 },
    currentMembers: { type: Number, default: 1 },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pendingRequests: [pendingRequestSchema],
    status: {
      type: String,
      enum: GROUP_STATUS_ENUM,
      default: "Open",
    },
  },
  { timestamps: true },
);

groupSchema.index({ destination: 1, departureDate: 1, status: 1 });
groupSchema.index({ trainNumber: 1 });
groupSchema.index({ trainName: "text" });

export default mongoose.model("Group", groupSchema);

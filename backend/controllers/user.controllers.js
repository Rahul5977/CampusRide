import mongoose from "mongoose";
import User from "../models/users.model.js";
import TravelPlan from "../models/travelPlan.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const patchUserProfile = async (req, res) => {
  try {
    const allowed = ["phone", "gender", "hostel", "year", "branch"];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update.",
      });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-__v");

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("patchUserProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating profile.",
    });
  }
};

export const createTravelPlan = async (req, res) => {
  try {
    const plan = await TravelPlan.create({
      ...req.body,
      userId: req.user._id,
    });
    return res.status(201).json({ success: true, plan });
  } catch (error) {
    console.error("createTravelPlan:", error);
    return res.status(500).json({
      success: false,
      message: "Error saving travel plan.",
    });
  }
};

export const listTravelPlans = async (req, res) => {
  try {
    const plans = await TravelPlan.find({ userId: req.user._id }).sort({
      departureDate: 1,
    });
    return res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error("listTravelPlans:", error);
    return res.status(500).json({
      success: false,
      message: "Error listing travel plans.",
    });
  }
};

export const updateTravelPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    if (!isValidId(planId)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }

    const updates = { ...req.body };
    delete updates.userId;

    const plan = await TravelPlan.findOneAndUpdate(
      { _id: planId, userId: req.user._id },
      updates,
      { new: true, runValidators: true },
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found.",
      });
    }

    return res.status(200).json({ success: true, plan });
  } catch (error) {
    console.error("updateTravelPlan:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating travel plan.",
    });
  }
};

export const deleteTravelPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    if (!isValidId(planId)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }

    const result = await TravelPlan.findOneAndDelete({
      _id: planId,
      userId: req.user._id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Plan not found.",
      });
    }

    return res.status(200).json({ success: true, message: "Plan deleted." });
  } catch (error) {
    console.error("deleteTravelPlan:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting travel plan.",
    });
  }
};

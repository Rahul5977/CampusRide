import mongoose from "mongoose";
import Group from "../models/groups.model.js";
import TravelPlan from "../models/travelPlan.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const STATUS_TRANSITIONS = {
  Created: ["Open", "Cancelled"],
  Open: ["Locked", "Cancelled"],
  Full: ["Locked", "Cancelled"],
  Locked: ["Booking", "Cancelled"],
  Booking: ["Departed", "Cancelled"],
  Departed: ["Completed"],
  Completed: [],
  Cancelled: [],
};

async function hydrateFromTravelPlan(travelPlanId, userId) {
  if (!travelPlanId || !isValidId(travelPlanId)) return null;
  return TravelPlan.findOne({
    _id: travelPlanId,
    userId,
  }).lean();
}

export const createGroup = async (req, res) => {
  try {
    const allowedKeys = [
      "travelPlanId",
      "destination",
      "transportType",
      "trainNumber",
      "trainName",
      "flightNumber",
      "meetupPoint",
      "departureDate",
      "transportDepartureTime",
      "campusLeaveTime",
      "timeWindowStart",
      "timeWindowEnd",
      "genderPreference",
      "luggage",
      "capacity",
    ];

    const body = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) body[key] = req.body[key];
    }

    let plan = null;
    if (body.travelPlanId) {
      plan = await hydrateFromTravelPlan(body.travelPlanId, req.user._id);
      if (!plan) {
        return res.status(400).json({
          success: false,
          message: "travelPlanId not found or does not belong to you.",
        });
      }
      body.destination = body.destination ?? plan.destination;
      body.transportType = body.transportType ?? plan.transportType;
      body.trainNumber = body.trainNumber ?? plan.trainNumber;
      body.trainName = body.trainName ?? plan.trainName;
      body.flightNumber = body.flightNumber ?? plan.flightNumber;
      body.departureDate = body.departureDate ?? plan.departureDate;
      body.transportDepartureTime =
        body.transportDepartureTime ?? plan.departureTime;
      body.campusLeaveTime = body.campusLeaveTime ?? plan.campusLeaveTime;
      body.meetupPoint = body.meetupPoint ?? plan.meetupPoint;
      body.timeWindowStart = body.timeWindowStart ?? body.campusLeaveTime;
      body.timeWindowEnd = body.timeWindowEnd ?? body.transportDepartureTime;
    }

    const initialStatus =
      req.body.status === "Created" ? "Created" : "Open";

    const newGroup = await Group.create({
      ...body,
      creator: req.user._id,
      members: [req.user._id],
      currentMembers: 1,
      status: initialStatus,
    });

    const populated = await Group.findById(newGroup._id)
      .populate("creator", "name avatar email")
      .populate("members", "name avatar email");

    return res.status(201).json({ success: true, group: populated });
  } catch (error) {
    console.error("createGroup:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error creating group." });
  }
};

export const getGroups = async (req, res) => {
  try {
    const {
      destination,
      trainNumber,
      trainName,
      date,
      status,
      mine,
    } = req.query;

    const filter = {};
    const isMine = mine === "true" || mine === "1";

    if (isMine) {
      filter.$or = [
        { members: req.user._id },
        { creator: req.user._id },
      ];
      if (destination) filter.destination = destination;
      if (trainNumber) filter.trainNumber = trainNumber;
      if (trainName) filter.trainName = new RegExp(trainName, "i");
      if (status) filter.status = status;
      if (date) {
        const d = new Date(date);
        const next = new Date(d);
        next.setUTCDate(next.getUTCDate() + 1);
        filter.departureDate = { $gte: d, $lt: next };
      }
    } else {
      if (destination) filter.destination = destination;
      if (trainNumber) filter.trainNumber = trainNumber;
      if (trainName) filter.trainName = new RegExp(trainName, "i");
      if (status) filter.status = status;
      else filter.status = { $in: ["Open", "Full"] };

      if (date) {
        const d = new Date(date);
        const next = new Date(d);
        next.setUTCDate(next.getUTCDate() + 1);
        filter.departureDate = { $gte: d, $lt: next };
      } else {
        filter.departureDate = { $gte: new Date() };
      }
    }

    const groups = await Group.find(filter)
      .populate("creator", "name avatar")
      .populate("pendingRequests.userId", "name avatar email")
      .sort({ departureDate: 1 });

    return res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error("getGroups:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching groups." });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!isValidId(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }

    const group = await Group.findById(groupId)
      .populate("creator", "name avatar email phone gender hostel year branch")
      .populate("members", "name avatar email phone gender hostel year branch")
      .populate("pendingRequests.userId", "name avatar email");

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("getGroupById:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching group." });
  }
};

export const requestJoin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const message = (req.body?.message || "").slice(0, 500);

    if (!isValidId(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }

    const updated = await Group.findOneAndUpdate(
      {
        _id: groupId,
        status: "Open",
        members: { $ne: userId },
        pendingRequests: { $not: { $elemMatch: { userId } } },
      },
      {
        $push: { pendingRequests: { userId, message, requestedAt: new Date() } },
      },
      { new: true },
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot request to join (group not open, duplicate request, already a member, or invalid group).",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Join request submitted.",
      group: updated,
    });
  } catch (error) {
    console.error("requestJoin:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

export const approveJoin = async (req, res) => {
  try {
    const { groupId, userId: targetUserIdRaw } = req.params;
    if (!isValidId(groupId) || !isValidId(targetUserIdRaw)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }

    const targetUserId = new mongoose.Types.ObjectId(targetUserIdRaw);

    const updated = await Group.findOneAndUpdate(
      {
        _id: groupId,
        creator: req.user._id,
        members: { $ne: targetUserId },
        pendingRequests: { $elemMatch: { userId: targetUserId } },
        $expr: { $lt: ["$currentMembers", "$capacity"] },
        status: "Open",
      },
      {
        $pull: { pendingRequests: { userId: targetUserId } },
        $addToSet: { members: targetUserId },
        $inc: { currentMembers: 1 },
      },
      { new: true },
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message:
          "Approval failed (not admin, no pending request, group full, or user already a member).",
      });
    }

    if (updated.currentMembers >= updated.capacity) {
      await Group.updateOne({ _id: updated._id }, { $set: { status: "Full" } });
      updated.status = "Full";
    }

    const populated = await Group.findById(updated._id)
      .populate("members", "name avatar email")
      .populate("pendingRequests.userId", "name avatar email");

    return res.status(200).json({
      success: true,
      message: "Member approved.",
      group: populated,
    });
  } catch (error) {
    console.error("approveJoin:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

export const rejectJoin = async (req, res) => {
  try {
    const { groupId, userId: targetUserIdRaw } = req.params;
    if (!isValidId(groupId) || !isValidId(targetUserIdRaw)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }

    const targetUserId = new mongoose.Types.ObjectId(targetUserIdRaw);

    const updated = await Group.findOneAndUpdate(
      {
        _id: groupId,
        creator: req.user._id,
        pendingRequests: { $elemMatch: { userId: targetUserId } },
      },
      { $pull: { pendingRequests: { userId: targetUserId } } },
      { new: true },
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "Reject failed (not admin or no matching request).",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Request rejected.",
      group: updated,
    });
  } catch (error) {
    console.error("rejectJoin:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, userId: targetUserIdRaw } = req.params;
    if (!isValidId(groupId) || !isValidId(targetUserIdRaw)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }

    const targetUserId = new mongoose.Types.ObjectId(targetUserIdRaw);

    const updated = await Group.findOneAndUpdate(
      {
        _id: groupId,
        creator: req.user._id,
        members: targetUserId,
        $expr: { $ne: ["$creator", targetUserId] },
        status: { $in: ["Open", "Full"] },
      },
      {
        $pull: { members: targetUserId },
        $inc: { currentMembers: -1 },
      },
      { new: true },
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message:
          "Remove failed (not admin, cannot remove creator, user not in group, or invalid state).",
      });
    }

    if (updated.status === "Full" && updated.currentMembers < updated.capacity) {
      updated.status = "Open";
      await updated.save();
    }

    const populated = await Group.findById(updated._id).populate(
      "members",
      "name avatar email",
    );

    return res.status(200).json({
      success: true,
      message: "Member removed.",
      group: populated,
    });
  } catch (error) {
    console.error("removeMember:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

export const patchGroupStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status: nextStatus } = req.body;

    if (!isValidId(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }

    const group = await Group.findOne({
      _id: groupId,
      creator: req.user._id,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found or you are not the creator.",
      });
    }

    const allowed = STATUS_TRANSITIONS[group.status] || [];
    if (!nextStatus || !allowed.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${group.status} to ${nextStatus}.`,
      });
    }

    const updated = await Group.findOneAndUpdate(
      { _id: groupId, creator: req.user._id, status: group.status },
      { $set: { status: nextStatus } },
      { new: true },
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "Status changed concurrently; retry.",
      });
    }

    return res.status(200).json({ success: true, group: updated });
  } catch (error) {
    console.error("patchGroupStatus:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    if (!isValidId(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }

    const updatedGroup = await Group.findOneAndUpdate(
      {
        _id: groupId,
        members: userId,
        $expr: { $ne: ["$creator", userId] },
        status: { $in: ["Open", "Full"] },
      },
      {
        $inc: { currentMembers: -1 },
        $pull: { members: userId },
      },
      { new: true },
    );

    if (!updatedGroup) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot leave (creator must cancel the group, or group is not in a leavable state).",
      });
    }

    if (updatedGroup.status === "Full" && updatedGroup.currentMembers < updatedGroup.capacity) {
      updatedGroup.status = "Open";
      await updatedGroup.save();
    }

    return res.status(200).json({
      success: true,
      message: "Left the group.",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("leaveGroup:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!isValidId(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid id." });
    }

    const group = await Group.findOneAndDelete({
      _id: groupId,
      creator: req.user._id,
      status: "Open",
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found, not cancellable, or not in Open status.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Group cancelled successfully.",
    });
  } catch (error) {
    console.error("deleteGroup:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

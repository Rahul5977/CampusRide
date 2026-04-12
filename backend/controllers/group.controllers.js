import Group from "../models/groups.model.js";

const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const updatedGroup = await Group.findOneAndUpdate(
      {
        _id: groupId,
        currentMembers: { $lt: 4 }, // CONDITION 1: Must have space (less than capacity)
        members: { $ne: userId }, // CONDITION 2: User must not already be in the array
        status: "Open", // CONDITION 3: Group hasn't been locked or cancelled
      },
      {
        $inc: { currentMembers: 1 }, // Atomically increment the count by 1
        $push: { members: userId }, // Atomically push the user ID into the array
      },
      { new: true }, // Returns the document AFTER the update is applied
    );

    if (!updatedGroup) {
      return res.status(400).json({
        success: false,
        message:
          "Failed to join. The cab is either full, you are already in it, or it doesn't exist.",
      });
    }

    // CONDITION 4: If the group is full, lock it
    if (updatedGroup.currentMembers === updatedGroup.capacity) {
      updatedGroup.status = "Full";
      await updatedGroup.save();
    }

    res.status(200).json({
      success: true,
      message: "Successfully claimed your seat!",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Join Group Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const createGroup = async (req, res) => {
  try {
    const newGroup = await Group.create({
      ...req.body,
      creator: req.user.id,
      members: [req.user.id],
      currentMembers: 1,
    });
    res.status(201).json({ success: true, group: newGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating group" });
  }
};

const getOpenGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      status: "Open",
      departureDate: { $gte: new Date() },
    })
      .populate("creator", "name avatar")
      .sort({ departureDate: 1 });

    res.status(200).json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching groups" });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findOneAndDelete({
      _id: req.params.groupId,
      creator: req.user.id,
    });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found or unauthorized" });

    res
      .status(200)
      .json({ success: true, message: "Group cancelled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting group" });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const updatedGroup = await Group.findOneAndUpdate(
      {
        _id: groupId,
        members: userId, // User must be in the group to leave
        status: { $in: ["Open", "Full"] }, // Can only leave if group is not departed or cancelled
      },
      {
        $inc: { currentMembers: -1 }, // Atomically decrement the count by 1
        $pull: { members: userId }, // Atomically remove the user ID from the array
        status: "Open", // Reopen the group if it was full
      },
      { new: true }, // Returns the document AFTER the update is applied
    );

    if (!updatedGroup) {
      return res.status(400).json({
        success: false,
        message:
          "Failed to leave. You are either not in this cab, or it has already departed/cancelled.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully left the group.",
    });
  } catch (error) {
    console.error("Leave Group Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { joinGroup, createGroup, getOpenGroups, deleteGroup, leaveGroup };

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

export { joinGroup };

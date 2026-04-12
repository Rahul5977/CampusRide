import express from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  requestJoin,
  approveJoin,
  rejectJoin,
  removeMember,
  patchGroupStatus,
  leaveGroup,
  deleteGroup,
} from "../controllers/group.controllers.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getGroups);
router.post("/", createGroup);

router.post("/:groupId/request-join", requestJoin);
router.post("/:groupId/approve/:userId", approveJoin);
router.post("/:groupId/reject/:userId", rejectJoin);
router.delete("/:groupId/members/:userId", removeMember);
router.patch("/:groupId/status", patchGroupStatus);
router.post("/:groupId/leave", leaveGroup);

router.get("/:groupId", getGroupById);
router.delete("/:groupId", deleteGroup);

export default router;

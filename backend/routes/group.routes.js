import express from "express";
import {
  joinGroup,
  createGroup,
  getOpenGroups,
  deleteGroup,
} from "../controllers/group.controllers.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All group routes require authentication
router.use(protect);

router.post("/", createGroup);
router.get("/", getOpenGroups);
router.post("/:groupId/join", joinGroup);
router.delete("/:groupId", deleteGroup);

export default router;

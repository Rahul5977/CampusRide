import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  searchGroups,
  searchTravelPlans,
} from "../controllers/search.controllers.js";

const router = express.Router();

router.use(protect);

router.get("/groups", searchGroups);
router.get("/travel-plans", searchTravelPlans);

export default router;

import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  patchUserProfile,
  createTravelPlan,
  listTravelPlans,
  updateTravelPlan,
  deleteTravelPlan,
} from "../controllers/user.controllers.js";

const router = express.Router();

router.use(protect);

router.patch("/profile", patchUserProfile);
router.post("/travel-plans", createTravelPlan);
router.get("/travel-plans", listTravelPlans);
router.put("/travel-plans/:planId", updateTravelPlan);
router.delete("/travel-plans/:planId", deleteTravelPlan);

export default router;

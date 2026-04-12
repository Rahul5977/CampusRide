import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { presignUpload } from "../controllers/media.controllers.js";

const router = express.Router();

router.use(protect);

router.post("/presign", presignUpload);

export default router;

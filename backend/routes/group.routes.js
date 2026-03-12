import express from "express";
const router = express.Router();
const { joinGroup } = require("../controllers/groupController");

router.post("/:groupId/join", joinGroup);

export default router;

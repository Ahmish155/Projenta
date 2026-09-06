import express from "express";
import { createMeeting, getMeeting } from "../controllers/meetingController.js";
import { protect, requireUser } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, requireUser);
router.post("/", createMeeting);
router.get("/:code", getMeeting);
export default router;

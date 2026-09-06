import express from "express";
import {
  getConversations,
  markConversationRead,
  startDirectConversation,
  createGroupConversation,
} from "../controllers/conversationController.js";
import { getHistory } from "../controllers/chatController.js";
import { protect, requireUser, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, requireUser);

router.get("/", getConversations);
router.post("/direct", startDirectConversation);
router.post("/group", requireRole("admin", "teamlead"), createGroupConversation);
router.get("/:conversationId/messages", getHistory);
router.post("/:id/read", markConversationRead);

export default router;

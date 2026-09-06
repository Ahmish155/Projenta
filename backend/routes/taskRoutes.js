import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  startTask,
  endTask,
  getTaskStats,
} from "../controllers/taskController.js";
import { protect, requireUser, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, requireUser);

router.get("/", getTasks);
router.get("/stats/overview", getTaskStats);
router.post("/", requireRole("admin", "teamlead"), createTask);
router.put("/:id", requireRole("admin", "teamlead"), updateTask);
router.delete("/:id", requireRole("admin", "teamlead"), deleteTask);
router.patch("/:id/start", startTask);
router.patch("/:id/end", endTask);

export default router;

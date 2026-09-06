import express from "express";
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  setTeamMember,
  deleteTeam,
} from "../controllers/teamController.js";
import { protect, requireUser, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, requireUser);

router.get("/", getTeams);
router.get("/:id", getTeamById);
router.post("/", requireRole("admin"), createTeam);
router.put("/:id", requireRole("admin"), updateTeam);
router.patch("/:id/members", requireRole("admin"), setTeamMember);
router.delete("/:id", requireRole("admin"), deleteTeam);

export default router;

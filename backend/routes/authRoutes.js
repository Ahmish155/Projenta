import express from "express";
import { createWorkspace, syncUser, getMe } from "../controllers/authController.js";
import { protect, requireUser } from "../middleware/auth.js";

const router = express.Router();

// create-workspace and sync both verify their own idToken internally (no existing User yet)
router.post("/create-workspace", createWorkspace);
router.post("/sync", syncUser);

router.get("/me", protect, requireUser, getMe);

export default router;

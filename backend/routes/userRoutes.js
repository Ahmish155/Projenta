import express from "express";
import { getUsers, getWorkspaceContacts, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { protect, requireUser, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, requireUser);

router.get("/contacts", getWorkspaceContacts); // unrestricted — for messaging
router.get("/", getUsers); // task-assignment scoped (team leads see only their team)
router.post("/", requireRole("admin"), createUser);
router.patch("/:id", requireRole("admin"), updateUser);
router.delete("/:id", requireRole("admin"), deleteUser);

export default router;

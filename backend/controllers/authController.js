import mongoose from "mongoose";
import slugify from "slugify";
import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";

// @desc  Create a brand new workspace, linked to whoever just signed up via Firebase
//        (email/password, Google, Facebook, or GitHub — doesn't matter which).
// @route POST /api/auth/create-workspace
// @body  { idToken, workspaceName }
export const createWorkspace = async (req, res) => {
  const { idToken, workspaceName } = req.body;
  if (!idToken || !workspaceName) {
    return res.status(400).json({ message: "idToken and workspaceName are required" });
  }

  const decoded = await admin.auth().verifyIdToken(idToken).catch(() => null);
  if (!decoded) return res.status(401).json({ message: "Invalid or expired sign-in" });

  const existingUser = await User.findOne({ firebaseUid: decoded.uid });
  if (existingUser) {
    return res.status(400).json({ message: "This account is already linked to a workspace" });
  }

  let baseSlug = slugify(workspaceName, { lower: true, strict: true });
  let slug = baseSlug;
  let i = 1;
  while (await Workspace.findOne({ slug })) slug = `${baseSlug}-${i++}`;

  // Pre-generate both IDs so Workspace and User can each reference the other
  // correctly from the moment they're created — avoids the null-then-update
  // pattern, which fails schema validation since `owner` is required.
  const workspaceId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  const workspace = await Workspace.create({
    _id: workspaceId,
    name: workspaceName,
    slug,
    owner: adminId,
  });

  const adminUser = await User.create({
    _id: adminId,
    firebaseUid: decoded.uid,
    name: decoded.name || decoded.email.split("@")[0],
    email: decoded.email,
    photoURL: decoded.picture || "",
    role: "admin",
    status: "active",
    workspace: workspaceId,
  });

  res.status(201).json({ user: adminUser.toSafeObject(), workspace });
};

// @desc  Called right after any successful Firebase sign-in (email, Google, Facebook, GitHub)
//        to resolve which workspace/role this person belongs to.
// @route POST /api/auth/sync
// @body  { idToken }
export const syncUser = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: "idToken is required" });

  const decoded = await admin.auth().verifyIdToken(idToken).catch(() => null);
  if (!decoded) return res.status(401).json({ message: "Invalid or expired sign-in" });

  let user = await User.findOne({ firebaseUid: decoded.uid }).populate("workspace").populate("team");

  if (!user && decoded.email) {
    user = await User.findOne({ email: decoded.email, firebaseUid: { $exists: false } });
    if (user) {
      user.firebaseUid = decoded.uid;
      await user.save();
      user = await User.findById(user._id).populate("workspace").populate("team");
    }
  }

  if (!user) {
    return res.status(404).json({
      message: "No workspace found for this account yet. Create a new workspace, or ask your admin to add you.",
    });
  }
  if (user.status === "deactivated") {
    return res.status(403).json({ message: "Your account has been deactivated. Contact your admin." });
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json({ user: user.toSafeObject(), workspace: user.workspace, team: user.team });
};

// @desc  Get logged-in user's profile + workspace (requires an existing linked account)
// @route GET /api/auth/me
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate("workspace").populate("team");
  res.json({ user: user.toSafeObject(), workspace: user.workspace, team: user.team });
};
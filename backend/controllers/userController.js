import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Task from "../models/Task.js";

// @desc  List people for TASK ASSIGNMENT purposes.
//        admin    -> everyone
//        teamlead -> ONLY their own team's members (server-enforced, not just hidden in UI)
//        member   -> everyone (read-only)
// @route GET /api/users
export const getUsers = async (req, res) => {
  const filter = { workspace: req.user.workspace };

  // Defense in depth: only accept known-good string values for these filters,
  // never pass req.query values into the filter unchecked (NoSQL injection
  // via e.g. ?role[$ne]=null is blocked globally by express-mongo-sanitize,
  // but we also whitelist explicitly here since this endpoint builds a filter
  // object directly from query params).
  const ALLOWED_ROLES = ["admin", "teamlead", "member"];
  const safeRole = typeof req.query.role === "string" && ALLOWED_ROLES.includes(req.query.role) ? req.query.role : undefined;
  const safeTeam = typeof req.query.team === "string" && /^[a-f0-9]{24}$/i.test(req.query.team) ? req.query.team : undefined;

  if (req.user.role === "teamlead") {
    // A team lead can only ever assign work within their own team, full stop —
    // but they can still filter by role (e.g. "member") within that team.
    filter.team = req.user.team || null;
    if (safeRole) filter.role = safeRole;
  } else {
    if (safeRole) filter.role = safeRole;
    if (safeTeam) filter.team = safeTeam;
    if (req.query.unassigned === "true") filter.team = null;
  }

  const users = await User.find(filter).populate("team", "name").sort({ createdAt: -1 }).lean();
  res.json({ users });
};

// @desc  List EVERYONE in the workspace, no role restriction at all.
//        This is deliberately separate from getUsers above: task-assignment
//        visibility follows the org chart, but messaging is open — anyone
//        can start a direct chat or be added to a group with anyone else.
// @route GET /api/users/contacts
export const getWorkspaceContacts = async (req, res) => {
  const users = await User.find({ workspace: req.user.workspace })
    .select("name email photoURL role team")
    .sort({ name: 1 })
    .lean();
  res.json({ users });
};

// @desc  Admin adds a user directly (name/email/password + role/team).
//        This creates a REAL Firebase Auth account server-side via firebase-admin,
//        so the new person can log in immediately with that email/password
//        (or with Google/GitHub/Facebook, if they use the same email).
// @route POST /api/users
export const createUser = async (req, res) => {
  const { name, email, password, role, team } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  if (role === "admin") {
    return res.status(400).json({ message: "Only one admin per workspace (the owner)" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "A user with this email already exists" });
  }

  let firebaseUser;
  try {
    firebaseUser = await admin.auth().createUser({ email, password, displayName: name });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      // The Firebase account exists (e.g. they signed up elsewhere) — reuse its UID.
      firebaseUser = await admin.auth().getUserByEmail(email);
    } else {
      return res.status(400).json({ message: err.message || "Could not create the login account" });
    }
  }

  const user = await User.create({
    firebaseUid: firebaseUser.uid,
    name,
    email,
    role: role === "teamlead" ? "teamlead" : "member",
    workspace: req.user.workspace,
    team: team || null,
  });

  if (team && role === "teamlead") {
    await Team.findByIdAndUpdate(team, { lead: user._id });
  }

  res.status(201).json({ user: user.toSafeObject() });
};

// @desc  Update a user's role, team, or status
// @route PATCH /api/users/:id
export const updateUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, workspace: req.user.workspace });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role === "admin") return res.status(400).json({ message: "Cannot modify the admin account" });

  const { role, team, status } = req.body;
  if (role !== undefined) user.role = role;
  if (team !== undefined) user.team = team || null;
  if (status !== undefined) user.status = status;
  await user.save();

  // Keep Team.lead in sync if this user was promoted/demoted
  if (role === "teamlead" && user.team) {
    await Team.findByIdAndUpdate(user.team, { lead: user._id });
  }

  res.json({ user: user.toSafeObject() });
};

// @desc  Remove a user entirely
// @route DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, workspace: req.user.workspace });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role === "admin") return res.status(400).json({ message: "Cannot delete the admin account" });

  await Task.deleteMany({ assignedTo: user._id });
  await Team.updateMany({ lead: user._id }, { lead: null });
  await user.deleteOne();

  res.json({ message: "User removed" });
};

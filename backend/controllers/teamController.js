import Team from "../models/Team.js";
import User from "../models/User.js";
import Task from "../models/Task.js";

// @desc  List teams in the workspace (with member counts)
// @route GET /api/teams
export const getTeams = async (req, res) => {
  const [teams, counts] = await Promise.all([
    Team.find({ workspace: req.user.workspace }).populate("lead", "name email").lean(),
    // One aggregation instead of one COUNT query per team.
    User.aggregate([
      { $match: { workspace: req.user.workspace, team: { $ne: null } } },
      { $group: { _id: "$team", count: { $sum: 1 } } },
    ]),
  ]);

  const countByTeam = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  const withCounts = teams.map((t) => ({ ...t, memberCount: countByTeam[String(t._id)] || 0 }));

  res.json({ teams: withCounts });
};

// @desc  Get one team + its members
// @route GET /api/teams/:id
export const getTeamById = async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, workspace: req.user.workspace }).populate("lead", "name email").lean();
  if (!team) return res.status(404).json({ message: "Team not found" });
  const members = await User.find({ team: team._id }).lean();
  res.json({ team, members });
};

// @desc  Admin creates a team
// @route POST /api/teams
export const createTeam = async (req, res) => {
  const { name, lead } = req.body;
  if (!name) return res.status(400).json({ message: "Team name is required" });

  const team = await Team.create({ name, workspace: req.user.workspace, lead: lead || null });

  if (lead) {
    await User.findByIdAndUpdate(lead, { role: "teamlead", team: team._id });
  }

  res.status(201).json({ team });
};

// @desc  Admin updates a team (rename, change/assign lead)
// @route PUT /api/teams/:id
export const updateTeam = async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, workspace: req.user.workspace });
  if (!team) return res.status(404).json({ message: "Team not found" });

  const { name, lead } = req.body;
  if (name !== undefined) team.name = name;

  if (lead !== undefined) {
    // demote the previous lead back to a member (they stay on the team)
    if (team.lead && String(team.lead) !== String(lead)) {
      await User.findByIdAndUpdate(team.lead, { role: "member" });
    }
    team.lead = lead || null;
    if (lead) {
      await User.findByIdAndUpdate(lead, { role: "teamlead", team: team._id });
    }
  }

  await team.save();
  res.json({ team });
};

// @desc  Add/remove a member from a team
// @route PATCH /api/teams/:id/members
export const setTeamMember = async (req, res) => {
  const { userId, action } = req.body; // action: "add" | "remove"
  const team = await Team.findOne({ _id: req.params.id, workspace: req.user.workspace });
  if (!team) return res.status(404).json({ message: "Team not found" });

  const user = await User.findOne({ _id: userId, workspace: req.user.workspace });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (action === "add") {
    user.team = team._id;
  } else {
    if (String(team.lead) === String(user._id)) {
      team.lead = null;
      await team.save();
      user.role = "member";
    }
    user.team = null;
  }
  await user.save();

  res.json({ message: "Team membership updated" });
};

// @desc  Delete a team (members become unassigned)
// @route DELETE /api/teams/:id
export const deleteTeam = async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, workspace: req.user.workspace });
  if (!team) return res.status(404).json({ message: "Team not found" });

  await User.updateMany({ team: team._id }, { team: null, role: "member" });
  await Task.updateMany({ team: team._id }, { team: null });
  await team.deleteOne();

  res.json({ message: "Team deleted" });
};

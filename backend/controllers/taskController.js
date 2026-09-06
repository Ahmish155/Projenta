import Task from "../models/Task.js";
import User from "../models/User.js";

const populateOpts = [
  { path: "assignedTo", select: "name email role" },
  { path: "assignedBy", select: "name email role" },
  { path: "team", select: "name" },
];

// @desc  Get tasks scoped to the caller's role:
//        admin    -> every task in the workspace
//        teamlead -> tasks assigned to them by admin, AND tasks they assigned to their team
//        member   -> only tasks assigned to them
// @route GET /api/tasks
export const getTasks = async (req, res) => {
  let filter = { workspace: req.user.workspace };

  if (req.user.role === "admin") {
    // no extra restriction — full workspace visibility
  } else if (req.user.role === "teamlead") {
    filter.$or = [{ assignedTo: req.user._id }, { assignedBy: req.user._id }];
  } else {
    filter.assignedTo = req.user._id;
  }

  const tasks = await Task.find(filter).populate(populateOpts).sort({ createdAt: -1 }).lean();
  res.json({ tasks });
};

// @desc  Create + assign a task, enforcing the hierarchy
//        admin    -> assignedTo must have role "teamlead"
//        teamlead -> assignedTo must be a member of their own team
// @route POST /api/tasks
export const createTask = async (req, res) => {
  const { title, description, requirements, priority, dueDate, assignedTo } = req.body;

  if (!title || !assignedTo) {
    return res.status(400).json({ message: "Title and assignedTo are required" });
  }

  const target = await User.findOne({ _id: assignedTo, workspace: req.user.workspace });
  if (!target) return res.status(404).json({ message: "Assignee not found in this workspace" });

  if (req.user.role === "admin") {
    if (target.role !== "teamlead") {
      return res.status(403).json({ message: "Admins can only assign tasks to team leads" });
    }
  } else if (req.user.role === "teamlead") {
    if (!req.user.team || String(target.team) !== String(req.user.team) || target.role !== "member") {
      return res.status(403).json({ message: "You can only assign tasks to members of your own team" });
    }
  } else {
    return res.status(403).json({ message: "Members cannot assign tasks to others" });
  }

  const task = await Task.create({
    title,
    description,
    requirements,
    priority,
    dueDate,
    workspace: req.user.workspace,
    team: target.team || null,
    assignedTo: target._id,
    assignedBy: req.user._id,
  });

  const populated = await task.populate(populateOpts);
  res.status(201).json({ task: populated });
};

// @desc  Update task details (only the person who assigned it can edit it)
// @route PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, workspace: req.user.workspace });
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (req.user.role !== "admin" && String(task.assignedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the task's assigner can edit it" });
  }

  const { title, description, requirements, priority, dueDate } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (requirements !== undefined) task.requirements = requirements;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;

  await task.save();
  const populated = await task.populate(populateOpts);
  res.json({ task: populated });
};

// @desc  Delete a task
// @route DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, workspace: req.user.workspace });
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (req.user.role !== "admin" && String(task.assignedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the task's assigner can delete it" });
  }
  await task.deleteOne();
  res.json({ message: "Task deleted" });
};

// @desc  Start a task (only the assignee)
// @route PATCH /api/tasks/:id/start
export const startTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, workspace: req.user.workspace });
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (String(task.assignedTo) !== String(req.user._id)) {
    return res.status(403).json({ message: "This task is not assigned to you" });
  }
  if (task.status !== "pending") {
    return res.status(400).json({ message: `Cannot start a task that is "${task.status}"` });
  }
  task.status = "in-progress";
  task.startedAt = new Date();
  await task.save();
  res.json({ task: await task.populate(populateOpts) });
};

// @desc  End a task (only the assignee)
// @route PATCH /api/tasks/:id/end
export const endTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, workspace: req.user.workspace });
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (String(task.assignedTo) !== String(req.user._id)) {
    return res.status(403).json({ message: "This task is not assigned to you" });
  }
  if (task.status !== "in-progress") {
    return res.status(400).json({ message: `Cannot end a task that is "${task.status}"` });
  }
  task.status = "completed";
  task.completedAt = new Date();
  task.durationSeconds = Math.round((task.completedAt - task.startedAt) / 1000);
  await task.save();
  res.json({ task: await task.populate(populateOpts) });
};

// @desc  Dashboard stats, scoped the same way as getTasks
// @route GET /api/tasks/stats/overview
export const getTaskStats = async (req, res) => {
  let filter = { workspace: req.user.workspace };
  if (req.user.role === "teamlead") {
    filter.$or = [{ assignedTo: req.user._id }, { assignedBy: req.user._id }];
  } else if (req.user.role === "member") {
    filter.assignedTo = req.user._id;
  }

  // A single aggregation instead of loading every task document into memory
  // just to count them in JS — matters once a workspace has real task volume.
  const grouped = await Task.aggregate([{ $match: filter }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
  const byStatus = Object.fromEntries(grouped.map((g) => [g._id, g.count]));

  res.json({
    stats: {
      total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
      pending: byStatus.pending || 0,
      inProgress: byStatus["in-progress"] || 0,
      completed: tasks.filter((t) => t.status === "completed").length,
    },
  });
};

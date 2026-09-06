import mongoose from "mongoose";

// Hierarchy enforced in controller, not here:
// - admin can only assign to a user with role "teamlead"
// - teamlead can only assign to a member of their own team
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    requirements: { type: String, default: "" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    dueDate: { type: Date },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ workspace: 1, assignedTo: 1 });
taskSchema.index({ workspace: 1, assignedBy: 1 });

export default mongoose.model("Task", taskSchema);

import mongoose from "mongoose";

// Roles are workspace-scoped: a user belongs to exactly one workspace.
// admin    - created the workspace, full control
// teamlead - promoted by admin, can manage & assign tasks within their team
// member   - regular worker, sees only their own tasks + personal todos
//
// Authentication itself is handled entirely by Firebase Auth (email/password,
// Google, Facebook, GitHub). This model just links a Firebase UID to a
// workspace + role — no passwords are stored here.
const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    photoURL: { type: String, default: "" },
    role: { type: String, enum: ["admin", "teamlead", "member"], default: "member" },
    status: { type: String, enum: ["active", "deactivated"], default: "active" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function () {
  return this.toObject();
};

userSchema.index({ workspace: 1, team: 1 });
userSchema.index({ workspace: 1, role: 1 });

export default mongoose.model("User", userSchema);

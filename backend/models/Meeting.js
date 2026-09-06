import mongoose from "mongoose";

// Deliberately lightweight — an instant meeting is just a shareable code
// scoped to a workspace. No persistent chat history; that's ephemeral,
// same as a real-world meeting.
const meetingSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    code: { type: String, required: true, unique: true },
    title: { type: String, default: "Instant meeting" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Meeting", meetingSchema);

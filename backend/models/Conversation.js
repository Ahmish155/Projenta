import mongoose from "mongoose";

// type "direct" — exactly 2 members, created automatically the first time
//                 either person messages the other.
// type "group"  — created only by an admin or team lead, with a name and
//                 a chosen set of members.
const conversationSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    type: { type: String, enum: ["direct", "group"], required: true },
    name: { type: String, trim: true }, // group chats only
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastMessageAt: { type: Date, default: Date.now },
    // Per-user "I've read up to this point" markers, for unread badges.
    lastReads: { type: Map, of: Date, default: {} },
  },
  { timestamps: true }
);

conversationSchema.index({ members: 1, lastMessageAt: -1 });

export default mongoose.model("Conversation", conversationSchema);

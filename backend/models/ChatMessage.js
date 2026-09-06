import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    attachment: {
      url: { type: String },
      name: { type: String },
      type: { type: String }, // "image" | "video" | "document"
    },
  },
  { timestamps: true }
);

// Powers "how many unread messages since I last read this conversation" efficiently.
chatMessageSchema.index({ conversation: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);

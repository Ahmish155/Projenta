import Conversation from "../models/Conversation.js";
import ChatMessage from "../models/ChatMessage.js";

// @desc  Fetch message history for a conversation (must be a member)
// @route GET /api/chat/:conversationId
export const getHistory = async (req, res) => {
  const convo = await Conversation.findOne({ _id: req.params.conversationId, members: req.user._id });
  if (!convo) return res.status(404).json({ message: "Conversation not found" });

  const messages = await ChatMessage.find({ conversation: convo._id })
    .populate("sender", "name photoURL")
    .sort({ createdAt: 1 })
    .limit(200);

  res.json({ messages });
};

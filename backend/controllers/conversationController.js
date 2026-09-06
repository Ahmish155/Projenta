import Conversation from "../models/Conversation.js";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";

const populateMembers = { path: "members", select: "name email photoURL role" };

// @desc  List every conversation (direct + group) the caller belongs to,
//        newest activity first, with a last-message preview and unread count.
// @route GET /api/conversations
export const getConversations = async (req, res) => {
  const conversations = await Conversation.find({ members: req.user._id })
    .populate(populateMembers)
    .sort({ lastMessageAt: -1 })
    .lean();

  const uid = String(req.user._id);

  const withDetails = await Promise.all(
    conversations.map(async (c) => {
      const lastRead = c.lastReads?.[uid] ? new Date(c.lastReads[uid]) : new Date(0);
      const [lastMessage, unreadCount] = await Promise.all([
        ChatMessage.findOne({ conversation: c._id }).sort({ createdAt: -1 }).populate("sender", "name").lean(),
        ChatMessage.countDocuments({
          conversation: c._id,
          createdAt: { $gt: lastRead },
          sender: { $ne: req.user._id },
        }),
      ]);
      return { ...c, lastMessage: lastMessage || null, unreadCount };
    })
  );

  res.json({ conversations: withDetails });
};

// @desc  Mark a conversation as read up to now (clears its unread badge)
// @route POST /api/conversations/:id/read
export const markConversationRead = async (req, res) => {
  const convo = await Conversation.findOne({ _id: req.params.id, members: req.user._id });
  if (!convo) return res.status(404).json({ message: "Conversation not found" });

  convo.lastReads.set(String(req.user._id), new Date());
  await convo.save();

  res.json({ message: "Marked as read" });
};

// @desc  Get (or lazily create) the 1:1 conversation between me and another user.
//        Anyone in the workspace can message anyone else — no role restriction.
// @route POST /api/conversations/direct
// @body  { userId }
export const startDirectConversation = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId is required" });
  if (userId === String(req.user._id)) {
    return res.status(400).json({ message: "You can't message yourself" });
  }

  const other = await User.findOne({ _id: userId, workspace: req.user.workspace });
  if (!other) return res.status(404).json({ message: "User not found in this workspace" });

  let convo = await Conversation.findOne({
    workspace: req.user.workspace,
    type: "direct",
    members: { $all: [req.user._id, other._id], $size: 2 },
  }).populate(populateMembers);

  if (!convo) {
    convo = await Conversation.create({
      workspace: req.user.workspace,
      type: "direct",
      members: [req.user._id, other._id],
      createdBy: req.user._id,
    });
    convo = await convo.populate(populateMembers);
  }

  res.status(201).json({ conversation: convo });
};

// @desc  Create a group chat — admins and team leads only can CREATE one,
//        but membership is workspace-wide: anyone can be added to a group,
//        same as anyone can start a 1:1 chat with anyone.
// @route POST /api/conversations/group
// @body  { name, memberIds: [] }
export const createGroupConversation = async (req, res) => {
  const { name, memberIds = [] } = req.body;
  if (!name || memberIds.length === 0) {
    return res.status(400).json({ message: "Group name and at least one member are required" });
  }

  const candidates = await User.find({ _id: { $in: memberIds }, workspace: req.user.workspace });
  const memberSet = new Set([String(req.user._id), ...candidates.map((u) => String(u._id))]);

  const convo = await Conversation.create({
    workspace: req.user.workspace,
    type: "group",
    name,
    members: [...memberSet],
    createdBy: req.user._id,
  });

  res.status(201).json({ conversation: await convo.populate(populateMembers) });
};

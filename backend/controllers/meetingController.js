import crypto from "crypto";
import Meeting from "../models/Meeting.js";

const generateCode = () => crypto.randomBytes(8).toString("hex"); // 64 bits of entropy — resists brute-force guessing even with the rate limit

// @desc  Create an instant meeting — anyone in the workspace can start one
// @route POST /api/meetings
export const createMeeting = async (req, res) => {
  const meeting = await Meeting.create({
    workspace: req.user.workspace,
    code: generateCode(),
    title: req.body.title || "Instant meeting",
    createdBy: req.user._id,
  });
  res.status(201).json({ meeting });
};

// @desc  Validate a meeting code before joining (also confirms same workspace)
// @route GET /api/meetings/:code
export const getMeeting = async (req, res) => {
  const meeting = await Meeting.findOne({ code: req.params.code, workspace: req.user.workspace }).populate(
    "createdBy",
    "name"
  );
  if (!meeting) return res.status(404).json({ message: "Meeting not found" });
  res.json({ meeting });
};

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { protect, requireUser } from "../middleware/auth.js";
import UploadedFile from "../models/UploadedFile.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Allow-list of mimetypes — deliberately excludes HTML/SVG/executable types,
// which could otherwise be uploaded and later served back to a browser as
// "attachments", creating a stored-XSS or drive-by-download vector.
const ALLOWED_MIMETYPES = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "video/mp4", "video/webm", "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
    return cb(new Error("That file type isn't supported"));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB cap

const fileKind = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "document";
};

const router = express.Router();
router.use(protect, requireUser);

// @desc  Upload a document/image/video for chat sharing.
//        The file is saved to disk with a random name, but is NOT publicly
//        reachable — it's only ever served back through the protected route
//        below, after verifying the requester is in the same workspace.
// @route POST /api/uploads
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  await UploadedFile.create({
    workspace: req.user.workspace,
    uploadedBy: req.user._id,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
  });

  res.status(201).json({
    url: `/api/uploads/file/${req.file.filename}`,
    name: req.file.originalname,
    type: fileKind(req.file.mimetype),
  });
});

// @desc  Serve an uploaded file — only to someone in the same workspace it was uploaded in.
// @route GET /api/uploads/file/:filename
router.get("/file/:filename", async (req, res) => {
  const record = await UploadedFile.findOne({ filename: req.params.filename, workspace: req.user.workspace });
  if (!record) return res.status(404).json({ message: "File not found" });

  const filePath = path.join(uploadDir, record.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });

  res.setHeader("Content-Type", record.mimeType);
  if (req.query.download === "1") {
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(record.originalName)}"`);
  }
  res.sendFile(filePath);
});

export default router;

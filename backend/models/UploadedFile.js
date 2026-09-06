import mongoose from "mongoose";

// Tracks who uploaded what, in which workspace — required so the protected
// file-serving route can verify the requester actually belongs to the same
// workspace before streaming any file back. Files are NOT publicly reachable.
const uploadedFileSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filename: { type: String, required: true, unique: true }, // on-disk generated name
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("UploadedFile", uploadedFileSchema);

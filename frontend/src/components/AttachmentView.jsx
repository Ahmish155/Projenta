import React, { useEffect, useState } from "react";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";
import api from "../api/axios.js";

// Uploaded files are served from a PROTECTED backend route (auth required,
// workspace-scoped) — plain <img src> / <a href> can't attach an
// Authorization header, so every preview and action here goes through an
// authenticated fetch that resolves to a local blob: URL instead.
const useAuthedBlobUrl = (url, enabled) => {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!enabled || !url) return;
    let objectUrl;
    let cancelled = false;

    api.get(url, { responseType: "blob" }).then((res) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(res.data);
      setBlobUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, enabled]);

  return blobUrl;
};

const AttachmentView = ({ attachment }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const url = attachment?.url;
  const type = attachment?.type;
  const name = attachment?.name;

  // Inline previews (image/video) are fetched eagerly; documents show a
  // static icon and only fetch when Open/Download is actually clicked.
  const previewUrl = useAuthedBlobUrl(url, Boolean(attachment) && (type === "image" || type === "video"));

  if (!attachment) return null;

  const handleAction = async (mode) => {
    setActionLoading(true);
    try {
      const res = await api.get(url, { responseType: "blob" });
      const objectUrl = URL.createObjectURL(res.data);
      if (mode === "open") {
        window.open(objectUrl, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mt-2">
      {type === "image" && (
        previewUrl ? (
          <img src={previewUrl} alt={name} className="rounded-lg max-w-xs max-h-56 object-cover mb-1.5" />
        ) : (
          <div className="w-40 h-28 rounded-lg bg-white/10 flex items-center justify-center mb-1.5">
            <Loader2 size={16} className="animate-spin text-muted" />
          </div>
        )
      )}
      {type === "video" && (
        previewUrl ? (
          <video src={previewUrl} controls className="rounded-lg max-w-xs max-h-56 mb-1.5" />
        ) : (
          <div className="w-40 h-28 rounded-lg bg-white/10 flex items-center justify-center mb-1.5">
            <Loader2 size={16} className="animate-spin text-muted" />
          </div>
        )
      )}
      {type === "document" && (
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs mb-1.5 w-fit">
          <FileText size={14} /> {name}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAction("open")}
          disabled={actionLoading}
          className="inline-flex items-center gap-1 text-[11px] text-cream/70 hover:text-cream bg-white/10 hover:bg-white/20 rounded-md px-2 py-1 transition-colors disabled:opacity-50"
        >
          {actionLoading ? <Loader2 size={11} className="animate-spin" /> : <ExternalLink size={11} />} Open
        </button>
        <button
          onClick={() => handleAction("download")}
          disabled={actionLoading}
          className="inline-flex items-center gap-1 text-[11px] text-cream/70 hover:text-cream bg-white/10 hover:bg-white/20 rounded-md px-2 py-1 transition-colors disabled:opacity-50"
        >
          <Download size={11} /> Download
        </button>
      </div>
    </div>
  );
};

export default AttachmentView;

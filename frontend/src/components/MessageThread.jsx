import React, { useEffect, useRef, useState, useCallback } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import AttachmentView from "./AttachmentView.jsx";
import { useSocketCtx } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

const genClientId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// A conversation's chat OR a meeting's live comment box — same component.
// `historyUrl` is omitted for ephemeral meeting chat (no persisted history).
const MessageThread = ({ room, historyUrl, placeholder = "Type a message..." }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSocketMessage = useCallback((msg) => {
    if (msg.type !== "chat") return;
    setMessages((prev) => {
      // Reconcile with our own optimistic message if this is the echo of it
      if (msg.clientId) {
        const idx = prev.findIndex((m) => m._clientId === msg.clientId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = msg.message;
          return next;
        }
      }
      // Avoid duplicates if the same real message somehow arrives twice
      if (prev.some((m) => m._id === msg.message._id)) return prev;
      return [...prev, msg.message];
    });
  }, []);

  const { send, connected, subscribe } = useSocketCtx();
  useEffect(() => subscribe(handleSocketMessage), [subscribe, handleSocketMessage]);

  useEffect(() => {
    if (historyUrl) {
      api.get(historyUrl).then((res) => setMessages(res.data.messages));
    } else {
      setMessages([]); // ephemeral room — starts empty each time you join
    }
  }, [historyUrl, room]);

  useEffect(() => {
    if (connected) send({ type: "join", room });
    return () => send({ type: "leave", room });
  }, [connected, room, send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendPayload = (payload) => {
    const clientId = genClientId();
    // Optimistic local echo so the sender sees it instantly, no round-trip wait.
    setMessages((prev) => [
      ...prev,
      {
        _id: clientId,
        _clientId: clientId,
        sender: { _id: user._id, name: user.name, photoURL: user.photoURL },
        text: payload.text || "",
        attachment: payload.attachment,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);
    send({ type: "chat", room, clientId, ...payload });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendPayload({ text: text.trim() });
    setText("");
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/uploads", formData, { headers: { "Content-Type": "multipart/form-data" } });
      sendPayload({ attachment: res.data });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && <p className="text-center text-muted text-sm py-10">No messages yet.</p>}
        {messages.map((m) => {
          const mine = m.sender?._id === user._id;
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                {!mine && <span className="text-xs text-muted mb-1 px-1">{m.sender?.name}</span>}
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-cream text-base-950" : "bg-white/10 text-cream/90"} ${m.pending ? "opacity-60" : ""}`}>
                  {m.text}
                  <AttachmentView attachment={m.attachment} />
                </div>
                <span className="text-[10px] text-muted mt-1 px-1">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-white/10">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} accept="image/*,video/*,.pdf,.doc,.docx,.txt" />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary !p-2.5">
          {uploading ? <Loader2 size={17} className="animate-spin" /> : <Paperclip size={17} />}
        </button>
        <input className="input !py-2.5" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn-primary !p-2.5"><Send size={17} /></button>
      </form>
    </div>
  );
};

export default MessageThread;

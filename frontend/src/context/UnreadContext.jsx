import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useSocketCtx } from "./SocketContext.jsx";
import api from "../api/axios.js";

const UnreadContext = createContext(null);

// Tracks unread-message counts per conversation, kept live via the shared
// socket's "unread" notifications (see server.js) — the server already
// knows not to notify someone who's actively viewing that conversation, so
// this context can just trust what it receives.
export const UnreadProvider = ({ children }) => {
  const { subscribe } = useSocketCtx();
  const [counts, setCounts] = useState({}); // conversationId -> number
  const activeConversationRef = useRef(null);

  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type === "unread" && msg.conversationId) {
        if (activeConversationRef.current === msg.conversationId) return;
        setCounts((prev) => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] || 0) + 1 }));
      }
    });
  }, [subscribe]);

  const seedCounts = useCallback((conversations) => {
    setCounts((prev) => {
      const next = { ...prev };
      conversations.forEach((c) => {
        if (!(c._id in next)) next[c._id] = c.unreadCount || 0;
      });
      return next;
    });
  }, []);

  const setActiveConversation = useCallback((id) => {
    activeConversationRef.current = id;
    if (id) setCounts((prev) => ({ ...prev, [id]: 0 }));
  }, []);

  const markRead = useCallback((conversationId) => {
    setCounts((prev) => ({ ...prev, [conversationId]: 0 }));
    api.post(`/conversations/${conversationId}/read`).catch(() => {});
  }, []);

  const totalUnread = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <UnreadContext.Provider value={{ counts, totalUnread, seedCounts, setActiveConversation, markRead }}>
      {children}
    </UnreadContext.Provider>
  );
};

export const useUnread = () => useContext(UnreadContext);

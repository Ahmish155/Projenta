import React, { createContext, useContext, useCallback, useRef } from "react";
import { useSocket } from "../hooks/useSocket.js";

const SocketContext = createContext(null);

// One WebSocket connection for the entire app. Chat threads, call panels,
// and unread tracking all subscribe to the same stream of messages instead
// of each opening their own socket — fewer connections, one Firebase token
// fetch, noticeably lighter on both the browser and the server.
export const SocketProvider = ({ children }) => {
  const listenersRef = useRef(new Set());

  const handleMessage = useCallback((msg) => {
    listenersRef.current.forEach((fn) => fn(msg));
  }, []);

  const { send, connected } = useSocket(handleMessage);

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  return <SocketContext.Provider value={{ send, connected, subscribe }}>{children}</SocketContext.Provider>;
};

export const useSocketCtx = () => useContext(SocketContext);

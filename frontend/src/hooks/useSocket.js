import { useEffect, useRef, useCallback, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";

// A single WebSocket connection, kept in sync with Firebase auth state —
// reconnects whenever a user signs in, closes on sign-out. Plain vanilla
// WebSocket, no socket.io. This should only be instantiated ONCE at the top
// of the app (via SocketContext) — everything else subscribes to it instead
// of opening its own connection, so a tab never has more than one open
// socket regardless of how many chat/call components are mounted.
export const useSocket = (onMessage) => {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let cancelled = false;

    const connect = async (fbUser) => {
      const token = await fbUser.getIdToken();
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws?token=${token}`);

      ws.onopen = () => !cancelled && setConnected(true);
      ws.onclose = () => !cancelled && setConnected(false);
      ws.onmessage = (event) => {
        try {
          onMessageRef.current?.(JSON.parse(event.data));
        } catch {
          /* ignore malformed frames */
        }
      };
      wsRef.current = ws;
    };

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
      if (fbUser) connect(fbUser);
    });

    return () => {
      cancelled = true;
      unsub();
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, connected };
};

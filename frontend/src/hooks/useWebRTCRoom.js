import { useCallback, useEffect, useRef, useState } from "react";
import { useSocketCtx } from "../context/SocketContext.jsx";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

// A small mesh-calling engine: on join, the new peer receives the list of
// everyone already in the room and calls each of them; everyone already
// there just answers. Works for 1:1 calls and small group meetings alike.
// No WebRTC library — plain RTCPeerConnection / getUserMedia.
export const useWebRTCRoom = (room) => {
  const [joined, setJoined] = useState(false);
  const [peers, setPeers] = useState({}); // userId -> { name, stream }
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pcsRef = useRef({}); // userId -> RTCPeerConnection
  const namesRef = useRef({}); // userId -> name

  const createPeerConnection = useCallback((peerId, send) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) send({ type: "signal", room, to: peerId, payload: { kind: "ice-candidate", candidate: e.candidate } });
    };
    pc.ontrack = (e) => {
      setPeers((prev) => ({ ...prev, [peerId]: { name: namesRef.current[peerId] || "Someone", stream: e.streams[0] } }));
    };
    pc.onconnectionstatechange = () => {
      if (["closed", "failed", "disconnected"].includes(pc.connectionState)) {
        setPeers((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }
    };

    localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
    pcsRef.current[peerId] = pc;
    return pc;
  }, [room]);

  const handleMessage = useCallback(async (msg) => {
    if (msg.type === "joined-room" && msg.room === room) {
      // We just joined — call everyone who was already here.
      for (const m of msg.members) {
        namesRef.current[m.id] = m.name;
        const pc = createPeerConnection(m.id, send);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send({ type: "signal", room, to: m.id, payload: { kind: "offer", sdp: offer } });
      }
      setJoined(true);
      return;
    }

    if (msg.type === "presence" && msg.event === "peer-joined") {
      namesRef.current[msg.user.id] = msg.user.name;
      return; // the new peer will call us — we just wait
    }

    if (msg.type === "presence" && msg.event === "left") {
      pcsRef.current[msg.user.id]?.close();
      delete pcsRef.current[msg.user.id];
      setPeers((prev) => {
        const next = { ...prev };
        delete next[msg.user.id];
        return next;
      });
      return;
    }

    if (msg.type === "signal") {
      const peerId = msg.from.id;
      namesRef.current[peerId] = msg.from.name;
      const { kind } = msg.payload;
      let pc = pcsRef.current[peerId];

      if (kind === "offer") {
        if (!pc) pc = createPeerConnection(peerId, send);
        await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ type: "signal", room, to: peerId, payload: { kind: "answer", sdp: answer } });
      } else if (kind === "answer" && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
      } else if (kind === "ice-candidate" && pc) {
        try { await pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate)); } catch { /* ignore */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, createPeerConnection]);

  const { send, connected, subscribe } = useSocketCtx();
  useEffect(() => subscribe(handleMessage), [subscribe, handleMessage]);

  const join = useCallback(async ({ video = true } = {}) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
    localStreamRef.current = stream;
    setCamOn(video);
    send({ type: "join", room });
    return stream;
  }, [room, send]);

  const leave = useCallback(() => {
    send({ type: "leave", room });
    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setJoined(false);
    setPeers({});
  }, [room, send]);

  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn((v) => !v);
  }, []);

  const toggleCam = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn((v) => !v);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        Object.values(pcsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          sender?.replaceTrack(camTrack);
        });
      }
      setScreenSharing(false);
      return;
    }

    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    screenStreamRef.current = screenStream;
    const screenTrack = screenStream.getVideoTracks()[0];
    Object.values(pcsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      sender?.replaceTrack(screenTrack);
    });
    screenTrack.onended = () => toggleScreenShare(); // user stopped sharing via browser UI
    setScreenSharing(true);
  }, [screenSharing]);

  useEffect(() => () => leave(), []); // cleanup on unmount

  return {
    connected,
    joined,
    peers, // { userId: { name, stream } }
    localStream: localStreamRef,
    micOn,
    camOn,
    screenSharing,
    join,
    leave,
    toggleMic,
    toggleCam,
    toggleScreenShare,
  };
};

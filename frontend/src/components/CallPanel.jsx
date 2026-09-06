import React, { useEffect, useRef } from "react";
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare } from "lucide-react";
import { useWebRTCRoom } from "../hooks/useWebRTCRoom.js";

const VideoTile = ({ stream, name, muted, mirrored }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative bg-black/40 rounded-xl overflow-hidden aspect-video">
      <video ref={ref} autoPlay muted={muted} playsInline className={`w-full h-full object-cover ${mirrored ? "-scale-x-100" : ""}`} />
      <span className="absolute bottom-1.5 left-1.5 text-[11px] bg-black/50 px-1.5 py-0.5 rounded">{name}</span>
    </div>
  );
};

// Embedded inside a conversation or a meeting room — same engine either way.
const CallPanel = ({ room, video = true, onLeave, myName }) => {
  const { join, leave, peers, micOn, camOn, screenSharing, toggleMic, toggleCam, toggleScreenShare, localStream } = useWebRTCRoom(room);
  const localVideoRef = useRef(null);

  useEffect(() => {
    join({ video }).then((stream) => {
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeave = () => {
    leave();
    onLeave?.();
  };

  const peerList = Object.entries(peers);

  return (
    <div className="card p-4">
      <div className={`grid gap-3 mb-4 ${peerList.length === 0 ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        <div className="relative bg-black/40 rounded-xl overflow-hidden aspect-video">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
          <span className="absolute bottom-1.5 left-1.5 text-[11px] bg-black/50 px-1.5 py-0.5 rounded">{myName} (you)</span>
        </div>
        {peerList.map(([id, p]) => (
          <VideoTile key={id} stream={p.stream} name={p.name} />
        ))}
        {peerList.length === 0 && (
          <div className="flex items-center justify-center bg-black/20 rounded-xl aspect-video text-muted text-sm">
            Waiting for others to join...
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2.5">
        <button onClick={toggleMic} className="btn-secondary !p-3">{micOn ? <Mic size={16} /> : <MicOff size={16} className="text-accent-red" />}</button>
        <button onClick={toggleCam} className="btn-secondary !p-3">{camOn ? <VideoIcon size={16} /> : <VideoOff size={16} className="text-accent-red" />}</button>
        <button onClick={toggleScreenShare} className={`btn-secondary !p-3 ${screenSharing ? "!bg-accent-blue/25 !text-accent-blue" : ""}`}>
          <ScreenShare size={16} />
        </button>
        <button onClick={handleLeave} className="btn-danger"><PhoneOff size={16} /> Leave</button>
      </div>
    </div>
  );
};

export default CallPanel;

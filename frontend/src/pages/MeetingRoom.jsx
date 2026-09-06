import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import CallPanel from "../components/CallPanel.jsx";
import MessageThread from "../components/MessageThread.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

const MeetingRoom = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/meetings/${code}`)
      .then((res) => setMeeting(res.data.meeting))
      .catch(() => setNotFound(true));
  }, [code]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (notFound) {
    return (
      <DashboardLayout title="Meeting" subtitle="">
        <div className="card p-10 text-center text-muted">
          This meeting doesn't exist, or isn't part of your workspace.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={meeting?.title || "Meeting"} subtitle={meeting ? `Started by ${meeting.createdBy?.name}` : ""}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted">Meeting code:</span>
        <code className="text-xs bg-white/10 px-2 py-1 rounded-md font-mono">{code}</code>
        <button onClick={copyCode} className="btn-secondary !p-1.5">
          {copied ? <Check size={13} className="text-accent-green" /> : <Copy size={13} />}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {meeting && (
            <CallPanel room={`meeting:${code}`} video={true} myName={user.name} onLeave={() => navigate("/meetings")} />
          )}
        </div>
        <div className="card h-[520px] flex flex-col">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-cream">Comments</p>
          </div>
          <div className="flex-1 min-h-0">
            {meeting && <MessageThread room={`meeting:${code}`} placeholder="Comment in this meeting..." />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MeetingRoom;

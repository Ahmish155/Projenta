import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, ArrowRight, Users } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import api from "../api/axios.js";

const Meetings = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const createMeeting = async () => {
    setCreating(true);
    try {
      const res = await api.post("/meetings", {});
      navigate(`/meetings/${res.data.meeting.code}`);
    } finally {
      setCreating(false);
    }
  };

  const joinMeeting = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.get(`/meetings/${joinCode.trim()}`);
      navigate(`/meetings/${joinCode.trim()}`);
    } catch (err) {
      setError(err.response?.data?.message || "Meeting not found");
    }
  };

  return (
    <DashboardLayout title="Meetings" subtitle="Start an instant meeting with video, screen sharing, and live comments">
      <div className="grid md:grid-cols-2 gap-5 max-w-3xl">
        <div className="card p-6 flex flex-col items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-accent-blue/20 text-accent-blue flex items-center justify-center">
            <Video size={20} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-cream mb-1">Create an instant meeting</h3>
            <p className="text-sm text-muted">Anyone in your workspace can start one and share the code.</p>
          </div>
          <button onClick={createMeeting} disabled={creating} className="btn-primary">
            {creating ? "Creating..." : "New meeting"} <ArrowRight size={15} />
          </button>
        </div>

        <div className="card p-6 flex flex-col items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-accent-amber/20 text-accent-amber flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-cream mb-1">Join with a code</h3>
            <p className="text-sm text-muted">Got a meeting code from a teammate? Paste it here.</p>
          </div>
          {error && <p className="text-xs text-accent-red">{error}</p>}
          <form onSubmit={joinMeeting} className="flex gap-2 w-full">
            <input className="input" placeholder="e.g. a1b2c3d4" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
            <button type="submit" className="btn-secondary flex-shrink-0">Join</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Meetings;

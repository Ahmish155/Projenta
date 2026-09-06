import React, { useEffect, useState } from "react";
import { Users, Crown } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import StatCard from "../../components/StatCard.jsx";
import TodoWidget from "../../components/TodoWidget.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/axios.js";

const LeadTeam = () => {
  const { user, team } = useAuth();
  const [members, setMembers] = useState([]);
  const [teamInfo, setTeamInfo] = useState(team);

  useEffect(() => {
    const load = async () => {
      const res = await api.get("/auth/me");
      if (res.data.team) {
        setTeamInfo(res.data.team);
        const teamRes = await api.get(`/teams/${res.data.team._id}`);
        setMembers(teamRes.data.members.filter((m) => m._id !== res.data.user._id));
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout title="My Team" subtitle={teamInfo ? `Leading ${teamInfo.name}` : "You're not assigned to a team yet"}>
      {!teamInfo ? (
        <div className="card p-10 text-center text-muted">
          Ask your admin to assign you as the lead of a team.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
            <StatCard label="Team members" value={members.length} icon={Users} accent="blue" />
            <StatCard label="Your role" value="Lead" icon={Crown} accent="amber" />
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 card p-5">
              <h2 className="font-display font-semibold mb-4 text-cream">Team members</h2>
              {members.length === 0 ? (
                <p className="text-sm text-muted">No members on your team yet — ask your admin to add some.</p>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m._id} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3.5 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-semibold">
                        {m.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cream/90">{m.name}</p>
                        <p className="text-xs text-muted">{m.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <TodoWidget />
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default LeadTeam;

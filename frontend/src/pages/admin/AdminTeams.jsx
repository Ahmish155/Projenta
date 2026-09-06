import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Crown, UserMinus, UserPlus2 } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import Modal from "../../components/Modal.jsx";
import api from "../../api/axios.js";

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [expanded, setExpanded] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    const [teamsRes, usersRes] = await Promise.all([api.get("/teams"), api.get("/users")]);
    setTeams(teamsRes.data.teams);
    setUsers(usersRes.data.users);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openTeam = async (id) => {
    if (expanded === id) return setExpanded(null);
    setExpanded(id);
    const res = await api.get(`/teams/${id}`);
    setTeamMembers(res.data.members);
  };

  const refreshExpanded = async (id) => {
    const res = await api.get(`/teams/${id}`);
    setTeamMembers(res.data.members);
    fetchAll();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/teams", form);
      setShowCreate(false);
      setForm({ name: "" });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create team");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm("Delete this team? Members will become unassigned.")) return;
    await api.delete(`/teams/${id}`);
    setExpanded(null);
    fetchAll();
  };

  const setLead = async (teamId, userId) => {
    await api.put(`/teams/${teamId}`, { lead: userId });
    refreshExpanded(teamId);
  };

  const addMember = async (teamId, userId) => {
    await api.patch(`/teams/${teamId}/members`, { userId, action: "add" });
    refreshExpanded(teamId);
  };

  const removeMember = async (teamId, userId) => {
    await api.patch(`/teams/${teamId}/members`, { userId, action: "remove" });
    refreshExpanded(teamId);
  };

  const unassigned = users.filter((u) => !u.team && u.role !== "admin");

  return (
    <DashboardLayout title="Teams" subtitle="Build teams and appoint team leads">
      <div className="flex justify-end mb-5">
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New team
        </button>
      </div>

      <div className="space-y-4">
        {teams.length === 0 && <div className="card p-10 text-center text-muted">No teams yet — create your first one.</div>}
        {teams.map((t) => (
          <div key={t._id} className="card p-5">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => openTeam(t._id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center font-display font-bold">
                  {t.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-cream">{t.name}</p>
                  <p className="text-xs text-muted">
                    {t.lead ? `Led by ${t.lead.name}` : "No lead assigned"} · {t.memberCount} member{t.memberCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t._id); }} className="p-1.5 rounded-md bg-accent-red/10 text-accent-red hover:bg-accent-red/20">
                <Trash2 size={15} />
              </button>
            </div>

            {expanded === t._id && (
              <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-2">
                {teamMembers.length === 0 && <p className="text-sm text-muted">No members yet.</p>}
                {teamMembers.map((m) => (
                  <div key={m._id} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-cream/90">{m.name}</span>
                      {String(t.lead?._id) === String(m._id) && (
                        <span className="pill bg-accent-blue/15 text-accent-blue"><Crown size={10} /> Lead</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {String(t.lead?._id) !== String(m._id) && (
                        <button onClick={() => setLead(t._id, m._id)} className="text-xs px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-cream/80">
                          Make lead
                        </button>
                      )}
                      <button onClick={() => removeMember(t._id, m._id)} className="p-1.5 rounded-md bg-white/[0.06] text-muted hover:bg-accent-red/20 hover:text-accent-red">
                        <UserMinus size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {unassigned.length > 0 && (
                  <div className="pt-3">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Add someone unassigned</p>
                    <div className="flex flex-wrap gap-2">
                      {unassigned.map((u) => (
                        <button key={u._id} onClick={() => addMember(t._id, u._id)} className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-cream/80">
                          <UserPlus2 size={12} /> {u.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create a new team">
        {error && <div className="mb-4 text-sm text-accent-red bg-accent-red/10 px-3.5 py-2.5 rounded-xl">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Team name</label>
            <input required className="input" placeholder="Design Team" value={form.name} onChange={(e) => setForm({ name: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Creating..." : "Create team"}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminTeams;

import React, { useEffect, useState, useCallback } from "react";
import { UserPlus, Ban, RotateCcw, Trash2, Search } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import Modal from "../../components/Modal.jsx";
import { UserStatusPill, RolePill } from "../../components/StatusPill.jsx";
import api from "../../api/axios.js";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member", team: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    const [usersRes, teamsRes] = await Promise.all([api.get("/users"), api.get("/teams")]);
    setUsers(usersRes.data.users);
    setTeams(teamsRes.data.teams);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = async (u) => {
    await api.patch(`/users/${u._id}`, { status: u.status === "deactivated" ? "active" : "deactivated" });
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently remove this user?")) return;
    await api.delete(`/users/${id}`);
    fetchAll();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/users", { ...form, team: form.team || undefined });
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", role: "member", team: "" });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Users" subtitle="Everyone in your workspace, with their role and team">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !pl-9 !py-2 w-56" placeholder="Search people..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn-primary whitespace-nowrap" onClick={() => setShowAdd(true)}>
          <UserPlus size={16} /> Add user
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide border-b border-white/[0.06]">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Team</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted">No users found.</td></tr>
              )}
              {filtered.map((u) => (
                <tr key={u._id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium text-cream/90">{u.name}</td>
                  <td className="px-5 py-3.5 text-muted">{u.email}</td>
                  <td className="px-5 py-3.5"><RolePill role={u.role} /></td>
                  <td className="px-5 py-3.5 text-muted">{u.team?.name || "—"}</td>
                  <td className="px-5 py-3.5"><UserStatusPill status={u.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.role !== "admin" && (
                        <>
                          <button onClick={() => handleToggleStatus(u)} className="p-1.5 rounded-md bg-white/[0.06] text-muted hover:bg-white/[0.1]" title={u.status === "deactivated" ? "Reactivate" : "Deactivate"}>
                            {u.status === "deactivated" ? <RotateCcw size={15} /> : <Ban size={15} />}
                          </button>
                          <button onClick={() => handleDelete(u._id)} className="p-1.5 rounded-md bg-accent-red/10 text-accent-red hover:bg-accent-red/20" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add a new user">
        {error && <div className="mb-4 text-sm text-accent-red bg-accent-red/10 px-3.5 py-2.5 rounded-xl">{error}</div>}
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="member">Member</option>
                <option value="teamlead">Team Lead</option>
              </select>
            </div>
            <div>
              <label className="label">Team (optional)</label>
              <select className="input" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })}>
                <option value="">Unassigned</option>
                {teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted">
            If you set the role to "Team Lead" and pick a team, they'll become that team's lead.
          </p>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Adding..." : "Add user"}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminUsers;

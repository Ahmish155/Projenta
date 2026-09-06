import React, { useEffect, useState, useCallback } from "react";
import { Plus, Play, Square, Trash2, Pencil, Flag, CheckCircle2 } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import Modal from "../../components/Modal.jsx";
import { TaskStatusPill } from "../../components/StatusPill.jsx";
import { LiveTimer, StaticDuration } from "../../components/LiveTimer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/axios.js";

const emptyForm = { title: "", description: "", requirements: "", priority: "medium", dueDate: "", assignedTo: "" };

const LeadTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(async () => {
    const [tasksRes, usersRes] = await Promise.all([
      api.get("/tasks"),
      api.get("/users", { params: { role: "member" } }),
    ]);
    setTasks(tasksRes.data.tasks);
    setMembers(usersRes.data.users);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Tasks assigned TO me by the admin — I work these myself
  const assignedToMe = tasks.filter((t) => t.assignedTo?._id === user._id);
  // Tasks I've assigned to my team members
  const assignedByMe = tasks.filter((t) => t.assignedBy?._id === user._id);

  const handleStart = async (id) => {
    setBusyId(id);
    try { await api.patch(`/tasks/${id}/start`); await fetchAll(); } finally { setBusyId(null); }
  };
  const handleEnd = async (id) => {
    setBusyId(id);
    try { await api.patch(`/tasks/${id}/end`); await fetchAll(); } finally { setBusyId(null); }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setError(""); setShowForm(true); };
  const openEdit = (t) => {
    setEditingId(t._id);
    setForm({ title: t.title, description: t.description || "", requirements: t.requirements || "", priority: t.priority, dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "", assignedTo: t.assignedTo?._id || "" });
    setError(""); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      if (editingId) await api.put(`/tasks/${editingId}`, form);
      else await api.post("/tasks", form);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save task");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    await api.delete(`/tasks/${id}`);
    fetchAll();
  };

  return (
    <DashboardLayout title="Tasks" subtitle="Work assigned to you, and work you've delegated to your team">
      {/* My own tasks (from admin) */}
      <section className="mb-8">
        <h2 className="font-display font-semibold text-cream mb-3">Assigned to me</h2>
        {assignedToMe.length === 0 ? (
          <div className="card p-6 text-center text-muted text-sm">Nothing assigned to you yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignedToMe.map((t) => (
              <div key={t._id} className="card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="pill bg-white/[0.06] text-muted"><Flag size={11} /> {t.priority}</span>
                  <TaskStatusPill status={t.status} />
                </div>
                <h3 className="font-display font-semibold text-sm text-cream">{t.title}</h3>
                {t.description && <p className="text-xs text-muted leading-relaxed">{t.description}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                  <span className="text-xs text-muted">by {t.assignedBy?.name}</span>
                  {t.status === "pending" && <button className="btn-primary !py-1.5 !px-3 text-xs" disabled={busyId === t._id} onClick={() => handleStart(t._id)}><Play size={13} /> Start</button>}
                  {t.status === "in-progress" && <><LiveTimer startedAt={t.startedAt} /><button className="btn-danger !py-1.5 !px-3 text-xs ml-2" disabled={busyId === t._id} onClick={() => handleEnd(t._id)}><Square size={13} /> End</button></>}
                  {t.status === "completed" && <StaticDuration seconds={t.durationSeconds} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tasks I assign to my team */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-cream">Assigned to my team</h2>
          <button className="btn-primary !py-2 !px-3.5 text-xs" onClick={openCreate} disabled={members.length === 0}>
            <Plus size={14} /> New task
          </button>
        </div>
        {members.length === 0 && (
          <div className="mb-4 text-sm text-accent-amber bg-accent-amber/10 px-4 py-3 rounded-xl">
            You have no team members yet — ask your admin to add people to your team.
          </div>
        )}
        {assignedByMe.length === 0 ? (
          <div className="card p-6 text-center text-muted text-sm">No tasks delegated yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignedByMe.map((t) => (
              <div key={t._id} className="card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="pill bg-white/[0.06] text-muted"><Flag size={11} /> {t.priority}</span>
                    <TaskStatusPill status={t.status} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-md bg-white/[0.06] text-muted hover:bg-white/[0.1]"><Pencil size={12} /></button>
                    <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded-md bg-accent-red/10 text-accent-red hover:bg-accent-red/20"><Trash2 size={12} /></button>
                  </div>
                </div>
                <h3 className="font-display font-semibold text-sm text-cream">{t.title}</h3>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-xs text-muted">
                  <span>Assigned to {t.assignedTo?.name}</span>
                  {t.status === "in-progress" && <LiveTimer startedAt={t.startedAt} />}
                  {t.status === "completed" && <StaticDuration seconds={t.durationSeconds} />}
                  {t.status === "completed" && <CheckCircle2 size={14} className="text-accent-green" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit task" : "Assign a new task"} wide>
        {error && <div className="mb-4 text-sm text-accent-red bg-accent-red/10 px-3.5 py-2.5 rounded-xl">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Task title</label>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Requirements</label>
            <textarea rows={2} className="input" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Assign to (your team)</label>
              <select required className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Select member</option>
                {members.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Saving..." : editingId ? "Save changes" : "Assign task"}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default LeadTasks;

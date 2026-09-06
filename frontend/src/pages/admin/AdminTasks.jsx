import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Pencil, Flag, Search } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import Modal from "../../components/Modal.jsx";
import { TaskStatusPill } from "../../components/StatusPill.jsx";
import { LiveTimer, StaticDuration } from "../../components/LiveTimer.jsx";
import api from "../../api/axios.js";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in-progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];
const emptyForm = { title: "", description: "", requirements: "", priority: "medium", dueDate: "", assignedTo: "" };

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    const [tasksRes, usersRes] = await Promise.all([api.get("/tasks"), api.get("/users", { params: { role: "teamlead" } })]);
    setTasks(tasksRes.data.tasks);
    setLeads(usersRes.data.users);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = tasks
    .filter((t) => (tab === "all" ? true : t.status === tab))
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

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

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <DashboardLayout title="Tasks" subtitle="Assign work to your team leads — they'll delegate to their teams">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${tab === t.key ? "bg-cream text-base-900" : "bg-white/[0.05] text-cream/70 border border-white/10 hover:bg-white/[0.1]"}`}>
              {t.label} <span className="opacity-60">({counts[t.key]})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input !pl-9 !py-2 w-48" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary whitespace-nowrap" onClick={openCreate} disabled={leads.length === 0}>
            <Plus size={16} /> New task
          </button>
        </div>
      </div>

      {leads.length === 0 && (
        <div className="mb-5 text-sm text-accent-amber bg-accent-amber/10 px-4 py-3 rounded-xl">
          Appoint at least one Team Lead (in Users or Teams) before assigning tasks — admins can only assign to team leads.
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && <div className="col-span-full card p-10 text-center text-muted">No tasks match this view.</div>}
        {filtered.map((t) => (
          <div key={t._id} className="card p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="pill bg-white/[0.06] text-muted"><Flag size={11} /> {t.priority}</span>
                  <TaskStatusPill status={t.status} />
                </div>
                <h3 className="font-display font-semibold text-sm leading-snug text-cream">{t.title}</h3>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-md bg-white/[0.06] text-muted hover:bg-white/[0.1]"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded-md bg-accent-red/10 text-accent-red hover:bg-accent-red/20"><Trash2 size={13} /></button>
              </div>
            </div>
            {t.description && <p className="text-xs text-muted leading-relaxed line-clamp-2">{t.description}</p>}
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05] text-xs text-muted">
              <div className="w-6 h-6 rounded-full bg-accent-blue/15 text-accent-blue flex items-center justify-center font-semibold text-[10px]">
                {t.assignedTo?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="font-medium text-cream/80">{t.assignedTo?.name || "Unassigned"} (Team Lead)</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <span>{t.startedAt ? `Started ${new Date(t.startedAt).toLocaleString()}` : "Not started"}</span>
              {t.status === "in-progress" && <LiveTimer startedAt={t.startedAt} />}
              {t.status === "completed" && <StaticDuration seconds={t.durationSeconds} />}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit task" : "Create a new task"} wide>
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
              <label className="label">Assign to (Team Lead)</label>
              <select required className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Select lead</option>
                {leads.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
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
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Saving..." : editingId ? "Save changes" : "Create task"}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminTasks;

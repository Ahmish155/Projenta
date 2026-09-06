import React, { useEffect, useState, useCallback } from "react";
import { Play, Square, Clock, Flag, ClipboardList, CheckCircle2, Loader2 } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import StatCard from "../../components/StatCard.jsx";
import TodoWidget from "../../components/TodoWidget.jsx";
import { TaskStatusPill } from "../../components/StatusPill.jsx";
import { LiveTimer, StaticDuration } from "../../components/LiveTimer.jsx";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";

const PRIORITY_STYLES = {
  low: "bg-white/[0.06] text-muted",
  medium: "bg-accent-amber/15 text-accent-amber",
  high: "bg-accent-red/15 text-accent-red",
};

const TaskCard = ({ task, onStart, onEnd, busy }) => (
  <div className="card p-5 flex flex-col gap-4">
    <div className="flex items-center gap-2">
      <span className={`pill ${PRIORITY_STYLES[task.priority]}`}><Flag size={11} /> {task.priority}</span>
      <TaskStatusPill status={task.status} />
    </div>
    <h3 className="font-display font-semibold text-base leading-snug text-cream">{task.title}</h3>
    {task.description && <p className="text-sm text-cream/60 leading-relaxed">{task.description}</p>}
    {task.requirements && (
      <div className="text-xs text-muted bg-white/[0.03] rounded-lg px-3 py-2.5">
        <span className="font-semibold text-cream/70">Requirements: </span>{task.requirements}
      </div>
    )}
    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Clock size={13} />
        {task.status === "pending" && "Not started yet"}
        {task.status === "in-progress" && <LiveTimer startedAt={task.startedAt} />}
        {task.status === "completed" && <StaticDuration seconds={task.durationSeconds} />}
      </div>
      {task.status === "pending" && <button className="btn-primary !py-2 !px-3.5 text-xs" disabled={busy} onClick={() => onStart(task._id)}><Play size={14} /> Start Task</button>}
      {task.status === "in-progress" && <button className="btn-danger !py-2 !px-3.5 text-xs" disabled={busy} onClick={() => onEnd(task._id)}><Square size={14} /> End Task</button>}
      {task.status === "completed" && <span className="text-xs font-semibold text-accent-green flex items-center gap-1"><CheckCircle2 size={14} /> Done</span>}
    </div>
  </div>
);

const FILTERS = ["all", "pending", "in-progress", "completed"];

const MemberDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  const fetchTasks = useCallback(async () => {
    const res = await api.get("/tasks");
    setTasks(res.data.tasks);
  }, []);

  useEffect(() => { fetchTasks().finally(() => setLoading(false)); }, [fetchTasks]);

  const handleStart = async (id) => { setBusyId(id); try { await api.patch(`/tasks/${id}/start`); await fetchTasks(); } finally { setBusyId(null); } };
  const handleEnd = async (id) => { setBusyId(id); try { await api.patch(`/tasks/${id}/end`); await fetchTasks(); } finally { setBusyId(null); } };

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };
  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <DashboardLayout title={`Hi, ${user?.name?.split(" ")[0]}`} subtitle="Here's what's on your plate today">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total tasks" value={stats.total} icon={ClipboardList} accent="cream" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="cream" />
        <StatCard label="In progress" value={stats.inProgress} icon={Loader2} accent="amber" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? "bg-cream text-base-900" : "bg-white/[0.05] text-cream/70 border border-white/10 hover:bg-white/[0.1]"}`}>
                {f === "all" ? "All" : f.replace("-", " ")}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted text-sm">Loading your tasks...</div>
          ) : visible.length === 0 ? (
            <div className="card text-center py-16">
              <ClipboardList className="mx-auto text-muted mb-3" size={36} />
              <p className="text-muted text-sm">No tasks here yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {visible.map((task) => (
                <TaskCard key={task._id} task={task} onStart={handleStart} onEnd={handleEnd} busy={busyId === task._id} />
              ))}
            </div>
          )}
        </div>
        <TodoWidget />
      </div>
    </DashboardLayout>
  );
};

export default MemberDashboard;

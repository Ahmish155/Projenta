import React, { useEffect, useState } from "react";
import { Users, UsersRound, ListChecks, Loader2, CheckCircle2 } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import StatCard from "../../components/StatCard.jsx";
import TodoWidget from "../../components/TodoWidget.jsx";
import { TaskStatusPill } from "../../components/StatusPill.jsx";
import api from "../../api/axios.js";

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [statsRes, usersRes, teamsRes, tasksRes] = await Promise.all([
        api.get("/tasks/stats/overview"),
        api.get("/users"),
        api.get("/teams"),
        api.get("/tasks"),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setTeams(teamsRes.data.teams);
      setRecentTasks(tasksRes.data.tasks.slice(0, 6));
    };
    load();
  }, []);

  return (
    <DashboardLayout title="Overview" subtitle="A snapshot of your whole workspace">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="People" value={users.length} icon={Users} accent="cream" />
        <StatCard label="Teams" value={teams.length} icon={UsersRound} accent="blue" />
        <StatCard label="Tasks in progress" value={stats?.inProgress ?? "–"} icon={Loader2} accent="amber" />
        <StatCard label="Tasks completed" value={stats?.completed ?? "–"} icon={CheckCircle2} accent="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-cream">Recent tasks</h2>
            <ListChecks size={17} className="text-muted" />
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 && <p className="text-sm text-muted">No tasks created yet.</p>}
            {recentTasks.map((t) => (
              <div key={t._id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-cream/90">{t.title}</p>
                  <p className="text-xs text-muted">
                    {t.assignedBy?.name} → {t.assignedTo?.name}
                  </p>
                </div>
                <TaskStatusPill status={t.status} />
              </div>
            ))}
          </div>
        </div>

        <TodoWidget />
      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;

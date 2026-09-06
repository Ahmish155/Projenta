import React from "react";

const TASK_MAP = {
  pending: { cls: "pill-pending", label: "Pending", dot: "bg-muted" },
  "in-progress": { cls: "pill-inprogress", label: "In Progress", dot: "bg-accent-amber animate-pulseDot" },
  completed: { cls: "pill-completed", label: "Completed", dot: "bg-accent-green" },
};
const USER_MAP = {
  active: { cls: "pill-active", label: "Active", dot: "bg-accent-green" },
  deactivated: { cls: "pill-deactivated", label: "Deactivated", dot: "bg-accent-red" },
};

export const TaskStatusPill = ({ status }) => {
  const m = TASK_MAP[status] || TASK_MAP.pending;
  return (
    <span className={m.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

export const UserStatusPill = ({ status }) => {
  const m = USER_MAP[status] || USER_MAP.active;
  return (
    <span className={m.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

export const RolePill = ({ role }) => {
  const labelMap = { admin: "Admin", teamlead: "Team Lead", member: "Member" };
  const colorMap = {
    admin: "bg-cream/10 text-cream",
    teamlead: "bg-accent-blue/15 text-accent-blue",
    member: "bg-white/[0.06] text-muted",
  };
  return <span className={`pill ${colorMap[role]}`}>{labelMap[role]}</span>;
};

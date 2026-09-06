import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, Users, UsersRound, ListChecks, LogOut, Menu, X, ClipboardList, MessageSquare, Video, CalendarDays } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useUnread } from "../context/UnreadContext.jsx";

const SHARED = [
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/meetings", label: "Meetings", icon: Video },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
];

const NAV = {
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutGrid, end: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/teams", label: "Teams", icon: UsersRound },
    { to: "/admin/tasks", label: "Tasks", icon: ListChecks },
    ...SHARED,
  ],
  teamlead: [
    { to: "/lead", label: "My Team", icon: UsersRound, end: true },
    { to: "/lead/tasks", label: "Tasks", icon: ListChecks },
    ...SHARED,
  ],
  member: [
    { to: "/member", label: "My Tasks", icon: ClipboardList, end: true },
    ...SHARED,
  ],
};

const DashboardLayout = ({ children, title, subtitle }) => {
  const { user, workspace, logout } = useAuth();
  const { totalUnread } = useUnread();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = NAV[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/[0.06] backdrop-blur-xl border-r border-white/[0.12] text-cream flex flex-col transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-white/[0.06]">
          <div className="w-7 h-7 rounded-md bg-cream text-base-900 flex items-center justify-center font-display font-bold text-sm">
            P
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-sm leading-tight tracking-tight truncate">
              {workspace?.name || "Projenta"}
            </p>
            <p className="text-[10px] text-muted uppercase tracking-wide">Workspace</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-white/[0.08] text-cream" : "text-muted hover:bg-white/[0.04] hover:text-cream"
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon size={17} strokeWidth={2} />
                {label}
              </span>
              {label === "Messages" && totalUnread > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent-red text-white text-[10px] font-bold flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-xs font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted capitalize">{user?.role === "teamlead" ? "Team Lead" : user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-white/[0.04] hover:text-cream transition-colors"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/[0.05] backdrop-blur-xl border-b border-white/[0.12] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-cream" onClick={() => setOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h1 className="font-display font-semibold text-lg leading-tight text-cream">{title}</h1>
              {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;

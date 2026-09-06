import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Landing/Login/CreateWorkspace stay eager — they're the first thing an
// unauthenticated visitor sees, so no reason to add a lazy-load hop there.
import Landing from "./pages/Landing.jsx";
import CreateWorkspace from "./pages/CreateWorkspace.jsx";
import Login from "./pages/Login.jsx";

// Everything behind login is lazy-loaded per route — a fresh visitor's
// first paint doesn't need to download the admin dashboard, the calendar,
// the WebRTC call engine, etc. all at once. Meaningfully smaller initial bundle.
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.jsx"));
const AdminTeams = lazy(() => import("./pages/admin/AdminTeams.jsx"));
const AdminTasks = lazy(() => import("./pages/admin/AdminTasks.jsx"));

const LeadTeam = lazy(() => import("./pages/lead/LeadTeam.jsx"));
const LeadTasks = lazy(() => import("./pages/lead/LeadTasks.jsx"));

const MemberDashboard = lazy(() => import("./pages/member/MemberDashboard.jsx"));

const Messages = lazy(() => import("./pages/Messages.jsx"));
const Meetings = lazy(() => import("./pages/Meetings.jsx"));
const MeetingRoom = lazy(() => import("./pages/MeetingRoom.jsx"));
const Calendar = lazy(() => import("./pages/Calendar.jsx"));

const ALL_ROLES = ["admin", "teamlead", "member"];

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create-workspace" element={<CreateWorkspace />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminOverview /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/teams" element={<ProtectedRoute roles={["admin"]}><AdminTeams /></ProtectedRoute>} />
        <Route path="/admin/tasks" element={<ProtectedRoute roles={["admin"]}><AdminTasks /></ProtectedRoute>} />

        <Route path="/lead" element={<ProtectedRoute roles={["teamlead"]}><LeadTeam /></ProtectedRoute>} />
        <Route path="/lead/tasks" element={<ProtectedRoute roles={["teamlead"]}><LeadTasks /></ProtectedRoute>} />

        <Route path="/member" element={<ProtectedRoute roles={["member"]}><MemberDashboard /></ProtectedRoute>} />

        <Route path="/messages" element={<ProtectedRoute roles={ALL_ROLES}><Messages /></ProtectedRoute>} />
        <Route path="/meetings" element={<ProtectedRoute roles={ALL_ROLES}><Meetings /></ProtectedRoute>} />
        <Route path="/meetings/:code" element={<ProtectedRoute roles={ALL_ROLES}><MeetingRoom /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute roles={ALL_ROLES}><Calendar /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

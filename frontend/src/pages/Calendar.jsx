import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { TaskStatusPill } from "../components/StatusPill.jsx";
import api from "../api/axios.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const Calendar = () => {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(new Date());

  useEffect(() => {
    api.get("/tasks").then((res) => setTasks(res.data.tasks.filter((t) => t.dueDate)));
  }, []);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [cursor]);

  const tasksOnDay = (day) => (day ? tasks.filter((t) => sameDay(new Date(t.dueDate), day)) : []);
  const selectedTasks = tasksOnDay(selected);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <DashboardLayout title="Calendar" subtitle="Tasks plotted by their due date">
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-cream">{monthLabel}</h2>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="btn-secondary !p-2">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="btn-secondary !p-2">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-muted uppercase tracking-wide py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {grid.map((day, i) => {
              const count = tasksOnDay(day).length;
              const isSelected = day && sameDay(day, selected);
              const isToday = day && sameDay(day, new Date());
              return (
                <button
                  key={i}
                  disabled={!day}
                  onClick={() => day && setSelected(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm transition-colors ${
                    !day ? "" : isSelected ? "bg-cream text-base-950 font-semibold" : "bg-white/5 hover:bg-white/10 text-cream/80"
                  }`}
                >
                  {day && (
                    <>
                      <span className={isToday && !isSelected ? "text-accent-amber font-semibold" : ""}>{day.getDate()}</span>
                      {count > 0 && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-base-950" : "bg-accent-amber"}`} />}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-cream mb-4">
            {selected.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </h3>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted">No tasks due this day.</p>
          ) : (
            <div className="space-y-2.5">
              {selectedTasks.map((t) => (
                <div key={t._id} className="bg-white/5 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="pill bg-white/10 text-muted"><Flag size={10} /> {t.priority}</span>
                    <TaskStatusPill status={t.status} />
                  </div>
                  <p className="text-sm font-medium text-cream/90">{t.title}</p>
                  <p className="text-xs text-muted mt-1">Assigned to {t.assignedTo?.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;

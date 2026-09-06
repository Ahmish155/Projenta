import React, { useEffect, useState } from "react";

const format = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
};

export const LiveTimer = ({ startedAt }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <span className="font-mono text-xs font-semibold text-accent-amber bg-accent-amber/10 px-2 py-1 rounded-md tabular-nums">
      {format(elapsed)}
    </span>
  );
};

export const StaticDuration = ({ seconds }) => (
  <span className="font-mono text-xs font-semibold text-accent-green bg-accent-green/10 px-2 py-1 rounded-md tabular-nums">
    {format(seconds || 0)}
  </span>
);

export default LiveTimer;

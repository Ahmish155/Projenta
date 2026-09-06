import React from "react";

const StatCard = ({ label, value, icon: Icon, accent = "cream" }) => {
  const accentMap = {
    cream: "bg-white/[0.06] text-cream",
    amber: "bg-accent-amber/15 text-accent-amber",
    green: "bg-accent-green/15 text-accent-green",
    blue: "bg-accent-blue/15 text-accent-blue",
    red: "bg-accent-red/15 text-accent-red",
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentMap[accent]}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold leading-none text-cream">{value}</p>
        <p className="text-xs text-muted mt-1.5 font-medium">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;

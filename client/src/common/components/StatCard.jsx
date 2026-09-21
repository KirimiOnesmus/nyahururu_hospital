import React from "react";

const StatCard = ({ label, value, sub, accent = {}, icon: Icon }) => (
  <div className="bg-surface rounded-2xl border border-line p-5 flex items-center gap-4 shadow-sm">
    {Icon && (
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent.bg || "bg-primary-soft"}`}
      >
        <Icon className={`w-5 h-5 ${accent.icon || "text-primary"}`} aria-hidden="true" />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent.num || "text-ink"}`}>{value}</p>
      {sub && <p className="text-xs text-ink-muted mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default StatCard;

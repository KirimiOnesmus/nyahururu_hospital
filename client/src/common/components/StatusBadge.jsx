import React from "react";

const presets = {

  active:    { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  approved:  { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  completed: { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  confirmed: { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  success:   { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },


  pending:   { bg: "bg-amber-50",  text: "text-amber-700", dot: "bg-amber-500" },
  review:    { bg: "bg-amber-50",  text: "text-amber-700", dot: "bg-amber-500" },
  "in-progress": { bg: "bg-amber-50",  text: "text-amber-700", dot: "bg-amber-500" },


  rejected:  { bg: "bg-red-50",    text: "text-red-700",   dot: "bg-red-500" },
  cancelled: { bg: "bg-red-50",    text: "text-red-700",   dot: "bg-red-500" },
  declined:  { bg: "bg-red-50",    text: "text-red-700",   dot: "bg-red-500" },
  failed:    { bg: "bg-red-50",    text: "text-red-700",   dot: "bg-red-500" },


  info:      { bg: "bg-blue-50",   text: "text-blue-700",  dot: "bg-blue-500" },
  submitted: { bg: "bg-blue-50",   text: "text-blue-700",  dot: "bg-blue-500" },
  new:       { bg: "bg-blue-50",   text: "text-blue-700",  dot: "bg-blue-500" },

  draft:     { bg: "bg-gray-100",  text: "text-gray-600",  dot: "bg-gray-400" },
  inactive:  { bg: "bg-gray-100",  text: "text-gray-600",  dot: "bg-gray-400" },
  closed:    { bg: "bg-gray-100",  text: "text-gray-600",  dot: "bg-gray-400" },
};

const fallback = { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };


const StatusBadge = ({ status, label, colors, icon: Icon, className = "" }) => {
  const key = status?.toLowerCase().replace(/\s+/g, "-");
  const c = colors || presets[key] || fallback;
  const display = label || status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {Icon && <Icon className="text-[10px]" />}
      {display}
    </span>
  );
};

export default StatusBadge;

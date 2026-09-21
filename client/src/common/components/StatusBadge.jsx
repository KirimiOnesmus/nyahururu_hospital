import React from "react";

const presets = {
  active: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-800 dark:text-emerald-200", dot: "bg-emerald-600" },
  approved: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-800 dark:text-emerald-200", dot: "bg-emerald-600" },
  completed: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-800 dark:text-emerald-200", dot: "bg-emerald-600" },
  confirmed: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-800 dark:text-emerald-200", dot: "bg-emerald-600" },
  success: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-800 dark:text-emerald-200", dot: "bg-emerald-600" },
  paid: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-800 dark:text-emerald-200", dot: "bg-emerald-600" },

  pending: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-200", dot: "bg-amber-600" },
  review: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-200", dot: "bg-amber-600" },
  "in-progress": { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-200", dot: "bg-amber-600" },
  open: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-200", dot: "bg-amber-600" },

  rejected: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-800 dark:text-red-200", dot: "bg-red-600" },
  cancelled: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-800 dark:text-red-200", dot: "bg-red-600" },
  declined: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-800 dark:text-red-200", dot: "bg-red-600" },
  failed: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-800 dark:text-red-200", dot: "bg-red-600" },
  overdue: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-800 dark:text-red-200", dot: "bg-red-600" },

  info: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-800 dark:text-blue-200", dot: "bg-blue-600" },
  submitted: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-800 dark:text-blue-200", dot: "bg-blue-600" },
  new: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-800 dark:text-blue-200", dot: "bg-blue-600" },

  draft: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" },
  inactive: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" },
  closed: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" },
};

const fallback = {
  bg: "bg-gray-100 dark:bg-gray-800",
  text: "text-gray-700 dark:text-gray-300",
  dot: "bg-gray-500",
};

const StatusBadge = ({ status, label, colors, icon: Icon, className = "" }) => {
  const key = status?.toLowerCase().replace(/\s+/g, "-");
  const c = colors || presets[key] || fallback;
  const display =
    label || (status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown");

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} aria-hidden="true" />
      {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
      {display}
    </span>
  );
};

export default StatusBadge;

import React from "react";
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from "react-icons/fa";

const styles = {
  success: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", Icon: FaCheckCircle },
  error:   { bg: "bg-red-50 border-red-200",         text: "text-red-700",     Icon: FaTimesCircle },
  warning: { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   Icon: FaExclamationTriangle },
  info:    { bg: "bg-blue-50 border-blue-200",        text: "text-blue-700",    Icon: FaInfoCircle },
};

const Alert = ({
  variant = "info",
  children,
  onClose,
  className = "",
}) => {
  const s = styles[variant] || styles.info;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${s.bg} ${className}`} role="alert">
      <s.Icon className={`text-sm mt-0.5 shrink-0 ${s.text}`} />
      <div className={`flex-1 text-sm ${s.text}`}>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className={`shrink-0 p-1 rounded-lg hover:bg-black/5 cursor-pointer transition-colors ${s.text}`}
          aria-label="Dismiss"
        >
          <FaTimes className="text-xs" />
        </button>
      )}
    </div>
  );
};

export default Alert;

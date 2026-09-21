import React from "react";
import { IconClose, IconCheckCircle, IconWarning, IconInfo, IconXCircle } from "../icons";

const styles = {
  success: { bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800", text: "text-emerald-800 dark:text-emerald-200", Icon: IconCheckCircle },
  error: { bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800", text: "text-red-800 dark:text-red-200", Icon: IconXCircle },
  warning: { bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800", text: "text-amber-800 dark:text-amber-200", Icon: IconWarning },
  info: { bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800", text: "text-blue-800 dark:text-blue-200", Icon: IconInfo },
};

const Alert = ({ variant = "info", children, onClose, className = "" }) => {
  const s = styles[variant] || styles.info;
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${s.bg} ${className}`}
      role="alert"
    >
      <s.Icon className={`w-4 h-4 mt-0.5 shrink-0 ${s.text}`} aria-hidden="true" />
      <div className={`flex-1 text-sm ${s.text}`}>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 min-w-11 min-h-11 -mr-2 -mt-1 inline-flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ${s.text}`}
          aria-label="Dismiss"
        >
          <IconClose className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;

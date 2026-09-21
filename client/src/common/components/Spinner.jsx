import React from "react";

const Spinner = ({ text = "Loading…", className = "" }) => (
  <div className={`flex flex-col items-center justify-center py-16 gap-3 ${className}`} role="status">
    <div
      className="w-10 h-10 border-2 border-line border-t-primary rounded-full animate-spin"
      aria-hidden="true"
    />
    <p className="text-sm text-ink-muted">{text}</p>
    <span className="sr-only">{text}</span>
  </div>
);

export default Spinner;

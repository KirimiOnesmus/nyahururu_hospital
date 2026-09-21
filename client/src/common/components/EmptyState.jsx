import React from "react";
import { IconInbox } from "../icons";

const EmptyState = ({
  text = "No records found",
  description,
  icon: Icon = IconInbox,
  action,
  className = "",
}) => (
  <div className={`flex flex-col items-center justify-center py-16 px-6 gap-3 text-center ${className}`}>
    <div className="w-14 h-14 bg-canvas rounded-2xl flex items-center justify-center border border-line">
      <Icon className="w-6 h-6 text-ink-muted" aria-hidden="true" />
    </div>
    <p className="text-sm font-semibold text-ink">{text}</p>
    {description && <p className="text-sm text-ink-muted max-w-sm">{description}</p>}
    {action}
  </div>
);

export default EmptyState;

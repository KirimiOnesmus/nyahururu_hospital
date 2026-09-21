import React from "react";

const PageHeader = ({ title, subtitle, icon: Icon, actions, className = "" }) => (
  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
    <div className="flex items-center gap-3 min-w-0">
      {Icon && (
        <div className="w-11 h-11 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-ink truncate">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
  </div>
);

export default PageHeader;

import React from "react";

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  className = "",
}) => (
  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
    <div className="flex items-center gap-3 min-w-0">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Icon className="text-lg text-blue-600" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {actions && (
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    )}
  </div>
);

export default PageHeader;

import React from "react";
import { IconWarning, IconCheck } from "../icons";

const FormField = ({
  label,
  required,
  error,
  success,
  hint,
  htmlFor,
  children,
  className = "",
}) => (
  <div className={className}>
    {label && (
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">
        {label}
        {required && (
          <span className="text-danger ml-0.5" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>
    )}
    {children}
    {error && (
      <p
        className="mt-1.5 text-xs text-danger flex items-start gap-1.5"
        role="alert"
      >
        <IconWarning className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </p>
    )}
    {!error && success && (
      <p className="mt-1.5 text-xs text-success flex items-start gap-1.5">
        <IconCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{success}</span>
      </p>
    )}
    {!error && !success && hint && (
      <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
    )}
  </div>
);

export default FormField;

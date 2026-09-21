import React from "react";
import FormField from "./FormField";

const inputBase =
  "w-full min-h-11 px-4 py-2.5 border rounded-xl text-sm outline-none transition-shadow bg-surface text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-primary/30 focus:border-primary";

const Input = ({
  label,
  required,
  error,
  success,
  hint,
  icon: Icon,
  trailing,
  className = "",
  wrapperClassName = "",
  id,
  ...rest
}) => {
  const inputId = id || rest.name;
  const borderCls = error
    ? "border-red-400"
    : success
      ? "border-emerald-400"
      : "border-line";
  const padLeft = Icon ? "pl-10" : "";
  const padRight = trailing ? "pr-12" : "";

  const field = (
    <div className={Icon || trailing ? "relative" : undefined}>
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      )}
      <input
        id={inputId}
        className={`${inputBase} ${borderCls} ${padLeft} ${padRight} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {trailing && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</div>
      )}
    </div>
  );

  if (!label && !error && !hint && !success) return field;

  return (
    <FormField
      label={label}
      required={required}
      error={error}
      success={success}
      hint={hint}
      htmlFor={inputId}
      className={wrapperClassName}
    >
      {field}
    </FormField>
  );
};

export default Input;

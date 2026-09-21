import React from "react";
import FormField from "./FormField";
import { IconChevronDown } from "../icons";

const selectBase =
  "w-full min-h-11 px-4 py-2.5 pr-10 border rounded-xl text-sm outline-none transition-shadow bg-surface text-ink appearance-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

const Select = ({
  label,
  required,
  error,
  hint,
  options = [],
  placeholder,
  className = "",
  wrapperClassName = "",
  id,
  ...rest
}) => {
  const selectId = id || rest.name;
  const borderCls = error ? "border-red-400" : "border-line";

  const select = (
    <div className="relative">
      <select
        id={selectId}
        className={`${selectBase} ${borderCls} ${className}`}
        aria-invalid={!!error}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const value = typeof opt === "object" ? opt.value : opt;
          const optLabel = typeof opt === "object" ? opt.label : opt;
          return (
            <option key={value} value={value}>
              {optLabel}
            </option>
          );
        })}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted">
        <IconChevronDown className="w-4 h-4" aria-hidden="true" />
      </div>
    </div>
  );

  if (!label && !error && !hint) return select;

  return (
    <FormField
      label={label}
      required={required}
      error={error}
      hint={hint}
      htmlFor={selectId}
      className={wrapperClassName}
    >
      {select}
    </FormField>
  );
};

export default Select;

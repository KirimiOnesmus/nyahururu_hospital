import React from "react";
import FormField from "./FormField";

const selectBase =
  "w-full px-4 py-3 border rounded-xl text-sm outline-none transition-shadow bg-white appearance-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

const Select = ({
  label,
  required,
  error,
  options = [],
  placeholder,
  className = "",
  wrapperClassName = "",
  id,
  ...rest
}) => {
  const selectId = id || rest.name;
  const borderCls = error ? "border-red-400" : "border-gray-200";

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
          const label = typeof opt === "object" ? opt.label : opt;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  if (!label && !error) return select;

  return (
    <FormField label={label} required={required} error={error} htmlFor={selectId} className={wrapperClassName}>
      {select}
    </FormField>
  );
};

export default Select;

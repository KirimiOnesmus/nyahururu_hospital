import React from "react";
import FormField from "./FormField";

const inputBase =
  "w-full px-4 py-3 border rounded-xl text-sm outline-none transition-shadow bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent";

const Input = ({
  label,
  required,
  error,
  icon: Icon,
  className = "",
  wrapperClassName = "",
  id,
  ...rest
}) => {
  const inputId = id || rest.name;
  const borderCls = error ? "border-red-400" : "border-gray-200";

  const input = Icon ? (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <Icon className="text-sm" />
      </div>
      <input
        id={inputId}
        className={`${inputBase} ${borderCls} pl-10 ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
    </div>
  ) : (
    <input
      id={inputId}
      className={`${inputBase} ${borderCls} ${className}`}
      aria-invalid={!!error}
      {...rest}
    />
  );

  if (!label && !error) return input;

  return (
    <FormField label={label} required={required} error={error} htmlFor={inputId} className={wrapperClassName}>
      {input}
    </FormField>
  );
};

export default Input;

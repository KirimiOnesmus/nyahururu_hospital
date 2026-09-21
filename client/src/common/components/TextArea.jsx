import React from "react";
import FormField from "./FormField";

const textareaBase =
  "w-full px-4 py-3 border rounded-xl text-sm outline-none transition-shadow bg-white resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

const TextArea = ({
  label,
  required,
  error,
  rows = 4,
  className = "",
  wrapperClassName = "",
  id,
  ...rest
}) => {
  const textareaId = id || rest.name;
  const borderCls = error ? "border-red-400" : "border-gray-200";

  const textarea = (
    <textarea
      id={textareaId}
      rows={rows}
      className={`${textareaBase} ${borderCls} ${className}`}
      aria-invalid={!!error}
      {...rest}
    />
  );

  if (!label && !error) return textarea;

  return (
    <FormField label={label} required={required} error={error} htmlFor={textareaId} className={wrapperClassName}>
      {textarea}
    </FormField>
  );
};

export default TextArea;

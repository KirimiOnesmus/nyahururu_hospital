import React from "react";
import FormField from "./FormField";

const textareaBase =
  "w-full min-h-11 px-4 py-3 border rounded-xl text-sm outline-none transition-shadow bg-surface text-ink resize-none placeholder:text-ink-muted focus:ring-2 focus:ring-primary/30 focus:border-primary";

const TextArea = ({
  label,
  required,
  error,
  hint,
  rows = 4,
  className = "",
  wrapperClassName = "",
  id,
  ...rest
}) => {
  const textareaId = id || rest.name;
  const borderCls = error ? "border-red-400" : "border-line";

  const textarea = (
    <textarea
      id={textareaId}
      rows={rows}
      className={`${textareaBase} ${borderCls} ${className}`}
      aria-invalid={!!error}
      {...rest}
    />
  );

  if (!label && !error && !hint) return textarea;

  return (
    <FormField
      label={label}
      required={required}
      error={error}
      hint={hint}
      htmlFor={textareaId}
      className={wrapperClassName}
    >
      {textarea}
    </FormField>
  );
};

export default TextArea;

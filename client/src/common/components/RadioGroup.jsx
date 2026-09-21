import React from "react";
import FormField from "./FormField";

const RadioGroup = ({
  label,
  required,
  error,
  name,
  value,
  onChange,
  options = [],
  inline = false,
  className = "",
}) => (
  <FormField label={label} required={required} error={error} className={className}>
    <div className={`flex ${inline ? "flex-row flex-wrap gap-4" : "flex-col gap-1"} mt-1`}>
      {options.map((opt) => {
        const optValue = typeof opt === "object" ? opt.value : opt;
        const optLabel = typeof opt === "object" ? opt.label : opt;
        return (
          <label key={optValue} className="inline-flex items-center gap-2.5 cursor-pointer min-h-11">
            <input
              type="radio"
              name={name}
              value={optValue}
              checked={value === optValue}
              onChange={onChange}
              className="w-4 h-4 border-line text-primary focus:ring-primary/30 cursor-pointer"
            />
            <span className="text-sm text-ink">{optLabel}</span>
          </label>
        );
      })}
    </div>
  </FormField>
);

export default RadioGroup;

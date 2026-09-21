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
    <div className={`flex ${inline ? "flex-row flex-wrap gap-4" : "flex-col gap-2"} mt-1`}>
      {options.map((opt) => {
        const optValue = typeof opt === "object" ? opt.value : opt;
        const optLabel = typeof opt === "object" ? opt.label : opt;
        return (
          <label key={optValue} className="inline-flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={optValue}
              checked={value === optValue}
              onChange={onChange}
              className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-400 cursor-pointer"
            />
            <span className="text-sm text-gray-700">{optLabel}</span>
          </label>
        );
      })}
    </div>
  </FormField>
);

export default RadioGroup;

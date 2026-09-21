import React from "react";

const FormField = ({ label, required, error, htmlFor, children, className = "" }) => (
  <div className={className}>
    {label && (
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
      >
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error && (
      <p className="mt-1 text-xs text-red-500">{error}</p>
    )}
  </div>
);

export default FormField;

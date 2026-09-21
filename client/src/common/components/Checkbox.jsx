import React from "react";

const Checkbox = ({ label, error, className = "", id, ...rest }) => {
  const checkId = id || rest.name;

  return (
    <div className={className}>
      <label htmlFor={checkId} className="inline-flex items-center gap-2.5 cursor-pointer min-h-11">
        <input
          type="checkbox"
          id={checkId}
          className="w-4 h-4 rounded border-line text-primary focus:ring-primary/30 cursor-pointer"
          {...rest}
        />
        {label && <span className="text-sm text-ink">{label}</span>}
      </label>
      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Checkbox;

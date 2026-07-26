import React from "react";

const Checkbox = ({ label, error, className = "", id, ...rest }) => {
  const checkId = id || rest.name;

  return (
    <div className={className}>
      <label htmlFor={checkId} className="inline-flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          id={checkId}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400 cursor-pointer"
          {...rest}
        />
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Checkbox;

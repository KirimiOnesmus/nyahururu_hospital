import React from "react";

const Spinner = ({ text = "Loading…", className = "" }) => (
  <div className={`flex flex-col items-center justify-center py-20 gap-3 ${className}`}>
    <div className="w-10 h-10 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

export default Spinner;

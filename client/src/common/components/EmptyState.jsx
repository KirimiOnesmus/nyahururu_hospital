import React from "react";
import { FaInbox } from "react-icons/fa";

const EmptyState = ({
  text = "No records found",
  icon: Icon = FaInbox,
  action,
  className = "",
}) => (
  <div className={`flex flex-col items-center justify-center py-20 gap-3 ${className}`}>
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
      <Icon className="text-2xl text-gray-300" />
    </div>
    <p className="text-sm text-gray-400">{text}</p>
    {action}
  </div>
);

export default EmptyState;

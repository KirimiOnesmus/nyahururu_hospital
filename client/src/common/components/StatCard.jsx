import React from "react";

const StatCard = ({ label, value, sub, accent = {}, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
    {Icon && (
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent.bg || "bg-blue-50"}`}>
        <Icon className={`text-xl ${accent.icon || "text-blue-600"}`} />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-bold ${accent.num || "text-gray-900"}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
      )}
    </div>
  </div>
);

export default StatCard;

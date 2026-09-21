import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserMd, FaCalendarCheck, FaAmbulance } from "react-icons/fa";

const actions = [
  { label: "Find a Doctor", path: "/doctors", icon: FaUserMd },
  { label: "Book an Appointment", path: "/appointment", icon: FaCalendarCheck },
  { label: "Ambulance Services", path: "/ambulance-services", icon: FaAmbulance },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 -mt-18 md:-mt-20 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map(({ label, path, icon: Icon }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex items-center justify-center gap-3 py-8 px-4 group
                       bg-white rounded-xl shadow-lg border border-slate-100
                       hover:bg-blue-50 hover:border-blue-200 hover:-translate-y-0.5
                       transition-all duration-200 cursor-pointer"
          >
            <span
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600
                         text-white group-hover:bg-blue-700 transition-colors duration-200 shrink-0"
            >
              <Icon className="text-base" />
            </span>
            <span className="text-sm md:text-base font-semibold text-slate-800 group-hover:text-blue-700">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
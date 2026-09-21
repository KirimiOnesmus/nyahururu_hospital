import React from "react";
import { useNavigate } from "react-router-dom";
import { IconUser, IconCalendar, IconAmbulance } from "../../common/icons";

const actions = [
  { label: "Find a doctor", path: "/doctors", icon: IconUser },
  { label: "Book an appointment", path: "/appointment", icon: IconCalendar },
  { label: "Ambulance services", path: "/ambulance-services", icon: IconAmbulance },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 -mt-18 md:-mt-20 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map(({ label, path, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(path)}
            className="flex items-center justify-center gap-3 min-h-16 py-6 px-4
                       bg-surface rounded-xl shadow-md border border-line
                       hover:border-primary hover:-translate-y-0.5
                       transition-all duration-200"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white shrink-0">
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="text-sm md:text-base font-semibold text-ink">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;

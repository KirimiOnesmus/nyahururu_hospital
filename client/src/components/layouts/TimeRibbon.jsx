import React from "react";
import { useNavigate } from "react-router-dom";
import { FaClock, FaUserMd, FaCommentDots, FaArrowRight } from "react-icons/fa";

const items = [
  {
    icon: FaClock,
    accent: "amber",
    title: "Hospital Hours",
    rows: [
      { label: "Work Hours", value: "Monday – Sunday: 24/7" },
      { label: "Visiting Hours", value: "12:00 PM – 2:00 PM, 4:00 PM – 6:00 PM" },
    ],
  },
  {
    icon: FaUserMd,
    accent: "amber",
    title: "Specialist Clinics",
    rows: [
      { label: "Weekdays", value: "Monday – Friday: 8:00 AM – 5:00 PM" },
      { label: "Weekends", value: "Saturday & Sunday: 9:00 AM – 4:00 PM" },
    ],
    action: { label: "Book Appointment", path: "/appointment" },
  },
  {
    icon: FaCommentDots,
    accent: "amber",
    title: "Feedback",
    rows: [{ label: null, value: "We'd love to hear about your experience with us." }],
    action: { label: "Send Feedback", path: "/feedback" },
  },
];

const PulseDivider = () => (
  <svg
    viewBox="0 0 800 40"
    preserveAspectRatio="none"
    className="w-full h-8 md:h-10"
    aria-hidden="true"
  >
    <path
      d="M0,20 H140 L156,5 L172,35 L188,20 H340 L356,5 L372,35 L388,20 H540 L556,5 L572,35 L588,20 H800"
      fill="none"
      stroke="#F2A65A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pulse-draw"
    />
  </svg>
);

const TimeRibbon = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-blue-500 py-16 px-6">

      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300/90 mb-2">
            Plan Your Visit
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Hours &amp; Support
          </h2>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <PulseDivider />
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {items.map(({ icon: Icon, title, rows, action }) => (
            <div
              key={title}
              className="group relative flex flex-col bg-white rounded-2xl p-6 pt-5
                        
                         shadow-[0_12px_30px_-12px_rgba(6,40,44,0.45)]
                         hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_rgba(6,40,44,0.55)]
                         transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <Icon className="text-lg text-amber-600" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-3">{title}</h3>

              <div className="space-y-2 mb-5 flex-1">
                {rows.map(({ label, value }) => (
                  <div key={value} className="text-sm text-slate-500 leading-relaxed">
                    {label && (
                      <span className="font-semibold text-slate-700">{label}: </span>
                    )}
                    {value}
                  </div>
                ))}
              </div>

              {action && (
                <button
                  onClick={() => navigate(action.path)}
                  className="mt-auto inline-flex items-center gap-2 text-sm font-semibold
                             text-amber-700 hover:text-amber-900 self-start
                             transition-colors duration-200 cursor-pointer"
                >
                  {action.label}
                  <FaArrowRight className="text-xs transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pulse-draw {
          stroke-dasharray: 900;
          stroke-dashoffset: 900;
          animation: draw-pulse 1.6s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-draw { animation: none; stroke-dashoffset: 0; }
        }
        @keyframes draw-pulse {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </section>
  );
};

export default TimeRibbon;
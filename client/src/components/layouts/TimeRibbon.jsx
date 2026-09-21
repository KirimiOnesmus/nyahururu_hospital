import React from "react";
import { useNavigate } from "react-router-dom";
import { IconClock, IconUser, IconChat, IconArrowRight } from "../../common/icons";

const items = [
  {
    icon: IconClock,
    title: "Hospital Hours",
    rows: [
      { label: "Work Hours", value: "Monday – Sunday: 24/7" },
      { label: "Visiting Hours", value: "12:00 PM – 2:00 PM, 4:00 PM – 6:00 PM" },
    ],
  },
  {
    icon: IconUser,
    title: "Specialist Clinics",
    rows: [
      { label: "Weekdays", value: "Monday – Friday: 8:00 AM – 5:00 PM" },
      { label: "Weekends", value: "Saturday & Sunday: 9:00 AM – 4:00 PM" },
    ],
    action: { label: "Book appointment", path: "/appointment" },
  },
  {
    icon: IconChat,
    title: "Feedback",
    rows: [{ label: null, value: "We'd love to hear about your experience with us." }],
    action: { label: "Send feedback", path: "/feedback" },
  },
];

const TimeRibbon = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-blue-800 py-16 px-6">
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-200 mb-2">
            Plan Your Visit
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Hours &amp; Support
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {items.map(({ icon: Icon, title, rows, action }) => (
            <div
              key={title}
              className="group relative flex flex-col bg-surface rounded-2xl p-6 pt-5 shadow-md
                         hover:-translate-y-0.5 transition-transform duration-200"
            >
              <div className="w-11 h-11 rounded-full bg-primary-soft flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>

              <h3 className="text-lg font-bold text-ink mb-3">{title}</h3>

              <div className="space-y-2 mb-5 flex-1">
                {rows.map(({ label, value }) => (
                  <div key={value} className="text-sm text-ink-muted leading-relaxed">
                    {label && <span className="font-semibold text-ink">{label}: </span>}
                    {value}
                  </div>
                ))}
              </div>

              {action && (
                <button
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="mt-auto inline-flex items-center gap-2 min-h-11 text-sm font-semibold
                             text-primary hover:text-primary-hover self-start"
                >
                  {action.label}
                  <IconArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TimeRibbon;

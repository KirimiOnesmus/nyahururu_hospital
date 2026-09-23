import React from "react";
import { IconPhone, IconMail, IconMapPin, IconArrowRight } from "../../common/icons";

const CONTACT_INFO = [
  { icon: IconPhone, label: "Phone", value: "0758 722 031" },
  { icon: IconMail, label: "Email", value: "info@ncrhospital.com" },
  { icon: IconMapPin, label: "Location", value: "Nyeri-Nyahururu Road" },
];

const LAT = 0.03783;
const LNG = 36.36194;
const MAP_SRC = `https://www.google.com/maps?q=${LAT},${LNG}&z=15&output=embed`;
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`;

const Contact = () => {
  return (
    <div className="flex flex-col bg-canvas">
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-10 py-12">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Get in Touch
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-ink">Contact Us</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <aside className="md:col-span-1 flex flex-col gap-4">
            {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-surface border border-line rounded-2xl p-5 flex items-start gap-4 shadow-sm"
              >
                <div className="w-11 h-11 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-ink">{value}</p>
                </div>
              </div>
            ))}
          </aside>

          <div className="md:col-span-2 bg-surface border border-line rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <iframe
              title="Nyahururu County Referral Hospital location"
              src={MAP_SRC}
              width="100%"
              height="420"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0, display: "block" }}
            />

            <div className="flex items-center justify-between gap-3 p-4 border-t border-line bg-canvas">
              <div className="flex items-center gap-2 text-ink-muted min-w-0">
                <IconMapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium truncate">
                  Nyeri-Nyahururu Road, Nyahururu
                </span>
              </div>

              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary min-h-11 px-4 text-sm font-semibold text-white hover:bg-primary-hover shrink-0"
              >
                Get directions
                <IconArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;

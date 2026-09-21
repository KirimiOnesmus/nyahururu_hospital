import React from 'react'
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaLocationArrow } from "react-icons/fa";

const CONTACT_INFO = [
  { icon: FaPhone,        label: "Phone",    value: "0758 722 031"        },
  { icon: FaEnvelope,     label: "Email",    value: "info@ncrhospital.com" },
  { icon: FaMapMarkerAlt, label: "Location", value: "Nyeri-Nyahururu Road" },
];

const LAT = 0.03783;
const LNG = 36.36194;

const PAD = 0.01;
const bbox = [LNG - PAD, LAT - PAD, LNG + PAD, LAT + PAD].join("%2C");
const MAP_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${LAT}%2C${LNG}`;
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`;

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-10 py-12">

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
            Get in Touch
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Contact Us</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

   
          <aside className="md:col-span-1 flex flex-col gap-4">
            {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Icon className="text-blue-600 text-sm" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{value}</p>
                </div>
              </div>
            ))}
          </aside>

 
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
            <div className="relative flex-1 min-h-[360px]">
              <iframe
                title="Nyahururu County Referral Hospital location"
                src={MAP_SRC}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-slate-600 min-w-0">
                <FaMapMarkerAlt className="text-blue-600 text-sm shrink-0" />
                <span className="text-sm font-medium truncate">
                  Nyeri-Nyahururu Road, Nyahururu
                </span>
              </div>
              
                <a href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shrink-0"
              >
                <FaLocationArrow className="text-xs" />
                Get Directions
              </a>
            </div>
          </div>
</div>
      </main>
    </div>
  )
}

export default Contact
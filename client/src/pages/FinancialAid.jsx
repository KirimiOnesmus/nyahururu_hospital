import React, { useState } from "react";
import { Header, Footer } from "../components/layouts";
import {
  FaHeartbeat,
  FaHandHoldingHeart,
  FaTruck,
  FaBullhorn,
  FaLock,
  FaPhone,
  FaFileInvoiceDollar,
  FaMobileAlt,
  FaUniversity,
  FaExclamationTriangle,
} from "react-icons/fa";

const FinancialAid = () => {
  const [activeMethod, setActiveMethod] = useState("mpesa");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-10 py-12">

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
            Support Us
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            How Your Donation Helps
          </h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Your support enables us to save lives within our county and across Kenya
            through these critical programmes.
          </p>
        </div>

=
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 mb-8">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
            <FaExclamationTriangle className="text-amber-600 text-sm" />
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            Every contribution — large or small — directly funds life-saving services.
            All donations are <strong>tax-deductible</strong> and processed through
            secure, encrypted channels.
          </p>
        </div>

        {/* ── Impact tiles ── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            {
              icon: FaHeartbeat,
              title: "Blood Donation Drives",
              body: "Support our nation-wide blood collection initiatives and save lives.",
            },
            {
              icon: FaHandHoldingHeart,
              title: "Financial Support",
              body: "Your donations fund essential medical supplies and infrastructure.",
            },
            {
              icon: FaTruck,
        
              title: "Mobile Units & Logistics",
              body: "Helps us reach underserved areas by funding mobile clinics and transportation.",
            },
            {
              icon: FaBullhorn,
              title: "Outreach & Education",
              body: "Empower communities with blood safety awareness and training.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Icon className="text-blue-600 text-sm" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

       
        <div className=" rounded-2xl p-8 text-center ">
          <div className="mb-6 pb-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Donation Methods</h3>
            <p className="text-slate-500 text-sm mt-0.5">
              Choose your preferred payment channel below.
            </p>
          </div>

     
          <div className="flex gap-3 mb-6 items-center">
            {[
              { id: "mpesa", icon: FaMobileAlt, label: "M-Pesa", activeColor: "bg-green-600" },
              { id: "bank", icon: FaUniversity, label: "Bank Transfer", activeColor: "bg-blue-600" },
            ].map(({ id, icon: Icon, label, activeColor }) => (
              <button
                key={id}
                onClick={() => setActiveMethod(id)}
                className={`flex flex-1 items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                  activeMethod === id
                    ? `${activeColor} text-white`
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="text-xs" />
                {label}
              </button>
            ))}
          </div>

          {activeMethod === "mpesa" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-5 inline-block">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                M-Pesa Paybill Details
              </p>
              <p className="font-mono text-sm text-slate-800">
                <span className="text-slate-500">Paybill:</span> 123456
              </p>
              <p className="font-mono text-sm text-slate-800 mt-1">
                <span className="text-slate-500">Account:</span> DONATION
              </p>
            </div>
          )}

          {activeMethod === "bank" && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5 inline-block">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Bank Transfer Details
              </p>
              <p className="font-mono text-sm text-slate-800">
                <span className="text-slate-500">Bank:</span> KCB Bank
              </p>
              <p className="font-mono text-sm text-slate-800 mt-1">
                <span className="text-slate-500">Account No:</span> 1234567890
              </p>
              <p className="font-mono text-sm text-slate-800 mt-1">
                <span className="text-slate-500">Account Name:</span> NCRH Foundation
              </p>
            </div>
          )}
        </div>

       
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {[
            {
              icon: FaLock,
              title: "Secure Payment",
              body: "All transactions are encrypted and processed securely.",
            },
            {
              icon: FaPhone,
              title: "Need Help?",
              body: "Contact us at +254 712 345 678 for donation queries.",
            },
            {
              icon: FaFileInvoiceDollar,
              title: "Tax Deductible",
              body: "All donations are eligible for tax deductions.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Icon className="text-blue-600 text-sm" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FinancialAid;
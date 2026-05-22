import React, { useState } from "react";
import { Header, Footer } from "../components/layouts";
import api from "../api/axios";
import { toast } from "react-toastify";
import {
  FaShieldAlt,
  FaLock,
  FaPaperPlane,
  FaExclamationTriangle,
} from "react-icons/fa";

const INIT = { issue: "", dateOfIncident: "", location: "", details: "" };

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm " +
  "outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300";

const ReportFraud = () => {
  const [formData, setFormData] = useState(INIT);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.issue.trim() || !formData.details.trim()) {
      toast.error("Please fill in the concern and details fields.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/fraud", formData);
      toast.success("Report submitted successfully.");
      setFormData(INIT);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Error submitting report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-10 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
            Confidential
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            Grievance Services
          </h2>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 mb-8">
          <div
            className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 border border-amber-200
                          flex items-center justify-center"
          >
            <FaExclamationTriangle className="text-amber-600 text-sm" />
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            We are committed to upholding high ethical standards and fostering a
            fair, respectful, and safe working environment. This is a
            confidential reporting channel through which individuals can raise
            grievances — such as unfair treatment, harassment, or discrimination
            — without fear of retaliation or victimization.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            {
              icon: FaLock,
              title: "Fully Confidential",
              body: "Your submission is handled securely and shared only with authorised personnel.",
            },
            {
              icon: FaShieldAlt,
              title: "No Retaliation",
              body: "You are protected from any form of retaliation for submitting a genuine report.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4"
            >
              <div
                className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100
                              flex items-center justify-center shrink-0"
              >
                <Icon className="text-blue-600 text-sm" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 mb-0.5">
                  {title}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <div className="mb-6 pb-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">
              Describe Your Concern
            </h3>
            <p className="text-slate-500 text-sm mt-0.5">
              If you wish to remain anonymous, do not include information that
              could reveal your identity.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                What is your concern? <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="issue"
                required
                value={formData.issue}
                onChange={handleChange}
                placeholder="e.g. Harassment, Fraud, Discrimination…"
                className={inputClass}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  When did this happen?
                </label>
                <input
                  type="date"
                  name="dateOfIncident"
                  value={formData.dateOfIncident}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Where did it happen?
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Ward 3, Admin Block…"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Details of the Case <span className="text-red-400">*</span>
              </label>
              <textarea
                name="details"
                required
                rows={8}
                value={formData.details}
                onChange={handleChange}
                placeholder="Describe what happened and why you are submitting this report. Avoid including identifying information if you wish to remain anonymous."
                className={`${inputClass} resize-none`}
              />
              {/* Bug fix: corrected "submmit" typo in placeholder */}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                           text-white text-sm font-semibold rounded-xl transition-colors duration-150
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaPaperPlane className="text-xs" />
                {loading ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportFraud;

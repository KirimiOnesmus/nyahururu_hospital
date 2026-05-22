import React, { useState } from "react";
import { Header, Footer } from "../components/layouts";
import api from "../api/axios";
import { toast } from "react-toastify";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";

const CONTACT_INFO = [
  { icon: FaPhone,        label: "Phone",    value: "0712 345 678"                  },
  { icon: FaEnvelope,     label: "Email",    value: "info@ncrhospital.com"           },
  { icon: FaMapMarkerAlt, label: "Location", value: "Along Nyahururu – Nakuru Highway" },
];

const INIT = { name: "", email: "", subject: "", message: "", type: "general" };

const Feedback = () => {
  const [formData, setFormData] = useState(INIT);
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/feedback", formData);
      toast.success("Feedback submitted successfully.");
      setFormData(INIT);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(error?.response?.data?.message || "Error submitting feedback.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm " +
    "outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

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

       
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-8">
            <div className="mb-6 pb-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Send Us a Message</h3>
              <p className="text-slate-500 text-sm mt-0.5">We'll get back to you as soon as possible.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="David Kamau"
                    className={inputClass}
                  />
                </div>

        
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="david@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

           
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What is this regarding?"
                  className={inputClass}
                />
              </div>

         
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="general">General</option>
                  <option value="complaint">Complaint</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="compliment">Compliment</option>
                </select>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here…"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                             text-white text-sm font-semibold rounded-xl transition-colors duration-150 cursor-pointer
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane className="text-xs" />
                  {loading ? "Sending…" : "Send Message"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feedback;
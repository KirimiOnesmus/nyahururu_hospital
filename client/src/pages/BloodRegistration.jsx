import React, { useState } from "react";
import {
  FaHeart,
  FaCheckCircle,
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaShieldAlt,
  FaExclamationTriangle,
  FaPaperPlane,
} from "react-icons/fa";
import { Header, Footer } from "../common/layouts";
import api from "../api/axios";
import notify from "../common/utils/notify";
import { Link, useNavigate } from "react-router-dom";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm " +
  "outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all placeholder:text-slate-300";

const labelClass = "text-xs font-bold uppercase tracking-widest text-slate-500";

const INIT = {
  fullName: "",
  email: "",
  phone: "",
  donationDate: "",
  donationTime: "",
  consentDonate: false,
  consentTest: false,
  consentTerms: false,
  consentPrivacy: false,
};


const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className={labelClass}>
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
    <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
      <Icon className="text-red-500 text-sm" />
    </div>
    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
  </div>
);

const BloodRegistration = () => {
  const [formData, setFormData] = useState(INIT);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateDonor = () => {
    const e = [];
    if (!formData.fullName.trim()) e.push("Full Name is required");
    if (!formData.email.trim()) e.push("Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.push("Please enter a valid email address");
    if (!formData.phone.trim()) e.push("Phone Number is required");
    if (!formData.donationDate) e.push("Donation date is required");
    if (!formData.donationTime) e.push("Donation time is required");
    if (!formData.consentDonate) e.push("Blood donation consent is required");
    if (!formData.consentTest)
      e.push("Infectious Disease Test consent is required");
    if (!formData.consentTerms) e.push("Hospital Terms consent is required");
    if (!formData.consentPrivacy) e.push("Donor privacy notice acknowledgment is required");
    return e;
  };

  const handleRegistration = async () => {
    const validationErrors = validateDonor();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    setLoading(true);
    try {
      const response = await api.post("/blood-donation/register", {
        ...formData,
      });
      if (response.data.success) {
        notify.success("Registration successful!");
        setFormData(INIT);
        navigate("/");
      } else {
  
        notify.error(response.data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      notify.error(
        error?.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors.length > 0) setErrors([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-10 py-12">
  
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">
            Donation Programme
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            Blood Donor Registration
          </h2>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4 mb-8">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center">
              <FaExclamationTriangle className="text-red-500 text-sm" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 mb-2">
                Please fix the following:
              </p>
              <ul className="space-y-1">
                {errors.map((err, i) => (
                  <li
                    key={i}
                    className="text-xs text-red-700 flex items-start gap-1.5"
                  >
                    <span className="mt-0.5">•</span> {err}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}


        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 mb-8">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
            <FaHeart className="text-amber-600 text-sm" />
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            Your donation can save up to <strong>3 lives</strong>. Blood is
            essential for surgeries, trauma care, and treating blood disorders.
            All equipment is sterile and single-use to ensure your complete
            safety.
          </p>
        </div>

    
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: FaHeart,
              title: "Save 3 Lives",
              body: "One donation benefits multiple patients in critical need.",
            },
            {
              icon: FaCheckCircle,
              title: "45 Minutes",
              body: "The entire process from screening to completion.",
            },
            {
              icon: FaShieldAlt,
              title: "Safe & Sterile",
              body: "Single-use sterile equipment throughout.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <Icon className="text-red-500 text-sm" />
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

       
        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-10">

          <section>
            <SectionHeader icon={FaUser} title="Personal Information" />
            <div className="space-y-5">
              <Field label="Full Name" required>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. John Kariuki"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Email Address" required>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone Number" required>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="0712 345 678"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={inputClass}
                  />
                </Field>
              </div>

            </div>
          </section>

          <section>
            <SectionHeader icon={FaShieldAlt} title="Eligibility & Screening" />
            <p className="text-sm text-slate-600 leading-relaxed">
              A trained member of the blood donation team will confirm eligibility,
              identity and any health screening information in person. Please do
              not submit your age, gender, blood group, health conditions,
              medication details, National ID, weight or other screening
              information in this public form.
            </p>
          </section>

          
          <section>
            <SectionHeader icon={FaCalendarAlt} title="Donation Schedule" />
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Preferred Donation Date" required>
                <input
                  type="date"
                  name="donationDate"
                  value={formData.donationDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={inputClass}
                />
              </Field>
              <Field label="Preferred Time" required>
                <input
                  type="time"
                  name="donationTime"
                  value={formData.donationTime}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </Field>
            </div>
          </section>


          <section>
            <SectionHeader icon={FaShieldAlt} title="Consents & Agreements" />
            <div className="space-y-3">
              {[
                {
                  name: "consentDonate",
                  title: "I consent to donate blood",
                  body: "I understand the donation process and agree to donate blood to help save lives.",
                  required: true,
                },
                {
                  name: "consentTest",
                  title: "I consent to infectious disease testing",
                  body: "I agree to be tested for infectious diseases including HIV, Hepatitis B, C, and Syphilis.",
                  required: true,
                },
                {
                  name: "consentTerms",
                  title: "I agree to hospital terms and conditions",
                  body: "I have read and agree to the hospital's terms of service.",
                  required: true,
                },
                {
                  name: "consentPrivacy",
                  title: "I acknowledge the blood donor privacy notice",
                  body: (
                    <>
                      Use my name and contact details to manage this registration and
                      contact me about my preferred appointment. Authorized donation
                      programme staff manage donor records; system superadmin may
                      review limited contact, appointment and consent records in
                      read-only mode.
                      Donor record views and changes are logged. Donor privacy notice
                      v1.0 (11 November 2026).
                      Records are retained only as long as needed for these purposes
                      or as required or permitted by law.
                      See the <Link to="/privacy-policy" className="font-semibold text-red-700 underline">Privacy Policy</Link>.
                    </>
                  ),
                  required: true,
                },
              ].map(({ name, title, body, required }) => (
                <label
                  key={name}
                  className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-red-200 hover:bg-red-50 transition-all"
                >
                  <input
                    type="checkbox"
                    name={name}
                    checked={formData[name]}
                    onChange={handleInputChange}
                    className="mt-0.5 w-4 h-4 accent-red-500 shrink-0"
                  />
                  <span>
                    <span className="text-sm font-bold text-slate-800">
                      {title}{" "}
                      {required && <span className="text-red-400">*</span>}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {body}
                    </p>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="pt-1">
            <button
              onClick={handleRegistration}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700
                         text-white text-sm font-semibold rounded-xl transition-colors duration-150  cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaPaperPlane className="text-xs" />
              {loading ? "Submitting…" : "Complete Registration"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BloodRegistration;

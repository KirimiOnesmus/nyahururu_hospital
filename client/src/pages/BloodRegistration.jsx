import React, { useEffect, useState } from "react";
import {
  FaHeart,
  FaCheckCircle,
  FaCalendarAlt,
  FaUser,
  FaShieldAlt,
  FaExclamationTriangle,
  FaPaperPlane,
  FaCopy,
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
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [registrationConfirmation, setRegistrationConfirmation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!formData.donationDate) {
      setAvailability(null);
      setAvailabilityLoading(false);
      return undefined;
    }

    let active = true;
    setAvailabilityLoading(true);
    api.get("/blood-donation/availability", { params: { date: formData.donationDate } })
      .then(({ data }) => {
        if (active) setAvailability(data.data);
      })
      .catch(() => {
        if (active) setAvailability(null);
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false);
      });

    return () => { active = false; };
  }, [formData.donationDate]);

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
        setRegistrationConfirmation({
          ...response.data.data,
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
        });
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

  const copyDonorReference = async () => {
    try {
      await navigator.clipboard.writeText(registrationConfirmation.donorId);
      notify.success("Donor reference copied");
    } catch {
      notify.error("Copy failed. Please select and copy the donor reference.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-10 py-12">
        {registrationConfirmation ? (
          <section className="max-w-2xl mx-auto bg-white border border-emerald-200 rounded-2xl p-6 sm:p-10 shadow-sm" aria-live="polite">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
              <FaCheckCircle className="text-emerald-600 text-2xl" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">Registration received</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              Thank you, {registrationConfirmation.fullName}.
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Your preferred donation visit has been recorded. The blood donation office will contact you at <strong>{registrationConfirmation.email}</strong> to confirm the appointment. This is not confirmation that the appointment time is final or that donation eligibility has been approved.
            </p>

            <p className="text-xs text-slate-600 mb-6 rounded-lg bg-slate-50 border border-slate-200 p-3">
              Appointment request status: <strong>{registrationConfirmation.appointmentRegistrationStatus === "pending" ? "Awaiting office confirmation" : registrationConfirmation.appointmentRegistrationStatus}</strong>
            </p>

            <div className="rounded-xl border border-red-100 bg-red-50 p-5 mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-red-800 mb-2">Your donor reference</p>
              <div className="flex flex-wrap items-center gap-3">
                <code className="text-lg sm:text-xl font-bold tracking-wide text-slate-900 break-all" aria-label="Donor reference">
                  {registrationConfirmation.donorId}
                </code>
                <button type="button" onClick={copyDonorReference} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-red-200 text-sm font-semibold text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500">
                  <FaCopy aria-hidden="true" /> Copy
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-2">Keep this reference and share it if you contact the blood donation office.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-7">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">Preferred date</p>
                <p className="font-semibold text-slate-800">{new Date(`${registrationConfirmation.donationDate}T00:00:00Z`).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">Preferred time</p>
                <p className="font-semibold text-slate-800">{registrationConfirmation.donationTime}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">Return to home</button>
              <button type="button" onClick={() => { setRegistrationConfirmation(null); setFormData(INIT); }} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">Register another donor</button>
            </div>
          </section>
        ) : <>
  
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
            Donated blood helps patients who need surgery, emergency care or
            treatment for blood disorders. Blood components may help more than
            one patient. The donation team will explain the process and assess
            your eligibility in person.
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
              title: "Allow time for your visit",
              body: "Screening, collection and recovery all take time; the collection itself is only one part of the visit.",
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
                <p className="text-xs text-slate-500" aria-live="polite">
                  {availabilityLoading
                    ? "Checking office availability…"
                    : availability
                      ? availability.available > 0
                        ? `${availability.available} of ${availability.capacity} appointments available for this date.`
                        : "The blood donation office is fully booked for this date. Please choose another date."
                      : "Appointment availability is confirmed when you submit your registration."}
                </p>
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
              disabled={loading || availability?.available === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700
                         text-white text-sm font-semibold rounded-xl transition-colors duration-150  cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaPaperPlane className="text-xs" />
              {loading ? "Submitting…" : "Complete Registration"}
            </button>
          </div>
        </div>
        </>}
      </main>

      <Footer />
    </div>
  );
};

export default BloodRegistration;

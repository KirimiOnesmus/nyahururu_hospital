import React, { useState } from "react";
import {
  FaHeart,
  FaCheckCircle,
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaClock,
  FaWeightHanging,
  FaNotesMedical,
  FaShieldAlt,
  FaExclamationTriangle,
  FaPaperPlane,
} from "react-icons/fa";
import { Header, Footer } from "../components/layouts";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm " +
  "outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all placeholder:text-slate-300";

const selectClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm " +
  "outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";

const labelClass = "text-xs font-bold uppercase tracking-widest text-slate-500";

const INIT = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  age: "",
  weight: "",
  nationalId: "",
  bloodGroup: "",
  healthConditions: "",
  medications: "",
  donationDate: "",
  donationTime: "",
  consentDonate: false,
  consentTest: false,
  consentTerms: false,
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
    if (!formData.gender) e.push("Gender is required");
    if (!formData.age) e.push("Age is required");
    if (!formData.weight) e.push("Weight is required");
    if (!formData.nationalId.trim()) e.push("National ID is required");
    if (!formData.donationDate) e.push("Donation date is required");
    if (!formData.donationTime) e.push("Donation time is required");
    const age = parseInt(formData.age);
    if (age < 16 || age > 70) e.push("Age must be between 16 and 70 years");
    if (parseInt(formData.weight) < 50) e.push("Weight must be at least 50 kg");
    if (!formData.consentDonate) e.push("Blood donation consent is required");
    if (!formData.consentTest)
      e.push("Infectious Disease Test consent is required");
    if (!formData.consentTerms) e.push("Hospital Terms consent is required");
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
        age: parseInt(formData.age),
        weight: parseInt(formData.weight),
      });
      if (response.data.success) {
        toast.success("Registration successful!");
        setFormData(INIT);
        navigate("/");
      } else {
  
        toast.error(response.data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      toast.error(
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
    <div className="min-h-screen flex flex-col bg-slate-50">
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

        {/* ── Assurance tiles ── */}
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
          {/* ── Personal Information ── */}
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

              <div className="grid sm:grid-cols-3 gap-5">
                <Field label="Gender" required>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Blood Group">
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="">Optional</option>
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="National ID" required>
                  <input
                    type="text"
                    name="nationalId"
                    placeholder="ID Number"
                    value={formData.nationalId}
                    onChange={handleInputChange}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </section>

  
          <section>
            <SectionHeader icon={FaNotesMedical} title="Health Information" />
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Age (16 – 70)" required>
                  <input
                    type="number"
                    name="age"
                    placeholder="Years"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="16"
                    max="70"
                    className={inputClass}
                  />
                </Field>
                <Field label="Weight (kg, min 50)" required>
                  <input
                    type="number"
                    name="weight"
                    placeholder="kg"
                    value={formData.weight}
                    onChange={handleInputChange}
                    min="50"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Existing Health Conditions">
                <textarea
                  name="healthConditions"
                  placeholder="List any existing health conditions, or write 'None'"
                  value={formData.healthConditions}
                  onChange={handleInputChange}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <Field label="Current Medications">
                <textarea
                  name="medications"
                  placeholder="List any current medications, or write 'None'"
                  value={formData.medications}
                  onChange={handleInputChange}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
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
                  body: "I have read and agree to the hospital's privacy policy and terms of service.",
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

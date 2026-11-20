import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaAmbulance,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaHospital,
  FaExclamationTriangle,
  FaPaperPlane,
  FaHome,
} from "react-icons/fa";
import api from "../api/axios";
import notify from "../common/utils/notify";
import { useNavigate } from "react-router-dom";

const FIXED_COUNTY = "Laikipia";

const INIT = {
  patientName: "",
  phone: "",
  email: "",
  county: FIXED_COUNTY,
  destinationHospital: "",
  emergencyLevel: "standard",
  additionalNotes: "",
};

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border text-slate-800 text-sm outline-none " +
  "focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 " +
  "disabled:bg-slate-50 disabled:cursor-not-allowed";

const validClass = "border-slate-200 focus:border-blue-400";
const errorClass = "border-red-400 focus:border-red-400 bg-red-50";
const labelClass = "text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 block";

const SectionHeading = ({ step, icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-5 pb-2">
    <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
      {step}
    </span>
    {Icon && <Icon className="text-blue-500 text-sm" />}
    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h2>
  </div>
);

const FieldError = ({ msg }) => (msg ? <p className="text-red-500 text-xs mt-1">{msg}</p> : null);

const AmbulanceServices = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INIT);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [bookingId, setBookingId] = useState(null);
  const [serviceOptions, setServiceOptions] = useState([]);

  useEffect(() => {
    api.get("/ambulance-services").then(({ data }) => setServiceOptions(Array.isArray(data) ? data : [])).catch(() => setServiceOptions([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));

  };
  const validate = () => {
    const e = {};
    if (!formData.patientName.trim()) e.patientName = "Patient name is required";
    if (!formData.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, "")))
      e.phone = "Enter a valid 10-digit number";
    if (!formData.destinationHospital.trim())
      e.destinationHospital = "Destination hospital is required";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      notify.error("Please fill in all required fields correctly");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/ambulance-bookings/create", {
        patientName: formData.patientName,
        phone: formData.phone,
        email: formData.email || null,
        currentLocation: formData.county,
        destinationHospital: formData.destinationHospital,
        emergencyLevel: formData.emergencyLevel,
        additionalNotes: formData.additionalNotes || null,
      });

      setBookingId(res.data.booking.confirmationCode);
      setSubmitted(true);
      notify.success(res.data.message || "Ambulance booked successfully!");
      setFormData({ ...INIT });

      setTimeout(() => {
        setSubmitted(false);
        navigate("/");
      }, 8000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to book ambulance";
      setErrors({ submit: msg });
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas px-6">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <FaCheckCircle className="text-2xl text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Request Submitted</h2>
          <p className="text-slate-500 text-sm mb-4">
            Our dispatch team will contact you shortly with ETA details.
          </p>
          {bookingId && (
            <div className="bg-slate-50 rounded-xl px-4 py-3 mb-6">
              <p className="text-xs text-slate-500 mb-0.5">Confirmation ID</p>
              <p className="font-mono font-bold text-slate-800 text-sm">{bookingId}</p>
            </div>
          )}
          <p className="text-xs text-slate-400 mb-6">
            You'll be redirected to the home page shortly.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600
                       hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <FaHome className="text-xs" /> Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shrink-0">
              <FaAmbulance className="text-white text-xl" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-600">
                Emergency
              </p>
              <h1 className="text-2xl font-bold text-slate-800">Book Ambulance</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Back to home"
            className="fixed right-4 z-[110] inline-flex min-w-12 min-h-12 items-center justify-center rounded-full bg-white
                       text-slate-600 text-2xl font-semibold hover:text-blue-600 transition-colors cursor-pointer"
            style={{ right: "max(1rem, env(safe-area-inset-right, 0px))", bottom: "calc(max(1rem, env(safe-area-inset-bottom, 0px)) + 3.75rem)" }}
          >
            <FaHome className="text-md" />
          </button>
        </div>

        <div role="alert" className="bg-red-50 dark:bg-red-950/60 rounded-2xl p-4 flex gap-3 mb-6">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <FaExclamationTriangle className="text-red-600 text-sm" />
          </div>
          <p className="text-red-800 dark:text-red-100 text-sm leading-relaxed">
            For life-threatening emergencies, call <strong>999</strong> or <strong>911</strong>{" "}
            immediately instead of using this form. Response time via this form is usually{" "}
            <strong>5–10 minutes</strong>.
          </p>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="p-7">
            <SectionHeading step="1" icon={FaUser} title="Patient Information" />
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Patient Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  placeholder="Enter patient's full name"
                  className={`${inputClass} ${errors.patientName ? errorClass : validClass}`}
                />
                <FieldError msg={errors.patientName} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0712 345 678"
                    className={`${inputClass} ${errors.phone ? errorClass : validClass}`}
                  />
                  <FieldError msg={errors.phone} />
                </div>
                <div>
                  <label className={labelClass}>
                    Email <span className="text-slate-400 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="patient@example.com"
                    className={`${inputClass} ${validClass}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-7">
            <SectionHeading step="2" icon={FaMapMarkerAlt} title="Location Details" />
            <div className="space-y-4">
              <div>
                <label className={labelClass}>County</label>
                <input
                  type="text"
                  value="Laikipia"
                  disabled
                  className={`${inputClass} border-slate-200 bg-slate-50 text-slate-500`}
                />
                <p className="text-xs text-slate-400 mt-1">Service area: Laikipia County only</p>
              </div>

              <div>
                <label className={labelClass}>
                  Ambulance service / destination <span className="text-red-400">*</span>
                </label>
                <select
                  name="destinationHospital"
                  value={formData.destinationHospital}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.destinationHospital ? errorClass : validClass}`}
                  disabled={!serviceOptions.length}
                >
                  <option value="">{serviceOptions.length ? "Select a transfer destination" : "Transfer options unavailable"}</option>
                  {serviceOptions.map((option) => <option key={option.id} value={option.name}>{option.name} — {option.cashPrice == null ? "Contact hospital for price" : `KES ${Number(option.cashPrice).toLocaleString()}`}</option>)}
                </select>
                <FieldError msg={errors.destinationHospital} />
                {formData.destinationHospital && <p className="mt-1 text-xs text-slate-500">Selected from the current ambulance transfer options.</p>}
              </div>
            </div>
          </div>

          <div className="p-7">
            <SectionHeading step="3" icon={FaHospital} title="Medical Information" />
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Emergency Level <span className="text-red-400">*</span>
                </label>
                <select
                  name="emergencyLevel"
                  value={formData.emergencyLevel}
                  onChange={handleChange}
                  className={`${inputClass} ${validClass}`}
                >
                  <option value="standard">Standard — Non-life threatening</option>
                  <option value="urgent">Urgent — Immediate attention needed</option>
                  <option value="critical">Critical — Life-threatening emergency</option>
                </select>

                {formData.emergencyLevel === "critical" && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-[10px]" /> Please also call 999
                    immediately.
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Additional Notes{" "}
                  <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Allergies, medications, special requirements, etc."
                  className={`${inputClass} resize-none ${validClass}`}
                />
              </div>
            </div>
          </div>

          <div className="p-7">
            {errors.submit && (
              <div role="alert" className="bg-red-50 dark:bg-red-950/60 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-100 mb-4">
                {errors.submit}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700
                         text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                  Submitting…
                </>
              ) : (
                <>
                  <FaAmbulance /> Book Ambulance Now
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-slate-400 space-y-1">
          <p>
            Typical response time: <strong className="text-slate-600">5–10 minutes</strong>
          </p>
          <p>
            Dispatch team: <strong className="text-slate-600">+254 701 111 222</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceServices;

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
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const API_KEY = "keyPub1569gsvndc123kg9sjhg";
const API_BASE = "https://kenyaareadata.vercel.app/api/areas";
const FIXED_COUNTY = "Laikipia";

const INIT = {
  patientName: "",
  phone: "",
  email: "",
  county: FIXED_COUNTY,
  constituency: "",
  ward: "",
  specificLocation: "",
  destinationHospital: "",
  emergencyLevel: "standard",
  medicalCondition: "",
  additionalNotes: "",
};

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border text-slate-800 text-sm outline-none " +
  "focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 " +
  "disabled:bg-slate-50 disabled:cursor-not-allowed";

const validClass = "border-slate-200 focus:border-blue-400";
const errorClass = "border-red-400 focus:border-red-400 bg-red-50";
const labelClass =
  "text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 block";

const SectionHeading = ({ step, icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
    <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
      {step}
    </span>
    {Icon && <Icon className="text-blue-500 text-sm" />}
    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
      {title}
    </h2>
  </div>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-red-500 text-xs mt-1">{msg}</p> : null;

// ── Main component ────────────────────────────────────────────────────────────
const AmbulanceServices = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INIT);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [bookingId, setBookingId] = useState(null);

  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingConst, setLoadingConst] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    const fetchConstituencies = async () => {
      setLoadingConst(true);
      try {
        const res = await fetch(
          `${API_BASE}?apiKey=${API_KEY}&county=${FIXED_COUNTY}`,
        );
        const data = await res.json();
        if (data?.[FIXED_COUNTY]) {
          setConstituencies(Object.keys(data[FIXED_COUNTY]));
        }
      } catch (err) {
        console.error("Error fetching constituencies:", err);
      } finally {
        setLoadingConst(false);
      }
    };
    fetchConstituencies();
  }, []);

  const fetchWards = async (constituency) => {
    setLoadingWards(true);
    setWards([]);
    try {
      const res = await fetch(
        `${API_BASE}?apiKey=${API_KEY}&county=${FIXED_COUNTY}&constituency=${encodeURIComponent(constituency)}`,
      );
      const data = await res.json();
      if (data?.[FIXED_COUNTY]?.[constituency]) {
        setWards(data[FIXED_COUNTY][constituency]);
      }
    } catch (err) {
      console.error("Error fetching wards:", err);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));

    if (name === "constituency") {
      setFormData((p) => ({ ...p, constituency: value, ward: "" }));
      if (value) fetchWards(value);
      else setWards([]);
    }
  };
  const validate = () => {
    const e = {};
    if (!formData.patientName.trim())
      e.patientName = "Patient name is required";
    if (!formData.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, "")))
      e.phone = "Enter a valid 10-digit number";
    if (!formData.constituency) e.constituency = "Constituency is required";
    if (!formData.specificLocation.trim())
      e.specificLocation = "Specific location is required";
    if (!formData.destinationHospital.trim())
      e.destinationHospital = "Destination hospital is required";
    if (!formData.medicalCondition.trim())
      e.medicalCondition = "Please describe the medical condition";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fill in all required fields correctly");
      return;
    }
    setLoading(true);
    try {
      const fullLocation = [
        formData.specificLocation,
        formData.ward,
        formData.constituency,
        formData.county,
      ]
        .filter(Boolean)
        .join(", ");

      const res = await api.post("/ambulance-bookings/create", {
        patientName: formData.patientName,
        phone: formData.phone,
        email: formData.email || null,
        currentLocation: fullLocation,
        destinationHospital: formData.destinationHospital,
        emergencyLevel: formData.emergencyLevel,
        medicalCondition: formData.medicalCondition,
        additionalNotes: formData.additionalNotes || null,
      });

      setBookingId(res.data.booking._id);
      setSubmitted(true);
      toast.success(res.data.message || "Ambulance booked successfully!");
      setFormData({ ...INIT });
      setWards([]);

      setTimeout(() => {
        setSubmitted(false);
        navigate("/");
      }, 8000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to book ambulance";
      setErrors({ submit: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-5">
            <FaCheckCircle className="text-2xl text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Request Submitted
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            Our dispatch team will contact you shortly with ETA details.
          </p>
          {bookingId && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6">
              <p className="text-xs text-slate-500 mb-0.5">Booking ID</p>
              <p className="font-mono font-bold text-slate-800 text-sm">
                {bookingId}
              </p>
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
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
              <h1 className="text-2xl font-bold text-slate-800">
                Book Ambulance
              </h1>
            </div>
          </div>
       
          <button
            onClick={() => navigate("/")}
            className=" bottom-10 fixed right-8 gap-2 p-2 rounded-full border border-slate-200
                       bg-white text-slate-600 text-2xl font-semibold hover:border-blue-400
                       hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center"
          >
            <FaHome className="text-md" />
          </button>
        </div>

        <div className="bg-red-50  rounded-2xl p-4 flex gap-3 mb-6">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <FaExclamationTriangle className="text-red-600 text-sm" />
          </div>
          <p className="text-red-800 text-sm leading-relaxed">
            For life-threatening emergencies, call <strong>999</strong> or{" "}
            <strong>911</strong> immediately instead of using this form.
            Response time via this form is usually <strong>5–10 minutes</strong>
            .
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
          <div className="p-7">
            <SectionHeading
              step="1"
              icon={FaUser}
              title="Patient Information"
            />
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
                    Email{" "}
                    <span className="text-slate-400 font-normal normal-case">
                      (optional)
                    </span>
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
            <SectionHeading
              step="2"
              icon={FaMapMarkerAlt}
              title="Location Details"
            />
            <div className="space-y-4">
              <div>
                <label className={labelClass}>County</label>
                <input
                  type="text"
                  value="Laikipia"
                  disabled
                  className={`${inputClass} border-slate-200 bg-slate-50 text-slate-400`}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Service area: Laikipia County only
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Constituency <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="constituency"
                    value={formData.constituency}
                    onChange={handleChange}
                    disabled={loadingConst || constituencies.length === 0}
                    className={`${inputClass} ${errors.constituency ? errorClass : validClass}`}
                  >
                    <option value="">
                      {loadingConst ? "Loading…" : "Select constituency"}
                    </option>
                    {constituencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.constituency} />
                </div>

                <div>
                  <label className={labelClass}>
                    Ward{" "}
                    <span className="text-slate-400 font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <select
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    disabled={!formData.constituency || loadingWards}
                    className={`${inputClass} ${validClass}`}
                  >
                    <option value="">
                      {loadingWards
                        ? "Loading…"
                        : !formData.constituency
                          ? "Select constituency first"
                          : "Select ward"}
                    </option>
                    {wards.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Specific Location / Landmark{" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="specificLocation"
                  value={formData.specificLocation}
                  onChange={handleChange}
                  placeholder="e.g. Near Nyahururu Total Petrol Station"
                  className={`${inputClass} ${errors.specificLocation ? errorClass : validClass}`}
                />
                <FieldError msg={errors.specificLocation} />
              </div>

              <div>
                <label className={labelClass}>
                  Destination Hospital <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="destinationHospital"
                  value={formData.destinationHospital}
                  onChange={handleChange}
                  placeholder="Name of destination hospital"
                  className={`${inputClass} ${errors.destinationHospital ? errorClass : validClass}`}
                />
                <FieldError msg={errors.destinationHospital} />
              </div>
            </div>
          </div>

          <div className="p-7">
            <SectionHeading
              step="3"
              icon={FaHospital}
              title="Medical Information"
            />
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
                  <option value="standard">
                    Standard — Non-life threatening
                  </option>
                  <option value="urgent">
                    Urgent — Immediate attention needed
                  </option>
                  <option value="critical">
                    Critical — Life-threatening emergency
                  </option>
                </select>

                {formData.emergencyLevel === "critical" && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="text-[10px]" /> Please
                    also call 999 immediately.
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Medical Condition <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="medicalCondition"
                  value={formData.medicalCondition}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the patient's medical condition and symptoms"
                  className={`${inputClass} resize-none ${errors.medicalCondition ? errorClass : validClass}`}
                />
                <FieldError msg={errors.medicalCondition} />
              </div>

              <div>
                <label className={labelClass}>
                  Additional Notes{" "}
                  <span className="text-slate-400 font-normal normal-case">
                    (optional)
                  </span>
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
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
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
            Typical response time:{" "}
            <strong className="text-slate-600">5–10 minutes</strong>
          </p>
          <p>
            Dispatch team:{" "}
            <strong className="text-slate-600">+254 701 111 222</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceServices;

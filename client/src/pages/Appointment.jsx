import React, { useEffect, useState } from "react";
import { Header, Footer } from "../components/layouts";
import api from "../api/axios";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaStethoscope,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaShieldAlt,
  FaUserFriends,
  FaLock,
  FaExclamationTriangle,
  FaArrowRight,
  FaArrowLeft,
  FaLayerGroup,
  FaPaperPlane,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm " +
  "outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300";

const selectClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm " +
  "outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all " +
  "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

const labelClass = "text-xs font-bold uppercase tracking-widest text-slate-500";


const INIT_NORMAL = {
  name: "",
  email: "",
  phone: "",
  category: "",
  service: "",
  date: "",
  time: "",
};

const INIT_ANON = {
  case_type: "",
  contact_method: "",
  contact_value: "",
  preferred_date: "",
  preferred_time: "",
  asap: false,
  reason: "",
  safe_to_contact: null,
};

const Appointment = () => {
  const navigate = useNavigate();
  const [bookingType, setBookingType] = useState("normal");
  const [formData, setFormData] = useState(INIT_NORMAL);
  const [step, setStep] = useState(1);
  const [anonymousForm, setAnonymousForm] = useState(INIT_ANON);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/services");
        let servicesData = [];
        if (Array.isArray(res.data)) {
          servicesData = res.data;
        } else if (Array.isArray(res.data.data)) {
          servicesData = res.data.data;
        } else if (res.data.services && Array.isArray(res.data.services)) {
          servicesData = res.data.services;
        } else {
          servicesData = [];
        }
        setServices(servicesData);
        const uniqueCategories = [
          ...new Set(servicesData.map((s) => s.category).filter(Boolean)),
        ].sort();
        setCategories(uniqueCategories);
      } catch {
        toast.error("Failed to load departments. Please refresh the page.");
        setServices([]);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (formData.category) {
      setFilteredServices(
        services.filter((s) => s.category === formData.category)
      );
    } else {
      setFilteredServices([]);
    }
    setFormData((prev) => ({ ...prev, service: "", time: "" }));
    setSelectedService(null);
    setAvailableTimeSlots([]);
  }, [formData.category, services]);

  useEffect(() => {
    if (formData.service) {
      const service = services.find((s) => s._id === formData.service);
      setSelectedService(service);
      if (service?.serviceHours) generateTimeSlots(service.serviceHours);
    } else {
      setSelectedService(null);
      setAvailableTimeSlots([]);
    }
    setFormData((prev) => ({ ...prev, time: "" }));
  }, [formData.service, services]);


  const generateTimeSlots = (serviceHours) => {
    if (!serviceHours) { setAvailableTimeSlots([]); return; }

    if (
      serviceHours.toLowerCase().includes("24/7") ||
      serviceHours.toLowerCase().includes("24 hours") ||
      serviceHours.toLowerCase().includes("24-hour")
    ) {
      const slots = [];
      for (let hour = 0; hour < 24; hour++) {
        for (let minute of [0, 30]) { 
          slots.push(
            `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
          );
        }
      }
      setAvailableTimeSlots(slots);
      return;
    }

    const timeMatch = serviceHours.match(/(\d+)(am|pm)\s*to\s*(\d+)(am|pm)/i);
    if (timeMatch) {
      let startHour = parseInt(timeMatch[1]);
      let endHour = parseInt(timeMatch[3]);
      if (timeMatch[2].toLowerCase() === "pm" && startHour !== 12) startHour += 12;
      if (timeMatch[4].toLowerCase() === "pm" && endHour !== 12) endHour += 12;
      if (timeMatch[2].toLowerCase() === "am" && startHour === 12) startHour = 0;
      if (timeMatch[4].toLowerCase() === "am" && endHour === 12) endHour = 0;
      const slots = [];
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute of [0, 30]) {
          slots.push(
            `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
          );
        }
      }
      setAvailableTimeSlots(slots);
    } else {
      const slots = [];
      for (let hour = 8; hour < 17; hour++) {
        for (let minute of [0, 30]) {
          slots.push(
            `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
          );
        }
      }
      setAvailableTimeSlots(slots);
    }
  };

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validateNormalForm = () => {
    const { name, email, phone, category, service, date, time } = formData;
    if (!name.trim()) { toast.error("Please enter your name"); return false; }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { toast.error("Please enter a valid email address"); return false; }
    if (!phone.match(/^[0-9\s\-\+\(\)]{9,}$/)) { toast.error("Please enter a valid phone number"); return false; }
    if (!category) { toast.error("Please select a category"); return false; }
    if (!service) { toast.error("Please select a service"); return false; }
    if (!date) { toast.error("Please select a date"); return false; }
    if (!time) { toast.error("Please select a time"); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateNormalForm()) return;
    setLoading(true);
    try {
      await api.post("/appointments", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: selectedService?.name || "",
        department: selectedService?.department || formData.category,
        date: formData.date,
        time: formData.time,
      });

      setFormData(INIT_NORMAL);
      toast.success("Appointment booked successfully!");
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {

      toast.error(error?.response?.data?.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousChange = (field, value) =>
    setAnonymousForm((prev) => ({ ...prev, [field]: value }));

  const validateStep = () => {
    switch (step) {
      case 1: return anonymousForm.case_type !== "";
      case 2:
        if (anonymousForm.contact_method === "in_person") return true;
        return anonymousForm.contact_method !== "" && anonymousForm.contact_value !== "";
      case 3:
        if (anonymousForm.asap) return true;
        return anonymousForm.preferred_date.trim() !== "" && anonymousForm.preferred_time.trim() !== "";
      case 4: return true;
      case 5: return anonymousForm.safe_to_contact !== null;
      default: return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((s) => s - 1);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleAnonymousSubmit = async () => {
    setLoading(true);
    try {
      await api.post("/anonymous", anonymousForm);
      setStep(6);
      toast.success("Anonymous appointment request submitted successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const resetAnonymousForm = () => {
    setAnonymousForm(INIT_ANON);
    setStep(1);
  };

  const switchBookingType = (type) => {
    setBookingType(type);
    if (type === "anonymous") setStep(1);
  };

  const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-10 py-12">

  
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
            Healthcare
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            Book an Appointment
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            {
              type: "normal",
              icon: FaCalendarAlt,
              title: "Standard Appointment",
              body: "Regular booking with your contact details",
              accent: "blue",
            },
            {
              type: "anonymous",
              icon: FaShieldAlt,
              title: "Anonymous Support",
              body: "Confidential booking — no identity required",
              accent: "purple",
            },
          ].map(({ type, icon: Icon, title, body, accent }) => {
            const active = bookingType === type;
            return (
              <button
                key={type}
                onClick={() => switchBookingType(type)}
                className={`bg-white border rounded-2xl p-5 flex items-start gap-4 text-left transition-all cursor-pointer ${
                  active
                    ? `border-${accent}-300 ring-1 ring-${accent}-100`
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    active
                      ? `bg-${accent}-50 border border-${accent}-100`
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <Icon
                    className={`text-sm ${active ? `text-${accent}-600` : "text-slate-400"}`}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-0.5">{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/*  NORMAL BOOKING*/}

        {bookingType === "normal" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <div className="mb-6 pb-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Appointment Details</h3>
              <p className="text-slate-500 text-sm mt-0.5">
                Please fill in all required fields to book your visit.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

            
              <Field label="Full Name" required>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="David Kamau"
                  className={inputClass}
                />
              </Field>

       
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Email Address" required>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="davidkamau@gmail.com"
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone Number" required>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0712 345 678"
                    className={inputClass}
                  />
                </Field>
              </div>

         
              <Field label="Category" required>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {categories.length === 0 && (
                    <option disabled>No categories available</option>
                  )}
                </select>
              </Field>

         
              <Field label="Service" required>
                <select
                  name="service"
                  required
                  value={formData.service}
                  onChange={handleChange}
                  disabled={!formData.category}
                  className={selectClass}
                >
                  <option value="">
                    {formData.category ? "Select a service" : "Select a category first"}
                  </option>
                  {filteredServices.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.division})
                    </option>
                  ))}
                </select>
                {selectedService && (
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800 space-y-1">
                    <p><span className="font-semibold">Hours:</span> {selectedService.serviceHours}</p>
                    {selectedService.department && (
                      <p><span className="font-semibold">Department:</span> {selectedService.department}</p>
                    )}
                    {selectedService.nhifCovered && (
                      <p className="flex items-center gap-1.5 text-green-700">
                        <FaCheckCircle className="text-xs" /> NHIF Covered
                      </p>
                    )}
                  </div>
                )}
              </Field>

           
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Date of Appointment" required>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className={inputClass}
                  />
                </Field>
                <Field label="Preferred Time" required>
                  <select
                    name="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                    disabled={!formData.service}
                    className={selectClass}
                  >
                    <option value="">
                      {formData.service ? "Select a time slot" : "Select a service first"}
                    </option>
                    {availableTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  {availableTimeSlots.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {availableTimeSlots.length} slots available based on service hours
                    </p>
                  )}
                </Field>
              </div>

          
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <FaExclamationTriangle className="text-amber-500 text-sm shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 leading-relaxed">
                  Our team will contact you to confirm your appointment. Please ensure your contact information is correct.
                </p>
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
                  {loading ? "Booking…" : "Book Appointment"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/*ANONYMOUS BOOKING */}


        {bookingType === "anonymous" && (
          <>
      
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 mb-8">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                <FaLock className="text-amber-600 text-sm" />
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">
                No personal identification is required. Your submission is encrypted and only accessible to
                authorised support staff. You are protected from any form of retaliation.
              </p>
            </div>

            {/* Progress */}
            {step < 6 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className={labelClass}>Step {step} of 5</p>
                  <p className="text-xs text-slate-400">{Math.round((step / 5) * 100)}% complete</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(step / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Step card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">

              {/* Step 1 – Case type */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="pb-5 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">What type of support do you need?</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Select the service that best fits your situation.</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        value: "GBV",
                        icon: FaShieldAlt,
                        title: "Gender-Based Violence (GBV)",
                        body: "Support for survivors of domestic violence, sexual assault, harassment, or abuse.",
                      },
                      {
                        value: "Mental Health",
                        icon: FaUserFriends,
                        title: "Mental Health Support",
                        body: "Counselling and support for anxiety, depression, trauma, or other concerns.",
                      },
                    ].map(({ value, icon: Icon, title, body }) => (
                      <button
                        key={value}
                        onClick={() => handleAnonymousChange("case_type", value)}
                        className={`w-full bg-white border rounded-2xl p-5 flex items-start gap-4 text-left transition-all cursor-pointer ${
                          anonymousForm.case_type === value
                            ? "border-blue-300 ring-2 ring-blue-100"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          anonymousForm.case_type === value
                            ? "bg-blue-50 border border-blue-100"
                            : "bg-slate-50 border border-slate-200"
                        }`}>
                          <Icon className={`text-sm ${anonymousForm.case_type === value ? "text-blue-600" : "text-slate-400"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 mb-0.5">{title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={nextStep}
                      disabled={!anonymousForm.case_type}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                                 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 – Contact method */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="pb-5 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">How should we contact you?</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Choose your preferred method of communication.</p>
                  </div>

                  <div className="space-y-3">
                    {/* Phone */}
                    <button
                      type="button"
                      onClick={() => handleAnonymousChange("contact_method", "phone")}
                      className={`w-full bg-white border rounded-2xl p-5 flex items-start gap-4 text-left transition-all cursor-pointer ${
                        anonymousForm.contact_method === "phone"
                          ? "border-blue-300 ring-2 ring-blue-100"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        anonymousForm.contact_method === "phone"
                          ? "bg-blue-50 border border-blue-100"
                          : "bg-slate-50 border border-slate-200"
                      }`}>
                        <FaPhone className={`text-sm ${anonymousForm.contact_method === "phone" ? "text-blue-600" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 mb-0.5">Phone Contact</p>
                        <p className="text-xs text-slate-500">We'll call you at your preferred time.</p>
                      </div>
                    </button>

                    {anonymousForm.contact_method === "phone" && (
                      <div className="ml-13 pl-1 flex flex-col gap-1.5">
                        <label className={labelClass}>Phone Number <span className="text-red-400">*</span></label>
                        <input
                          type="tel"
                          placeholder="0712 345 678"
                          value={anonymousForm.contact_value}
                          onChange={(e) => handleAnonymousChange("contact_value", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    )}

                    {/* In-person */}
                    <button
                      type="button"
                      onClick={() =>
                        setAnonymousForm((prev) => ({
                          ...prev,
                          contact_method: "in_person",
                          contact_value: "",
                        }))
                      }
                      className={`w-full bg-white border rounded-2xl p-5 flex items-start gap-4 text-left transition-all cursor-pointer ${
                        anonymousForm.contact_method === "in_person"
                          ? "border-blue-300 ring-2 ring-blue-100"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        anonymousForm.contact_method === "in_person"
                          ? "bg-blue-50 border border-blue-100"
                          : "bg-slate-50 border border-slate-200"
                      }`}>
                        <FaUserFriends className={`text-sm ${anonymousForm.contact_method === "in_person" ? "text-blue-600" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 mb-0.5">In-Person Visit</p>
                        <p className="text-xs text-slate-500">Walk in at your scheduled time.</p>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 text-sm 
                    font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                      <FaArrowLeft className="text-xs" /> Back
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!validateStep()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                                 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 – Timing */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="pb-5 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">When would you like to meet?</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Select your preferred date and time.</p>
                  </div>

                  {/* ASAP checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <input
                      type="checkbox"
                      checked={anonymousForm.asap}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAnonymousForm((prev) => ({
                          ...prev,
                          asap: checked,
                          preferred_date: checked ? "" : prev.preferred_date,
                          preferred_time: checked ? "" : prev.preferred_time,
                        }));
                      }}
                      className="mt-0.5 w-4 h-4 accent-amber-500"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">I need help as soon as possible</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        We'll prioritise your request and contact you at the earliest available time.
                      </p>
                    </div>
                  </label>

                  {!anonymousForm.asap && (
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field label="Preferred Date">
                        <input
                          type="date"
                          value={anonymousForm.preferred_date}
                          onChange={(e) => handleAnonymousChange("preferred_date", e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Preferred Time">
                        <input
                          type="time"
                          value={anonymousForm.preferred_time}
                          onChange={(e) => handleAnonymousChange("preferred_time", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 text-sm
                     font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                      <FaArrowLeft className="text-xs" /> Back
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!validateStep()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                                 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4 – Reason (optional) */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="pb-5 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">Reason for appointment</h3>
                    <p className="text-slate-500 text-sm mt-0.5">
                      Share any additional context that might help us prepare. This is completely optional.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Additional details</label>
                    <textarea
                      value={anonymousForm.reason}
                      onChange={(e) => handleAnonymousChange("reason", e.target.value)}
                      placeholder="Share as much or as little as you're comfortable with. Avoid including identifying information if you wish to remain anonymous."
                      rows={7}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 text-sm
                     font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                      <FaArrowLeft className="text-xs" /> Back
                    </button>
                    <button
                      onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                                 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Continue <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5 – Safety check */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="pb-5 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">Safety Check</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Your safety is our priority.</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                      <FaExclamationTriangle className="text-amber-600 text-sm" />
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      We need to know if contacting you could put you at risk. Your honest answer helps us protect you.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        value: true,
                        icon: FaCheckCircle,
                        title: "Yes, it's safe to contact me",
                        body: "We can reach out using the contact method you provided.",
                        color: "green",
                      },
                      {
                        value: false,
                        icon: FaExclamationTriangle,
                        title: "No, please don't contact me",
                        body: "We'll wait for you to reach out to us instead.",
                        color: "red",
                      },
                    ].map(({ value, icon: Icon, title, body, color }) => {
                      const active = anonymousForm.safe_to_contact === value;
                      return (
                        <button
                          key={String(value)}
                          onClick={() => handleAnonymousChange("safe_to_contact", value)}
                          className={`w-full bg-white border rounded-2xl p-5 flex items-start gap-4 text-left transition-all cursor-pointer ${
                            active
                              ? `border-${color}-300 ring-2 ring-${color}-100`
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            active
                              ? `bg-${color}-50 border border-${color}-100`
                              : "bg-slate-50 border border-slate-200"
                          }`}>
                            <Icon className={`text-sm ${active ? `text-${color}-600` : "text-slate-400"}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 mb-0.5">{title}</p>
                            <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {anonymousForm.safe_to_contact === false && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
                      <strong>Alternative ways to reach us:</strong> You can visit our facility in person,
                      or use our secure online chat during business hours (8am – 6pm).
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 text-sm 
                    font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                      <FaArrowLeft className="text-xs" /> Back
                    </button>
                    <button
                      onClick={handleAnonymousSubmit}
                      disabled={!validateStep() || loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                                 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPaperPlane className="text-xs" />
                      {loading ? "Submitting…" : "Submit Request"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 6 – Confirmation */}
              {step === 6 && (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mx-auto">
                    <FaCheckCircle className="text-2xl text-green-600" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">Request Submitted</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                      Your anonymous appointment request has been received.{" "}
                      {anonymousForm.safe_to_contact
                        ? "Our team will contact you soon to confirm your appointment."
                        : "Please reach out to us when it's safe to do so."}
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left max-w-sm mx-auto space-y-2">
                    {[
                      ["Service Type", anonymousForm.case_type],
                      ["Contact Method", anonymousForm.contact_method],
                      anonymousForm.asap
                        ? ["Timing", "As soon as possible"]
                        : ["Date", `${anonymousForm.preferred_date} at ${anonymousForm.preferred_time}`],
                    ].map(([key, val]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-slate-500">{key}</span>
                        <span className="font-semibold text-slate-800 capitalize">{val}</span>
                      </div>
                    ))}
                  </div>

              
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-sm mx-auto">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <strong>24/7 Crisis Support:</strong> If you're in immediate danger, call{" "}
                      <strong>999</strong> or our crisis hotline at <strong>1195</strong>.
                    </p>
                  </div>

                  <button
                    onClick={resetAnonymousForm}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              )}
            </div>

            {step < 6 && (
              <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                  <FaShieldAlt className="text-red-500 text-sm" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Need Immediate Help?</p>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p><span className="font-semibold">Emergency:</span> Call 999</p>
                    <p><span className="font-semibold">24/7 Crisis Hotline:</span> Call 1195 (Toll-free)</p>
                    <p><span className="font-semibold">GBV Helpline:</span> Call 1195 or text "HELP" to 22100</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Appointment;
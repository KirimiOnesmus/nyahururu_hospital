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
  FaExclamationCircle,
  FaShieldAlt,
  FaUserFriends,
  FaLock,
  FaExclamationTriangle,
  FaArrowRight,
  FaArrowLeft,
  FaLayerGroup 
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Appointment = () => {
  const navigate = useNavigate();
  const [bookingType, setBookingType] = useState("normal");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    date: "",
    time: "",
  });

  const [step, setStep] = useState(1);
  const [anonymousForm, setAnonymousForm] = useState({
    case_type: "",
    contact_method: "",
    contact_value: "",
    preferred_date: "",
    preferred_time: "",
    asap: false,
    reason: "",
    safe_to_contact: null,
  });

  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/services");
        console.log("Services response:", res.data);

        let servicesData = [];
        if (Array.isArray(res.data)) {
          servicesData = res.data;
        } else if (Array.isArray(res.data.data)) {
          servicesData = res.data.data;
        } else if (res.data.services && Array.isArray(res.data.services)) {
          servicesData = res.data.services;
        } else {
          console.warn("Unexpected response structure:", res.data);
          servicesData = [];
        }

        setServices(servicesData);

        // Extract unique departments
        const uniqueCategories = [
          ...new Set(servicesData.map((s) => s.category).filter(Boolean)),
        ].sort();
        setCategories(uniqueCategories);
      } catch (error) {
        // console.error("Error fetching departments", error);
        toast.error("Failed to load departments. Please refresh the page.");
        setServices([]);
      }
    };
    fetchServices();
  }, []);

  // Filter services when category changes
  useEffect(() => {
    if (formData.category) {
      const filtered = services.filter(
        (service) => service.category === formData.category
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices([]);
    }
    // Reset service selection when category changes
    setFormData((prev) => ({ ...prev, service: "", time: "" }));
    setSelectedService(null);
    setAvailableTimeSlots([]);
  }, [formData.category, services]);

  // Update selected service and generate time slots when service changes
  useEffect(() => {
    if (formData.service) {
      const service = services.find((s) => s._id === formData.service);
      setSelectedService(service);

      if (service && service.serviceHours) {
        generateTimeSlots(service.serviceHours);
      }
    } else {
      setSelectedService(null);
      setAvailableTimeSlots([]);
    }
    // Reset time when service changes
    setFormData((prev) => ({ ...prev, time: "" }));
  }, [formData.service, services]);

  // Parse service hours and generate available time slots
  const generateTimeSlots = (serviceHours) => {
    if (!serviceHours) {
      setAvailableTimeSlots([]);
      return;
    }

    // Handle 24/7 services
    if (
      serviceHours.toLowerCase().includes("24/7") ||
      serviceHours.toLowerCase().includes("24 hours") ||
      serviceHours.toLowerCase().includes("24-hour")
    ) {
      const slots = [];
      for (let hour = 0; hour < 24; hour++) {
        for (let minute of [0, 60]) {
          const time = `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`;
          slots.push(time);
        }
      }
      setAvailableTimeSlots(slots);
      return;
    }

    // Parse hours like "Mon-Fri, 8am to 5pm" or "Mon-Sat, 9am to 6pm"
    const timeMatch = serviceHours.match(/(\d+)(am|pm)\s*to\s*(\d+)(am|pm)/i);
    if (timeMatch) {
      let startHour = parseInt(timeMatch[1]);
      let endHour = parseInt(timeMatch[3]);

      // Convert to 24-hour format
      if (timeMatch[2].toLowerCase() === "pm" && startHour !== 12) {
        startHour += 12;
      }
      if (timeMatch[4].toLowerCase() === "pm" && endHour !== 12) {
        endHour += 12;
      }
      if (timeMatch[2].toLowerCase() === "am" && startHour === 12) {
        startHour = 0;
      }
      if (timeMatch[4].toLowerCase() === "am" && endHour === 12) {
        endHour = 0;
      }

      const slots = [];
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute of [0, 30]) {
          const time = `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`;
          slots.push(time);
        }
      }
      setAvailableTimeSlots(slots);
    } else {
      // Default to business hours (8am-5pm) if parsing fails
      const slots = [];
      for (let hour = 8; hour < 17; hour++) {
        for (let minute of [0, 30]) {
          const time = `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`;
          slots.push(time);
        }
      }
      setAvailableTimeSlots(slots);
    }
  };

  // Normal booking handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (submitStatus) setSubmitStatus(null);
  };

  const validateNormalForm = () => {
    const { name, email, phone, category, service, date, time } = formData;

    if (!name.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!phone.match(/^[0-9\s\-\+\(\)]{9,}$/)) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    if (!category) {
      toast.error("Please select a category");
      return false;
    }
    if (!service) {
      toast.error("Please select a service");
      return false;
    }
    if (!date) {
      toast.error("Please select a date");
      return false;
    }
    if (!time) {
      toast.error("Please select a time");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateNormalForm()) return;

    setLoading(true);
    setSubmitStatus(null);

    try {
      const res = await api.post("/appointments", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: selectedService?.name || "",
        department: selectedService?.department || formData.category, 
        date: formData.date,
        time: formData.time,
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        category: "",
        service: "",
        date: "",
        time: "",
      });
      setSubmitStatus("success");
      // console.log("Booked successfully:", res.data);
      toast.success("Appointment booked successfully!");
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
      const errorMsg =
        error.response?.data?.message || "Failed to book appointment";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Anonymous booking handlers
  const handleAnonymousChange = (field, value) => {
    setAnonymousForm({ ...anonymousForm, [field]: value });
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return anonymousForm.case_type !== "";
      case 2:
        if (anonymousForm.contact_method === "in_person") return true;
        return (
          anonymousForm.contact_method !== "" &&
          anonymousForm.contact_value !== ""
        );
      case 3:
        if (anonymousForm.asap) return true;
        return (
          anonymousForm.preferred_date.trim() !== "" &&
          anonymousForm.preferred_time.trim() !== ""
        );
      case 4:
        return true;
      case 5:
        return anonymousForm.safe_to_contact !== null;
      default:
        return true;
    }
  };

  const handleAnonymousSubmit = async () => {
    setLoading(true);
    setSubmitStatus(null);

    try {
      const res = await api.post("/anonymous", anonymousForm);
      setSubmitStatus("success");
      setStep(6);
      // console.log("Anonymous booking successful:", res.data);
      toast.success("Anonymous appointment request submitted successfully!");
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
      const errorMsg =
        error.response?.data?.message || "Failed to submit request";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetAnonymousForm = () => {
    setAnonymousForm({
      case_type: "",
      contact_method: "",
      contact_value: "",
      preferred_date: "",
      preferred_time: "",
      asap: false,
      reason: "",
      safe_to_contact: null,
    });
    setStep(1);
    setSubmitStatus(null);
  };

  const switchBookingType = (type) => {
    setBookingType(type);
    setSubmitStatus(null);
    if (type === "anonymous") {
      setStep(1);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="body">
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm">
          <Header />
        </div>

        <div className="main flex-1 px-4 sm:px-6 md:px-12 py-12 max-w-5xl mx-auto w-full">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-1 h-12 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full mr-4"></div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Book an Appointment
                </h1>
                <p className="text-gray-600 mt-2">
                  Schedule your visit with our healthcare professionals
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => switchBookingType("normal")}
              className={`flex-1 p-6 rounded-2xl border-2 transition-all duration-300 ${
                bookingType === "normal"
                  ? "border-blue-600 bg-blue-50 shadow-lg"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-start text-left">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 ${
                    bookingType === "normal" ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <FaCalendarAlt
                    className={`text-2xl ${
                      bookingType === "normal"
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    Standard Appointment
                  </h3>
                  <p className="text-sm text-gray-600">
                    Regular booking with full contact details
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => switchBookingType("anonymous")}
              className={`flex-1 p-6 rounded-2xl border-2 transition-all duration-300 ${
                bookingType === "anonymous"
                  ? "border-purple-600 bg-purple-50 shadow-lg"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-start text-left">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 ${
                    bookingType === "anonymous"
                      ? "bg-purple-100"
                      : "bg-gray-100"
                  }`}
                >
                  <FaShieldAlt
                    className={`text-2xl ${
                      bookingType === "anonymous"
                        ? "text-purple-600"
                        : "text-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1 flex items-center">
                    Anonymous Support
                    <FaLock className="ml-2 text-sm text-purple-600" />
                  </h3>
                </div>
              </div>
            </button>
          </div>

          {/* NORMAL BOOKING FORM */}
          {bookingType === "normal" && (
            <>
              {/* Success/Error Messages */}
              {submitStatus === "success" && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 animate-fadeIn">
                  <div className="flex items-start">
                    <FaCheckCircle className="text-green-600 text-xl mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">
                        Appointment Booked Successfully!
                      </h4>
                      <p className="text-sm text-green-700">
                        We've sent a confirmation email to your inbox. We look
                        forward to seeing you!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 animate-fadeIn">
                  <div className="flex items-start">
                    <FaExclamationCircle className="text-red-600 text-xl mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">
                        Booking Failed
                      </h4>
                      <p className="text-sm text-red-700">
                        There was an error processing your appointment. Please
                        try again or contact us for assistance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Card */}
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <FaCalendarAlt className="mr-3" />
                    Appointment Details
                  </h2>
                  <p className="text-blue-100 mt-1">
                    Please fill in all required information
                  </p>
                </div>

                <div className="p-6 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="group">
                      <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                        <FaUser className="mr-2 text-blue-600" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="e.g., David Kamau"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        aria-label="Full name"
                        className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                          <FaEnvelope className="mr-2 text-blue-600" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="davidkamau@gmail.com"
                          aria-label="Email address"
                          className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        />
                      </div>

                      <div className="group">
                        <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                          <FaPhone className="mr-2 text-blue-600" />
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="0712 345 678"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          aria-label="Phone number"
                          className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        />
                      </div>
                    </div>

                    {/* NEW: Category Selection */}
                    <div className="group">
                      <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                        <FaLayerGroup className="mr-2 text-blue-600" />
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        aria-label="Select category"
                        className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white"
                      >
                        <option value="">Select a Category</option>
                        {Array.isArray(categories) && categories.length > 0 ? (
                          categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))
                        ) : (
                          <option disabled>No categories available</option>
                        )}
                      </select>
                    </div>

                    {/* UPDATED: Service Selection (filtered by category) */}
                    <div className="group">
                      <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                        <FaStethoscope className="mr-2 text-blue-600" />
                        Service *
                      </label>
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        required
                        disabled={!formData.category}
                        aria-label="Select service"
                        className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {formData.category
                            ? "Select a Service"
                            : "Select a category first"}
                        </option>
                        {filteredServices.map((service) => (
                          <option key={service._id} value={service._id}>
                            {service.name} ({service.division})
                          </option>
                        ))}
                      </select>
                      {selectedService && (
                        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="space-y-2">
                            <p className="text-sm text-blue-900">
                              <strong>Service Hours:</strong>{" "}
                              {selectedService.serviceHours}
                            </p>
                            {selectedService.department && (
                              <p className="text-sm text-blue-900">
                                <strong>Department:</strong>{" "}
                                {selectedService.department}
                              </p>
                            )}
                            {selectedService.nhifCovered && (
                              <p className="text-sm text-green-700 flex items-center">
                                <FaCheckCircle className="mr-2" />
                                NHIF Covered
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                          <FaCalendarAlt className="mr-2 text-blue-600" />
                          Date of Appointment *
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          required
                          min={new Date().toISOString().split("T")[0]}
                          aria-label="Appointment date"
                          className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        />
                      </div>

                      {/* UPDATED: Time Selection (filtered by service hours) */}
                      <div className="group">
                        <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                          <FaClock className="mr-2 text-blue-600" />
                          Preferred Time *
                        </label>
                        <select
                          name="time"
                          value={formData.time}
                          onChange={handleChange}
                          required
                          disabled={!formData.service}
                          aria-label="Appointment time"
                          className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {formData.service
                              ? "Select a time slot"
                              : "Select a service first"}
                          </option>
                          {availableTimeSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                        {availableTimeSlots.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            {availableTimeSlots.length} time slots available
                            based on service hours
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Our team will contact you to
                        confirm your appointment. Please ensure your contact
                        information is correct.
                      </p>
                    </div>

                    <div className="text-center pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="relative bg-gradient-to-r from-blue-600 to-blue-500 text-white px-12 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Booking Appointment...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <FaCheckCircle className="mr-2" />
                            Book Appointment
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Additional Info Section */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCalendarAlt className="text-2xl text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Flexible Scheduling
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose a date and time that works best for your schedule
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaStethoscope className="text-2xl text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Expert Care
                  </h3>
                  <p className="text-sm text-gray-600">
                    Access to qualified healthcare professionals
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                  <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="text-2xl text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Quick Confirmation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Receive instant confirmation via email and SMS
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ANONYMOUS BOOKING - Rest remains the same as before */}
          {bookingType === "anonymous" && (
            <>
              {/* Privacy Notice */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <FaLock className="text-purple-600 mt-1 mr-3 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-purple-900 mb-1">
                      100% Confidential
                    </p>
                    <p className="text-purple-700">
                      No personal identification required. Your information is
                      encrypted and only accessible to authorized support staff.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {step < 6 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Step {step} of 5
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round((step / 5) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(step / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Main Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-10">
                  {/* Step 1: Case Type */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          What type of support do you need?
                        </h2>
                        <p className="text-gray-600">
                          Select the service that best fits your situation
                        </p>
                      </div>

                      <div className="space-y-4">
                        <button
                          onClick={() =>
                            handleAnonymousChange("case_type", "GBV")
                          }
                          className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                            anonymousForm.case_type === "GBV"
                              ? "border-purple-600 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                              <FaShieldAlt className="text-2xl text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                Gender-Based Violence (GBV)
                              </h3>
                              <p className="text-sm text-gray-600">
                                Support for survivors of domestic violence,
                                sexual assault, harassment, or abuse
                              </p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() =>
                            handleAnonymousChange("case_type", "Mental Health")
                          }
                          className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                            anonymousForm.case_type === "Mental Health"
                              ? "border-purple-600 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                              <FaUserFriends className="text-2xl text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                Mental Health Support
                              </h3>
                              <p className="text-sm text-gray-600">
                                Counseling and support for anxiety, depression,
                                trauma, or other mental health concerns
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={nextStep}
                          disabled={!anonymousForm.case_type}
                          className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          Continue
                          <FaArrowRight className="ml-2" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Contact Method */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          How should we contact you?
                        </h2>
                        <p className="text-gray-600">
                          Choose your preferred method of communication
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              handleAnonymousChange("contact_method", "phone");
                            }}
                            className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                              anonymousForm.contact_method === "phone"
                                ? "border-purple-600 bg-purple-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center">
                              <FaPhone className="text-2xl text-purple-600 mr-4" />
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  Phone Contact
                                </h3>
                                <p className="text-sm text-gray-600">
                                  We'll call you at your preferred time
                                </p>
                              </div>
                            </div>
                          </button>

                          {anonymousForm.contact_method === "phone" && (
                            <div className="mt-4 ml-4 pl-8 animate-fadeIn">
                              <label className="block mb-2 font-medium text-gray-700">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                placeholder="0712 345 678"
                                value={anonymousForm.contact_value}
                                onChange={(e) =>
                                  handleAnonymousChange(
                                    "contact_value",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          // onClick={() => {
                          //   handleAnonymousChange(
                          //     "contact_method",
                          //     "in_person"
                          //   );
                          //   handleAnonymousChange("contact_value", "");
                          // }}
                          onClick={() =>
                            setAnonymousForm((prev) => ({
                              ...prev,
                              contact_method: "in_person",
                              contact_value: "",
                            }))
                          }
                          className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                            anonymousForm.contact_method === "in_person"
                              ? "border-purple-600 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <FaUserFriends className="text-2xl text-purple-600 mr-4" />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                In-Person Visit
                              </h3>
                              <p className="text-sm text-gray-600">
                                Walk in at your scheduled time
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={prevStep}
                          className="text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center"
                        >
                          <FaArrowLeft className="mr-2" />
                          Back
                        </button>
                        <button
                          onClick={nextStep}
                          disabled={!validateStep()}
                          className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          Continue
                          <FaArrowRight className="ml-2" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Appointment Time */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          When would you like to meet?
                        </h2>
                        <p className="text-gray-600">
                          Select your preferred date and time
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={anonymousForm.asap}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAnonymousForm((prev) => ({
                                ...prev,
                                asap: checked,
                                preferred_date: checked
                                  ? ""
                                  : prev.preferred_date,
                                preferred_time: checked
                                  ? ""
                                  : prev.preferred_time,
                              }));
                            }}
                            className="mt-1 mr-3 w-5 h-5 text-yellow-600 focus:ring-yellow-500"
                          />
                          <div>
                            <span className="font-semibold text-yellow-900">
                              I need help as soon as possible
                            </span>
                            <p className="text-sm text-yellow-700 mt-1">
                              We'll prioritize your request and contact you at
                              the earliest available time
                            </p>
                          </div>
                        </label>
                      </div>

                      {!anonymousForm.asap && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block mb-2 font-medium text-gray-700 flex items-center">
                              <FaCalendarAlt className="mr-2 text-purple-600" />
                              Preferred Date
                            </label>
                            <input
                              type="date"
                              value={anonymousForm.preferred_date}
                              onChange={(e) =>
                                handleAnonymousChange(
                                  "preferred_date",
                                  e.target.value
                                )
                              }
                              min={new Date().toISOString().split("T")[0]}
                              className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>

                          <div>
                            <label className="block mb-2 font-medium text-gray-700 flex items-center">
                              <FaClock className="mr-2 text-purple-600" />
                              Preferred Time
                            </label>
                            <input
                              type="time"
                              value={anonymousForm.preferred_time}
                              onChange={(e) =>
                                handleAnonymousChange(
                                  "preferred_time",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={prevStep}
                          className="text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center"
                        >
                          <FaArrowLeft className="mr-2" />
                          Back
                        </button>
                        <button
                          onClick={nextStep}
                          disabled={!validateStep()}
                          className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          Continue
                          <FaArrowRight className="ml-2" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Reason (Optional) */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Reason for appointment (Optional)
                        </h2>
                        <p className="text-gray-600">
                          Share any additional information that might help us
                          prepare. This is completely optional.
                        </p>
                      </div>

                      <div>
                        <textarea
                          value={anonymousForm.reason}
                          onChange={(e) =>
                            handleAnonymousChange("reason", e.target.value)
                          }
                          placeholder="You can share as much or as little as you're comfortable with..."
                          rows={6}
                          className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Please avoid including identifying information in this
                          message
                        </p>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={prevStep}
                          className="text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center"
                        >
                          <FaArrowLeft className="mr-2" />
                          Back
                        </button>
                        <button
                          onClick={nextStep}
                          className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-600 transition-all duration-300 flex items-center"
                        >
                          Continue
                          <FaArrowRight className="ml-2" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Safety Question */}
                  {step === 5 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Safety Check
                        </h2>
                        <p className="text-gray-600">
                          Your safety is our priority
                        </p>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <div className="flex items-start mb-4">
                          <FaExclamationTriangle className="text-red-600 text-xl mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-red-900 mb-2 text-lg">
                              Is it safe for us to contact you?
                            </h3>
                            <p className="text-sm text-red-700">
                              We need to know if contacting you could put you at
                              risk. Your honest answer helps us protect you.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 mt-6">
                          <button
                            onClick={() =>
                              handleAnonymousChange("safe_to_contact", true)
                            }
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                              anonymousForm.safe_to_contact === true
                                ? "border-green-600 bg-green-50"
                                : "border-gray-300 hover:border-gray-400 bg-white"
                            }`}
                          >
                            <div className="flex items-center">
                              <FaCheckCircle
                                className={`text-xl mr-3 ${
                                  anonymousForm.safe_to_contact === true
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                              />
                              <div>
                                <span className="font-semibold text-gray-900">
                                  Yes, it's safe to contact me
                                </span>
                                <p className="text-sm text-gray-600 mt-1">
                                  We can reach out using the contact method you
                                  provided
                                </p>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() =>
                              handleAnonymousChange("safe_to_contact", false)
                            }
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                              anonymousForm.safe_to_contact === false
                                ? "border-red-600 bg-red-50"
                                : "border-gray-300 hover:border-gray-400 bg-white"
                            }`}
                          >
                            <div className="flex items-center">
                              <FaExclamationTriangle
                                className={`text-xl mr-3 ${
                                  anonymousForm.safe_to_contact === false
                                    ? "text-red-600"
                                    : "text-gray-400"
                                }`}
                              />
                              <div>
                                <span className="font-semibold text-gray-900">
                                  No, please don't contact me
                                </span>
                                <p className="text-sm text-gray-600 mt-1">
                                  We'll wait for you to reach out to us instead
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {anonymousForm.safe_to_contact === false && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="text-sm text-blue-800">
                            <strong>Alternative ways to reach us:</strong> You
                            can visit our facility in person, or use our secure
                            online chat during business hours (8am - 6pm).
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={prevStep}
                          className="text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center"
                        >
                          <FaArrowLeft className="mr-2" />
                          Back
                        </button>
                        <button
                          onClick={handleAnonymousSubmit}
                          disabled={!validateStep() || loading}
                          className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit Request
                              <FaCheckCircle className="ml-2" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Confirmation */}
                  {step === 6 && submitStatus === "success" && (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCheckCircle className="text-4xl text-green-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Request Submitted Successfully
                      </h2>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Your anonymous appointment request has been received.
                        {anonymousForm.safe_to_contact
                          ? " Our team will contact you soon to confirm your appointment."
                          : " Please reach out to us when it's safe to do so."}
                      </p>

                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8 max-w-md mx-auto">
                        <h3 className="font-semibold text-purple-900 mb-3">
                          Your Request Summary
                        </h3>
                        <div className="space-y-2 text-left text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Service Type:</span>
                            <span className="font-medium text-gray-900">
                              {anonymousForm.case_type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Contact Method:
                            </span>
                            <span className="font-medium text-gray-900 capitalize">
                              {anonymousForm.contact_method}
                            </span>
                          </div>
                          {anonymousForm.asap ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Timing:</span>
                              <span className="font-medium text-yellow-700">
                                ASAP
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Date:</span>
                                <span className="font-medium text-gray-900">
                                  {anonymousForm.preferred_date}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Time:</span>
                                <span className="font-medium text-gray-900">
                                  {anonymousForm.preferred_time}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="text-sm text-blue-800">
                            <strong>24/7 Crisis Support:</strong> If you're in
                            immediate danger, please call emergency services at{" "}
                            <strong>999</strong> or our crisis hotline at{" "}
                            <strong>1195</strong>
                          </p>
                        </div>

                        <button
                          onClick={resetAnonymousForm}
                          className="text-purple-600 font-semibold hover:text-purple-700 transition-colors duration-200"
                        >
                          Submit Another Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Support Resources */}
              {step < 6 && (
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Need Immediate Help?
                  </h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>
                      <strong>Emergency:</strong> Call 999
                    </p>
                    <p>
                      <strong>24/7 Crisis Hotline:</strong> Call 1195
                      (Toll-free)
                    </p>
                    <p>
                      <strong>GBV Helpline:</strong> Call 1195 or text "HELP" to
                      22100
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Appointment;

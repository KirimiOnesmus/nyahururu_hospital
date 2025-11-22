import React, { useEffect, useState } from "react";
import { Header, Footer } from "../components/layouts";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaStethoscope,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

const Appointment = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    time: "",
  });
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get("/api/services");
        setServices(res.data);
      } catch (error) {
        console.error("Error fetching services", error);
      }
    };
    fetchServices();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear any previous submit status when user starts editing
    if (submitStatus) setSubmitStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);

    try {
      const res = await axios.post("/api/appointments", formData);
      setFormData({
        name: "",
        email: "",
        phone: "",
        service: "",
        date: "",
        time: "",
      });
      setSubmitStatus("success");
      console.log("Booked successfully:", res.data);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="body">
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm">
          <Header />
        </div>

        <div className="main flex-1 px-4 sm:px-6 md:px-12 py-12 max-w-5xl mx-auto w-full">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-1 h-12 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full mr-4"></div>
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
                    We've sent a confirmation email to your inbox. We look forward to
                    seeing you!
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
                    There was an error processing your appointment. Please try again or
                    contact us for assistance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaCalendarAlt className="mr-3" />
                Appointment Details
              </h2>
              <p className="text-blue-100 mt-1">
                Please fill in all required information
              </p>
            </div>

            {/* Form Body */}
            <div className="p-6 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
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
                    className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  />
                </div>

                {/* Email and Phone Row */}
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
                      className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>

                {/* Service Selection */}
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
                    className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white"
                  >
                    <option value="">Select a Service</option>
                    {services.map((service) => (
                      <option key={service._id} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time Row */}
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
                      className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div className="group">
                    <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                      <FaClock className="mr-2 text-blue-600" />
                      Preferred Time *
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Our team will contact you to confirm your
                    appointment. Please ensure your contact information is correct.
                  </p>
                </div>

                {/* Submit Button */}
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
              <h3 className="font-semibold text-gray-900 mb-2">Flexible Scheduling</h3>
              <p className="text-sm text-gray-600">
                Choose a date and time that works best for your schedule
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaStethoscope className="text-2xl text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Expert Care</h3>
              <p className="text-sm text-gray-600">
                Access to qualified healthcare professionals
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-2xl text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Confirmation</h3>
              <p className="text-sm text-gray-600">
                Receive instant confirmation via email and SMS
              </p>
            </div>
          </div>
        </div>

        <div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Appointment;
import React, { useState } from "react";
import {
  FaHeart,
  FaCheckCircle,
  FaExclamationCircle,
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaClock,
  FaWeightHanging,
  FaNotesMedical,
  FaShieldAlt,
} from "react-icons/fa";
import { Header, Footer } from "../components/layouts";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const BloodRegistration = () => {
  const [formData, setFormData] = useState({
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
  });

  const [submittedStatus, setSubmittedStatus] = useState(null);
  //   const [donorId, setDonorId] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

  const validateDonor = () => {
    const newErrors = [];

    if (!formData.fullName.trim()) newErrors.push("Full Name is required");
    if (!formData.email.trim()) newErrors.push("Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.push("Please enter a valid email address");
    if (!formData.phone.trim()) newErrors.push("Phone Number is required");
    if (!formData.gender) newErrors.push("Gender is required");
    if (!formData.age) newErrors.push("Age is required");
    if (!formData.weight) newErrors.push("Weight is required");
    if (!formData.nationalId.trim()) newErrors.push("National ID is required");
    if (!formData.donationDate) newErrors.push("Donation date is required");
    if (!formData.donationTime) newErrors.push("Donation time is required");

    const age = parseInt(formData.age);
    if (age < 16 || age > 70)
      newErrors.push("Age must be between 16 and 70 years");

    const weight = parseInt(formData.weight);
    if (weight < 50) newErrors.push("Weight must be at least 50 kg");

    if (!formData.consentDonate)
      newErrors.push("Blood donation consent is required");
    if (!formData.consentTest)
      newErrors.push("Infectious Disease Test consent is required");
    if (!formData.consentTerms)
      newErrors.push("Hospital Terms consent is required");

    return newErrors;
  };

const handleRegistration = async () => {
  const validationErrors = validateDonor();

  if (validationErrors.length > 0) {
    setErrors(validationErrors);
    setSubmittedStatus(null);
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

    // Axios automatically puts the JSON response here
    if (response.data.success) {
      setSubmittedStatus("success");
      setFormData({
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
      });
      toast.success("Registration successful!");
      navigate("/")
    } else {
      toast.error(response.data.message || "Registration failed.");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSubmittedStatus(null), 5000);
  } catch (error) {
    console.error("Registration error:", error);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.error("Registration failed. Please try again.");
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
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm">
        <Header />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12">
       
        {submittedStatus === "success" && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-2xl p-6 animate-fadeIn shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaCheckCircle className="text-green-600 text-2xl mt-1" />
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-green-900 text-lg mb-2">
                  Registration Successful!
                </h3>
                <p className="text-green-700">
                  Thank you for registering as a blood donor. A confirmation
                  email has been sent to your inbox. Our team will contact you
                  to confirm your donation appointment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-1 h-12 bg-gradient-to-b from-red-600 to-rose-600 rounded-full mr-4"></div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Blood Donor Registration
              </h1>
              <p className="text-gray-600 mt-2">
                Join our community of lifesavers and make a difference today
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-red-600 to-rose-500 p-8">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <FaHeart className="mr-3" />
              Donor Registration Form
            </h2>
            <p className="text-red-100 mt-2">
              Please complete all required fields marked with an asterisk (*)
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8 md:p-12 space-y-8">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <FaUser className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Personal Information
                </h3>
              </div>

              <div className="space-y-6 bg-gray-50 p-6 rounded-2xl">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="e.g., John Kariuki"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                      <FaEnvelope className="mr-2 text-red-600" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                      <FaPhone className="mr-2 text-red-600" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="0712 345 678"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Blood Group
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white"
                    >
                      <option value="">Select (Optional)</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                      <FaIdCard className="mr-2 text-red-600" />
                      National ID *
                    </label>
                    <input
                      type="text"
                      name="nationalId"
                      placeholder="ID Number"
                      value={formData.nationalId}
                      onChange={handleInputChange}
                      className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Health Information Section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <FaNotesMedical className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Health Information
                </h3>
              </div>

              <div className="space-y-6 bg-gray-50 p-6 rounded-2xl">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Age (16-70) *
                    </label>
                    <input
                      type="number"
                      name="age"
                      placeholder="Years"
                      value={formData.age}
                      onChange={handleInputChange}
                      min="16"
                      max="70"
                      className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                      <FaWeightHanging className="mr-2 text-red-600" />
                      Weight (kg, min 50) *
                    </label>
                    <input
                      type="number"
                      name="weight"
                      placeholder="kg"
                      value={formData.weight}
                      onChange={handleInputChange}
                      min="50"
                      className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Existing Health Conditions
                  </label>
                  <textarea
                    name="healthConditions"
                    placeholder="List any existing health conditions or write 'None'"
                    value={formData.healthConditions}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 resize-none"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Current Medications
                  </label>
                  <textarea
                    name="medications"
                    placeholder="List any current medications or write 'None'"
                    value={formData.medications}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 resize-none"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Donation Schedule Section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <FaCalendarAlt className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Donation Schedule
                </h3>
              </div>

              <div className="space-y-6 bg-gray-50 p-6 rounded-2xl">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 font-semibold text-gray-700">
                      Preferred Donation Date *
                    </label>
                    <input
                      type="date"
                      name="donationDate"
                      value={formData.donationDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-gray-700 flex items-center">
                      <FaClock className="mr-2 text-red-600" />
                      Preferred Time *
                    </label>
                    <input
                      type="time"
                      name="donationTime"
                      value={formData.donationTime}
                      onChange={handleInputChange}
                      className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Consents Section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <FaShieldAlt className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Consents & Agreements
                </h3>
              </div>

              <div className="space-y-4 bg-gray-50 p-6 rounded-2xl">
                <label className="flex items-start p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-colors duration-200">
                  <input
                    type="checkbox"
                    name="consentDonate"
                    checked={formData.consentDonate}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-red-600 mt-1 flex-shrink-0"
                  />
                  <span className="ml-3 text-gray-700">
                    <span className="font-semibold text-gray-900">
                      I consent to donate blood *
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      I understand the donation process and agree to donate
                      blood to help save lives
                    </p>
                  </span>
                </label>

                <label className="flex items-start p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-colors duration-200">
                  <input
                    type="checkbox"
                    name="consentTest"
                    checked={formData.consentTest}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-red-600 mt-1 flex-shrink-0"
                  />
                  <span className="ml-3 text-gray-700">
                    <span className="font-semibold text-gray-900">
                      I consent to infectious disease testing *
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      I agree to be tested for infectious diseases including
                      HIV, Hepatitis B, C, and Syphilis
                    </p>
                  </span>
                </label>

                <label className="flex items-start p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-colors duration-200">
                  <input
                    type="checkbox"
                    name="consentTerms"
                    checked={formData.consentTerms}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-red-600 mt-1 flex-shrink-0"
                  />
                  <span className="ml-3 text-gray-700">
                    <span className="font-semibold text-gray-900">
                      I agree to hospital terms and conditions *
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      I have read and agree to the hospital's privacy policy and
                      terms of service
                    </p>
                  </span>
                </label>
              </div>
            </div>

            {/* Information Box */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start">
                <FaHeart className="text-red-600 text-xl mt-1 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-red-900 mb-1">
                    Why donate blood?
                  </p>
                  <p className="text-red-700">
                    Your donation can save up to 3 lives. Blood is essential for
                    surgeries, trauma care, and treating blood disorders. Make a
                    difference today!
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={handleRegistration}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-rose-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 flex items-center justify-center text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing Registration...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" />
                    Complete Registration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHeart className="text-3xl text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg">Save Lives</h3>
            <p className="text-gray-600 text-sm">
              One donation can save up to 3 lives and help patients in critical
              need
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-3xl text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg">
              Quick Process
            </h3>
            <p className="text-gray-600 text-sm">
              The entire donation process takes about 45 minutes from start to
              finish
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="text-3xl text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg">
              Safe & Sterile
            </h3>
            <p className="text-gray-600 text-sm">
              All equipment is sterile and single-use to ensure your safety
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default BloodRegistration;

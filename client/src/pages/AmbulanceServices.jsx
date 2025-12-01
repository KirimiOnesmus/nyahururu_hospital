import React, { useState, useEffect } from "react";
import {
  FaExclamationCircle,
  FaCheckCircle,
  FaSpinner,
  FaAmbulance,
  FaMapMarkerAlt,
} from "react-icons/fa";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';

const AmbulanceServices = () => {
  const [formData, setFormData] = useState({
    patientName: "",
    phone: "",
    email: "",
    county: "",
    constituency: "",
    ward: "",
    specificLocation: "",
    destinationHospital: "",
    emergencyLevel: "standard",
    medicalCondition: "",
    additionalNotes: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [bookingId, setBookingId] = useState(null);
  const navigate = useNavigate();

  // Location data state
  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState({
    counties: false,
    constituencies: false,
    wards: false,
  });

  const API_KEY = "keyPub1569gsvndc123kg9sjhg";
  const API_BASE = "https://kenyaareadata.vercel.app/api/areas";
  const FIXED_COUNTY = "Laikipia"; // Fixed county

  // Fetch Laikipia county data on component mount
  useEffect(() => {
    fetchLaikipiaData();
  }, []);

  const fetchLaikipiaData = async () => {
    setLoadingLocations(prev => ({ ...prev, constituencies: true }));
    try {
      const response = await fetch(`${API_BASE}?apiKey=${API_KEY}&county=${FIXED_COUNTY}`);
      const data = await response.json();
      console.log("Laikipia County Data:", data);
      
      // Extract constituencies from nested structure
      if (data && data.Laikipia) {
        const constituencyNames = Object.keys(data.Laikipia);
        setConstituencies(constituencyNames);
        console.log("Extracted Constituencies:", constituencyNames);
        // Auto-select Laikipia county
        setFormData(prev => ({ ...prev, county: FIXED_COUNTY }));
      }
    } catch (error) {
      console.error("Error fetching Laikipia data:", error);
    } finally {
      setLoadingLocations(prev => ({ ...prev, constituencies: false }));
    }
  };

  const fetchWards = async (county, constituency) => {
    setLoadingLocations(prev => ({ ...prev, wards: true }));
    setWards([]);
    try {
      const response = await fetch(
        `${API_BASE}?apiKey=${API_KEY}&county=${encodeURIComponent(county)}&constituency=${encodeURIComponent(constituency)}`
      );
      const data = await response.json();
      console.log("Wards Data:", data);
      
      // Extract wards from nested structure
      if (data && data[county] && data[county][constituency]) {
        const wardsList = data[county][constituency];
        setWards(wardsList);
        console.log("Extracted Wards:", wardsList);
      }
    } catch (error) {
      console.error("Error fetching wards:", error);
    } finally {
      setLoadingLocations(prev => ({ ...prev, wards: false }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.patientName.trim())
      newErrors.patientName = "Patient name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, "")))
      newErrors.phone = "Please enter a valid 10-digit phone number";
    if (!formData.county) newErrors.county = "County is required";
    if (!formData.constituency) newErrors.constituency = "Constituency is required";
    if (!formData.specificLocation.trim())
      newErrors.specificLocation = "Specific location details are required";
    if (!formData.destinationHospital.trim())
      newErrors.destinationHospital = "Destination hospital is required";
    if (!formData.medicalCondition.trim())
      newErrors.medicalCondition = "Please describe the medical condition";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Handle constituency selection
    if (name === "constituency") {
      setFormData(prev => ({
        ...prev,
        ward: "",
      }));
      if (value && formData.county) {
        fetchWards(FIXED_COUNTY, value);
      } else {
        setWards([]);
      }
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);
    
    try {
      // Build full location string with all hierarchical data
      const fullLocation = [
        formData.specificLocation,
        formData.ward,
        formData.constituency,
        formData.county
      ].filter(Boolean).join(", ");

      // Call the backend API
      const response = await api.post("/ambulance-bookings/create", {
        patientName: formData.patientName,
        phone: formData.phone,
        email: formData.email || null,
        currentLocation: fullLocation,
        destinationHospital: formData.destinationHospital,
        emergencyLevel: formData.emergencyLevel,
        medicalCondition: formData.medicalCondition,
        additionalNotes: formData.additionalNotes || null,
      });

      // Store booking ID for reference
      setBookingId(response.data.booking._id);
      
      setSubmitted(true);
      toast.success(response.data.message || "Ambulance booked successfully!");
      
      // Reset form
      setFormData({
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
      });

      // Hide success message after 7 seconds and navigate
      setTimeout(() => {
        setSubmitted(false);
        navigate("/"); // Redirect to home or another page
      }, 7000);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Failed to book ambulance";
      console.error("Booking error:", errorMsg);
      setErrors({ submit: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <FaAmbulance className="text-3xl text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Book Ambulance
          </h1>
          <p className="text-gray-600">
            Request emergency ambulance services from our hospital
          </p>
        </div>

        {submitted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <FaCheckCircle className="text-2xl text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">
                Request Submitted Successfully!
              </h3>
              <p className="text-green-700 text-sm mt-1">
                Our dispatch team will contact you shortly with ETA details.
              </p>
              {bookingId && (
                <p className="text-green-600 text-xs mt-2">
                  Booking ID: <span className="font-mono font-semibold">{bookingId}</span>
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div>
            {/* Patient Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Patient Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                      errors.patientName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter patient's full name"
                  />
                  {errors.patientName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.patientName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="0712345678"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      placeholder="patient@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <FaMapMarkerAlt className="text-indigo-600" />
                Location Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    County
                  </label>
                  <input
                    type="text"
                    value="Laikipia"
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Service area: Laikipia County only</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Constituency *
                    </label>
                    <select
                      name="constituency"
                      value={formData.constituency}
                      onChange={handleChange}
                      disabled={loadingLocations.constituencies || constituencies.length === 0}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                        errors.constituency ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">
                        {loadingLocations.constituencies
                          ? "Loading constituencies..."
                          : "Select constituency"}
                      </option>
                      {constituencies.map((constituency) => (
                        <option key={constituency} value={constituency}>
                          {constituency}
                        </option>
                      ))}
                    </select>
                    {errors.constituency && (
                      <p className="text-red-500 text-sm mt-1">{errors.constituency}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ward (Optional)
                    </label>
                    <select
                      name="ward"
                      value={formData.ward}
                      onChange={handleChange}
                      disabled={!formData.constituency || loadingLocations.wards}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    >
                      <option value="">
                        {loadingLocations.wards
                          ? "Loading..."
                          : !formData.constituency
                          ? "Select constituency first"
                          : "Select ward"}
                      </option>
                      {wards.map((ward) => (
                        <option key={ward} value={ward}>
                          {ward}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Location/Landmark *
                  </label>
                  <input
                    type="text"
                    name="specificLocation"
                    value={formData.specificLocation}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                      errors.specificLocation ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="E.g., ABC Building, opposite Tuskys Supermarket"
                  />
                  {errors.specificLocation && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.specificLocation}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Hospital *
                  </label>
                  <input
                    type="text"
                    name="destinationHospital"
                    value={formData.destinationHospital}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
                      errors.destinationHospital
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Name of destination hospital"
                  />
                  {errors.destinationHospital && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.destinationHospital}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Information Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Medical Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Level *
                  </label>
                  <select
                    name="emergencyLevel"
                    value={formData.emergencyLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  >
                    <option value="standard">
                      Standard - Non-life threatening
                    </option>
                    <option value="urgent">
                      Urgent - Immediate attention needed
                    </option>
                    <option value="critical">
                      Critical - Life-threatening emergency
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Condition *
                  </label>
                  <textarea
                    name="medicalCondition"
                    value={formData.medicalCondition}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none ${
                      errors.medicalCondition
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Describe the patient's medical condition and symptoms"
                  />
                  {errors.medicalCondition && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.medicalCondition}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="Any other relevant information (allergies, medications, special requirements, etc.)"
                  />
                </div>
              </div>
            </div>

            {/* Alert */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <FaExclamationCircle className="text-xl text-blue-600 flex-shrink-0 mt-1" />
              <p className="text-sm text-blue-700">
                For life-threatening emergencies, please call <span className="font-semibold">999</span> or <span className="font-semibold">911</span> immediately instead of using this form.
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-8 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="text-lg animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <FaAmbulance />
                  Book Ambulance Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Response time: Usually within 5-10 minutes</p>
          <p className="mt-2">
            Questions? Contact our dispatch team at{" "}
            <span className="font-semibold">+254-701111222</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceServices;
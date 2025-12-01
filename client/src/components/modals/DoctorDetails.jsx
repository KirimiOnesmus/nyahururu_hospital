import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Header, Footer } from "../../components/layouts";
import { 
  FaUserMd, 
  FaGraduationCap, 
  FaHospital, 
  FaClock, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaArrowLeft
} from "react-icons/fa";

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/doctors/doctors/${id}`);
        setDoctor(res.data.data);
        console.log("Doctor data:", res.data.data);
      } catch (err) {
        console.error(err);
        setError("Doctor not found or error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  // Format availability days
  const formatAvailability = (availability) => {
    if (!availability || availability.length === 0) {
      return "Schedule not available";
    }
    
    return availability.map((slot, index) => (
      <div key={index} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
        <FaClock className="text-blue-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{slot.day}</p>
          <p className="text-sm text-gray-600">
            {slot.startTime} - {slot.endTime}
          </p>
        </div>
      </div>
    ));
  };

  // Get full name
  const fullName = doctor?.userId?.firstName && doctor?.userId?.lastName
    ? `Dr. ${doctor.userId.firstName} ${doctor.userId.lastName}`
    : doctor?.userId?.firstName 
    ? `Dr. ${doctor.userId.firstName}`
    : "Doctor";

  if (loading) {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
          <Header />
        </div>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading doctor details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
          <Header />
        </div>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error || "Doctor not found"}</p>
            <button
              onClick={() => navigate("/doctors")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Specialists
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <div className="flex-1 bg-gray-50">
        <div className="px-6 py-8 max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/doctors")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold transition-colors"
          >
            <FaArrowLeft />
            Back to Specialists
          </button>

          {/* Doctor Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-400 to-indigo-400 h-32"></div>
            <div className="px-6 md:px-10 pb-8">
              <div className="flex flex-col md:flex-row gap-6 -mt-16">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  {doctor.profile?.imageUrl ? (
                    <img
                      src={`http://localhost:5000${doctor.profile.imageUrl}`}
                      alt={fullName}
                      className="w-40 h-40 object-cover rounded-2xl shadow-xl border-4 border-white"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-xl border-4 border-white flex items-center justify-center">
                      <FaUserMd className="text-6xl text-blue-400" />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 mt-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{fullName}</h1>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-4 py-2  text-blue-700  text-sm font-semibold flex items-center gap-2">
                      <FaUserMd />
                      {doctor.speciality || "General Practitioner"}
                    </span>

                  </div>


                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - Bio & Education */}
            <div className="md:col-span-2 space-y-6">
              {/* Professional Bio */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaUserMd className="text-blue-600" />
                  Professional Bio
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {doctor.bio || "No professional bio available at this time."}
                </p>
              </div>

              {/* Education */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaGraduationCap className="text-blue-600" />
                  Educational Qualifications
                </h2>
                <div className="text-gray-700 leading-relaxed">
                  {doctor.education || doctor.profile?.educationalQualification ? (
                    <p>{doctor.education || doctor.profile?.educationalQualification}</p>
                  ) : (
                    <p className="text-gray-500 italic">No educational qualifications listed</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Availability */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-600" />
                  Availability Schedule
                </h2>
                
                <div className="space-y-2">
                  {doctor.availability && doctor.availability.length > 0 ? (
                    formatAvailability(doctor.availability)
                  ) : (
                    <div className="text-center py-6">
                      <FaClock className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Schedule not available</p>
                    </div>
                  )}
                </div>

                {/* Book Appointment Button */}
                <button
                  onClick={() => navigate("/appointment")}
                  className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DoctorDetails;
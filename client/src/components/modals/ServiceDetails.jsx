import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Header, Footer } from "../../components/layouts";
import { FaStethoscope, FaCheckCircle, FaClock, FaPhone, FaMapMarkerAlt, FaUser, FaMoneyBillWave, FaHospital, FaTags } from "react-icons/fa";

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/services/${id}`);
        setService(res.data);
        // console.log(res.data);
      } catch (err) {
        console.error("Failed to fetch service details:", err);
        setError("Failed to load service details");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
          <Header />
        </div>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium text-lg">Loading service details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
          <Header />
        </div>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <svg className="w-24 h-24 mx-auto text-red-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Service Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "The service you're looking for doesn't exist or has been removed."}</p>
            <button
              onClick={() => navigate("/services")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
            >
              Back to Services
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
  
          <button
            onClick={() => navigate("/services")}
            className="group flex items-center gap-2 text-gray-600 cursor-pointer hover:text-blue-600 font-medium mb-8 transition-colors duration-300"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Services
          </button>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        
            <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 p-12">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-8">
              
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 opacity-20 blur-2xl rounded-full"></div>
                    {service.imageUrl ? (
                      <div className="relative">
                        <img
                          src={`${BACKEND_URL}${service.imageUrl}`}
                          alt={service.name}
                          className="h-40 w-40 object-cover rounded-2xl shadow-lg relative z-10"
                        />
                        <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30"></div>
                      </div>
                    ) : (
                      <div className="h-40 w-40 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg relative z-10">
                        <FaStethoscope className="text-7xl text-white" />
                      </div>
                    )}
                  </div>

         
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                      {service.category && (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                          <FaTags className="mr-2" />
                          {service.category}
                        </span>
                      )}
                      {service.division && (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-600 text-white">
                          <FaHospital className="mr-2" />
                          {service.division}
                        </span>
                      )}
                      {service.nhifCovered && (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                          <FaCheckCircle className="mr-2" />
                          SHA Covered
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      {service.name}
                    </h1>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-300/20 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            <div className="p-8 sm:p-12">
              <div className="max-w-4xl mx-auto space-y-8">
 
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                    About This Service
                  </h2>
                  <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-line">
                    {service.description || "No detailed description available for this service."}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
  
                  {service.serviceHours && (
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <FaClock className="text-2xl text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Service Hours</h3>
                      </div>
                      <p className="text-gray-700">{service.serviceHours}</p>
                    </div>
                  )}


                  {service.location && (
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-green-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <FaMapMarkerAlt className="text-2xl text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Location</h3>
                      </div>
                      <p className="text-gray-700">{service.location}</p>
                    </div>
                  )}

                  {service.headOfDepartment && (
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-purple-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <FaUser className="text-2xl text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Department Head</h3>
                      </div>
                      <p className="text-gray-700">{service.headOfDepartment}</p>
                    </div>
                  )}


                  {service.tariffInfo && (
                    <div className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-6 border border-yellow-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                          <FaMoneyBillWave className="text-2xl text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Pricing</h3>
                      </div>
                      <p className="text-gray-700">{service.tariffInfo}</p>
                    </div>
                  )}


                  {service.contactInfo && (
                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                          <FaPhone className="text-2xl text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Contact</h3>
                      </div>
                      <p className="text-gray-700">{service.contactInfo}</p>
                    </div>
                  )}
                </div>

                {service.features && service.features.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {service.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <FaCheckCircle className="text-blue-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-center text-white">
                  <h3 className="text-2xl font-bold mb-3">Ready to Get Started?</h3>
                  <p className="text-blue-100 mb-6">Book an appointment or contact us for more information</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate("/appointment")}
                      className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl cursor-pointer hover:bg-blue-50 transition-all duration-300 hover:scale-105"
                    >
                      Book Appointment
                    </button>
                    <button 
                      onClick={() => navigate("/services")}
                      className="px-8 py-3 bg-blue-700 text-white font-semibold rounded-xl cursor-pointer hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-105 border-2 border-white/20"
                    >
                      View All Services
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ServiceDetails;
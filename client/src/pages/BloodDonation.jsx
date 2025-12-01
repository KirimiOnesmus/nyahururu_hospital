import React, { useEffect, useState } from "react";
import { Header, Footer } from "../components/layouts";
import DonationBanner from "../assets/blood-donation.jpeg";
import { PiSirenFill } from "react-icons/pi";
import { BiDonateBlood } from "react-icons/bi";
import { BsPeople } from "react-icons/bs";
import { FaRegChartBar, FaStethoscope, FaRegHeart, FaTint, FaPhone } from "react-icons/fa";
import { TfiWrite } from "react-icons/tfi";
import { GiCoffeeCup } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";

const BloodDonation = () => {
  const navigate = useNavigate();
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch active urgent requests - FIXED ENDPOINT
  useEffect(() => {
    const fetchUrgentRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        // ✅ FIXED: Changed from /urgent-requests/active to /urgent-request/active
        const response = await api.get("/urgent-request/active");
        
        if (response.data.success) {
          setUrgentRequests(response.data.data || []);
        } else {
          setUrgentRequests([]);
        }
      } catch (error) {
        console.error("Error fetching urgent requests:", error);
        // Only show error if it's not a 404 (no urgent requests)
        if (error.response?.status !== 404) {
          setError("Failed to load urgent blood requests");
          toast.error("Failed to load urgent blood requests");
        }
        setUrgentRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUrgentRequests();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUrgentRequests, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle phone call
  const handleCallNow = (contactNumber) => {
    if (contactNumber) {
      window.location.href = `tel:${contactNumber}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <div className="flex flex-col min-h-screen">

        {loading && (
          <div className="px-6 py-4 bg-gray-100">
            <div className="max-w-6xl mx-auto">
              <div className="animate-pulse bg-gray-300 h-24 rounded-lg"></div>
            </div>
          </div>
        )}

      
        {!loading && urgentRequests.length > 0 && (
          <div className=" ">
            <div className="max-w-6xl mx-auto px-6 py-4 space-y-3">
              {urgentRequests.map((request, index) => (
                <div
                  key={request._id || index}
                  className="bg-gradient-to-r from-red-500 to-red-500 text-white rounded-xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="p-4 md:p-6">
                    {/* Urgent Header */}
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <PiSirenFill className="text-2xl md:text-4xl animate-pulse" />
                      <h3 className="text-lg md:text-xl font-bold uppercase tracking-wide text-center">
                        Urgent Blood Request
                      </h3>
                      <PiSirenFill className="text-2xl md:text-4xl animate-pulse" />
                    </div>

                    {/* Message */}
                    {/* <p className="text-center text-base md:text-lg font-semibold mb-4 px-4">
                      {request.message}
                    </p> */}

                    {/* Blood Groups */}
                    <div className="flex flex-col items-center mb-4">
                      <span className="text-sm md:text-base font-medium mb-2 text-red-100">
                        Blood Groups Urgently Needed:
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                        {request.bloodGroups && request.bloodGroups.length > 0 ? (
                          request.bloodGroups.map((bloodGroup) => (
                            <span
                              key={bloodGroup}
                              className="inline-flex items-center px-4 py-2 bg-white text-red-600 rounded-full text-sm md:text-base font-bold shadow-md hover:shadow-lg transform hover:scale-110 transition-all"
                            >
                              <FaTint className="mr-1.5" />
                              {bloodGroup}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-red-100">All blood types needed</span>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-red-400">
                      <p className="text-sm md:text-base font-medium text-center">
                        Please visit our donation center immediately or call us:
                      </p>
                      <button
                        onClick={() => handleCallNow(request.contactNumber)}
                        className="inline-flex items-center gap-2 px-2 py-2.5 text-white rounded-full font-bold text-base md:text-lg"
                      >
                      
                        {request.contactNumber || "Contact Hospital"}
                      </button>
                    </div>
                  </div>

                  {/* Animated pulse border */}
                  <div className="h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 px-6 md:px-12 py-8 max-w-6xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="mt-4 mb-8 relative rounded-xl overflow-hidden shadow-2xl group">
            <img
              src={DonationBanner}
              alt="Blood Donation"
              className="w-full h-64 md:h-80 object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
              <div className="p-6 md:p-8 text-white">
                <h1 className="text-2xl md:text-4xl font-bold mb-2">
                  Every Drop Counts
                </h1>
                <p className="text-sm md:text-lg">
                  Join the life-saving mission today
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold my-6 border-l-4 border-red-600 pl-4 leading-relaxed">
            Blood Donation Has <span className="text-red-600">The Power</span> to{" "}
            <span className="text-green-600">Save Lives</span> Across Kenya
          </h2>

         
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-12">
            <div className="group card h-48 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-white shadow-lg rounded-2xl p-6 text-center transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl border border-red-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                <BiDonateBlood className="text-red-600 text-4xl" />
              </div>
              <p className="text-xl font-bold text-gray-900">450 ml</p>
              <p className="text-sm text-gray-600 mt-1">Per Donation</p>
            </div>

            <div className="group card h-48 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-white shadow-lg rounded-2xl p-6 text-center transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl border border-green-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                <BsPeople className="text-green-600 text-4xl" />
              </div>
              <p className="text-xl font-bold text-gray-900">3 Lives</p>
              <p className="text-sm text-gray-600 mt-1">Can Be Saved</p>
            </div>

            <div className="group card h-48 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white shadow-lg rounded-2xl p-6 text-center transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl border border-blue-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                <FaRegChartBar className="text-blue-600 text-4xl" />
              </div>
              <p className="text-xl font-bold text-gray-900">56 Days</p>
              <p className="text-sm text-gray-600 mt-1">Recovery Period</p>
            </div>
          </div>

     
          <div className="mt-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
              How Blood Donation Works
            </h3>
            <p className="text-gray-600 mb-8">
              A simple 4-step process that takes less than an hour
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Step 1 */}
              <div className="group bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:border-red-200 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TfiWrite className="text-red-600 text-3xl" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-red-600">1</span>
                      <h4 className="text-xl font-semibold text-gray-900">Registration</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      Complete a simple registration form with your personal information, medical history, and preferred donation time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:border-green-200 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FaStethoscope className="text-green-600 text-3xl" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-green-600">2</span>
                      <h4 className="text-xl font-semibold text-gray-900">Health Screening</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      Quick medical check including blood pressure, pulse, and hemoglobin test to ensure you're eligible to donate safely.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:border-red-200 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FaRegHeart className="text-red-600 text-3xl" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-red-600">3</span>
                      <h4 className="text-xl font-semibold text-gray-900">Blood Donation</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      The actual blood donation process takes only 8-10 minutes in a safe, sterile environment with trained medical staff.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="group bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:border-green-200 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GiCoffeeCup className="text-green-600 text-3xl" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-green-600">4</span>
                      <h4 className="text-xl font-semibold text-gray-900">Rest & Recovery</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      Enjoy complimentary refreshments and rest for 10-15 minutes before resuming your normal activities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="  py-12 px-6 mt-12">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold">
              Ready to Make a Difference?
            </h3>
            <p className="text-base md:text-lg  max-w-2xl mx-auto">
              Join thousands of Kenyans who donate blood regularly to help save lives.
              The process is simple, safe, and incredibly rewarding.
            </p>
            <div className="inline-flex items-center gap-2 text-red-500 font-bold text-lg animate-pulse">
              <FaRegHeart className="text-xl" />
              <span>Join "I Am Kenyan By Blood" Community</span>
              <FaRegHeart className="text-xl" />
            </div>
            <div className="pt-4">
              <button
                className="bg-red-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => navigate("/blood-registration")}
              >
                Start Donating Today
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BloodDonation;
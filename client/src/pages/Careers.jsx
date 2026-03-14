import React, { useEffect, useState } from "react";
import { Header, Footer } from "../components/layouts";
// import api from "../api/axios";
import publicApi from "../api/publicApi";
import {
  FaUserPlus,
  FaSignInAlt,
  FaUserEdit,
  FaBriefcase,
  FaDownload,
  FaPrint,
} from "react-icons/fa";


const Careers = () => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState(null);

  // useEffect(() => {
  //   const fetchCareers = async () => {
  //     try {
  //       const res = await api.get("/careers");
  //       const careersData = Array.isArray(res.data)
  //         ? res.data
  //         : res.data.careers || res.data.data || [];
  //       setCareers(careersData);
  //     } catch (error) {
  //       console.error("failed to fetch jobs", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchCareers();
  // }, []);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
      const res = await publicApi.get("/jobs"); 
      setCareers(res.data.data || []);
      } catch (error) {
        console.error("failed to fetch jobs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCareers();
  }, []);

  const handleViewDetails = (career) => {
    const detailsWindow = window.open("", "_blank");

    // Generate HTML content for the new page
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${career.title} - Job Details</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            .no-print { display: none; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body class="bg-gray-50">
        <div class="max-w-4xl mx-auto p-8">
          <!-- Header with Actions -->
          <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div class="flex justify-between items-start mb-6 no-print">
              <h1 class="text-3xl font-bold text-gray-900">Job Details</h1>
              <div class="flex gap-3">
                <button onclick="window.print()" class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd" />
                  </svg>
                  Print
                </button>
                <button onclick="window.close()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                  Close
                </button>
              </div>
            </div>

            <!-- Job Details Content -->
            <div class="border-t pt-6">
              <h2 class="text-3xl font-bold text-blue-600 mb-4">${career.title}</h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p class="text-sm text-gray-500 font-semibold">Department</p>
                  <p class="text-lg text-gray-800">${career.department || "N/A"}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 font-semibold">Location</p>
                  <p class="text-lg text-gray-800">${career.location}</p>
                </div>
                ${
                  career.deadline
                    ? `
                <div>
                  <p class="text-sm text-gray-500 font-semibold">Application Deadline</p>
                  <p class="text-lg text-red-600 font-semibold">${new Date(career.deadline).toLocaleDateString()}</p>
                </div>
                `
                    : ""
                }
              </div>

              <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-3">Job Description</h3>
                <div class="text-gray-700 leading-relaxed whitespace-pre-line">
                  ${career.description}
                </div>
              </div>

              ${
                career.requirements
                  ? `
              <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-3">Requirements</h3>
                <div class="text-gray-700 leading-relaxed whitespace-pre-line">
                  ${career.requirements}
                </div>
              </div>
              `
                  : ""
              }

              ${
                career.responsibilities
                  ? `
              <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-3">Responsibilities</h3>
                <div class="text-gray-700 leading-relaxed whitespace-pre-line">
                  ${career.responsibilities}
                </div>
              </div>
              `
                  : ""
              }

              <!-- Apply Button -->
              <div class="mt-8 pt-6 border-t no-print">
                <a 
                  href="/apply/${career._id}" 
                  target="_blank"
                  class="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Apply for this Position
                </a>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="text-center text-gray-500 text-sm">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    detailsWindow.document.write(htmlContent);
    detailsWindow.document.close();
  };

  return (
    <div>
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>
      <div className="main flex-1 px-6 md:px-12 py-6 mx-auto w-full md:min-h-[80vh]">
        <div className="bg-gray-50 py-16 px-6 rounded-2xl mb-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
              APPLICATION PROCESS SIMPLIFIED
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-cyan-400 to-blue-400 rounded-2xl p-8 text-white shadow-lg">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <FaUserPlus className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">
                  1. Register an Account
                </h3>
                <p className="text-white/90">
                  Provide the required information to create your professional
                  profile.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-100 to-blue-400 rounded-2xl p-8 text-white shadow-lg">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <FaSignInAlt className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">
                  2. Login into Your Portal
                </h3>
                <p className="text-white/90">
                  Login into your portal using your email and password.
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-400 to-blue-400 rounded-2xl p-8 text-white shadow-lg">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <FaUserEdit className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">
                  3. Update Your Profile
                </h3>
                <p className="text-white/90">
                  Fill all the mandatory fields and update your profile with the
                  required details.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-100 to-blue-400 rounded-2xl p-8 text-white shadow-lg">
                <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <FaBriefcase className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">
                  4. Submit Application
                </h3>
                <p className="text-white/90">
                  The job application will be submitted. You can follow the
                  progress on the My Applications tab.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-3xl font-bold my-4 border-l-4 border-blue-500 px-2">
            Available Vacancies:
          </h2>
          {loading && <p>Loading available positions...</p>}
          {!loading && careers.length === 0 && (
            <p>No open positions available right now.</p>
          )}
          <div className="grid gap-6">
            {careers.map((career) => (
              <div
                key={career._id}
                className="px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition bg-white"
              >
                <h3 className="text-2xl font-semibold text-gray-800 flex justify-between">
                  {career.title}
                  {career.deadline && (
                    <p className="text-sm text-red-500">
                      Deadline: {new Date(career.deadline).toLocaleDateString()}
                    </p>
                  )}
                </h3>
                <p className="text-sm text-gray-500">
                  Location: {career.location}
                </p>

                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => handleViewDetails(career)}
                    className="px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    View Details
                  </button>
                  <a
                    // href={`/apply/${career._id}`}
                    // target="_blank"
                    // rel="noopener noreferrer"
                    href={career.urls?.apply}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Apply Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Careers;

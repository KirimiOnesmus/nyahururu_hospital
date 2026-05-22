import React, { useEffect, useState } from "react";
import { Header, Footer } from "../components/layouts";
import api from "../api/axios";
import {
  FaUserPlus,
  FaSignInAlt,
  FaUserEdit,
  FaBriefcase,
  FaMapMarkerAlt,
  FaClock,
  FaExclamationTriangle,
  FaTimes,
  FaPrint,
  FaExternalLinkAlt,
  FaInbox,
} from "react-icons/fa";



const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const isExpired = (deadline) => deadline && new Date(deadline) < new Date();



const STEPS = [
  {
    icon: FaUserPlus,
    step: "01",
    title: "Register an Account",
    body: "Provide the required information to create your professional profile.",
  },
  {
    icon: FaSignInAlt,
    step: "02",
    title: "Login to Your Portal",
    body: "Log in using your registered email address and password.",
  },
  {
    icon: FaUserEdit,
    step: "03",
    title: "Update Your Profile",
    body: "Fill all mandatory fields and add the documents required for your application.",
  },
  {
    icon: FaBriefcase,
    step: "04",
    title: "Submit Application",
    body: "Submit your application and track its progress on the My Applications tab.",
  },
];



const JobModal = ({ career, onClose }) => {
  if (!career) return null;

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${career.title} — Job Details</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body class="bg-white font-sans text-gray-800 p-10 max-w-3xl mx-auto">
  <div class="no-print flex justify-between items-center mb-8">
    <h1 class="text-2xl font-bold text-gray-900">Job Details</h1>
    <div class="flex gap-3">
      <button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Print</button>
      <button onclick="window.close()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">Close</button>
    </div>
  </div>

  <h2 class="text-3xl font-bold text-blue-600 mb-2">${career.title}</h2>

  <div class="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 mb-6 text-sm">
    ${career.department ? `<div><p class="text-gray-400 font-semibold uppercase text-xs mb-0.5">Department</p><p class="font-medium">${career.department}</p></div>` : ""}
    <div><p class="text-gray-400 font-semibold uppercase text-xs mb-0.5">Location</p><p class="font-medium">${career.location ?? "—"}</p></div>
    ${career.deadline ? `<div><p class="text-gray-400 font-semibold uppercase text-xs mb-0.5">Application Deadline</p><p class="font-semibold text-red-600">${formatDate(career.deadline)}</p></div>` : ""}
  </div>

  <div class="mb-6">
    <h3 class="text-lg font-bold mb-2">Job Description</h3>
    <p class="text-gray-700 leading-relaxed whitespace-pre-line">${career.description ?? ""}</p>
  </div>

  ${career.requirements ? `<div class="mb-6"><h3 class="text-lg font-bold mb-2">Requirements</h3><p class="text-gray-700 leading-relaxed whitespace-pre-line">${career.requirements}</p></div>` : ""}
  ${career.responsibilities ? `<div class="mb-6"><h3 class="text-lg font-bold mb-2">Responsibilities</h3><p class="text-gray-700 leading-relaxed whitespace-pre-line">${career.responsibilities}</p></div>` : ""}

  ${career.urls?.apply ? `<div class="mt-8 pt-6 border-t no-print"><a href="${career.urls.apply}" target="_blank" class="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg">Apply for this Position</a></div>` : ""}

  <p class="text-center text-gray-400 text-xs mt-10">Generated on ${new Date().toLocaleDateString()}</p>
</body>
</html>`);
    win.document.close();
  };

  const expired = isExpired(career.deadline);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

  
        <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 rounded-t-2xl">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg
                       text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <FaTimes />
          </button>

          {career.department && (
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
              {career.department}
            </p>
          )}
          <h3 className="text-xl font-bold text-slate-800 pr-10 leading-snug">
            {career.title}
          </h3>

          <div className="flex flex-wrap gap-3 mt-3">
            {career.location && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <FaMapMarkerAlt className="text-blue-400 text-[10px]" />
                {career.location}
              </span>
            )}
            {career.deadline && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold
                  ${expired ? "text-red-500" : "text-amber-600"}`}
              >
                <FaClock className="text-[10px]" />
                {expired ? "Closed" : `Deadline: ${formatDate(career.deadline)}`}
              </span>
            )}
          </div>
        </div>

  
        <div className="px-8 py-6 space-y-6 text-sm text-slate-700 leading-relaxed">
          {career.description && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Job Description
              </p>
              <p className="whitespace-pre-line">{career.description}</p>
            </div>
          )}

          {career.requirements && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Requirements
              </p>
              <p className="whitespace-pre-line">{career.requirements}</p>
            </div>
          )}

          {career.responsibilities && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Responsibilities
              </p>
              <p className="whitespace-pre-line">{career.responsibilities}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200
                         hover:border-blue-300 hover:text-blue-600 text-slate-700 text-sm font-semibold
                         rounded-xl transition-colors"
            >
              <FaPrint className="text-xs" />
              Print / Save
            </button>

            {career.urls?.apply && !expired && (
              <a
                href={career.urls.apply}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700
                           text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <FaExternalLinkAlt className="text-xs" />
                Apply for this Position
              </a>
            )}
          </div>
        </div>

   
        <div className="px-8 py-4 border-t border-slate-100 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100
                       hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────

const Careers = () => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState(null);
    useEffect(() => {
    const fetchCareers = async () => {
      try {
        const res = await api.get("/careers");
        const careersData = Array.isArray(res.data)
          ? res.data
          : res.data.careers || res.data.data || [];
        setCareers(careersData);
      } catch (error) {
        console.error("failed to fetch jobs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCareers();
  }, []);

  // useEffect(() => {
  //   const fetchCareers = async () => {
  //     try {
  //       const res = await publicApi.get("/jobs");
  //       const data = Array.isArray(res.data)
  //         ? res.data
  //         : res.data?.careers ?? res.data?.data ?? [];
  //       setCareers(data);
  //     } catch (error) {
  //       console.error("Failed to fetch jobs:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchCareers();
  // }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
    
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-10 py-12">


        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
            Join Us
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            Careers
          </h2>
        </div>

        
        <div className="bg-amber-50  rounded-2xl p-5 flex gap-4 mb-10">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
            <FaExclamationTriangle className="text-amber-600 text-sm" />
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            We do not charge any fees at any stage of the recruitment process.
            Beware of fraudulent communications claiming to be from us. Only
            apply through official links listed on this page.
          </p>
        </div>


        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-10">
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Application Process
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Follow these four steps to submit your application.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map(({ icon: Icon, step, title, body }) => (
              <div
                key={step}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Icon className="text-blue-600 text-sm" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Step {step}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  {title}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>


        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">
              Available Vacancies
            </h3>
            <p className="text-slate-500 text-sm mt-0.5">
              Click a position to view full details and apply.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600" />
              <p className="text-slate-500 text-sm font-medium">
                Loading positions…
              </p>
            </div>
          ) : careers.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
              <FaInbox className="text-3xl" />
              <p className="text-sm font-medium">No open positions right now</p>
              <p className="text-xs text-slate-300">
                Check back soon — new vacancies are posted regularly.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {careers.map((career) => {
                const expired = isExpired(career.deadline);
                return (
                  <div
                    key={career._id ?? career.id}
                    className="px-8 py-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors"
                  >
                    {/* left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          {career.title}
                        </h4>
                        {expired && (
                          <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-full">
                            Closed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        {career.location && (
                          <span className="inline-flex items-center gap-1">
                            <FaMapMarkerAlt className="text-[10px] text-blue-400" />
                            {career.location}
                          </span>
                        )}
                        {career.department && (
                          <span className="inline-flex items-center gap-1">
                            <FaBriefcase className="text-[10px] text-blue-400" />
                            {career.department}
                          </span>
                        )}
                        {career.deadline && (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              expired ? "text-red-400" : "text-amber-500"
                            }`}
                          >
                            <FaClock className="text-[10px]" />
                            {expired ? "Deadline passed" : `Closes ${formatDate(career.deadline)}`}
                          </span>
                        )}
                      </div>
                    </div>

          
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedCareer(career)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200
                                   hover:border-blue-300 hover:text-blue-600 text-slate-600 text-xs font-semibold
                                   rounded-xl transition-colors"
                      >
                        View Details
                      </button>

                      {career.urls?.apply && !expired && (
                        <a
                          href={career.urls.apply}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700
                                     text-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          Apply Now
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

    
      <JobModal
        career={selectedCareer}
        onClose={() => setSelectedCareer(null)}
      />
    </div>
  );
};

export default Careers;
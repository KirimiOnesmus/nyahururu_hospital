import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { Header, Footer } from "../components/layouts";
import {
  FaCalendarAlt,
  FaClock,
  FaFilePdf,
  FaDownload,
  FaEye,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaTrophy,
} from "react-icons/fa";


const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const STATUS_META = {
  Active: {
    label: "Active",
    icon: FaCheckCircle,
    badge: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  Closed: {
    label: "Closed",
    icon: FaTimesCircle,
    badge: "bg-red-50 text-red-600 border border-red-200",
    dot: "bg-red-500",
  },
  Awarded: {
    label: "Awarded",
    icon: FaTrophy,
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
};

const getStatus = (status) =>
  STATUS_META[status] ?? {
    label: status ?? "Unknown",
    icon: FaInfoCircle,
    badge: "bg-slate-50 text-slate-600 border border-slate-200",
    dot: "bg-slate-400",
  };



const StatusBadge = ({ status }) => {
  const meta = getStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};


const TenderPage = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tenders");
      setTenders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching tenders:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <Header />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600" />
            <p className="text-slate-500 text-sm font-medium">
              Loading tenders…
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }



  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
  
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-10 py-12">

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
            Procurement
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            Tenders &amp; Proposals
          </h2>
        </div>


        {/* <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-4 mb-8">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
            <FaInfoCircle className="text-blue-600 text-sm" />
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            Browse current procurement opportunities below. Click{" "}
            <span className="font-semibold">View</span> to read the full tender
            details, or <span className="font-semibold">Download</span> to
            retrieve the tender document. To submit a bid, log in to the
            e-Tender Portal.
          </p>
        </div> */}

        {/* ── info cards ── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            {
              icon: FaCheckCircle,
              title: "Open &amp; Competitive",
              body: "All tenders follow a fair, transparent evaluation process in line with procurement regulations.",
            },
            {
              icon: FaClock,
              title: "Mind the Deadline",
              body: "Late submissions cannot be accepted. Ensure your bid is lodged before the stated closing date.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Icon className="text-blue-600 text-sm" />
              </div>
              <div>
                <p
                  className="text-sm font-bold text-slate-800 mb-0.5"
                  dangerouslySetInnerHTML={{ __html: title }}
                />
                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

 
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {tenders.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
              <FaFilePdf className="text-3xl" />
              <p className="text-sm font-medium">No tenders available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500">
                      Ref No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500">
                      Tender
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-slate-500">
                      Closing Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenders.map((tender, index) => (
                    <tr
                      key={tender.id ?? tender._id ?? index}
                      className="hover:bg-slate-50 transition-colors"
                    >
           
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {tender.reference ??
                          `TND-${String(index + 1).padStart(4, "0")}`}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 leading-snug">
                          {tender.title}
                        </p>
                        {tender.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {tender.description}
                          </p>
                        )}
                      </td>


                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={tender.status} />
                      </td>

           
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <FaCalendarAlt className="text-blue-400 text-xs shrink-0" />
                          {formatDate(tender.close_date)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedTender(tender)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700
                                       text-white text-xs font-semibold rounded-xl transition-colors"
                          >
                            <FaEye className="text-xs" />
                            View
                          </button>

                          {tender.file && (
                            <a
                              href={tender.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200
                                         hover:border-blue-300 hover:text-blue-600 text-slate-600 text-xs font-semibold
                                         rounded-xl transition-colors"
                            >
                              <FaDownload className="text-xs" />
                              Download
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* ── detail modal ─────────────────────────────────────────────────────── */}
      {selectedTender && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setSelectedTender(null)}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

    
            <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 rounded-t-2xl">
              <button
                onClick={() => setSelectedTender(null)}
                aria-label="Close"
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg
                           text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <FaTimes />
              </button>

              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
                {selectedTender.reference ??
                  `TND-${String(
                    tenders.findIndex(
                      (t) =>
                        (t.id ?? t._id) ===
                        (selectedTender.id ?? selectedTender._id)
                    ) + 1
                  ).padStart(4, "0")}`}
              </p>
              <h3 className="text-xl font-bold text-slate-800 pr-8 leading-snug">
                {selectedTender.title}
              </h3>
              <div className="mt-3">
                <StatusBadge status={selectedTender.status} />
              </div>
            </div>


            <div className="px-8 py-6 space-y-6">


              {selectedTender.description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Description
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedTender.description}
                  </p>
                </div>
              )}

       
              <div className="grid sm:grid-cols-2 gap-4">
                {selectedTender.open_date && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <FaCalendarAlt className="text-blue-600 text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Open Date</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatDate(selectedTender.open_date)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <FaClock className="text-blue-600 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">
                      Closing Date
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatDate(selectedTender.close_date)}
                    </p>
                  </div>
                </div>
              </div>

         
              <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                {selectedTender.file && (
                  <a
                    href={selectedTender.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200
                               hover:border-blue-300 hover:text-blue-600 text-slate-700 text-sm font-semibold
                               rounded-xl transition-colors"
                  >
                    <FaFilePdf className="text-red-400" />
                    Download Tender Document
                  </a>
                )}

                <a
                  href="/tender-portal/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700
                             text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Login to e-Tender Portal
                </a>
              </div>
            </div>

        
            <div className="px-8 py-4 border-t border-slate-100 flex justify-end rounded-b-2xl">
              <button
                onClick={() => setSelectedTender(null)}
                className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100
                           hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenderPage;
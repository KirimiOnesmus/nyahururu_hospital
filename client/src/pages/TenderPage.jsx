import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { Header, Footer } from "../components/layouts";
import {
  FaCalendarAlt,
  FaClock,
  FaFilePdf,
  FaChevronRight,
  FaDownload,
  FaEye,
} from "react-icons/fa";

const TenderPage = () => {
  const [tenders, setTenders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tenders");
      const data = Array.isArray(res.data) ? res.data : [];
      setTenders(data);
      setFiltered(data);
      setLoading(false);
    } catch (error) {
      console.log("Error fetching tenders:", error);
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getBadgeColor = (status) => {
    if (status === "Active") return "bg-green-100 text-green-700";
    if (status === "Closed") return "bg-red-100 text-red-700";
    if (status === "Awarded") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
          <Header />
        </div>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
            <p className="text-gray-600 font-medium text-lg">
              Loading Tenders...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <div className="relative  py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 border-l-4 border-blue-500 pl-3">
            Tenders and Proposals
          </h1>
          <p className="text-xl text-blue-500">
            Browse current opportunities and submit your proposals
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 space-y-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Reference Number
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Tender
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Closing Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No tenders found
                    </td>
                  </tr>
                ) : (
                  filtered.map((tender, index) => (
                    <tr
                      key={tender.id || tender._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {tender.reference ||
                          `TND-${String(index + 1).padStart(4, "0")}`}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {tender.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {tender.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getBadgeColor(
                            tender.status
                          )}`}
                        >
                          {tender.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-blue-600" />
                          {formatDate(tender.close_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedTender(tender)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <FaEye className="mr-2" />
                            View
                          </button>
                          {tender.file && (
                            <a
                              href={tender.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <FaDownload className="mr-2" />
                              Download
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />

      {selectedTender && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-xl">
              <button
                onClick={() => setSelectedTender(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-200 text-3xl font-bold"
              >
                X
              </button>
              <h2 className="text-2xl font-bold pr-8">
                {selectedTender.title}
              </h2>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getBadgeColor(
                    selectedTender.status
                  )}`}
                >
                  {selectedTender.status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedTender.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-700">
                    <FaCalendarAlt className="mr-3 text-blue-600 text-xl" />
                    <div>
                      <p className="text-xs text-gray-500">Open Date</p>
                      <p className="font-semibold">
                        {formatDate(selectedTender.open_date)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-700">
                    <FaClock className="mr-3 text-blue-600 text-xl" />
                    <div>
                      <p className="text-xs text-gray-500">Closing Date</p>
                      <p className="font-semibold">
                        {formatDate(selectedTender.close_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {selectedTender.file && (
                  <a
                    href={selectedTender.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
                  >
                    <FaFilePdf className="mr-2" /> Download Tender Document
                  </a>
                )}

                <a
                  href="/tender-portal/login"
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Login to e-Tender Portal
                </a>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
              <button
                onClick={() => setSelectedTender(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
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

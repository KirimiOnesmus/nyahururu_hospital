import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdDelete, MdCheckCircle, MdVisibility } from "react-icons/md";

const FraudPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/fraud"); // requires admin or communication token
      setReports(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      alert("Error fetching reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await api.delete(`/fraud/${id}`);
      await fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting report");
    }
  };

  const handleMarkReviewed = async (id) => {
    try {
      await api.put(`/fraud/${id}/status`, { status: "reviewed" });
      await fetchReports();
      if (selectedReport && selectedReport._id === id) {
        setSelectedReport({
          ...selectedReport,
          status: "reviewed",
          reviewedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating report");
    }
  };

  const openModal = (report) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fraud / Grievance Reports</h1>
      </div>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Issue</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Date Reported</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 border-b border-gray-300">
                  <td className="px-4 py-2 ">{r.issue || "—"}</td>
                  <td className="px-4 py-2 ">{r.location || "—"}</td>
                  <td className="px-4 py-2 ">
                    {r.status === "reviewed" ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                        Reviewed
                      </span>
                    ) : r.status === "dismissed" ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                        Dismissed
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2  text-gray-600">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString("en-US", {
                      day: "2-digit",
                      month: "short", 
                      year: "numeric",
                    }) : "—"}
                  </td>
                  <td className="px-4 py-2  flex space-x-3 text-xl">
                    <MdVisibility
                      title="View Details"
                      className="text-blue-500 cursor-pointer hover:text-blue-600"
                      onClick={() => openModal(r)}
                    />
                    {r.status !== "reviewed" && (
                      <MdCheckCircle
                        title="Mark as Reviewed"
                        className="text-green-500 cursor-pointer hover:text-green-600"
                        onClick={() => handleMarkReviewed(r._id)}
                      />
                    )}
                    <MdDelete
                      title="Delete"
                      className="text-red-500 cursor-pointer hover:text-red-600"
                      onClick={() => handleDelete(r._id)}
                    />
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-600">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-center">Report Details</h2>

            <p><strong>Issue:</strong> {selectedReport.issue || "—"}</p>
            <p><strong>Date of Incident:</strong> {selectedReport.dateOfIncident || "—"}</p>
            <p><strong>Location:</strong> {selectedReport.location || "—"}</p>

            <div className="mt-3">
              <p><strong>Details:</strong></p>
              <p className=" p-2 rounded text-sm">
                {selectedReport.details || "—"}
              </p>
            </div>

            {selectedReport.investigationNotes && (
              <div className="mt-3">
                <p><strong>Investigation Notes:</strong></p>
                <div className="bg-gray-50 border p-2 rounded text-sm">
                  {selectedReport.investigationNotes}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-5 space-x-3">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-red-600 hover:text-white font-semibold cursor-pointer"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
              {selectedReport.status !== "reviewed" && (
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  onClick={() => handleMarkReviewed(selectedReport._id)}
                >
                  Mark Reviewed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudPage;

import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { MdDelete, MdCheckCircle, MdVisibility } from "react-icons/md";
import { FaSearch } from "react-icons/fa";

const FraudPage = () => {
const [reports, setReports] = useState([]);
const [filtered, setFiltered] = useState([]);
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(false);
const [selectedReport, setSelectedReport] = useState(null);
const [modalOpen, setModalOpen] = useState(false);

const fetchReports = async () => {
try {
setLoading(true);
const res = await api.get("/fraud");
setReports(res.data);
setFiltered(res.data);
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

useEffect(() => {
const filteredData = reports.filter(
(r) =>
r.issue?.toLowerCase().includes(search.toLowerCase()) ||
r.location?.toLowerCase().includes(search.toLowerCase())
);
setFiltered(filteredData);
}, [search, reports]);

const handleDelete = async (id) => {
if (!window.confirm("Are you sure you want to delete this report?")) return;
try {
await api.delete(`/fraud/${id}`);
fetchReports();
} catch (err) {
alert(err.response?.data?.message || "Error deleting report");
}
};

const handleMarkReviewed = async (id) => {
try {
await api.put(`/fraud/${id}/status`, { status: "reviewed" });
fetchReports();
if (selectedReport && selectedReport._id === id) {
setSelectedReport({ ...selectedReport, status: "reviewed", reviewedAt: new Date().toISOString() });
}
} catch (err) {
alert(err.response?.data?.message || "Error updating report");
}
};

const openModal = (report) => {
setSelectedReport(report);
setModalOpen(true);
};

// Stats
const stats = {
total: reports.length,
reviewed: reports.filter((r) => r.status === "reviewed").length,
pending: reports.filter((r) => r.status !== "reviewed").length,
};

return (

<div className="p-6 bg-gray-100 min-h-screen">
  <h1 className="text-3xl font-bold mb-6">Fraud Reports Management</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Total Reports</p>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <MdVisibility className="text-blue-600 text-xl" />
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Reviewed</p>
          <h3 className="text-2xl font-bold text-green-600">{stats.reviewed}</h3>
        </div>
        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
          <MdCheckCircle className="text-green-600 text-xl" />
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
        </div>
        <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
          <MdVisibility className="text-yellow-600 text-xl" />
        </div>
      </div>
    </div>

    {/* Search */}
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6 flex items-center gap-4">
      <div className="flex-1 relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by issue or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>

    {/* Reports Table */}
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading reports...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500">No reports found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issue</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Reported</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-2">{r.issue || "—"}</td>
                  <td className="px-6 py-2">{r.location || "—"}</td>
                  <td className="px-6 py-2">
                    {r.status === "reviewed" ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">Reviewed</span>
                    ) : r.status === "dismissed" ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">Dismissed</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-2 text-gray-600">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-6 py-2 flex justify-end gap-3 text-xl">
                    <MdVisibility className="text-blue-500 cursor-pointer hover:text-blue-600" title="View Details" onClick={() => openModal(r)} />
                    {r.status !== "reviewed" && (
                      <MdCheckCircle className="text-green-500 cursor-pointer hover:text-green-600" title="Mark as Reviewed" onClick={() => handleMarkReviewed(r._id)} />
                    )}
                    <MdDelete className="text-red-500 cursor-pointer hover:text-red-600" title="Delete" onClick={() => handleDelete(r._id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>


  {/* Modal */}
  {modalOpen && selectedReport && (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4 text-center">Report Details</h2>
        <p><strong>Issue:</strong> {selectedReport.issue || "—"}</p>
        <p><strong>Date of Incident:</strong> {selectedReport.dateOfIncident || "—"}</p>
        <p><strong>Location:</strong> {selectedReport.location || "—"}</p>
        <div className="mt-3">
          <p><strong>Details:</strong></p>
          <p className="p-2 rounded text-sm">{selectedReport.details || "—"}</p>
        </div>
        {selectedReport.investigationNotes && (
          <div className="mt-3">
            <p><strong>Investigation Notes:</strong></p>
            <div className="bg-gray-50 border p-2 rounded text-sm">{selectedReport.investigationNotes}</div>
          </div>
        )}
        <div className="flex justify-end mt-5 gap-3">
          <button className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 font-semibold" onClick={() => setModalOpen(false)}>Close</button>
          {selectedReport.status !== "reviewed" && (
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" onClick={() => handleMarkReviewed(selectedReport._id)}>Mark Reviewed</button>
          )}
        </div>
      </div>
    </div>
  )}
</div>

);
};

export default FraudPage;
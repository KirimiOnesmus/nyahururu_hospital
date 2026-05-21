import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../api/axios";
import { MdDelete, MdCheckCircle, MdVisibility } from "react-icons/md";
import {
  FaSearch,
  FaShieldAlt,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaTimes,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaFileAlt,
  FaStickyNote,
} from "react-icons/fa";
import { toast } from "react-toastify";

const STATUS_CONFIG = {
  reviewed: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Reviewed",
    icon: FaCheckCircle,
  },
  dismissed: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    dot: "bg-rose-400",
    label: "Dismissed",
    icon: FaTimes,
  },
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-400",
    label: "Pending",
    icon: FaClock,
  },
};

const scfg = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.pending;

const fmtDate = (
  d,
  opts = { day: "2-digit", month: "short", year: "numeric" },
) => (d ? new Date(d).toLocaleDateString("en-KE", opts) : "—");

const StatCard = ({ label, value, accent, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent.bg}`}
    >
      <Icon className={`text-xl ${accent.icon}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-black ${accent.num}`}>{value ?? 0}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const c = scfg(status);
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Icon className="text-[10px]" />
      {c.label}
    </span>
  );
};

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-400">Loading reports…</p>
  </div>
);

const Empty = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
      <FaShieldAlt className="text-2xl text-gray-300" />
    </div>
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

const Modal = ({ open, onClose, children, maxW = "max-w-3xl" }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}
        style={{ animation: "modalPop .22s cubic-bezier(.34,1.56,.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const FraudPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/fraud");
      setReports(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error fetching reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const stats = useMemo(
    () => ({
      total: reports.length,
      reviewed: reports.filter((r) => r.status === "reviewed").length,
      pending: reports.filter(
        (r) => r.status !== "reviewed" && r.status !== "dismissed",
      ).length,
      dismissed: reports.filter((r) => r.status === "dismissed").length,
    }),
    [reports],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reports.filter((r) => {
      const matchSearch =
        r.issue?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.details?.toLowerCase().includes(q);
      const matchStatus =
        filterStatus === "all" ||
        r.status === filterStatus ||
        (filterStatus === "pending" && !r.status);
      return matchSearch && matchStatus;
    });
  }, [reports, search, filterStatus]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.delete(`/fraud/${id}`);

      setReports((prev) => prev.filter((r) => r._id !== id));
      if (selectedReport?._id === id) setModalOpen(false);
      toast.success("Report deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting report");
    }
  };

  const handleMarkReviewed = async (id) => {
    try {
      await api.put(`/fraud/${id}/status`, { status: "reviewed" });

      const updated = {
        status: "reviewed",
        reviewedAt: new Date().toISOString(),
      };
      setReports((prev) =>
        prev.map((r) => (r._id === id ? { ...r, ...updated } : r)),
      );
      if (selectedReport?._id === id)
        setSelectedReport((p) => ({ ...p, ...updated }));
      toast.success("Marked as reviewed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating report");
    }
  };

  const openModal = (report) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <style>{`
        @keyframes modalPop {
          from { opacity:0; transform:scale(0.94) translateY(10px); }
          to   { opacity:1; transform:scale(1)    translateY(0);    }
        }
        .fade-up { animation: fadeUp .3s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8 fade-up">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center ">
            <FaShieldAlt className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Fraud Reports
            </h1>
            <p className="text-xs text-gray-400">
              Review and manage submitted fraud and misconduct reports
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total"
            value={stats.total}
            icon={FaShieldAlt}
            accent={{
              bg: "bg-blue-50",
              icon: "text-blue-500",
              num: "text-blue-600",
            }}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={FaClock}
            accent={{
              bg: "bg-amber-50",
              icon: "text-amber-500",
              num: "text-amber-600",
            }}
          />
          <StatCard
            label="Reviewed"
            value={stats.reviewed}
            icon={FaCheckCircle}
            accent={{
              bg: "bg-emerald-50",
              icon: "text-emerald-500",
              num: "text-emerald-600",
            }}
          />
          <StatCard
            label="Dismissed"
            value={stats.dismissed}
            icon={FaExclamationTriangle}
            accent={{
              bg: "bg-rose-50",
              icon: "text-rose-500",
              num: "text-rose-600",
            }}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by issue, location, or details…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
          </select>
          {(search || filterStatus !== "all") && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 self-center shrink-0">
              <span className="font-semibold text-gray-700">
                {filtered.length}
              </span>{" "}
              of {reports.length}
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("all");
                }}
                className="ml-1 text-gray-300 hover:text-rose-400 cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <Empty
              text={
                search || filterStatus !== "all"
                  ? "No reports match your filters"
                  : "No fraud reports submitted yet"
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Issue",
                      "Location",
                      "Date Reported",
                      "Status",
                      "Actions",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 4 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r) => (
                    <tr
                      key={r._id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-semibold text-gray-900 truncate">
                          {r.issue || "—"}
                        </p>
                        {r.details && (
                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                            {r.details}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-gray-600">
                          <FaMapMarkerAlt className="text-gray-300 shrink-0" />
                          {r.location || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-gray-600">
                          <FaCalendarAlt className="text-gray-300 shrink-0" />
                          {fmtDate(r.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={r.status || "pending"} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openModal(r)}
                            className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                            title="View Details"
                          >
                            <MdVisibility className="text-base" />
                          </button>
                          {r.status !== "reviewed" && (
                            <button
                              onClick={() => handleMarkReviewed(r._id)}
                              className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
                              title="Mark as Reviewed"
                            >
                              <MdCheckCircle className="text-base" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r._id)}
                            className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <MdDelete className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60">
                <p className="text-xs text-gray-400">
                  Showing{" "}
                  <span className="font-semibold text-gray-600">
                    {filtered.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-600">
                    {reports.length}
                  </span>{" "}
                  reports
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        {selectedReport && (
          <>
            <div
              className={`px-6 py-5 rounded-t-2xl ${scfg(selectedReport.status || "pending").bg}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Report Details
                  </p>
                  <h3 className="text-xl font-black text-gray-900">
                    {selectedReport.issue || "Untitled Report"}
                  </h3>
                  <div className="mt-2">
                    <StatusBadge status={selectedReport.status || "pending"} />
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/60 cursor-pointer transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Date of Incident",
                    icon: FaCalendarAlt,
                    value: fmtDate(selectedReport.dateOfIncident),
                  },
                  {
                    label: "Location",
                    icon: FaMapMarkerAlt,
                    value: selectedReport.location || "—",
                  },
                  {
                    label: "Date Reported",
                    icon: FaCalendarAlt,
                    value: fmtDate(selectedReport.createdAt),
                  },
                  {
                    label: "Reviewed At",
                    icon: FaCheckCircle,
                    value: selectedReport.reviewedAt
                      ? fmtDate(selectedReport.reviewedAt)
                      : "Not yet reviewed",
                  },
                ].map(({ label, icon: Icon, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Icon className="text-[10px]" />
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {selectedReport.details && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FaFileAlt className="text-[10px]" />
                    Full Details
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.details}
                  </p>
                </div>
              )}

              {selectedReport.investigationNotes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FaStickyNote className="text-[10px]" />
                    Investigation Notes
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedReport.investigationNotes}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDelete(selectedReport._id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors"
                >
                  <MdDelete /> Delete
                </button>
                {selectedReport.status !== "reviewed" && (
                  <button
                    onClick={() => handleMarkReviewed(selectedReport._id)}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 cursor-pointer transition-colors shadow-sm"
                  >
                    <MdCheckCircle /> Mark Reviewed
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default FraudPage;

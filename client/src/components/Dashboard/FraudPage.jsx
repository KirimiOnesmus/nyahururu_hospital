import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "../../api/socket";
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
import notify from "../../common/utils/notify";
import {
  Modal, Spinner, EmptyState, StatCard, Button, SearchBox, Input, TextArea, Select, FormField, PageHeader, StatusBadge as SharedStatusBadge, Avatar, DataTable,
} from "../../common/components";

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



const LocalStatusBadge = ({ status }) => {
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
      notify.error(err.response?.data?.message || "Error fetching reports");
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

      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setModalOpen(false);
      notify.success("Report deleted");
    } catch (err) {
      notify.error(err.response?.data?.message || "Error deleting report");
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
        prev.map((r) => (r.id === id ? { ...r, ...updated } : r)),
      );
      if (selectedReport?.id === id)
        setSelectedReport((p) => ({ ...p, ...updated }));
      notify.success("Marked as reviewed");
    } catch (err) {
      notify.error(err.response?.data?.message || "Error updating report");
    }
  };

  const openModal = (report) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-canvas">

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

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex flex-col md:flex-row gap-3">
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

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <EmptyState
              text={
                search || filterStatus !== "all"
                  ? "No reports match your filters"
                  : "No fraud reports submitted yet"
              }
            />
          ) : (
            <>
              <DataTable
                columns={[
                  {
                    key: "issue", label: "Issue", priority: "A", mobileSlot: "identity",
                    render: (r) => (
                      <div className="max-w-xs">
                        <p className="font-semibold text-gray-900 truncate">{r.issue || "—"}</p>
                        {r.details && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{r.details}</p>}
                      </div>
                    ),
                  },
                  {
                    key: "location", label: "Location", priority: "B", mobileSlot: "meta",
                    render: (r) => <span className="flex items-center gap-1.5 text-xs text-gray-600"><FaMapMarkerAlt className="text-gray-300 shrink-0" />{r.location || "—"}</span>,
                  },
                  {
                    key: "date", label: "Date Reported", priority: "B", mobileSlot: "value",
                    render: (r) => <span className="flex items-center gap-1.5 text-xs text-gray-600"><FaCalendarAlt className="text-gray-300 shrink-0" />{fmtDate(r.createdAt)}</span>,
                  },
                  { key: "status", label: "Status", priority: "A", mobileSlot: "status", render: (r) => <LocalStatusBadge status={r.status || "pending"} /> },
                  {
                    key: "actions", label: "Actions", align: "right", priority: "A", mobileSlot: "actions",
                    render: (r) => (
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(r)} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors" title="View Details"><MdVisibility className="text-base" /></button>
                        {r.status !== "reviewed" && (
                          <button onClick={() => handleMarkReviewed(r.id)} className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors" title="Mark as Reviewed"><MdCheckCircle className="text-base" /></button>
                        )}
                        <button onClick={() => handleDelete(r.id)} className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors" title="Delete"><MdDelete className="text-base" /></button>
                      </div>
                    ),
                  },
                ]}
                data={filtered}
                rowKey={(r) => r.id}
              />
              <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{reports.length}</span> reports
                </p>
              </div>
            </>
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
                    <LocalStatusBadge status={selectedReport.status || "pending"} />
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
                  onClick={() => handleDelete(selectedReport.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors"
                >
                  <MdDelete /> Delete
                </button>
                {selectedReport.status !== "reviewed" && (
                  <button
                    onClick={() => handleMarkReviewed(selectedReport.id)}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 cursor-pointer transition-colors"
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

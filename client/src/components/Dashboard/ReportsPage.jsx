import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaPlus,
  FaSearch,
  FaFileAlt,
  FaFilePdf,
  FaFileExcel,
  FaFileWord,
  FaFileArchive,
  FaImage,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaTimes,
  FaSave,
  FaCheckCircle,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaCalendarAlt,
  FaUpload,
} from "react-icons/fa";
import api from "../../api/axios";
import { toast } from "react-toastify";

const CATEGORIES = [
  { id: "operations", name: "Hospital Operations" },
  { id: "financial", name: "Financial Reports" },
  { id: "inventory", name: "Inventory Reports" },
  { id: "logistics", name: "Logistics Reports" },
  { id: "hr", name: "HR Reports" },
  { id: "procurement", name: "Tender & Procurement" },
];

const PERIODS = ["Monthly", "Quarterly", "Yearly", "Custom"];

const TYPE_META = {
  pdf: { icon: FaFilePdf, color: "text-red-500", bg: "bg-red-50" },
  excel: { icon: FaFileExcel, color: "text-emerald-600", bg: "bg-emerald-50" },
  word: { icon: FaFileWord, color: "text-blue-500", bg: "bg-blue-50" },
  zip: { icon: FaFileArchive, color: "text-gray-500", bg: "bg-gray-100" },
  image: { icon: FaImage, color: "text-violet-500", bg: "bg-violet-50" },
};

const typeMeta = (t) =>
  TYPE_META[t] || {
    icon: FaFileAlt,
    color: "text-gray-500",
    bg: "bg-gray-100",
  };

const EMPTY_FORM = {
  title: "",
  category: "",
  type: "",
  period: "",
  customStartDate: "",
  customEndDate: "",
  description: "",
  file: null,
  status: "published",
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

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

const StatusBadge = ({ status }) =>
  status === "published" ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <FaCheckCircle className="text-[10px]" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      <FaClock className="text-[10px]" />
      Draft
    </span>
  );

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-400">Loading reports…</p>
  </div>
);

const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxW = "max-w-3xl",
}) => {
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
        <div className="flex items-start justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-black text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors shrink-0"
          >
            <FaTimes className="text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white";

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    thisMonth: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [expandedCats, setExpandedCats] = useState(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.id, true])),
  );

  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        period: filterPeriod !== "all" ? filterPeriod : undefined,
      };
      const res = await api.get("/reports", { params });
      if (res.data.success) {
        setReports(res.data.data || []);
        setStats(
          res.data.stats || { total: 0, published: 0, draft: 0, thisMonth: 0 },
        );
      } else {
        setReports(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error fetching reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterCategory, filterStatus, filterPeriod]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const categoryMap = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const filtered = reports.filter((r) => {
      const matchSearch =
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q);
      const matchPeriod = filterPeriod === "all" || r.period === filterPeriod;
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      return matchSearch && matchPeriod && matchStatus;
    });
    const map = {};
    CATEGORIES.forEach((c) => {
      map[c.id] = [];
    });
    filtered.forEach((r) => {
      if (map[r.category]) map[r.category].push(r);
    });
    return map;
  }, [reports, searchTerm, filterPeriod, filterStatus]);

  const setField = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File must be under 50 MB");
      return;
    }
    const ext = file.name.split(".").pop().toLowerCase();
    const typeMap = {
      pdf: "pdf",
      xlsx: "excel",
      xls: "excel",
      csv: "excel",
      doc: "word",
      docx: "word",
      zip: "zip",
      jpg: "image",
      jpeg: "image",
      png: "image",
    };
    setFormData((p) => ({ ...p, file, type: typeMap[ext] || p.type }));
  };

  const openCreate = (report = null) => {
    setFormData(
      report
        ? {
            _id: report._id,
            title: report.title,
            category: report.category,
            type: report.type,
            period: report.period,
            customStartDate: report.customStartDate || "",
            customEndDate: report.customEndDate || "",
            description: report.description || "",
            file: null,
            status: report.status,
          }
        : EMPTY_FORM,
    );
    setCreateModal(true);
  };

  const handleCreateReport = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return;
    }
    if (!formData.period) {
      toast.error("Period is required");
      return;
    }
    if (!formData._id && !formData.file) {
      toast.error("Please upload a file");
      return;
    }
    if (
      formData.period === "Custom" &&
      (!formData.customStartDate || !formData.customEndDate)
    ) {
      toast.error("Provide start and end dates for custom period");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      [
        "title",
        "category",
        "type",
        "period",
        "customStartDate",
        "customEndDate",
        "description",
        "status",
      ].forEach((k) => fd.append(k, formData[k] || ""));
      if (formData.file) fd.append("file", formData.file);

      const cfg = { headers: { "Content-Type": "multipart/form-data" } };
      const res = formData._id
        ? await api.put(`/reports/${formData._id}`, fd, cfg)
        : await api.post("/reports", fd, cfg);

      if (res.data.success || res.status === 200 || res.status === 201) {
        toast.success(
          `Report ${formData._id ? "updated" : "created"} successfully`,
        );
        setCreateModal(false);
        setFormData(EMPTY_FORM);
        fetchReports();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r._id !== id));
      toast.success("Report deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting report");
    }
  };

  const handleDownloadReport = async (id, fileName) => {
    try {
      const res = await api.get(`/reports/${id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "report");
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (err) {
      toast.error("Failed to download report");
    }
  };

  const handleViewReport = async (report) => {
    try {
      const res = await api.get(`/reports/${report._id}`);
      setSelectedReport(res.data.success ? res.data.data : res.data);
      setViewModal(true);
    } catch (err) {
      toast.error("Failed to fetch report details");
    }
  };

  const toggleCat = (id) => setExpandedCats((p) => ({ ...p, [id]: !p[id] }));

  const totalFiltered = useMemo(
    () => Object.values(categoryMap).reduce((s, arr) => s + arr.length, 0),
    [categoryMap],
  );

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center ">
              <FaFileAlt className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Reports Manager
              </h1>
              <p className="text-xs text-gray-400">
                Manage and organise all hospital reports and documents
              </p>
            </div>
          </div>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 cursor-pointer"
          >
            <FaPlus className="text-xs" /> Add New Report
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total"
            value={stats.total}
            icon={FaFileAlt}
            accent={{
              bg: "bg-blue-50",
              icon: "text-blue-500",
              num: "text-blue-600",
            }}
          />
          <StatCard
            label="Published"
            value={stats.published}
            icon={FaCheckCircle}
            accent={{
              bg: "bg-emerald-50",
              icon: "text-emerald-500",
              num: "text-emerald-600",
            }}
          />
          <StatCard
            label="Drafts"
            value={stats.draft}
            icon={FaClock}
            accent={{
              bg: "bg-gray-100",
              icon: "text-gray-400",
              num: "text-gray-600",
            }}
          />
          <StatCard
            label="This Month"
            value={stats.thisMonth}
            icon={FaCalendarAlt}
            accent={{
              bg: "bg-violet-50",
              icon: "text-violet-500",
              num: "text-violet-600",
            }}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reports by title or description…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                {
                  val: filterCategory,
                  set: setFilterCategory,
                  opts: [
                    ["all", "All Categories"],
                    ...CATEGORIES.map((c) => [c.id, c.name]),
                  ],
                },
                {
                  val: filterPeriod,
                  set: setFilterPeriod,
                  opts: [["all", "All Periods"], ...PERIODS.map((p) => [p, p])],
                },
                {
                  val: filterStatus,
                  set: setFilterStatus,
                  opts: [
                    ["all", "All Status"],
                    ["published", "Published"],
                    ["draft", "Draft"],
                  ],
                },
              ].map(({ val, set, opts }, i) => (
                <select
                  key={i}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600"
                >
                  {opts.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>
          {(searchTerm ||
            filterCategory !== "all" ||
            filterPeriod !== "all" ||
            filterStatus !== "all") && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {totalFiltered}
                </span>{" "}
                of {reports.length} reports
              </span>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("all");
                  setFilterPeriod("all");
                  setFilterStatus("all");
                }}
                className="text-xs text-gray-400 hover:text-rose-500 cursor-pointer underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const catReports = categoryMap[cat.id] || [];
              const isOpen = expandedCats[cat.id];
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Category header */}
                  <button
                    onClick={() => toggleCat(cat.id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <FaFileAlt className="text-blue-500 text-sm" />
                      </div>
                      <span className="font-bold text-gray-900 text-sm">
                        {cat.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${catReports.length > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {catReports.length}
                      </span>
                    </div>
                    {isOpen ? (
                      <FaChevronUp className="text-gray-300 text-xs" />
                    ) : (
                      <FaChevronDown className="text-gray-300 text-xs" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100">
                      {catReports.length === 0 ? (
                        <div className="py-10 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <FaFileAlt className="text-gray-300 text-lg" />
                          </div>
                          <p className="text-xs text-gray-400">
                            No reports in this category
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50/80 border-b border-gray-100">
                                {[
                                  "Title",
                                  "Type",
                                  "Period",
                                  "Uploaded",
                                  "Status",
                                  "Views",
                                  "",
                                ].map((h, i) => (
                                  <th
                                    key={i}
                                    className={`px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"}`}
                                  >
                                    {h || "Actions"}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {catReports.map((report) => {
                                const {
                                  icon: TypeIcon,
                                  color,
                                  bg,
                                } = typeMeta(report.type);
                                return (
                                  <tr
                                    key={report._id}
                                    className="hover:bg-gray-50/80 transition-colors group"
                                  >
                                    <td className="px-5 py-4 max-w-xs">
                                      <p className="font-semibold text-gray-900 truncate">
                                        {report.title}
                                      </p>
                                      {report.description && (
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                          {report.description}
                                        </p>
                                      )}
                                    </td>

                                    <td className="px-5 py-4">
                                      <span
                                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${bg} ${color}`}
                                      >
                                        <TypeIcon className="text-[10px]" />
                                        {report.type?.toUpperCase()}
                                      </span>
                                    </td>

                                    <td className="px-5 py-4 text-xs text-gray-600">
                                      {report.period}
                                    </td>

                                    <td className="px-5 py-4 text-xs text-gray-500">
                                      {fmtDate(report.createdAt)}
                                    </td>

                                    <td className="px-5 py-4">
                                      <StatusBadge status={report.status} />
                                    </td>

                                    <td className="px-5 py-4 text-xs text-gray-600">
                                      {report.views ?? 0}
                                    </td>

                                    <td className="px-5 py-4">
                                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() =>
                                            handleViewReport(report)
                                          }
                                          className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                                          title="View"
                                        >
                                          <FaEye className="text-sm" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDownloadReport(
                                              report._id,
                                              report.fileName,
                                            )
                                          }
                                          className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors"
                                          title="Download"
                                        >
                                          <FaDownload className="text-sm" />
                                        </button>
                                        <button
                                          onClick={() => openCreate(report)}
                                          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                                          title="Edit"
                                        >
                                          <FaEdit className="text-sm" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteReport(report._id)
                                          }
                                          className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors"
                                          title="Delete"
                                        >
                                          <FaTrash className="text-sm" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={viewModal}
        onClose={() => setViewModal(false)}
        title={selectedReport?.title || "Report Details"}
        maxW="max-w-2xl"
      >
        {selectedReport &&
          (() => {
            const { icon: TypeIcon, color, bg } = typeMeta(selectedReport.type);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Category",
                      value:
                        CATEGORIES.find((c) => c.id === selectedReport.category)
                          ?.name || selectedReport.category,
                    },
                    { label: "Period", value: selectedReport.period },
                    {
                      label: "Status",
                      value: <StatusBadge status={selectedReport.status} />,
                    },
                    { label: "Views", value: selectedReport.views ?? 0 },
                    {
                      label: "Uploaded",
                      value: fmtDate(selectedReport.createdAt),
                    },
                    {
                      label: "File Type",
                      value: (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${bg} ${color}`}
                        >
                          <TypeIcon className="text-[10px]" />
                          {selectedReport.type?.toUpperCase()}
                        </span>
                      ),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        {label}
                      </p>
                      <div className="text-sm font-semibold text-gray-800">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedReport.description && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Description
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                {selectedReport.period === "Custom" &&
                  selectedReport.customStartDate && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Custom Period
                      </p>
                      <p className="text-sm text-gray-800">
                        {fmtDate(selectedReport.customStartDate)} →{" "}
                        {fmtDate(selectedReport.customEndDate)}
                      </p>
                    </div>
                  )}

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setViewModal(false)}
                    className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadReport(
                        selectedReport._id,
                        selectedReport.fileName,
                      )
                    }
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 cursor-pointer transition-colors"
                  >
                    <FaDownload className="text-xs" /> Download
                  </button>
                </div>
              </div>
            );
          })()}
      </Modal>

      <Modal
        open={createModal}
        onClose={() => {
          setCreateModal(false);
          setFormData(EMPTY_FORM);
        }}
        title={formData._id ? "Edit Report" : "Add New Report"}
        subtitle={
          formData._id
            ? "Update report details"
            : "Upload a new report document"
        }
      >
        <div className="space-y-5">
          <Field label="Report Title" required>
            <input
              value={formData.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g., Quarterly Revenue 2025 Q2"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <select
                value={formData.category}
                onChange={(e) => setField("category", e.target.value)}
                className={inputCls}
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="File Type">
              <select
                value={formData.type}
                onChange={(e) => setField("type", e.target.value)}
                className={inputCls}
              >
                <option value="">Auto-detect</option>
                {Object.keys(TYPE_META).map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Reporting Period" required>
            <select
              value={formData.period}
              onChange={(e) => setField("period", e.target.value)}
              className={inputCls}
            >
              <option value="">Select Period</option>
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          {formData.period === "Custom" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date" required>
                <input
                  type="date"
                  value={formData.customStartDate}
                  onChange={(e) => setField("customStartDate", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="End Date" required>
                <input
                  type="date"
                  value={formData.customEndDate}
                  onChange={(e) => setField("customEndDate", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          <Field label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Brief description of the report…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <Field
            label={formData._id ? "Replace File (optional)" : "Upload File"}
            required={!formData._id}
          >
            <label
              className={`flex flex-col items-center gap-2 px-6 py-7 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                formData.file
                  ? "border-blue-400 bg-blue-50/40"
                  : "border-gray-200 hover:border-blue-400 bg-gray-50/50"
              }`}
            >
              <FaUpload
                className={`text-2xl ${formData.file ? "text-blue-500" : "text-gray-300"}`}
              />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">
                  {formData.file ? formData.file.name : "Click to browse files"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  PDF, Excel, Word, ZIP, Images · max 50 MB
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.docx,.doc,.zip,.csv,.jpeg,.jpg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </Field>

          <Field label="Publish Status">
            <div className="flex items-center gap-6">
              {["published", "draft"].map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <div
                    onClick={() => setField("status", s)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                      formData.status === s
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.status === s && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700 capitalize">{s}</span>
                </label>
              ))}
            </div>
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                setCreateModal(false);
                setFormData(EMPTY_FORM);
              }}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateReport}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer transition-colors shadow-sm shadow-blue-200"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <FaSave className="text-xs" />
                  {formData._id ? "Update Report" : "Save Report"}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReportsPage;

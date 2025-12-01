
import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaSearch,
  FaFilter,
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
import {toast} from 'react-toastify';

const ReportsPage = () => {
 const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    thisMonth: 0,
  });
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    type: "",
    period: "",
    customStartDate: "",
    customEndDate: "",
    description: "",
    file: null,
    status: "published",
  });

  const categories = [
    { id: "operations", name: "Hospital Operations" },
    { id: "financial", name: "Financial Reports" },
    { id: "inventory", name: "Inventory Reports" },
    { id: "logistics", name: "Logistics Reports" },
    { id: "hr", name: "HR Reports" },
    { id: "procurement", name: "Tender & Procurement" },
  ];

  const reportTypes = [
    { value: "pdf", label: "PDF", color: "text-red-600" },
    { value: "excel", label: "Excel", color: "text-green-600" },
    { value: "word", label: "Word", color: "text-blue-600" },
    { value: "zip", label: "ZIP", color: "text-gray-600" },
    { value: "image", label: "Image", color: "text-purple-600" },
  ];

  const periods = ["Monthly", "Quarterly", "Yearly", "Custom"];

  useEffect(() => {
    fetchReports();
    initializeExpandedCategories();
  }, [searchTerm, filterPeriod, filterStatus, filterCategory]);

  const initializeExpandedCategories = () => {
    const expanded = {};
    categories.forEach(cat => expanded[cat.id] = true);
    setExpandedCategories(expanded);
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        search: searchTerm || undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        period: filterPeriod !== "all" ? filterPeriod : undefined,
      };

      const res = await api.get("/reports", { params });

      if (res.data.success) {
        setReports(res.data.data);
        setStats(res.data.stats);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error fetching reports";
      setError(errorMsg);
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file });
      // Auto-detect file type
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "pdf") setFormData((prev) => ({ ...prev, type: "pdf" }));
      else if (["xlsx", "xls", "csv"].includes(ext)) setFormData((prev) => ({ ...prev, type: "excel" }));
      else if (["doc", "docx"].includes(ext)) setFormData((prev) => ({ ...prev, type: "word" }));
      else if (ext === "zip") setFormData((prev) => ({ ...prev, type: "zip" }));
      else if (["jpg", "jpeg", "png"].includes(ext)) setFormData((prev) => ({ ...prev, type: "image" }));
    }
  };

  const handleCreateReport = async () => {
    try {
      setLoading(true);
      setError("");

      if (!formData.title || !formData.category || !formData.period || !formData.file) {
        setError("Please fill in all required fields and upload a file");
        setLoading(false);
        return;
      }

      if (formData.period === "Custom" && (!formData.customStartDate || !formData.customEndDate)) {
        setError("Please provide both start and end dates for custom period");
        setLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("category", formData.category);
      fd.append("type", formData.type);
      fd.append("period", formData.period);
      fd.append("customStartDate", formData.customStartDate);
      fd.append("customEndDate", formData.customEndDate);
      fd.append("description", formData.description);
      fd.append("status", formData.status);
      fd.append("file", formData.file);

      let res;
      if (formData._id) {
        res = await api.put(`/reports/${formData._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/reports", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (res.data.success) {
        setCreateModal(false);
        resetForm();
        fetchReports();
        setError("");
        toast.success("Report saved successfully");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error saving report";
      setError(errorMsg);
      console.error("Error saving report:", err);
      toast.error("Failed to save report");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.delete(`/reports/${id}`);

      if (res.data.success) {
        fetchReports();
        setError("");
        toast.success("Report deleted successfully");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error deleting report";
      setError(errorMsg);
      console.error(err);
      toast.error("Failed to delete report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (id, fileName) => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${id}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      toast.success("Report downloaded successfully");
    } catch (err) {
      setError("Error downloading report");
      console.error(err);
      toast.error("Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (report) => {
    try {
      const res = await api.get(`/reports/${report._id}`);
      if (res.data.success) {
        setSelectedReport(res.data.data);
        setViewModal(true);
      }
    } catch (err) {
      setError("Error fetching report details");
      console.error(err);
      toast.error("Failed to fetch report details");
    }
  };

  const handleEditReport = (report) => {
    setFormData({
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
    });
    setCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      type: "",
      period: "",
      customStartDate: "",
      customEndDate: "",
      description: "",
      file: null,
      status: "published",
    });
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = filterPeriod === "all" || report.period === filterPeriod;
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    return matchesSearch && matchesPeriod && matchesStatus;
  });

  const getReportsByCategory = (categoryId) => {
    return filteredReports.filter((report) => report.category === categoryId);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const getTypeIcon = (type) => {
    const typeMap = {
      pdf: FaFilePdf,
      excel: FaFileExcel,
      word: FaFileWord,
      zip: FaFileArchive,
      image: FaImage,
    };
    return typeMap[type] || FaFileAlt;
  };

  const getTypeColor = (type) => {
    const colorMap = {
      pdf: "text-red-600",
      excel: "text-green-600",
      word: "text-blue-600",
      zip: "text-gray-600",
      image: "text-purple-600",
    };
    return colorMap[type] || "text-gray-600";
  };

  const getStatusBadge = (status) => {
    if (status === "published") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
          <FaCheckCircle className="mr-1" />
          Published
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        <FaClock className="mr-1" />
        Draft
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Error Alert */}
        {/* {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-800">
              <FaTimes />
            </button>
          </div>
        )} */}

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <FaFileAlt className="mr-3 text-blue-600" />
              Reports Manager
            </h1>
            <p className="text-gray-600">Manage and organize all hospital reports and documents</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setCreateModal(true);
            }}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FaPlus className="mr-2" />
            Add New Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Reports</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaFileAlt className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Published</p>
                <h3 className="text-2xl font-bold text-green-600">{stats.published}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Drafts</p>
                <h3 className="text-2xl font-bold text-gray-600">{stats.draft}</h3>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                <FaClock className="text-xl text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">This Month</p>
                <h3 className="text-2xl font-bold text-purple-600">{stats.thisMonth}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <FaCalendarAlt className="text-xl text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Periods</option>
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reports by Category */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading reports...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryReports = getReportsByCategory(category.id);

              return (
                <div
                  key={category.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <FaFileAlt className="text-xl text-blue-600 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {categoryReports.length}
                      </span>
                    </div>
                    {expandedCategories[category.id] ? (
                      <FaChevronUp className="text-gray-400" />
                    ) : (
                      <FaChevronDown className="text-gray-400" />
                    )}
                  </button>

                  {/* Category Content */}
                  {expandedCategories[category.id] && (
                    <div className="border-t border-gray-100">
                      {categoryReports.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <FaFileAlt className="text-4xl text-gray-300 mx-auto mb-2" />
                          <p>No reports in this category</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                  Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                  Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                  Period
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                  Uploaded On
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                  Views
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {categoryReports.map((report) => {
                                const TypeIcon = getTypeIcon(report.type);
                                const typeColor = getTypeColor(report.type);

                                return (
                                  <tr key={report._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                      <div>
                                        <p className="font-semibold text-gray-900">
                                          {report.title}
                                        </p>
                                        {report.description && (
                                          <p className="text-sm text-gray-500 mt-1">
                                            {report.description}
                                          </p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center">
                                        <TypeIcon className={`mr-2 ${typeColor}`} />
                                        <span className="text-sm font-medium text-gray-700">
                                          {report.type.toUpperCase()}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm text-gray-700">
                                        {report.period}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm text-gray-700">
                                        {new Date(report.createdAt).toLocaleDateString()}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      {getStatusBadge(report.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm text-gray-700">{report.views}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => handleViewReport(report)}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="View"
                                        >
                                          <FaEye />
                                        </button>
                                        <button
                                          onClick={() => handleDownloadReport(report._id, report.fileName)}
                                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                          title="Download"
                                        >
                                          <FaDownload />
                                        </button>
                                        <button
                                          onClick={() => handleEditReport(report)}
                                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                          title="Edit"
                                        >
                                          <FaEdit />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteReport(report._id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Delete"
                                        >
                                          <FaTrash />
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

        {/* Create Report Modal */}
        {createModal && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add New Report</h2>
                <button
                  onClick={() => setCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Quarterly Revenue 2025 Q2"
                  />
                </div>

                {/* Category & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Auto-detect</option>
                      {reportTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reporting Period *
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Period</option>
                    {periods.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Date Range */}
                {formData.period === "Custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.customStartDate}
                        onChange={(e) => setFormData({ ...formData, customStartDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.customEndDate}
                        onChange={(e) => setFormData({ ...formData, customEndDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Brief description of the report..."
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File *
                  </label>
                  <label className="flex flex-col items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                    <FaUpload className="text-4xl text-gray-400 mb-3" />
                    <span className="text-gray-600 mb-1">Click to upload or drag and drop</span>
                    <span className="text-sm text-gray-500">PDF, Excel, Word, ZIP, Images</span>
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.docx,.doc,.zip,.csv,.jpeg,.jpg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.file && (
                    <p className="text-sm text-green-600 mt-2 flex items-center">
                      <FaCheckCircle className="mr-2" />
                      {formData.file.name}
                    </p>
                  )}
                </div>

                {/* Publish Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="published"
                        checked={formData.status === "published"}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Published</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="draft"
                        checked={formData.status === "draft"}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Draft</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setCreateModal(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateReport}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FaSave className="mr-2" />
                  Save Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
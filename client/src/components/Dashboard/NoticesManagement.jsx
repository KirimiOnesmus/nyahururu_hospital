import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaBullhorn,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaSave,
  FaCopy,
  FaBell,
  FaFileDownload,
  FaCheckCircle,
  FaUsers,
  FaFileAlt,
  FaPaperclip,
  FaChevronDown,
  FaExclamationCircle,
} from "react-icons/fa";
import api from "../../api/axios";
import {toast} from "react-toastify";

const NoticesManagement = () => {
const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAudience, setFilterAudience] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [createModal, setCreateModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedNotices, setSelectedNotices] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    audience: "",
    content: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    visible: true,
    sendNotification: false,
    attachments: [],
  });

  const categories = [
    "General",
    "Emergency",
    "Event",
    "System Update",
    "Policy",
    "Maintenance",
    "Health Advisory",
  ];

  const audiences = [
    "All",
    "Staff",
    "Patients",
    "Doctors",
    "Nurses",
    "Public",
    "Specific Department",
  ];

  // Fetch all notices
  useEffect(() => {
    fetchNotices();
  }, []);


  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/notices");
      setNotices(response.data); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch notices");
      console.error("Error fetching notices:", err);
      toast.error("Error fetching notices");
    } finally {
      setLoading(false);
    }
  };

  
  const getStats = async () => {
    try {
      const response = await api.get("/notices/stats");
      return response.data;
    } catch (err) {
      console.error("Error fetching stats:", err);
      return null;
    }
  };

  const stats = {
    total: notices.length,
    active: notices.filter((n) => n.status === "active").length,
    scheduled: notices.filter((n) => n.status === "scheduled").length,
    expired: notices.filter((n) => n.status === "expired").length,
  };

  const filteredNotices = notices
    .filter((notice) => {
      const matchesSearch =
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAudience = filterAudience === "all" || notice.audience === filterAudience;
      const matchesCategory = filterCategory === "all" || notice.category === filterCategory;
      const matchesStatus = filterStatus === "all" || notice.status === filterStatus;
      return matchesSearch && matchesAudience && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "alphabetical") return a.title.localeCompare(b.title);
      if (sortBy === "upcoming") return new Date(a.startDate) - new Date(b.startDate);
      return 0;
    });

  const getStatusBadge = (status) => {
    const config = {
      active: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: FaCheckCircle },
      scheduled: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: FaClock },
      expired: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", icon: FaClock },
      hidden: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: FaEyeSlash },
    };
    const statusConfig = config[status] || config.active;
    const Icon = statusConfig.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
        <Icon className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      Emergency: "text-red-600 bg-red-50",
      Event: "text-purple-600 bg-purple-50",
      Maintenance: "text-orange-600 bg-orange-50",
      Policy: "text-blue-600 bg-blue-50",
      General: "text-gray-600 bg-gray-50",
    };
    return colors[category] || colors.General;
  };

  const handleCreateNotice = async () => {
    setError(null);
    if (!formData.title || !formData.category || !formData.audience || 
        !formData.content || !formData.startDate) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        audience: formData.audience,
        content: formData.content,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        visible: formData.visible,
        sendNotification: formData.sendNotification,
      };

      if (formData.id) {
        // Update existing
        await api.put(`/notices/${formData.id}`, payload);
        setSuccessMessage("Notice updated successfully");
        toast.success("Notice updated successfully");
      } else {
        // Create new
        await api.post("/notices", payload);
        setSuccessMessage("Notice created successfully");
        toast.success("Notice created successfully");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      setCreateModal(false);
      setFormData({
        title: "",
        category: "",
        audience: "",
        content: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        visible: true,
        sendNotification: false,
        attachments: [],
      });
      fetchNotices();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to save notice";
      setError(errorMsg);
      console.error("Error saving notice:", err);
      toast.error( "Failed to save notice");
    }
  };


  const handleDeleteNotice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      setSuccessMessage("Notice deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchNotices();
      toast.success("Notice deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete notice");
      console.error("Error deleting notice:", err);
      toast.error("Failed to delete notice");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedNotices.length} notice(s)?`)) return;
    try {
      await api.post("/notices/bulk/delete", { ids: selectedNotices });
      setSuccessMessage(`${selectedNotices.length} notice(s) deleted successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);
      setSelectedNotices([]);
      fetchNotices();
      toast.success(`${selectedNotices.length} notice(s) deleted successfully`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete notices");
      console.error("Error deleting notices:", err);
      toast.error("Failed to delete notices");
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      await api.patch(`/notices/${id}/toggle-visibility`, {});
      setSuccessMessage("Notice visibility updated");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchNotices();
      toast.success("Notice visibility updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle visibility");
      console.error("Error toggling visibility:", err);
      toast.error("Failed to toggle visibility");
    }
  };

  const handleDuplicate = async (notice) => {
    try {
      await api.post(`/notices/${notice.id}/duplicate`, {});
      setSuccessMessage("Notice duplicated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchNotices();
      toast.success("Notice duplicated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to duplicate notice");
      console.error("Error duplicating notice:", err);
      toast.error("Failed to duplicate notice");
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/notices");
      const data = response.data;
      
      const csv = [
        ["Title", "Category", "Audience", "Status", "Start Date", "End Date", "Created By"],
        ...data.map(n => [
          n.title,
          n.category,
          n.audience,
          n.status,
          n.startDate,
          n.endDate,
          n.createdBy
        ])
      ].map(row => row.map(cell => `"${cell || ''}"`).join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "notices.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to export notices");
      console.error("Error exporting notices:", err);
      toast.error("Failed to export notices");
    }
  };

 
  const handleBulkAction = async (action) => {
    if (action === "delete") {
      await handleBulkDelete();
    } else if (action === "hide") {
      
      try {
        for (const id of selectedNotices) {
          await api.patch(`/notices/${id}/toggle-visibility`, {});
        }
        setSuccessMessage("Notices visibility updated");
        setTimeout(() => setSuccessMessage(""), 3000);
        setSelectedNotices([]);
        fetchNotices();
        toast.success("Notices visibility updated");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to update visibility");
        toast.error("Failed to update visibility");
      }
    } else if (action === "category") {
      
      alert("Category change feature - implement as needed");

    }
  };

  const toggleSelection = (id) => {
    setSelectedNotices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Error & Success Messages */}
        {/* {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <span className="text-red-800">{error}</span>
            <button onClick={() => setError(null)} className="text-red-600">
              <FaTimes />
            </button>
          </div>
        )} */}
        
        {/* {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <span className="text-green-800">{successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="text-green-600">
              <FaTimes />
            </button>
          </div>
        )} */}
        
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <FaBullhorn className="mr-3 text-blue-600" />
              Notices & Announcements
            </h1>
            <p className="text-gray-600">Manage public notices and important announcements</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaFileDownload className="mr-2" />
              Export
            </button>
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FaPlus className="mr-2" />
              Create New Notice
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Notices</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaBullhorn className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active</p>
                <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Scheduled</p>
                <h3 className="text-2xl font-bold text-blue-600">{stats.scheduled}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaClock className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Expired</p>
                <h3 className="text-2xl font-bold text-gray-600">{stats.expired}</h3>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                <FaCalendarAlt className="text-xl text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notices by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={filterAudience}
                  onChange={(e) => setFilterAudience(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Audiences</option>
                  {audiences.map((aud) => (
                    <option key={aud} value={aud}>
                      {aud}
                    </option>
                  ))}
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                  <option value="hidden">Hidden</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="upcoming">Upcoming First</option>
                </select>
              </div>
            </div>


            {selectedNotices.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedNotices.length} notice(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkAction("hide")}
                    className="px-3 py-1 bg-white text-gray-700 rounded text-sm hover:bg-gray-50"
                  >
                    Hide
                  </button>
                  <button
                    onClick={() => handleBulkAction("category")}
                    className="px-3 py-1 bg-white text-gray-700 rounded text-sm hover:bg-gray-50"
                  >
                    Change Category
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedNotices([])}
                    className="p-1 text-gray-600 hover:text-gray-900"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Notices Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading notices...</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="p-12 text-center">
              <FaBullhorn className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNotices(
                              filteredNotices.map((n) => n.id)
                            );
                          } else {
                            setSelectedNotices([]);
                          }
                        }}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Audience
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Start Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      End Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredNotices.map((notice) => (
                    <tr
                      key={notice.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedNotices.includes(notice.id)}
                          onChange={() => toggleSelection(notice.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {notice.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            By {notice.createdBy}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                            notice.category
                          )}`}
                        >
                          {notice.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-700">
                          <FaUsers className="mr-2 text-gray-400" />
                          {notice.audience}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {notice.startDate}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {notice.endDate || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(notice.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedNotice(notice);
                              setDetailsModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => {
                              setFormData(notice);
                              setCreateModal(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDuplicate(notice)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Duplicate"
                          >
                            <FaCopy />
                          </button>
                          <button
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Send Notification"
                          >
                            <FaBell />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {createModal && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formData.id ? "Edit Notice" : "Create New Notice"}
                </h2>
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
                    Notice Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter notice title"
                  />
                </div>

                {/* Category & Audience */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audience *
                    </label>
                    <select
                      value={formData.audience}
                      onChange={(e) =>
                        setFormData({ ...formData, audience: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Audience</option>
                      {audiences.map((aud) => (
                        <option key={aud} value={aud}>
                          {aud}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="6"
                    placeholder="Enter notice content with details..."
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments (PDFs, Images)
                  </label>
                  <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                    <FaPaperclip className="mr-2 text-gray-400" />
                    <span className="text-gray-600">Click to upload files</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="visible"
                      checked={formData.visible}
                      onChange={(e) =>
                        setFormData({ ...formData, visible: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label
                      htmlFor="visible"
                      className="ml-2 text-sm font-medium text-gray-700"
                    >
                      Make this notice visible immediately
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendNotification"
                      checked={formData.sendNotification}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sendNotification: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label
                      htmlFor="sendNotification"
                      className="ml-2 text-sm font-medium text-gray-700"
                    >
                      Send notification to audience
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setCreateModal(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNotice}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaSave className="mr-2" />
                  {formData.id ? "Update Notice" : "Create Notice"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {detailsModal && selectedNotice && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedNotice.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Created by {selectedNotice.createdBy} on{" "}
                    {selectedNotice.createdAt}
                  </p>
                </div>
                <button
                  onClick={() => setDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Category */}
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedNotice.status)}
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${getCategoryColor(
                      selectedNotice.category
                    )}`}
                  >
                    {selectedNotice.category}
                  </span>
                </div>

                {/* Audience */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FaUsers className="mr-2" />
                    Target Audience
                  </h3>
                  <p className="text-gray-900">{selectedNotice.audience}</p>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FaFileAlt className="mr-2" />
                    Notice Content
                  </h3>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedNotice.content}
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      Start Date
                    </h3>
                    <p className="text-gray-900">{selectedNotice.startDate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      End Date
                    </h3>
                    <p className="text-gray-900">
                      {selectedNotice.endDate || "No expiry"}
                    </p>
                  </div>
                </div>

                {/* Attachments */}
                {selectedNotice.attachments &&
                  selectedNotice.attachments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <FaPaperclip className="mr-2" />
                        Attachments
                      </h3>
                      <div className="space-y-2">
                        {selectedNotice.attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm text-gray-700">
                              {file.name}
                            </span>
                            <button className="text-blue-600 hover:text-blue-700 text-sm">
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Change Log */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Activity Log
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-gray-900">Notice created</p>
                        <p className="text-gray-500 text-xs">
                          {selectedNotice.createdAt} by{" "}
                          {selectedNotice.createdBy}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => {
                    setFormData(selectedNotice);
                    setDetailsModal(false);
                    setCreateModal(true);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaEdit className="mr-2" />
                  Edit Notice
                </button>
                <button
                  onClick={() => handleDuplicate(selectedNotice)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FaCopy className="mr-2" />
                  Duplicate
                </button>
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <FaBell className="mr-2" />
                  Send Notification
                </button>
                <button
                  onClick={() => setDetailsModal(false)}
                  className="ml-auto px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

  );
};

export default NoticesManagement;

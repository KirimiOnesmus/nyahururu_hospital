import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  FaSearch,
  FaFilter,
  FaClipboardCheck,
  FaUser,
  FaClock,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaDownload,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");

  // Mock data for demonstration - replace with actual API call
  const mockLogs = [
    {
      _id: "1",
      action: "User Login",
      user: "admin@hospital.com",
      role: "superadmin",
      ipAddress: "192.168.1.100",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: "success",
      details: "User successfully logged into the system",
    },
    {
      _id: "2",
      action: "User Created",
      user: "admin@hospital.com",
      role: "superadmin",
      ipAddress: "192.168.1.100",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      status: "success",
      details: "Created new user: doctor@hospital.com",
    },
    {
      _id: "3",
      action: "Data Updated",
      user: "doctor@hospital.com",
      role: "doctor",
      ipAddress: "192.168.1.105",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      status: "success",
      details: "Updated patient record #12345",
    },
    {
      _id: "4",
      action: "Failed Login Attempt",
      user: "unknown@hospital.com",
      role: "unknown",
      ipAddress: "192.168.1.200",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      status: "failed",
      details: "Invalid credentials provided",
    },
    {
      _id: "5",
      action: "Data Deleted",
      user: "admin@hospital.com",
      role: "superadmin",
      ipAddress: "192.168.1.100",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      status: "success",
      details: "Deleted expired appointment record",
    },
    {
      _id: "6",
      action: "Permission Denied",
      user: "staff@hospital.com",
      role: "staff",
      ipAddress: "192.168.1.110",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
      status: "failed",
      details: "Attempted to access restricted resource",
    },
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Replace with actual API endpoint when backend is ready
      // const res = await api.get("/audit-logs");
      // setLogs(res.data);
      // setFiltered(res.data);
      
      // Using mock data for now
      setLogs(mockLogs);
      setFiltered(mockLogs);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      // Fallback to mock data on error
      setLogs(mockLogs);
      setFiltered(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let filteredData = logs;

    // Filter by search term
    if (search) {
      filteredData = filteredData.filter(
        (log) =>
          log.action?.toLowerCase().includes(search.toLowerCase()) ||
          log.user?.toLowerCase().includes(search.toLowerCase()) ||
          log.details?.toLowerCase().includes(search.toLowerCase()) ||
          log.ipAddress?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by type/status
    if (filterType !== "all") {
      filteredData = filteredData.filter((log) => log.status === filterType);
    }

    // Filter by date (simplified - can be enhanced)
    if (filterDate !== "all") {
      const now = new Date();
      filteredData = filteredData.filter((log) => {
        const logDate = new Date(log.timestamp);
        const diffHours = (now - logDate) / (1000 * 60 * 60);
        
        if (filterDate === "today") return diffHours < 24;
        if (filterDate === "week") return diffHours < 168;
        if (filterDate === "month") return diffHours < 720;
        return true;
      });
    }

    setFiltered(filteredData);
  }, [search, filterType, filterDate, logs]);

  const openModal = (log) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const getStatusIcon = (status) => {
    if (status === "success") {
      return <FaCheckCircle className="text-green-600" />;
    } else if (status === "failed") {
      return <FaExclamationTriangle className="text-red-600" />;
    }
    return <FaInfoCircle className="text-blue-600" />;
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold";
    if (status === "success") {
      return `${baseClasses} bg-green-100 text-green-700`;
    } else if (status === "failed") {
      return `${baseClasses} bg-red-100 text-red-700`;
    }
    return `${baseClasses} bg-blue-100 text-blue-700`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats
  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.status === "success").length,
    failed: logs.filter((l) => l.status === "failed").length,
    today: logs.filter((l) => {
      const logDate = new Date(l.timestamp);
      const diffHours = (new Date() - logDate) / (1000 * 60 * 60);
      return diffHours < 24;
    }).length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-2">
          <FaClipboardCheck className="mr-3 text-blue-600" />
          Audit Logs
        </h1>
        <p className="text-gray-600">
          Track and monitor all system activities and user actions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Logs</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <FaClipboardCheck className="text-blue-600 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Successful</p>
            <h3 className="text-2xl font-bold text-green-600">{stats.success}</h3>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <FaCheckCircle className="text-green-600 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Failed</p>
            <h3 className="text-2xl font-bold text-red-600">{stats.failed}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
            <FaExclamationTriangle className="text-red-600 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Today</p>
            <h3 className="text-2xl font-bold text-purple-600">{stats.today}</h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
            <FaClock className="text-purple-600 text-xl" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, user, IP address, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading audit logs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FaClipboardCheck className="text-gray-300 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No audit logs found</p>
            <p className="text-gray-400 text-sm mt-2">
              {search || filterType !== "all" || filterDate !== "all"
                ? "Try adjusting your filters"
                : "Audit logs will appear here as system activities occur"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(log.status)}
                        <span className="ml-2 font-medium text-gray-900">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaUser className="text-gray-400 mr-2" />
                        <span className="text-gray-700">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                        {log.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 font-mono text-sm">
                        {log.ipAddress}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(log.status)}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-600">
                        <FaClock className="mr-2 text-gray-400" />
                        <span className="text-sm">{formatDate(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(log)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="View Details"
                      >
                        <FaInfoCircle className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {modalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  {getStatusIcon(selectedLog.status)}
                  <span className="ml-2">Audit Log Details</span>
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Action
                </label>
                <p className="mt-1 text-gray-900 font-medium">{selectedLog.action}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  User
                </label>
                <p className="mt-1 text-gray-900">{selectedLog.user}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Role
                </label>
                <p className="mt-1">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium capitalize">
                    {selectedLog.role}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  IP Address
                </label>
                <p className="mt-1 text-gray-900 font-mono">{selectedLog.ipAddress}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </label>
                <p className="mt-1">
                  <span className={getStatusBadge(selectedLog.status)}>
                    {selectedLog.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Timestamp
                </label>
                <p className="mt-1 text-gray-900 flex items-center">
                  <FaCalendarAlt className="mr-2 text-gray-400" />
                  {formatDate(selectedLog.timestamp)}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Details
                </label>
                <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedLog.details}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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

export default AuditLogsPage;


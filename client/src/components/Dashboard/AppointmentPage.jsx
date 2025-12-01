import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  FaSearch,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaClock,
  FaFilter,
  FaUserMd,
  FaUser,
} from "react-icons/fa";
import{toast} from 'react-toastify';

const AppointmentPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/appointments");
      setAppointments(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments based on search and status
  useEffect(() => {
    let filteredData = appointments.filter(
      (appt) =>
        appt.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        appt.doctorId?.specialty?.toLowerCase().includes(search.toLowerCase()) ||
        appt.service?.toLowerCase().includes(search.toLowerCase())
    );

    if (filterStatus !== "all") {
      filteredData = filteredData.filter(
        (appt) => appt.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    setFiltered(filteredData);
  }, [search, filterStatus, appointments]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      fetchAppointments();
      toast.success("Appointment status updated");
    } catch (err) {
      console.log(err.response?.data?.message || "Error updating status");
      toast.error("Failed to update appointment status");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      confirmed: {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-200",
        icon: FaCheckCircle,
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
        icon: FaTimesCircle,
      },
      completed: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: FaCheckCircle,
      },
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-200",
        icon: FaClock,
      },
    };

    const statusLower = status.toLowerCase();
    const statusConfig = statusMap[statusLower] || statusMap.pending;
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
      >
        <Icon className="mr-1" />
        {status}
      </span>
    );
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  // Calculate statistics
  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status.toLowerCase() === "confirmed").length,
    pending: appointments.filter((a) => a.status.toLowerCase() === "pending").length,
    cancelled: appointments.filter((a) => a.status.toLowerCase() === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Appointment Management
          </h1>
          <p className="text-gray-600">
            View and manage all patient appointments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Appointments</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaCalendarAlt className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Confirmed</p>
                <h3 className="text-2xl font-bold text-green-600">{stats.confirmed}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending</p>
                <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <FaClock className="text-xl text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Cancelled</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.cancelled}</h3>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <FaTimesCircle className="text-xl text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name or service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading appointments...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FaCalendarAlt className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No appointments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Service/Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((appt) => (
                    <tr key={appt._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {appt.patientName || "—"}
                            </p>
                            <p className="text-sm text-gray-500">{appt.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FaUserMd className="text-gray-400 mr-2" />
                          <span className="text-gray-900">
                            {appt.doctorId?.specialty || appt.service || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">
                            {appt.appointmentDate || appt.date
                              ? new Date(appt.appointmentDate || appt.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "—"}
                          </span>
                          <span className="text-sm text-gray-500">
                            {appt.time || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(appt.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(appt)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          {appt.status.toLowerCase() !== "confirmed" && (
                            <button
                              onClick={() => updateStatus(appt._id, "Confirmed")}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Confirm Appointment"
                            >
                              <FaCheckCircle />
                            </button>
                          )}
                          {appt.status.toLowerCase() !== "cancelled" && (
                            <button
                              onClick={() => {
                                if (window.confirm("Cancel this appointment?")) {
                                  updateStatus(appt._id, "Cancelled");
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel Appointment"
                            >
                              <FaTimesCircle />
                            </button>
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
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Appointment Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaTimesCircle className="text-gray-500 text-xl" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Patient Name</p>
                    <p className="font-semibold text-gray-900">
                      {selectedAppointment.patientName || selectedAppointment.name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-gray-900">{selectedAppointment.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="text-gray-900">{selectedAppointment.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Service/Doctor</p>
                    <p className="text-gray-900">
                      {selectedAppointment.doctorId?.specialty ||
                        selectedAppointment.service ||
                        "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="text-gray-900">
                      {selectedAppointment.appointmentDate || selectedAppointment.date
                        ? new Date(
                            selectedAppointment.appointmentDate || selectedAppointment.date
                          ).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Time</p>
                    <p className="text-gray-900">{selectedAppointment.time || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <div>{getStatusBadge(selectedAppointment.status)}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                {selectedAppointment.status.toLowerCase() !== "confirmed" && (
                  <button
                    onClick={() => {
                      updateStatus(selectedAppointment._id, "Confirmed");
                      setShowDetailsModal(false);
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaCheckCircle className="mr-2" />
                    Confirm
                  </button>
                )}
                {selectedAppointment.status.toLowerCase() !== "cancelled" && (
                  <button
                    onClick={() => {
                      if (window.confirm("Cancel this appointment?")) {
                        updateStatus(selectedAppointment._id, "Cancelled");
                        setShowDetailsModal(false);
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTimesCircle className="mr-2" />
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentPage;
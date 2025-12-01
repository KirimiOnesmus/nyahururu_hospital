import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  FaAmbulance,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaExclamationTriangle,
  FaTools,
  FaUserMd,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaCalendarAlt,
  FaChevronDown,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-toastify";

const LogisticsPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchVehicle, setSearchVehicle] = useState("");
  const [searchBooking, setSearchBooking] = useState("");
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("vehicles");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);

  const [vehicleForm, setVehicleForm] = useState({
    plate: "",
    type: "",
    status: "Available",
    driver: "",
    lastService: "",
    nextService: "",
    mileage: "",
    color: "",
    make: "",
    model: "",
    year: "",
  });

  const [bookingForm, setBookingForm] = useState({
    status: "Pending",
  });

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      setError(null);
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error fetching vehicles";
      console.error("Fetch vehicles error:", errorMsg);
      setError(errorMsg);
      setVehicles([]);
      toast.error("Error fetching vehicles");
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Fetch ambulance bookings
  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      setError(null);
      const res = await api.get("/ambulance-bookings");
      setBookings(res.data);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error fetching bookings";
      console.error("Fetch bookings error:", errorMsg);
      setError(errorMsg);
      setBookings([]);
      toast.error("Error fetching bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchVehicles();
    fetchBookings();
  }, []);

  // Filter vehicles
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plate?.toLowerCase().includes(searchVehicle.toLowerCase()) ||
      v.type?.toLowerCase().includes(searchVehicle.toLowerCase()) ||
      v.driver?.toLowerCase().includes(searchVehicle.toLowerCase())
  );

  // Filter bookings
  const filteredBookings = bookings.filter(
    (b) =>
      b.patientName?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.status?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.emergencyLevel?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.phone?.includes(searchBooking)
  );
  // Calculate stats
  const stats = {
    totalVehicles: vehicles.length,
    available: vehicles.filter((v) => v.status === "Available").length,
    inService: vehicles.filter((v) => v.status === "In Service").length,
    maintenanceDue: vehicles.filter(
      (v) => v.nextService && new Date(v.nextService) <= new Date()
    ).length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(
      (b) => b.status === "Pending" || b.status === "Waiting"
    ).length,
    assignedBookings: bookings.filter((b) => b.status === "Assigned").length,
    criticalBookings: bookings.filter((b) => b.emergencyLevel === "critical")
      .length,
  };

  // Vehicle status badge
  const getVehicleStatusBadge = (status) => {
    const config = {
      Available: {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-200",
        icon: FaCheckCircle,
      },
      "In Service": {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: FaTruck,
      },
      Maintenance: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-200",
        icon: FaTools,
      },
    };
    const statusConfig = config[status] || config.Available;
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

  // Booking status badge
  const getBookingStatusBadge = (status) => {
    const config = {
      Pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-200",
      },
      Waiting: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        border: "border-orange-200",
      },
      Assigned: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-200",
      },
      "In Transit": {
        bg: "bg-purple-100",
        text: "text-purple-700",
        border: "border-purple-200",
      },
      Arrived: {
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        border: "border-indigo-200",
      },
      Completed: {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-200",
      },
      Cancelled: {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
      },
    };
    const statusConfig = config[status] || config.Pending;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
      >
        {status}
      </span>
    );
  };

  // Emergency level badge
  const getEmergencyBadge = (level) => {
    const config = {
      critical: {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
        label: "Critical",
      },
      urgent: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        border: "border-orange-200",
        label: "Urgent",
      },
      standard: {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-200",
        label: "Standard",
      },
    };
    const config_item = config[level] || config.standard;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config_item.bg} ${config_item.text} ${config_item.border}`}
      >
        {config_item.label}
      </span>
    );
  };

  // Open vehicle modal
  const openVehicleModal = (v = null) => {
    setEditingVehicle(v);
    setError(null);
    setSuccess(null);
    if (v) {
      setVehicleForm({
        plate: v.plate || "",
        type: v.type || "",
        status: v.status || "Available",
        driver: v.driver || "",
        lastService: v.lastService ? v.lastService.split("T")[0] : "",
        nextService: v.nextService ? v.nextService.split("T")[0] : "",
        mileage: v.mileage || "",
        color: v.color || "",
        make: v.make || "",
        model: v.model || "",
        year: v.year || "",
      });
    } else {
      setVehicleForm({
        plate: "",
        type: "",
        status: "Available",
        driver: "",
        lastService: "",
        nextService: "",
        mileage: "",
        color: "",
        make: "",
        model: "",
        year: "",
      });
    }
    setVehicleModalOpen(true);
  };

  // Open booking modal
  const openBookingModal = (b = null) => {
    setEditingBooking(b);
    setError(null);
    setSuccess(null);
    if (b) {
      setBookingForm({
        status: b.status || "Pending",
      });
    } else {
      setBookingForm({
        status: "Pending",
      });
    }
    setBookingModalOpen(true);
  };

  // Handle vehicle form submit
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehicleForm.plate || !vehicleForm.type) {
      setError("Plate number and vehicle type are required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle._id}`, vehicleForm);
        setSuccess("Vehicle updated successfully!");
        toast.success("Vehicle updated successfully!");
      } else {
        await api.post("/vehicles", vehicleForm);
        setSuccess("Vehicle added successfully!");
        toast.success("Vehicle added successfully!");
      }
      await fetchVehicles();
      setVehicleModalOpen(false);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error saving vehicle";
      console.error("Vehicle submit error:", errorMsg);
      setError(errorMsg);
      toast.error("Error saving vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle booking status update
  const handleBookingStatusUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!editingBooking) return;

    try {
      setSubmitting(true);
      await api.put(`/ambulance-bookings/${editingBooking._id}/status`, {
        status: bookingForm.status,
      });
      setSuccess("Booking status updated successfully!");
      toast.success("Booking status updated successfully!");
      await fetchBookings();
      setBookingModalOpen(false);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error updating booking";
      console.error("Booking update error:", errorMsg);
      setError(errorMsg);
      toast.error("Error updating booking");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?"))
      return;
    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/vehicles/${id}`);
      setSuccess("Vehicle deleted successfully!");
      toast.success("Vehicle deleted successfully!");
      await fetchVehicles();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error deleting vehicle";
      console.error("Delete vehicle error:", errorMsg);
      setError(errorMsg);
      toast.error("Error deleting vehicle");
    }
  };

  // Cancel booking
  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;
    try {
      setError(null);
      setSuccess(null);
      await api.put(`/ambulance-bookings/${id}/cancel`, {
        reason: "Cancelled by admin",
      });
      setSuccess("Booking cancelled successfully!");
      toast.success("Booking cancelled successfully!");
      await fetchBookings();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Error cancelling booking";
      console.error("Cancel booking error:", errorMsg);
      setError(errorMsg);
      toast.error("Error cancelling booking");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Logistics & Fleet Management
          </h1>
          <p className="text-gray-600">
            Manage vehicles, ambulances, and transport bookings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
              <FaAmbulance className="text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Total Vehicles</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats.totalVehicles}
            </h3>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mb-2">
              <FaCheckCircle className="text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Available</p>
            <h3 className="text-2xl font-bold text-green-600">
              {stats.available}
            </h3>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
              <FaTruck className="text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">In Service</p>
            <h3 className="text-2xl font-bold text-blue-600">
              {stats.inService}
            </h3>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center mb-2">
              <FaTools className="text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Maintenance</p>
            <h3 className="text-2xl font-bold text-orange-600">
              {stats.maintenanceDue}
            </h3>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mb-2">
              <FaCalendarAlt className="text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Total Bookings</p>
            <h3 className="text-2xl font-bold text-purple-600">
              {stats.totalBookings}
            </h3>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center mb-2">
              <FaClock className="text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <h3 className="text-2xl font-bold text-yellow-600">
              {stats.pendingBookings}
            </h3>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mb-2">
              <FaCheckCircle className="text-indigo-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Assigned</p>
            <h3 className="text-2xl font-bold text-indigo-600">
              {stats.assignedBookings}
            </h3>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mb-2">
              <FaExclamationTriangle className="text-red-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Critical</p>
            <h3 className="text-2xl font-bold text-red-600">
              {stats.criticalBookings}
            </h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm mb-6">
          <div className="border-b border-gray-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab("vehicles")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "vehicles"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaAmbulance className="inline mr-2" />
                Vehicles Fleet
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "bookings"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaCalendarAlt className="inline mr-2" />
                Ambulance Bookings
              </button>
            </div>
          </div>

          {/* Vehicles Tab */}
          {activeTab === "vehicles" && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vehicles by plate, type, or driver..."
                    value={searchVehicle}
                    onChange={(e) => setSearchVehicle(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => openVehicleModal()}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <FaPlus className="mr-2" /> Add Vehicle
                </button>
              </div>

              <div className="overflow-x-auto">
                {loadingVehicles ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading vehicles...</p>
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <div className="p-12 text-center">
                    <FaAmbulance className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No vehicles found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Plate Number
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Driver
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Next Service
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredVehicles.map((v) => (
                        <tr
                          key={v._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {v.plate}
                          </td>
                          <td className="px-6 py-4 text-gray-700">{v.type}</td>
                          <td className="px-6 py-4">
                            {getVehicleStatusBadge(v.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-gray-700">
                              <FaUserMd className="text-gray-400 mr-2" />
                              {v.driver || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {v.nextService &&
                            new Date(v.nextService) <= new Date() ? (
                              <span className="text-red-600 font-semibold">
                                {new Date(v.nextService).toLocaleDateString()}
                              </span>
                            ) : v.nextService ? (
                              <span className="text-gray-700">
                                {new Date(v.nextService).toLocaleDateString()}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openVehicleModal(v)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit Vehicle"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteVehicle(v._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Vehicle"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookings by patient, status, or emergency level..."
                    value={searchBooking}
                    onChange={(e) => setSearchBooking(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {loadingBookings ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading bookings...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="p-12 text-center">
                    <FaCalendarAlt className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.map((b) => (
                      <div
                        key={b._id}
                        className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow "
                      >
                        {/* Main Row */}
                        <div
                          className="p-4 flex items-center justify-between  cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            setExpandedBooking(
                              expandedBooking === b._id ? null : b._id
                            )
                          }
                        >
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
                            {/* Patient Info */}
                            <div>
                              <p className="font-semibold text-gray-900">
                                {b.patientName}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {b._id?.slice(-6)}
                              </p>
                            </div>

                            <div>{getEmergencyBadge(b.emergencyLevel)}</div>

                            {/* Vehicle/Driver */}
                            <div className="text-sm">
                              {b.vehicleId ? (
                                <>
                                  <p className="text-gray-900 font-medium">
                                    {b.vehicleId?.plate || "Not set"}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {b.vehicleId?.driver || "—"}
                                  </p>
                                </>
                              ) : (
                                <span className="text-gray-500 text-xs">
                                  Not assigned
                                </span>
                              )}
                            </div>

                            {/* Status */}
                            <div>{getBookingStatusBadge(b.status)}</div>

                            {/* Contact */}
                            <div className="flex items-center text-gray-700 text-sm">
                              <FaPhone className="text-gray-400 mr-2" />
                              <span className="text-xs">{b.phone}</span>
                            </div>
                          </div>

                          {/* Expand Button */}
                          <button className="ml-4 p-2 text-gray-400 hover:text-gray-600">
                            <FaChevronDown
                              className={`transition-transform ${
                                expandedBooking === b._id ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Expanded Details */}
                        {expandedBooking === b._id && (
                          <div className="border-t border-gray-100 bg-gray-50 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                              <div className="flex items-start flex-col text-sm">
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  Location Information
                                </h4>
                                <div className="flex items-center text-gray-700 mb-1">
                                  <FaMapMarkerAlt className="text-blue-600 mr-1 text-xs" />
                                  <p>
                                    From:{" "}
                                    <span className="text-xs truncate">
                                      {b.currentLocation || "—"}
                                    </span>
                                  </p>
                                </div>
                                <div className="flex items-center text-gray-700">
                                  <FaMapMarkerAlt className="text-green-600 mr-1 text-xs" />
                                  <p>
                                    To:{" "}
                                    <span className="text-xs truncate">
                                      {b.destinationHospital || "—"}
                                    </span>{" "}
                                  </p>
                                </div>
                              </div>
                              {/* Medical Information */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  Medical Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <p className="text-gray-600">
                                      Medical Condition:
                                    </p>
                                    <p className="text-gray-900">
                                      {b.medicalCondition}
                                    </p>
                                  </div>
                                  {b.additionalNotes && (
                                    <div>
                                      <p className="text-gray-600">
                                        Additional Notes:
                                      </p>
                                      <p className="text-gray-900">
                                        {b.additionalNotes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Booking Information */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  Booking Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <p className="text-gray-600">Booking ID:</p>
                                    <p className="text-gray-900 font-mono">
                                      {b._id}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Booked On:</p>
                                    <p className="text-gray-900">
                                      {new Date(b.bookingDate).toLocaleString()}
                                    </p>
                                  </div>
                                  {b.assignedAt && (
                                    <div>
                                      <p className="text-gray-600">
                                        Assigned On:
                                      </p>
                                      <p className="text-gray-900">
                                        {new Date(
                                          b.assignedAt
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => openBookingModal(b)}
                                className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Update Status"
                              >
                                <FaEdit className="mr-2" />
                                Update Status
                              </button>

                              {b.status !== "Completed" &&
                                b.status !== "Cancelled" && (
                                  <button
                                    onClick={() => handleCancelBooking(b._id)}
                                    className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Cancel Booking"
                                  >
                                    <FaTimes className="mr-2" />
                                    Cancel Booking
                                  </button>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Modal */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingVehicle
                  ? "Update vehicle information"
                  : "Register a new vehicle to the fleet"}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plate Number *
                    </label>
                    <input
                      type="text"
                      value={vehicleForm.plate}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          plate: e.target.value,
                        }))
                      }
                      placeholder="e.g., KAA 123X"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type *
                    </label>
                    <select
                      value={vehicleForm.type}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Ambulance">Ambulance</option>
                      <option value="Service Van">Service Van</option>
                      <option value="Delivery Truck">Delivery Truck</option>
                      <option value="Staff Transport">Staff Transport</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driver Name
                    </label>
                    <input
                      type="text"
                      value={vehicleForm.driver}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          driver: e.target.value,
                        }))
                      }
                      placeholder="e.g., John Kamau"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={vehicleForm.status}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Available">Available</option>
                      <option value="In Use">In Use</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Service Date
                    </label>
                    <input
                      type="date"
                      value={vehicleForm.lastService}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          lastService: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next Service Due
                    </label>
                    <input
                      type="date"
                      value={vehicleForm.nextService}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          nextService: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVehicleSubmit}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaSave className="mr-2" />
                  {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                Update Booking Status
              </h2>
              <p className="text-gray-600 mt-1">
                Change the status of this ambulance booking
              </p>
            </div>

            <div className="p-6">
              <form onSubmit={handleBookingStatusUpdate}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Status *
                  </label>
                  <select
                    value={bookingForm.status}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Arrived">Arrived</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Waiting">Waiting</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    <FaSave className="mr-2" />
                    {submitting ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsPage;

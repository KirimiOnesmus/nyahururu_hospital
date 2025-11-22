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
  FaTimes,
  FaSave,
  FaCalendarAlt,
} from "react-icons/fa";

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
  
  const [vehicleForm, setVehicleForm] = useState({
    plate: "",
    type: "",
    status: "Available",
    driver: "",
    lastService: "",
    nextService: "",
  });

  const [bookingForm, setBookingForm] = useState({
    patientName: "",
    age: "",
    pickup: "",
    destination: "",
    emergency: "Non-Critical",
    requestedTime: "",
    assignedVehicle: "",
    driver: "",
    status: "Pending",
  });

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching vehicles");
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await api.get("/bookings");
      setBookings(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchBookings();
  }, []);

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plate?.toLowerCase().includes(searchVehicle.toLowerCase()) ||
      v.type?.toLowerCase().includes(searchVehicle.toLowerCase()) ||
      v.driver?.toLowerCase().includes(searchVehicle.toLowerCase())
  );

  const filteredBookings = bookings.filter(
    (b) =>
      b.patientName?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.driver?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.status?.toLowerCase().includes(searchBooking.toLowerCase())
  );

  const stats = {
    totalVehicles: vehicles.length,
    available: vehicles.filter((v) => v.status === "Available").length,
    inUse: vehicles.filter((v) => v.status === "In Use").length,
    pendingBookings: bookings.filter((b) => b.status === "Pending").length,
    urgentBookings: bookings.filter((b) => b.emergency === "Critical").length,
    maintenanceDue: vehicles.filter(
      (v) => v.nextService && new Date(v.nextService) <= new Date()
    ).length,
  };

  const getVehicleStatusBadge = (status) => {
    const config = {
      Available: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: FaCheckCircle },
      "In Use": { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: FaClock },
      Maintenance: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", icon: FaTools },
    };
    const statusConfig = config[status] || config.Available;
    const Icon = statusConfig.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
        <Icon className="mr-1" />
        {status}
      </span>
    );
  };

  const getBookingStatusBadge = (status) => {
    const config = {
      Pending: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
      Assigned: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
      "En Route": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
      Completed: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    };
    const statusConfig = config[status] || config.Pending;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
        {status}
      </span>
    );
  };

  const openVehicleModal = (v = null) => {
    setEditingVehicle(v);
    setVehicleForm(
      v ? { ...v } : {
        plate: "",
        type: "",
        status: "Available",
        driver: "",
        lastService: "",
        nextService: "",
      }
    );
    setVehicleModalOpen(true);
  };

  const openBookingModal = (b = null) => {
    setEditingBooking(b);
    setBookingForm(
      b ? { ...b } : {
        patientName: "",
        age: "",
        pickup: "",
        destination: "",
        emergency: "Non-Critical",
        requestedTime: "",
        assignedVehicle: "",
        driver: "",
        status: "Pending",
      }
    );
    setBookingModalOpen(true);
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle)
        await api.put(`/vehicles/${editingVehicle._id}`, vehicleForm);
      else await api.post("/vehicles", vehicleForm);
      fetchVehicles();
      setVehicleModalOpen(false);
      alert("Vehicle saved successfully!");
    } catch (err) {
      alert("Error saving vehicle");
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBooking)
        await api.put(`/bookings/${editingBooking._id}`, bookingForm);
      else await api.post("/bookings", bookingForm);
      fetchBookings();
      setBookingModalOpen(false);
      alert("Booking saved successfully!");
    } catch (err) {
      alert("Error saving booking");
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      alert("Error deleting vehicle");
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchBookings();
    } catch (err) {
      alert("Error deleting booking");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Logistics & Fleet Management
          </h1>
          <p className="text-gray-600">Manage vehicles, ambulances, and transport bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaAmbulance className="text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">Total Vehicles</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</h3>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">Available</p>
            <h3 className="text-2xl font-bold text-green-600">{stats.available}</h3>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <FaTruck className="text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">In Use</p>
            <h3 className="text-2xl font-bold text-red-600">{stats.inUse}</h3>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <FaClock className="text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <h3 className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</h3>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">Urgent</p>
            <h3 className="text-2xl font-bold text-red-600">{stats.urgentBookings}</h3>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <FaTools className="text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1">Maintenance</p>
            <h3 className="text-2xl font-bold text-orange-600">{stats.maintenanceDue}</h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
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
                Transport Bookings
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
                          Last Service
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
                        <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900">{v.plate}</td>
                          <td className="px-6 py-4 text-gray-700">{v.type}</td>
                          <td className="px-6 py-4">{getVehicleStatusBadge(v.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-gray-700">
                              <FaUserMd className="text-gray-400 mr-2" />
                              {v.driver || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {v.lastService ? new Date(v.lastService).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4">
                            {v.nextService && new Date(v.nextService) <= new Date() ? (
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
                    placeholder="Search bookings by patient, driver, or status..."
                    value={searchBooking}
                    onChange={(e) => setSearchBooking(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => openBookingModal()}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <FaPlus className="mr-2" /> Add Booking
                </button>
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
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Patient
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Route
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Priority
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Time
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Vehicle/Driver
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
                      {filteredBookings.map((b) => (
                        <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{b.patientName}</p>
                              <p className="text-sm text-gray-500">Age: {b.age || "—"}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-start flex-col text-sm">
                              <div className="flex items-center text-gray-700 mb-1">
                                <FaMapMarkerAlt className="text-blue-600 mr-1" />
                                {b.pickup || "—"}
                              </div>
                              <div className="flex items-center text-gray-700">
                                <FaMapMarkerAlt className="text-green-600 mr-1" />
                                {b.destination || "—"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {b.emergency === "Critical" ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                <FaExclamationTriangle className="mr-1" />
                                Critical
                              </span>
                            ) : (
                              <span className="text-gray-600 text-sm">Non-Critical</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {b.requestedTime
                              ? new Date(b.requestedTime).toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="text-gray-900 font-medium">{b.assignedVehicle || "Not assigned"}</p>
                              <p className="text-gray-500">{b.driver || "—"}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getBookingStatusBadge(b.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openBookingModal(b)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit Booking"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteBooking(b._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Booking"
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
        </div>
      </div>

      {/* Vehicle Modal */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingVehicle ? "Update vehicle information" : "Register a new vehicle to the fleet"}
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
                        setVehicleForm((prev) => ({ ...prev, plate: e.target.value }))
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
                        setVehicleForm((prev) => ({ ...prev, type: e.target.value }))
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
                        setVehicleForm((prev) => ({ ...prev, driver: e.target.value }))
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
                        setVehicleForm((prev) => ({ ...prev, status: e.target.value }))
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
                        setVehicleForm((prev) => ({ ...prev, lastService: e.target.value }))
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
                        setVehicleForm((prev) => ({ ...prev, nextService: e.target.value }))
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBooking ? "Edit Booking" : "New Transport Booking"}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingBooking ? "Update booking details" : "Schedule a new transport booking"}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      value={bookingForm.patientName}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, patientName: e.target.value }))
                      }
                      placeholder="e.g., Jane Doe"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={bookingForm.age}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, age: e.target.value }))
                      }
                      placeholder="Patient age"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Location *
                    </label>
                    <input
                      type="text"
                      value={bookingForm.pickup}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, pickup: e.target.value }))
                      }
                      placeholder="e.g., 123 Main St, Nairobi"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destination *
                    </label>
                    <input
                      type="text"
                      value={bookingForm.destination}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, destination: e.target.value }))
                      }
                      placeholder="e.g., Hospital Main Building"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level *
                    </label>
                    <select
                      value={bookingForm.emergency}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, emergency: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Non-Critical">Non-Critical</option>
                      <option value="Critical">Critical / Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requested Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={bookingForm.requestedTime}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, requestedTime: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Vehicle
                    </label>
                    <select
                      value={bookingForm.assignedVehicle}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, assignedVehicle: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles
                        .filter((v) => v.status === "Available")
                        .map((v) => (
                          <option key={v._id} value={v.plate}>
                            {v.plate} - {v.type}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driver Name
                    </label>
                    <input
                      type="text"
                      value={bookingForm.driver}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, driver: e.target.value }))
                      }
                      placeholder="Driver name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Status
                  </label>
                  <select
                    value={bookingForm.status}
                    onChange={(e) =>
                      setBookingForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="En Route">En Route</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookingSubmit}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaSave className="mr-2" />
                  {editingBooking ? "Update Booking" : "Create Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsPage;
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  FaTint,
  FaUsers,
  FaCalendarCheck,
  FaHeart,
  FaSearch,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaChevronDown,
  FaFilter,
  FaDownload,
  FaTimes,
  FaSave,
  FaUserPlus,
  FaMale,
  FaFemale,
  FaWeight,
  FaBirthdayCake,
} from "react-icons/fa";
import { toast } from "react-toastify";

const Donations = () => {
  const [donors, setDonors] = useState([]);
  const [upcomingDonations, setUpcomingDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("donors");
  const [expandedDonor, setExpandedDonor] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [urgentModalOpen, setUrgentModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [editingUrgent, setEditingUrgent] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBloodGroup, setFilterBloodGroup] = useState("");
  const [filterGender, setFilterGender] = useState("");

  const [statusForm, setStatusForm] = useState({
    status: "",
    registrationStatus: "",
  });

  const [urgentForm, setUrgentForm] = useState({
    bloodGroups: [],
    message: "",
    contactNumber: "",
    isActive: true,
  });

  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [donorsRes, upcomingRes, statsRes, urgentRes] = await Promise.all([
        api.get("/blood-donation", {
          params: {
            status: filterStatus || undefined,
            bloodGroup: filterBloodGroup || undefined,
            gender: filterGender || undefined,
          },
        }),
        api.get("/blood-donation/schedule/upcoming"),
        api.get("/blood-donation/reports/statistics"),
  
        api.get("/urgent-request", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
      ]);

      setDonors(donorsRes.data.data || []);
      setUpcomingDonations(upcomingRes.data.data || []);
      setStats(statsRes.data.data || {});
      setUrgentRequests(urgentRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load donation data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterBloodGroup, filterGender]);

  const filteredDonors = donors.filter(
    (d) =>
      d.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone?.includes(searchTerm) ||
      d.donorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const getStatusBadge = (status) => {
    const config = {
      registered: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-200",
        label: "Registered",
      },
      confirmed: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        border: "border-purple-200",
        label: "Confirmed",
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-200",
        label: "Completed",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
        label: "Cancelled",
      },
      deferred: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-200",
        label: "Deferred",
      },
    };
    const statusConfig = config[status] || config.registered;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
      >
        {statusConfig.label}
      </span>
    );
  };


  const getBloodGroupBadge = (bloodGroup) => {
    if (!bloodGroup) return <span className="text-gray-400 text-sm">Not specified</span>;
    
    return (
      <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-bold border border-red-200">
        <FaTint className="mr-1" />
        {bloodGroup}
      </span>
    );
  };

  // Open status modal
  const openStatusModal = (donor) => {
    setEditingDonor(donor);
    setStatusForm({
      status: donor.status || "",
      registrationStatus: donor.registrationStatus || "",
    });
    setStatusModalOpen(true);
  };


  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!editingDonor) return;

    try {
      await api.patch(`/blood-donation/${editingDonor.donorId}/status`, statusForm);
      toast.success("Status updated successfully");
      setStatusModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Delete donor
  const handleDeleteDonor = async (donorId) => {
    if (!window.confirm("Are you sure you want to delete this donor?")) return;

    try {
      await api.delete(`/blood-donation/${donorId}`);
      toast.success("Donor deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting donor:", error);
      toast.error(error.response?.data?.message || "Failed to delete donor");
    }
  };


  const openUrgentModal = (request = null) => {
    setEditingUrgent(request);
    if (request) {
      setUrgentForm({
        bloodGroups: request.bloodGroups || [],
        message: request.message || "",
        contactNumber: request.contactNumber || "",
        isActive: request.isActive !== undefined ? request.isActive : true,
      });
    } else {
      setUrgentForm({
        bloodGroups: [],
        message: "",
        contactNumber: "+254 700 123 456",
        isActive: true,
      });
    }
    setUrgentModalOpen(true);
  };


  const toggleBloodGroup = (bloodGroup) => {
    setUrgentForm((prev) => {
      const bloodGroups = prev.bloodGroups.includes(bloodGroup)
        ? prev.bloodGroups.filter((bg) => bg !== bloodGroup)
        : [...prev.bloodGroups, bloodGroup];
      return { ...prev, bloodGroups };
    });
  };

  const handleUrgentSubmit = async (e) => {
    e.preventDefault();


    if (urgentForm.bloodGroups.length === 0) {
      toast.error("Please select at least one blood group");
      return;
    }

    if (!urgentForm.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!urgentForm.contactNumber.trim()) {
      toast.error("Please enter a contact number");
      return;
    }

    try {
      if (editingUrgent) {
        
        await api.put(`/urgent-request/${editingUrgent._id}`, urgentForm);
        toast.success("Urgent request updated successfully");
      } else {
    
        await api.post("/urgent-request", urgentForm);
        toast.success("Urgent request created successfully");
      }
      setUrgentModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving urgent request:", error);
      toast.error(error.response?.data?.message || "Failed to save urgent request");
    }
  };

  // Delete urgent request - FIXED ENDPOINT
  const handleDeleteUrgent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this urgent request?")) return;

    try {
   
      await api.delete(`/urgent-request/${id}`);
      toast.success("Urgent request deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting urgent request:", error);
      toast.error(error.response?.data?.message || "Failed to delete urgent request");
    }
  };


  const toggleUrgentStatus = async (id, currentStatus) => {
    try {
   
      await api.patch(`/urgent-request/${id}/toggle`, {
        isActive: !currentStatus,
      });
      toast.success(`Urgent request ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      console.error("Error toggling urgent status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const calculateStats = () => {
    if (!stats) return { total: 0, byBloodGroup: [], byStatus: [], byGender: [] };

    return {
      total: stats.totalDonors || 0,
      byBloodGroup: stats.bloodGroupStats || [],
      byStatus: stats.statusStats || [],
      byGender: stats.genderStats || [],
    };
  };

  const calculatedStats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <FaTint className="text-red-600 mr-3" />
            Blood Donation Management
          </h1>
          <p className="text-gray-600">
            Manage blood donors, track donations, and monitor blood inventory
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Donors</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {calculatedStats.total}
                </h3>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <FaUsers className="text-2xl text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Upcoming Donations</p>
                <h3 className="text-3xl font-bold text-blue-600">
                  {upcomingDonations.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <FaCalendarCheck className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <h3 className="text-3xl font-bold text-green-600">
                  {calculatedStats.byStatus.find(s => s._id === "completed")?.count || 0}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Registered</p>
                <h3 className="text-3xl font-bold text-purple-600">
                  {calculatedStats.byStatus.find(s => s._id === "registered")?.count || 0}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <FaClock className="text-2xl text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Blood Group Distribution */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaTint className="text-red-600 mr-2" />
            Blood Group Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => {
              const count = calculatedStats.byBloodGroup.find(b => b._id === bg)?.count || 0;
              return (
                <div key={bg} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-red-600">{bg}</div>
                  <div className="text-sm text-gray-600 mt-1">{count} donors</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm mb-6">
          <div className="border-b border-gray-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab("donors")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "donors"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaUsers className="inline mr-2" />
                All Donors
              </button>
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "upcoming"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaCalendarCheck className="inline mr-2" />
                Upcoming Donations
              </button>
              <button
                onClick={() => setActiveTab("urgent")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "urgent"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaExclamationTriangle className="inline mr-2" />
                Urgent Requests
              </button>
            </div>
          </div>

          {/* All Donors Tab */}
          {activeTab === "donors" && (
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, donor ID, or blood group..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">All Status</option>
                    <option value="registered">Registered</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="deferred">Deferred</option>
                  </select>

                  <select
                    value={filterBloodGroup}
                    onChange={(e) => setFilterBloodGroup(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">All Blood Groups</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>

                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading donors...</p>
                  </div>
                ) : filteredDonors.length === 0 ? (
                  <div className="p-12 text-center">
                    <FaUsers className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No donors found</p>
                  </div>
                ) : (
                  filteredDonors.map((donor) => (
                    <div
                      key={donor._id}
                      className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      {/* Main Row */}
                      <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          setExpandedDonor(
                            expandedDonor === donor._id ? null : donor._id
                          )
                        }
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                          {/* Donor Info */}
                          <div>
                            <p className="font-semibold text-gray-900">
                              {donor.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {donor.donorId}
                            </p>
                          </div>

                          {/* Blood Group */}
                          <div>{getBloodGroupBadge(donor.bloodGroup)}</div>

                          {/* Contact */}
                          <div className="text-sm">
                            <div className="flex items-center text-gray-700 mb-1">
                              <FaPhone className="text-gray-400 mr-2 text-xs" />
                              <span className="text-xs">{donor.phone}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                              <FaEnvelope className="text-gray-400 mr-2 text-xs" />
                              <span className="text-xs truncate">{donor.email}</span>
                            </div>
                          </div>

                          {/* Demographics */}
                          <div className="text-sm">
                            <div className="flex items-center text-gray-700 mb-1">
                              {donor.gender === 'male' ? (
                                <FaMale className="text-blue-500 mr-2" />
                              ) : donor.gender === 'female' ? (
                                <FaFemale className="text-pink-500 mr-2" />
                              ) : null}
                              <span className="text-xs capitalize">{donor.gender}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                              <FaBirthdayCake className="text-gray-400 mr-2 text-xs" />
                              <span className="text-xs">{donor.age} years</span>
                            </div>
                          </div>

                          {/* Donation Date */}
                          <div className="text-sm">
                            <p className="text-gray-600 text-xs">Scheduled:</p>
                            <p className="text-gray-900 font-medium text-xs">
                              {new Date(donor.donationDate).toLocaleDateString()}
                            </p>
                            <p className="text-gray-600 text-xs">{donor.donationTime}</p>
                          </div>

                          {/* Status */}
                          <div>{getStatusBadge(donor.status)}</div>
                        </div>

                        <button className="ml-4 p-2 text-gray-400 hover:text-gray-600">
                          <FaChevronDown
                            className={`transition-transform ${
                              expandedDonor === donor._id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {expandedDonor === donor._id && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            {/* Personal Details */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">
                                Personal Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center">
                                  <FaIdCard className="text-gray-400 mr-2" />
                                  <span className="text-gray-600 mr-2">National ID:</span>
                                  <span className="text-gray-900 font-medium">
                                    {donor.nationalId}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <FaWeight className="text-gray-400 mr-2" />
                                  <span className="text-gray-600 mr-2">Weight:</span>
                                  <span className="text-gray-900">{donor.weight} kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Medical Information */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">
                                Medical Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <p className="text-gray-600">Health Conditions:</p>
                                  <p className="text-gray-900">
                                    {donor.healthConditions || "None reported"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Medications:</p>
                                  <p className="text-gray-900">
                                    {donor.medications || "None reported"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => openStatusModal(donor)}
                              className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <FaEdit className="mr-2" />
                              Update Status
                            </button>
                            <button
                              onClick={() => handleDeleteDonor(donor.donorId)}
                              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <FaTrash className="mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Upcoming Donations Tab */}
          {activeTab === "upcoming" && (
            <div className="p-6">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading upcoming donations...</p>
                </div>
              ) : upcomingDonations.length === 0 ? (
                <div className="p-12 text-center">
                  <FaCalendarCheck className="text-5xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming donations scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingDonations.map((donation) => (
                    <div
                      key={donation._id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                            <FaTint className="text-2xl text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {donation.fullName}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1">
                              {getBloodGroupBadge(donation.bloodGroup)}
                              <span className="text-sm text-gray-600">
                                {donation.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Scheduled</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(donation.donationDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">{donation.donationTime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Urgent Requests Tab */}
          {activeTab === "urgent" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Urgent Blood Requests
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage urgent blood donation requests displayed on the website
                  </p>
                </div>
                <button
                  onClick={() => openUrgentModal()}
                  className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FaExclamationTriangle className="mr-2" />
                  Create Urgent Request
                </button>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading urgent requests...</p>
                  </div>
                ) : urgentRequests.length === 0 ? (
                  <div className="p-12 text-center">
                    <FaExclamationTriangle className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No urgent requests</p>
                  </div>
                ) : (
                  urgentRequests.map((request) => (
                    <div
                      key={request._id}
                      className={`border rounded-lg p-6 ${
                        request.isActive
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {request.isActive ? (
                              <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium border border-red-200 animate-pulse">
                                <FaExclamationTriangle className="mr-1" />
                                ACTIVE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                                INACTIVE
                              </span>
                            )}
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Blood Groups Needed:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.bloodGroups.map((bg) => (
                                <span
                                  key={bg}
                                  className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold"
                                >
                                  <FaTint className="mr-1" />
                                  {bg}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm text-gray-600">Message:</p>
                            <p className="text-gray-900 mt-1">{request.message}</p>
                          </div>

                          <div className="flex items-center text-sm text-gray-700">
                            <FaPhone className="text-gray-400 mr-2" />
                            <span className="font-medium">{request.contactNumber}</span>
                          </div>

                          <div className="mt-3 text-xs text-gray-500">
                            Created: {new Date(request.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => toggleUrgentStatus(request._id, request.isActive)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              request.isActive
                                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                : "bg-green-500 text-white hover:bg-green-600"
                            }`}
                          >
                            {request.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => openUrgentModal(request)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                          >
                            <FaEdit className="inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUrgent(request._id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                          >
                            <FaTrash className="inline mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Urgent Request Modal */}
      {urgentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingUrgent ? "Edit Urgent Request" : "Create Urgent Request"}
              </h2>
              <p className="text-gray-600 mt-1">
                This will be displayed on the blood donation page
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Blood Groups Needed *
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => toggleBloodGroup(bg)}
                        className={`py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                          urgentForm.bloodGroups.includes(bg)
                            ? "bg-red-600 text-white border-2 border-red-600"
                            : "bg-white text-gray-700 border-2 border-gray-300 hover:border-red-300"
                        }`}
                      >
                        <FaTint className="inline mr-1" />
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgent Message *
                  </label>
                  <textarea
                    value={urgentForm.message}
                    onChange={(e) =>
                      setUrgentForm((prev) => ({ ...prev, message: e.target.value }))
                    }
                    rows="3"
                    placeholder="e.g., Blood Needed Immediately!"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    value={urgentForm.contactNumber}
                    onChange={(e) =>
                      setUrgentForm((prev) => ({ ...prev, contactNumber: e.target.value }))
                    }
                    placeholder="+254 700 123 456"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={urgentForm.isActive}
                    onChange={(e) =>
                      setUrgentForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Display this request on the website (Active)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setUrgentModalOpen(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUrgentSubmit}
                  className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <FaSave className="mr-2" />
                  {editingUrgent ? "Update Request" : "Create Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                Update Donor Status
              </h2>
              <p className="text-gray-600 mt-1">
                Update the status for {editingDonor?.fullName}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Donation Status
                  </label>
                  <select
                    value={statusForm.status}
                    onChange={(e) =>
                      setStatusForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="registered">Registered</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="deferred">Deferred</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Status
                  </label>
                  <select
                    value={statusForm.registrationStatus}
                    onChange={(e) =>
                      setStatusForm((prev) => ({
                        ...prev,
                        registrationStatus: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <FaSave className="mr-2" />
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations;
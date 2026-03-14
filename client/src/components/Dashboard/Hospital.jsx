import React, { useState, useEffect } from "react";
import {
  FaHospital,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaChartBar,
  FaUsers,
  FaCalendarAlt,
  FaArrowLeft,
  FaSave,
  FaKey,
  FaUserPlus,
} from "react-icons/fa";

// Main Component - Handles routing between views
const Hospital = () => {
  const [currentView, setCurrentView] = useState("list"); // 'list', 'create', 'edit', 'details'
  const [selectedHospital, setSelectedHospital] = useState(null);

  const handleCreateNew = () => {
    setSelectedHospital(null);
    setCurrentView("create");
  };

  const handleEdit = (hospital) => {
    setSelectedHospital(hospital);
    setCurrentView("edit");
  };

  const handleViewDetails = (hospital) => {
    setSelectedHospital(hospital);
    setCurrentView("details");
  };

  const handleBack = () => {
    setSelectedHospital(null);
    setCurrentView("list");
  };

  const handleSave = (formData) => {
    // TODO: Implement API call to save hospital
    console.log("Saving hospital:", formData);
    alert(selectedHospital ? "Hospital updated successfully!" : "Hospital created successfully!");
    handleBack();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === "list" && (
        <HospitalsList
          onCreateNew={handleCreateNew}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
        />
      )}
      {(currentView === "create" || currentView === "edit") && (
        <HospitalForm
          hospital={selectedHospital}
          onBack={handleBack}
          onSave={handleSave}
        />
      )}
      {currentView === "details" && (
        <HospitalDetails
          hospital={selectedHospital}
          onBack={handleBack}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
};

// Hospitals List Component
const HospitalsList = ({ onCreateNew, onViewDetails, onEdit }) => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Simulate API call - Replace with actual API
    setTimeout(() => {
      setHospitals([
        {
          id: 1,
          name: "Nairobi Central Regional Hospital",
          location: "Nairobi, Kenya",
          email: "info@ncrh.ke",
          phone: "+254 700 123 456",
          status: "active",
          adminName: "Dr. John Kamau",
          adminEmail: "jkamau@ncrh.ke",
          departments: 15,
          doctors: 45,
          patients: 1234,
          createdAt: "2023-01-15",
        },
        {
          id: 2,
          name: "Mombasa Regional Hospital",
          location: "Mombasa, Kenya",
          email: "contact@mrh.ke",
          phone: "+254 700 234 567",
          status: "active",
          adminName: "Dr. Sarah Ochieng",
          adminEmail: "sochieng@mrh.ke",
          departments: 12,
          doctors: 38,
          patients: 987,
          createdAt: "2023-03-20",
        },
        {
          id: 3,
          name: "Kisumu General Hospital",
          location: "Kisumu, Kenya",
          email: "admin@kgh.ke",
          phone: "+254 700 345 678",
          status: "pending",
          adminName: "Dr. Mary Wanjiru",
          adminEmail: "mwanjiru@kgh.ke",
          departments: 10,
          doctors: 28,
          patients: 654,
          createdAt: "2024-01-10",
        },
        {
          id: 4,
          name: "Eldoret Medical Center",
          location: "Eldoret, Kenya",
          email: "info@emc.ke",
          phone: "+254 700 456 789",
          status: "active",
          adminName: "Dr. David Kipchoge",
          adminEmail: "dkipchoge@emc.ke",
          departments: 8,
          doctors: 22,
          patients: 456,
          createdAt: "2023-08-05",
        },
        {
          id: 5,
          name: "Nakuru Health Facility",
          location: "Nakuru, Kenya",
          email: "contact@nhf.ke",
          phone: "+254 700 567 890",
          status: "inactive",
          adminName: "Dr. Grace Muthoni",
          adminEmail: "gmuthoni@nhf.ke",
          departments: 6,
          doctors: 15,
          patients: 234,
          createdAt: "2023-11-12",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredHospitals = hospitals.filter((hospital) => {
    const matchesSearch =
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.adminName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || hospital.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-orange-100 text-orange-700 border-orange-200",
      inactive: "bg-red-100 text-red-700 border-red-200",
    };
    const icons = {
      active: FaCheckCircle,
      pending: FaClock,
      inactive: FaTimesCircle,
    };
    const Icon = icons[status];
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
      >
        <Icon className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hospitals Management
          </h1>
          <p className="text-gray-600">Manage all registered hospitals and their administrators</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FaPlus className="mr-2" />
          Add New Hospital
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Hospitals</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {hospitals.length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FaHospital className="text-xl text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active</p>
              <h3 className="text-2xl font-bold text-green-600">
                {hospitals.filter((h) => h.status === "active").length}
              </h3>
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
              <h3 className="text-2xl font-bold text-orange-600">
                {hospitals.filter((h) => h.status === "pending").length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <FaClock className="text-xl text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Inactive</p>
              <h3 className="text-2xl font-bold text-red-600">
                {hospitals.filter((h) => h.status === "inactive").length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <FaTimesCircle className="text-xl text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search hospitals by name, location or admin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hospitals Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading hospitals...</p>
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="p-12 text-center">
            <FaHospital className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hospitals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Hospital
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHospitals.map((hospital) => (
                  <tr key={hospital.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <FaHospital className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {hospital.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {hospital.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {hospital.adminName}
                      </p>
                      <p className="text-sm text-gray-500">{hospital.adminEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{hospital.email}</p>
                      <p className="text-sm text-gray-500">{hospital.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(hospital.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-gray-600">
                        <span>{hospital.departments} Depts</span>
                        <span>{hospital.doctors} Doctors</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewDetails(hospital)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details & Analytics"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => onEdit(hospital)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Hospital"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${hospital.name}?`)) {
                              alert("Delete functionality not implemented yet");
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Hospital"
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
    </div>
  );
};

// Create/Edit Hospital Form Component
const HospitalForm = ({ hospital, onBack, onSave }) => {
  const [formData, setFormData] = useState(
    hospital || {
      name: "",
      location: "",
      address: "",
      email: "",
      phone: "",
      website: "",
      adminName: "",
      adminEmail: "",
      adminPhone: "",
      departments: "",
      capacity: "",
      description: "",
      status: "pending",
    }
  );

  const [activeTab, setActiveTab] = useState("basic");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.name) newErrors.name = "Hospital name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    if (!formData.adminName) newErrors.adminName = "Admin name is required";
    if (!formData.adminEmail) newErrors.adminEmail = "Admin email is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <FaArrowLeft className="mr-2" />
        Back to Hospitals
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {hospital ? "Edit Hospital" : "Add New Hospital"}
          </h2>
          <p className="text-gray-600 mt-1">
            {hospital
              ? "Update hospital information and admin credentials"
              : "Register a new hospital facility and assign administrator"}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab("basic")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "basic"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FaHospital className="inline mr-2" />
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "admin"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FaKey className="inline mr-2" />
              Admin Credentials
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="e.g., Nairobi Central Hospital"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Nairobi, Kenya"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="P.O Box 1234, Street Name, City"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="info@hospital.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="+254 700 000 000"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://hospital.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Departments
                  </label>
                  <input
                    type="number"
                    name="departments"
                    value={formData.departments}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 15"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bed Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 500"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the hospital, services offered, specializations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending Approval</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Set to "Active" to allow hospital admin to login
                </p>
              </div>
            </div>
          )}

          {activeTab === "admin" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <FaKey className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Hospital Administrator Login Credentials
                    </h4>
                    <p className="text-sm text-blue-700">
                      These credentials will be used by the hospital administrator to
                      access and manage the hospital's section of the system.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.adminName ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="e.g., Dr. John Kamau"
                />
                {errors.adminName && (
                  <p className="text-red-500 text-xs mt-1">{errors.adminName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email (Login Username) *
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.adminEmail ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="admin@hospital.com"
                  />
                  {errors.adminEmail && (
                    <p className="text-red-500 text-xs mt-1">{errors.adminEmail}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    This email will be the login username
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Phone
                  </label>
                  <input
                    type="tel"
                    name="adminPhone"
                    value={formData.adminPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>

              {!hospital && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FaKey className="text-yellow-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-800">
                        <strong>Password Generation:</strong> A secure temporary password will be automatically
                        generated and sent to the admin's email address. The administrator will be
                        required to change it upon first login.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {hospital && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FaKey className="text-gray-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Password Management:</strong> To reset the admin password, click the button below.
                        A new temporary password will be sent to the admin's email.
                      </p>
                      <button
                        type="button"
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        onClick={() => {
                          if (window.confirm(`Send password reset email to ${formData.adminEmail}?`)) {
                            alert("Password reset email sent!");
                          }
                        }}
                      >
                        <FaKey className="mr-2" />
                        Reset Admin Password
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FaSave className="mr-2" />
              {hospital ? "Update Hospital" : "Create Hospital"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hospital Details View Component
const HospitalDetails = ({ hospital, onBack, onEdit }) => {
  const [activeAdmins, setActiveAdmins] = useState([
    {
      id: 1,
      name: hospital.adminName,
      email: hospital.adminEmail,
      role: "Primary Admin",
      lastLogin: "2024-11-18 14:30",
      status: "active",
    },
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <FaArrowLeft className="mr-2" />
        Back to Hospitals
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hospital Header Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <FaHospital className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {hospital.name}
                  </h2>
                  <p className="text-gray-600 mb-2">{hospital.location}</p>
                  <div className="flex items-center gap-2">
                    {hospital.status === "active" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        <FaCheckCircle className="mr-1" />
                        Active
                      </span>
                    )}
                    {hospital.status === "pending" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                        <FaClock className="mr-1" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onEdit(hospital)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaEdit className="mr-2" />
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-gray-900">{hospital.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <p className="text-gray-900">{hospital.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Primary Administrator</p>
                <p className="text-gray-900 font-medium">{hospital.adminName}</p>
                <p className="text-sm text-gray-500">{hospital.adminEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Registration Date</p>
                <p className="text-gray-900">{hospital.createdAt}</p>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaChartBar className="mr-2 text-blue-600" />
              Hospital Analytics
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-600 mb-2">Departments</p>
                <p className="text-3xl font-bold text-blue-700">
                  {hospital.departments}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-600 mb-2">Doctors</p>
                <p className="text-3xl font-bold text-green-700">
                  {hospital.doctors}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-purple-600 mb-2">Patients</p>
                <p className="text-3xl font-bold text-purple-700">
                  {hospital.patients}
                </p>
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Monthly Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">Appointments</span>
                  </div>
                  <span className="font-semibold text-gray-900">342</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaUsers className="text-green-600 mr-2" />
                    <span className="text-sm text-gray-600">New Patients</span>
                  </div>
                  <span className="font-semibold text-gray-900">87</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Admin Users Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaUsers className="mr-2 text-blue-600" />
                Admin Users
              </h3>
              <button
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Add Admin User"
                onClick={() => alert("Add admin user functionality")}
              >
                <FaUserPlus />
              </button>
            </div>
            <div className="space-y-3">
              {activeAdmins.map((admin) => (
                <div key={admin.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
                      {admin.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {admin.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{admin.role}</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last login: {admin.lastLogin}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Manage Admin Users
            </button>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <FaKey className="mr-3 text-gray-400" />
                <span className="text-sm">Reset Admin Password</span>
              </button>
              <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <FaCalendarAlt className="mr-3 text-gray-400" />
                <span className="text-sm">View Appointments</span>
              </button>
              <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <FaUsers className="mr-3 text-gray-400" />
                <span className="text-sm">View All Staff</span>
              </button>
              <button className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <FaTimesCircle className="mr-3" />
                <span className="text-sm">Deactivate Hospital</span>
              </button>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              System Status
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              All systems operational. Last checked 2 minutes ago.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Database</span>
                <span className="text-green-600 font-semibold">✓ Online</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">API Services</span>
                <span className="text-green-600 font-semibold">✓ Online</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Admin Portal</span>
                <span className="text-green-600 font-semibold">✓ Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hospital;
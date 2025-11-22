import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaStethoscope,
  FaImage,
  FaTimes,
  FaCheckCircle,
  FaFileAlt,
  FaEye,
  FaSearch,
  FaFilter,
  FaUserMd,
  FaClock,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    headOfDepartment: "",
    contactInfo: "",
    serviceHours: "",
    location: "",
    tariffInfo: "",
    nhifCovered: false,
    image: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const serviceCategories = [
    "Outpatient Services",
    "Inpatient Services",
    "Emergency Services",
    "Laboratory Services",
    "Radiology/Imaging",
    "Maternity Services",
    "Pharmacy",
    "Theatre/Surgery",
    "Ambulance Services",
    "Pediatrics",
    "Community Outreach",
    "Preventive Care",
    "Specialized Clinics",
    "Other Services"
  ];

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      setServices(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      alert("Error fetching services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter((service) => {
    const matchesSearch = 
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.headOfDepartment?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      filterCategory === "all" || service.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service/department?")) return;
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting service");
    }
  };

  const openModal = (service = null) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name || "",
        category: service.category || "",
        description: service.description || "",
        headOfDepartment: service.headOfDepartment || "",
        contactInfo: service.contactInfo || "",
        serviceHours: service.serviceHours || "",
        location: service.location || "",
        tariffInfo: service.tariffInfo || "",
        nhifCovered: service.nhifCovered || false,
        image: null,
      });
      setImagePreview(service.imageUrl ? `http://localhost:5000${service.imageUrl}` : null);
      setIsEditing(true);
    } else {
      setSelectedService(null);
      setFormData({
        name: "",
        category: "",
        description: "",
        headOfDepartment: "",
        contactInfo: "",
        serviceHours: "",
        location: "",
        tariffInfo: "",
        nhifCovered: false,
        image: null,
      });
      setImagePreview(null);
      setIsEditing(false);
    }
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("category", formData.category);
      payload.append("description", formData.description);
      payload.append("headOfDepartment", formData.headOfDepartment);
      payload.append("contactInfo", formData.contactInfo);
      payload.append("serviceHours", formData.serviceHours);
      payload.append("location", formData.location);
      payload.append("tariffInfo", formData.tariffInfo);
      payload.append("nhifCovered", formData.nhifCovered);

      if (formData.image) {
        payload.append("image", formData.image);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (isEditing) {
        await api.put(`/services/${selectedService._id}`, payload, config);
      } else {
        await api.post("/services", payload, config);
      }

      fetchServices();
      setModalOpen(false);
      setImagePreview(null);
      alert("Service saved successfully!");
    } catch (err) {
      console.error("Error details:", err.response?.data);
      alert(err.response?.data?.message || "Error saving service");
    }
  };

  const handleViewService = (service) => {
    setSelectedService(service);
    setViewModal(true);
  };

  const getCategoryStats = () => {
    const stats = {};
    serviceCategories.forEach(cat => {
      stats[cat] = services.filter(s => s.category === cat).length;
    });
    return stats;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Departments & Services Management
            </h1>
            <p className="text-gray-600">Manage hospital departments, services, and medical units</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FaPlus className="mr-2" />
            Add Department/Service
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Services</p>
                <h3 className="text-2xl font-bold text-gray-900">{services.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaStethoscope className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">NHIF Covered</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {services.filter((s) => s.nhifCovered).length}
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
                <p className="text-sm text-gray-500 mb-1">With HODs</p>
                <h3 className="text-2xl font-bold text-purple-600">
                  {services.filter((s) => s.headOfDepartment).length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <FaUserMd className="text-xl text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Categories</p>
                <h3 className="text-2xl font-bold text-orange-600">
                  {new Set(services.map(s => s.category).filter(Boolean)).size}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <FaFileAlt className="text-xl text-orange-600" />
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
                placeholder="Search by service name, description, or HOD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {serviceCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-12 text-center">
              <FaStethoscope className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No services found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredServices.map((service) => (
                <div
                  key={service._id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100">
                    {service.imageUrl ? (
                      <img
                        src={`http://localhost:5000${service.imageUrl}`}
                        alt={service.name}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaStethoscope className="text-5xl text-blue-300" />
                      </div>
                    )}
                    {service.nhifCovered && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        NHIF Covered
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {service.category || "Uncategorized"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {service.description || "No description available"}
                    </p>
                    
                    {service.headOfDepartment && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <FaUserMd className="mr-2 text-gray-400" />
                        <span className="truncate">{service.headOfDepartment}</span>
                      </div>
                    )}
                    
                    {service.serviceHours && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <FaClock className="mr-2 text-gray-400" />
                        <span className="truncate">{service.serviceHours}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={() => handleViewService(service)}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <FaEye className="mr-1" />
                        View Details
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(service)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Service"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Service"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Service Modal */}
      {viewModal && selectedService && (
        <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedService.name}</h3>
                  <p className="text-sm text-blue-600 mt-1">{selectedService.category}</p>
                </div>
                <button
                  onClick={() => setViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaTimes className="text-gray-500 text-xl" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {selectedService.imageUrl && (
                <div className="mb-6 items-center justify-center flex">
                  <img
                    src={`http://localhost:5000${selectedService.imageUrl}`}
                    alt={selectedService.name}
                    className="items-center rounded-lg"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedService.description || "No description available"}
                  </p>
                </div>
                
                {selectedService.headOfDepartment && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Head of Department</p>
                    <div className="flex items-center">
                      <FaUserMd className="text-blue-600 mr-2" />
                      <p className="font-semibold text-gray-900">{selectedService.headOfDepartment}</p>
                    </div>
                  </div>
                )}
                
                {selectedService.contactInfo && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Contact Information</p>
                    <div className="flex items-center">
                      <FaPhone className="text-green-600 mr-2" />
                      <p className="text-gray-900">{selectedService.contactInfo}</p>
                    </div>
                  </div>
                )}
                
                {selectedService.serviceHours && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Service Hours</p>
                    <div className="flex items-center">
                      <FaClock className="text-purple-600 mr-2" />
                      <p className="text-gray-900">{selectedService.serviceHours}</p>
                    </div>
                  </div>
                )}
                
                {selectedService.location && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="text-red-600 mr-2" />
                      <p className="text-gray-900">{selectedService.location}</p>
                    </div>
                  </div>
                )}
                
                {selectedService.tariffInfo && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tariff Information</p>
                    <p className="text-gray-900">{selectedService.tariffInfo}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">NHIF Coverage</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    selectedService.nhifCovered 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {selectedService.nhifCovered ? "✓ Covered" : "Not Covered"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setViewModal(false);
                    openModal(selectedService);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaEdit className="mr-2" />
                  Edit Service
                </button>
                <button
                  onClick={() => setViewModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? "Edit Department/Service" : "Add New Department/Service"}
              </h2>
              <p className="text-gray-600 mt-1">
                {isEditing ? "Update department/service information" : "Create a new department or service"}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service/Department Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Emergency Care"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {serviceCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter detailed description of services offered..."
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Head of Department
                    </label>
                    <input
                      type="text"
                      value={formData.headOfDepartment}
                      onChange={(e) =>
                        setFormData({ ...formData, headOfDepartment: e.target.value })
                      }
                      placeholder="e.g., Dr. Jane Doe"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Information
                    </label>
                    <input
                      type="text"
                      value={formData.contactInfo}
                      onChange={(e) =>
                        setFormData({ ...formData, contactInfo: e.target.value })
                      }
                      placeholder="e.g., +254 700 000 000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Hours
                    </label>
                    <input
                      type="text"
                      value={formData.serviceHours}
                      onChange={(e) =>
                        setFormData({ ...formData, serviceHours: e.target.value })
                      }
                      placeholder="e.g., Mon-Fri 8:00 AM - 5:00 PM"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location/Building
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="e.g., Main Building, Ground Floor"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tariff Information
                  </label>
                  <textarea
                    value={formData.tariffInfo}
                    onChange={(e) =>
                      setFormData({ ...formData, tariffInfo: e.target.value })
                    }
                    placeholder="e.g., Consultation: KES 500, Follow-up: KES 300"
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="nhifCovered"
                    checked={formData.nhifCovered}
                    onChange={(e) =>
                      setFormData({ ...formData, nhifCovered: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="nhifCovered" className="ml-2 text-sm font-medium text-gray-700">
                    NHIF Covered Service
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Image {!isEditing && "*"}
                  </label>
                  
                  {imagePreview && (
                    <div className="mb-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-48 w-full object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    required={!isEditing}
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: JPG, PNG or WEBP (Max 5MB)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setImagePreview(null);
                  }}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaCheckCircle className="mr-2" />
                  {isEditing ? "Update Service" : "Create Service"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
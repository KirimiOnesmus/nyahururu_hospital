import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "../../api/socket";
import api from "../../api/axios";
import { ASSET_BASE_URL } from "../../config/env";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaStethoscope,
  FaImage,
  FaTimes,
  FaCheckCircle,
  FaEye,
  FaSearch,
  FaFilter,
  FaUserMd,
  FaClock,
  FaPhone,
  FaMapMarkerAlt,
  FaHospital,
  FaBed,
  FaClinicMedical,
  FaFileInvoiceDollar,
  FaShieldAlt,
} from "react-icons/fa";
import notify from "../../common/utils/notify";
import {
  Modal,
  Spinner,
  EmptyState,
  StatCard,
  Button,
  SearchBox,
  Input,
  TextArea,
  Select,
  FormField,
  PageHeader,
  StatusBadge,
  Avatar,
  DataTable,
} from "../../common/components";

const DIVISIONS = ["Outpatient", "Inpatient", "Specialist Clinics"];

const SERVICE_CATEGORIES = [
  "General Medicine",
  "Maternal and Child Health",
  "Emergency Services",
  "Obstetrics and Gynecology",
  "Dentistry",
  "Ophthalmology",
  "ENT",
  "Surgery",
  "Orthopedics",
  "Radiology",
  "Laboratory",
  "Pharmacy",
  "Physiotherapy",
  "Mental Health",
  "Dermatology",
  "Emergency",
  "Renal Dialysis",
  "High Risk Ante-natal Care",
  "Medical Outpatient Clinic",
  "Pediatric Outpatient Clinic",
  "Gynecology Outpatient Clinic",
  "Diabetes Outpatient Clinic",
  "Surgical Outpatient Clinic",
  "Orthopedic Surgery Clinic",
  "Others",
];

const DIVISION_CONFIG = {
  Outpatient: {
    bg: "bg-violet-100",
    text: "text-violet-700",
    dot: "bg-violet-400",
    badge: "bg-violet-600",
  },
  Inpatient: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    dot: "bg-indigo-400",
    badge: "bg-indigo-600",
  },
  "Specialist Clinics": {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-400",
    badge: "bg-amber-500",
  },
};

const divCfg = (d) => DIVISION_CONFIG[d] || DIVISION_CONFIG["Outpatient"];

const IMG_BASE = ASSET_BASE_URL;

const EMPTY_FORM = {
  name: "",
  division: "",
  category: "",
  description: "",
  headOfDepartment: "",
  contactInfo: "",
  serviceHours: "",
  location: "",
  tariffInfo: "",
  nhifCovered: false,
  image: null,
};

const ServiceCard = ({ service, onView, onEdit, onDelete }) => {
  const dc = divCfg(service.division);
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all group">
      <div className="relative h-44 bg-primary-soft">
        {service.imageUrl ? (
          <img
            src={`${IMG_BASE}${service.imageUrl}`}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaStethoscope className="text-5xl text-blue-200" />
          </div>
        )}

        <span
          className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full text-white ${dc.badge}`}
        >
          {service.division}
        </span>

        {service.nhifCovered && (
          <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
            <FaShieldAlt className="text-[9px]" />
            SHA
          </span>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={() => onView(service)}
            className="p-2.5 bg-white rounded-xl text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer shadow"
            title="View"
          >
            <FaEye />
          </button>
          <button
            onClick={() => onEdit(service)}
            className="p-2.5 bg-white rounded-xl text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer shadow"
            title="Edit"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="p-2.5 bg-white rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shadow"
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      <div className="p-4">
        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          {service.category || "Uncategorized"}
        </span>
        <h3 className="font-bold text-gray-900 mt-2 mb-1 text-sm leading-snug">{service.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {service.description || "No description available"}
        </p>

        <div className="space-y-1.5">
          {service.headOfDepartment && (
            <p className="flex items-center gap-1.5 text-xs text-gray-600">
              <FaUserMd className="text-gray-300 shrink-0" />
              {service.headOfDepartment}
            </p>
          )}
          {service.serviceHours && (
            <p className="flex items-center gap-1.5 text-xs text-gray-600">
              <FaClock className="text-gray-300 shrink-0" />
              {service.serviceHours}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDivision, setFilterDivision] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  const [viewModal, setViewModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      setServices(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      notify.error(err.response?.data?.message || "Error fetching services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const stats = useMemo(
    () => ({
      total: services.length,
      outpatient: services.filter((s) => s.division === "Outpatient").length,
      inpatient: services.filter((s) => s.division === "Inpatient").length,
      clinics: services.filter((s) => s.division === "Specialist Clinics").length,
      sha: services.filter((s) => s.nhifCovered).length,
    }),
    [services]
  );

  const filteredServices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return services.filter((s) => {
      const matchSearch =
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.headOfDepartment?.toLowerCase().includes(q);
      const matchDiv = filterDivision === "all" || s.division === filterDivision;
      const matchCat = filterCategory === "all" || s.category === filterCategory;
      return matchSearch && matchDiv && matchCat;
    });
  }, [services, searchTerm, filterDivision, filterCategory]);

  const openModal = (service = null) => {
    setIsEditing(!!service);
    setSelectedService(service);
    if (service) {
      setFormData({
        name: service.name || "",
        division: service.division || "",
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
      setImagePreview(service.imageUrl ? `${IMG_BASE}${service.imageUrl}` : null);
    } else {
      setFormData(EMPTY_FORM);
      setImagePreview(null);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setImagePreview(null);
  };

  const setField = (key, value) => setFormData((p) => ({ ...p, [key]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify.error("Image must be under 5 MB");
      return;
    }
    setField("image", file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notify.error("Service name is required");
      return;
    }
    if (!formData.division) {
      notify.error("Division is required");
      return;
    }
    if (!formData.category) {
      notify.error("Category is required");
      return;
    }
    if (!formData.description.trim()) {
      notify.error("Description is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("division", formData.division);
      payload.append("category", formData.category);
      payload.append("description", formData.description.trim());
      payload.append("nhifCovered", formData.nhifCovered);

      ["headOfDepartment", "contactInfo", "serviceHours", "location", "tariffInfo"].forEach((k) => {
        if (formData[k]?.trim()) payload.append(k, formData[k].trim());
      });

      if (formData.image) payload.append("image", formData.image);

      const cfg = { headers: { "Content-Type": "multipart/form-data" } };

      if (isEditing) {
        await api.put(`/services/${selectedService.id}`, payload, cfg);
        notify.success("Service updated successfully");
      } else {
        await api.post("/services", payload, cfg);
        notify.success("Service created successfully");
      }
      closeModal();
      fetchServices();
    } catch (err) {
      notify.error(err.response?.data?.message || "Error saving service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service/department?")) return;
    try {
      await api.delete(`/services/${id}`);
      notify.success("Service deleted");
      fetchServices();
    } catch (err) {
      notify.error(err.response?.data?.message || "Error deleting service");
    }
  };

  const handleViewService = (service) => {
    setSelectedService(service);
    setViewModal(true);
  };

  const usedCategories = useMemo(
    () => [...new Set(services.map((s) => s.category).filter(Boolean))].sort(),
    [services]
  );

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <FaStethoscope className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Departments & Services
              </h1>
              <p className="text-xs text-gray-400">
                Manage hospital departments, services, and medical units
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors  cursor-pointer"
          >
            <FaPlus className="text-xs" /> Add Service
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            label="Total"
            value={stats.total}
            icon={FaStethoscope}
            accent={{ bg: "bg-blue-50", icon: "text-blue-500", num: "text-blue-600" }}
          />
          <StatCard
            label="Outpatient"
            value={stats.outpatient}
            icon={FaHospital}
            accent={{ bg: "bg-violet-50", icon: "text-violet-500", num: "text-violet-600" }}
          />
          <StatCard
            label="Inpatient"
            value={stats.inpatient}
            icon={FaBed}
            accent={{ bg: "bg-indigo-50", icon: "text-indigo-500", num: "text-indigo-600" }}
          />
          <StatCard
            label="Clinics"
            value={stats.clinics}
            icon={FaClinicMedical}
            accent={{ bg: "bg-amber-50", icon: "text-amber-500", num: "text-amber-600" }}
          />
          <StatCard
            label="SHA Covered"
            value={stats.sha}
            icon={FaShieldAlt}
            accent={{ bg: "bg-emerald-50", icon: "text-emerald-500", num: "text-emerald-600" }}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, description, or HOD…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FaFilter className="text-gray-300 text-sm" />
            <select
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600"
            >
              <option value="all">All Divisions</option>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600"
            >
              <option value="all">All Categories</option>

              {usedCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {(searchTerm || filterDivision !== "all" || filterCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterDivision("all");
                  setFilterCategory("all");
                }}
                className="text-xs text-gray-400 hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-1"
              >
                <FaTimes className="text-[10px]" /> Clear
              </button>
            )}
          </div>
        </div>

        {(searchTerm || filterDivision !== "all" || filterCategory !== "all") && (
          <p className="text-xs text-gray-400 mb-3 px-1">
            Showing <span className="font-semibold text-gray-600">{filteredServices.length}</span>{" "}
            of <span className="font-semibold text-gray-600">{services.length}</span> services
          </p>
        )}

        {loading ? (
          <Spinner />
        ) : filteredServices.length === 0 ? (
          <EmptyState
            text={
              searchTerm || filterDivision !== "all" || filterCategory !== "all"
                ? "No services match your filters"
                : "No services yet"
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onView={handleViewService}
                onEdit={openModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={viewModal}
        onClose={() => setViewModal(false)}
        title={selectedService?.name || ""}
        subtitle={
          selectedService ? `${selectedService.division} · ${selectedService.category}` : ""
        }
        size="xl"
      >
        {selectedService &&
          (() => {
            const dc = divCfg(selectedService.division);
            const details = [
              {
                icon: FaUserMd,
                color: "text-blue-500",
                label: "Head of Department",
                value: selectedService.headOfDepartment,
              },
              {
                icon: FaPhone,
                color: "text-emerald-500",
                label: "Contact",
                value: selectedService.contactInfo,
              },
              {
                icon: FaClock,
                color: "text-violet-500",
                label: "Service Hours",
                value: selectedService.serviceHours,
              },
              {
                icon: FaMapMarkerAlt,
                color: "text-rose-500",
                label: "Location",
                value: selectedService.location,
              },
              {
                icon: FaFileInvoiceDollar,
                color: "text-amber-500",
                label: "Tariff Info",
                value: selectedService.tariffInfo,
              },
            ].filter((d) => d.value);

            return (
              <>
                {selectedService.imageUrl && (
                  <img
                    src={`${IMG_BASE}${selectedService.imageUrl}`}
                    alt={selectedService.name}
                    className="w-full h-56 object-cover rounded-xl mb-5"
                  />
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full text-white ${dc.badge}`}
                  >
                    {selectedService.division}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {selectedService.category}
                  </span>
                  {selectedService.nhifCovered && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                      <FaShieldAlt className="text-[10px]" />
                      SHA Covered
                    </span>
                  )}
                </div>

         
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Description
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedService.description || "No description available"}
                  </p>
                </div>

            
                {details.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {details.map(({ icon: Icon, color, label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Icon className={`${color} text-[10px]`} />
                          {label}
                        </p>
                        <p className="text-sm text-gray-800 font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setViewModal(false)}
                    className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setViewModal(false);
                      openModal(selectedService);
                    }}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <FaEdit /> Edit Service
                  </button>
                </div>
              </>
            );
          })()}
      </Modal>

   
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Service" : "Add New Service"}
        subtitle={
          isEditing ? "Update department/service information" : "Create a new department or service"
        }
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Service Name" required>
              <input
                value={formData.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g., Emergency Care"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
                required
              />
            </FormField>
            <FormField label="Division" required>
              <select
                value={formData.division}
                onChange={(e) => setField("division", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
                required
              >
                <option value="">Select Division</option>
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Category" required>
            <select
              value={formData.category}
              onChange={(e) => setField("category", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
              required
            >
              <option value="">Select Category</option>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Description" required>
            <textarea
              value={formData.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Enter detailed description of services offered…"
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white resize-none"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Head of Department">
              <input
                value={formData.headOfDepartment}
                onChange={(e) => setField("headOfDepartment", e.target.value)}
                placeholder="e.g., Dr. Jane Doe"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
              />
            </FormField>
            <FormField label="Contact Information">
              <input
                value={formData.contactInfo}
                onChange={(e) => setField("contactInfo", e.target.value)}
                placeholder="+254 700 000 000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Service Hours">
              <input
                value={formData.serviceHours}
                onChange={(e) => setField("serviceHours", e.target.value)}
                placeholder="Mon–Fri 8:00 AM – 5:00 PM"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
              />
            </FormField>
            <FormField label="Location / Building">
              <input
                value={formData.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="Main Building, Ground Floor"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white"
              />
            </FormField>
          </div>

          <FormField label="Tariff Information">
            <textarea
              value={formData.tariffInfo}
              onChange={(e) => setField("tariffInfo", e.target.value)}
              placeholder="Consultation: KES 500, Follow-up: KES 300"
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white resize-none"
            />
          </FormField>

      
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.nhifCovered}
                onChange={(e) => setField("nhifCovered", e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-10 h-6 rounded-full transition-colors ${formData.nhifCovered ? "bg-emerald-500" : "bg-gray-200"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${formData.nhifCovered ? "translate-x-5" : "translate-x-1"}`}
                />
              </div>
            </div>
            <span className="text-sm text-gray-700 font-medium">SHA Covered Service</span>
          </label>

       
          <FormField label="Service Image (optional)">
            {imagePreview && (
              <div className="relative mb-3 group/img w-full">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-44 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setField("image", null);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow text-gray-500 hover:text-rose-500 cursor-pointer opacity-0 group-hover/img:opacity-100 transition-opacity"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            )}
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
              <FaImage className="text-gray-300 text-lg" />
              <span className="text-sm text-gray-400">
                {formData.image
                  ? formData.image.name
                  : "Click to upload image (JPG, PNG, WEBP · max 5 MB)"}
              </span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </FormField>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer transition-colors "
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <FaCheckCircle className="text-xs" />
                  {isEditing ? "Update Service" : "Create Service"}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServicesPage;

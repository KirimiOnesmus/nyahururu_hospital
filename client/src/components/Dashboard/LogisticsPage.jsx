import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "../../api/socket";
import api from "../../api/axios";
import {
  FaAmbulance, FaPlus, FaSearch, FaEdit, FaTrash, FaCheckCircle,
  FaClock, FaTruck, FaExclamationTriangle, FaTools, FaUserMd,
  FaMapMarkerAlt, FaPhone, FaSave, FaCalendarAlt, FaChevronDown,
  FaTimes, FaFilter,
} from "react-icons/fa";
import notify from "../../common/utils/notify";
import {
  Modal, Spinner, EmptyState, StatCard, Button, SearchBox, Input, TextArea, Select, FormField, PageHeader, StatusBadge, Avatar, DataTable,
} from "../../common/components";



const VEHICLE_STATUS_CONFIG = {
  Available:   { bg:"bg-emerald-100", text:"text-emerald-700", dot:"bg-emerald-500", icon: FaCheckCircle },
  "In Service":{ bg:"bg-sky-100",     text:"text-sky-700",     dot:"bg-sky-500",     icon: FaTruck       },
  "In Use":    { bg:"bg-sky-100",     text:"text-sky-700",     dot:"bg-sky-500",     icon: FaTruck       },
  Maintenance: { bg:"bg-amber-100",   text:"text-amber-700",   dot:"bg-amber-400",   icon: FaTools       },
};

const BOOKING_STATUS_CONFIG = {
  Pending:    { bg:"bg-amber-100",   text:"text-amber-700"   },
  Waiting:    { bg:"bg-orange-100",  text:"text-orange-700"  },
  Assigned:   { bg:"bg-sky-100",     text:"text-sky-700"     },
  "In Transit":{ bg:"bg-violet-100", text:"text-violet-700"  },
  Arrived:    { bg:"bg-indigo-100",  text:"text-indigo-700"  },
  Completed:  { bg:"bg-emerald-100", text:"text-emerald-700" },
  Cancelled:  { bg:"bg-rose-100",    text:"text-rose-700"    },
};

const EMERGENCY_CONFIG = {
  critical:{ bg:"bg-rose-100",   text:"text-rose-700",   dot:"bg-rose-500",   label:"Critical" },
  urgent:  { bg:"bg-orange-100", text:"text-orange-700", dot:"bg-orange-400", label:"Urgent"   },
  standard:{ bg:"bg-emerald-100",text:"text-emerald-700",dot:"bg-emerald-400",label:"Standard" },
};

const EMPTY_VEHICLE = {
  plate:"", type:"", status:"Available", driver:"",
  lastService:"", nextService:"", mileage:"", color:"", make:"", model:"", year:"",
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-KE", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtDT   = (d) => d ? new Date(d).toLocaleString("en-KE") : "—";
const toID    = (d) => d ? d.split("T")[0] : "";




const VehicleBadge = ({ status }) => {
  const c = VEHICLE_STATUS_CONFIG[status] || VEHICLE_STATUS_CONFIG.Available;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Icon className="text-[10px]" />{status}
    </span>
  );
};

const BookingBadge = ({ status }) => {
  const c = BOOKING_STATUS_CONFIG[status] || BOOKING_STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />{status}
    </span>
  );
};

const EmergencyBadge = ({ level }) => {
  const c = EMERGENCY_CONFIG[level] || EMERGENCY_CONFIG.standard;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label}
    </span>
  );
};

const LogisticsPage = () => {
  const [vehicles,        setVehicles]        = useState([]);
  const [bookings,        setBookings]        = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [activeTab,       setActiveTab]       = useState("vehicles");
  const [searchVehicle,   setSearchVehicle]   = useState("");
  const [searchBooking,   setSearchBooking]   = useState("");
  const [filterVStatus,   setFilterVStatus]   = useState("all");
  const [filterEmergency, setFilterEmergency] = useState("all");
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [vehicleModal,   setVehicleModal]   = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm,    setVehicleForm]    = useState(EMPTY_VEHICLE);
  const [bookingModal,   setBookingModal]   = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingStatus,  setBookingStatus]  = useState("Pending");


  const fetchVehicles = useCallback(async () => {
    try {
      setLoadingVehicles(true);
      const res = await api.get("/vehicles");
      setVehicles(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      notify.error(err.response?.data?.message || "Error fetching vehicles");
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      const res = await api.get("/ambulance-bookings");
      setBookings(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      notify.error(err.response?.data?.message || "Error fetching bookings");
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); fetchBookings(); }, [fetchVehicles, fetchBookings]);


  const stats = useMemo(() => ({
    totalVehicles:   vehicles.length,
    available:       vehicles.filter(v => v.status === "Available").length,
    inService:       vehicles.filter(v => v.status === "In Service" || v.status === "In Use").length,
    maintenanceDue:  vehicles.filter(v => v.nextService && new Date(v.nextService) <= new Date()).length,
    totalBookings:   bookings.length,
    pendingBookings: bookings.filter(b => b.status === "Pending" || b.status === "Waiting").length,
    assignedBookings:bookings.filter(b => b.status === "Assigned").length,
    criticalBookings:bookings.filter(b => b.emergencyLevel === "critical").length,
  }), [vehicles, bookings]);

 
  const filteredVehicles = useMemo(() => {
    const q = searchVehicle.toLowerCase();
    return vehicles.filter(v => {
      const matchSearch =
        v.plate?.toLowerCase().includes(q) ||
        v.type?.toLowerCase().includes(q) ||
        v.driver?.toLowerCase().includes(q);
      const matchStatus = filterVStatus === "all" || v.status === filterVStatus;
      return matchSearch && matchStatus;
    });
  }, [vehicles, searchVehicle, filterVStatus]);

  const filteredBookings = useMemo(() => {
    const q = searchBooking.toLowerCase();
    return bookings.filter(b => {
      const matchSearch =
        b.patientName?.toLowerCase().includes(q) ||
        b.status?.toLowerCase().includes(q) ||
        b.emergencyLevel?.toLowerCase().includes(q) ||
        b.phone?.includes(q);
      const matchEmergency = filterEmergency === "all" || b.emergencyLevel === filterEmergency;
      return matchSearch && matchEmergency;
    });
  }, [bookings, searchBooking, filterEmergency]);


  const openVehicleModal = (v = null) => {
    setEditingVehicle(v);
    setVehicleForm(v
      ? { plate: v.plate||"", type: v.type||"", status: v.status||"Available",
          driver: v.driver||"", lastService: toID(v.lastService), nextService: toID(v.nextService),
          mileage: v.mileage||"", color: v.color||"", make: v.make||"", model: v.model||"", year: v.year||"" }
      : EMPTY_VEHICLE
    );
    setVehicleModal(true);
  };

  const setVField = (key, val) => setVehicleForm(p => ({ ...p, [key]: val }));

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleForm.plate.trim()) { notify.error("Plate number is required"); return; }
    if (!vehicleForm.type)         { notify.error("Vehicle type is required"); return; }

    setSubmitting(true);
    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, vehicleForm);

        setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...v, ...vehicleForm } : v));
        notify.success("Vehicle updated");
      } else {
        const res = await api.post("/vehicles", vehicleForm);
        const newV = res.data.data || res.data;
        setVehicles(prev => [newV, ...prev]);
        notify.success("Vehicle added");
      }
      setVehicleModal(false);
    } catch (err) {
      notify.error(err.response?.data?.message || "Error saving vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try {
      await api.delete(`/vehicles/${id}`);

      setVehicles(prev => prev.filter(v => v.id !== id));
      notify.success("Vehicle deleted");
    } catch (err) {
      notify.error(err.response?.data?.message || "Error deleting vehicle");
    }
  };


  const openBookingModal = (b) => {
    setEditingBooking(b);
    setBookingStatus(b.status || "Pending");
    setBookingModal(true);
  };

  const handleBookingStatusUpdate = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    setSubmitting(true);
    try {
      await api.put(`/ambulance-bookings/${editingBooking.id}/status`, { status: bookingStatus });
   
      setBookings(prev => prev.map(b => b.id === editingBooking.id ? { ...b, status: bookingStatus } : b));
      notify.success("Booking status updated");
      setBookingModal(false);
    } catch (err) {
      notify.error(err.response?.data?.message || "Error updating booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.put(`/ambulance-bookings/${id}/cancel`, { reason: "Cancelled by admin" });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "Cancelled" } : b));
      notify.success("Booking cancelled");
    } catch (err) {
      notify.error(err.response?.data?.message || "Error cancelling booking");
    }
  };

  const TABS = [
    { key:"vehicles", label:"Vehicles Fleet",       icon: FaAmbulance   },
    { key:"bookings", label:"Ambulance Bookings",   icon: FaCalendarAlt },
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f5]">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center gap-3 mb-8 fade-up">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <FaAmbulance className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Logistics & Fleet</h1>
            <p className="text-xs text-gray-400">Manage vehicles, ambulances, and transport bookings</p>
          </div>
        </div>

       
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <StatCard label="Vehicles"    value={stats.totalVehicles}   icon={FaAmbulance}         accent={{ bg:"bg-blue-50",    icon:"text-blue-500",    num:"text-blue-600"    }} />
          <StatCard label="Available"   value={stats.available}       icon={FaCheckCircle}       accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-600" }} />
          <StatCard label="In Service"  value={stats.inService}       icon={FaTruck}             accent={{ bg:"bg-sky-50",     icon:"text-sky-500",     num:"text-sky-600"     }} />
          <StatCard label="Maintenance" value={stats.maintenanceDue}  icon={FaTools}             accent={{ bg:"bg-amber-50",   icon:"text-amber-500",   num:"text-amber-600"   }} />
          <StatCard label="Bookings"    value={stats.totalBookings}   icon={FaCalendarAlt}       accent={{ bg:"bg-violet-50",  icon:"text-violet-500",  num:"text-violet-600"  }} />
          <StatCard label="Pending"     value={stats.pendingBookings} icon={FaClock}             accent={{ bg:"bg-amber-50",   icon:"text-amber-500",   num:"text-amber-600"   }} />
          <StatCard label="Assigned"    value={stats.assignedBookings}icon={FaCheckCircle}       accent={{ bg:"bg-indigo-50",  icon:"text-indigo-500",  num:"text-indigo-600"  }} />
          <StatCard label="Critical"    value={stats.criticalBookings}icon={FaExclamationTriangle}accent={{ bg:"bg-rose-50",   icon:"text-rose-500",    num:"text-rose-600"    }} />
        </div>

      
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

     
          <div className="flex border-b border-gray-100 px-2 pt-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all cursor-pointer ${
                  activeTab === key ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                }`}>
                <Icon className="text-xs" />{label}
              </button>
            ))}
          </div>

      
          {activeTab === "vehicles" && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                  <input value={searchVehicle} onChange={e => setSearchVehicle(e.target.value)}
                    placeholder="Search by plate, type, or driver…"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                </div>
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-300 text-sm" />
                  <select value={filterVStatus} onChange={e => setFilterVStatus(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600">
                    <option value="all">All Status</option>
                    <option value="Available">Available</option>
                    <option value="In Service">In Service</option>
                    <option value="In Use">In Use</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <button onClick={() => openVehicleModal()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer  transition-colors shrink-0">
                  <FaPlus className="text-xs" /> Add Vehicle
                </button>
              </div>

              {loadingVehicles ? <Spinner text="Loading vehicles…" /> : filteredVehicles.length === 0 ? (
                <EmptyState icon={FaAmbulance} text="No vehicles found" />
              ) : (
                <>
                  <DataTable
                    columns={[
                      {
                        key: "plate", label: "Plate",
                        render: (v) => (
                          <>
                            <p className="font-black text-gray-900 font-mono">{v.plate}</p>
                            {v.make && <p className="text-[10px] text-gray-400">{v.make} {v.model} {v.year}</p>}
                          </>
                        ),
                      },
                      { key: "type", label: "Type", render: (v) => <span className="text-xs text-gray-600">{v.type}</span> },
                      { key: "status", label: "Status", render: (v) => <VehicleBadge status={v.status} /> },
                      {
                        key: "driver", label: "Driver",
                        render: (v) => <span className="flex items-center gap-1.5 text-xs text-gray-600"><FaUserMd className="text-gray-300 shrink-0" />{v.driver || "—"}</span>,
                      },
                      {
                        key: "nextService", label: "Next Service",
                        render: (v) => {
                          const serviceDue = v.nextService && new Date(v.nextService) <= new Date();
                          return (
                            <span className={`text-xs font-semibold ${serviceDue ? "text-rose-600" : "text-gray-500"}`}>
                              {fmtDate(v.nextService)}
                              {serviceDue && <span className="ml-1 text-[9px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">Due!</span>}
                            </span>
                          );
                        },
                      },
                      {
                        key: "actions", label: "Actions", align: "right",
                        render: (v) => (
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openVehicleModal(v)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors" title="Edit"><FaEdit className="text-sm" /></button>
                            <button onClick={() => handleDeleteVehicle(v.id)} className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors" title="Delete"><FaTrash className="text-sm" /></button>
                          </div>
                        ),
                      },
                    ]}
                    data={filteredVehicles}
                    rowKey={(v) => v.id}
                  />
                  <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
                    <p className="text-xs text-gray-400"><span className="font-semibold text-gray-600">{filteredVehicles.length}</span> of {vehicles.length} vehicles</p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                  <input value={searchBooking} onChange={e => setSearchBooking(e.target.value)}
                    placeholder="Search by patient, status, or emergency level…"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                </div>
                <select value={filterEmergency} onChange={e => setFilterEmergency(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600">
                  <option value="all">All Levels</option>
                  <option value="critical">Critical</option>
                  <option value="urgent">Urgent</option>
                  <option value="standard">Standard</option>
                </select>
              </div>

              {loadingBookings ? <Spinner text="Loading bookings…" /> : filteredBookings.length === 0 ? (
                <EmptyState icon={FaCalendarAlt} text="No bookings found" />
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map(b => (
                    <div key={b.id} className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
                
                      <button
                        className="w-full text-left p-4 grid grid-cols-2 md:grid-cols-5 gap-4 items-center hover:bg-gray-100/60 transition-colors cursor-pointer"
                        onClick={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)}
                      >
                
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{b.patientName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">#{String(b.id ?? "").slice(-6)}</p>
                        </div>

                        <EmergencyBadge level={b.emergencyLevel} />

                        <div className="hidden md:block text-xs">
                          {(b.vehicle || b.vehicleId)
                            ? <><p className="font-semibold text-gray-800 font-mono">{(b.vehicle || b.vehicleId)?.plate || "—"}</p><p className="text-gray-400">{(b.vehicle || b.vehicleId)?.driver || "—"}</p></>
                            : <span className="text-gray-400 italic">Unassigned</span>
                          }
                        </div>

                        <BookingBadge status={b.status} />

                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <FaPhone className="text-gray-300 shrink-0" />{b.phone}
                          <FaChevronDown className={`ml-auto text-gray-300 text-xs transition-transform ${expandedBooking === b.id ? "rotate-180" : ""}`} />
                        </div>
                      </button>

          
                      {expandedBooking === b.id && (
                        <div className="border-t border-gray-200 bg-white p-5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                   
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Locations</p>
                              <p className="flex items-center gap-1.5 text-xs text-gray-700 mb-1">
                                <FaMapMarkerAlt className="text-blue-500 shrink-0" /><span className="truncate">{b.currentLocation || "—"}</span>
                              </p>
                              <p className="flex items-center gap-1.5 text-xs text-gray-700">
                                <FaMapMarkerAlt className="text-emerald-500 shrink-0" /><span className="truncate">{b.destinationHospital || "—"}</span>
                              </p>
                            </div>
   
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Medical</p>
                              <p className="text-xs text-gray-700">{b.medicalCondition || "—"}</p>
                              {b.additionalNotes && <p className="text-xs text-gray-400 mt-1">{b.additionalNotes}</p>}
                            </div>

                    
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Timeline</p>
                              <p className="text-xs text-gray-500">Booked: <span className="text-gray-700">{fmtDT(b.bookingDate)}</span></p>
                              {b.assignedAt && <p className="text-xs text-gray-500 mt-1">Assigned: <span className="text-gray-700">{fmtDT(b.assignedAt)}</span></p>}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                            <button onClick={() => openBookingModal(b)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl cursor-pointer transition-colors">
                              <FaEdit className="text-xs" /> Update Status
                            </button>
                            {b.status !== "Completed" && b.status !== "Cancelled" && (
                              <button onClick={() => handleCancelBooking(b.id)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors">
                                <FaTimes className="text-xs" /> Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <p className="text-xs text-gray-400 px-1">
                    Showing <span className="font-semibold text-gray-600">{filteredBookings.length}</span> of {bookings.length} bookings
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Vehicle Modal ── */}
      <Modal open={vehicleModal} onClose={() => setVehicleModal(false)}
        title={editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
        subtitle={editingVehicle ? "Update vehicle information" : "Register a new vehicle to the fleet"}
        size="lg">
        <form onSubmit={handleVehicleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Plate Number" required>
              <input value={vehicleForm.plate} onChange={e => setVField("plate", e.target.value)}
                placeholder="e.g., KAA 123X" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required />
            </FormField>
            <FormField label="Vehicle Type" required>
              <select value={vehicleForm.type} onChange={e => setVField("type", e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" required>
                <option value="">Select Type</option>
                {["Ambulance","Service Van","Delivery Truck","Staff Transport"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Driver Name">
              <input value={vehicleForm.driver} onChange={e => setVField("driver", e.target.value)}
                placeholder="e.g., John Kamau" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Status">
              <select value={vehicleForm.status} onChange={e => setVField("status", e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white">
                <option value="Available">Available</option>
                <option value="In Use">In Use</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </FormField>
            <FormField label="Last Service Date">
              <input type="date" value={vehicleForm.lastService} onChange={e => setVField("lastService", e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Next Service Due">
              <input type="date" value={vehicleForm.nextService} onChange={e => setVField("nextService", e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Make">
              <input value={vehicleForm.make} onChange={e => setVField("make", e.target.value)} placeholder="e.g., Toyota" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Model">
              <input value={vehicleForm.model} onChange={e => setVField("model", e.target.value)} placeholder="e.g., HiAce" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Year">
              <input type="number" value={vehicleForm.year} onChange={e => setVField("year", e.target.value)} placeholder="e.g., 2020" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
            <FormField label="Mileage (km)">
              <input type="number" value={vehicleForm.mileage} onChange={e => setVField("mileage", e.target.value)} placeholder="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white" />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setVehicleModal(false)}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer  transition-colors">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <><FaSave className="text-xs" />{editingVehicle ? "Update Vehicle" : "Add Vehicle"}</>
              }
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={bookingModal} onClose={() => setBookingModal(false)}
        title="Update Booking Status"
        subtitle={editingBooking?.patientName}
        maxW="max-w-md">
        <form onSubmit={handleBookingStatusUpdate} className="space-y-5">
          <FormField label="New Status" required>
            <select value={bookingStatus} onChange={e => setBookingStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow bg-white">
              {["Pending","Waiting","Assigned","In Transit","Arrived","Completed","Cancelled"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            Will change to: <BookingBadge status={bookingStatus} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setBookingModal(false)}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer transition-colors">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Updating…</>
                : <><FaSave className="text-xs" />Update Status</>
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LogisticsPage;

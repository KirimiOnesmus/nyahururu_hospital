import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "../../api/socket";
import api from "../../api/axios";
import {
  FaCalendarAlt, FaCheckCircle, FaTimesCircle,
  FaEye, FaClock, FaFilter, FaUserMd, FaUser, FaTimes,
  FaPhone, FaEnvelope, FaStethoscope,
} from "react-icons/fa";
import {
  Avatar, Button, DataTable, Modal, PageHeader,
  SearchBox, Spinner, EmptyState, StatCard,
  StatusBadge as SharedStatusBadge,
} from "../../common/components";
import notify from "../../common/utils/notify";

const STATUS_CONFIG = {
  confirmed: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", icon: FaCheckCircle  },
  completed: { bg: "bg-sky-100",     text: "text-sky-700",     dot: "bg-sky-500",     icon: FaCheckCircle  },
  pending:   { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-400",   icon: FaClock        },
  cancelled: { bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-400",    icon: FaTimesCircle  },
};

const scfg = (status) => STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;

const StatusBadge = ({ status }) => {
  const c = scfg(status);
  return (
    <SharedStatusBadge
      status={status}
      colors={{ bg: c.bg, text: c.text, dot: c.dot }}
      icon={c.icon}
    />
  );
};

const DetailItem = ({ icon: Icon, color, label, value }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${color}`}>
      <Icon className="text-[10px]" />{label}
    </p>
    <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
  </div>
);

const fmtDate = (d, opts = { day: "2-digit", month: "short", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("en-KE", opts) : "—";


const AppointmentPage = () => {
  const [appointments,       setAppointments]       = useState([]);
  const [loading,            setLoading]            = useState(false);
  const [search,             setSearch]             = useState("");
  const [filterStatus,       setFilterStatus]       = useState("all");
  const [selectedAppointment,setSelectedAppointment]= useState(null);
  const [showModal,          setShowModal]          = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/appointments");
      setAppointments(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      notify.error(err.response?.data?.message || "Error fetching appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

 
  useSocket("appointments:created", fetchAppointments);
  useSocket("appointments:updated", fetchAppointments);
  useSocket("appointments:deleted", fetchAppointments);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return appointments.filter(a => {
      const matchSearch =
        a.patientName?.toLowerCase().includes(q) ||
        a.doctorId?.specialty?.toLowerCase().includes(q) ||
        a.service?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || a.status?.toLowerCase() === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [appointments, search, filterStatus]);

  const stats = useMemo(() => ({
    total:     appointments.length,
    confirmed: appointments.filter(a => a.status?.toLowerCase() === "confirmed").length,
    pending:   appointments.filter(a => a.status?.toLowerCase() === "pending").length,
    cancelled: appointments.filter(a => a.status?.toLowerCase() === "cancelled").length,
  }), [appointments]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status: status.toLowerCase() });
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: status.toLowerCase() } : a)
      );
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(p => ({ ...p, status: status.toLowerCase() }));
      }
      notify.success(`Appointment ${status.toLowerCase()}`);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const openModal  = (appt) => { setSelectedAppointment(appt); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const ActionButtons = ({ appt, compact = false }) => {
    const status = appt.status?.toLowerCase();
    const btnCls = compact
      ? "p-2 rounded-xl transition-colors cursor-pointer"
      : "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer";

    return (
      <>
        {status !== "confirmed" && (
          <button onClick={() => updateStatus(appt.id, "confirmed")} className={`${btnCls} text-emerald-600 hover:bg-emerald-50`} title="Confirm">
            <FaCheckCircle className={compact ? "text-sm" : ""} />
            {!compact && "Confirm"}
          </button>
        )}
        {status !== "completed" && status !== "cancelled" && (
          <button onClick={() => updateStatus(appt.id, "completed")} className={`${btnCls} text-sky-600 hover:bg-sky-50`} title="Mark completed">
            <FaCalendarAlt className={compact ? "text-sm" : ""} />
            {!compact && "Complete"}
          </button>
        )}
        {status !== "cancelled" && (
          <button onClick={() => { if (window.confirm("Cancel this appointment?")) updateStatus(appt.id, "cancelled"); }} className={`${btnCls} text-rose-500 hover:bg-rose-50`} title="Cancel">
            <FaTimesCircle className={compact ? "text-sm" : ""} />
            {!compact && "Cancel"}
          </button>
        )}
      </>
    );
  };

  const columns = [
    {
      key: "patient", label: "Patient", priority: "A", mobileSlot: "identity",
      render: (appt) => (
        <div className="flex items-center gap-3">
          <Avatar name={appt.patientName} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{appt.patientName || "—"}</p>
            <p className="text-[10px] text-gray-400 truncate">{appt.patientEmail || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "service", label: "Service / Doctor", priority: "B", mobileSlot: "meta",
      render: (appt) => (
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <FaUserMd className="text-gray-300 shrink-0" />
          {appt.doctorId?.specialty || appt.service || "—"}
        </span>
      ),
    },
    {
      key: "date", label: "Date & Time", priority: "B", mobileSlot: "value",
      render: (appt) => (
        <>
          <p className="text-sm font-semibold text-gray-800">{fmtDate(appt.appointmentDate || appt.date)}</p>
          <p className="text-[10px] text-gray-400">{appt.time || "—"}</p>
        </>
      ),
    },
    {
      key: "status", label: "Status", priority: "A", mobileSlot: "status",
      render: (appt) => <StatusBadge status={appt.status} />,
    },
    {
      key: "actions", label: "Actions", align: "right", priority: "A", mobileSlot: "actions",
      render: (appt) => (
        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button onClick={() => openModal(appt)} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer" title="View Details">
            <FaEye className="text-sm" />
          </button>
          <ActionButtons appt={appt} compact />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        <PageHeader
          title="Appointment Management"
          subtitle="View and manage all patient appointments"
          icon={FaCalendarAlt}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total"     value={stats.total}     icon={FaCalendarAlt}  accent={{ bg:"bg-blue-50",    icon:"text-blue-500",    num:"text-blue-700"    }} />
          <StatCard label="Confirmed" value={stats.confirmed} icon={FaCheckCircle}  accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-700" }} />
          <StatCard label="Pending"   value={stats.pending}   icon={FaClock}        accent={{ bg:"bg-amber-50",   icon:"text-amber-500",   num:"text-amber-700"   }} />
          <StatCard label="Cancelled" value={stats.cancelled} icon={FaTimesCircle}  accent={{ bg:"bg-rose-50",    icon:"text-rose-500",    num:"text-rose-700"    }} />
        </div>

   
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex flex-col md:flex-row gap-3">
          <SearchBox
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search by patient name, email, or service…"
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-300 text-sm" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-600"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {(search || filterStatus !== "all") && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 self-center">
              <span className="font-semibold text-gray-700">{filtered.length}</span> of {appointments.length}
              <button onClick={() => { setSearch(""); setFilterStatus("all"); }} className="ml-1 text-gray-300 hover:text-rose-400 cursor-pointer transition-colors">
                <FaTimes />
              </button>
            </div>
          )}
        </div>

       
        <div className="flex flex-wrap gap-2 mb-5">
          {["all", "pending", "confirmed", "completed", "cancelled"].map(s => {
            const c = s === "all" ? null : scfg(s);
            const count = s === "all" ? appointments.length : appointments.filter(a => a.status?.toLowerCase() === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  filterStatus === s
                    ? s === "all"
                      ? "bg-gray-800 text-white border-gray-800"
                      : `${c.bg} ${c.text} border-transparent ring-2 ring-offset-1 ring-blue-400`
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filterStatus === s ? "bg-white/30" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

   
        {loading ? (
          <Spinner text="Loading appointments…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            text={search || filterStatus !== "all" ? "No appointments match your filters" : "No appointments yet"}
            icon={FaCalendarAlt}
          />
        ) : (
          <>
            <DataTable columns={columns} data={filtered} rowKey={(appt) => appt.id} />
            <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{appointments.length}</span> appointments
              </p>
            </div>
          </>
        )}
      </div>

   
      <Modal open={showModal} onClose={closeModal} size="lg">
        {selectedAppointment && (
          <>
           
            <div className={`-mx-6 -mt-6 px-6 py-5 rounded-t-2xl mb-6 ${scfg(selectedAppointment.status).bg}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Appointment Details</p>
              <h3 className="text-xl font-bold text-gray-900">{selectedAppointment.patientName || "Unknown Patient"}</h3>
              <div className="mt-2"><StatusBadge status={selectedAppointment.status} /></div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <DetailItem icon={FaUser}        color="text-blue-400"    label="Patient Name"    value={selectedAppointment.patientName || selectedAppointment.name} />
                <DetailItem icon={FaEnvelope}    color="text-indigo-400"  label="Email"           value={selectedAppointment.email} />
                <DetailItem icon={FaPhone}       color="text-emerald-400" label="Phone"           value={selectedAppointment.phone} />
                <DetailItem icon={FaStethoscope} color="text-violet-400"  label="Service / Doctor"value={selectedAppointment.doctorId?.specialty || selectedAppointment.service} />
                <DetailItem icon={FaCalendarAlt} color="text-amber-400"   label="Date"            value={fmtDate(selectedAppointment.appointmentDate || selectedAppointment.date, { day:"2-digit", month:"long", year:"numeric" })} />
                <DetailItem icon={FaClock}       color="text-sky-400"     label="Time"            value={selectedAppointment.time} />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-100">
                <ActionButtons appt={selectedAppointment} compact={false} />
                <Button variant="secondary" onClick={closeModal}>Close</Button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AppointmentPage;

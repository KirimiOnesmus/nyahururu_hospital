import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../api/axios";
import {
  FaTint,
  FaUsers,
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaChevronDown,
  FaEdit,
  FaTrash,
  FaSave,
  FaMale,
  FaFemale,
  FaWeight,
  FaBirthdayCake,
  FaSearch,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const STATUS_CONFIG = {
  registered: {
    label: "Registered",
    bg: "bg-sky-100",
    text: "text-sky-700",
    dot: "bg-sky-400",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-violet-100",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-rose-100",
    text: "text-rose-700",
    dot: "bg-rose-400",
  },
  deferred: {
    label: "Deferred",
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.registered;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const BloodBadge = ({ group }) =>
  group ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-full text-xs font-black tracking-wide">
      <FaTint className="text-[9px]" />
      {group}
    </span>
  ) : (
    <span className="text-gray-400 text-xs italic">Unknown</span>
  );

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-10 h-10 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-400 font-medium">Loading…</p>
  </div>
);

const Empty = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
      <Icon className="text-2xl text-gray-300" />
    </div>
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent.bg}`}
    >
      <Icon className={`text-xl ${accent.icon}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-black ${accent.num}`}>{value ?? 0}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Blood group distribution bar ───────────────────────────────────────────────
const BloodDistribution = ({ stats }) => {
  const max = Math.max(
    ...BLOOD_GROUPS.map((bg) => stats.find((s) => s._id === bg)?.count || 0),
    1,
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <FaTint className="text-red-500" />
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
          Blood Group Distribution
        </h3>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {BLOOD_GROUPS.map((bg) => {
          const count = stats.find((s) => s._id === bg)?.count || 0;

          return (
            <div
              key={bg}
              className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="w-full  h-24 flex flex-col justify-end overflow-hidden">
                <span className="text-2xl font-bold text-red-600">{bg}</span>
                <span className="text-sm text-gray-600 mt-1">{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DonorRow = ({ donor, expanded, onToggle, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl overflow-hidden  transition-all">
    <button
      className="w-full text-left p-4 grid grid-cols-2 md:grid-cols-6 gap-4 items-center hover:bg-gray-50/80 transition-colors cursor-pointer"
      onClick={onToggle}
    >
      <div className="col-span-2 md:col-span-1 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-sm shrink-0">
          {donor.fullName?.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {donor.fullName}
          </p>
          <p className="text-[10px] text-gray-400 font-mono">{donor.donorId}</p>
        </div>
      </div>

      <div className="hidden md:block">
        <BloodBadge group={donor.bloodGroup} />
      </div>

      <div className="hidden md:flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <FaPhone className="text-gray-300 text-[10px]" />
          {donor.phone}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400 truncate">
          <FaEnvelope className="text-gray-300 text-[10px] shrink-0" />
          {donor.email}
        </span>
      </div>

      {/* Demographics */}
      <div className="hidden md:flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs text-gray-600 capitalize">
          {donor.gender === "male" ? (
            <FaMale className="text-blue-400" />
          ) : (
            <FaFemale className="text-pink-400" />
          )}
          {donor.gender}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <FaBirthdayCake className="text-gray-300 text-[10px]" />
          {donor.age} yrs
        </span>
      </div>

      {/* Date */}
      <div className="hidden md:block">
        <p className="text-xs font-semibold text-gray-800">
          {new Date(donor.donationDate).toLocaleDateString("en-KE", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <p className="text-[10px] text-gray-400">{donor.donationTime}</p>
      </div>

      <div className="flex items-center justify-between md:justify-start gap-3">
        <StatusBadge status={donor.status} />
        <FaChevronDown
          className={`text-gray-300 text-xs transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </div>
    </button>

    {expanded && (
      <div className="border-t border-gray-100 bg-gray-50/60 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Personal
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <FaIdCard className="text-gray-300 shrink-0" />
                <span className="text-gray-400 text-xs">National ID:</span>
                <span className="font-medium text-xs">
                  {donor.nationalId || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FaWeight className="text-gray-300 shrink-0" />
                <span className="text-gray-400 text-xs">Weight:</span>
                <span className="font-medium text-xs">
                  {donor.weight ? `${donor.weight} kg` : "—"}
                </span>
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Medical
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400 mb-1">Health Conditions</p>
                <p className="text-gray-800">
                  {donor.healthConditions || "None reported"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Medications</p>
                <p className="text-gray-800">
                  {donor.medications || "None reported"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => onEdit(donor)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <FaEdit /> Update Status
          </button>
          <button
            onClick={() => onDelete(donor.donorId)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    )}
  </div>
);

// ── Modal shell ────────────────────────────────────────────────────────────────
const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxW = "max-w-lg",
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}
        style={{ animation: "modalPop .22s cubic-bezier(.34,1.56,.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <FaTimes className="text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const Donations = () => {
  const [donors, setDonors] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [stats, setStats] = useState(null);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("donors");
  const [expandedDonor, setExpandedDonor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBG, setFilterBG] = useState("");
  const [filterGender, setFilterGender] = useState("");

  // Status modal
  const [statusModal, setStatusModal] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: "",
    registrationStatus: "",
  });

  // Urgent modal
  const [urgentModal, setUrgentModal] = useState(false);
  const [editingUrgent, setEditingUrgent] = useState(null);
  const [urgentForm, setUrgentForm] = useState({
    bloodGroups: [],
    message: "",
    contactNumber: "",
    isActive: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [donorsRes, upcomingRes, statsRes, urgentRes] = await Promise.all([
        api.get("/blood-donation", {
          params: {
            status: filterStatus || undefined,
            bloodGroup: filterBG || undefined,
            gender: filterGender || undefined,
          },
        }),
        api.get("/blood-donation/schedule/upcoming"),
        api.get("/blood-donation/reports/statistics"),
        api.get("/urgent-request"),
      ]);
      setDonors(donorsRes.data.data || []);
      setUpcoming(upcomingRes.data.data || []);
      setStats(statsRes.data.data || {});
      setUrgentRequests(urgentRes.data.data || []);
    } catch {
      toast.error("Failed to load donation data");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterBG, filterGender]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculatedStats = useMemo(
    () => ({
      total: stats?.totalDonors || 0,
      byBloodGroup: stats?.bloodGroupStats || [],
      byStatus: stats?.statusStats || [],
    }),
    [stats],
  );

  const filteredDonors = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return donors.filter(
      (d) =>
        d.fullName?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.phone?.includes(q) ||
        d.donorId?.toLowerCase().includes(q) ||
        d.bloodGroup?.toLowerCase().includes(q),
    );
  }, [donors, searchTerm]);

  const openStatusModal = (donor) => {
    setEditingDonor(donor);
    setStatusForm({
      status: donor.status || "registered",
      registrationStatus: donor.registrationStatus || "pending",
    });
    setStatusModal(true);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!editingDonor) return;
    try {
      await api.patch(
        `/blood-donation/${editingDonor.donorId}/status`,
        statusForm,
      );
      toast.success("Status updated");
      setStatusModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteDonor = async (donorId) => {
    if (!window.confirm("Delete this donor?")) return;
    try {
      await api.delete(`/blood-donation/${donorId}`);
      toast.success("Donor deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete donor");
    }
  };

  const openUrgentModal = (req = null) => {
    setEditingUrgent(req);
    setUrgentForm(
      req
        ? {
            bloodGroups: req.bloodGroups || [],
            message: req.message || "",
            contactNumber: req.contactNumber || "",
            isActive: req.isActive ?? true,
          }
        : {
            bloodGroups: [],
            message: "",
            contactNumber: "+254 700 123 456",
            isActive: true,
          },
    );
    setUrgentModal(true);
  };

  const toggleBloodGroup = (bg) =>
    setUrgentForm((prev) => ({
      ...prev,
      bloodGroups: prev.bloodGroups.includes(bg)
        ? prev.bloodGroups.filter((b) => b !== bg)
        : [...prev.bloodGroups, bg],
    }));

  const handleUrgentSubmit = async () => {
    if (!urgentForm.bloodGroups.length) {
      toast.error("Select at least one blood group");
      return;
    }
    if (!urgentForm.message.trim()) {
      toast.error("Message is required");
      return;
    }
    if (!urgentForm.contactNumber.trim()) {
      toast.error("Contact number is required");
      return;
    }
    try {
      if (editingUrgent) {
        await api.put(`/urgent-request/${editingUrgent._id}`, urgentForm);
        toast.success("Urgent request updated");
      } else {
        await api.post("/urgent-request", urgentForm);
        toast.success("Urgent request created");
      }
      setUrgentModal(false);
      fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to save urgent request",
      );
    }
  };

  const handleDeleteUrgent = async (id) => {
    if (!window.confirm("Delete this urgent request?")) return;
    try {
      await api.delete(`/urgent-request/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const toggleUrgentStatus = async (id, current) => {
    try {
      await api.patch(`/urgent-request/${id}/toggle`, { isActive: !current });
      toast.success(`Request ${!current ? "activated" : "deactivated"}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle");
    }
  };

  const TABS = [
    { key: "donors", label: "All Donors", icon: FaUsers },
    { key: "upcoming", label: "Upcoming", icon: FaCalendarCheck },
    { key: "urgent", label: "Urgent Requests", icon: FaExclamationTriangle },
  ];

  const completedCount =
    calculatedStats.byStatus.find((s) => s._id === "completed")?.count || 0;
  const registeredCount =
    calculatedStats.byStatus.find((s) => s._id === "registered")?.count || 0;

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <style>{`
        @keyframes modalPop {
          from { opacity:0; transform:scale(0.94) translateY(10px); }
          to   { opacity:1; transform:scale(1)    translateY(0);    }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0);   }
        }
        .fade-up { animation: fadeUp .3s ease both; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 fade-up">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-200">
              <FaTint className="text-white text-lg" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Blood Donation
            </h1>
          </div>
          <p className="text-sm text-gray-400 ml-13 pl-0.5">
            Manage donors, track donations, monitor urgent requests
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Donors"
            value={calculatedStats.total}
            icon={FaUsers}
            accent={{
              bg: "bg-red-50",
              icon: "text-red-500",
              num: "text-red-600",
            }}
          />
          <StatCard
            label="Upcoming"
            value={upcoming.length}
            icon={FaCalendarCheck}
            accent={{
              bg: "bg-sky-50",
              icon: "text-sky-500",
              num: "text-sky-600",
            }}
          />
          <StatCard
            label="Completed"
            value={completedCount}
            icon={FaCheckCircle}
            accent={{
              bg: "bg-emerald-50",
              icon: "text-emerald-500",
              num: "text-emerald-600",
            }}
          />
          <StatCard
            label="Registered"
            value={registeredCount}
            icon={FaClock}
            accent={{
              bg: "bg-violet-50",
              icon: "text-violet-500",
              num: "text-violet-600",
            }}
          />
        </div>

        <div className="mb-6">
          <BloodDistribution stats={calculatedStats.byBloodGroup} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 px-2 pt-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all cursor-pointer ${
                  activeTab === key
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="text-xs" />
                {label}
                {key === "urgent" &&
                  urgentRequests.filter((r) => r.isActive).length > 0 && (
                    <span className="ml-1 w-4 h-4 bg-white/30 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {urgentRequests.filter((r) => r.isActive).length}
                    </span>
                  )}
              </button>
            ))}
          </div>

          {activeTab === "donors" && (
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, email, phone, ID, blood group…"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    {
                      val: filterStatus,
                      set: setFilterStatus,
                      opts: [
                        ["", "All Status"],
                        ["registered", "Registered"],
                        ["confirmed", "Confirmed"],
                        ["completed", "Completed"],
                        ["cancelled", "Cancelled"],
                        ["deferred", "Deferred"],
                      ],
                    },
                    {
                      val: filterBG,
                      set: setFilterBG,
                      opts: [
                        ["", "All Blood Groups"],
                        ...BLOOD_GROUPS.map((b) => [b, b]),
                      ],
                    },
                    // { val: filterGender, set: setFilterGender, opts: [["","All Genders"],["male","Male"],["female","Female"],["other","Other"]] },
                  ].map(({ val, set, opts }, i) => (
                    <select
                      key={i}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer outline-none focus:ring-2 focus:ring-red-400 bg-white text-gray-600"
                    >
                      {opts.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>

              {loading ? (
                <Spinner />
              ) : filteredDonors.length === 0 ? (
                <Empty icon={FaUsers} text="No donors found" />
              ) : (
                <div className="space-y-3">
                  {filteredDonors.map((donor) => (
                    <DonorRow
                      key={donor._id}
                      donor={donor}
                      expanded={expandedDonor === donor._id}
                      onToggle={() =>
                        setExpandedDonor(
                          expandedDonor === donor._id ? null : donor._id,
                        )
                      }
                      onEdit={openStatusModal}
                      onDelete={handleDeleteDonor}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── UPCOMING TAB ── */}
          {activeTab === "upcoming" && (
            <div className="p-6">
              {loading ? (
                <Spinner />
              ) : upcoming.length === 0 ? (
                <Empty
                  icon={FaCalendarCheck}
                  text="No upcoming donations scheduled"
                />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((d) => (
                    <div
                      key={d._id}
                      className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <FaTint className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">
                          {d.fullName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <BloodBadge group={d.bloodGroup} />
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FaPhone className="text-[10px]" />
                            {d.phone}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">Scheduled</p>
                        <p className="text-sm font-bold text-gray-800">
                          {new Date(d.donationDate).toLocaleDateString(
                            "en-KE",
                            { day: "numeric", month: "short" },
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {d.donationTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── URGENT TAB ── */}
          {activeTab === "urgent" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">
                    Urgent Blood Requests
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Displayed live on the public donation page
                  </p>
                </div>
                <button
                  onClick={() => openUrgentModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-200 cursor-pointer"
                >
                  <FaPlus className="text-xs" /> New Request
                </button>
              </div>

              {loading ? (
                <Spinner />
              ) : urgentRequests.length === 0 ? (
                <Empty icon={FaExclamationTriangle} text="No urgent requests" />
              ) : (
                <div className="space-y-4">
                  {urgentRequests.map((req) => (
                    <div
                      key={req._id}
                      className={`rounded-2xl border p-5 transition-all ${req.isActive ? "border-red-200 bg-red-50/60" : "border-gray-200 bg-gray-50"}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {req.isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-xs font-black rounded-full animate-pulse">
                                <FaExclamationTriangle className="text-[10px]" />
                                ACTIVE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-500 text-xs font-semibold rounded-full">
                                INACTIVE
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {new Date(req.createdAt).toLocaleString("en-KE")}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {req.bloodGroups.map((bg) => (
                              <BloodBadge key={bg} group={bg} />
                            ))}
                          </div>
                          <p className="text-sm text-gray-800 mb-2">
                            {req.message}
                          </p>
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                            <FaPhone className="text-gray-400 text-xs" />
                            {req.contactNumber}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() =>
                              toggleUrgentStatus(req._id, req.isActive)
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${req.isActive ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
                          >
                            {req.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => openUrgentModal(req)}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            <FaEdit className="inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUrgent(req._id)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                          >
                            <FaTrash className="inline mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Status Modal ── */}
      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title="Update Donor Status"
        subtitle={editingDonor?.fullName}
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          {[
            {
              label: "Donation Status",
              key: "status",
              opts: [
                ["registered", "Registered"],
                ["confirmed", "Confirmed"],
                ["completed", "Completed"],
                ["cancelled", "Cancelled"],
                ["deferred", "Deferred"],
              ],
            },
            {
              label: "Registration Status",
              key: "registrationStatus",
              opts: [
                ["pending", "Pending Review"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
              ],
            },
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                {label}
              </label>
              <select
                value={statusForm[key]}
                onChange={(e) =>
                  setStatusForm((p) => ({ ...p, [key]: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400 cursor-pointer bg-white"
              >
                {opts.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStatusModal(false)}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
            >
              <FaSave /> Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Urgent Modal ── */}
      <Modal
        open={urgentModal}
        onClose={() => setUrgentModal(false)}
        title={editingUrgent ? "Edit Urgent Request" : "Create Urgent Request"}
        subtitle="Displayed live on the public donation page"
        maxW="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Blood group picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
              Blood Groups Needed *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => toggleBloodGroup(bg)}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border-2 flex items-center justify-center gap-1 ${
                    urgentForm.bloodGroups.includes(bg)
                      ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-200"
                      : "bg-white border-gray-200 text-gray-600 hover:border-red-300"
                  }`}
                >
                  <FaTint className="text-[10px]" />
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
              Urgent Message *
            </label>
            <textarea
              value={urgentForm.message}
              onChange={(e) =>
                setUrgentForm((p) => ({ ...p, message: e.target.value }))
              }
              rows={3}
              placeholder="e.g., Blood Needed Immediately at Nyahururu Hospital!"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
              Contact Number *
            </label>
            <input
              value={urgentForm.contactNumber}
              onChange={(e) =>
                setUrgentForm((p) => ({ ...p, contactNumber: e.target.value }))
              }
              placeholder="+254 700 123 456"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={urgentForm.isActive}
                onChange={(e) =>
                  setUrgentForm((p) => ({ ...p, isActive: e.target.checked }))
                }
                className="sr-only"
              />
              <div
                className={`w-10 h-6 rounded-full transition-colors ${urgentForm.isActive ? "bg-red-500" : "bg-gray-200"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${urgentForm.isActive ? "translate-x-5" : "translate-x-1"}`}
                />
              </div>
            </div>
            <span className="text-sm text-gray-700">
              Display on public website (Active)
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setUrgentModal(false)}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUrgentSubmit}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors cursor-pointer shadow-sm shadow-red-200"
            >
              <FaSave />
              {editingUrgent ? "Update Request" : "Create Request"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Donations;

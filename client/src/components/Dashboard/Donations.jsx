import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSocket } from "../../api/socket";
import api from "../../api/axios";
import { Link } from "react-router-dom";
import {
  FaTint,
  FaUsers,
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPhone,
  FaEnvelope,
  FaChevronDown,
  FaEdit,
  FaTrash,
  FaSave,
  FaSearch,
  FaPlus,
} from "react-icons/fa";
import notify from "../../common/utils/notify";
import {
  Modal, Spinner, EmptyState, StatCard,
} from "../../common/components";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const getLocalVisitDetails = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return {
    donationDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    donationTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
};

const createWalkInForm = () => ({
  fullName: "",
  email: "",
  phone: "",
  ...getLocalVisitDetails(),
  age: "",
  gender: "",
  weight: "",
  bloodGroup: "",
  healthConditions: "",
  medications: "",
  consentDonate: false,
  consentTest: false,
  consentTerms: false,
  consentPrivacy: false,
});

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

const LocalStatusBadge = ({ status }) => {
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


const BloodDistribution = ({ stats }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <FaTint className="text-red-500" />
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
          Reported blood groups (counts of 5+)
        </h3>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {BLOOD_GROUPS.map((bg) => {
          const count = stats.find((s) => s.id === bg)?.count;

          return (
            <div
              key={bg}
              className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="w-full  h-24 flex flex-col justify-end overflow-hidden">
                <span className="text-2xl font-bold text-red-600">{bg}</span>
                <span className="text-sm text-gray-600 mt-1">{count ?? "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DonorRow = ({ donor, expanded, onToggle, onEdit, onDelete, canManage, canDelete, canViewScreening, screening, screeningLoading, onToggleScreening }) => (
  <div className="bg-white rounded-2xl overflow-hidden  transition-all">
    <button
      className="w-full text-left p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-center hover:bg-gray-50/80 transition-colors cursor-pointer"
      onClick={onToggle}
    >
      <div className="col-span-2 md:col-span-1 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-danger flex items-center justify-center text-white font-black text-sm shrink-0">
          {donor.fullName?.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {donor.fullName}
          </p>
          <p className="text-[10px] text-gray-400 font-mono">{donor.donorId}</p>
          {donor.registrationSource === "office" && <span className="text-[10px] font-semibold text-red-600">Office walk-in</span>}
        </div>
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
        <LocalStatusBadge status={donor.status} />
        <FaChevronDown
          className={`text-gray-300 text-xs transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </div>
    </button>

    {expanded && (
      <div className="border-t border-gray-100 bg-gray-50/60 p-5">
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Consent record · Donor privacy notice v{donor.consentPrivacyVersion || "—"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
            {[
              ["Privacy notice acknowledged", donor.consentPrivacy, donor.consentPrivacyAt],
              ["Donation consent recorded", donor.consentDonate, donor.consentDonateAt],
              ["Testing consent recorded", donor.consentTest, donor.consentTestAt],
              ["Terms accepted", donor.consentTerms, donor.consentTermsAt],
            ].map(([label, accepted, recordedAt]) => (
              <p key={label}>
                <span className="font-semibold">{label}:</span>{" "}
                {accepted && recordedAt
                  ? new Date(recordedAt).toLocaleString("en-KE")
                  : "Not recorded"}
              </p>
            ))}
          </div>
        </div>
        {canViewScreening && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-amber-900">Restricted screening details</p>
                <p className="text-[11px] text-amber-800">Access is recorded in the audit log.</p>
              </div>
              <button type="button" onClick={() => onToggleScreening(donor.donorId)} className="px-3 py-2 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100">
                {screeningLoading ? "Loading…" : screening ? "Hide details" : "View details"}
              </button>
            </div>
            {screening && (
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
                <div><dt className="font-semibold">Age</dt><dd>{screening.age ?? "Not recorded"}</dd></div>
                <div><dt className="font-semibold">Gender</dt><dd>{screening.gender || "Not recorded"}</dd></div>
                <div><dt className="font-semibold">Weight</dt><dd>{screening.weight ? `${screening.weight} kg` : "Not recorded"}</dd></div>
                <div><dt className="font-semibold">Blood group</dt><dd>{screening.bloodGroup || "Not recorded"}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold">Health conditions</dt><dd>{screening.healthConditions || "Not recorded"}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold">Medications</dt><dd>{screening.medications || "Not recorded"}</dd></div>
              </dl>
            )}
          </div>
        )}
        {(canManage || canDelete) && (
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            {canManage && (
              <button
                onClick={() => onEdit(donor)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <FaEdit /> Update Status
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(donor.donorId)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <FaTrash /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    )}
  </div>
);


const Donations = () => {
  const currentRole = localStorage.getItem("role");
  const canManageDonors = ["admin", "blood_donation"].includes(currentRole);
  const canDeleteRecords = currentRole === "admin";
  const canViewScreening = currentRole === "blood_donation";
  const canRegisterWalkIn = currentRole === "blood_donation";
  const [donors, setDonors] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [stats, setStats] = useState(null);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("donors");
  const [expandedDonor, setExpandedDonor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [donorPage, setDonorPage] = useState(1);
  const [donorPagination, setDonorPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const fetchSequence = useRef(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [walkInModal, setWalkInModal] = useState(false);
  const [walkInSaving, setWalkInSaving] = useState(false);
  const [walkInForm, setWalkInForm] = useState(createWalkInForm);
  const [screeningDetails, setScreeningDetails] = useState({});
  const [screeningLoadingId, setScreeningLoadingId] = useState(null);

  const [statusModal, setStatusModal] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: "",
    registrationStatus: "",
  });

  const [urgentModal, setUrgentModal] = useState(false);
  const [editingUrgent, setEditingUrgent] = useState(null);
  const [urgentForm, setUrgentForm] = useState({
    bloodGroups: [],
    message: "",
    contactNumber: "",
    isActive: true,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setDonorPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    const requestSequence = ++fetchSequence.current;
    setLoading(true);
    try {
      const [donorsRes, upcomingRes, statsRes, urgentRes] = await Promise.all([
        api.get("/blood-donation", {
          params: {
            status: filterStatus || undefined,
            search: debouncedSearchTerm || undefined,
            page: donorPage,
            limit: donorPagination.limit,
          },
        }),
        api.get("/blood-donation/schedule/upcoming"),
        api.get("/blood-donation/reports/statistics"),
        api.get("/urgent-request"),
      ]);
      if (requestSequence !== fetchSequence.current) return;
      setDonors(donorsRes.data.data || []);
      setDonorPagination(donorsRes.data.pagination || { total: 0, page: 1, limit: 10, pages: 0 });
      setUpcoming(upcomingRes.data.data || []);
      setStats(statsRes.data.data || {});
      setUrgentRequests(urgentRes.data.data || []);
    } catch {
      if (requestSequence === fetchSequence.current) notify.error("Failed to load donation data");
    } finally {
      if (requestSequence === fetchSequence.current) setLoading(false);
    }
  }, [debouncedSearchTerm, donorPage, donorPagination.limit, filterStatus]);

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

  useEffect(() => {
    const lastPage = Math.max(1, donorPagination.pages);
    if (donorPage > lastPage) {
      setDonorPage(lastPage);
    }
  }, [donorPage, donorPagination.pages]);

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
      notify.success("Status updated");
      setStatusModal(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteDonor = async (donorId) => {
    if (!window.confirm("Delete this donor?")) return;
    try {
      await api.delete(`/blood-donation/${donorId}`);
      notify.success("Donor deleted");
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete donor");
    }
  };

  const handleWalkInChange = (event) => {
    const { name, value, type, checked } = event.target;
    setWalkInForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleWalkInSubmit = async (event) => {
    event.preventDefault();
    setWalkInSaving(true);
    try {
      const response = await api.post("/blood-donation/office-register", {
        ...walkInForm,
        age: Number(walkInForm.age),
        weight: Number(walkInForm.weight),
      });
      notify.success(`Walk-in donor recorded · ${response.data.data.donorId}`);
      setWalkInModal(false);
      setWalkInForm(createWalkInForm());
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to record walk-in donor");
    } finally {
      setWalkInSaving(false);
    }
  };

  const toggleDonorScreening = async (donorId) => {
    if (screeningDetails[donorId]) {
      setScreeningDetails((current) => {
        const next = { ...current };
        delete next[donorId];
        return next;
      });
      return;
    }
    setScreeningLoadingId(donorId);
    try {
      const response = await api.get(`/blood-donation/${donorId}/screening`);
      setScreeningDetails((current) => ({ ...current, [donorId]: response.data.data }));
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to load screening details");
    } finally {
      setScreeningLoadingId(null);
    }
  };

  const openUrgentModal = (req = null) => {
    setEditingUrgent(req);
    setUrgentForm(
      req
        ? {
            bloodGroups: typeof req.bloodGroups === "string" ? JSON.parse(req.bloodGroups) : (req.bloodGroups || []),
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
      notify.error("Select at least one blood group");
      return;
    }
    if (!urgentForm.message.trim()) {
      notify.error("Message is required");
      return;
    }
    if (!urgentForm.contactNumber.trim()) {
      notify.error("Contact number is required");
      return;
    }
    try {
      if (editingUrgent) {
        await api.put(`/urgent-request/${editingUrgent.id}`, urgentForm);
        notify.success("Urgent request updated");
      } else {
        await api.post("/urgent-request", urgentForm);
        notify.success("Urgent request created");
      }
      setUrgentModal(false);
      fetchData();
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to save urgent request",
      );
    }
  };

  const handleDeleteUrgent = async (id) => {
    if (!window.confirm("Delete this urgent request?")) return;
    try {
      await api.delete(`/urgent-request/${id}`);
      notify.success("Deleted");
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const toggleUrgentStatus = async (id, current) => {
    try {
      await api.patch(`/urgent-request/${id}/toggle`, { isActive: !current });
      notify.success(`Request ${!current ? "activated" : "deactivated"}`);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to toggle");
    }
  };

  const TABS = [
    { key: "donors", label: "All Donors", icon: FaUsers },
    { key: "upcoming", label: "Upcoming", icon: FaCalendarCheck },
    { key: "urgent", label: "Urgent Requests", icon: FaExclamationTriangle },
  ];

  const completedCount =
    calculatedStats.byStatus.find((s) => s.id === "completed")?.count || 0;
  const registeredCount =
    calculatedStats.byStatus.find((s) => s.id === "registered")?.count || 0;

  return (
    <div className="min-h-screen bg-canvas">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 fade-up flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-red-200">
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
          {canRegisterWalkIn && (
            <button type="button" onClick={() => { setWalkInForm(createWalkInForm()); setWalkInModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 shadow-sm">
              <FaPlus className="text-xs" /> Register walk-in donor
            </button>
          )}
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

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 px-2 pt-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all cursor-pointer ${
                  activeTab === key
                    ? "bg-red-600 text-white"
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
                  placeholder="Search name, email, phone, or donor reference…"
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
                   
                  ].map(({ val, set, opts }, i) => (
                    <select
                      key={i}
                      value={val}
                      onChange={(e) => {
                        set(e.target.value);
                        setDonorPage(1);
                      }}
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
              ) : donors.length === 0 ? (
                <EmptyState icon={FaUsers} text="No donors found" />
              ) : (
                <div className="space-y-3">
                  {donors.map((donor) => (
                    <DonorRow
                      key={donor.donorId}
                      donor={donor}
                      expanded={expandedDonor === donor.donorId}
                      onToggle={() =>
                        setExpandedDonor(
                          expandedDonor === donor.donorId ? null : donor.donorId,
                        )
                      }
                      onEdit={openStatusModal}
                      onDelete={handleDeleteDonor}
                      canManage={canManageDonors}
                      canDelete={canDeleteRecords}
                      canViewScreening={canViewScreening}
                      screening={screeningDetails[donor.donorId]}
                      screeningLoading={screeningLoadingId === donor.donorId}
                      onToggleScreening={toggleDonorScreening}
                    />
                  ))}
                </div>
              )}

              {!loading && (
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500" aria-live="polite">
                    {donorPagination.total === 0
                      ? "No donors to display"
                      : `Showing ${(donorPage - 1) * donorPagination.limit + 1}–${Math.min(donorPage * donorPagination.limit, donorPagination.total)} of ${donorPagination.total} donors`}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDonorPage((page) => Math.max(1, page - 1))}
                      disabled={donorPage <= 1}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500 px-1">
                      Page {donorPage} of {Math.max(1, donorPagination.pages)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDonorPage((page) => page + 1)}
                      disabled={donorPagination.pages === 0 || donorPage >= donorPagination.pages}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === "upcoming" && (
            <div className="p-6">
              {loading ? (
                <Spinner />
              ) : upcoming.length === 0 ? (
                <EmptyState
                  icon={FaCalendarCheck}
                  text="No upcoming donations scheduled"
                />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((d) => (
                    <div
                      key={d.donorId}
                      className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 transition-shadow"
                    >
                      <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <FaTint className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">
                          {d.fullName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                {canManageDonors && (
                  <button
                    onClick={() => openUrgentModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-red-200 cursor-pointer"
                  >
                    <FaPlus className="text-xs" /> New Request
                  </button>
                )}
              </div>

              {loading ? (
                <Spinner />
              ) : urgentRequests.length === 0 ? (
                <EmptyState icon={FaExclamationTriangle} text="No urgent requests" />
              ) : (
                <div className="space-y-4">
                  {urgentRequests.map((req) => (
                    <div
                      key={req.id}
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
                            {(typeof req.bloodGroups === "string" ? JSON.parse(req.bloodGroups) : (req.bloodGroups || [])).map((bg) => (
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
                        {canManageDonors && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => toggleUrgentStatus(req.id, req.isActive)}
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
                            {canDeleteRecords && (
                              <button
                                onClick={() => handleDeleteUrgent(req.id)}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                              >
                                <FaTrash className="inline mr-1" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      <Modal
        open={walkInModal}
        onClose={() => setWalkInModal(false)}
        title="Register walk-in donor"
        subtitle="Record a donor who arrived at the office without a public appointment. Confirm consent before saving."
        size="lg"
      >
        <form onSubmit={handleWalkInSubmit} className="max-h-[75vh] space-y-5 overflow-y-auto pr-1">
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="sm:col-span-2 text-xs font-semibold text-gray-600">Full name *
              <input name="fullName" value={walkInForm.fullName} onChange={handleWalkInChange} required maxLength={150} autoComplete="name" className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </label>
            <label className="text-xs font-semibold text-gray-600">Phone number *
              <input name="phone" value={walkInForm.phone} onChange={handleWalkInChange} required maxLength={30} autoComplete="tel" className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </label>
            <label className="text-xs font-semibold text-gray-600">Email (optional)
              <input type="email" name="email" value={walkInForm.email} onChange={handleWalkInChange} maxLength={255} autoComplete="email" className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </label>
            <label className="text-xs font-semibold text-gray-600">Visit date *
              <input type="date" name="donationDate" value={walkInForm.donationDate} onChange={handleWalkInChange} required className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </label>
            <label className="text-xs font-semibold text-gray-600">Visit time *
              <input type="time" name="donationTime" value={walkInForm.donationTime} onChange={handleWalkInChange} required className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            </label>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-bold text-gray-800">Donation screening details</h3>
            <p className="mt-1 text-xs text-gray-600">These health details are restricted to blood donation office accounts. Record only information needed for the screening process.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="text-xs font-semibold text-gray-600">Age *
                <input type="number" name="age" min="16" max="70" step="1" value={walkInForm.age} onChange={handleWalkInChange} required className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </label>
              <label className="text-xs font-semibold text-gray-600">Gender *
                <select name="gender" value={walkInForm.gender} onChange={handleWalkInChange} required className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-600">Weight (kg) *
                <input type="number" name="weight" min="50" step="0.1" value={walkInForm.weight} onChange={handleWalkInChange} required className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </label>
              <label className="sm:col-span-3 text-xs font-semibold text-gray-600">Blood group *
                <select name="bloodGroup" value={walkInForm.bloodGroup} onChange={handleWalkInChange} required className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Select blood group</option>{BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </label>
              <label className="sm:col-span-3 text-xs font-semibold text-gray-600">Relevant health conditions
                <textarea name="healthConditions" value={walkInForm.healthConditions} onChange={handleWalkInChange} rows={2} maxLength={5000} className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </label>
              <label className="sm:col-span-3 text-xs font-semibold text-gray-600">Relevant medications
                <textarea name="medications" value={walkInForm.medications} onChange={handleWalkInChange} rows={2} maxLength={5000} className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
              </label>
            </div>
          </section>

          <section className="space-y-2 rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-800">Consent record · notice v1.0</h3>
            <p className="text-xs text-gray-600">Confirm that the donor has reviewed and agreed to each item. The system records the consent and time. <Link to="/privacy-policy" target="_blank" className="font-semibold text-red-700 underline">Privacy Policy</Link></p>
            {[
              ["consentDonate", "Donor consents to donate blood."],
              ["consentTest", "Donor consents to infectious disease testing."],
              ["consentTerms", "Donor agrees to the hospital terms."],
              ["consentPrivacy", "Donor acknowledges the privacy notice and use of contact and screening information for the donation programme."],
            ].map(([name, label]) => (
              <label key={name} className="flex items-start gap-2 py-1 text-xs text-gray-700">
                <input type="checkbox" name={name} checked={walkInForm[name]} onChange={handleWalkInChange} required className="mt-0.5 accent-red-600" />
                <span>{label}</span>
              </label>
            ))}
          </section>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setWalkInModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={walkInSaving} className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
              {walkInSaving ? "Saving…" : "Save walk-in donor"}
            </button>
          </div>
        </form>
      </Modal>

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

      <Modal
        open={urgentModal}
        onClose={() => setUrgentModal(false)}
        title={editingUrgent ? "Edit Urgent Request" : "Create Urgent Request"}
        subtitle="Displayed live on the public donation page"
        size="lg"
      >
        <div className="space-y-5">

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
                      ? "bg-red-600 border-red-600 text-white shadow-red-200"
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
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors cursor-pointer shadow-red-200"
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

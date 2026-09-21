import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSocket } from "../../api/socket";
import api from "../../api/axios";
import {
  FaClipboardCheck,
  FaUser,
  FaSignInAlt,
  FaSignOutAlt,
  FaEdit,
  FaTrash,
  FaPlus,
  FaShieldAlt,
  FaKey,
  FaServer,
  FaDownload,
  FaEye,
  FaFileExport,
  FaBan,
  FaUserShield,
  FaCalendarAlt,
  FaClock,
  FaFilter,
  FaTimes,
  FaDatabase,
  FaExclamationTriangle,
  FaCheckCircle,
  FaGlobe,
  FaLock,
  FaChevronDown,
  FaChevronUp,
  FaRedo,
  FaDesktop,
} from "react-icons/fa";
import notify from "../../common/utils/notify";
import {
  Avatar,
  Button,
  DataTable,
  Modal,
  PageHeader,
  SearchBox,
  Spinner,
  EmptyState,
  StatCard,
  Pagination,
} from "../../common/components";

const ACTION_META = {
  login: { label: "Login", icon: FaSignInAlt, color: "text-emerald-600", bg: "bg-emerald-50" },
  logout: { label: "Logout", icon: FaSignOutAlt, color: "text-slate-500", bg: "bg-slate-50" },
  login_failed: { label: "Failed Login", icon: FaBan, color: "text-red-600", bg: "bg-red-50" },
  create: { label: "Create", icon: FaPlus, color: "text-blue-600", bg: "bg-blue-50" },
  update: { label: "Update", icon: FaEdit, color: "text-amber-600", bg: "bg-amber-50" },
  delete: { label: "Delete", icon: FaTrash, color: "text-red-600", bg: "bg-red-50" },
  view: { label: "View", icon: FaEye, color: "text-slate-500", bg: "bg-slate-50" },
  export: { label: "Export", icon: FaFileExport, color: "text-violet-600", bg: "bg-violet-50" },
  download: { label: "Download", icon: FaDownload, color: "text-cyan-600", bg: "bg-cyan-50" },
  permission_change: {
    label: "Permission Change",
    icon: FaKey,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  role_change: {
    label: "Role Change",
    icon: FaUserShield,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  password_reset: {
    label: "Password Reset",
    icon: FaLock,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  system: { label: "System", icon: FaServer, color: "text-slate-600", bg: "bg-slate-50" },
  publish: { label: "Publish", icon: FaGlobe, color: "text-teal-600", bg: "bg-teal-50" },
  approve: {
    label: "Approve",
    icon: FaCheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  reject: { label: "Reject", icon: FaBan, color: "text-red-600", bg: "bg-red-50" },
};

const fallbackMeta = {
  label: "Action",
  icon: FaClipboardCheck,
  color: "text-slate-500",
  bg: "bg-slate-50",
};
const getMeta = (action) => ACTION_META[action?.toLowerCase()] || fallbackMeta;

const SEVERITY = {
  info: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  low: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  high: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};
const getSeverity = (s) => SEVERITY[s?.toLowerCase()] || SEVERITY.info;

const ITEMS_PER_PAGE = 25;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString("en-KE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

const timeAgo = (d) => {
  if (!d) return "";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(d);
};

const RESOURCE_TYPES = [
  "All Resources",
  "User",
  "Appointment",
  "Notice",
  "Event",
  "News",
  "Career",
  "Service",
  "Tender",
  "Report",
  "Gallery",
  "Research",
  "Inventory",
  "Vehicle",
  "Donation",
  "Feedback",
  "Fraud Report",
];

const ACTION_TYPES = [
  "All Actions",
  "login",
  "logout",
  "login_failed",
  "create",
  "update",
  "delete",
  "view",
  "export",
  "download",
  "permission_change",
  "role_change",
  "password_reset",
  "publish",
  "approve",
  "reject",
];

const DetailRow = ({ label, value, icon: Icon }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="text-[10px] text-slate-400 mt-1 shrink-0" />}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs text-slate-700 break-all">
          {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
        </p>
      </div>
    </div>
  );
};

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("All Actions");
  const [filterResource, setFilterResource] = useState("All Resources");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [liveMode, setLiveMode] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterAction !== "All Actions") params.action = filterAction;
      if (filterResource !== "All Resources") params.resource = filterResource;
      if (filterSeverity !== "all") params.severity = filterSeverity;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await api.get("/audit-logs", { params });
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setLogs(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setLogs(generateDemoLogs());
      } else {
        notify.error(err.response?.data?.message || "Failed to load audit logs");
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterResource, filterSeverity, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);


  useSocket("audit:new", useCallback((newLog) => {
    if (!liveMode) return;
    setLogs((prev) => [newLog, ...prev]);
  }, [liveMode]));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((log) => {
      if (!q) return true;
      return (
        log.user?.name?.toLowerCase().includes(q) ||
        log.user?.email?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.resource?.toLowerCase().includes(q) ||
        log.description?.toLowerCase().includes(q) ||
        log.ipAddress?.includes(q) ||
        log.resourceId?.toLowerCase().includes(q)
      );
    });
  }, [logs, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filtered, currentPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterAction, filterResource, filterSeverity, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const todayLogs = logs.filter(
      (l) => now - new Date(l.timestamp || l.createdAt).getTime() < day
    );
    return {
      total: logs.length,
      today: todayLogs.length,
      failedLogins: logs.filter((l) => l.action === "login_failed").length,
      critical: logs.filter((l) => l.severity === "critical" || l.severity === "high").length,
    };
  }, [logs]);

  const handleExport = () => {
    const csv = [
      [
        "Timestamp",
        "User",
        "Email",
        "Action",
        "Resource",
        "Resource ID",
        "Description",
        "IP Address",
        "Severity",
      ],
      ...filtered.map((l) => [
        l.timestamp || l.createdAt,
        l.user?.name || l.userName || "",
        l.user?.email || l.userEmail || "",
        l.action,
        l.resource,
        l.resourceId || "",
        `"${(l.description || "").replace(/"/g, '""')}"`,
        l.ipAddress || "",
        l.severity || "info",
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("Audit logs exported");
  };

  const clearFilters = () => {
    setSearch("");
    setFilterAction("All Actions");
    setFilterResource("All Resources");
    setFilterSeverity("all");
    setDateFrom("");
    setDateTo("");
  };
  const hasFilters =
    search ||
    filterAction !== "All Actions" ||
    filterResource !== "All Resources" ||
    filterSeverity !== "all" ||
    dateFrom ||
    dateTo;

  const columns = [
    {
      key: "timestamp",
      label: "When",
      render: (log) => {
        const ts = log.timestamp || log.createdAt;
        return (
          <div className="whitespace-nowrap">
            <p className="text-xs font-semibold text-slate-700">{timeAgo(ts)}</p>
            <p className="text-[10px] text-slate-400">
              {fmtDate(ts)} · {fmtTime(ts)}
            </p>
          </div>
        );
      },
    },
    {
      key: "user",
      label: "User",
      render: (log) => {
        const name = log.user?.name || log.userName || "System";
        const email = log.user?.email || log.userEmail || "";
        const role = log.user?.role || log.userRole || "";
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="xs" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
              {role && <p className="text-[10px] text-slate-400 capitalize">{role}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: "action",
      label: "Action",
      render: (log) => {
        const m = getMeta(log.action);
        const Icon = m.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`text-xs ${m.color}`} />
            </div>
            <span className="text-xs font-semibold text-slate-700">{m.label}</span>
          </div>
        );
      },
    },
    {
      key: "resource",
      label: "Resource",
      render: (log) => (
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-700">{log.resource || "—"}</p>
          {log.resourceId && (
            <p className="text-[10px] text-slate-400 font-mono truncate">#{log.resourceId}</p>
          )}
        </div>
      ),
    },
    {
      key: "description",
      label: "Details",
      render: (log) => (
        <p className="text-xs text-slate-500 line-clamp-2 max-w-xs">{log.description || "—"}</p>
      ),
    },
    {
      key: "severity",
      label: "Severity",
      render: (log) => {
        const s = getSeverity(log.severity);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {(log.severity || "info").charAt(0).toUpperCase() + (log.severity || "info").slice(1)}
          </span>
        );
      },
    },
    {
      key: "ip",
      label: "IP / Device",
      render: (log) => (
        <div className="min-w-0">
          {log.ipAddress && <p className="text-[10px] text-slate-500 font-mono">{log.ipAddress}</p>}
          {log.userAgent && (
            <p className="text-[10px] text-slate-400 truncate max-w-[120px]" title={log.userAgent}>
              {parseUA(log.userAgent)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (log) => (
        <button
          onClick={() => setDetailModal(log)}
          className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors opacity-60 group-hover:opacity-100"
          title="View details"
        >
          <FaEye className="text-sm" />
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <PageHeader
          title="Audit Log"
          subtitle="System activity trail for security and compliance"
          icon={FaClipboardCheck}
          actions={
            <div className="flex items-center gap-2">
         
              <button
                onClick={() => setLiveMode(!liveMode)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  liveMode
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${liveMode ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                />
                {liveMode ? "Live" : "Live"}
              </button>
              <Button variant="secondary" icon={FaRedo} size="sm" onClick={fetchLogs}>
                Refresh
              </Button>
              <Button variant="secondary" icon={FaFileExport} size="sm" onClick={handleExport}>
                Export CSV
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Events"
            value={stats.total}
            icon={FaClipboardCheck}
            accent={{ bg: "bg-blue-50", icon: "text-blue-500", num: "text-blue-600" }}
          />
          <StatCard
            label="Today"
            value={stats.today}
            icon={FaClock}
            accent={{ bg: "bg-emerald-50", icon: "text-emerald-500", num: "text-emerald-600" }}
          />
          <StatCard
            label="Failed Logins"
            value={stats.failedLogins}
            icon={FaBan}
            accent={{ bg: "bg-red-50", icon: "text-red-500", num: "text-red-600" }}
          />
          <StatCard
            label="High Severity"
            value={stats.critical}
            icon={FaExclamationTriangle}
            accent={{ bg: "bg-orange-50", icon: "text-orange-500", num: "text-orange-600" }}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <SearchBox
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search by user, action, resource, IP…"
              className="flex-1"
            />

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2.5 border border-slate-200 rounded-xl text-xs cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-600 font-medium"
              >
                {ACTION_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a === "All Actions" ? a : getMeta(a).label}
                  </option>
                ))}
              </select>
              <select
                value={filterResource}
                onChange={(e) => setFilterResource(e.target.value)}
                className="px-3 py-2.5 border border-slate-200 rounded-xl text-xs cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-600 font-medium"
              >
                {RESOURCE_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  showFilters || dateFrom || dateTo || filterSeverity !== "all"
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                <FaFilter className="text-[10px]" />
                More
                {showFilters ? (
                  <FaChevronUp className="text-[8px]" />
                ) : (
                  <FaChevronDown className="text-[8px]" />
                )}
              </button>
            </div>

            {hasFilters && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 self-center">
                <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
                {logs.length}
                <button
                  onClick={clearFilters}
                  className="ml-1 text-slate-300 hover:text-red-400 cursor-pointer transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </div>


          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Severity
                </span>
                {["all", "info", "low", "medium", "high", "critical"].map((s) => {
                  const sv = s === "all" ? null : getSeverity(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setFilterSeverity(s)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all ${
                        filterSeverity === s
                          ? s === "all"
                            ? "bg-slate-800 text-white"
                            : `${sv.bg} ${sv.text} ring-1 ring-offset-1 ring-blue-400`
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Date Range
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-600 cursor-pointer"
                />
                <span className="text-slate-300">→</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <Spinner text="Loading audit logs…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            text={hasFilters ? "No logs match your filters" : "No audit events recorded yet"}
            icon={FaClipboardCheck}
          />
        ) : (
          <>
            <DataTable columns={columns} data={paginated} rowKey={(log) => log.id || log._id} />
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white rounded-b-2xl">
              <p className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-600">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-600">{filtered.length}</span> events
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Audit Event Detail"
        subtitle={
          detailModal
            ? `${fmtDate(detailModal.timestamp || detailModal.createdAt)} at ${fmtTime(detailModal.timestamp || detailModal.createdAt)}`
            : ""
        }
        size="lg"
      >
        {detailModal &&
          (() => {
            const m = getMeta(detailModal.action);
            const Icon = m.icon;
            const sev = getSeverity(detailModal.severity);
            return (
              <>
 
                <div className={`${m.bg} rounded-xl p-4 mb-5 flex items-center gap-4`}>
                  <div
                    className={`w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center`}
                  >
                    <Icon className={`text-xl ${m.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-lg font-bold ${m.color}`}>{m.label}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{detailModal.description}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${sev.bg} ${sev.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                    {(detailModal.severity || "info").charAt(0).toUpperCase() +
                      (detailModal.severity || "info").slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <DetailRow
                    label="User"
                    value={detailModal.user?.name || detailModal.userName}
                    icon={FaUser}
                  />
                  <DetailRow
                    label="Email"
                    value={detailModal.user?.email || detailModal.userEmail}
                    icon={FaUser}
                  />
                  <DetailRow
                    label="Role"
                    value={detailModal.user?.role || detailModal.userRole}
                    icon={FaUserShield}
                  />
                  <DetailRow label="Resource" value={detailModal.resource} icon={FaDatabase} />
                  <DetailRow label="Resource ID" value={detailModal.resourceId} icon={FaDatabase} />
                  <DetailRow label="IP Address" value={detailModal.ipAddress} icon={FaGlobe} />
                  <DetailRow label="User Agent" value={detailModal.userAgent} icon={FaDesktop} />
                  <DetailRow label="Session ID" value={detailModal.sessionId} icon={FaKey} />
                  <DetailRow
                    label="Timestamp"
                    value={`${fmtDate(detailModal.timestamp || detailModal.createdAt)} ${fmtTime(detailModal.timestamp || detailModal.createdAt)}`}
                    icon={FaCalendarAlt}
                  />
                  <DetailRow
                    label="Event ID"
                    value={detailModal.id || detailModal._id}
                    icon={FaClipboardCheck}
                  />
                </div>

                {(detailModal.changes || detailModal.metadata) && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {detailModal.changes ? "Changes" : "Metadata"}
                    </p>
                    <pre className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 overflow-x-auto font-mono leading-relaxed max-h-48">
                      {JSON.stringify(detailModal.changes || detailModal.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
                  <Button variant="secondary" onClick={() => setDetailModal(null)}>
                    Close
                  </Button>
                </div>
              </>
            );
          })()}
      </Modal>
    </div>
  );
};

function generateDemoLogs() {
  const users = [
    { name: "Dr. James Mwangi", email: "james@ncrh.go.ke", role: "superadmin" },
    { name: "Alice Wanjiku", email: "alice@ncrh.go.ke", role: "admin" },
    { name: "Peter Ochieng", email: "peter@ncrh.go.ke", role: "it" },
    { name: "Grace Njeri", email: "grace@ncrh.go.ke", role: "doctor" },
    { name: "System", email: "system@ncrh.go.ke", role: "system" },
  ];
  const actions = [
    "login",
    "logout",
    "login_failed",
    "create",
    "update",
    "delete",
    "view",
    "export",
    "role_change",
    "password_reset",
    "publish",
    "approve",
  ];
  const resources = [
    "User",
    "Appointment",
    "Notice",
    "Event",
    "News",
    "Career",
    "Research",
    "Inventory",
    "Report",
  ];
  const severities = ["info", "low", "medium", "high", "critical"];
  const ips = ["192.168.1.45", "10.0.0.12", "196.201.214.38", "41.89.4.102", "172.16.0.8"];
  const descriptions = {
    login: "Successfully logged into the system",
    logout: "User session ended",
    login_failed: "Authentication failed — invalid credentials",
    create: "Created new record",
    update: "Updated existing record",
    delete: "Permanently deleted record",
    view: "Accessed record details",
    export: "Exported data to CSV",
    role_change: "Changed user role from nurse to admin",
    password_reset: "Password reset completed",
    publish: "Published content to public site",
    approve: "Approved pending submission",
  };

  const logs = [];
  const now = Date.now();
  for (let i = 0; i < 120; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const ts = new Date(now - Math.random() * 7 * 86400000).toISOString();
    const isSecurity = ["login_failed", "role_change", "password_reset", "delete"].includes(action);
    logs.push({
      id: `audit-${String(i).padStart(4, "0")}`,
      timestamp: ts,
      user,
      action,
      resource: resources[Math.floor(Math.random() * resources.length)],
      resourceId: `res-${Math.floor(Math.random() * 9000 + 1000)}`,
      description: `${descriptions[action]} — ${resources[Math.floor(Math.random() * resources.length)].toLowerCase()}`,
      severity: isSecurity
        ? severities[2 + Math.floor(Math.random() * 3)]
        : severities[Math.floor(Math.random() * 2)],
      ipAddress: ips[Math.floor(Math.random() * ips.length)],
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0",
      sessionId: `sess-${Math.random().toString(36).slice(2, 10)}`,
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function parseUA(ua) {
  if (!ua) return "";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Browser";
}

export default AuditLog;

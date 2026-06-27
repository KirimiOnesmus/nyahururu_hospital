import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaFlask, FaFileAlt, FaClipboardCheck, FaCertificate, FaExclamationTriangle,
  FaEye, FaEdit, FaRedo, FaCheckCircle, FaEllipsisV, FaChevronLeft,
  FaChevronRight, FaDownload, FaPlus, FaFilter, FaFolderOpen,
} from "react-icons/fa";
import * as research from "../../../api/research";

// ─── Constants & mappings ───────────────────────────────────────────────────
// Mirrors ResearcherDashboard's STATUS_CONFIG/lifecyclePercent exactly, so a
// paper's progress reads the same on the dashboard cards and in this table.
// (No shared/ folder per project convention — kept in sync by hand.)
const STATUS_CONFIG = {
  approved:  { label: "Approved",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending:   { label: "Under Review",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  rejected:  { label: "Revisions Req.",  cls: "bg-red-50 text-red-700 border-red-200" },
  published: { label: "Published",       cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

const lifecyclePercent = (item) => {
  if (item.stage === "final_paper") {
    return item.status === "approved" ? 100 : 80;
  }
  if (item.status === "approved") return 60;
  if (item.status === "rejected") return 20;
  return 15;
};

const stageLabel = (item) => {
  if (item.stage === "final_paper") return item.status === "approved" ? "Completed" : "Final Paper";
  if (item.status === "rejected") return "Proposal";
  return "Ethics Review";
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

const PAGE_SIZE = 5;

const FILTERS = [
  { id: "all",       label: "All Statuses" },
  { id: "pending",   label: "Under Review" },
  { id: "approved",  label: "Approved" },
  { id: "rejected",  label: "Revisions Required" },
  { id: "published", label: "Published" },
];

const SORTS = [
  { id: "newest", label: "Submission Date: Newest" },
  { id: "oldest", label: "Submission Date: Oldest" },
];

//  Local building blocks
const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, title, sub, action }) => (
  <div className="flex flex-col items-center py-16 gap-3 text-center">
    <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200
      flex items-center justify-center">
      <Icon className="text-2xl text-slate-400" />
    </div>
    <p className="font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-400 max-w-xs">{sub}</p>
    {action}
  </div>
);

const StatCard = ({ icon: Icon, badge, badgeCls, value, label, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`text-lg ${iconColor}`} />
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${badgeCls}`}>
          {badge}
        </span>
      )}
    </div>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
    <p className="text-sm text-slate-500 mt-0.5">{label}</p>
  </div>
);

//  Actions cell

const ActionsCell = ({ item, onView, onResubmit, onSubmitFinal }) => {
  const canSubmitFinal = item.stage === "proposal" && item.status === "approved";
  const canResubmit = item.status === "rejected";

  return (
    <div className="flex items-center justify-end gap-1.5">
      {canResubmit && (
        <button type="button" onClick={() => onResubmit(item)} aria-label="Resubmit"
          className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer">
          <FaRedo className="text-sm" />
        </button>
      )}
      {canSubmitFinal && (
        <button type="button" onClick={() => onSubmitFinal(item)} aria-label="Submit final paper"
          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer">
          <FaCheckCircle className="text-sm" />
        </button>
      )}
      <button type="button" onClick={() => onView(item)} aria-label="View"
        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50
          transition-colors cursor-pointer">
        <FaEye className="text-sm" />
      </button>
    </div>
  );
};

// ─── Row ──────────────────────────────────────────────────────────────────────
const SubmissionRow = ({ item, onView, onResubmit, onSubmitFinal }) => {
  const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const percent = lifecyclePercent(item);
  const barColor = item.status === "rejected" ? "bg-red-500" : "bg-blue-600";

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="px-6 py-4 align-top">
        <button type="button" onClick={() => onView(item)}
          className="text-sm font-bold text-blue-700 hover:underline cursor-pointer">
          {item.researchId || "—"}
        </button>
      </td>
      <td className="px-6 py-4 align-top max-w-xs">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{item.title}</p>
        <p className="text-xs text-slate-400 mt-1">
          Primary PI: {item.researcher?.name || "—"}
          {item.department && ` · ${item.department}`}
        </p>
      </td>
      <td className="px-6 py-4 align-top text-sm text-slate-600 whitespace-nowrap">
        {fmt(item.createdAt)}
      </td>
      <td className="px-6 py-4 align-top w-40">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-slate-600">{stageLabel(item)}</span>
          <span className="font-bold text-slate-800">{percent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${percent}%` }} />
        </div>
      </td>
      <td className="px-6 py-4 align-top">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5
          rounded-full border ${sc.cls}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" /> {sc.label}
        </span>
      </td>
      <td className="px-6 py-4 align-top">
        <ActionsCell item={item} onView={onView} onResubmit={onResubmit} onSubmitFinal={onSubmitFinal} />
      </td>
    </tr>
  );
};

// ─── My Submissions page ─────────────────────────────────────────────────────
const MySubmissions = () => {
  const navigate = useNavigate();

  const [papers, setPapers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState("all");
  const [sort, setSort]       = useState("newest");
  const [page, setPage]       = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getMyResearch();
      setPapers(Array.isArray(res.papers) ? res.papers : []);
    } catch {
      toast.error("Failed to load your submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtering + sorting happen client-side, same pattern as ResearcherDashboard.
  const filteredSorted = useMemo(() => {
    let list = status === "all" ? papers : papers.filter((p) => p.status === status);
    list = [...list].sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return sort === "newest" ? -diff : diff;
    });
    return list;
  }, [papers, status, sort]);

  // Reset to page 1 whenever the filtered set changes underneath the user.
  useEffect(() => { setPage(1); }, [status, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const pageItems = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: papers.length,
    active: papers.filter((p) => p.status === "pending").length,
    approved: papers.filter((p) => p.status === "approved" || p.status === "published").length,
    actionRequired: papers.filter((p) => p.status === "rejected").length,
  }), [papers]);

  const handleView = (item) => navigate(`/research/dashboard/view/${item._id}`);
  const handleResubmit = (item) => navigate(`/research/dashboard/view/${item._id}`); // resubmit modal lives on the detail page
  const handleSubmitFinal = (item) => navigate(`/research/dashboard/submit-final/${item._id}`);
  const handleNewProposal = () => navigate("/research/dashboard/submit-proposal");

  const handleExport = () => {
    const rows = filteredSorted.map((p) => ({
      id: p.researchId, title: p.title, status: p.status,
      stage: p.stage, submitted: fmt(p.createdAt), 
    }));
    const csv = [
      "Project ID,Title,Status,Stage,Submitted",
      ...rows.map((r) => `"${r.id}","${r.title}","${r.status}","${r.stage}","${r.submitted}"`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-submissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        Resources <span className="text-slate-300 mx-1">/</span>
        <span className="text-blue-700">My Submissions</span>
      </p>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            My Submissions
          </h1>
          <p className="text-slate-500 mt-1">
            Manage and track your clinical research proposals throughout their lifecycle.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
              text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors
              cursor-pointer whitespace-nowrap">
            <FaDownload className="text-xs" /> Export Data
          </button>
          <button type="button" onClick={handleNewProposal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700
              text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap">
            <FaPlus className="text-xs" /> New Proposal
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FaFileAlt} value={stats.total} label="Total Submissions"
          badge="ALL TIME" badgeCls="bg-slate-100 text-slate-500"
          iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard icon={FaClipboardCheck} value={stats.active} label="Active Reviews"
          badge="+2 NEW" badgeCls="bg-emerald-50 text-emerald-600"
          iconBg="bg-teal-50" iconColor="text-teal-600" />
        <StatCard icon={FaCertificate} value={stats.approved} label="Approved Papers"
          badge="75% RATE" badgeCls="bg-blue-50 text-blue-600"
          iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <StatCard icon={FaExclamationTriangle} value={stats.actionRequired} label="Required Actions"
          badge={stats.actionRequired > 0 ? "URGENT" : undefined} badgeCls="bg-red-50 text-red-600"
          iconBg="bg-red-50" iconColor="text-red-500" />
      </div>

      {/* Filters + table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <FaFilter className="text-xs" /> Filter by:
            </span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-700
                outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
                transition-all bg-white">
              {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-700
                outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
                transition-all bg-white">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <p className="text-sm text-slate-400">
            {filteredSorted.length === 0
              ? "No results"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filteredSorted.length)} of ${filteredSorted.length}`}
          </p>
        </div>

        {loading ? (
          <PageSpinner label="Loading your submissions…" />
        ) : filteredSorted.length === 0 ? (
          <EmptyState
            icon={FaFlask}
            title={status === "all" ? "No submissions yet" : "No matching submissions"}
            sub={status === "all"
              ? "Submit your first research proposal to get started."
              : "Try a different filter to see other submissions."}
            action={status === "all" && (
              <button type="button" onClick={handleNewProposal}
                className="text-blue-600 text-sm font-semibold hover:underline cursor-pointer">
                Submit first proposal
              </button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Project ID", "Research Title", "Date Submitted", "Lifecycle Stage", "Status", "Actions"].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest
                      text-slate-400 ${i === 5 ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <SubmissionRow
                    key={item._id}
                    item={item}
                    onView={handleView}
                    onResubmit={handleResubmit}
                    onSubmitFinal={handleSubmitFinal}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && filteredSorted.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between
            bg-slate-50 flex-wrap gap-3">
            <p className="text-sm text-slate-500">
              Showing {pageItems.length} of {filteredSorted.length} submissions
            </p>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold
                  text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} type="button" onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors cursor-pointer
                    ${p === page
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 border border-slate-200"}`}>
                  {p}
                </button>
              ))}
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold
                  text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubmissions;
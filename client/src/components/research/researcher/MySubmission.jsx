import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import notify from "../../../common/utils/notify";
import {
  FaFlask, FaFileAlt, FaClipboardCheck, FaCertificate, FaExclamationTriangle,
  FaEye, FaEdit, FaRedo, FaCheckCircle, FaEllipsisV, FaChevronLeft,
  FaChevronRight, FaDownload, FaPlus, FaFilter, FaFolderOpen,
} from "react-icons/fa";
import { RiArrowDownDoubleFill } from "react-icons/ri";
import { HiArrowTurnDownRight } from "react-icons/hi2";
import * as research from "../../../api/research";


const STATUS_CONFIG = {
  approved:                 { label: "Approved",          cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  submitted:                { label: "Submitted",         cls: "bg-blue-50 text-blue-700 border-blue-200" },
  under_review:             { label: "Under Review",      cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pending_committee_review: { label: "With Committee",    cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  revision_requested:       { label: "Revisions Req.",    cls: "bg-red-50 text-red-700 border-red-200" },
  rejected:                 { label: "Rejected",          cls: "bg-red-50 text-red-700 border-red-200" },
  suspended:                { label: "Suspended",         cls: "bg-slate-100 text-slate-600 border-slate-200" },
  expired:                  { label: "Expired",           cls: "bg-orange-50 text-orange-700 border-orange-200" },
  closed:                   { label: "Closed",            cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

const lifecyclePercent = (item) => {
  const s = item.status;
  const resubmitted = (item.resubmissionCount || 0) > 0;
  if (s === "approved") return 100;
  if (s === "closed") return 100;
  if (s === "pending_committee_review") return 75;
  if (s === "under_review" && resubmitted) return 50;
  if (s === "under_review") return 30;
  if (s === "submitted") return 20;
  if (s === "revision_requested") return 25;
  if (s === "expired") return 60;
  if (s === "rejected") return 15;
  if (s === "suspended") return 15;
  return 20;
};

const SUBMISSION_TYPE_LABELS = {
  initial_proposal: "Initial Proposal",
  amendment: "Amendment",
  continuing_review: "Continuing Review",
  study_closure: "Study Closure",
};

const stageLabel = (item) => {
  return SUBMISSION_TYPE_LABELS[item.submissionType] || item.submissionType || "Submission";
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

const PAGE_SIZE = 5;

const FILTERS = [
  { id: "all",                  label: "All Statuses" },
  { id: "under_review",        label: "Under Review" },
  { id: "pending_committee_review", label: "With Committee" },
  { id: "approved",            label: "Approved" },
  { id: "revision_requested",  label: "Revisions Required" },
  { id: "rejected",            label: "Rejected" },
];

const SORTS = [
  { id: "newest", label: "Submission Date: Newest" },
  { id: "oldest", label: "Submission Date: Oldest" },
];


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
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`text-base ${iconColor}`} />
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>
          {badge}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
  </div>
);


const ActionsCell = ({ item, onView, onResubmit, onSubmitFinal }) => {
  const isOwner = item.myRole !== "co_investigator";
  const canSubmitFinal = isOwner && item.submissionType === "initial_proposal" && item.status === "approved";
  const canResubmit = isOwner && (item.status === "rejected" || item.status === "revision_requested");

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


const SubmissionRow = ({ item, onView, onResubmit, onSubmitFinal }) => {
  const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.under_review;
  const percent = lifecyclePercent(item);
  const barColor = (item.status === "rejected" || item.status === "revision_requested") ? "bg-red-500" : "bg-blue-600";
  const childCount = Array.isArray(item.childSubmissions) ? item.childSubmissions.length : 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <>
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="px-5 py-3.5 align-top">
        <div className="flex items-center gap-1.5">
          {childCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse" : "Expand"}
              className="w-4 h-4 shrink-0 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              <span className={`inline-block text-[20px] transition-transform ${expanded ? "rotate-90" : ""}`}>
                <RiArrowDownDoubleFill/>
              </span>
            </button>
          )}
          <button type="button" onClick={() => onView(item)}
            className="text-xs font-bold text-blue-700 hover:underline cursor-pointer">
            {item.researchId || "—"}
          </button>
        </div>
        {childCount > 0 && (
          <span className="ml-5 inline-flex items-center px-1.5 py-0.5 mt-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-semibold">
            {childCount + 1} submissions
          </span>
        )}
      </td>
      <td className="px-5 py-3.5 align-top max-w-xs">
        <p className="text-xs font-semibold text-slate-900 leading-snug truncate" title={item.title}>
          {item.title}
        </p>
        {item.myRole === "co_investigator" && (
          <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold
            px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Co-Investigator
          </span>
        )}
        {item.reviewProgressSummary && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {item.reviewProgressSummary}
          </p>
        )}
        {(item.resubmissionCount || 0) > 0 && (
          <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold
            px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            Round {(item.resubmissionCount || 0) + 1}
          </span>
        )}
      </td>
      <td className="px-5 py-3.5 align-top text-xs text-slate-600 whitespace-nowrap">
        {fmt(item.createdAt)}
      </td>
      <td className="px-5 py-3.5 align-top w-36">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-semibold text-slate-600">{stageLabel(item)}</span>
          <span className="font-bold text-slate-800">{percent}%</span>
        </div>
        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${percent}%` }} />
        </div>
      </td>
      <td className="px-5 py-3.5 align-top">
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1
          rounded-full border ${sc.cls}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" /> {sc.label}
        </span>
      </td>
      <td className="px-5 py-3.5 align-top">
        <ActionsCell item={item} onView={onView} onResubmit={onResubmit} onSubmitFinal={onSubmitFinal} />
      </td>
    </tr>
    {expanded && Array.isArray(item.childSubmissions) &&
      item.childSubmissions.map((child) => {
        const csc = STATUS_CONFIG[child.status] || STATUS_CONFIG.under_review;
        const num = child.continuingReviewNumber || child.amendmentNumber;
        return (
          <tr
            key={child.id}
            className="border-b border-slate-50 bg-slate-50/40 hover:bg-slate-50 transition-colors"
          >
            <td className="px-5 py-2 align-top">
              <button
                type="button"
                onClick={() => onView(child)}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer pl-3 border-l-2 border-slate-200"
              >
                {child.researchId || "—"}
              </button>
            </td>
            <td className="px-5 py-2 align-top max-w-xs">
              <span className="text-[12px] font-medium text-slate-600">
                <HiArrowTurnDownRight className=" inline-block mr-2 "/> {SUBMISSION_TYPE_LABELS[child.submissionType] || "Submission"}
                {num ? ` #${num}` : ""}
              </span>
            </td>
            <td className="px-5 py-2 align-top text-[11px] text-slate-500 whitespace-nowrap">
              {fmt(child.createdAt)}
            </td>
            <td className="px-5 py-2 align-top text-[11px] text-slate-400">
               -
            </td>
            <td className="px-5 py-2 align-top">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${csc.cls}`}
              >
                {csc.label}
              </span>
            </td>
            <td className="px-5 py-2 align-top">
              <div className="flex items-center gap-3">
                {(child.status === "revision_requested" || child.status === "rejected") &&
                  child.submissionType === "continuing_review" && (
                    <button
                      type="button"
                      onClick={() => onResubmit(child)}
                      className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
                    >
                      Revise
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => onView(child)}
                  className="text-[11px] text-slate-400 hover:text-blue-600 cursor-pointer"
                >
                  View
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
};


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
  
      const [ownedRes, coInvStudies] = await Promise.all([
        research.getMyResearch(),
        research.getCoInvestigatorStudies().catch(() => []),
      ]);
      const owned = (Array.isArray(ownedRes.papers) ? ownedRes.papers : [])
        .map((p) => ({ ...p, myRole: "principal_investigator" }));
      const coInv = coInvStudies.map((p) => ({ ...p, myRole: "co_investigator" }));
      setPapers([...owned, ...coInv]);
    } catch {
      notify.error("Failed to load your submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);


  const filteredSorted = useMemo(() => {
    let list = status === "all" ? papers : papers.filter((p) => p.status === status);
    list = [...list].sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return sort === "newest" ? -diff : diff;
    });
    return list;
  }, [papers, status, sort]);


  useEffect(() => { setPage(1); }, [status, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const pageItems = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: papers.length,
    active: papers.filter((p) => ["submitted", "under_review", "pending_committee_review"].includes(p.status)).length,
    approved: papers.filter((p) => p.status === "approved").length,
    actionRequired: papers.filter((p) => ["rejected", "revision_requested"].includes(p.status)).length,
  }), [papers]);

  const handleView = (item) => navigate(`/research/dashboard/view/${item.id}`);
  const handleResubmit = (item) => {

    if (item?.submissionType === "continuing_review") {
      navigate(`/research/dashboard/submit-continuing-review?revise=${item.id}`);
    } else {
      navigate(`/research/dashboard/submit-amendment`);
    }
  };
  const handleSubmitFinal = (item) => navigate(`/research/dashboard/submit-final/${item.id}`);
  const handleNewProposal = () => navigate("/research/dashboard/submit-proposal");

  const handleExport = () => {
    const rows = filteredSorted.map((p) => ({
      id: p.researchId, title: p.title, status: p.status,
      type: SUBMISSION_TYPE_LABELS[p.submissionType] || p.submissionType, submitted: fmt(p.createdAt), 
    }));
    const csv = [
      "Project ID,Title,Status,Type,Submitted",
      ...rows.map((r) => `"${r.id}","${r.title}","${r.status}","${r.type}","${r.submitted}"`),
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
  
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
        Resources <span className="text-slate-300 mx-1">/</span>
        <span className="text-blue-700">My Submissions</span>
      </p>


      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage and track your clinical research proposals throughout their lifecycle.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200
              text-slate-600 text-xs font-semibold hover:border-slate-300 transition-colors
              cursor-pointer whitespace-nowrap">
            <FaDownload className="text-[10px]" /> Export Data
          </button>
          <button type="button" onClick={handleNewProposal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700
              text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap">
            <FaPlus className="text-[10px]" /> New Proposal
          </button>
        </div>
      </div>


      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FaFileAlt} value={stats.total} label="Total Submissions"
          iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard icon={FaClipboardCheck} value={stats.active} label="Active Reviews"
          badge={stats.active > 0 ? `${stats.active} ACTIVE` : undefined}
          badgeCls="bg-emerald-50 text-emerald-600"
          iconBg="bg-teal-50" iconColor="text-teal-600" />
        <StatCard icon={FaCertificate} value={stats.approved} label="Approved Papers"
          badge={stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}% RATE` : undefined}
          badgeCls="bg-blue-50 text-blue-600"
          iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <StatCard icon={FaExclamationTriangle} value={stats.actionRequired} label="Required Actions"
          badge={stats.actionRequired > 0 ? "URGENT" : undefined} badgeCls="bg-red-50 text-red-600"
          iconBg="bg-red-50" iconColor="text-red-500" />
      </div>


      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <FaFilter className="text-[10px]" /> Filter by:
            </span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700
                outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
                transition-all bg-white">
              {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700
                outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
                transition-all bg-white">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-slate-400">
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
                    <th key={h} className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest
                      text-slate-400 ${i === 5 ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <SubmissionRow
                    key={item.id}
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

   
        {!loading && filteredSorted.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between
            bg-slate-50 flex-wrap gap-3">
            <p className="text-xs text-slate-500">
              Showing {pageItems.length} of {filteredSorted.length} submissions
            </p>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold
                  text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} type="button" onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer
                    ${p === page
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 border border-slate-200"}`}>
                  {p}
                </button>
              ))}
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold
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
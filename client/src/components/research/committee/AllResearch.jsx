import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import notify from "../../../common/utils/notify";
import {
  FaFileAlt, FaSpinner, FaBook, FaStar, FaFlask, FaDownload,
  FaShieldAlt, FaFilter, FaCalendarAlt, FaEye, FaChevronDown,
  FaClock, FaCheckCircle, FaInbox,
} from "react-icons/fa";
import { RiArrowDownDoubleFill } from "react-icons/ri";
import { HiArrowTurnDownRight } from "react-icons/hi2";
import * as research from "../../../api/research";
import { resolveAssetUrl } from "../../../config/env";

const resolveUrl = (url) => resolveAssetUrl(url);

const STAGE_CONFIG = {
  proposal:          { label: "Proposal",           icon: FaFileAlt,     cls: "text-amber-700 bg-amber-50 border-amber-200",     dot: "bg-amber-500",   segs: [true,false,false,false,false] },
  under_review:      { label: "Under Review",       icon: FaClock,       cls: "text-sky-700 bg-sky-50 border-sky-200",           dot: "bg-sky-500",     segs: [true,true,false,false,false]  },
  under_committee:   { label: "Under Committee",    icon: FaShieldAlt,   cls: "text-blue-700 bg-blue-50 border-blue-200",        dot: "bg-blue-600",    segs: [true,true,true,true,false]    },
  approved:          { label: "Approved",           icon: FaCheckCircle, cls: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", segs: [true,true,true,true,false] },
  final_paper:       { label: "Final Paper",        icon: FaCheckCircle, cls: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", segs: [true,true,true,true,false] },
  committee_signoff: { label: "Committee Sign-off", icon: FaShieldAlt,   cls: "text-teal-700 bg-teal-50 border-teal-200",        dot: "bg-teal-500",    segs: [true,true,true,true,true]     },
  published:         { label: "Published",          icon: FaBook,        cls: "text-teal-700 bg-teal-50 border-teal-200",        dot: "bg-teal-500",    segs: [true,true,true,true,true]     },
  completed:         { label: "Completed",          icon: FaCheckCircle, cls: "text-purple-700 bg-purple-50 border-purple-200", dot: "bg-purple-500",  segs: [true,true,true,true,true]     },
};

const SEG_COLORS = ["bg-slate-300", "bg-sky-500", "bg-blue-600", "bg-emerald-500", "bg-teal-500"];

const FILTER_OPTIONS = ["All Stages", "Proposal", "Progress", "Final Paper"];

const STAGE_PARAM = {
  "All Stages": undefined,
  Proposal: "proposal",
  Progress: "progress",
  "Final Paper": "final_paper",
};

const LIFECYCLE_STEPS = [
  { label: "Proposal",           dot: "bg-slate-400" },
  { label: "Under Review",       dot: "bg-sky-500" },
  { label: "Under Committee",    dot: "bg-blue-600" },
  { label: "Approved / Final",   dot: "bg-emerald-500" },
  { label: "Committee Sign-off", dot: "bg-teal-500" },
  { label: "Publication",        dot: "bg-purple-500" },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 text-sm font-medium">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, title, sub }) => (
  <div className="flex flex-col items-center py-16 gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
      <Icon className="text-lg text-slate-400" />
    </div>
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    <p className="text-xs text-slate-400 max-w-xs mt-0.5">{sub}</p>
  </div>
);

const StatCard = ({ icon: Icon, value, label, sub, iconBg, iconColor, subColor }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>
      <Icon className={`text-sm ${iconColor}`} />
    </div>
    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    {sub && <p className={`text-[11px] mt-0.5 font-semibold ${subColor || "text-slate-400"}`}>{sub}</p>}
  </div>
);

const ProgressBar = ({ stage }) => {
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.proposal;
  return (
    <div className="flex gap-0.5 mt-1.5">
      {SEG_COLORS.map((color, i) => (
        <div key={i} className={`h-[3px] w-5 rounded-sm ${cfg.segs[i] ? color : "bg-slate-200"}`} />
      ))}
    </div>
  );
};

const StageBadge = ({ stage }) => {
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.proposal;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.cls}`}>
      <Icon className="text-[11px]" />
      {cfg.label}
    </span>
  );
};

const CHILD_TYPE_LABELS = {
  continuing_review: "Continuing Review",
  amendment: "Amendment",
  study_closure: "Study Closure",
};

const ChildRow = ({ child, onView }) => {
  const stage = STATUS_TO_STAGE[child.status] || "under_review";
  const num = child.continuingReviewNumber || child.amendmentNumber;
  return (
    <tr className="border-b border-slate-50 bg-slate-50/40 hover:bg-slate-50 transition-colors">
      <td className="px-6 py-2 pl-9">
        <p className="text-[11px] font-semibold text-blue-600 leading-snug border-l-2 border-slate-200 pl-2">
          {child.researchId || child.seruNumber || "—"}
        </p>
      </td>
      <td className="px-6 py-2 max-w-xs">
        <span className="text-[11px] font-medium text-slate-600">
          <HiArrowTurnDownRight className="inline-block mr-1" />
          {CHILD_TYPE_LABELS[child.submissionType] || "Submission"}{num ? ` #${num}` : ""}
        </span>
      </td>
      <td className="px-6 py-2 whitespace-nowrap" />
      <td className="px-6 py-2 whitespace-nowrap">
        <StageBadge stage={stage} />
      </td>
      <td className="px-6 py-2 text-[11px] text-slate-400 whitespace-nowrap">
        {child.approvalValidUntil ? fmtDate(child.approvalValidUntil) : "—"}
      </td>
      <td className="px-6 py-2 text-right">
        <button
          type="button"
          onClick={() => onView(child)}
          aria-label="View submission"
          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <FaEye className="text-sm" />
        </button>
      </td>
    </tr>
  );
};

const ResearchRow = ({ paper, onView, onVerify, expanded, onToggle }) => {
  const isEarly = paper.stage === "proposal" || paper.stage === "under_review";
  const children = Array.isArray(paper.childSubmissions) ? paper.childSubmissions : [];
  return (
    <>
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-start gap-2">
          {children.length > 0 && (
            <button
              type="button"
              onClick={() => onToggle(paper.id)}
              aria-label={expanded ? "Collapse" : "Expand"}
              className="mt-0.5 w-5 h-5 shrink-0 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              <span className={`inline-block text-[20px] transition-transform ${expanded ? "rotate-90" : ""}`}>
                <RiArrowDownDoubleFill/>
              </span>
            </button>
          )}
          <div>
            <p className="text-xs font-bold text-blue-700 leading-snug">
              {paper.researchId}
              {children.length > 0 && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
               {children.length + 1}
                </span>
              )}
            </p>
            <ProgressBar stage={paper.stage} />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 max-w-xs">
        <p className="text-sm font-semibold text-slate-800 truncate" title={paper.title}>{paper.title}</p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-sm font-medium text-slate-700">{paper.principalReviewer}</p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StageBadge stage={paper.stage} />
      </td>
      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
        {paper.approvedAt ? fmtDate(paper.approvedAt) : "Pending"}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onView(paper)}
            aria-label="View details"
            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <FaEye className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => onVerify(paper)}
            aria-label="Verify research"
            disabled={isEarly}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${isEarly ? "text-slate-200 pointer-events-none" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}
          >
            <FaShieldAlt className="text-sm" />
          </button>
    
        </div>
      </td>
    </tr>
    {expanded && children.map((child) => (
      <ChildRow key={child.id} child={child} onView={onView} />
    ))}
    </>
  );
};

const STATUS_TO_STAGE = {
  draft: "proposal", awaiting_payment: "proposal", submitted: "proposal",
  returned_for_correction: "proposal",
  under_review: "under_review", revision_requested: "under_review",
  pending_committee_review: "under_committee",
  approved: "approved",
  expired: "approved", suspended: "under_review",
  closed: "completed", rejected: "under_committee",
};

const normalise = (paper) => ({
  ...paper,
  stage: paper.stage || STATUS_TO_STAGE[paper.status] || "proposal",
  researchId: paper.researchId || paper.seruNumber || `R-${paper.id}`,
  principalReviewer: paper.principalReviewer || paper.researcher?.name || "—",
  approvedAt: paper.approvedAt || null,
});

const PER_PAGE = 10; 

const AllResearch = () => {
  const navigate = useNavigate();

  const [papers, setPapers]           = useState([]);
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const toggleRow = (id) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const [loading, setLoading]         = useState(true);
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getAllResearchCommittee({
        page,
        limit: PER_PAGE,
        stage: STAGE_PARAM[stageFilter],
      });
      setPapers((Array.isArray(res.papers) ? res.papers : []).map(normalise));
      setTotal(res.total || 0);
    } catch (err) {
      if (err?.response?.status === 422) {
        notify.error("Invalid filter or page request — please adjust and retry.");
      } else if (err?.response?.status === 401 || err?.response?.status === 403) {
        notify.error("You don't have permission to view the research repository.");
      } else {
        notify.error("Failed to load research repository");
      }
      setPapers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, stageFilter]);

  useEffect(() => { load(); }, [load]);


  const handleStageFilterChange = (value) => {
    setStageFilter(value);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));


  const stats = {
    total,
    inProgress: papers.filter((p) => ["under_review", "under_committee", "final_paper"].includes(p.stage)).length,
    published:  papers.filter((p) => ["published", "completed"].includes(p.stage)).length,
    impact:     papers[0]?.institutionalImpact ?? "—",
  };

  const handleView = (paper) => {
    const recordId = paper.id;
    navigate(`../committee-research-detail/${recordId}`, { state: { record: paper } });
  };

  const handleVerify = (paper) => {
    navigate(`../committee-sign-off/${paper.id}`);
  };

  const handlePageChange = (n) => { if (n >= 1 && n <= totalPages) setPage(n); };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-2 py-2 ">


        <div className="bg-white rounded-2xl border border-slate-100 px-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-2">
                Committee Oversight
              </p>
              <h1 className="text-xl font-extrabold text-slate-900 leading-snug mb-1">
                Research Repository Oversight
              </h1>
              <p className="text-xs text-slate-400">Nyhururu Hospital Institutional Master Repository</p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <FaDownload className="text-xs" />
              Export Report
            </button>
          </div>
        </div>


        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2">
          <StatCard icon={FaFileAlt} value={stats.total.toLocaleString()} label="Total Research Papers" sub="+12% vs LY" subColor="text-emerald-600" iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard icon={FaSpinner} value={stats.inProgress} label="In-Progress Studies" sub="This page" iconBg="bg-amber-50" iconColor="text-amber-500" />
          <StatCard icon={FaBook}    value={stats.published}  label="Recently Published" sub="This page" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard icon={FaStar}    value={stats.impact}     label="Institutional Impact" sub="Global Quartile" iconBg="bg-pink-50" iconColor="text-pink-500" />
        </div>

   
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px ] py-2">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Research Stage
            </label>
            <div className="relative">
              <select
                value={stageFilter}
                onChange={(e) => handleStageFilterChange(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
              >
                {FILTER_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Date Range
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white">
              <FaCalendarAlt className="text-slate-400 text-xs shrink-0" />
              <span className="text-sm text-slate-600 font-medium">Jan 2024 – Dec 2024</span>
            </div>
          </div>

          <button
            type="button"
            aria-label="More filters"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
          >
            <FaFilter className="text-xs" />
          </button>
        </div>

    
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Research Papers</h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Showing {total === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} entries
            </span>
          </div>

          {loading ? (
            <PageSpinner label="Loading repository…" />
          ) : papers.length === 0 ? (
            <EmptyState icon={FaInbox} title="No research papers found" sub="Try adjusting your stage or department filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Project ID", "Research Title", "Principal Reviewer", "Current Stage", "Approval Date", ""].map((h, i) => (
                      <th
                        key={h || i}
                        className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 ${i === 5 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {papers.map((paper) => (
                    <ResearchRow key={paper.id} paper={paper} onView={handleView} onVerify={handleVerify}  expanded={expandedRows.has(paper.id)} onToggle={toggleRow} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && papers.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <span className="text-[11px] font-semibold text-slate-400">
                Showing {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, total)} of {total} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handlePageChange(n)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      page === n
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>


        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Lifecycle Stage Mapping
          </p>
          <div className="flex flex-wrap items-center gap-y-3">
            {LIFECYCLE_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className={`w-2 h-2 rounded-full ${step.dot}`} />
                  {step.label}
                </div>
                {i < LIFECYCLE_STEPS.length - 1 && <span className="text-slate-300 text-sm mx-2">›</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllResearch;
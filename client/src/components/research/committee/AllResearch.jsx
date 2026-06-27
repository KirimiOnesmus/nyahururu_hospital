import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaFileAlt, FaSpinner, FaBook, FaStar, FaFlask, FaDownload,
  FaShieldAlt, FaFilter, FaCalendarAlt, FaEye, FaChevronDown,
} from "react-icons/fa";
import * as research from "../../../api/research";

const STAGE_CONFIG = {
  proposal:          { label: "Proposal",          cls: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-600",   segs: [true,false,false,false,false] },
  under_review:      { label: "Under Review",      cls: "bg-sky-50 text-sky-700 border-sky-200",         dot: "bg-sky-600",     segs: [true,true,false,false,false]  },
  under_committee:   { label: "Under Committee",   cls: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-700",    segs: [true,true,true,true,false]    },
  approved:          { label: "Approved",          cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-600", segs: [true,true,true,true,false] },
  final_paper:       { label: "Final Paper",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-600", segs: [true,true,true,true,false] },
  committee_signoff: { label: "Committee Sign-off",cls: "bg-teal-50 text-teal-700 border-teal-200",      dot: "bg-teal-600",    segs: [true,true,true,true,true]     },
  published:         { label: "Published",         cls: "bg-teal-50 text-teal-700 border-teal-200",      dot: "bg-teal-600",    segs: [true,true,true,true,true]     },
  completed:         { label: "Completed",         cls: "bg-purple-50 text-purple-700 border-purple-200",dot: "bg-purple-600",  segs: [true,true,true,true,true]     },
};

const SEG_COLORS = ["bg-slate-300","bg-sky-500","bg-blue-700","bg-emerald-500","bg-teal-500"];

const FILTER_OPTIONS = ["All Stages", "Proposal", "Progress", "Final Paper"];

const STAGE_BUCKET = {
  proposal:          "Proposal",
  under_review:      "Progress",
  under_committee:   "Progress",
  approved:          "Final Paper",
  final_paper:       "Final Paper",
  committee_signoff: "Final Paper",
  published:         "Final Paper",
  completed:         "Final Paper",
};

const LIFECYCLE_STEPS = [
  { label: "Proposal",          dot: "bg-slate-400" },
  { label: "Under Review",      dot: "bg-sky-600" },
  { label: "Under Committee",   dot: "bg-blue-700" },
  { label: "Approved / Final",  dot: "bg-emerald-600" },
  { label: "Committee Sign-off",dot: "bg-teal-600" },
  { label: "Publication",       dot: "bg-purple-600" },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, title, sub }) => (
  <div className="flex flex-col items-center py-16 gap-3 text-center">
    <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
      <Icon className="text-2xl text-slate-400" />
    </div>
    <p className="font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-400 max-w-xs">{sub}</p>
  </div>
);

const StatCard = ({ icon: Icon, value, label, sub, iconBg, iconColor, subColor }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
      <Icon className={`text-lg ${iconColor}`} />
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    {sub && <p className={`text-xs mt-0.5 font-semibold ${subColor || "text-slate-400"}`}>{sub}</p>}
  </div>
);

const ProgressBar = ({ stage }) => {
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.proposal;
  return (
    <div className="flex gap-0.5 mt-1">
      {SEG_COLORS.map((color, i) => (
        <div key={i} className={`h-[3px] w-5 rounded-sm ${cfg.segs[i] ? color : "bg-slate-200"}`} />
      ))}
    </div>
  );
};

const StageBadge = ({ stage }) => {
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.proposal;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const ResearchRow = ({ paper, onView, onVerify, onDownload }) => {
  const isEarly = paper.stage === "proposal" || paper.stage === "under_review";
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      <td className="px-6 py-4">
        <p className="text-xs font-bold text-blue-900 leading-snug">{paper.researchId}</p>
        <ProgressBar stage={paper.stage} />
      </td>
      <td className="px-6 py-4 max-w-xs">
        <p className="text-sm font-semibold text-slate-900 truncate" title={paper.title}>{paper.title}</p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-sm font-semibold text-slate-700">{paper.principalReviewer}</p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StageBadge stage={paper.stage} />
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
        {paper.approvedAt ? fmtDate(paper.approvedAt) : "Pending"}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => onView(paper)} aria-label="View details"
            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
            <FaEye className="text-sm" />
          </button>
          <button type="button" onClick={() => onVerify(paper)} aria-label="Verify research"
            disabled={isEarly}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${isEarly ? "text-slate-200 pointer-events-none" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}>
            <FaShieldAlt className="text-sm" />
          </button>
          <button type="button" onClick={() => onDownload(paper)} aria-label="Download"
            disabled={isEarly}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${isEarly ? "text-slate-200 pointer-events-none" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}>
            <FaDownload className="text-sm" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const AllResearch = () => {
  const navigate = useNavigate();

  const [papers, setPapers]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [page, setPage]               = useState(1);
  const PER_PAGE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getAllResearch();
      setPapers(Array.isArray(res.papers) ? res.papers : []);
    } catch {
      toast.error("Failed to load research repository");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      if (stageFilter === "All Stages") return true;
      return STAGE_BUCKET[p.stage] === stageFilter;
    });
  }, [papers, stageFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const stats = useMemo(() => ({
    total: papers.length,
    inProgress: papers.filter((p) => ["under_review","under_committee","final_paper"].includes(p.stage)).length,
    published:  papers.filter((p) => ["published","completed"].includes(p.stage)).length,
    impact:     papers[0]?.institutionalImpact ?? "—",
  }), [papers]);


  const handleView = (paper) => {
    const recordId = paper._id || paper.id;
    navigate(`../committee-research-detail/${recordId}`, { state: { record: paper } });
  };

  const handleVerify  = (paper) => toast.success(`Verified: ${paper.researchId}`);
  const handleDownload = (paper) => toast.success(`Preparing download for ${paper.researchId}`);
  const handlePageChange = (n) => { if (n >= 1 && n <= totalPages) setPage(n); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Research Repository Oversight
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Nyhururu Hospital Institutional Master Repository</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors cursor-pointer">
            <FaDownload className="text-xs" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FaFileAlt} value={stats.total.toLocaleString()} label="Total Research Papers" sub="+12% vs LY" subColor="text-emerald-600" iconBg="bg-blue-50" iconColor="text-blue-900" />
        <StatCard icon={FaSpinner} value={stats.inProgress} label="In-Progress Studies" sub="8 Critical Path" iconBg="bg-amber-50" iconColor="text-amber-500" />
        <StatCard icon={FaBook}    value={stats.published}  label="Recently Published"  sub="Last 30 Days"   iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard icon={FaStar}    value={stats.impact}     label="Institutional Impact" sub="Global Quartile" iconBg="bg-pink-50" iconColor="text-pink-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Research Stage</label>
          <div className="relative">
            <select
              value={stageFilter}
              onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
              className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              {FILTER_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Date Range</label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
            <FaCalendarAlt className="text-slate-400 text-xs shrink-0" />
            <span className="text-sm text-slate-600 font-medium">Jan 2024 – Dec 2024</span>
          </div>
        </div>

        <button type="button"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors cursor-pointer shrink-0">
          <FaFilter className="text-xs" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Research Papers</h3>
          <span className="text-xs font-semibold text-slate-400">
            Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
          </span>
        </div>

        {loading ? (
          <PageSpinner label="Loading repository…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FaFlask} title="No research papers found" sub="Try adjusting your stage or department filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Project ID","Research Title","Principal Reviewer","Current Stage","Approval Date",""].map((h, i) => (
                    <th key={h || i} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((paper) => (
                  <ResearchRow key={paper._id} paper={paper} onView={handleView} onVerify={handleVerify} onDownload={handleDownload} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-semibold text-slate-400">
              Showing {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer">
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => handlePageChange(n)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${page === n ? "bg-blue-900 border-blue-900 text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lifecycle Stage Mapping */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-700 text-sm mb-4">Lifecycle Stage Mapping</h3>
        <div className="flex flex-wrap items-center gap-y-3">
          {LIFECYCLE_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className={`w-2.5 h-2.5 rounded-full ${step.dot}`} />
                {step.label}
              </div>
              {i < LIFECYCLE_STEPS.length - 1 && <span className="text-slate-300 text-sm mx-2">›</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllResearch;
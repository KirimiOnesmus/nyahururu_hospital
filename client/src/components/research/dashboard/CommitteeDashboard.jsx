import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import notify from "../../../common/utils/notify";
import {
  FaCheckCircle, FaClock, FaInbox, FaBell, FaSearch, FaUserCircle,
  FaUniversity, FaCalendarAlt, FaShieldAlt, FaBookOpen, FaGavel,
  FaTimesCircle, FaGlobe, FaExclamationTriangle,
} from "react-icons/fa";
import * as research from "../../../api/research";

const TYPE_LABELS = {
  initial_proposal:  "Initial Proposal",
  amendment:         "Amendment",
  continuing_review: "Continuing Review",
  study_closure:     "Study Closure",
};
const TYPE_COLORS = {
  initial_proposal:  "bg-blue-100 text-blue-700 border-blue-200",
  amendment:         "bg-amber-100 text-amber-700 border-amber-200",
  continuing_review: "bg-teal-100 text-teal-700 border-teal-200",
  study_closure:     "bg-red-100 text-red-700 border-red-200",
};

const STATUS_CONFIG = {
  approved:                 { label: "Approved",       Icon: FaCheckCircle, cls: "text-green-700 bg-green-50 border-green-200" },
  submitted:                { label: "Submitted",      Icon: FaClock,       cls: "text-amber-700 bg-amber-50 border-amber-200" },
  under_review:             { label: "Under Review",   Icon: FaClock,       cls: "text-amber-700 bg-amber-50 border-amber-200" },
  pending_committee_review: { label: "With Committee",  Icon: FaShieldAlt,   cls: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  revision_requested:       { label: "Needs Revision", Icon: FaTimesCircle, cls: "text-red-700 bg-red-50 border-red-200" },
  rejected:                 { label: "Rejected",       Icon: FaTimesCircle, cls: "text-red-700 bg-red-50 border-red-200" },
  expired:                  { label: "Expired",        Icon: FaExclamationTriangle, cls: "text-orange-700 bg-orange-50 border-orange-200" },
  closed:                   { label: "Closed",         Icon: FaCheckCircle, cls: "text-slate-700 bg-slate-50 border-slate-200" },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

const tabBtnCls = (active) =>
  `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
   border transition-colors cursor-pointer
   ${active ? "bg-purple-600 text-white border-purple-600"
     : "bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-600"}`;

const filterBtnCls = (active) =>
  `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer
   ${active ? "bg-purple-600 text-white border-purple-600"
     : "bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-600"}`;

const Spinner = ({ size = 10, color = "border-t-purple-600" }) => (
  <div className={`w-${size} h-${size} border-4 border-slate-200 ${color} rounded-full animate-spin`} />
);
const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Spinner /><p className="text-slate-500 font-medium text-sm">{label}</p>
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

const ResearchRow = ({ item, onOpen, variant }) => {
  const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
  const { Icon: StatusIcon } = sc;
  return (
    <button type="button" onClick={() => onOpen(item)}
      className="w-full px-6 py-5 flex items-start gap-4 text-left hover:bg-slate-50/60 transition-colors cursor-pointer">
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-0.5 shrink-0
        border ${TYPE_COLORS[item.submissionType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
        {TYPE_LABELS[item.submissionType] || item.submissionType}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-900 text-sm leading-snug mb-1 truncate">{item.title}</h4>
        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1"><FaUserCircle /> {item.researcher?.name || "—"}</span>
          <span className="flex items-center gap-1"><FaUniversity /> {item.researcher?.institution || "—"}</span>
          <span className="flex items-center gap-1"><FaCalendarAlt />
            {variant === "pending" ? `Forwarded ${fmt(item.reviewedAt)}` : `Submitted ${fmt(item.createdAt)}`}
          </span>
          {item.researchId && <span className="text-slate-300">ID: {item.researchId}</span>}
          {item.seruNumber && <span className="text-slate-300">{item.seruNumber}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {variant === "pending" && item.committeeVotesRequired != null && (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
            <FaGavel className="text-[10px]" />
            {item.committeeVotesCast ?? 0}/{item.committeeVotesRequired} votes
          </span>
        )}
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${sc.cls}`}>
          <StatusIcon className="text-[11px]" /> {sc.label}
        </span>
      </div>
    </button>
  );
};

const CommitteeDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [allResearch, setAll] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);

  const loadPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await research.getCommitteeQueue();
      setPending(Array.isArray(res.papers) ? res.papers : []);
    } catch (err) { notify.error(err.message || "Failed to load pending"); }
    finally { setLoadingPending(false); }
  }, []);

  const loadAll = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await research.getAllResearchCommittee({
        submissionType: typeFilter === "all" ? undefined : typeFilter,
        search: search || undefined, page: 1, limit: 50,
      });
      setAll(Array.isArray(res.papers) ? res.papers : []);
    } catch (err) { notify.error(err.message || "Failed to load research"); }
    finally { setLoadingAll(false); }
  }, [typeFilter, search]);

  useEffect(() => { loadPending(); }, [loadPending]);
  useEffect(() => {
    if (tab !== "all") return;
    const t = setTimeout(loadAll, 300);
    return () => clearTimeout(t);
  }, [tab, loadAll]);

  const handleOpen = (record) => navigate(`/research/dashboard/committee-research-detail/${record.id}`);

  const TYPE_FILTERS = [
    { id: "all",                label: "All" },
    { id: "initial_proposal",  label: "Proposals" },
    { id: "amendment",         label: "Amendments" },
    { id: "continuing_review", label: "Continuing Reviews" },
    { id: "study_closure",     label: "Closures" },
  ];

  return (
    <div className="space-y-6">
      <div className="relative bg-purple-700 rounded-2xl px-4 py-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FaGavel className="text-yellow-300 text-sm" />
              <p className="text-purple-200 text-sm font-medium">Research Committee</p>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{user?.firstName} {user?.lastName}</h2>
            <p className="text-purple-200 text-sm mt-1">{user?.institution}</p>
          </div>
          {pending.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/30 border border-red-400/40 rounded-xl px-4 py-2 self-start sm:self-auto">
              <FaBell className="text-red-300 animate-pulse" />
              <span className="text-white text-sm font-bold">{pending.length} awaiting sign-off</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: FaInbox, label: "Awaiting sign-off", value: pending.length, color: "bg-purple-500" },
          { icon: FaBookOpen, label: "Total in system", value: allResearch.length, color: "bg-indigo-500" },
          { icon: FaCheckCircle, label: "Approved",
            value: allResearch.filter((r) => r.status === "approved").length, color: "bg-green-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="text-white text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => setTab("pending")} className={tabBtnCls(tab === "pending")}>
          <FaGavel className="text-xs" /> Pending sign-off
          {pending.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
              ${tab === "pending" ? "bg-white/30 text-white" : "bg-purple-100 text-purple-600"}`}>
              {pending.length}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setTab("all")} className={tabBtnCls(tab === "all")}>
          <FaGlobe className="text-xs" /> All research
        </button>
      </div>

      {tab === "pending" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FaGavel className="text-purple-500" /> Awaiting committee decision
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Submissions where all assigned reviewers have completed their review.
            </p>
          </div>
          {loadingPending ? <PageSpinner label="Loading pending…" />
            : pending.length === 0 ? <EmptyState icon={FaCheckCircle} title="Nothing awaiting sign-off" sub="No submissions pending committee decision." />
            : <div className="divide-y divide-slate-50">
                {pending.map((item) => <ResearchRow key={item.id} item={item} onOpen={handleOpen} variant="pending" />)}
              </div>}
        </div>
      )}

      {tab === "all" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 space-y-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FaGlobe className="text-purple-500" /> All research
            </h3>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                <input type="text" placeholder="Search by title or SERU number…"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 bg-slate-50 transition-all" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {TYPE_FILTERS.map((s) => (
                  <button key={s.id} type="button" onClick={() => setTypeFilter(s.id)} className={filterBtnCls(typeFilter === s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {loadingAll ? <PageSpinner label="Loading…" />
            : allResearch.length === 0 ? <EmptyState icon={FaBookOpen} title="No research found" sub="Try a different filter." />
            : <div className="divide-y divide-slate-50">
                {allResearch.map((item) => <ResearchRow key={item.id} item={item} onOpen={handleOpen} variant="all" />)}
              </div>}
        </div>
      )}
    </div>
  );
};

export default CommitteeDashboard;
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaHistory,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFlask,
} from "react-icons/fa";
import * as research from "../../../api/research";

//  Constants 

const STAGE_LABELS = {
  proposal: "Proposal",
  progress: "Progress",
  final_paper: "Final Paper",
};

const DECISION_CONFIG = {
  approved: {
    label: "Approved",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  revision_needed: {
    label: "Revisions Needed",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-red-50 text-red-700 border-red-200",
  },
  suspended: {
    label: "Suspended",
    cls: "bg-slate-100 text-slate-600 border-slate-200",
  },
  pending_committee: {
    label: "Pending Committee",
    cls: "bg-purple-50 text-purple-700 border-purple-200",
  },
  in_progress: {
    label: "In Progress",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

const DECISION_FILTERS = [
  { id: "all", label: "All Decisions" },
  { id: "in_progress", label: "In Progress" },
  { id: "approved", label: "Approved" },
  { id: "revision_needed", label: "Revisions Needed" },
  { id: "rejected", label: "Rejected" },
  { id: "suspended", label: "Suspended" },
  { id: "pending_committee", label: "Pending Committee" },
];

const PAGE_SIZE = 10;

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

//  Maps a paper's status/reviewDecision to a display key 

const decisionKeyFor = (item) => {
  const rd = (item.reviewDecision || "").toLowerCase().trim();
  if (rd === "approved") return "approved";
  if (rd === "revision_needed" || rd === "revision requested") return "revision_needed";
  if (rd === "rejected") return "rejected";
  if (rd === "suspended") return "suspended";

  const s = (item.status || "").toLowerCase();
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "suspended") return "suspended";
  if (s === "revision_requested") return "revision_needed";
  if (s === "pending_committee_review") return "pending_committee";

  return "in_progress";
};

 

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

const StatCard = ({ label, value, unit, sub, subCls, placeholder }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 relative">
    {placeholder && (
      <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
        Coming soon
      </span>
    )}
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
      {label}
    </p>
    <p className="text-3xl font-bold text-slate-900">
      {value}
      {unit && (
        <span className="text-base font-semibold text-slate-400">{unit}</span>
      )}
    </p>
    {sub && (
      <p className={`text-xs mt-1 ${subCls || "text-slate-400"}`}>{sub}</p>
    )}
  </div>
);

const TABLE_HEADERS = [
  "Project ID",
  "Research Title",
  "Type",
  "Principal Investigator",
  "Date Assigned",
  "Decision",
  "Score",
];

//  Main component 

const ReviewHistory = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  //  Single fetch — gets ALL papers assigned to this reviewer regardless of

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getAssignedResearch({
        search: search || undefined,
        page: 1,
        limit: 100,          
        includeCompleted: "all", 
      });
      setItems(Array.isArray(res.papers) ? res.papers : []);
    } catch (err) {
      toast.error(err.message || "Failed to load review history");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);


  const categoryOptions = useMemo(() => {
    const set = new Set(
      items.map((i) => i.category || i.discipline).filter(Boolean),
    );
    return Array.from(set);
  }, [items]);


  const filtered = useMemo(() => {
    return items
      .filter((i) => {
        if (decisionFilter !== "all" && decisionKeyFor(i) !== decisionFilter)
          return false;
        if (
          categoryFilter !== "all" &&
          (i.category || i.discipline) !== categoryFilter
        )
          return false;
  
        const dateRef = i.reviewedAt || i.assignedAt || i.createdAt;
        if (dateFrom && new Date(dateRef) < new Date(dateFrom)) return false;
        if (dateTo && new Date(dateRef) > new Date(dateTo)) return false;
        return true;
      })
      .sort((a, b) => {
  
        const dateA = new Date(a.reviewedAt || a.assignedAt || a.createdAt || 0);
        const dateB = new Date(b.reviewedAt || b.assignedAt || b.createdAt || 0);
        return dateB - dateA;
      });
  }, [items, decisionFilter, categoryFilter, dateFrom, dateTo]);


  useEffect(() => {
    setPage(1);
  }, [decisionFilter, categoryFilter, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  //  Stats — computed over ALL fetched items (not just the current page) 
  const stats = useMemo(() => {
    const total = items.length;
    const withScore = items.filter(
      (i) => i.aggregateScore !== null && i.aggregateScore !== undefined,
    );
    const avgScore = withScore.length
      ? (
          withScore.reduce((sum, i) => sum + Number(i.aggregateScore), 0) /
          withScore.length
        ).toFixed(1)
      : null;
    const approvedCount = items.filter(
      (i) => decisionKeyFor(i) === "approved",
    ).length;
    const revisionCount = items.filter((i) =>
      ["revision_needed", "rejected", "suspended"].includes(decisionKeyFor(i)),
    ).length;
    const approvalPct = total ? Math.round((approvedCount / total) * 100) : 0;
    const revisionPct = total ? Math.round((revisionCount / total) * 100) : 0;
    return { total, avgScore, approvalPct, revisionPct };
  }, [items]);

  //  Page number buttons (capped at 7 visible) 
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (range[0] > 2) range.unshift("...");
    if (range[range.length - 1] < totalPages - 1) range.push("...");
    return [1, ...range, totalPages];
  }, [page, totalPages]);

  return (
    <div className="space-y-4">

    
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FaHistory className="text-blue-600 text-xl" /> Review History
        </h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          A complete archive of the research submissions you've handled —
          including decisions still in progress — with scores recorded for
          institutional oversight.
        </p>
      </div>

    
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assigned" value={stats.total} />
        <StatCard
          label="Average Score"
          value={stats.avgScore ?? "—"}
          unit={stats.avgScore ? "/10" : ""}
          sub="Across all scored decisions"
        />
        <StatCard
          label="Approval Ratio"
          value={`${stats.approvalPct}%`}
          sub={`${stats.revisionPct}% sent back for revision`}
          subCls="text-amber-600"
        />
        <StatCard
          label="Impact Factor"
          value="—"
          placeholder
          sub="No institutional source defined yet"
        />
      </div>


      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Decision Type
            </label>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white"
            >
              {DECISION_FILTERS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Study Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>


      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

   
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search review history"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm
                text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400
                focus:ring-2 focus:ring-blue-400/10 bg-slate-50 transition-all"
            />
          </div>
          {!loading && (
            <p className="text-sm text-slate-400 shrink-0">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <PageSpinner label="Loading review history…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FaFlask}
            title={items.length === 0 ? "No reviews found" : "No matches for these filters"}
            sub={
              items.length === 0
                ? "Research assigned to you will appear here as soon as it's submitted."
                : "Try clearing the filters to see all records."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {TABLE_HEADERS.map((h, i) => (
                      <th
                        key={h}
                        className={`px-6 py-3 text-xs font-bold uppercase tracking-widest
                          text-slate-400 whitespace-nowrap ${i === TABLE_HEADERS.length - 1 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => {
                    const dc =
                      DECISION_CONFIG[decisionKeyFor(item)] ??
                      DECISION_CONFIG.in_progress;
        
                    const displayDate = item.reviewedAt || item.assignedAt || item.createdAt;
                    return (
                      <tr
                        key={item._id}
                        onClick={() =>
                          navigate(
                            `/research/dashboard/review/${item._id}?mode=edit`,
                          )
                        }
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60
                          transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 font-bold text-blue-700 whitespace-nowrap">
                          {item.researchId || "—"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs truncate">
                          {item.title}
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          {STAGE_LABELS[item.stage] || item.stage}
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          {item.researcher?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {fmt(displayDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex text-xs font-bold px-3 py-1 rounded-full
                              border whitespace-nowrap ${dc.cls}`}
                          >
                            {dc.label.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                          {item.aggregateScore !== null &&
                          item.aggregateScore !== undefined
                            ? `${Number(item.aggregateScore).toFixed(1)}/10`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>


            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 flex-wrap gap-3">
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length} records
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="p-2 rounded-lg border border-slate-200 text-slate-500
                    hover:border-blue-300 hover:text-blue-600 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                {pageNumbers.map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors
                        ${p === page
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="p-2 rounded-lg border border-slate-200 text-slate-500
                    hover:border-blue-300 hover:text-blue-600 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewHistory;
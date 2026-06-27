import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaInbox,
  FaClock,
  FaRedo,
  FaStopwatch,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaShieldAlt,
  FaFlask,
} from "react-icons/fa";
import * as research from "../../../api/research";

const STAGE_LABELS = {
  proposal: "Proposal",
  progress: "Progress",
  final_paper: "Final Paper",
};

const STAGE_COLORS = {
  proposal: "bg-blue-100 text-blue-700 border-blue-200",
  progress: "bg-amber-100 text-amber-700 border-amber-200",
  final_paper: "bg-green-100 text-green-700 border-green-200",
};

const PRIORITY_CONFIG = {
  high: { label: "High", cls: "bg-red-50 text-red-600 border-red-200" },
  medium: {
    label: "Medium",
    cls: "bg-amber-50 text-amber-600 border-amber-200",
  },
  normal: {
    label: "Normal",
    cls: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

const TABS = [
  { id: "all", label: "All Assignments" },
  { id: "pending", label: "Pending" },
  { id: "inProgress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

const SORTS = [
  { id: "deadline", label: "Sort by: Deadline" },
  { id: "assigned", label: "Sort by: Date Assigned" },
  { id: "priority", label: "Sort by: Priority" },
];

const PAGE_SIZE = 4;

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const daysUntil = (d) => {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, title, sub }) => (
  <div className="flex flex-col items-center py-16 gap-3 text-center">
    <div
      className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200
      flex items-center justify-center"
    >
      <Icon className="text-2xl text-slate-400" />
    </div>
    <p className="font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-400 max-w-xs">{sub}</p>
  </div>
);

const StatCard = ({
  icon: Icon,
  value,
  label,
  valueCls,
  iconBg,
  iconColor,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}
    >
      <Icon className={`text-lg ${iconColor}`} />
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
      {label}
    </p>
    <p className={`text-2xl font-bold ${valueCls || "text-slate-900"}`}>
      {value}
    </p>
  </div>
);

const DeadlineCell = ({ deadline }) => {
  if (!deadline) return <span className="text-xs text-slate-300">—</span>;
  const days = daysUntil(deadline);
  const overdue = days < 0;
  const soon = days >= 0 && days <= 3;

  return (
    <div>
      <p
        className={`text-sm font-bold flex items-center gap-1.5
        ${overdue ? "text-red-600" : soon ? "text-amber-600" : "text-slate-700"}`}
      >
        {overdue && <FaExclamationTriangle className="text-xs" />}
        {overdue
          ? "Overdue"
          : days === 0
            ? "Due today"
            : `In ${days} day${days !== 1 ? "s" : ""}`}
      </p>
      <p className="text-xs text-slate-400">{fmt(deadline)}</p>
    </div>
  );
};

const PriorityBadge = ({ priority }) => {
  const p = PRIORITY_CONFIG[priority] || null;
  if (!p) return <span className="text-xs text-slate-300">—</span>;
  return (
    <span
      className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border ${p.cls}`}
    >
      {p.label.toUpperCase()}
    </span>
  );
};

const ReviewQueue = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("deadline");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, completedRes] = await Promise.all([
        research.getAssignedResearch({
          search: search || undefined,
          page: 1,
          limit: 50,
        }),
        research.getAssignedResearch({
          search: search || undefined,
          page: 1,
          limit: 50,
          includeCompleted: true,
        }),
      ]);
      const active = Array.isArray(activeRes.papers) ? activeRes.papers : [];
      const completed = Array.isArray(completedRes.papers)
        ? completedRes.papers
        : [];
      setItems([...active, ...completed]);
    } catch (err) {
      toast.error(err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const byTab = useMemo(() => {
    switch (tab) {
      case "pending":
        return items.filter(
          // (i) => i.status === "pending" && !i.draftReviewStartedAt,
          (i) => i.status === "under_review" && !i.draftReviewStartedAt,
        );
      case "inProgress":
        return items.filter(
          (i) => i.status === "under_review" && !!i.draftReviewStartedAt,
        );
      case "completed":
        return items.filter((i) =>
          ["approved", "rejected", "suspended"].includes(i.status),
        );
      default:
        return items;
    }
  }, [items, tab]);

  const sorted = useMemo(() => {
    const list = [...byTab];
    if (sort === "deadline") {
      list.sort(
        (a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0),
      );
    } else if (sort === "assigned") {
      list.sort(
        (a, b) => new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0),
      );
    } else if (sort === "priority") {
      const rank = { high: 0, medium: 1, normal: 2 };
      list.sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3));
    }
    return list;
  }, [byTab, sort]);

  useEffect(() => {
    setPage(1);
  }, [tab, sort, search]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const pending = items.filter((i) =>
      ["under_review", "pending", "revision_requested"].includes(i.status),
    );
    const decided = items.filter((i) =>
      ["approved", "rejected", "suspended"].includes(i.status),
    );
    const revisionsSent = items.filter(
      (i) => i.status === "revision_requested",
    ).length;
    const withDates = decided.filter((i) => i.assignedAt && i.reviewedAt);
    const avgTurnaround = withDates.length
      ? (
          withDates.reduce(
            (sum, i) =>
              sum +
              (new Date(i.reviewedAt) - new Date(i.assignedAt)) /
                (1000 * 60 * 60 * 24),
            0,
          ) / withDates.length
        ).toFixed(1)
      : null;
    return {
      total: items.length,
      pending: pending.length,
      revisionsSent,
      avgTurnaround,
    };
  }, [items]);

  const handleReview = (item) =>
    navigate(`/research/dashboard/review/${item._id}`);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        Portal <span className="text-slate-300 mx-1">/</span>
        My Assignments <span className="text-slate-300 mx-1">/</span>
        <span className="text-indigo-700">Reviewer Queue</span>
      </p>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Reviewer Queue
          </h1>
          {stats.pending > 0 && (
            <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {stats.pending} Assignment{stats.pending !== 1 ? "s" : ""} Pending
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
            text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors
            cursor-pointer whitespace-nowrap"
        >
          <FaFilter className="text-xs" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FaInbox}
          value={stats.total}
          label="Total Assignments"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={FaClock}
          value={stats.pending}
          label="Awaiting Review"
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          icon={FaRedo}
          value={stats.revisionsSent}
          label="Revisions Sent"
          valueCls="text-red-600"
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <StatCard
          icon={FaStopwatch}
          value={`${stats.avgTurnaround ?? "—"}`}
          label="Avg. Turnaround (Days)"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Tabs + table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 pt-4 border-b border-slate-100">
          <div className="flex items-center gap-5 mb-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`text-sm font-semibold pb-3 border-b-2 -mb-px transition-colors cursor-pointer
                  ${tab === t.id ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            <input
              type="text"
              placeholder="Search for assignments, ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search assignments"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm
                text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400
                focus:ring-2 focus:ring-indigo-400/10 bg-white transition-all"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-700
              outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10
              transition-all bg-white"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <PageSpinner label="Loading assignments…" />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={FaFlask}
            title="No assignments here"
            sub="Try a different tab or search term."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {[
                      "Project ID & Title",
                      "Type",
                      "PI",
                      "Deadline",
                      "Priority",
                      "",
                    ].map((h, i) => (
                      <th
                        key={h || i}
                        className={`px-6 py-3 text-xs font-bold uppercase
                        tracking-widest text-slate-400 whitespace-nowrap
                        ${i === 5 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => {
                    const overdue =
                      item.deadline && daysUntil(item.deadline) < 0;
                    return (
                      <tr
                        key={item._id}
                        className={`border-b border-slate-100 last:border-0 transition-colors
                          ${overdue ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-slate-50/60"}`}
                      >
                        <td className="px-6 py-4 max-w-sm">
                          <p className="text-xs font-bold text-indigo-700">
                            {item.researchId || "—"}
                          </p>
                          <p className="text-sm font-semibold text-slate-900 leading-snug mt-0.5">
                            {item.title}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                            ${STAGE_COLORS[item.stage] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                          >
                            {STAGE_LABELS[item.stage] || item.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700
                              text-[10px] font-bold flex items-center justify-center shrink-0"
                            >
                              {(item.researcher?.name || "—")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span className="text-sm text-slate-700 whitespace-nowrap">
                              {item.researcher?.name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <DeadlineCell
                            deadline={item.reviewDeadline || item.deadline}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <PriorityBadge priority={item.priority} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {(() => {
                            // AFTER
                            const isCompleted = [
                              "approved",
                              "rejected",
                              "suspended",
                              "revision_requested",
                            ].includes(item.status);
                            return (
                              <div className="flex items-center justify-end gap-2">
                                {isCompleted ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/research/dashboard/review/${item._id}?mode=edit`,
                                      )
                                    }
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-700
              hover:bg-slate-800 text-white text-xs font-bold transition-colors
              cursor-pointer whitespace-nowrap"
                                  >
                                    <FaShieldAlt className="text-xs" /> View
                                    Review
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleReview(item)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600
              hover:bg-indigo-700 text-white text-xs font-bold transition-colors
              cursor-pointer whitespace-nowrap"
                                  >
                                    <FaShieldAlt className="text-xs" /> Start
                                    Review
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              className="px-6 py-4 border-t border-slate-100 flex items-center justify-between
              bg-slate-50 flex-wrap gap-3"
            >
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}{" "}
                assignments
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="p-2 rounded-lg border border-slate-200 text-slate-500
                    hover:border-indigo-300 hover:text-indigo-600 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors cursor-pointer
                      ${p === page ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
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
                    hover:border-indigo-300 hover:text-indigo-600 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

export default ReviewQueue;

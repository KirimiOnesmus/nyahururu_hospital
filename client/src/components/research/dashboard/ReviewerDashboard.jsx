import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import notify from "../../../common/utils/notify";
import {
  FaCheckCircle,
  FaClock,
  FaInbox,
  FaBell,
  FaSearch,
  FaUserCircle,
  FaCalendarAlt,
  FaShieldAlt,
  FaChartBar,
  FaDownload,
} from "react-icons/fa";
import * as research from "../../../api/research";

const ACTIVE_STATUSES = ["under_review", "submitted", "revision_requested"];

const TYPE_LABELS = {
  initial_proposal: "Proposal",
  amendment: "Amendment",
  continuing_review: "Continuing Review",
  study_closure: "Study Closure",
};

const TYPE_COLORS = {
  initial_proposal: "text-blue-700 border-blue-200",
  amendment: "text-amber-700 border-amber-200",
  continuing_review: "text-teal-700 border-teal-200",
  study_closure: "text-red-700 border-red-200",
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const reviewerFilterCls = (active) =>
  `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer
   ${
     active
       ? "bg-indigo-600 text-white border-indigo-600"
       : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
   }`;

const Spinner = ({ size = 10, color = "border-t-indigo-600" }) => (
  <div
    className={`w-${size} h-${size} border-4 border-slate-200 ${color}
    rounded-full animate-spin`}
  />
);

const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Spinner />
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

const ScoreCell = ({ value }) =>
  value == null ? (
    <span className="text-xs text-slate-300">—</span>
  ) : (
    <span className="text-sm font-bold text-slate-800">
      {value.toFixed(1)}
      <span className="text-xs text-slate-400 font-normal">/10</span>
    </span>
  );

const ReviewerDashboard = ({ user }) => {
  const navigate = useNavigate();

  const [allAssigned, setAllAssigned] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getAssignedResearch({
        submissionType: typeFilter === "all" ? undefined : typeFilter,
        search: search || undefined,
        page: 1,
        limit: 100,
      });
      setAllAssigned(Array.isArray(res.papers) ? res.papers : []);
    } catch (err) {
      notify.error(err.message || "Failed to load review queue");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const queue = useMemo(
    () => allAssigned.filter((q) => ACTIVE_STATUSES.includes(q.status)),
    [allAssigned]
  );

  const decided = useMemo(
    () => allAssigned.filter((q) => !ACTIVE_STATUSES.includes(q.status)),
    [allAssigned]
  );

  // Count/show distinct studies: a proposal and its continuing reviews are one
  // study, so the cards and the preview list don't triple-count.
  const studyKey = (q) => q.parentResearchId || q.id;
  const queueByStudy = useMemo(() => {
    const map = new Map();
    for (const q of queue) {
      const k = studyKey(q);
      const prev = map.get(k);
      if (
        !prev ||
        new Date(q.assignedAt || q.createdAt || 0) >
          new Date(prev.assignedAt || prev.createdAt || 0)
      ) {
        map.set(k, q);
      }
    }
    return [...map.values()];
  }, [queue]);

  const allStudyCount = useMemo(
    () => new Set(allAssigned.map(studyKey)).size,
    [allAssigned]
  );

  const scoringProgress =
    allStudyCount === 0
      ? 0
      : Math.round(((allStudyCount - queueByStudy.length) / allStudyCount) * 100);

  const avgTurnaroundDays = useMemo(() => {
    const withDates = decided.filter((h) => h.assignedAt && h.reviewedAt);
    if (withDates.length === 0) return null;
    const totalDays = withDates.reduce((sum, h) => {
      const diff = (new Date(h.reviewedAt) - new Date(h.assignedAt)) / (1000 * 60 * 60 * 24);
      return sum + diff;
    }, 0);
    return (totalDays / withDates.length).toFixed(1);
  }, [decided]);

  const handleReview = (item) => navigate(`/research/dashboard/review/${item.id}`);

  const STAGE_FILTERS = [
    { id: "all", label: "All" },
    { id: "initial_proposal", label: "Proposals" },
    { id: "amendment", label: "Amendments" },
    { id: "continuing_review", label: "CRRs" },
    { id: "study_closure", label: "Closures" },
  ];

  return (
    <div className="space-y-6">
      <div className="relative bg-indigo-700 rounded-2xl p-6 text-white overflow-hidden">
        <div
          className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full
          translate-x-16 -translate-y-16 pointer-events-none"
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FaShieldAlt className="text-yellow-300 text-sm" />
              <p className="text-indigo-200 text-sm font-medium">Reviewer panel</p>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-indigo-200 text-sm mt-1">{user?.institution}</p>
          </div>
          {queueByStudy.length > 0 && (
            <div
              className="flex items-center gap-2 bg-red-500/30 border border-red-400/40
              rounded-xl px-4 py-2 self-start sm:self-auto"
            >
              <FaBell className="text-red-300 animate-pulse" />
              <span className="text-white text-sm font-bold">
                {queueByStudy.length} assigned item{queueByStudy.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Assigned to me
            </p>
            <FaInbox className="text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{queueByStudy.length}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Scoring progress
            </p>
            <FaChartBar className="text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-2">{scoringProgress}%</p>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${scoringProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Avg. turnaround
            </p>
            <FaClock className="text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {avgTurnaroundDays ?? "—"}{" "}
            <span className="text-sm font-normal text-slate-400">days</span>
          </p>
        </div>
      </div>

      <div className="grid">
        <div className=" space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-2 py-4 border-b border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FaInbox className="text-indigo-500" />
                  My review queue
                  {queueByStudy.length > 0 && (
                    <span
                      className="bg-red-100 text-red-600 text-xs font-bold
                      px-2 py-0.5 rounded-full"
                    >
                      {queueByStudy.length}
                    </span>
                  )}
                </h3>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <FaSearch
                    className="absolute left-3 top-1/2 -translate-y-1/2
                    text-slate-400 text-xs pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search by title…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search review queue"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl
                      text-sm text-slate-800 placeholder-slate-400 outline-none
                      focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10
                      bg-slate-50 transition-all"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  {STAGE_FILTERS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTypeFilter(s.id)}
                      className={reviewerFilterCls(typeFilter === s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <PageSpinner label="Loading review queue…" />
            ) : queueByStudy.length === 0 ? (
              <EmptyState
                icon={FaCheckCircle}
                title="All caught up!"
                sub="No submissions assigned to you are currently awaiting review."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[17%]" />
                    <col className="w-[13%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Title", "Research ID", "Stage", "Submitted", "Status", ""].map((h, i) => (
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
                    {queueByStudy.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 last:border-0
                        hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-6 py-4 min-w-0">
                          <p
                            className="text-sm font-semibold text-slate-900 leading-snug truncate"
                            title={item.title}
                          >
                            {item.title}
                          </p>
                          {item.resubmissionCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 mt-1 bg-orange-50 text-orange-700
                              border border-orange-200 px-2 py-0.5 rounded-full
                              font-bold text-[10px] whitespace-nowrap"
                            >
                              Review Round {item.resubmissionCount + 1}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.researchId ? (
                            <span
                              className="inline-block max-w-full truncate align-middle
                              text-xs font-bold text-indigo-700 bg-indigo-50
                              border border-indigo-200 px-2.5 py-1 rounded-lg"
                              title={item.researchId}
                            >
                              {item.researchId}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`block truncate text-xs font-semibold
    ${TYPE_COLORS[item.submissionType] || "text-slate-600"}`}
                            title={TYPE_LABELS[item.submissionType] || item.submissionType}
                          >
                            {TYPE_LABELS[item.submissionType] || item.submissionType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-slate-700 font-medium">
                            {fmt(item.createdAt)}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <FaCalendarAlt /> Assigned {fmt(item.assignedAt)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`block truncate text-xs font-bold
    ${item.status === "revision_requested" ? "text-purple-700" : "text-amber-700"}`}
                          >
                            {item.status === "revision_requested"
                              ? "Revision Requested"
                              : "Under Review"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleReview(item)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
      text-white text-xs font-bold px-4 py-2.5 rounded-xl
      transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <FaShieldAlt /> Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerDashboard;

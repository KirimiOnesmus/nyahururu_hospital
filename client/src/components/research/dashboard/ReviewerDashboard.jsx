import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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

const ACTIVE_STATUSES = ["under_review", "pending", "revision_requested"];

const STAGE_LABELS = {
  proposal: "Proposal",
  progress: "Progress",
  final_paper: "Final Paper",
};

const STAGE_COLORS = {
  proposal: " text-blue-700 border-blue-200",
  progress: "text-amber-700 border-amber-200",
  final_paper: " text-green-700 border-green-200",
};

const RUBRIC = [
  {
    key: "originality",
    label: "Originality",
    body: "Does the study contribute new knowledge or innovative clinical techniques to the Kenyan medical landscape?",
  },
  {
    key: "ethics",
    label: "Ethics",
    body: "Adherence to IRB guidelines, patient confidentiality, and informed consent protocols for vulnerable populations.",
  },
  {
    key: "feasibility",
    label: "Feasibility",
    body: "Logical methodology, adequate budget, and technical capacity of the Nyahururu Hospital facilities.",
  },
];

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

//  Local building blocks
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

//  Reviewer Dashboard
const ReviewerDashboard = ({ user }) => {
  const navigate = useNavigate();

  const [allAssigned, setAllAssigned] = useState([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStage] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getAssignedResearch({
        stage: stageFilter === "all" ? undefined : stageFilter,
        search: search || undefined,
        page: 1,
        limit: 100,
      });
      setAllAssigned(Array.isArray(res.papers) ? res.papers : []);
    } catch (err) {
      toast.error(err.message || "Failed to load review queue");
    } finally {
      setLoading(false);
    }
  }, [stageFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const queue = useMemo(
    () => allAssigned.filter((q) => ACTIVE_STATUSES.includes(q.status)),
    [allAssigned],
  );

  const decided = useMemo(
    () => allAssigned.filter((q) => !ACTIVE_STATUSES.includes(q.status)),
    [allAssigned],
  );

  const scoringProgress =
    allAssigned.length === 0
      ? 0
      : Math.round((decided.length / allAssigned.length) * 100);

  const avgTurnaroundDays = useMemo(() => {
    const withDates = decided.filter((h) => h.assignedAt && h.reviewedAt);
    if (withDates.length === 0) return null;
    const totalDays = withDates.reduce((sum, h) => {
      const diff =
        (new Date(h.reviewedAt) - new Date(h.assignedAt)) /
        (1000 * 60 * 60 * 24);
      return sum + diff;
    }, 0);
    return (totalDays / withDates.length).toFixed(1);
  }, [decided]);

  const handleReview = (item) =>
    navigate(`/research/dashboard/review/${item._id}`);

  const STAGE_FILTERS = [
    { id: "all", label: "All" },
    { id: "proposal", label: "Proposals" },
    { id: "progress", label: "Progress" },
    { id: "final_paper", label: "Final papers" },
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
              <p className="text-indigo-200 text-sm font-medium">
                Reviewer panel
              </p>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-indigo-200 text-sm mt-1">{user?.institution}</p>
          </div>
          {queue.length > 0 && (
            <div
              className="flex items-center gap-2 bg-red-500/30 border border-red-400/40
              rounded-xl px-4 py-2 self-start sm:self-auto"
            >
              <FaBell className="text-red-300 animate-pulse" />
              <span className="text-white text-sm font-bold">
                {queue.length} assigned item{queue.length !== 1 ? "s" : ""}
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
          <p className="text-3xl font-bold text-slate-900">{queue.length}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Scoring progress
            </p>
            <FaChartBar className="text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {scoringProgress}%
          </p>
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

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-2 py-4 border-b border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FaInbox className="text-indigo-500" />
                  My review queue
                  {queue.length > 0 && (
                    <span
                      className="bg-red-100 text-red-600 text-xs font-bold
                      px-2 py-0.5 rounded-full"
                    >
                      {queue.length}
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
                      onClick={() => setStage(s.id)}
                      className={reviewerFilterCls(stageFilter === s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <PageSpinner label="Loading review queue…" />
            ) : queue.length === 0 ? (
              <EmptyState
                icon={FaCheckCircle}
                title="All caught up!"
                sub="No submissions assigned to you are currently awaiting review."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {[
                        "Title",
                        "Research ID",
                        "Stage",
                        "Submitted",
                        "Status",
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
                    {queue.map((item) => (
                      <tr
                        key={item._id}
                        className="border-b border-slate-100 last:border-0
                        hover:bg-slate-50/60 transition-colors"
                      >
                      
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm font-semibold text-slate-900 leading-snug">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            
                            {item.resubmissionCount > 0 && (
                              <span
                                className="bg-purple-100 text-purple-700 border border-purple-200
        px-2 py-0.5 rounded-full font-semibold text-[10px]"
                              >
                                Resubmission #{item.resubmissionCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.researchId ? (
                            <span
                              className="text-xs font-bold text-indigo-700 bg-indigo-50
      border border-indigo-200 px-2.5 py-1 rounded-lg"
                            >
                              {item.researchId}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs  
    ${STAGE_COLORS[item.stage] || " text-slate-600 "}`}
                          >
                            {STAGE_LABELS[item.stage] || item.stage}
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
                            className={`text-xs font-bold whitespace-nowrap
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

        <div className="space-y-5">
          <div className="bg-blue-700 rounded-2xl py-5 px-3 text-white">
            <h3 className="font-bold text-sm mb-4">Scoring Rubric</h3>
            <div className="space-y-4">
              {RUBRIC.map((r) => (
                <div key={r.key}>
                  <p className="text-xs font-bold uppercase tracking-widest text-white mb-1">
                    {r.label}
                  </p>
                  <p className="text-xs text-white leading-relaxed">{r.body}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => toast.info("Reviewer guidelines PDF coming soon")}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-white/40
                hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl
                transition-colors cursor-pointer"
            >
              <FaDownload className="text-xs" /> Download Guidelines (PDF)
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ReviewerDashboard;

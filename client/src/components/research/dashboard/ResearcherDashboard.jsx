import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ResearcherStats from "../ResearcherStatsSection";
import {
  FaFlask,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaShieldAlt,
  FaPlus,
  FaEye,
  FaDownload,
  FaBookOpen,
  FaCommentAlt,
  FaArrowRight,
  FaCalendarAlt,
  FaRedo,
} from "react-icons/fa";
import * as research from "../../../api/research";

//  Constants & mappings

const DASHBOARD_STATUS_MAP = {
  approved: "approved",
  pending: "pending",
  under_review: "pending",
  pending_committee_review: "committee_review",
  revision_requested: "rejected",
  rejected: "rejected",
  suspended: "suspended",
};

const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    Icon: FaCheckCircle,
    cls: "text-green-700 bg-green-50 border-green-200",
  },
  pending: {
    label: "Under review",
    Icon: FaClock,
    cls: "text-amber-700 bg-amber-50 border-amber-200",
  },
  rejected: {
    label: "Needs revision",
    Icon: FaTimesCircle,
    cls: "text-red-700 bg-red-50 border-red-200",
  },
  committee_review: {
    label: "With Committee",
    Icon: FaShieldAlt,
    cls: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
};

// Resolve a raw backend status string to a STATUS_CONFIG key
const resolveStatus = (rawStatus) =>
  DASHBOARD_STATUS_MAP[rawStatus] || "pending";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

//  Shared class strings
const filterBtnCls = (active) =>
  `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer
   ${
     active
       ? "bg-blue-600 text-white border-blue-600"
       : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
   }`;

const actionBtnCls = (variant = "primary") => {
  const map = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-transparent",
    success: "bg-green-700 hover:bg-green-800 text-white border-transparent",
    secondary:
      "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600",
    amber: "bg-amber-600 hover:bg-amber-700 text-white border-transparent",
  };
  return `flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg
    border transition-colors cursor-pointer ${map[variant]}`;
};

//  Local building blocks
const Spinner = ({ size = 8, color = "border-t-blue-600" }) => (
  <div
    className={`w-${size} h-${size} border-4 border-slate-200 ${color} rounded-full animate-spin`}
  />
);

const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Spinner size={10} />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, title, sub, action }) => (
  <div className="flex flex-col items-center py-16 gap-3 text-center">
    <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
      <Icon className="text-2xl text-slate-400" />
    </div>
    <p className="font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-400 max-w-xs">{sub}</p>
    {action}
  </div>
);

const SlideModal = ({ onClose, children }) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl
        max-h-[90vh] overflow-y-auto shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

//  Resubmit modal
const ResubmitModal = ({ item, onClose, onResubmitted }) => {
  const [form, setFormRaw] = useState({
    abstract: item.abstract || "",
    background: item.background || "",
    objectives: item.objectives || "",
    methodology: item.methodology || "",
    expectedOutcome: item.expectedOutcome || "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (k, v) => setFormRaw((p) => ({ ...p, [k]: v }));

  const inputCls = `w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800
    placeholder-slate-400 text-sm outline-none focus:border-blue-500
    focus:ring-2 focus:ring-blue-500/10 transition-all bg-white resize-none`;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      if (file) {
        const fileField =
          item.stage === "final_paper" ? "finalPaperFile" : "proposalFile";
        fd.append(fileField, file);
      }
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/research/${item._id}/resubmit`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("researcher_token")}`,
          },
          body: fd,
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Resubmission failed");
      toast.success("Resubmitted successfully!");
      onResubmitted?.();
      onClose();
    } catch (err) {
      setError(err.message || "Resubmission failed");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "abstract", label: "Abstract", rows: 4 },
    { key: "background", label: "Problem statement", rows: 3 },
    { key: "objectives", label: "Objectives", rows: 3 },
    { key: "methodology", label: "Methodology", rows: 3 },
    { key: "expectedOutcome", label: "Expected outcome", rows: 2 },
  ];

  return (
    <div className="p-6 flex flex-col gap-5">
      <h2 className="font-bold text-slate-900 text-lg">Resubmit for review</h2>

      {item.reviewComment && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold mb-1 text-xs uppercase tracking-wider">
            Reviewer comment
          </p>
          {item.reviewComment}
        </div>
      )}

      <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
        {fields.map(({ key, label, rows }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {label}
            </label>
            <textarea
              rows={rows}
              value={form[key]}
              onChange={(e) => setField(key, e.target.value)}
              className={inputCls}
            />
          </div>
        ))}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Revised document{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          {!file ? (
            <label className="flex items-center gap-3 border border-dashed border-slate-300 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all text-sm text-slate-500">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) setFile(f);
                }}
              />
              Browse revised PDF…
            </label>
          ) : (
            <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-2.5 text-sm">
              <span className="flex-1 text-slate-800 truncate font-medium">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                aria-label="Remove file"
              >
                X
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner size={4} color="border-t-white" /> Submitting…
            </>
          ) : (
            "Resubmit"
          )}
        </button>
      </div>
    </div>
  );
};

//  Lifecycle percent
const lifecyclePercent = (item) => {
  const uiStatus = resolveStatus(item.status);
  if (item.stage === "final_paper") {
    if (uiStatus === "approved") return 100;
    if (uiStatus === "committee_review") return 90;
    return 80;
  }
  if (item.stage === "progress") {
    if (uiStatus === "approved") return 75;
    return 65;
  }

  if (uiStatus === "approved") return 50;
  if (uiStatus === "rejected") return 20;
  return 15;
};

const STAGE_STEPS = ["Proposal", "Progress", "Final"];

//  Project card
const ProjectCard = ({
  item,
  onSubmitProgress,
  onViewProposal,
  onResubmit,
}) => {
  const uiStatus = resolveStatus(item.status);
  const sc = STATUS_CONFIG[uiStatus] || STATUS_CONFIG.pending;
  const { Icon: StatusIcon } = sc;
  const percent = lifecyclePercent(item);

  const canSubmitProgress =
    item.stage === "proposal" && item.status === "approved";
  const canResubmit =
    item.status === "rejected" || item.status === "revision_requested";

  const activeStepIndex =
    item.stage === "final_paper" ? 2 : item.stage === "progress" ? 1 : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border shrink-0 ${sc.cls}`}
        >
          <StatusIcon className="text-[11px]" /> {sc.label}
        </span>
        {item.researchId && (
          <span className="text-xs text-slate-400 shrink-0">
            ID: {item.researchId}
          </span>
        )}
      </div>

      <h4 className="font-bold text-slate-900 text-base leading-snug">
        {item.title}
      </h4>

      {/* Show reviewer comment for revision/rejection; committee comment separately */}
      {item.reviewComment &&
        (uiStatus === "rejected" || uiStatus === "approved") && (
          <div
            className={`rounded-xl px-3.5 py-2.5 border text-xs leading-relaxed flex items-start gap-2
            ${
              uiStatus === "approved"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <FaCommentAlt className="mt-0.5 shrink-0" />
            <span>
              <span className="font-semibold">Reviewer: </span>
              {item.reviewComment}
            </span>
          </div>
        )}

      {/* Committee review — show a distinct callout */}
      {uiStatus === "committee_review" && (
        <div className="rounded-xl px-3.5 py-2.5 border text-xs leading-relaxed flex items-start gap-2 bg-indigo-50 border-indigo-200 text-indigo-800">
          <FaShieldAlt className="mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">Reviewer approved.</span> Now with
            Research Committee for final sign-off.
          </span>
        </div>
      )}

      {/* Lifecycle progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-600">Lifecycle Stage</span>
          <span className="font-bold text-slate-900">{percent}% Complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              uiStatus === "committee_review" ? "bg-indigo-500" : "bg-blue-600"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          {STAGE_STEPS.map((step, i) => (
            <span
              key={step}
              className={`text-[10px] font-bold uppercase tracking-widest
                ${i === activeStepIndex ? "text-blue-700" : "text-slate-400"}`}
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1">
          <FaCalendarAlt className="text-[10px]" /> Submitted{" "}
          {fmt(item.createdAt)}
        </span>
        {item.downloads > 0 && (
          <span className="flex items-center gap-1">
            <FaDownload className="text-[10px]" /> {item.downloads} downloads
          </span>
        )}
      </p>

      <div className="flex gap-2 flex-wrap pt-1 border-t border-slate-50 mt-1">
        {canSubmitProgress && (
          <button
            type="button"
            onClick={() => onSubmitProgress(item)}
            className={actionBtnCls("success")}
          >
            <FaArrowRight className="text-[10px]" /> Submit Stage Two
          </button>
        )}
        {canResubmit && (
          <button
            type="button"
            onClick={() => onResubmit(item)}
            className={actionBtnCls("amber")}
          >
            <FaRedo className="text-[10px]" /> Resubmit (free)
          </button>
        )}
        <button
          type="button"
          onClick={() => onViewProposal(item)}
          className={actionBtnCls("secondary")}
        >
          <FaEye className="text-[10px]" /> View full
        </button>
      </div>
    </div>
  );
};

//  Researcher Dashboard
const ResearcherDashboard = ({ user }) => {
  const navigate = useNavigate();

  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [resubmit, setResubmit] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getMyResearch();

      const rawPapers = Array.isArray(res.papers) ? res.papers : [];
      console.log(
        "statuses:",
        rawPapers.map((p) => ({ title: p.title, status: p.status })),
      );
      setPapers(rawPapers);
    } catch {
      toast.error("Failed to load your research submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "approved", label: "Approved" },
    { id: "pending", label: "Under review" },
    { id: "committee_review", label: "With Committee" },
    { id: "rejected", label: "Needs revision" },
  ];

  const filtered =
    filter === "all"
      ? papers
      : papers.filter((p) => resolveStatus(p.status) === filter);

  const handleNewProposal = () =>
    navigate("/research/dashboard/submit-proposal");
  const handleProgress = (item) =>
    navigate(`/research/dashboard/research-progress/${item._id}`);
  const handleViewProposal = (item) =>
    navigate(`/research/dashboard/view/${item._id}`);

  return (
    <div className="space-y-6">
      <div className="relative bg-blue-700 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">
              Welcome back,
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              {user?.firstName
                ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                : "Researcher"}{" "}
              {/* ← fallback while loading */}
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              {user?.institution ?? ""}
              {user?.discipline ? ` · ${user.discipline}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewProposal}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm self-start sm:self-auto whitespace-nowrap cursor-pointer"
          >
            <FaPlus className="text-xs" /> New proposal
          </button>
        </div>
      </div>

      <ResearcherStats myResearch={papers} isLoading={loading} />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FaBookOpen className="text-blue-500" /> Active Research Projects
          </h3>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => {
              const count =
                f.id !== "all"
                  ? papers.filter((p) => resolveStatus(p.status) === f.id)
                      .length
                  : 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={filterBtnCls(filter === f.id)}
                >
                  {f.label}
                  {f.id !== "all" && count > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                        ${filter === f.id ? "bg-white/30 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200">
            <PageSpinner label="Loading your research…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200">
            <EmptyState
              icon={FaFlask}
              title={
                filter === "all"
                  ? "No submissions yet"
                  : `No ${filter.replace("_", " ")} submissions`
              }
              sub={
                filter === "all"
                  ? "Submit your first research proposal to get started."
                  : "Try a different filter to see other submissions."
              }
              action={
                filter === "all" && (
                  <button
                    type="button"
                    onClick={handleNewProposal}
                    className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Submit first proposal <FaArrowRight className="text-xs" />
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map((item) => (
              <ProjectCard
                key={item._id}
                item={item}
                onSubmitProgress={handleProgress}
                onViewProposal={handleViewProposal}
                onResubmit={(p) => setResubmit(p)}
              />
            ))}
          </div>
        )}
      </div>

      {resubmit && (
        <SlideModal onClose={() => setResubmit(null)}>
          <ResubmitModal
            item={resubmit}
            onClose={() => setResubmit(null)}
            onResubmitted={() => {
              setResubmit(null);
              load();
            }}
          />
        </SlideModal>
      )}
    </div>
  );
};

export default ResearcherDashboard;

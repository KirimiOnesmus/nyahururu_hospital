import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Header, Footer } from "../../components/layouts";
import SubmitProposal from "../../components/research/SubmitProposal";
import SubmitFinalPaper from "../../components/research/SubmitFullPaper";
import ViewProposalDetails from "../../components/research/Viewproposaldetails ";
import MyProfile from "./MyProfile";
import ResearcherStats from "../../components/research/ResearcherStatsSection";
import ReviewModal from "../../components/research/ReviewModal";
import {
  FaFlask, FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaPlus, FaEye, FaDownload, FaInbox, FaBell, FaSearch,
  FaChevronDown, FaChevronRight, FaUserCircle, FaSignOutAlt,
  FaBookOpen, FaEdit, FaCommentAlt, FaArrowRight, FaShieldAlt,
  FaStar, FaCalendarAlt, FaUniversity, FaUser, FaRedo,
} from "react-icons/fa";
import { getResearcherProfile } from "../../api/auth";
import * as research from "../../api/research";

// ─── Constants & mappings ─────────────────────────────────────────────────────
const STAGE_LABELS = {
  proposal:    "Proposal",
  final_paper: "Final Paper",
};

const STAGE_COLORS = {
  proposal:    "bg-blue-100 text-blue-700 border-blue-200",
  final_paper: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_CONFIG = {
  approved: { label: "Approved",      Icon: FaCheckCircle, cls: "text-green-700 bg-green-50 border-green-200" },
  pending:  { label: "Under review",  Icon: FaClock,       cls: "text-amber-700 bg-amber-50 border-amber-200" },
  rejected: { label: "Needs revision",Icon: FaTimesCircle, cls: "text-red-700   bg-red-50   border-red-200"   },
};

const PAGE_LABELS = {
  dashboard:          { researcher: "My Dashboard",    reviewer: "Reviewer Dashboard" },
  "submit-proposal":  { researcher: "Submit Proposal", reviewer: "Submit Proposal"    },
  "submit-final":     { researcher: "Submit Final Paper", reviewer: "Submit Final Paper" },
  profile:            { researcher: "My Profile",      reviewer: "My Profile"         },
  "view-proposal":    { researcher: "Proposal Details",reviewer: "Proposal Details"  },
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ─── Shared class strings ─────────────────────────────────────────────────────
const filterBtnCls = (active) =>
  `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer
   ${active
     ? "bg-blue-600 text-white border-blue-600"
     : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"}`;

const actionBtnCls = (variant = "primary") => {
  const map = {
    primary:   "bg-blue-600 hover:bg-blue-700 text-white border-transparent",
    success:   "bg-green-700 hover:bg-green-800 text-white border-transparent",
    secondary: "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600",
    amber:     "bg-amber-600 hover:bg-amber-700 text-white border-transparent",
  };
  return `flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg
    border transition-colors cursor-pointer ${map[variant]}`;
};

// ─── Shared components ────────────────────────────────────────────────────────
const Spinner = ({ size = 8, color = "border-t-blue-600" }) => (
  <div className={`w-${size} h-${size} border-4 border-slate-200 ${color}
    rounded-full animate-spin`} />
);

const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Spinner size={10} />
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

// ─── Inline modal shell ────────────────────────────────────────────────────────
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

// ─── Resubmit modal ───────────────────────────────────────────────────────────
const ResubmitModal = ({ item, onClose, onResubmitted }) => {
  const [form, setFormRaw] = useState({
    abstract:        item.abstract        || "",
    background:      item.background      || "",
    objectives:      item.objectives      || "",
    methodology:     item.methodology     || "",
    expectedOutcome: item.expectedOutcome || "",
  });
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const setField = (k, v) => setFormRaw((p) => ({ ...p, [k]: v }));

  const inputCls = `w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800
    placeholder-slate-400 text-sm outline-none focus:border-blue-500
    focus:ring-2 focus:ring-blue-500/10 transition-all bg-white resize-none`;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (file) {
        const fileField = item.stage === "final_paper" ? "finalPaperFile" : "proposalFile";
        fd.append(fileField, file);
      }
      // PATCH /:id/resubmit
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/research/${item._id}/resubmit`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("researcher_token")}` },
          body: fd,
        }
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
    { key: "abstract",        label: "Abstract",         rows: 4 },
    { key: "background",      label: "Problem statement", rows: 3 },
    { key: "objectives",      label: "Objectives",        rows: 3 },
    { key: "methodology",     label: "Methodology",       rows: 3 },
    { key: "expectedOutcome", label: "Expected outcome",  rows: 2 },
  ];

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900 text-lg">Resubmit for review</h2>
      </div>

      {item.reviewComment && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold mb-1 text-xs uppercase tracking-wider">Reviewer comment</p>
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
            Revised document <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          {!file ? (
            <label className="flex items-center gap-3 border border-dashed border-slate-300
              rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30
              transition-all text-sm text-slate-500">
              <input type="file" accept=".pdf" className="hidden"
                onChange={(e) => { const f = e.target.files[0]; if (f) setFile(f); }} />
              📄 Browse revised PDF…
            </label>
          ) : (
            <div className="flex items-center gap-3 border border-green-200 bg-green-50
              rounded-xl px-4 py-2.5 text-sm">
              <span className="flex-1 text-slate-800 truncate font-medium">{file.name}</span>
              <button type="button" onClick={() => setFile(null)}
                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                aria-label="Remove file">
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3
          text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onClose}
          className="flex-1 px-5 py-2.5 rounded-xl border border-slate-200
            text-slate-600 text-sm font-semibold hover:border-slate-300
            transition-colors cursor-pointer">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="flex-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700
            text-white text-sm font-semibold transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex
            items-center justify-center gap-2">
          {loading ? <><Spinner size={4} color="border-t-white" /> Submitting…</> : "Resubmit"}
        </button>
      </div>
    </div>
  );
};

// ─── Research paper row ────────────────────────────────────────────────────────
const PaperRow = ({ item, onSubmitFinal, onViewProposal, onResubmit }) => {
  const [open, setOpen] = useState(false);
  const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const { Icon: StatusIcon } = sc;

  const canSubmitFinal = item.stage === "proposal" && item.status === "approved";
  const canResubmit    = item.status === "rejected";

  return (
    <div className="hover:bg-slate-50/60 transition-colors">
      {/* Row header */}
      <button
        type="button"
        className="w-full px-6 py-4 flex items-start gap-4 text-left cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-0.5 shrink-0
          border ${STAGE_COLORS[item.stage] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
          {STAGE_LABELS[item.stage] || item.stage}
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm leading-snug truncate">
            {item.title}
          </p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <FaCalendarAlt className="text-[10px]" /> Submitted {fmt(item.createdAt)}
            </span>
            {item.downloads > 0 && (
              <span className="flex items-center gap-1">
                <FaDownload className="text-[10px]" /> {item.downloads} downloads
              </span>
            )}
            {item.researchId && (
              <span className="text-slate-300">ID: {item.researchId}</span>
            )}
          </p>
        </div>

        <span className={`flex items-center gap-1.5 text-xs font-semibold
          px-3 py-1.5 rounded-full border shrink-0 ${sc.cls}`}>
          <StatusIcon className="text-[11px]" /> {sc.label}
        </span>

        <FaChevronDown className={`text-slate-400 text-xs mt-1.5 shrink-0 transition-transform
          duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-6 pb-5 pt-3 border-t border-slate-50 bg-slate-50/40 space-y-3">
          {item.reviewComment && (
            <div className={`rounded-xl px-4 py-3 border text-sm leading-relaxed
              flex items-start gap-2
              ${item.status === "approved"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50   border-red-200   text-red-800"}`}>
              <FaCommentAlt className="mt-0.5 shrink-0 text-xs" />
              <span>
                <span className="font-semibold">Reviewer: </span>
                {item.reviewComment}
              </span>
            </div>
          )}

          {item.reviewedAt && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <FaCalendarAlt className="text-[10px]" /> Reviewed {fmt(item.reviewedAt)}
            </p>
          )}

          <div className="flex gap-2 flex-wrap">
            {canSubmitFinal && (
              <button type="button" onClick={() => onSubmitFinal(item)}
                className={actionBtnCls("success")}>
                <FaArrowRight className="text-[10px]" /> Submit final paper
              </button>
            )}
            {canResubmit && (
              <button type="button" onClick={() => onResubmit(item)}
                className={actionBtnCls("amber")}>
                <FaRedo className="text-[10px]" /> Resubmit (free)
              </button>
            )}
            <button type="button" onClick={() => onViewProposal(item)}
              className={actionBtnCls("secondary")}>
              <FaEye className="text-[10px]" /> View full
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Researcher dashboard ─────────────────────────────────────────────────────
const ResearcherDashboard = ({ user, onNewProposal, onSubmitFinal, onViewProposal }) => {
  const [papers, setPapers]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [resubmit, setResubmit] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getMyResearch();
      // backend returns { papers: [...], total, page, … }
      setPapers(Array.isArray(res.papers) ? res.papers : []);
    } catch {
      toast.error("Failed to load your research submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const FILTERS = [
    { id: "all",      label: "All"          },
    { id: "approved", label: "Approved"     },
    { id: "pending",  label: "Under review" },
    { id: "rejected", label: "Needs revision"},
  ];

  const filtered = filter === "all"
    ? papers
    : papers.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative bg-blue-700 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full
          translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back,</p>
            <h2 className="text-2xl font-bold tracking-tight">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              {user.institution} · {user.discipline}
            </p>
          </div>
          <button
            type="button"
            onClick={onNewProposal}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300
              text-slate-900 font-bold px-5 py-2.5 rounded-xl transition-colors
              shadow-sm self-start sm:self-auto whitespace-nowrap cursor-pointer"
          >
            <FaPlus className="text-xs" /> New proposal
          </button>
        </div>
      </div>

      {/* Stats */}
      <ResearcherStats myResearch={papers} isLoading={loading} />

      {/* Paper list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap
          items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FaBookOpen className="text-blue-500" /> My research
          </h3>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={filterBtnCls(filter === f.id)}
              >
                {f.label}
                {f.id !== "all" && papers.filter((p) => p.status === f.id).length > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${filter === f.id ? "bg-white/30 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {papers.filter((p) => p.status === f.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <PageSpinner label="Loading your research…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FaFlask}
            title={filter === "all" ? "No submissions yet" : `No ${filter} submissions`}
            sub={filter === "all"
              ? "Submit your first research proposal to get started."
              : "Try a different filter to see other submissions."}
            action={filter === "all" && (
              <button type="button" onClick={onNewProposal}
                className="text-blue-600 text-sm font-semibold hover:underline
                  flex items-center gap-1 cursor-pointer">
                Submit first proposal <FaArrowRight className="text-xs" />
              </button>
            )}
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((item) => (
              <PaperRow
                key={item._id}
                item={item}
                onSubmitFinal={onSubmitFinal}
                onViewProposal={onViewProposal}
                onResubmit={(p) => setResubmit(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      {/* <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
        <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <FaStar className="text-yellow-400" /> Submission tips
        </h4>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {[
            "Abstracts must be at least 30 words with clear objectives",
            "Resubmissions after revision requests are completely free",
            "Final papers must be submitted as PDF (max 20 MB)",
            "You'll receive an email notification on every status change",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <FaCheckCircle className="text-green-500 mt-0.5 shrink-0 text-xs" />
              {tip}
            </li>
          ))}
        </ul>
      </div> */}

      {/* Resubmit modal */}
      {resubmit && (
        <SlideModal onClose={() => setResubmit(null)}>
          <ResubmitModal
            item={resubmit}
            onClose={() => setResubmit(null)}
            onResubmitted={() => { setResubmit(null); load(); }}
          />
        </SlideModal>
      )}
    </div>
  );
};

// ─── Reviewer / admin dashboard ───────────────────────────────────────────────
const ReviewerDashboard = ({ user }) => {
  const [queue, setQueue]         = useState([]);
  const [reviewing, setReviewing] = useState(null);
  const [search, setSearch]       = useState("");
  const [stageFilter, setStage]   = useState("all");
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getAssignedResearch({
        stage: stageFilter === "all" ? undefined : stageFilter,
        search: search || undefined,
        page: 1,
        limit: 50,
      });
      // backend: GET /research/reviewer/assigned → { papers: [...], total, … }
      setQueue(Array.isArray(res.papers) ? res.papers : []);
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

  const handleDecision = (researchId) => {
    setQueue((q) => q.filter((r) => r._id !== researchId));
    setReviewing(null);
  };

  const STAGE_FILTERS = [
    { id: "all",        label: "All"         },
    { id: "proposal",   label: "Proposals"   },
    { id: "final_paper",label: "Final papers"},
  ];

  const reviewerFilterCls = (active) =>
    `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer
     ${active
       ? "bg-indigo-600 text-white border-indigo-600"
       : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"}`;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative bg-indigo-700 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full
          translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FaShieldAlt className="text-yellow-300 text-sm" />
              <p className="text-indigo-200 text-sm font-medium">Reviewer panel</p>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-indigo-200 text-sm mt-1">{user.institution}</p>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/30 border border-red-400/40
              rounded-xl px-4 py-2 self-start sm:self-auto">
              <FaBell className="text-red-300 animate-pulse" />
              <span className="text-white text-sm font-bold">
                {queue.length} assigned item{queue.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: FaInbox,       label: "Assigned to you", value: queue.length,                                  color: "bg-indigo-500" },
          { icon: FaClock,       label: "Pending review",  value: queue.filter(q => q.status === "pending").length, color: "bg-amber-500"  },
          { icon: FaCheckCircle, label: "Unique authors",
            value: new Set(queue.map(q => q.researcher?._id).filter(Boolean)).size,     color: "bg-green-600"  },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5
            flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center
              shrink-0 ${color}`}>
              <Icon className="text-white text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FaInbox className="text-indigo-500" />
              My review queue
              {queue.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold
                  px-2 py-0.5 rounded-full">
                  {queue.length}
                </span>
              )}
            </h3>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2
                text-slate-400 text-xs pointer-events-none" />
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

            {/* Stage filters */}
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
          <div className="divide-y divide-slate-50">
            {queue.map((item) => (
              <div key={item._id}
                className="px-6 py-5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                    mt-0.5 shrink-0 border
                    ${STAGE_COLORS[item.stage] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {STAGE_LABELS[item.stage] || item.stage}
                  </span>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm leading-snug mb-1">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400
                      mb-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <FaUserCircle /> {item.researcher?.name || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaUniversity /> {item.researcher?.institution || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt /> Assigned {fmt(item.assignedAt)}
                      </span>
                      {item.resubmissionCount > 0 && (
                        <span className="bg-purple-100 text-purple-700 border border-purple-200
                          px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          Resubmission #{item.resubmissionCount}
                        </span>
                      )}
                    </div>
                    {item.abstract && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {item.abstract}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setReviewing(item)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
                      text-white text-xs font-bold px-4 py-2.5 rounded-xl
                      transition-colors shrink-0 cursor-pointer"
                  >
                    <FaShieldAlt /> Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewing && (
        <ReviewModal
          item={reviewing}
          onClose={() => setReviewing(null)}
          onDecision={(id) => handleDecision(id)}
        />
      )}
    </div>
  );
};

// ─── Page shell ───────────────────────────────────────────────────────────────
const Shell = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Header />
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
      {children}
    </main>
    <Footer />
  </div>
);

// ─── Root component ───────────────────────────────────────────────────────────
const ResearchDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [currentPage, setCurrentPage]     = useState("dashboard");
  const [selectedResearch, setSelected]   = useState(null);

  const role = localStorage.getItem("role") || "researcher";
  const isReviewer = ["admin", "superadmin", "reviewer"].includes(role);

  useEffect(() => {
    (async () => {
      try {
        const res = await getResearcherProfile();
        setUser(res.researcher || res);
      } catch {
        const cached = localStorage.getItem("researcher");
        if (cached) {
          try { setUser(JSON.parse(cached)); }
          catch { toast.error("Failed to load profile"); navigate("/hmis"); }
        } else {
          toast.error("Failed to load profile");
          navigate("/hmis");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleLogout = () => {
    ["token", "role", "collection", "researcher", "researcher_token"].forEach(
      (k) => localStorage.removeItem(k)
    );
    navigate("/hmis");
    toast.success("Logged out successfully");
  };

  const goTo = (page) => setCurrentPage(page);
  const backToDashboard = () => setCurrentPage("dashboard");

  const breadcrumb = PAGE_LABELS[currentPage]?.[isReviewer ? "reviewer" : "researcher"] ?? "Dashboard";

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Shell>
        <PageSpinner label="Loading dashboard…" />
      </Shell>
    );
  }

  // ── Auth fail ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Shell>
        <div className="flex flex-col items-center py-20 gap-4">
          <FaFlask className="text-slate-300 text-5xl" />
          <p className="text-slate-600 font-medium">Unable to load profile</p>
          <button
            type="button"
            onClick={() => navigate("/hmis")}
            className="text-blue-600 hover:text-blue-700 font-semibold
              text-sm cursor-pointer"
          >
            Return to login
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b
        border-slate-100 shadow-sm">
        <Header />
      </div>

      {/* Sub-nav / breadcrumb bar */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center
          justify-between gap-4 flex-wrap">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FaFlask className="text-blue-500 text-xs" />
            <button
              type="button"
              onClick={backToDashboard}
              className={`transition-colors cursor-pointer hover:text-blue-600
                ${currentPage === "dashboard" ? "font-semibold text-slate-800" : ""}`}
            >
              Research portal
            </button>
            {currentPage !== "dashboard" && (
              <>
                <FaChevronRight className="text-xs text-slate-300" />
                <span className="font-semibold text-slate-800">{breadcrumb}</span>
              </>
            )}
          </div>

          {/* User controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo("profile")}
              className={`flex items-center gap-2 border rounded-xl px-3 py-1.5
                text-xs font-semibold transition-colors cursor-pointer
                ${currentPage === "profile"
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"}`}
            >
              <FaUserCircle className={currentPage === "profile" ? "text-blue-500" : "text-slate-400"} />
              <span className="hidden sm:inline">
                {user.firstName} {user.lastName}
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="flex items-center gap-1.5 text-xs font-semibold
                text-slate-500 hover:text-red-600 border border-slate-200
                hover:border-red-300 px-3 py-1.5 rounded-xl transition-colors
                cursor-pointer"
            >
              <FaSignOutAlt />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        {currentPage === "submit-proposal" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <button
                type="button"
                onClick={backToDashboard}
                className="flex items-center gap-2 text-slate-500
                  hover:text-slate-800 text-sm transition-colors cursor-pointer"
              >
                <FaArrowRight className="rotate-180 text-xs" /> Back to dashboard
              </button>
            </div>
            <SubmitProposal
              onClose={backToDashboard}
              onSubmitted={backToDashboard}
            />
          </div>
        )}

        {currentPage === "submit-final" && selectedResearch && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <button
                type="button"
                onClick={backToDashboard}
                className="flex items-center gap-2 text-slate-500
                  hover:text-slate-800 text-sm transition-colors cursor-pointer"
              >
                <FaArrowRight className="rotate-180 text-xs" /> Back to dashboard
              </button>
            </div>
            <SubmitFinalPaper
              research={selectedResearch}
              onClose={backToDashboard}
              onSubmitted={backToDashboard}
            />
          </div>
        )}

        {currentPage === "profile" && (
          <MyProfile onBack={backToDashboard} />
        )}

        {currentPage === "view-proposal" && selectedResearch && (
          <ViewProposalDetails
            item={selectedResearch}
            onBack={backToDashboard}
            onResubmit={backToDashboard}
            onSubmitNextStage={(r) => {
              setSelected(r);
              goTo("submit-final");
            }}
          />
        )}

        {currentPage === "dashboard" && isReviewer && (
          <ReviewerDashboard user={user} />
        )}

        {currentPage === "dashboard" && !isReviewer && (
          <ResearcherDashboard
            user={user}
            onNewProposal={() => goTo("submit-proposal")}
            onSubmitFinal={(r) => { setSelected(r); goTo("submit-final"); }}
            onViewProposal={(r) => { setSelected(r); goTo("view-proposal"); }}
          />
        )}
      </main>

      <Footer />

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

export default ResearchDashboard;
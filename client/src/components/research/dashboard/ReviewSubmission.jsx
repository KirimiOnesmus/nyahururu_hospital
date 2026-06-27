import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaShieldAlt, FaCalendarAlt, FaUser, FaDownload, FaEye, FaFileAlt,
  FaCheck, FaChevronLeft, FaPaperPlane, FaSpinner, FaHistory,
} from "react-icons/fa";
import * as research from "../../../api/research";
// import { submitReview } from "../../api/research";


const STAGE_LABELS = {
  proposal:    "Proposal",
  final_paper: "Final Paper",
};

const STEPS = [
  { id: "draft",     label: "Draft"     },
  { id: "submitted", label: "Submitted" },
  { id: "review",    label: "Review"    },
  { id: "decision",  label: "Decision"  },
];

const CRITERIA = [
  { key: "originality",     label: "Originality"         },
  { key: "relevance",       label: "Clinical Relevance"  },
  { key: "feasibility",     label: "Feasibility"         },
  { key: "ethics",          label: "Ethics Compliance"   },
  { key: "expectedImpact",  label: "Expected Impact"     },
];

const DECISION_OPTIONS = [
  { value: "approved",        label: "Approve"          },
  { value: "revision_needed", label: "Revision Needed"  },
  { value: "rejected",        label: "Reject"           },
];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

const TABS = [
  { id: "content",   label: "Submission Content" },
  { id: "documents", label: "Uploaded Documents"  },
  { id: "history",   label: "Review History"      },
];


const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);


const Stepper = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center gap-3 px-6 py-5">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex;
        const isCurrent  = i === currentIndex;
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                border-2 transition-colors
                ${isCurrent
                  ? "border-blue-500 text-blue-600 bg-white"
                  : isComplete
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-200 text-slate-400 bg-slate-50"}`}>
                {isComplete ? <FaCheck className="text-[10px]" /> : i + 1}
              </div>
              <span className={`text-[11px] font-semibold uppercase tracking-widest
                ${isCurrent ? "text-blue-600" : isComplete ? "text-slate-700" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 rounded-full ${isComplete ? "bg-blue-600" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};


const ScoreSlider = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <label className="text-sm text-slate-600">{label}</label>
      <span className="text-sm font-bold text-slate-900">{value}/10</span>
    </div>
    <input
      type="range"
      min={0}
      max={10}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={label}
      className="w-full h-1.5 rounded-full bg-slate-200 accent-blue-600 cursor-pointer"
    />
  </div>
);

const SubmissionContentTab = ({ item }) => (
  <div className="space-y-6">
    {[
      { title: "Abstract",    body: item.abstract },
      { title: "Background",  body: item.background },
      { title: "Objectives",  body: item.objectives },
      { title: "Methodology", body: item.methodology },
    ]
      .filter((s) => s.body)
      .map((s) => (
        <div key={s.title}>
          <h4 className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
            <span className="w-1 h-4 bg-blue-600 rounded-full" /> {s.title}
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {s.body}
          </p>
        </div>
      ))}
  </div>
);

const DocumentsTab = ({ documents = [] }) => (
  documents.length === 0 ? (
    <p className="text-sm text-slate-400 py-6 text-center">No documents uploaded.</p>
  ) : (
    <div className="grid sm:grid-cols-2 gap-3">
      {documents.map((doc) => (
        <div key={doc.url || doc.name}
          className="flex items-center justify-between gap-3 border border-slate-200
            rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <FaFileAlt className="text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
              <p className="text-xs text-slate-400">
                {doc.size || "—"} {doc.updatedAt && `· Updated ${fmt(doc.updatedAt)}`}
              </p>
            </div>
          </div>
          <a href={doc.url} target="_blank" rel="noreferrer" aria-label={`View ${doc.name}`}
            className="text-slate-400 hover:text-blue-600 transition-colors shrink-0">
            <FaEye />
          </a>
        </div>
      ))}
    </div>
  )
);

const HistoryTab = ({ history = [] }) => (
  history.length === 0 ? (
    <p className="text-sm text-slate-400 py-6 text-center">No prior review history.</p>
  ) : (
    <div className="space-y-4">
      {history.map((h, i) => (
        <div key={i} className="flex items-start gap-3 border-b border-slate-50 pb-4 last:border-0">
          <FaHistory className="text-slate-300 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{h.reviewerName || "Reviewer"}</span> — {h.decision}
            </p>
            {h.comment && <p className="text-sm text-slate-500 mt-1">{h.comment}</p>}
            <p className="text-xs text-slate-400 mt-1">{fmt(h.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
);

//  Review Submission page 
const ReviewSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("content");

  const [scores, setScores] = useState(
    Object.fromEntries(CRITERIA.map((c) => [c.key, 5]))
  );
  const [decision, setDecision] = useState("");
  const [feedback, setFeedback] = useState("");
  const [certified, setCertified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getResearchById(id);
      setItem(res.research || res);
    } catch (err) {
      toast.error(err.message || "Failed to load submission");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const aggregateScore = (
    CRITERIA.reduce((sum, c) => sum + (scores[c.key] || 0), 0) / CRITERIA.length
  ).toFixed(1);

  const canSubmit =
    decision &&
    feedback.trim().length >= 10 &&
    certified &&
    !submitting;

  const handleSubmit = async () => {
    if (!decision) { toast.error("Select a final decision"); return; }
    if (feedback.trim().length < 10) { toast.error("Feedback must be at least 10 characters"); return; }
    if (!certified) { toast.error("Please certify your review before submitting"); return; }

    setSubmitting(true);
    try {
      await submitReview(item._id, {
        decision,
        comment: feedback,
        scores,
        aggregateScore: Number(aggregateScore),
      });
      toast.success("Review submitted successfully!");
      navigate("/research/dashboard/review-queue");
    } catch (err) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner label="Loading submission…" />;
  if (!item) return null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800
          transition-colors cursor-pointer"
      >
        <FaChevronLeft className="text-xs" /> Back to queue
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {item.researchId && (
                <span className="text-xs font-bold text-slate-500">{item.researchId}</span>
              )}
              <span className="text-xs font-bold px-2.5 py-1 rounded-full
                bg-amber-50 text-amber-700 border border-amber-200">
                {STAGE_LABELS[item.stage] || item.stage}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {item.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5">
                <FaUser className="text-xs" /> {item.researcher?.name || "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <FaCalendarAlt className="text-xs" /> Submitted {fmt(item.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stepper */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-6 pt-5">
              Review Progress
            </p>
            <Stepper currentStep="review" />
          </div>

          {/* Tabbed content */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-100 px-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-3.5 text-sm font-semibold border-b-2 -mb-px
                    transition-colors cursor-pointer
                    ${tab === t.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  {t.id === "documents" && item.documents
                    ? `${t.label} (${item.documents.length})`
                    : t.label}
                </button>
              ))}
            </div>
            <div className="p-6">
              {tab === "content"   && <SubmissionContentTab item={item} />}
              {tab === "documents" && <DocumentsTab documents={item.documents} />}
              {tab === "history"   && <HistoryTab history={item.reviewHistory} />}
            </div>
          </div>
        </div>

        {/* Right column — scoring & decision */}
        <div className="space-y-6">
          {/* Scoring panel */}
          <div className="bg-blue-700 rounded-2xl p-5 text-white">
            <h3 className="font-bold flex items-center gap-2">
              <FaShieldAlt className="text-sm" /> Scoring & Feedback
            </h3>
            <p className="text-blue-200 text-xs mt-1">Per clinical integrity protocol</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            {CRITERIA.map((c) => (
              <ScoreSlider
                key={c.key}
                label={c.label}
                value={scores[c.key]}
                onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))}
              />
            ))}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Aggregate score</span>
              <span className="text-lg font-bold text-blue-700">{aggregateScore}/10</span>
            </div>
          </div>

          {/* Decision panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Final Decision</h3>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="decision-select" className="text-xs font-semibold uppercase
                tracking-widest text-slate-500">
                Decision <span className="text-red-500">*</span>
              </label>
              <select
                id="decision-select"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200
                  bg-white text-slate-800 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              >
                <option value="" disabled>Select a decision…</option>
                {DECISION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback" className="text-xs font-semibold uppercase
                tracking-widest text-slate-500">
                Feedback for researcher <span className="text-red-500">*</span>
              </label>
              <textarea
                id="feedback"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={submitting}
                placeholder="Provide clear feedback — what was done well and what needs improvement…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200
                  bg-white text-slate-800 text-sm outline-none resize-none
                  placeholder-slate-400 focus:border-blue-500 focus:ring-2
                  focus:ring-blue-500/10 transition-all disabled:bg-slate-100
                  disabled:cursor-not-allowed"
              />
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Minimum 10 characters</span>
                <span className={`text-xs font-medium ${feedback.length > 450 ? "text-amber-600" : "text-slate-400"}`}>
                  {feedback.length}/500
                </span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={certified}
                onChange={(e) => setCertified(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600
                  focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              />
              <span className="text-xs text-slate-500 leading-relaxed">
                I certify that I have reviewed this submission in accordance with the
                hospital's clinical integrity protocols.
              </span>
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5
                rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting
                ? <><FaSpinner className="animate-spin" /> Submitting…</>
                : <><FaPaperPlane className="text-xs" /> Submit Decision</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmission;
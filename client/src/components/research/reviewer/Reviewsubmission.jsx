import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaShieldAlt,
  FaCalendarAlt,
  FaUser,
  FaEye,
  FaFileAlt,
  FaCheck,
  FaChevronLeft,
  FaPaperPlane,
  FaSpinner,
  FaHistory,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  getResearchById,
  getReviewHistory,
  submitReview,
} from "../../../api/research";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL?.replace('/api', '') || "";

const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url}`;
};

//  Constants
const STAGE_LABELS = {
  proposal: "Proposal",
  progress: "Progress Submission",
  final_paper: "Final Paper",
};

const STAGE_BADGE_COLORS = {
  proposal: "bg-blue-50 text-blue-700 border-blue-200",
  progress: "bg-amber-50 text-amber-700 border-amber-200",
  final_paper: "bg-green-50 text-green-700 border-green-200",
};

const STEPS = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "review", label: "Review" },
  { id: "decision", label: "Decision" },
];

const STAGE_ORDER = ["proposal", "progress", "final_paper"];

const stagesUpTo = (stage) => {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx === -1 ? [] : STAGE_ORDER.slice(0, idx + 1);
};

const CRITERIA_BY_STAGE = {
  proposal: [
    { key: "originality", label: "Originality" },
    { key: "relevance", label: "Clinical Relevance" },
    { key: "feasibility", label: "Feasibility" },
    { key: "ethics", label: "Ethics Compliance" },
    { key: "expectedImpact", label: "Expected Impact" },
  ],
  progress: [
    { key: "methodologyCompliance", label: "Methodology Compliance" },
    { key: "dataQuality", label: "Data Quality" },
    { key: "statisticalValidity", label: "Statistical Validity" },
    { key: "ethicalCompliance", label: "Ethical Compliance" },
    { key: "researchProgress", label: "Research Progress" },
  ],
  final_paper: [
    { key: "scientificIntegrity", label: "Scientific Integrity" },
    { key: "publicationReadiness", label: "Publication Readiness" },
    { key: "documentCompleteness", label: "Document Completeness" },
    {
      key: "institutionalCompliance",
      label: "Institutional Standards Compliance",
    },
  ],
};

const getCriteria = (stage) => CRITERIA_BY_STAGE[stage] || [];

const DECISION_OPTIONS_BY_STAGE = {
  proposal: [
    { value: "approved", label: "Approve" },
    { value: "revision", label: "Revision Needed" },
    { value: "rejected", label: "Reject" },
  ],
  final_paper: [
    { value: "approved", label: "Approve" },
    { value: "revision", label: "Revision Needed" },
    { value: "rejected", label: "Reject" },
  ],
  progress: [
    { value: "approved", label: "Approve" },
    { value: "revision", label: "Revision Needed" },
    { value: "suspended", label: "Suspend Study" },
  ],
};

const getDecisionOptions = (stage) => DECISION_OPTIONS_BY_STAGE[stage] || [];

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const PROPOSAL_FIELDS = [
  { title: "Abstract", key: "abstract" },
  { title: "Background / Problem Statement", key: "background" },
  { title: "Objectives", key: "objectives" },
  { title: "Hypotheses", key: "hypotheses" },
  { title: "Literature Review Summary", key: "literatureReviewSummary" },
  { title: "Methodology", key: "methodology" },
  { title: "Expected Outcome", key: "expectedOutcome" },
  { title: "Timeline", key: "timeline" },
  { title: "Funding Source", key: "fundingSource" },
  { title: "Ethics Information", key: "ethicsInformation" },
  { title: "Team Members", key: "teamMembers" },
  { title: "References", key: "references" },
];

const PROGRESS_FIELDS = [
  { title: "Progress — Methodology", key: ["progressData", "methodology"] },
  { title: "Study Design", key: ["progressData", "studyDesign"] },
  { title: "Sampling Method", key: ["progressData", "samplingMethod"] },
  {
    title: "Sample Size (Achieved / Target)",
    key: ["progressData", "sampleSizeAchieved"],
    pairedKey: ["progressData", "sampleSizeTarget"],
  },
  {
    title: "Data Collection Progress",
    key: ["progressData", "dataCollectionProgress"],
  },
  { title: "Statistical Methods", key: ["progressData", "statisticalMethods"] },
  { title: "Analysis Tools", key: ["progressData", "analysisTools"] },
  {
    title: "Preliminary Findings",
    key: ["progressData", "preliminaryFindings"],
  },
  {
    title: "Deviations from Protocol",
    key: ["progressData", "deviationsFromProtocol"],
  },
  { title: "Ethical Incidents", key: ["progressData", "ethicalIncidents"] },
  {
    title: "Participant Withdrawals",
    key: ["progressData", "participantWithdrawals"],
  },
];

const FINAL_FIELDS = [
  { title: "Final Abstract", key: "finalAbstract" },
  { title: "Keywords", key: "keywords", isList: true },
  { title: "AI Usage Declaration", key: "aiUsageDeclaration" },
  { title: "Conflict of Interest", key: "conflictOfInterest" },
  { title: "Funding Disclosures", key: "fundingDisclosures" },
  { title: "Consent Documentation", key: "consentDocumentation" },
];

const getAt = (obj, path) => {
  if (!path) return undefined;
  if (typeof path === "string") return obj?.[path];
  return path.reduce((acc, k) => acc?.[k], obj);
};

const buildSections = (item, fieldDefs) =>
  fieldDefs
    .map((f) => {
      const value = getAt(item, f.key);
      const paired = f.pairedKey ? getAt(item, f.pairedKey) : undefined;
      if (f.isList) {
        return Array.isArray(value) && value.length
          ? { title: f.title, body: value.join(", ") }
          : null;
      }
      if (f.pairedKey) {
        if (value == null && paired == null) return null;
        return { title: f.title, body: `${value ?? "—"} / ${paired ?? "—"}` };
      }
      return value ? { title: f.title, body: value } : null;
    })
    .filter(Boolean);

const fileLabel = (key) =>
  ({
    proposalFile: "Proposal Document",
    finalPaperFile: "Final Paper",
    draftManuscript: "Draft Manuscript",
    datasets: "Datasets",
    statisticalOutputs: "Statistical Outputs",
    surveyTools: "Survey Tools",
    interviewGuides: "Interview Guides",
  })[key] || key;

const collectDocuments = (item, visibleStages) => {
  if (!item) return [];
  const docs = [];

  if (visibleStages.includes("proposal") && item.proposalFile) {
    docs.push({
      name: fileLabel("proposalFile"),
      url: resolveUrl(item.proposalFile),
      stage: "proposal",
    });
  }

  if (visibleStages.includes("progress") && Array.isArray(item.progressFiles)) {
    item.progressFiles.forEach((f) => {
      if (f?.url) {
        docs.push({
          name: fileLabel(f.label) || "Progress File",
          url: resolveUrl(f.url),
          stage: "progress",
        });
      }
    });
  }

  if (visibleStages.includes("final_paper")) {
    if (item.finalPaperFile) {
      docs.push({
        name: fileLabel("finalPaperFile"),
        url: resolveUrl(item.finalPaperFile),
        stage: "final_paper",
      });
    }
    if (Array.isArray(item.finalPaperFiles)) {
      item.finalPaperFiles.forEach((f) => {
        if (f?.url) {
          docs.push({
            name: fileLabel(f.label) || "Supporting File",
            url: resolveUrl(f.url),
            stage: "final_paper",
          });
        }
      });
    }
  }

  return docs;
};

const mapAndGroupHistory = (reviews) => {
  if (!Array.isArray(reviews)) return {};
  const grouped = {};
  reviews.forEach((r) => {
    const stage = r.stage || "unknown";
    if (!grouped[stage]) grouped[stage] = [];
    grouped[stage].push({
      reviewerName: r.reviewer?.name || r.reviewer?.firstName || "Reviewer",
      reviewerRole: r.reviewerRole,
      decision: r.decision,
      comment: r.comment,
      createdAt: r.submittedAt || r.createdAt,
      round: r.round,
    });
  });
  return grouped;
};

const TABS = [
  { id: "content", label: "Submission Content" },
  { id: "documents", label: "Uploaded Documents" },
  { id: "history", label: "Review History" },
];

//  Local building blocks
const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const ErrorState = ({ message, onRetry, onBack }) => (
  <div className="flex flex-col items-center py-20 gap-4 text-center">
    <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
      <FaExclamationTriangle className="text-xl text-red-500" />
    </div>
    <div>
      <p className="font-semibold text-slate-800">
        Couldn't load this submission
      </p>
      <p className="text-sm text-slate-500 mt-1">{message}</p>
    </div>
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onBack}
        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700
          hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer"
      >
        Back to queue
      </button>
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700
          text-white text-sm font-semibold transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  </div>
);

// Visual-only stepper
const Stepper = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center gap-3 px-6 py-5">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                border-2 transition-colors
                ${
                  isCurrent
                    ? "border-blue-500 text-blue-600 bg-white"
                    : isComplete
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-200 text-slate-400 bg-slate-50"
                }`}
              >
                {isComplete ? <FaCheck className="text-[10px]" /> : i + 1}
              </div>
              <span
                className={`text-[11px] font-semibold uppercase tracking-widest
                ${isCurrent ? "text-blue-600" : isComplete ? "text-slate-700" : "text-slate-400"}`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-10 h-0.5 rounded-full ${isComplete ? "bg-blue-600" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Single labeled numeric score entry, 0-10, controlled
const ScoreInput = ({ label, value, onChange }) => {
  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange(0);

      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onChange(Math.min(10, Math.max(0, n)));
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-slate-600 flex-1">{label}</label>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={handleChange}
          aria-label={label}
          className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm
            font-bold text-slate-900 text-center outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
        />
        <span className="text-xs text-slate-400">/10</span>
      </div>
    </div>
  );
};

//  Submission content tab (stage-cumulative)
const ContentSectionGroup = ({ label, sections }) => {
  if (sections.length === 0) return null;
  return (
    <div className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      {sections.map((s) => (
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
};

const SubmissionContentTab = ({ item, visibleStages }) => {
  const proposalSections = buildSections(item, PROPOSAL_FIELDS);
  const progressSections = visibleStages.includes("progress")
    ? buildSections(item, PROGRESS_FIELDS)
    : [];
  const finalSections = visibleStages.includes("final_paper")
    ? buildSections(item, FINAL_FIELDS)
    : [];

  const hasAny =
    proposalSections.length || progressSections.length || finalSections.length;

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-400 py-6 text-center">
        No written content available for this submission.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <ContentSectionGroup label="Proposal" sections={proposalSections} />
      <ContentSectionGroup
        label="Progress Submission"
        sections={progressSections}
      />
      <ContentSectionGroup label="Final Paper" sections={finalSections} />
    </div>
  );
};

//  Documents tab
const STAGE_GROUP_LABELS = {
  proposal: "Proposal",
  progress: "Progress Submission",
  final_paper: "Final Paper",
};

const DocumentsTab = ({ documents }) => {
  const safeDocuments = Array.isArray(documents) ? documents : [];

  if (safeDocuments.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-6 text-center">
        No documents uploaded.
      </p>
    );
  }

  const byStage = safeDocuments.reduce((acc, doc) => {
    (acc[doc.stage] = acc[doc.stage] || []).push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(byStage).map(([stage, docs]) => (
        <div key={stage}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            {STAGE_GROUP_LABELS[stage] || stage}
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {docs.map((doc) => (
              <div
                key={doc.url}
                className="flex items-center justify-between gap-3 border border-slate-200
                  rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FaFileAlt className="text-blue-500 shrink-0" />
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {doc.name}
                  </p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`View ${doc.name}`}
                  className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                >
                  <FaEye />
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

//  Review history tab (grouped by stage)
const HistoryTab = ({ groupedHistory, loading, error }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-7 h-7 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const stages = Object.keys(groupedHistory || {});

  if (stages.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-6 text-center">
        No prior review history.
      </p>
    );
  }

  const orderedStages = [
    ...STAGE_ORDER,
    ...stages.filter((s) => !STAGE_ORDER.includes(s)),
  ].filter((s) => groupedHistory[s]);

  return (
    <div className="space-y-8">
      {orderedStages.map((stage) => (
        <div key={stage}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            {STAGE_LABELS[stage] || stage}
          </p>
          <div className="space-y-4">
            {groupedHistory[stage].map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b border-slate-50 pb-4 last:border-0"
              >
                <FaHistory className="text-slate-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">{h.reviewerName}</span>
                    {h.reviewerRole === "committee" ? " (Committee)" : ""}
                    {h.round ? ` — Round ${h.round}` : ""} — {h.decision}
                  </p>
                  {h.comment && (
                    <p className="text-sm text-slate-500 mt-1">{h.comment}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {fmt(h.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

//  Review Submission page
const ReviewSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState("content");

  const [groupedHistory, setGroupedHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [scores, setScores] = useState({});
  const [decision, setDecision] = useState("");
  const [feedback, setFeedback] = useState("");
  const [certified, setCertified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setHistoryLoading(true);
    setHistoryError(null);

    let loaded = null;
    let reviews = [];

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error("Request timed out — server took too long to respond."),
            ),
          15000,
        ),
      );
      loaded = await Promise.race([getResearchById(id), timeoutPromise]);
    } catch (err) {
      setLoadError(err.message || "Failed to load submission");
      setLoading(false);
      setHistoryLoading(false);
      return;
    }

    if (!loaded || !loaded._id) {
      setLoadError("This submission could not be found.");
      setLoading(false);
      setHistoryLoading(false);
      return;
    }

    if (!CRITERIA_BY_STAGE[loaded.stage]) {
      setLoadError(
        `This submission has an unrecognized stage ("${loaded.stage || "none"}") and can't be scored safely.`,
      );
      setLoading(false);
      setHistoryLoading(false);
      return;
    }

    setItem(loaded);
    setLoading(false);

    try {
      reviews = await getReviewHistory(loaded._id);
    } catch (err) {
      setHistoryError(err.message || "Failed to load review history");
      reviews = [];
    } finally {
      setHistoryLoading(false);
    }

    setGroupedHistory(mapAndGroupHistory(reviews));

    const latestReview = Array.isArray(reviews)
      ? [...reviews]
          .filter(
            (r) => r.stage === loaded.stage && r.reviewerRole === "reviewer",
          )
          .sort((a, b) => (b.round || 0) - (a.round || 0))[0]
      : null;

    if (isEditMode && latestReview) {
      const savedScores = latestReview.criteria || {};
      const defaultScores = Object.fromEntries(
        getCriteria(loaded.stage).map((c) => [c.key, savedScores[c.key] ?? 5]),
      );
      setScores(defaultScores);
      setDecision(latestReview.decision || "");
      setFeedback(latestReview.comment || "");
    } else {
      setScores(
        Object.fromEntries(getCriteria(loaded.stage).map((c) => [c.key, 5])),
      );
    }
  }, [id, isEditMode]);

  useEffect(() => {
    load();
  }, [load]);


  useEffect(() => {
    if (!item) return;
    setScores((prev) => {
      const keys = getCriteria(item.stage).map((c) => c.key);

      const alreadySet = keys.every((k) => Number.isFinite(Number(prev[k])));
      if (alreadySet) return prev;
      const next = {};
      keys.forEach((k) => {
        next[k] = Number.isFinite(Number(prev[k])) ? prev[k] : 5;
      });
      return next;
    });
  }, [item?.stage]);

  const visibleStages = item ? stagesUpTo(item.stage) : [];
  const criteria = item ? getCriteria(item.stage) : [];
  const documents = collectDocuments(item, visibleStages);

  const aggregateScore =
    criteria.length === 0
      ? "0.0"
      : (
          criteria.reduce((sum, c) => sum + (Number(scores[c.key]) || 0), 0) /
          criteria.length
        ).toFixed(1);

  const canSubmit =
    decision && feedback.trim().length >= 10 && certified && !submitting;

  const handleSubmit = async () => {
    if (!decision) {
      toast.error("Select a final decision");
      return;
    }
    if (feedback.trim().length < 10) {
      toast.error("Feedback must be at least 10 characters");
      return;
    }
    if (!certified) {
      toast.error("Please certify your review before submitting");
      return;
    }
    const criteriaKeys = getCriteria(item.stage).map((c) => c.key);
    const missing = criteriaKeys.filter(
      (k) =>
        scores[k] === undefined ||
        scores[k] === "" ||
        Number.isNaN(Number(scores[k])),
    );
    if (missing.length) {
      toast.error("Please score all criteria before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await submitReview(item._id, {
        stage: item.stage,
        decision,
        comment: feedback,
        criteria: scores,
      });
      toast.success("Review submitted successfully!");
      navigate("/research/dashboard/review-queue");
    } catch (err) {
      const message =
        err?.message ||
        err?.error ||
        "Failed to submit review. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner label="Loading submission…" />;

  if (loadError) {
    return (
      <ErrorState
        message={loadError}
        onRetry={load}
        onBack={() => navigate(-1)}
      />
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800
          transition-colors cursor-pointer"
      >
        <FaChevronLeft className="text-xs" /> Back to queue
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {item.researchId && (
                <span className="text-xs font-bold text-slate-500">
                  {item.researchId}
                </span>
              )}
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border
                ${STAGE_BADGE_COLORS[item.stage] || "bg-slate-50 text-slate-600 border-slate-200"}`}
              >
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
                <FaCalendarAlt className="text-xs" /> Submitted{" "}
                {fmt(item.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isEditMode ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm text-slate-700">
          You are viewing a <strong>completed review</strong>. The scores and
          feedback below reflect your last submitted decision. You may edit and
          re-submit if this item is reassigned for review.
        </div>
      ) : item.status !== "under_review" ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
          This submission's current status is <strong>{item.status}</strong>,
          not "under review." Submitting a decision may be rejected by the
          server until it's reassigned for review.
        </div>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-6 pt-5">
              Review Progress
            </p>
            <Stepper currentStep="review" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-100 px-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-3.5 text-sm font-semibold border-b-2 -mb-px
                    transition-colors cursor-pointer
                    ${
                      tab === t.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {t.id === "documents"
                    ? `${t.label} (${documents.length})`
                    : t.label}
                </button>
              ))}
            </div>
            <div className="p-6">
              {tab === "content" && (
                <SubmissionContentTab
                  item={item}
                  visibleStages={visibleStages}
                />
              )}
              {tab === "documents" && <DocumentsTab documents={documents} />}
              {tab === "history" && (
                <HistoryTab
                  groupedHistory={groupedHistory}
                  loading={historyLoading}
                  error={historyError}
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-700 rounded-2xl p-5 text-white">
            <h3 className="font-bold flex items-center gap-2">
              <FaShieldAlt className="text-sm" /> Scoring & Feedback
            </h3>
            <p className="text-blue-200 text-xs mt-1">
              {STAGE_LABELS[item.stage] || item.stage} criteria · per clinical
              integrity protocol
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            {criteria.map((c) => (
              <ScoreInput
                key={c.key}
                label={c.label}
                value={scores[c.key] ?? ""}
                onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))}
              />
            ))}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">
                Aggregate score
              </span>
              <span className="text-lg font-bold text-blue-700">
                {aggregateScore}/10
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Final Decision</h3>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="decision-select"
                className="text-xs font-semibold uppercase
                tracking-widest text-slate-500"
              >
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
                <option value="" disabled>
                  Select a decision…
                </option>
                {getDecisionOptions(item.stage).map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="feedback"
                className="text-xs font-semibold uppercase
                tracking-widest text-slate-500"
              >
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
                <span className="text-xs text-slate-400">
                  Minimum 10 characters
                </span>
                <span
                  className={`text-xs font-medium ${feedback.length > 450 ? "text-amber-600" : "text-slate-400"}`}
                >
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
                I certify that I have reviewed this submission in accordance
                with the hospital's clinical integrity protocols.
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
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <FaPaperPlane className="text-xs" /> Submit Decision
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmission;

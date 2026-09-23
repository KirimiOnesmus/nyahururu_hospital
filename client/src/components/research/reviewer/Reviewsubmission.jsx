import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import notify from "../../../common/utils/notify";
import {
  FaShieldAlt, FaCalendarAlt, FaUser, FaDownload, FaEye, FaFileAlt,
  FaCheck, FaChevronLeft, FaPaperPlane, FaSpinner, FaHistory,
  FaExclamationTriangle, FaCloudUploadAlt, FaTimesCircle, FaPaperclip,
} from "react-icons/fa";
import * as research from "../../../api/research";
import RevisionComparison from "../RevisionComparison";
import { resolveAssetUrl } from "../../../config/env";

const resolveUrl = (url) => resolveAssetUrl(url);

const STAGE_LABELS = {
  initial_proposal:  "Proposal",
  amendment:         "Amendment",
  continuing_review: "Continuing Review",
  study_closure:     "Study Closure",
};

const REVIEWABLE_STAGES = Object.keys(STAGE_LABELS);

const STEPS = [
  { id: "draft",     label: "Draft"     },
  { id: "submitted", label: "Submitted" },
  { id: "review",    label: "Review"    },
  { id: "decision",  label: "Decision"  },
];

const CRITERIA_BY_TYPE = {
  initial_proposal: [
    { key: "originality",     label: "Originality"         },
    { key: "relevance",       label: "Clinical Relevance"  },
    { key: "feasibility",     label: "Feasibility"         },
    { key: "ethics",          label: "Ethics Compliance"   },
    { key: "expectedImpact",  label: "Expected Impact"     },
  ],
  amendment: [
    { key: "justification",           label: "Justification"            },
    { key: "ethicalImplications",     label: "Ethical Implications"     },
    { key: "methodologicalSoundness", label: "Methodological Soundness" },
    { key: "protocolConsistency",     label: "Protocol Consistency"     },
  ],
  continuing_review: [
    { key: "methodologyCompliance", label: "Methodology Compliance" },
    { key: "dataQuality",          label: "Data Quality"            },
    { key: "ethicalCompliance",    label: "Ethical Compliance"      },
    { key: "researchProgress",     label: "Research Progress"       },
  ],
  study_closure: [
    { key: "completeness",      label: "Completeness"      },
    { key: "dataIntegrity",     label: "Data Integrity"    },
    { key: "participantSafety", label: "Participant Safety" },
    { key: "dissemination",     label: "Dissemination"     },
  ],
};

const getCriteria = (type) => CRITERIA_BY_TYPE[type] || [];

const DECISION_OPTIONS = [
  { value: "approved", label: "Approve"         },
  { value: "revision", label: "Revision Needed" },
];


const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_ATTACHMENT_EXTENSIONS = [".pdf", ".docx", ".csv", ".xls", ".xlsx", ".zip"];
const ALLOWED_ATTACHMENT_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
];

const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

const TABS = [
  { id: "content",   label: "Submission Content" },
  { id: "documents", label: "Uploaded Documents"  },
  { id: "history",   label: "Review History"      },
];

const FILE_LABEL_MAP = {
  proposalFile:       "Proposal Document",
  finalPaperFile:     "Final Paper",
  draftManuscript:    "Draft Manuscript",
  datasets:           "Datasets",
  statisticalOutputs: "Statistical Outputs",
  surveyTools:        "Survey Tools",
  interviewGuides:    "Interview Guides",
};
const fileLabel = (key) => FILE_LABEL_MAP[key] || key;

const DOC_STAGE_LABELS = {
  initial_proposal:  "Proposal",
  amendment:         "Amendment",
  continuing_review: "Continuing Review",
  study_closure:     "Study Closure",
};

const collectDocuments = (item) => {
  if (!item) return [];
  const docs = [];

  if (item.proposalFile) {
    docs.push({
      name: fileLabel("proposalFile"),
      url: resolveUrl(item.proposalFile),
      stage: "initial_proposal",
    });
  }

  if (Array.isArray(item.progressFiles)) {
    item.progressFiles.forEach((f) => {
      if (f?.url) {
        docs.push({
          name: fileLabel(f.label) || "Progress File",
          url: resolveUrl(f.url),
          stage: "continuing_review",
        });
      }
    });
  }

  if (item.finalPaperFile) {
    docs.push({
      name: fileLabel("finalPaperFile"),
      url: resolveUrl(item.finalPaperFile),
      stage: "study_closure",
    });
  }

  if (Array.isArray(item.finalPaperFiles)) {
    item.finalPaperFiles.forEach((f) => {
      if (f?.url) {
        docs.push({
          name: fileLabel(f.label) || "Supporting File",
          url: resolveUrl(f.url),
          stage: "study_closure",
        });
      }
    });
  }

  return docs;
};



const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const UnrecognizedStageState = ({ stage, onBack }) => (
  <div className="bg-white rounded-2xl border border-red-200 p-10 flex flex-col items-center text-center gap-3">
    <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
      <FaExclamationTriangle className="text-2xl text-red-500" />
    </div>
    <h2 className="text-lg font-bold text-slate-900">Couldn't load this submission</h2>
    <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
      This submission has an unrecognized stage (&quot;{stage || "none"}&quot;) and can't be
      scored safely. Please contact an administrator to correct this record before it's reviewed.
    </p>
    <button
      type="button"
      onClick={onBack}
      className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200
        text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <FaChevronLeft className="text-xs" /> Back to queue
    </button>
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


const ScoreSlider = ({ label, value, onChange, disabled }) => (
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
      disabled={disabled}
      className={`w-full h-1.5 rounded-full bg-slate-200 accent-blue-600 ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    />
  </div>
);


const SubmissionContentTab = ({ item }) => {

  if (item.submissionType === "continuing_review") {
    const cr = item.continuingReviewData || {};
    const sections = [
      { title: "Progress Summary",       body: cr.progressSummary },
      { title: "Adverse Events",         body: cr.adverseEvents },
      { title: "Amendments During Period", body: cr.amendments },
      { title: "Constraints",            body: cr.constraints },
      { title: "Plans For Next Year",    body: cr.plansForNextYear },
    ].filter((s) => s.body);

    if (!sections.length) {
      return (
        <p className="text-sm text-slate-400 py-6 text-center">
          No written content available for this submission.
        </p>
      );
    }

    return (
      <div className="space-y-6">
        {(cr.participantsEnrolled != null || cr.participantsContinuing != null) && (
          <div className="flex gap-6">
            {cr.participantsEnrolled != null && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Participants Enrolled</h4>
                <p className="text-sm text-slate-600">{cr.participantsEnrolled}</p>
              </div>
            )}
            {cr.participantsContinuing != null && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Participants Continuing</h4>
                <p className="text-sm text-slate-600">{cr.participantsContinuing}</p>
              </div>
            )}
          </div>
        )}
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
  }

  const sections = [
    { title: "Abstract",    body: item.abstract },
    { title: "Background",  body: item.background },
    { title: "Objectives",  body: item.objectives },
    { title: "Methodology", body: item.methodology },
    { title: "Expected Outcome", body: item.expectedOutcome },
    { title: "Timeline",    body: item.timeline },
    { title: "Hypotheses",  body: item.hypotheses },
    { title: "Ethics Information", body: item.ethicsInformation },
    { title: "Funding Source", body: item.fundingSource },
  ].filter((s) => s.body);

  if (!sections.length) {
    return (
      <p className="text-sm text-slate-400 py-6 text-center">
        No written content available for this submission.
      </p>
    );
  }

  return (
    <div className="space-y-6">
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

const DocumentsTab = ({ documents = [] }) => {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-6 text-center">No documents uploaded.</p>
    );
  }

  const byStage = documents.reduce((acc, doc) => {
    (acc[doc.stage] = acc[doc.stage] || []).push(doc);
    return acc;
  }, {});

  const handleDownload = async (doc) => {
    try {
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const ext = doc.url.split(".").pop()?.split("?")[0] || "pdf";
      a.download = `${doc.name.replace(/\s+/g, "_")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      notify.error("Download failed — try opening the file and saving manually.");
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(byStage).map(([stage, docs]) => (
        <div key={stage}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            {DOC_STAGE_LABELS[stage] || stage}
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
                  <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${doc.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50
                      transition-colors"
                  >
                    <FaEye className="text-sm" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    aria-label={`Download ${doc.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50
                      transition-colors cursor-pointer"
                  >
                    <FaDownload className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const HistoryTab = ({ history, loading: histLoading, error }) => {
  if (histLoading) {
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

  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-6 text-center">No prior review history.</p>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((h, i) => {
        const roundLabel = h.round ? (h.round === 1 ? "Initial Review" : `Revision Round ${h.round - 1}`) : "";
        return (
        <div key={h.id || i} className="flex items-start gap-3 border-b border-slate-50 pb-4 last:border-0">
          <FaHistory className="text-slate-300 mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">
                  {h.reviewer?.name || h.reviewer?.firstName || "Reviewer"}
                </span>
                {h.reviewerRole === "committee" ? " (Committee)" : ""}
                {" — "}{h.decision}
              </p>
              {roundLabel && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                  {roundLabel}
                </span>
              )}
            </div>
            {h.comment && <p className="text-sm text-slate-500 mt-1">{h.comment}</p>}
            <p className="text-xs text-slate-400 mt-1">{fmt(h.submittedAt || h.createdAt)}</p>
          </div>
        </div>
        );
      })}
    </div>
  );
};

const ReviewSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("content");

  const [reviewHistory, setReviewHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [scores, setScores] = useState({});
  const [decision, setDecision] = useState("");
  const [feedback, setFeedback] = useState("");
  const [certified, setCertified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setHistoryLoading(true);
    setHistoryError(null);

    let loaded = null;
    try {
      loaded = await research.getResearchById(id);
    } catch (err) {
      notify.error(err.message || "Failed to load submission");
      navigate(-1);
      return;
    }

    if (!loaded || !loaded.id) {
      notify.error("Submission not found.");
      navigate(-1);
      return;
    }

    setItem(loaded);
    const criteriaList = getCriteria(loaded.submissionType);
    setScores(Object.fromEntries(criteriaList.map((c) => [c.key, 5])));
    setLoading(false);

    if ((loaded.resubmissionCount || 0) > 0) setTab("changes");

  
    try {
      const reviews = await research.getReviewHistory(loaded.id);
      const reviewList = Array.isArray(reviews) ? reviews : [];
      setReviewHistory(reviewList);

      const currentRound = (loaded.resubmissionCount || 0) + 1;
      const myReviews = reviewList.filter(
        (r) => r.reviewerRole === "reviewer" || reviewList.length === 1
      );
      const myReview = myReviews
        .slice()
        .sort((a, b) => (b.round || 0) - (a.round || 0))[0];

      if (myReview) {

        setExistingReview(myReview);
        setDecision(myReview.decision || "");
        setFeedback(myReview.comment || "");
        if (myReview.criteria && typeof myReview.criteria === "object") {
          setScores(myReview.criteria);
        }


        if ((myReview.round || 0) >= currentRound) {
          setAlreadyReviewed(true);
        }
      }
    } catch (err) {
      setHistoryError(err.message || "Failed to load review history");
    } finally {
      setHistoryLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const criteria = item ? getCriteria(item.submissionType) : [];

  const aggregateScore = criteria.length === 0 ? "0.0" : (
    criteria.reduce((sum, c) => sum + (scores[c.key] || 0), 0) / criteria.length
  ).toFixed(1);

  const documents = useMemo(() => collectDocuments(item), [item]);
  const isRevision = (item?.resubmissionCount || 0) > 0;
  const visibleTabs = useMemo(
    () =>
      isRevision ? [...TABS, { id: "changes", label: "Changes" }] : TABS,
    [isRevision],
  );

  const canSubmit =
    decision &&
    feedback.trim().length >= 10 &&
    certified &&
    !submitting;

  const handleAttachmentSelect = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file after removal

    if (attachments.length + picked.length > MAX_ATTACHMENTS) {
      setAttachmentError(`You can attach at most ${MAX_ATTACHMENTS} files.`);
      return;
    }

    const rejected = [];
    const accepted = [];
    picked.forEach((file) => {
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const validType =
        ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext) &&
        (file.type === "" || ALLOWED_ATTACHMENT_MIMES.includes(file.type));
      if (!validType) { rejected.push(`${file.name} (unsupported file type)`); return; }
      if (file.size > MAX_ATTACHMENT_SIZE) { rejected.push(`${file.name} (over 50MB)`); return; }
      accepted.push(file);
    });

    if (rejected.length) {
      setAttachmentError(`Not attached — ${rejected.join(", ")}`);
    } else {
      setAttachmentError("");
    }
    if (accepted.length) {
      setAttachments((prev) => [...prev, ...accepted]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentError("");
  };

  const handleSubmit = async () => {
    if (!decision) { notify.error("Select a final decision"); return; }
    if (feedback.trim().length < 10) { notify.error("Feedback must be at least 10 characters"); return; }
    if (!certified) { notify.error("Please certify your review before submitting"); return; }

    setSubmitting(true);
    try {
      await research.submitReview(item.id, {
        decision,
        comment: feedback,
        criteria: scores,
        attachments,
      });
      notify.success("Review submitted successfully!");
      navigate("/research/dashboard/review-queue");
    } catch (err) {
      notify.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner label="Loading submission…" />;
  if (!item) return null;

  const isReviewableStage = REVIEWABLE_STAGES.includes(item.submissionType);

  if (!isReviewableStage) {
    return (
      <div className="space-y-6">
        <UnrecognizedStageState
          stage={item.submissionType}
          onBack={() => navigate("/research/dashboard/review-queue")}
        />
      </div>
    );
  }

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
                <span className="text-xs font-bold text-slate-500">{item.researchId}</span>
              )}
              <span className="text-xs font-bold px-2.5 py-1 rounded-full
                bg-amber-50 text-amber-700 border border-amber-200">
                {STAGE_LABELS[item.submissionType] || item.submissionType}
              </span>
              {(item.resubmissionCount || 0) > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full
                  bg-orange-50 text-orange-700 border border-orange-200">
                  Review Round {(item.resubmissionCount || 0) + 1}
                </span>
              )}
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

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-2xl border border-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-6 pt-5">
              Review Progress
            </p>
            <Stepper currentStep="review" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-100 px-2">
              {visibleTabs.map((t) => (
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
                  {t.id === "documents"
                    ? `${t.label} (${documents.length})`
                    : t.label}
                </button>
              ))}
            </div>
            <div className="p-6">
              {tab === "content"   && <SubmissionContentTab item={item} />}
              {tab === "documents" && <DocumentsTab documents={documents} />}
              {tab === "changes"   && <RevisionComparison researchId={item.id} />}
              {tab === "history"   && (
                <HistoryTab
                  history={reviewHistory}
                  loading={historyLoading}
                  error={historyError}
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">

          {alreadyReviewed && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
              <FaCheck className="text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800">Review Already Submitted</p>
                <p className="text-xs text-green-700 mt-1 leading-relaxed">
                  You have already submitted your review for this submission
                  {existingReview?.submittedAt ? ` on ${fmt(existingReview.submittedAt)}` : ""}.
                  Your scores and feedback are shown below in read-only mode.
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-700 rounded-2xl p-5 text-white">
            <h3 className="font-bold flex items-center gap-2">
              <FaShieldAlt className="text-sm" /> {alreadyReviewed ? "Your Submitted Review" : "Scoring & Feedback"}
            </h3>
            <p className="text-blue-200 text-xs mt-1">
              {STAGE_LABELS[item.submissionType] || item.submissionType} criteria
              · per clinical integrity protocol
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            {criteria.map((c) => (
              <ScoreSlider
                key={c.key}
                label={c.label}
                value={scores[c.key]}
                onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))}
                disabled={alreadyReviewed}
              />
            ))}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Aggregate score</span>
              <span className="text-lg font-bold text-blue-700">{aggregateScore}/10</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">{alreadyReviewed ? "Your Decision" : "Final Decision"}</h3>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="decision-select" className="text-xs font-semibold uppercase
                tracking-widest text-slate-500">
                Decision <span className="text-red-500">*</span>
              </label>
              <select
                id="decision-select"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                disabled={alreadyReviewed}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200
                  bg-white text-slate-800 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all
                  ${alreadyReviewed ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
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
                disabled={submitting || alreadyReviewed}
                placeholder="Provide clear feedback — what was done well and what needs improvement…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200
                  bg-white text-slate-800 text-sm outline-none resize-none
                  placeholder-slate-400 focus:border-blue-500 focus:ring-2
                  focus:ring-blue-500/10 transition-all disabled:bg-slate-100
                  disabled:cursor-not-allowed"
              />
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Minimum 10 characters</span>
                <span className={`text-xs font-medium ${feedback.length > 9000 ? "text-amber-600" : "text-slate-400"}`}>
                  {feedback.length}/10000
                </span>
              </div>
            </div>

            {!alreadyReviewed && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Supporting documents <span className="text-slate-400 normal-case font-normal">(optional)</span>
              </label>

              <label
                htmlFor="attachment-input"
                className={`flex flex-col items-center justify-center gap-1.5 px-3.5 py-4 rounded-xl
                  border-2 border-dashed text-center transition-colors
                  ${attachments.length >= MAX_ATTACHMENTS
                    ? "border-slate-100 bg-slate-50 cursor-not-allowed"
                    : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer"}`}
              >
                <FaCloudUploadAlt className="text-xl text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">
                  Click to attach files
                </span>
                <span className="text-[10px] text-slate-400">
                  PDF, DOCX, XLS(X), CSV or ZIP · up to 50MB each · max {MAX_ATTACHMENTS} files
                </span>
                <input
                  id="attachment-input"
                  type="file"
                  multiple
                  accept={ALLOWED_ATTACHMENT_EXTENSIONS.join(",")}
                  onChange={handleAttachmentSelect}
                  disabled={submitting || attachments.length >= MAX_ATTACHMENTS}
                  className="hidden"
                />
              </label>

              {attachmentError && (
                <p className="text-xs text-red-500">{attachmentError}</p>
              )}

              {attachments.length > 0 && (
                <ul className="space-y-1.5 mt-1">
                  {attachments.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg
                        bg-slate-50 border border-slate-200"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <FaPaperclip className="text-slate-400 text-xs shrink-0" />
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatBytes(file.size)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        disabled={submitting}
                        className="text-slate-400 hover:text-red-500 cursor-pointer transition-colors shrink-0"
                        title="Remove attachment"
                      >
                        <FaTimesCircle className="text-sm" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Attachments follow the same confidentiality rule as your comment —
                visible to the committee and Research Officer only, never directly
                to the researcher.
              </p>
            </div>
            )}

            {existingReview?.attachments?.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Submitted attachments
                </label>
                <ul className="space-y-1.5">
                  {existingReview.attachments.map((att, i) => (
                    <li key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                      <FaPaperclip className="text-slate-400 text-xs shrink-0" />
                      <a
                        href={resolveUrl(att.url || att)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-600 hover:underline truncate"
                      >
                        {att.label || `Attachment ${i + 1}`}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!alreadyReviewed && (
            <>
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
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmission;
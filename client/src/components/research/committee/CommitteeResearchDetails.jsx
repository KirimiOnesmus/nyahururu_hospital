import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import notify from "../../../common/utils/notify";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaShieldAlt,
  FaUserMd,
  FaBuilding,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaFilePdf,
  FaFileAlt,
  FaHourglassHalf,
  FaInfoCircle,
  FaUser,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaFileDownload,
  FaExternalLinkAlt,
  FaBookOpen,
  FaCommentDots,
  FaClipboardCheck,
} from "react-icons/fa";
import * as research from "../../../api/research";
import RevisionComparison from "../RevisionComparison";
import { API_BASE_URL, ASSET_BASE_URL } from "../../../config/env";

const LIFECYCLE_STAGES = [
  { id: "proposal", label: "Submission", sublabel: "Protocol" },
  { id: "review", label: "Review", sublabel: "Reviewers" },
  { id: "committee", label: "Committee", sublabel: "Decision" },
  { id: "decision", label: "Outcome", sublabel: "Sign-off" },
];

const STAGE_IDS = LIFECYCLE_STAGES.map((s) => s.id);

const STATUS_TO_STAGE_INDEX = {
  draft: 0,
  awaiting_payment: 0,
  submitted: 0,
  under_review: 1,
  revision_requested: 1,
  pending_committee_review: 2,
  approved: 3,
  rejected: 3,
  expired: 3,
  closed: 3,
  suspended: 1,
};

const TYPE_LABELS = {
  initial_proposal: "Initial Proposal",
  amendment: "Amendment",
  continuing_review: "Continuing Review",
  study_closure: "Study Closure",
};

const STATUS_CONFIG = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  awaiting_payment: { label: "Awaiting Payment", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  submitted: { label: "Submitted", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  under_review: { label: "Under Review", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pending_committee_review: { label: "With Committee", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  revision_requested: { label: "Revision Requested", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: FaCheckCircle },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200" },
  expired: { label: "Expired", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  closed: { label: "Closed", cls: "bg-slate-50 text-slate-700 border-slate-200" },
  suspended: { label: "Suspended", cls: "bg-red-50 text-red-700 border-red-200" },
};

const primaryBtn =
  "px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-sm font-semibold " +
  "transition-colors inline-flex items-center justify-center gap-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

const dangerOutlineBtn =
  "px-5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold " +
  "transition-colors inline-flex items-center justify-center gap-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

const secondaryBtn =
  "px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-blue-300 " +
  "hover:text-blue-700 text-sm font-semibold transition-colors inline-flex items-center " +
  "justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string" || !v.trim()) return [];
  return v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^\d+[.)]\s*/, ""));
};

// The review-history endpoint returns each review's rubric under `criteria`
// (see sequelize/models/review.js). Some records may carry a `scores` key
// instead, so we accept either without caring which one is present.
const getReviewCriteria = (rv) => {
  const c = rv?.scores || rv?.criteria;
  return c && typeof c === "object" ? c : null;
};

const averageOf = (values) =>
  values.length
    ? Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1))
    : null;

// A single reviewer's average across their submitted rubric — criteria are
// validated 0–10 on the backend (see validateCriteria in researchService.js).
const criteriaAverage = (rv) => {
  const criteria = getReviewCriteria(rv);
  if (!criteria) return null;
  const values = Object.values(criteria).filter(
    (v) => typeof v === "number" && !Number.isNaN(v),
  );
  return averageOf(values);
};

// Shared by both the current-stage reviews and, when this record is a
// continuing review, the original proposal's own reviews — so the committee
// can compare the two aggregates side by side. `fallback` supplies the
// legacy single stored score/criteria fields if no rubric rows exist yet.
const buildAggregate = (reviewsList = [], fallback = {}) => {
  const scores = reviewsList.map((rv) => criteriaAverage(rv)).filter((v) => v !== null);
  const avg = scores.length ? averageOf(scores) : (fallback.aggregateScore ?? fallback.avgScore ?? null);
  const scoredCount = scores.length;

  const aggregatedScores = (() => {
    if (reviewsList.length === 0) return fallback.scores || null;
    const keys = new Set(
      reviewsList.flatMap((rv) => Object.keys(getReviewCriteria(rv) || {})),
    );
    if (keys.size === 0) return fallback.scores || null;
    const totals = {};
    keys.forEach((k) => {
      totals[k] = 0;
    });
    reviewsList.forEach((rv) => {
      Object.entries(getReviewCriteria(rv) || {}).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + Number(v);
      });
    });
    const result = {};
    keys.forEach((k) => {
      result[k] = totals[k] / reviewsList.length;
    });
    return result;
  })();

  return { avg, scoredCount, aggregatedScores };
};

//  Building blocks
const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, title, sub }) => (
  <div className="flex flex-col items-center py-10 gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
      <Icon className="text-xl text-slate-400" />
    </div>
    <p className="font-semibold text-slate-700 text-sm">{title}</p>
    {sub && <p className="text-xs text-slate-400 max-w-xs">{sub}</p>}
  </div>
);

const MetaItem = ({ icon: Icon, value }) =>
  value ? (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
      <Icon className="text-xs text-slate-400 shrink-0" />
      {value}
    </span>
  ) : null;

// value is on a 0–5 scale here (criteria averages are converted before
// being passed in, since the underlying rubric is scored 0–10).
const StarRating = ({ value }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="flex items-center gap-0.5">
      {stars.map((s) => {
        if (value >= s) return <FaStar key={s} className="text-amber-400 text-xs" />;
        if (value >= s - 0.5) return <FaStarHalfAlt key={s} className="text-amber-400 text-xs" />;
        return <FaRegStar key={s} className="text-slate-300 text-xs" />;
      })}
      <span className="text-xs font-bold text-slate-600 ml-1">{Number(value).toFixed(1)}/5</span>
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown",
    cls: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${cfg.cls}`}
    >
      {Icon && <Icon className="text-[10px]" />}
      {cfg.label}
    </span>
  );
};

const LifecycleTracker = ({ status, activeStage, onStageClick }) => {
  const currentIndex = STATUS_TO_STAGE_INDEX[status] ?? 0;
  return (
    <div className="flex items-start">
      {LIFECYCLE_STAGES.map((stage, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isActive = i === activeStage;
        return (
          <div key={stage.id} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => onStageClick(i)}
              aria-pressed={isActive}
              title={`View ${stage.sublabel}`}
              className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group focus:outline-none"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all
                  ring-2 ring-offset-2
                  ${isActive ? "ring-blue-400" : "ring-transparent"}
                  ${
                    isComplete
                      ? "bg-blue-900 text-white"
                      : isCurrent
                        ? "bg-cyan-100 border-2 border-cyan-500"
                        : "bg-slate-100 border-2 border-slate-200 group-hover:border-blue-300"
                  }`}
              >
                {isComplete ? (
                  <FaCheck className="text-xs" />
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                ) : null}
              </div>
              <div className="text-center">
                <p
                  className={`text-xs font-bold transition-colors group-hover:text-blue-900
                    ${isActive ? "text-blue-900" : isComplete ? "text-slate-700" : "text-slate-400"}`}
                >
                  {stage.label}
                </p>
                <p className={`text-[10px] ${isActive ? "text-cyan-600" : "text-slate-400"}`}>
                  {stage.sublabel}
                </p>
              </div>
            </button>
            {i < LIFECYCLE_STAGES.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 -mt-7 transition-colors
                  ${i < currentIndex ? "bg-blue-900" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const withToken = (rawUrl) => {
  if (!rawUrl) return rawUrl;
  const token = localStorage.getItem("token");
  const base = rawUrl.startsWith("http") ? rawUrl : `${ASSET_BASE_URL}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
  if (token && base.includes("/uploads/")) {
    return `${base}${base.includes("?") ? "&" : "?"}token=${token}`;
  }
  return base;
};

const DocumentRow = ({ label, url, stageLabel }) => {
  if (!url) return null;
  const filename = url.split("/").pop() || label;
  const authUrl = withToken(url);
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <FaFilePdf className="text-red-500 text-sm" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{label}</p>
          {stageLabel && <p className="text-xs text-slate-400">{stageLabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-3">
        <a
          href={authUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          aria-label={`View ${label}`}
        >
          <FaExternalLinkAlt className="text-xs" />
        </a>
        <a
          href={authUrl}
          download={filename}
          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          aria-label={`Download ${label}`}
        >
          <FaDownload className="text-xs" />
        </a>
      </div>
    </div>
  );
};

const ScoreCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 p-4 text-center">
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-2xl font-bold text-slate-800">
      {value != null ? Number(value).toFixed(1) : "—"}
    </p>
  </div>
);

const ReviewerCard = ({ review, index }) => {
  const name =
    review.reviewerName ||
    review.reviewer?.name ||
    review.reviewer?.displayName ||
    `Reviewer ${index + 1}`;
  const email = review.reviewer?.email;
  const recommendation = review.recommendation || review.decision;
  const isApprove = ["approved", "highly_recommended", "approve"].includes(recommendation);
  const criteria = getReviewCriteria(review);
  // Criteria are scored 0–10 on the backend; the star widget is a 0–5
  // scale, so convert rather than feeding the raw 0–10 average straight in.
  const starValue =
    review.overallScore != null
      ? review.overallScore
      : criteriaAverage(review) != null
        ? criteriaAverage(review) / 2
        : null;

  return (
    <div className="border-l-2 border-blue-900 bg-slate-50/60 rounded-r-xl pl-4 pr-4 py-4">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {initials(name)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{name}</p>
            {email && <p className="text-xs text-slate-400">{email}</p>}
            <p className="text-xs text-slate-500">
              {fmtDate(review.submittedAt || review.reviewedAt || review.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {starValue != null && <StarRating value={starValue} />}
          {recommendation && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border
                ${
                  isApprove
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
            >
              {isApprove ? "Recommend: Approve" : "Recommend: Revise"}
            </span>
          )}
        </div>
      </div>

      {criteria && Object.keys(criteria).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {Object.entries(criteria).map(([key, val]) => (
            <div
              key={key}
              className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
                {key.replace(/_/g, " ")}
              </p>
              <p className="text-sm font-bold text-slate-800">{Number(val).toFixed(1)}</p>
            </div>
          ))}
        </div>
      )}

      {(review.comments || review.comment) && (
        <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-2 mt-1">
          {review.comments || review.comment}
        </p>
      )}
    </div>
  );
};

const AuditEntry = ({ text, time }) => (
  <div className="flex gap-3">
    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
    <div>
      <p className="text-sm text-slate-700">{text}</p>
      <p className="text-xs text-slate-400">{time}</p>
    </div>
  </div>
);

// Toggles between the original proposal and the current continuing-review
// stage when a submission has a parent study, so the committee can flip
// between "what was approved" and "what's being reported now" without
// losing their place on the page.
const TabButton = ({ active, onClick, icon: Icon, label, sub }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors cursor-pointer
      ${active ? "bg-blue-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
  >
    <span
      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
        ${active ? "bg-white/15" : "bg-slate-100"}`}
    >
      <Icon className={`text-sm ${active ? "text-white" : "text-slate-500"}`} />
    </span>
    <span className="min-w-0">
      <span className={`block text-sm font-bold truncate ${active ? "text-white" : "text-slate-800"}`}>
        {label}
      </span>
      <span className={`block text-xs truncate ${active ? "text-blue-100" : "text-slate-400"}`}>
        {sub}
      </span>
    </span>
  </button>
);

const ProposalPanel = ({ r }) => (
  <>
    {(r.abstract ||
      r.background ||
      r.methodology ||
      r.expectedOutcome ||
      r.objectives.length > 0 ||
      r.keywords.length > 0) && (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base">Proposal Content</h2>

        {r.abstract && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              Abstract
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{r.abstract}</p>
          </div>
        )}
        {r.background && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              Background
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{r.background}</p>
          </div>
        )}
        {r.methodology && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              Methodology
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{r.methodology}</p>
          </div>
        )}
        {r.expectedOutcome && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              Expected Outcome
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{r.expectedOutcome}</p>
          </div>
        )}
        {r.objectives.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Objectives
            </p>
            <ul className="space-y-1.5">
              {r.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}
        {r.keywords.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Keywords
            </p>
            <div className="flex flex-wrap gap-2">
              {r.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )}

    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="font-bold text-slate-900 text-base mb-4">Proposal Document</h2>
      {r.proposalFile ? (
        <DocumentRow label="Proposal File" url={r.proposalFile} stageLabel="Stage 1 · Proposal" />
      ) : (
        <EmptyState
          icon={FaFileAlt}
          title="No proposal document uploaded"
          sub="The researcher has not yet attached a proposal file."
        />
      )}
    </div>
  </>
);

// A continuing review's own row leaves the proposal fields (abstract,
// background, objectives, …) NULL — that content lives on the parent study.
// Its actual written content is the progress-report narrative, which the
// backend flattens onto `continuingReviewData` (see stageDetailToLegacy in
// researchService.js), together with `progressFiles` for the uploaded
// supporting documents. This mirrors the shape the reviewer-facing
// SubmissionContentTab already renders (Reviewsubmission.jsx), so the
// committee sees the same content the reviewers scored.
const ProgressPanel = ({ r }) => {
  const cr = r.continuingReviewData || {};

  const metrics = [
    { label: "Participants Enrolled", value: cr.participantsEnrolled },
    { label: "Participants Continuing", value: cr.participantsContinuing },
  ].filter((f) => f.value != null && f.value !== "");

  const narrative = [
    { label: "Progress Summary", value: cr.progressSummary },
    { label: "Adverse Events", value: cr.adverseEvents },
    { label: "Amendments During Period", value: cr.amendments },
    { label: "Constraints", value: cr.constraints },
    { label: "Plans For Next Year", value: cr.plansForNextYear },
  ].filter((f) => f.value);

  const progressFiles = Array.isArray(r.progressFiles) ? r.progressFiles : [];

  return (
    <>
      {(metrics.length > 0 || narrative.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-bold text-slate-900 text-base">Progress Report</h2>
            {cr.isLastYear && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border bg-purple-50 text-purple-700 border-purple-200">
                Final Year Report
              </span>
            )}
          </div>

          {metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {metrics.map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          )}

          {narrative.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                {label}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{value}</p>
            </div>
          ))}

          {cr.submittedAt && (
            <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">
              Submitted {fmtDate(cr.submittedAt)}
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 text-base mb-4">Progress Report Documents</h2>
        {progressFiles.length === 0 ? (
          <EmptyState
            icon={FaFileAlt}
            title="No progress report documents uploaded"
            sub="The researcher has not yet submitted supporting files for this continuing review."
          />
        ) : (
          progressFiles.map((f, i) => (
            <DocumentRow
              key={f.id || f.url || i}
              label={
                f.label
                  ? f.label
                      .replace(/([a-z])([A-Z])/g, "$1 $2")
                      .replace(/^\w/, (c) => c.toUpperCase())
                  : `Progress File ${i + 1}`
              }
              url={f.url}
              stageLabel="Continuing Review"
            />
          ))
        )}
      </div>
    </>
  );
};

const FinalPaperPanel = ({ r }) => {
  const fps = r.finalPaperSubmission || {};
  const supporting = fps.supportingFiles || {};
  const declarations = fps.declarations || {};

  const finalDocs = [
    { label: "Final Paper", url: r.finalPaperFile, stageLabel: "Stage 3 · Final Paper" },
    {
      label: "Final Dataset",
      url: supporting.finalDataset?.url,
      stageLabel: "Stage 3 · Final Paper",
    },
    {
      label: "Data Dictionary",
      url: supporting.dataDictionary?.url,
      stageLabel: "Stage 3 · Final Paper",
    },
    {
      label: "Statistical Scripts",
      url: supporting.statisticalScripts?.url,
      stageLabel: "Stage 3 · Final Paper",
    },
    { label: "Ethics Approval", url: supporting.ethicsApproval?.url, stageLabel: "Compliance" },
    {
      label: "Funding Disclosure",
      url: supporting.fundingDisclosure?.url,
      stageLabel: "Compliance",
    },
    { label: "Plagiarism Report", url: fps.plagiarismReportLink, stageLabel: "Compliance" },
  ].filter((d) => d.url);

  const aiDeclared = declarations.aiUsageDeclared;
  const coiDeclared = declarations.conflictOfInterestDeclared;
  const fundingSource = fps.fundingSource || r.fundingSource;

  return (
    <>
      {(r.finalAbstract || r.abstract || r.keywords.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Final Paper Details</h2>
          {r.finalAbstract ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Final Abstract
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{r.finalAbstract}</p>
            </div>
          ) : r.abstract ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Abstract
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{r.abstract}</p>
            </div>
          ) : null}
          {r.keywords.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Keywords
              </p>
              <div className="flex flex-wrap gap-2">
                {r.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              {
                label: "AI Usage",
                value: aiDeclared ? "Declared" : aiDeclared === false ? "Not declared" : null,
              },
              {
                label: "COI",
                value: coiDeclared ? "Declared" : coiDeclared === false ? "None" : null,
              },
              { label: "Funding", value: fundingSource },
            ]
              .filter((i) => i.value)
              .map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                </div>
              ))}
          </div>
          {fps.noteToCommittee && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">
                Note to Committee
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">{fps.noteToCommittee}</p>
            </div>
          )}
          {declarations.aiUsageDetails && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                AI Usage Details
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {declarations.aiUsageDetails}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 text-base mb-4">Final Paper Documents</h2>
        {finalDocs.length === 0 ? (
          <EmptyState
            icon={FaFileAlt}
            title="No final paper documents uploaded"
            sub="The researcher has not yet submitted final paper files."
          />
        ) : (
          finalDocs.map((doc) => <DocumentRow key={doc.label} {...doc} />)
        )}
      </div>
    </>
  );
};

const CommitteePanel = ({
  r,
  reviews,
  computedAvg,
  aggregatedScores,
  scoredReviewerCount,
  title = "Peer Review Evaluations",
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6">
    <div className="flex items-start justify-between gap-4 mb-5">
      <h2 className="font-bold text-slate-900 text-base">{title}</h2>
      {computedAvg != null && (
        <div className="text-right shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Avg Score
          </p>
          <p className="text-2xl font-bold text-blue-900">
            {Number(computedAvg).toFixed(1)}
            <span className="text-sm text-slate-400">/10.0</span>
          </p>
          {scoredReviewerCount > 0 && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              From {scoredReviewerCount} reviewer{scoredReviewerCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>

    {aggregatedScores && Object.keys(aggregatedScores).length > 0 && (
      <div
        className={`grid gap-3 mb-6 grid-cols-2 sm:grid-cols-${Math.min(Object.keys(aggregatedScores).length, 4)}`}
      >
        {Object.entries(aggregatedScores).map(([key, val]) => (
          <ScoreCard key={key} label={key.replace(/_/g, " ")} value={val} />
        ))}
      </div>
    )}

    {r.committeeRound > 1 && (
      <p className="text-xs text-slate-400 mb-4">Committee review round {r.committeeRound}</p>
    )}

    {reviews.length === 0 ? (
      <EmptyState
        icon={FaUser}
        title="No reviews yet"
        sub="No peer review submissions have been recorded for this research."
      />
    ) : (
      <>
        <h3 className="font-bold text-slate-800 text-sm mb-3">Reviewer Assessments</h3>
        <div className="space-y-3">
          {reviews.map((rv, i) => (
            <ReviewerCard key={rv.id || i} review={rv} index={i} />
          ))}
        </div>
      </>
    )}

    {r.committeeComment && (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 mt-4">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-1">
          Committee Comment
        </p>
        <p className="text-xs text-indigo-800 leading-relaxed">{r.committeeComment}</p>
      </div>
    )}
  </div>
);

const DecisionPanel = ({
  r,
  decisionMade,
  decisionLoading,
  noteToCommittee,
  goToSignOff,
}) => {
  const rawStatus = r.status || "pending";
  const isCommitteeStage = rawStatus === "pending_committee_review";
  const isApproved = ["approved", "closed"].includes(rawStatus);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <h2 className="font-bold text-slate-900 text-base">Committee Decision</h2>

      {decisionMade === "approved" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 flex items-start gap-3 text-sm text-emerald-800">
          <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" />
          <p>Decision recorded. This study is now committee approved.</p>
        </div>
      )}
      {decisionMade === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 flex items-start gap-3 text-sm text-red-700">
          <FaTimes className="text-red-500 shrink-0 mt-0.5" />
          <p>Decision recorded. The researcher will be notified.</p>
        </div>
      )}

      {!decisionMade && isCommitteeStage && (
        <>
          <p className="text-sm text-slate-500">
            Record the committee's final decision for this submission.
          </p>
          {noteToCommittee && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">
                Note from Researcher
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">{noteToCommittee}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className={primaryBtn}
              disabled={decisionLoading}
              onClick={goToSignOff}
            >
              Sign Off & Approve
            </button>
          </div>
        </>
      )}

      {!decisionMade && isApproved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 flex items-start gap-3 text-sm text-emerald-800">
          <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" />
          <p>Signed off by the committee{r.approvedAt ? ` on ${fmtDate(r.approvedAt)}` : ""}.</p>
        </div>
      )}

      {!decisionMade && !isCommitteeStage && !isApproved && (
        <p className="text-sm text-slate-400">
          This submission has not yet reached the committee decision stage.
        </p>
      )}
    </div>
  );
};

const CommitteeResearchDetails = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();

  const recordProp = state?.record ?? null;

  const [detail, setDetail] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [parentReviews, setParentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionMade, setDecisionMade] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [activeStage, setActiveStage] = useState(null);
  const [detailTab, setDetailTab] = useState("progress");

  const load = useCallback(async () => {
    const recordId = id || recordProp?.id;
    if (!recordId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [detailRes, reviewHistory] = await Promise.all([
        research.getResearchDetail(recordId),
        research.getReviewHistory(recordId).catch(() => []),
      ]);

      const paper = detailRes?.paper ?? detailRes ?? null;
      setDetail(paper);
      setReviews(Array.isArray(reviewHistory) ? reviewHistory : (reviewHistory?.reviews ?? []));

      // A continuing review (or amendment / closure) carries a parent study
      // (`parentResearchId`, flattened by the backend into `parentSummary`
      // on the detail payload). Pull that study's own peer-review history
      // too, so the committee can compare "what was originally approved"
      // against "what's being reported now" — not just the progress data.
      if (paper?.parentResearchId) {
        const parentHistory = await research
          .getReviewHistory(paper.parentResearchId)
          .catch(() => []);
        setParentReviews(
          Array.isArray(parentHistory) ? parentHistory : (parentHistory?.reviews ?? []),
        );
      } else {
        setParentReviews([]);
      }

      if (
        paper?.committeeReviewedBy ||
        ["approved", "rejected", "closed"].includes(paper?.status)
      ) {
        if (paper.status === "rejected") setDecisionMade("rejected");
        else if (["approved", "closed"].includes(paper.status)) setDecisionMade("approved");
      }
    } catch {
      notify.error("Failed to load research details");
    } finally {
      setLoading(false);
    }
  }, [id, recordProp]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (detail && activeStage === null) {
      const rawStatus = detail.status || "pending";
      setActiveStage(STATUS_TO_STAGE_INDEX[rawStatus] ?? 0);
    }
  }, [detail, activeStage]);

  // Default back to the progress-report tab whenever a different record is
  // loaded, so switching between queue items never leaves the committee
  // stranded on the previous record's "Original Proposal" tab.
  useEffect(() => {
    setDetailTab("progress");
  }, [detail?.id]);

  const goToSignOff = () => {
    const rid = detail?.id;
    if (!rid) return;
    navigate(`/research/dashboard/committee-sign-off/${rid}`);
  };

  const handleDecision = async (decision) => {
    const rid = detail?.id;
    if (!rid) return;
    setDecisionLoading(true);
    try {
      await research.submitCommitteeReview(rid, { decision, comment: `Committee ${decision}` });
      setDecisionMade(decision);
      notify.success("Revision request recorded");
    } catch {
      notify.error("Could not record the committee decision. Please try again.");
    } finally {
      setDecisionLoading(false);
    }
  };

  
  const handleDownloadAll = async () => {
    const rid = detail?.id;
    if (!rid) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/research/${rid}/download-zip`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${detail.projectId || rid}-full-package.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      notify.error("Failed to download package. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (!id && !recordProp) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 text-sm">No research record selected.</p>
      </div>
    );
  }
  if (loading) return <PageSpinner label="Loading research details…" />;

  const r = { ...recordProp, ...detail };
  r.objectives = toArray(r.objectives);
  r.keywords = toArray(r.keywords);
  r.coInvestigators = Array.isArray(r.coInvestigators) ? r.coInvestigators : [];

  const rawStatus = r.status || "pending";
  const isCommitteeStage = rawStatus === "pending_committee_review";
  const isApproved = ["approved", "closed"].includes(rawStatus);

  // For a continuing review, `parentSummary` (see getResearchById in
  // researchService.js) carries the FULL original proposal — content, file,
  // and lifecycle dates — so it needs the same normalisation as `r` before
  // ProposalPanel/CommitteePanel can render it.
  const isContinuingReview = r.submissionType === "continuing_review";
  const parentProposal = r.parentSummary
    ? {
        ...r.parentSummary,
        objectives: toArray(r.parentSummary.objectives),
        keywords: toArray(r.parentSummary.keywords),
        coInvestigators: Array.isArray(r.parentSummary.coInvestigators)
          ? r.parentSummary.coInvestigators
          : [],
      }
    : null;
  const showComparisonView = isContinuingReview && !!parentProposal;

  const relatedSubmissions = Array.isArray(r.childSubmissions) ? r.childSubmissions : [];

  const resolvedActiveStage = activeStage ?? STATUS_TO_STAGE_INDEX[rawStatus] ?? 0;
  const viewingStageId = STAGE_IDS[resolvedActiveStage];

  const effectiveReviews = (() => {
    if (reviews.length > 0) return reviews;
    if (r.reviewedBy && (r.reviewDecision || r.reviewComment)) {
      return [
        {
          reviewer: r.reviewedBy,
          recommendation: r.reviewDecision,
          comments: r.reviewComment,
          reviewedAt: r.reviewedAt,
          // aggregateScore is on a 0–10 scale; convert to the 0–5 scale
          // ReviewerCard's star widget expects.
          overallScore: r.aggregateScore != null ? r.aggregateScore / 2 : null,
        },
      ];
    }
    return [];
  })();

  // The real aggregate: average each reviewer's own rubric average (0–10
  // scale, matching how the backend computes aggregateScore — see
  // averageVoteScore in researchService.js), computed straight from the
  // actual criteria submitted rather than trusting a single stored field.
  const {
    avg: computedAvg,
    scoredCount: scoredReviewerCount,
    aggregatedScores,
  } = buildAggregate(effectiveReviews, r);

  // Same computation for the original proposal's own reviewers, so the
  // committee can compare the study's initial evaluation against this
  // continuing-review round side by side.
  const parentAggregate = parentProposal ? buildAggregate(parentReviews, parentProposal) : null;

  const noteToCommittee = r.finalPaperSubmission?.noteToCommittee || r.noteToCommittee || "";

  const auditTrail = Array.isArray(r.auditTrail) ? r.auditTrail : [];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer"
      >
        <FaArrowLeft className="text-xs" />
        Back to Reviews
      </button>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
          {r.title || "Untitled Research"}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <StatusBadge status={rawStatus} />
          {r.submissionType && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border bg-blue-50 text-blue-700 border-blue-200">
              {TYPE_LABELS[r.submissionType] || r.submissionType}
            </span>
          )}
          <MetaItem icon={FaShieldAlt} value={r.projectId || r.researchId || r.id} />
          <MetaItem
            icon={FaUserMd}
            value={r.researcher?.displayName || r.researcher?.name || r.researcherName}
          />
          <MetaItem icon={FaBuilding} value={r.discipline || r.department} />
          <MetaItem
            icon={FaCalendarAlt}
            value={r.createdAt ? `Submitted ${fmtDate(r.createdAt)}` : null}
          />
          {parentProposal && (
            <span className="inline-flex items-center gap-1.5 text-sm text-indigo-700">
              <FaBookOpen className="text-xs text-indigo-400 shrink-0" />
              Continuing review of &ldquo;{parentProposal.title}&rdquo;
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={downloading}
            className={secondaryBtn}
          >
            <FaFileDownload className="text-xs" />
            {downloading ? "Preparing…" : "Download All (.zip)"}
          </button>
          {isCommitteeStage && !decisionMade && (
            <button type="button" onClick={goToSignOff} className={primaryBtn}>
              <FaClipboardCheck className="text-sm" />
              Sign Off & Approve
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
              Research Lifecycle
            </h2>
            <LifecycleTracker
              status={rawStatus}
              activeStage={resolvedActiveStage}
              onStageClick={setActiveStage}
            />
          </div>

          {showComparisonView ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-col sm:flex-row gap-2">
                <TabButton
                  active={detailTab === "progress"}
                  onClick={() => setDetailTab("progress")}
                  icon={FaClipboardCheck}
                  label="Continuing Review"
                  sub="Progress report, files & reviews"
                />
                <TabButton
                  active={detailTab === "proposal"}
                  onClick={() => setDetailTab("proposal")}
                  icon={FaBookOpen}
                  label="Original Proposal"
                  sub="Approved protocol & reviews"
                />
              </div>

              {detailTab === "progress" ? (
                <>
                  <ProgressPanel r={r} />

                  {(r.resubmissionCount || 0) > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <RevisionComparison researchId={r.id} />
                    </div>
                  )}

                  <CommitteePanel
                    r={r}
                    reviews={effectiveReviews}
                    computedAvg={computedAvg}
                    aggregatedScores={aggregatedScores}
                    scoredReviewerCount={scoredReviewerCount}
                    title="Continuing Review — Peer Evaluations"
                  />

                  {(isCommitteeStage || isApproved || rawStatus === "rejected") && (
                    <DecisionPanel
                      r={r}
                      decisionMade={decisionMade}
                      decisionLoading={decisionLoading}
                      goToSignOff={goToSignOff}
                      noteToCommittee={noteToCommittee}
                    />
                  )}
                </>
              ) : (
                <>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-1">
                        Originally Approved Study
                      </p>
                      <p className="text-sm font-semibold text-indigo-900 truncate">
                        {parentProposal.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={parentProposal.status} />
                      {parentProposal.approvedAt && (
                        <span className="text-xs text-indigo-700 font-medium">
                          Approved {fmtDate(parentProposal.approvedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <ProposalPanel r={parentProposal} />

                  <CommitteePanel
                    r={parentProposal}
                    reviews={parentReviews}
                    computedAvg={parentAggregate?.avg}
                    aggregatedScores={parentAggregate?.aggregatedScores}
                    scoredReviewerCount={parentAggregate?.scoredCount}
                    title="Original Proposal — Peer Evaluations"
                  />
                </>
              )}
            </>
          ) : (
            <>
              <ProposalPanel r={r} />

              {(r.resubmissionCount || 0) > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <RevisionComparison researchId={r.id} />
                </div>
              )}

              <CommitteePanel
                r={r}
                reviews={effectiveReviews}
                computedAvg={computedAvg}
                aggregatedScores={aggregatedScores}
                scoredReviewerCount={scoredReviewerCount}
              />

              {(isCommitteeStage || isApproved || rawStatus === "rejected") && (
                <DecisionPanel
                  r={r}
                  decisionMade={decisionMade}
                  decisionLoading={decisionLoading}
                  goToSignOff={goToSignOff}
                  noteToCommittee={noteToCommittee}
                />
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Details
            </h2>
            <div className="space-y-3">
              {[
                { label: "Type", value: TYPE_LABELS[r.submissionType] || r.submissionType },
                { label: "Researcher", value: r.researcher?.displayName || r.researcher?.name },
                { label: "Discipline", value: r.discipline },
                { label: "SERU No.", value: r.seruNumber },
                { label: "Protocol Ver.", value: r.protocolVersionNumber },
                { label: "Programme", value: r.researchProgramme },
                { label: "Funding", value: r.fundingSource },
                { label: "Submitted", value: fmtDate(r.createdAt) },
                { label: "Approval Valid Until", value: r.approvalValidUntil ? fmtDate(r.approvalValidUntil) : null },
              ]
                .filter((i) => i.value && i.value !== "—")
                .map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">
                      {label}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 text-right">{value}</span>
                  </div>
                ))}
            </div>
            {r.coInvestigators?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Co-Investigators
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {r.coInvestigators.map((co, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-semibold"
                    >
                      {co.name || co}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {relatedSubmissions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Related Submissions
              </h2>
              <div className="space-y-2">
                {relatedSubmissions.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() =>
                      navigate(`/research/dashboard/committee-research-detail/${sub.id}`)
                    }
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200
                      px-3 py-2.5 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-slate-700 truncate">
                        {TYPE_LABELS[sub.submissionType] || sub.submissionType}
                        {sub.continuingReviewNumber ? ` #${sub.continuingReviewNumber}` : ""}
                        {sub.amendmentNumber ? ` #${sub.amendmentNumber}` : ""}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {fmtDate(sub.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={sub.status} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {auditTrail.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Audit Trail
              </h2>
              <div className="space-y-4">
                {auditTrail.map((entry, i) => (
                  <AuditEntry
                    key={i}
                    text={entry.text || entry.action}
                    time={entry.time || fmtDate(entry.createdAt)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 

export default CommitteeResearchDetails;
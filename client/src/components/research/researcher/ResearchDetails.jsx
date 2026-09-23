import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import notify from "../../../common/utils/notify";
import {
  FaArrowLeft, FaFlask, FaCalendarAlt, FaDownload, FaCheckCircle,
  FaTimesCircle, FaClock, FaCommentAlt, FaUserCircle, FaUniversity,
  FaBookOpen, FaChevronRight, FaShieldAlt, FaStar, FaFileAlt,
  FaTag, FaGlobe, FaHistory, FaExternalLinkAlt, FaLock,
  FaPauseCircle, FaFilePdf, FaFileExcel, FaFileWord, FaFileArchive,
  FaFileImage, FaFile, FaCertificate, FaInbox, FaArrowRight,
} from "react-icons/fa";

import * as research from "../../../api/research";
import { ASSET_BASE_URL } from "../../../config/env";

const STAGE_ORDER = ["submission", "review", "committee", "outcome"];

const STAGE_LABELS = {
  submission: "Submission",
  review: "Reviewer Evaluation",
  committee: "Committee Decision",
  outcome: "Outcome",
};

const STAGE_SHORT_LABELS = {
  submission: "Submitted",
  review: "Review",
  committee: "Committee",
  outcome: "Outcome",
};

const STAGE_COLORS = {
  submission: "bg-blue-100 text-blue-700 border border-blue-200",
  review: "bg-purple-100 text-purple-700 border border-purple-200",
  committee: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  outcome: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const TYPE_LABELS = {
  initial_proposal: "Initial Proposal",
  amendment: "Amendment",
  continuing_review: "Continuing Review",
  study_closure: "Study Closure",
};

const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    icon: FaCheckCircle,
    cls: "text-emerald-700 bg-emerald-50 border-emerald-300",
    iconText: "text-emerald-600",
    iconBg: "bg-emerald-100",
    bar: "bg-emerald-500",
    banner: "bg-emerald-50 border-emerald-200",
    bannerText: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Under Review",
    icon: FaClock,
    cls: "text-amber-700 bg-amber-50 border-amber-300",
    iconText: "text-amber-500",
    iconBg: "bg-amber-100",
    bar: "bg-amber-400",
    banner: "bg-amber-50 border-amber-200",
    bannerText: "text-amber-800",
    dot: "bg-amber-400",
  },
  rejected: {
    label: "Needs Revision",
    icon: FaTimesCircle,
    cls: "text-red-700 bg-red-50 border-red-300",
    iconText: "text-red-600",
    iconBg: "bg-red-100",
    bar: "bg-red-500",
    banner: "bg-red-50 border-red-200",
    bannerText: "text-red-800",
    dot: "bg-red-500",
  },
  suspended: {
    label: "Study Suspended",
    icon: FaPauseCircle,
    cls: "text-slate-700 bg-slate-100 border-slate-300",
    iconText: "text-slate-600",
    iconBg: "bg-slate-200",
    bar: "bg-slate-500",
    banner: "bg-slate-50 border-slate-200",
    bannerText: "text-slate-800",
    dot: "bg-slate-500",
  },
  locked: {
    label: "Locked",
    icon: FaLock,
    cls: "text-slate-400 bg-slate-50 border-slate-200",
    iconText: "text-slate-400",
    iconBg: "bg-slate-100",
    bar: "bg-slate-200",
    banner: "bg-slate-50 border-slate-200",
    bannerText: "text-slate-500",
    dot: "bg-slate-300",
  },
  committee_review: {
    label: "With Research Committee",
    icon: FaShieldAlt,
    cls: "text-indigo-700 bg-indigo-50 border-indigo-300",
    iconText: "text-indigo-600",
    iconBg: "bg-indigo-100",
    bar: "bg-indigo-500",
    banner: "bg-indigo-50 border-indigo-200",
    bannerText: "text-indigo-800",
    dot: "bg-indigo-500",
  },
  submitted_complete: {
    label: "Submitted",
    icon: FaCheckCircle,
    cls: "text-blue-700 bg-blue-50 border-blue-300",
    iconText: "text-blue-600",
    iconBg: "bg-blue-100",
    bar: "bg-blue-500",
    banner: "bg-blue-50 border-blue-200",
    bannerText: "text-blue-800",
    dot: "bg-blue-500",
  },
};

const FILE_ICON_BY_EXT = {
  pdf: { icon: FaFilePdf, cls: "text-red-500 bg-red-50" },
  doc: { icon: FaFileWord, cls: "text-blue-500 bg-blue-50" },
  docx: { icon: FaFileWord, cls: "text-blue-500 bg-blue-50" },
  xls: { icon: FaFileExcel, cls: "text-emerald-600 bg-emerald-50" },
  xlsx: { icon: FaFileExcel, cls: "text-emerald-600 bg-emerald-50" },
  csv: { icon: FaFileExcel, cls: "text-emerald-600 bg-emerald-50" },
  zip: { icon: FaFileArchive, cls: "text-amber-600 bg-amber-50" },
  png: { icon: FaFileImage, cls: "text-purple-500 bg-purple-50" },
  jpg: { icon: FaFileImage, cls: "text-purple-500 bg-purple-50" },
};

const getFileMeta = (fileName = "") => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return FILE_ICON_BY_EXT[ext] || { icon: FaFile, cls: "text-slate-500 bg-slate-100" };
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })
    : "—";

const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-KE", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

const STATUS_MAP = {
  draft: "pending",
  awaiting_payment: "pending",
  submitted: "pending",
  approved: "approved",
  under_review: "pending",
  pending_committee_review: "committee_review",
  revision_requested: "rejected",
  rejected: "rejected",
  suspended: "suspended",
  expired: "rejected",
  closed: "approved",
};

const DECISION_TO_CONFIG = {
  approve: "approved",
  approved: "approved",
  reject: "rejected",
  rejected: "rejected",
  revise: "rejected",
  revision_requested: "rejected",
  pending: "pending",
  suspend: "suspended",
  suspended: "suspended",
};


const resolveStageStatus = (stage, stageData, projectUiStatus) => {
  const raw = stageData?.status || "locked";
  if (raw === "locked") return "locked";
  if (raw === "needs_revision") return "rejected";

  if (stage === "submission") {
    if (raw === "complete") return "submitted_complete";
    if (raw === "active") return "pending";
    return "submitted_complete";
  }

  if (stage === "outcome") {
    if (projectUiStatus && STATUS_CONFIG[projectUiStatus]) return projectUiStatus;
    return raw === "complete" ? "approved" : "pending";
  }

  const decision = stageData?.review?.decision;
  const mapped = decision ? DECISION_TO_CONFIG[String(decision).toLowerCase()] : null;
  if (mapped) return mapped;

  if (raw === "active") return "pending";
  if (raw === "complete") return "approved";
  return "pending";
};

const PROGRESS_FILE_LABELS = {
  draftManuscript: "Draft Manuscript",
  datasets: "Dataset",
  statisticalOutputs: "Statistical Output Summary",
};

const buildFileUrl = (path) => {
  if (!path) return null;
  return `${ASSET_BASE_URL}${path}`;
};

const fileEntry = (path, fallbackName) => {
  if (!path) return null;
  const name = path.split("/").pop() || fallbackName;
  return { name, size: null, url: buildFileUrl(path) };
};

const safeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  return [];
};


const ContinuingReviewPanel = ({ paper }) => {
  const cr = paper?.continuingReviewData || {};
  const files = safeArray(paper?.progressFiles);

  const rows = [
    ["Progress Summary", cr.progressSummary],
    ["Participants Enrolled", cr.participantsEnrolled],
    ["Participants Continuing", cr.participantsContinuing],
    ["Adverse Events", cr.adverseEvents],
    ["Amendments During Period", cr.amendments],
    ["Constraints", cr.constraints],
    ["Plans for Next Year", cr.plansForNextYear],
    ["Final Project Year", cr.isLastYear ? "Yes" : "No"],
  ].filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wide">
          Continuing Review
          {paper.continuingReviewNumber ? ` #${paper.continuingReviewNumber}` : ""}
          {" "}— Progress Report
        </p>
        {cr.submittedAt && (
          <span className="text-[11px] text-slate-400">
            Submitted {new Date(cr.submittedAt).toLocaleDateString("en-KE")}
          </span>
        )}
      </div>

      {rows.length > 0 ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                {label}
              </dt>
              <dd className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                {String(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-slate-400">No progress details recorded.</p>
      )}

      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Supporting Documents
        </p>
        {files.length > 0 ? (
          <ul className="space-y-1.5">
            {files.map((f, i) => (
              <li key={f.key || f.url || i}>
                <a
                  href={buildFileUrl(f.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <span aria-hidden>📎</span>
                  {PROGRESS_FILE_LABELS[f.label] || f.label || `Document ${i + 1}`}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-amber-600">
            No supporting documents were attached to this continuing review.
          </p>
        )}
      </div>
    </div>
  );
};

const mapResearchToProject = (paper, reviews = []) => {
  if (!paper) return null;

  const parent = paper.parentSummary || {};

  const reviewerReviews = reviews
    .filter((r) => r.reviewerRole === "reviewer" || !r.reviewerRole)
    .sort((a, b) => (a.round || 1) - (b.round || 1) || new Date(a.submittedAt) - new Date(b.submittedAt));
  const committeeReviews = reviews.filter((r) => r.reviewerRole === "committee");

  const maxRound = reviewerReviews.reduce((m, r) => Math.max(m, r.round || 1), 0);
  const hasResubmitted = (paper.resubmissionCount || 0) > 0;

  const currentStageIndex = (() => {
    const s = paper.status;
    if (["approved", "rejected", "expired", "closed"].includes(s)) return 3;
    if (s === "pending_committee_review") return 2;


    if (hasResubmitted || maxRound > 1) return 1;
    return 0;
  })();


  const safeCriteria = (val) => {
    if (!val) return {};
    if (typeof val === "object" && !Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return {}; }
  };

  const mapReview = (r) => ({
    decision: r.decision,
    comment: r.comment,
    criteria: safeCriteria(r.criteria),
    reviewer: r.reviewer?.name || r.reviewer?.firstName || "Reviewer",
    reviewerEmail: r.reviewer?.email || null,
    reviewerInstitution: r.reviewer?.institution || null,
    reviewedAt: r.submittedAt,
    round: r.round,
  });


  const isRevisionStatus = ["revision_requested", "suspended"].includes(paper.status);
  const isUnderReview = ["under_review", "submitted"].includes(paper.status);


  const round1Reviews = reviewerReviews.filter((r) => (r.round || 1) === 1);
  const submissionStageStatus = (() => {
    if (currentStageIndex > 0) return "complete";      
    if (isRevisionStatus && round1Reviews.length > 0) return "needs_revision";
    if (isUnderReview) return round1Reviews.length > 0 ? "complete" : "active";
    return "active";
  })();

  const stages = {};
  stages.submission = {
    status: submissionStageStatus,
    submittedAt: paper.createdAt,
    fields: {
      "Title": paper.title || parent.title,
      "Type": TYPE_LABELS[paper.submissionType] || paper.submissionType,
      "Discipline": paper.discipline || parent.discipline,
      "Abstract": paper.abstract ?? parent.abstract,
      "Background": paper.background ?? parent.background,
      "Objectives": paper.objectives ?? parent.objectives,
      "Methodology": paper.methodology ?? parent.methodology,
      "Expected Outcome": paper.expectedOutcome ?? parent.expectedOutcome,
      "Justification": paper.justification ?? parent.justification,
      "Research Programme": paper.researchProgramme ?? parent.researchProgramme,
      "SDG": paper.sdg ?? parent.sdg,
      "Protocol Version": paper.protocolVersionNumber ?? parent.protocolVersionNumber,
      "Counties": safeArray(
        paper.studyImplementationCounties?.length
          ? paper.studyImplementationCounties
          : parent.studyImplementationCounties,
      ).join(", "),
      "Funding": paper.fundingSource ?? parent.fundingSource,
      "Ethics (Human)": paper.ethicsHumanSubjects ?? parent.ethicsHumanSubjects,
      "Inclusion Criteria": paper.inclusionCriteria ?? parent.inclusionCriteria,
      "Exclusion Criteria": paper.exclusionCriteria ?? parent.exclusionCriteria,
    },
    files: [
      fileEntry(paper.proposalFile || parent.proposalFile, "Proposal Document"),
    ].filter(Boolean),
    review: round1Reviews.length > 0 ? mapReview(round1Reviews[round1Reviews.length - 1]) : null,
    allReviews: round1Reviews.map(mapReview),
  };


  const laterRoundReviews = reviewerReviews.filter((r) => (r.round || 1) > 1);
  const evalStageStatus = (() => {
    if (currentStageIndex > 1) return "complete";
    if (currentStageIndex < 1) return "locked";
    if (isRevisionStatus) return "needs_revision";
    if (isUnderReview) return "active";
    return "active";
  })();


  const isContinuingReview = paper.submissionType === "continuing_review";
  const crData = paper.continuingReviewData || {};
  const revisedFields = !hasResubmitted
    ? {}
    : isContinuingReview
      ? {
          "Progress Summary": crData.progressSummary,
          "Participants Enrolled": crData.participantsEnrolled,
          "Participants Continuing": crData.participantsContinuing,
          "Adverse Events": crData.adverseEvents,
          "Amendments": crData.amendments,
          "Constraints": crData.constraints,
          "Plans for Next Year": crData.plansForNextYear,
        }
      : {
          "Title": paper.title,
          "Abstract": paper.abstract,
          "Background": paper.background,
          "Objectives": paper.objectives,
          "Methodology": paper.methodology,
          "Expected Outcome": paper.expectedOutcome,
          "Justification": paper.justification,
          "Inclusion Criteria": paper.inclusionCriteria,
          "Exclusion Criteria": paper.exclusionCriteria,
          "Funding": paper.fundingSource,
        };

  const revisionChangelog = paper.amendmentDetails || null;

  const allReviewsByRound = {};
  reviewerReviews.forEach((r) => {
    const round = r.round || 1;
    if (!allReviewsByRound[round]) allReviewsByRound[round] = [];
    allReviewsByRound[round].push(mapReview(r));
  });

  const currentRound = Math.max(1, maxRound, (paper.resubmissionCount || 0) + 1);

  stages.review = {
    status: evalStageStatus,
    submittedAt: laterRoundReviews.length > 0
      ? laterRoundReviews[laterRoundReviews.length - 1].submittedAt
      : (hasResubmitted ? paper.updatedAt : null),
    fields: revisedFields,
    files: (isContinuingReview
      ? (paper.progressFiles || []).map((d, i) =>
          fileEntry(d.url, d.label || `Document ${i + 1}`))
      : [fileEntry(paper.proposalFile, "Revised Document")]
    ).filter(Boolean),
    review: laterRoundReviews.length > 0
      ? mapReview(laterRoundReviews[laterRoundReviews.length - 1])
      : null,
    allReviews: reviewerReviews.map(mapReview),
    allReviewsByRound,
    revisionChangelog,
    currentRound,
  };

  const latestCommitteeReview = committeeReviews[0] || null;
  stages.committee = {
    status: currentStageIndex >= 2 ? (currentStageIndex > 2 ? "complete" : "active") : "locked",
    submittedAt: latestCommitteeReview?.submittedAt || paper.committeeReviewedAt,
    fields: {},
    files: [],
    review: latestCommitteeReview ? mapReview(latestCommitteeReview) : null,
    allReviews: committeeReviews.map(mapReview),
  };

  stages.outcome = {
    status: currentStageIndex >= 3 ? "complete" : "locked",
    submittedAt: paper.approvedAt || paper.committeeReviewedAt,
    fields: {
      "SERU Number": paper.seruNumber,
      "Approval Valid Until": paper.approvalValidUntil ? fmt(paper.approvalValidUntil) : null,
      "Decision": paper.reviewDecision,
    },
    files: [],
    review: null,
    allReviews: [],
  };


  const resubmissionEvents = [];
  if (hasResubmitted) {
    const resubCount = paper.resubmissionCount || 0;
    for (let i = 0; i < resubCount; i++) {
      const roundNum = i + 1;
  
      const prevRoundReviews = reviewerReviews.filter((r) => (r.round || 1) === roundNum);
      const nextRoundReviews = reviewerReviews.filter((r) => (r.round || 1) === roundNum + 1);

      let resubDate;
      if (prevRoundReviews.length > 0) {
        const lastPrevReview = prevRoundReviews[prevRoundReviews.length - 1];
        resubDate = new Date(new Date(lastPrevReview.submittedAt).getTime() + 1000); 
      } else {
        resubDate = paper.updatedAt;
      }
      
      resubmissionEvents.push({
        date: resubDate,
        label: `Revision #${i + 1} submitted by researcher`,
        type: "resubmission",
      });
    }
  }

  const fullTimeline = [
    { date: paper.createdAt, label: "Research submitted", type: "submission" },
    ...resubmissionEvents,
    ...reviewerReviews.map((r) => ({
      date: r.submittedAt,
      label: `Round ${r.round || 1} review by ${r.reviewer?.name || "Reviewer"} — ${r.decision}`,
      type: "review",
      decision: r.decision,
    })),
    ...committeeReviews.map((r) => ({
      date: r.submittedAt,
      label: `Committee review by ${r.reviewer?.name || "Committee"} — ${r.decision}`,
      type: "committee",
      decision: r.decision,
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));


  Object.values(stages).forEach((s) => { s.fullTimeline = fullTimeline; });

  const activeStage = STAGE_ORDER[currentStageIndex] || "submission";
  const rawStatus = paper.status || "submitted";
  const uiStatus = STATUS_MAP[rawStatus] || "pending";
  const sc = STATUS_CONFIG[uiStatus] || STATUS_CONFIG.pending;

  return {
    id: paper.researchId || paper.id,
    title: paper.title,
    author: paper.researcher?.name,
    institution: paper.researcher?.institution,
    discipline: paper.discipline,
    paper,
    stages,
    activeStage,
    uiStatus,
    sc,
    reviews,
    seruNumber: paper.seruNumber,
    approvalValidUntil: paper.approvalValidUntil,
    submissionType: paper.submissionType,
    certificate: paper.seruNumber ? {
      number: paper.seruNumber,
      validUntil: paper.approvalValidUntil,
    } : null,
  };
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
    {Icon && (
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="text-blue-500 text-xs" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 font-medium leading-snug">{value || "—"}</p>
    </div>
  </div>
);

const RatingStars = ({ rating }) => (
  <div className="flex items-center gap-1.5">
    <p className="text-xs text-slate-400 font-medium">Rating:</p>
    {[1, 2, 3, 4, 5].map((s) => (
      <FaStar key={s} className={`text-xs ${s <= rating ? "text-amber-400" : "text-slate-200"}`} />
    ))}
    <span className="text-xs text-slate-400 ml-1">{rating}/5</span>
  </div>
);

const FileRow = ({ file }) => {
  const { icon: Icon, cls } = getFileMeta(file.name);
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
          <Icon className="text-sm" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
          {file.size && <p className="text-xs text-slate-400">{file.size}</p>}
        </div>
      </div>
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-bold flex-shrink-0"
      >
        <FaExternalLinkAlt className="text-[10px]" /> Open
      </a>
    </div>
  );
};

const EmptyFiles = () => (
  <div className="flex flex-col items-center py-10 gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
      <FaInbox className="text-lg text-slate-400" />
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-700">No files submitted yet</p>
      <p className="text-xs text-slate-400 mt-0.5">Files will appear here once this stage is submitted.</p>
    </div>
  </div>
);

const StageProgressStrip = ({ stages, activeStage, onSelectStage, project }) => {
  return (
    <div className="flex items-center gap-0">
      {STAGE_ORDER.map((stage, i) => {
        const data = stages[stage];
        const rawStatus = data?.status || "locked";
        const status = resolveStageStatus(stage, data, project?.uiStatus);
        const isPastApproved = STAGE_ORDER.slice(0, i).every(
          (s) => {
            const st = resolveStageStatus(s, stages[s], project?.uiStatus);
            return st === "approved" || st === "submitted_complete";
          }
        );
        const isLocked = rawStatus === "locked";
        const isActive = stage === activeStage;

        const nodeCls = isLocked
          ? "bg-slate-100 border-slate-200 text-slate-400"
          : status === "approved" || status === "submitted_complete"
          ? "bg-emerald-500 border-emerald-500 text-white"
          : status === "pending"
          ? "bg-amber-400 border-amber-400 text-white"
          : status === "rejected"
          ? "bg-red-500 border-red-500 text-white"
          : status === "suspended"
          ? "bg-slate-500 border-slate-500 text-white"
          : "bg-slate-100 border-slate-200 text-slate-400";

        return (
          <React.Fragment key={stage}>
            <button
              type="button"
              onClick={() => !isLocked && onSelectStage(stage)}
              disabled={isLocked}
              className={`flex flex-col items-center gap-1.5 px-1 group ${
                isLocked ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs 
                  font-bold border-2 transition-colors
                  ${nodeCls} ${isActive ? "ring-4 ring-blue-100" : ""}`}
              >
                {isLocked ? (
                  <FaLock className="text-[11px]" />
                ) : status === "approved" || status === "submitted_complete" ? (
                  <FaCheckCircle className="text-[11px]" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[11px] font-semibold whitespace-nowrap transition-colors
                  ${isActive ? "text-blue-600" : isLocked ? "text-slate-400" : "text-slate-700"}
                  group-hover:text-blue-600`}
              >
                {STAGE_SHORT_LABELS[stage]}
              </span>
            </button>
            {i < STAGE_ORDER.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-5 rounded-full min-w-8
                  ${isPastApproved ? "bg-green-400" : "bg-slate-200"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const ReviewerFeedback = ({ status, stageData, researchId }) => {
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!researchId || status === "locked") return;
    setReportLoading(true);
    research.getDecisionReport(researchId)
      .then((data) => setReport(data))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [researchId, status]);

  if (status === "locked") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <FaLock className="text-slate-400 text-xs" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-600">Stage locked</p>
            <p className="text-xs text-slate-400">This stage unlocks once the previous stage is approved.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "pending" && !report) {
    const currentRound = stageData?.currentRound || 1;
    const revisionChangelog = stageData?.revisionChangelog;
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <FaClock className="text-amber-500 text-xs" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">
                Awaiting Review {currentRound > 1 ? `(Round ${currentRound})` : ""}
              </p>
              <p className="text-xs text-amber-600">Your submission is in the review queue</p>
            </div>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed mt-3 pl-11">
            Our panel typically reviews submissions within 3–5 business days.
          </p>
        </div>
        {revisionChangelog && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-1.5">
              <FaFileAlt className="text-[10px]" /> Changes Made in This Revision
            </p>
            <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{revisionChangelog}</p>
          </div>
        )}
      </div>
    );
  }

  if (reportLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-7 h-7 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (report && report.releasedAt) {
    const decisionKey = DECISION_TO_CONFIG[String(report.finalDecision || "").toLowerCase()] || "pending";
    const sc = STATUS_CONFIG[decisionKey] || STATUS_CONFIG.pending;
    const StatusIcon = sc.icon;
    return (
      <div className="space-y-4">
        <div className={`rounded-xl border p-5 ${sc.banner}`}>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${sc.iconBg}`}>
              <StatusIcon className={`text-sm ${sc.iconText}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <p className={`text-sm font-bold ${sc.bannerText}`}>
                  Committee Decision: {sc.label}
                </p>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <FaCalendarAlt className="text-[9px]" /> {fmtTime(report.releasedAt)}
                </span>
              </div>
              {report.committeeComment && (
                <div className="bg-white/70 rounded-lg px-4 py-3 border border-white/60">
                  <p className="text-[11px] text-slate-500 font-semibold mb-1.5 flex items-center gap-1">
                    <FaCommentAlt className="text-[8px]" /> Committee Feedback
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {report.committeeComment}
                  </p>
                </div>
              )}
              {report.officerAttachment && (
                <div className="bg-white/70 rounded-lg px-4 py-3 border border-white/60 mt-2">
                  <p className="text-[11px] text-slate-500 font-semibold mb-1.5 flex items-center gap-1">
                    <FaFileAlt className="text-[8px]" /> Attached Document
                  </p>
                  <a
                    href={buildFileUrl(report.officerAttachment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <FaDownload className="text-[10px]" />
                    {report.officerAttachment.split("/").pop() || "Download Document"}
                  </a>
                </div>
              )}
              {report.reviewerComments && report.reviewerComments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest flex items-center gap-1.5">
                    <FaShieldAlt className="text-[9px]" /> Peer Review Summary
                  </p>
                  {report.reviewerComments.map((rc, i) => {
                    const rcKey = DECISION_TO_CONFIG[String(rc.decision || "").toLowerCase()] || "pending";
                    const rcSc = STATUS_CONFIG[rcKey] || STATUS_CONFIG.pending;
                    return (
                      <div key={i} className="bg-white/50 rounded-lg px-4 py-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-slate-500 font-semibold">Reviewer {i + 1}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rcSc.cls}`}>
                            {rcSc.label}
                          </span>
                        </div>
                        {rc.comment && (
                          <p className="text-xs text-slate-600 leading-relaxed">{rc.comment}</p>
                        )}
                        {rc.criteria && Object.keys(rc.criteria).length > 0 && (
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            {Object.entries(rc.criteria).map(([key, val]) => (
                              <div key={key} className="flex items-center justify-between bg-slate-50 rounded px-2 py-1">
                                <span className="text-[10px] text-slate-500 capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                                <span className="text-[10px] font-bold text-slate-700">{val}/10</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allReviews = stageData?.allReviews || [];
  if (allReviews.length === 0) {
    const pendingSc = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const PendingIcon = pendingSc.icon;
    return (
      <div className={`rounded-xl border p-5 ${pendingSc.banner}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${pendingSc.iconBg}`}>
            <PendingIcon className={`text-xs ${pendingSc.iconText}`} />
          </div>
          <p className={`text-sm font-bold ${pendingSc.bannerText}`}>{pendingSc.label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <FaClock className="text-blue-500 text-xs" />
        </div>
        <div>
          <p className="text-sm font-bold text-blue-800">Review in Progress</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Your submission has been reviewed. The compiled feedback will be released by the Research Officer.
          </p>
        </div>
      </div>
    </div>
  );
};
const StageTimeline = ({ stage, status, stageData }) => {
  const timeline = stageData?.fullTimeline || [];

  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
          <FaHistory className="text-lg text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">No activity yet</p>
          <p className="text-xs text-slate-400 mt-0.5">
            History will appear here once this stage is submitted.
          </p>
        </div>
      </div>
    );
  }

  const decisionColor = (decision) => {
    const d = String(decision || "").toLowerCase();
    if (["approved", "approve"].includes(d)) return "bg-emerald-500";
    if (["revision", "revision_needed", "revision_requested", "rejected", "reject"].includes(d)) return "bg-red-500";
    if (["suspended", "suspend"].includes(d)) return "bg-slate-500";
    return "bg-blue-500";
  };

  const decisionIcon = (type, decision) => {
    if (type === "submission") return FaFileAlt;
    if (type === "resubmission") return FaArrowRight;
    const d = String(decision || "").toLowerCase();
    if (["approved", "approve"].includes(d)) return FaCheckCircle;
    if (["revision", "revision_needed", "revision_requested", "rejected", "reject"].includes(d)) return FaTimesCircle;
    return FaShieldAlt;
  };

  return (
    <div className="space-y-0">
      {timeline.map((ev, i) => {
        const EvIcon = decisionIcon(ev.type, ev.decision);
        const color = ev.type === "submission" ? "bg-blue-500"
          : ev.type === "resubmission" ? "bg-orange-500"
          : decisionColor(ev.decision);
        return (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                <EvIcon className="text-white text-[10px]" />
              </div>
              {i < timeline.length - 1 && <div className="w-px h-6 bg-slate-200" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-slate-800">{ev.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fmtTime(ev.date)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StagePanel = ({ stage, stageData, project, onResubmit }) => {
  const [subTab, setSubTab] = useState("details");
  const status = resolveStageStatus(stage, stageData, project?.uiStatus);
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = sc.icon;

  const subTabs = [
    { id: "details", label: "Details", icon: FaBookOpen },
    { id: "review", label: "Review Feedback", icon: FaCommentAlt },
    { id: "timeline", label: "Timeline", icon: FaHistory },
  ];

  if (status === "locked") {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="h-1.5 w-full bg-slate-200" />
        <div className="p-10 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
            <FaLock className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">{STAGE_LABELS[stage]} is locked</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              This stage unlocks once the previous stage has been approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fieldEntries = Object.entries(stageData?.fields || {}).filter(([, v]) => v && v !== "—");
  const canResubmit = status === "rejected" && (stage === "review" || stage === "committee");

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className={`h-1.5 w-full ${sc.bar}`} />
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${STAGE_COLORS[stage]}`}>
              {STAGE_LABELS[stage]}
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${sc.cls}`}>
              <StatusIcon className="text-[11px]" /> {sc.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <FaCalendarAlt /> Submitted {fmt(stageData?.submittedAt)}
            </span>
            <span className="flex items-center gap-1">
              <FaFileAlt /> {stageData?.files?.length || 0} file{stageData?.files?.length === 1 ? "" : "s"}
            </span>
          </div>

          {canResubmit && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onResubmit?.(stage)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <FaFileAlt /> Resubmit (Free)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer border-b-2 -mb-px
                ${subTab === tab.id
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-slate-500 border-transparent hover:text-blue-600 hover:bg-slate-50"}`}
            >
              <tab.icon className="text-xs" />
              {tab.label}
              {tab.id === "review" && (stageData?.allReviews?.length || 0) > 0 && (
                <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {stageData.allReviews.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {subTab === "details" && (
            <div className="space-y-6">
              {fieldEntries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  {fieldEntries.map(([label, value]) => (
                    <InfoRow key={label} label={label} value={value} icon={FaTag} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No details submitted for this stage yet.</p>
              )}

              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-3">
                  Submitted Files
                </p>
                {stageData?.files?.length > 0 ? (
                  <div className="space-y-3">
                    {stageData.files.map((file) => (
                      <FileRow key={file.name} file={file} />
                    ))}
                  </div>
                ) : (
                  <EmptyFiles />
                )}
              </div>
            </div>
          )}

          {subTab === "review" && (
            <div className="space-y-5">
              <ReviewerFeedback status={status} stageData={stageData} researchId={project?.paper?.id} />

              {stageData?.reviewHistory?.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-3">
                    Previous Reviews
                  </p>
                  <div className="space-y-3">
                    {stageData.reviewHistory.map((rev, i) => {
                      const rsc = STATUS_CONFIG[DECISION_TO_CONFIG[rev.status] || rev.status] || STATUS_CONFIG.pending;
                      const RIcon = rsc.icon;
                      return (
                        <div key={i} className={`rounded-xl border p-4 ${rsc.banner}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`flex items-center gap-1.5 text-xs font-semibold ${rsc.bannerText}`}>
                              <RIcon className="text-[10px]" /> {rsc.label}
                            </span>
                            <span className="text-[11px] text-slate-400">{fmtTime(rev.reviewedAt)}</span>
                          </div>
                          {rev.comment && (
                            <p className={`text-xs leading-relaxed ${rsc.bannerText}`}>{rev.comment}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {subTab === "timeline" && (
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-4">
                Stage History
              </p>
              <StageTimeline stage={stage} status={status} stageData={stageData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DecisionLetterButton = ({ researchId }) => {
  const [letters, setLetters] = useState([]);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!researchId) return;
    research.getDecisionLetterHistory(researchId)
      .then((data) => { if (!cancelled) setLetters(data || []); })
      .catch(() => { /* none issued yet, or not permitted — stay hidden */ })
      .finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [researchId]);

  if (!checked || letters.length === 0) return null;

  const latest = letters[0];

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3
          hover:bg-blue-100/70 transition-colors cursor-pointer"
      >
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
          <FaDownload className="text-blue-600" />
        </div>
        <div className="text-left">
          <p className="text-[11px] text-blue-600 font-semibold uppercase tracking-wide">
            Decision Letter{letters.length > 1 ? "s" : ""}
          </p>
          <p className="text-sm font-bold text-blue-800">{latest.letterNumber}</p>
          <p className="text-[11px] text-blue-600">
            {letters.length > 1 ? `${letters.length} issued — click to view all` : "Click to download PDF"}
          </p>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-4 pt-3 pb-2">
            Decision Letter History
          </p>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {letters.map((l) => (
              <a
                key={l.id}
                href={buildFileUrl(l.file)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{l.letterNumber}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    {l.decision?.replace(/_/g, " ")} · {new Date(l.issuedAt).toLocaleDateString()}
                  </p>
                </div>
                <FaDownload className="text-slate-400 text-xs shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


const getCurrentResearcherId = () => {
  try {
    const cached = localStorage.getItem("researcher");
    if (!cached) return null;
    const profile = JSON.parse(cached);
    return profile?.id || null;
  } catch {
    return null;
  }
};

const CoInvestigatorsPanel = ({ researchId, isOwner }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    if (!researchId) return;
    research.getResearchCoInvestigators(researchId)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [researchId]);

  useEffect(() => { load(); }, [load]);

  const toggleEdit = async (coInv) => {
    setSavingId(coInv.researcherId);
    try {
      await research.setCoInvestigatorEditAccess(researchId, coInv.researcherId, !coInv.canEdit);
      notify.success(!coInv.canEdit ? "Edit access granted." : "Edit access revoked.");
      load();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to update edit access");
    } finally {
      setSavingId(null);
    }
  };

  if (loading || list.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-4">
        Co-Investigators
      </p>
      <div className="space-y-3">
        {list.map((coInv) => (
          <div key={coInv.researcherId || coInv.id}
            className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {coInv.researcher?.name || coInv.name || "Co-Investigator"}
              </p>
              <p className="text-xs text-slate-400">
                {coInv.roleOnStudy || "Co-Investigator"}
                {coInv.acceptedAt ? " · Accepted" : " · Invitation pending"}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => toggleEdit(coInv)}
                disabled={savingId === coInv.researcherId}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50 ${
                  coInv.canEdit
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
                title="PI-delegated: lets this co-investigator edit specific proposal sections"
              >
                {coInv.canEdit ? "Edit access: On" : "Edit access: Off"}
              </button>
            )}
            {!isOwner && (
              <span className="text-xs font-semibold text-slate-400">
                {coInv.canEdit ? "Can edit delegated sections" : "Read-only"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SEVERITY_STYLES = {
  minor: "bg-slate-100 text-slate-600",
  major: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

const ProtocolDeviationsPanel = ({ researchId }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    deviationType: "protocol_deviation",
    severity: "minor",
    description: "",
    dateOfDeviation: "",
    correctiveAction: "",
    participantsAffected: "",
    atRiskParticipantList: "",
    isUrgentSafety: false,
  });

  const load = useCallback(() => {
    if (!researchId) return;
    research.getProtocolDeviations(researchId)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [researchId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.description.trim() || !form.dateOfDeviation) {
      return notify.error("Description and date of deviation are required.");
    }
    setSaving(true);
    try {
      await research.submitProtocolDeviation(
        { ...form, parentResearchId: researchId },
        files,
      );
      notify.success("Protocol deviation reported.");
      setFormOpen(false);
      setForm({
        deviationType: "protocol_deviation", severity: "minor", description: "",
        dateOfDeviation: "", correctiveAction: "", participantsAffected: "",
        atRiskParticipantList: "", isUrgentSafety: false,
      });
      setFiles([]);
      load();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to submit deviation report");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
          Protocol Deviations
        </p>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          {formOpen ? "Cancel" : "+ Report a Deviation"}
        </button>
      </div>

      {formOpen && (
        <div className="border border-slate-100 rounded-xl p-4 mb-4 space-y-3 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Type</label>
              <select value={form.deviationType}
                onChange={(e) => setForm((f) => ({ ...f, deviationType: e.target.value }))}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {research.DEVIATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Severity</label>
              <select value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {research.DEVIATION_SEVERITIES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Date of Deviation *</label>
            <input type="date" value={form.dateOfDeviation}
              onChange={(e) => setForm((f) => ({ ...f, dateOfDeviation: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Description *</label>
            <textarea rows={3} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Corrective Action</label>
            <textarea rows={2} value={form.correctiveAction}
              onChange={(e) => setForm((f) => ({ ...f, correctiveAction: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Participants Affected</label>
              <input type="number" min="0" value={form.participantsAffected}
                onChange={(e) => setForm((f) => ({ ...f, participantsAffected: e.target.value }))}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isUrgentSafety}
                  onChange={(e) => setForm((f) => ({ ...f, isUrgentSafety: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300" />
                Urgent safety concern
              </label>
            </div>
          </div>

          {form.isUrgentSafety && (
            <div>
              <label className="text-xs font-semibold text-slate-600">At-Risk Participant Details</label>
              <textarea rows={2} value={form.atRiskParticipantList}
                onChange={(e) => setForm((f) => ({ ...f, atRiskParticipantList: e.target.value }))}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none" />
              <p className="text-[11px] text-slate-400 mt-1">
                Visible only to the study's owner, its reviewers/committee, and research staff.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-600">Supporting Documents</label>
            <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full mt-1 text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg
                file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs file:font-semibold" />
          </div>

          <button onClick={submit} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg cursor-pointer disabled:opacity-50">
            {saving ? "Submitting…" : "Submit Deviation Report"}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-slate-400">No protocol deviations reported.</p>
      ) : (
        <div className="space-y-3">
          {list.map((d) => (
            <div key={d.id} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SEVERITY_STYLES[d.severity] || SEVERITY_STYLES.minor}`}>
                  {d.severity?.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400">
                  {d.dateOfDeviation ? new Date(d.dateOfDeviation).toLocaleDateString() : ""}
                </span>
              </div>
              <p className="text-sm text-slate-700">{d.description}</p>
              {d.correctiveAction && (
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold">Corrective action:</span> {d.correctiveAction}
                </p>
              )}
              {d.deviationDeadline && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Response due: {new Date(d.deviationDeadline).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CO_EDIT_FIELDS = [
  { key: "abstract", label: "Abstract", rows: 4 },
  { key: "background", label: "Background", rows: 4 },
  { key: "objectives", label: "Objectives", rows: 3 },
  { key: "methodology", label: "Methodology", rows: 4 },
  { key: "expectedOutcome", label: "Expected Outcome", rows: 3 },
  { key: "timeline", label: "Timeline", rows: 2 },
  { key: "inclusionCriteria", label: "Inclusion Criteria", rows: 3 },
  { key: "exclusionCriteria", label: "Exclusion Criteria", rows: 3 },
  { key: "literatureReviewSummary", label: "Literature Review Summary", rows: 4 },
];


const CoInvestigatorEditPanel = ({ researchId, isOwner, paper }) => {
  const [myAccess, setMyAccess] = useState(null); 
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!researchId || isOwner) { setMyAccess(false); return; }
    const myId = getCurrentResearcherId();
    research.getResearchCoInvestigators(researchId)
      .then((list) => {
        const mine = list.find((c) => c.researcherId === myId);
        setMyAccess(!!mine?.canEdit);
      })
      .catch(() => setMyAccess(false));
  }, [researchId, isOwner]);

  useEffect(() => {
    if (myAccess && paper) {
      const initial = {};
      CO_EDIT_FIELDS.forEach(({ key }) => { initial[key] = paper[key] || ""; });
      setForm(initial);
    }
  }, [myAccess, paper]);

  const save = async () => {
    setSaving(true);
    try {
      await research.coInvestigatorEditResearch(researchId, form);
      notify.success("Changes saved.");
      setOpen(false);
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (!myAccess) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
            Your Delegated Access
          </p>
          <p className="text-sm text-slate-600 mt-1">
            The Principal Investigator has given you edit access to the sections below.
            Submission decisions still require the PI.
          </p>
        </div>
        <button onClick={() => setOpen((v) => !v)}
          className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0">
          {open ? "Close" : "Edit Sections"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          {CO_EDIT_FIELDS.map(({ key, label, rows }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-600">{label}</label>
              <textarea rows={rows} value={form[key] || ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
          ))}
          <button onClick={save} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg cursor-pointer disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
};

const ProjectHeader = ({ project, onBack }) => {
  const isApproved = project.stages.outcome?.status === "complete" && project.certificate;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors cursor-pointer group"
      >
        <FaArrowLeft className="group-hover:-translate-x-0.5 transition-transform text-xs" />
        Back to My Research
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-2">
              {project.id}
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 leading-snug mb-3">{project.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <FaUserCircle /> {project.author}
              </span>
              <span className="flex items-center gap-1.5">
                <FaUniversity /> {project.institution}
              </span>
              {project.discipline && (
                <span className="flex items-center gap-1.5">
                  <FaFlask /> {project.discipline}
                </span>
              )}
            </div>
          </div>

          {isApproved && project.certificate && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FaCertificate className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wide">
                  Clearance Certificate
                </p>
                <p className="text-sm font-bold text-emerald-800">{project.certificate.number}</p>
                <p className="text-[11px] text-emerald-600">
                  Valid until {fmt(project.certificate.validUntil)}
                </p>
              </div>
            </div>
          )}

          <DecisionLetterButton researchId={project.paper?.id} />
        </div>
      </div>
    </div>
  );
};

const ResearchDetails = ({ onBack }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStage, setActiveStage] = useState(null);
  const [resubmitTarget, setResubmitTarget] = useState(null);

  const load = useCallback(async () => {
    if (!id || id === "undefined") {
      setError("No research submission was specified.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { paper, reviews } = await research.getResearchDetails(id);
      const mapped = mapResearchToProject(paper, reviews);
      setProject(mapped);
      setActiveStage((prev) => {
        if (prev && mapped.stages[prev]?.status !== "locked") return prev;
        const firstOpen = Object.keys(mapped.stages).find(
          (s) => mapped.stages[s].status !== "complete" && mapped.stages[s].status !== "locked",
        );
        return firstOpen || Object.keys(mapped.stages).find((s) => mapped.stages[s].status !== "locked") || "submission";
      });
    } catch (err) {
      setError(err.message || "Failed to load this research submission");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);



  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading research details…</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-slate-700 font-semibold">{error || "Research not found"}</p>
          <button
            type="button"
            onClick={() => navigate("/research/dashboard")}
            className="text-blue-600 text-sm font-semibold hover:underline"
          >
            Back to My Research
          </button>
        </div>
      </div>
    );
  }

  const stages = project.stages;

  const overallTabs = STAGE_ORDER.map((stage) => ({
    id: stage,
    label: STAGE_SHORT_LABELS[stage],
    status: resolveStageStatus(stage, stages[stage], project.uiStatus),
    locked: (stages[stage]?.status || "locked") === "locked",
  }));

  const handleSelectStage = (stage) => {
    if ((stages[stage]?.status || "locked") !== "locked") setActiveStage(stage);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className=" w-full px-4 py-4 space-y-4">
        <ProjectHeader project={project} onBack={() => navigate("/research/dashboard")} />

        {project.paper?.parentSummary && (
          <button
            type="button"
            onClick={() =>
              navigate(`/research/dashboard/view/${project.paper.parentSummary.id}`)
            }
            className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-left hover:bg-amber-100/70 transition-colors cursor-pointer"
          >
            <span className="text-amber-600 font-bold shrink-0">↳</span>
            <span className="text-sm text-amber-800">
              This is a{" "}
              <span className="font-semibold">
                {TYPE_LABELS[project.paper.submissionType] || "submission"}
              </span>{" "}
              for approved study{" "}
              <span className="font-semibold">
                {project.paper.parentSummary.researchId}
              </span>
              {project.paper.parentSummary.seruNumber
                ? ` (${project.paper.parentSummary.seruNumber})`
                : ""}{" "}
              — click to open the parent study.
            </span>
          </button>
        )}

        {project.paper?.submissionType === "continuing_review" && (
          <ContinuingReviewPanel paper={project.paper} />
        )}

        {Array.isArray(project.paper?.childSubmissions) &&
          project.paper.childSubmissions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-3">
                Study Lifecycle
              </p>
              <div className="space-y-1.5">
                {project.paper.childSubmissions.map((child) => {
                  const num =
                    child.continuingReviewNumber || child.amendmentNumber;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() =>
                        navigate(`/research/dashboard/view/${child.id}`)
                      }
                      className="w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-slate-700">
                        {TYPE_LABELS[child.submissionType] || "Submission"}
                        {num ? ` #${num}` : ""}
                        <span className="ml-2 text-[11px] text-slate-400">
                          {child.researchId}
                        </span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 capitalize">
                        {String(child.status || "").replace(/_/g, " ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        <CoInvestigatorsPanel
          researchId={project.paper?.id}
          isOwner={project.paper?.researcherId === getCurrentResearcherId()}
        />

        <CoInvestigatorEditPanel
          researchId={project.paper?.id}
          isOwner={project.paper?.researcherId === getCurrentResearcherId()}
          paper={project.paper}
        />

        <ProtocolDeviationsPanel researchId={project.paper?.id} />

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-5">
            Submission Progress
          </p>
          <StageProgressStrip
            stages={stages}
            activeStage={activeStage}
            onSelectStage={handleSelectStage}
            project={project}
          />
        </div>

        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          {overallTabs.map((tab) => {
            const isLocked = tab.locked;
            const isActive = tab.id === activeStage;
            const sc = STATUS_CONFIG[tab.status] || STATUS_CONFIG.pending;
            const TabIcon = isLocked ? FaLock : (sc.icon || FaClock);
            return (
              <button
                key={tab.id}
                type="button"
                disabled={isLocked}
                onClick={() => handleSelectStage(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold 
                  whitespace-nowrap border-b-2 -mb-px transition-colors
                  ${isActive ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent"}
                  ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:text-blue-600 cursor-pointer"}`}
              >
                <TabIcon className="text-[11px]" />
                {STAGE_LABELS[tab.id]}
              </button>
            );
          })}
        </div>

        <StagePanel
          stage={activeStage}
          stageData={stages[activeStage]}
          project={project}
          onResubmit={(stage) => setResubmitTarget(stage)}
        />
      </main>

    </div>
  );
};

export default ResearchDetails;
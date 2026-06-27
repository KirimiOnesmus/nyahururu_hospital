import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaArrowLeft, FaFlask, FaCalendarAlt, FaDownload, FaCheckCircle,
  FaTimesCircle, FaClock, FaCommentAlt, FaUserCircle, FaUniversity,
  FaBookOpen, FaChevronRight, FaShieldAlt, FaStar, FaFileAlt,
  FaTag, FaGlobe, FaHistory, FaExternalLinkAlt, FaLock,
  FaPauseCircle, FaFilePdf, FaFileExcel, FaFileWord, FaFileArchive,
  FaFileImage, FaFile, FaCertificate, FaInbox, FaArrowRight,
} from "react-icons/fa";

import * as research from "../../../api/research";

const STAGE_ORDER = ["proposal", "progress", "final_paper"];

const STAGE_LABELS = {
  proposal: "Proposal",
  progress: "Progress Report",
  final_paper: "Final Paper",
};

const STAGE_SHORT_LABELS = {
  proposal: "Proposal",
  progress: "Progress",
  final_paper: "Final Paper",
};

const STAGE_COLORS = {
  proposal: "bg-blue-100 text-blue-700 border border-blue-200",
  progress: "bg-purple-100 text-purple-700 border border-purple-200",
  final_paper: "bg-emerald-100 text-emerald-700 border border-emerald-200",
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

// ─── Map raw Research doc + reviews → UI project shape ─────────────────────
const STATUS_MAP = {
  approved: "approved",
  pending: "pending",
  under_review: "pending",
  pending_committee_review: "committee_review",
  revision_requested: "rejected",
  rejected: "rejected",
  suspended: "suspended",
};

const PROGRESS_FILE_LABELS = {
  draftManuscript: "Draft Manuscript",
  datasets: "Dataset",
  statisticalOutputs: "Statistical Output Summary",
};

const buildFileUrl = (path) => {
  if (!path) return null;
  const origin = (import.meta.env.VITE_API_URL || "").replace(/\/api\/v\d+\/?$/, "");
  return `${origin}${path}`;
};

const fileEntry = (path, fallbackName) => {
  if (!path) return null;
  const name = path.split("/").pop() || fallbackName;
  return { name, size: null, url: buildFileUrl(path) };
};

const mapResearchToProject = (paper, reviews = []) => {
  if (!paper) return null;

  const currentStageIndex = STAGE_ORDER.indexOf(paper.stage);
  const reviewsByStage = STAGE_ORDER.reduce((acc, s) => {
    acc[s] = reviews.filter((r) => r.stage === s).sort((a, b) => b.round - a.round);
    return acc;
  }, {});

  const stages = {};

  STAGE_ORDER.forEach((stage, i) => {
    const stageReviews = reviewsByStage[stage];
    const latestReview = stageReviews.find((r) => r.isLatest) || stageReviews[0];
    const history = stageReviews.filter((r) => r !== latestReview);

    let status;
    let submittedAt = null;
    let fields = {};
    let files = [];

    if (i < currentStageIndex) {
      status = "approved";
    } else if (i > currentStageIndex) {
      status = "locked";
    } else {
      status = STATUS_MAP[paper.status] || "pending";
    }

    if (stage === "proposal") {
      submittedAt = paper.createdAt;
      fields = {
        "Problem Statement": paper.background,
        "Background": paper.background,
        "Objectives": Array.isArray(paper.objectives)
          ? paper.objectives.join("; ")
          : paper.objectives,
        "Methodology": paper.methodology,
        "Expected Outcome": paper.expectedOutcome,
        "Timeline": paper.timeline,
        "Co-Investigators": Array.isArray(paper.teamMembers)
          ? paper.teamMembers.join(", ")
          : paper.teamMembers,
        "Abstract": paper.abstract,
      };
      files = [fileEntry(paper.proposalFile, "Proposal.pdf")].filter(Boolean);
    }

    if (stage === "progress") {
      const pd = paper.progressData || {};
      submittedAt = i <= currentStageIndex ? pd.submittedAt : null;
      fields = {
        "Methodology": pd.methodology,
        "Study Design": pd.studyDesign,
        "Sampling Method": pd.samplingMethod,
        "Sample Size Achieved": pd.sampleSizeAchieved,
        "Sample Size Target": pd.sampleSizeTarget,
        "Data Collection Progress": pd.dataCollectionProgress,
        "Statistical Methods": pd.statisticalMethods,
        "Analysis Tools": pd.analysisTools,
        "Preliminary Findings": pd.preliminaryFindings,
        "Deviations from Protocol": pd.deviationsFromProtocol,
        "Ethical Incidents": pd.ethicalIncidents,
        "Participant Withdrawals": pd.participantWithdrawals,
      };
      files = (paper.progressFiles || []).map((f) => ({
        name: PROGRESS_FILE_LABELS[f.label] || f.label,
        size: null,
        url: buildFileUrl(f.url),
      }));
    }

    if (stage === "final_paper") {
      submittedAt = i <= currentStageIndex ? paper.updatedAt : null;
      fields = {
        "Final Abstract": paper.finalAbstract,
        "Keywords": Array.isArray(paper.keywords)
          ? paper.keywords.join(", ")
          : paper.keywords,
      };
      files = [fileEntry(paper.finalPaperFile, "FinalPaper.pdf")].filter(Boolean);
    }

    const decisionToStatus = {
      approved: "approved",
      revision: "revision_requested",
      rejected: "rejected",
      suspended: "suspended",
    };

    stages[stage] = {
      status,
      submittedAt,
      reviewedAt: latestReview?.submittedAt || (i === currentStageIndex ? paper.reviewedAt : null),
      reviewedBy: latestReview?.reviewer?.name || (i === currentStageIndex ? paper.reviewedBy?.name : null),
      reviewComment: latestReview?.comment || (i === currentStageIndex ? paper.reviewComment : ""),
      rating: latestReview?.criteria
        ? Math.round(
            Object.values(latestReview.criteria).reduce((s, v) => s + v, 0) /
              Object.values(latestReview.criteria).length /
              2,
          ) || null
        : null,
      fields,
      files,
      reviewHistory: history.map((r) => ({
        status: STATUS_MAP[decisionToStatus[r.decision]] || "pending",
        reviewedAt: r.submittedAt,
        comment: r.comment,
      })),
    };
  });

  return {
    id: paper.researchId || paper._id,
    title: paper.title,
    author: paper.researcher?.name,
    institution: paper.researcher?.institution,
    discipline: paper.discipline,
    stages,
    certificate: null,
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



const StageProgressStrip = ({ stages, activeStage, onSelectStage }) => {
  return (
    <div className="flex items-center gap-0">
      {STAGE_ORDER.map((stage, i) => {
        const data = stages[stage];
        const status = data?.status || "locked";
        const isPastApproved = STAGE_ORDER.slice(0, i).every(
          (s) => stages[s]?.status === "approved"
        );
        const isLocked = status === "locked";
        const isActive = stage === activeStage;

        const nodeCls = isLocked
          ? "bg-slate-100 border-slate-200 text-slate-400"
          : status === "approved"
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
                ) : status === "approved" ? (
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



const ReviewerFeedback = ({ stageData }) => {
  const status = stageData?.status || "locked";

  if (status === "locked") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <FaLock className="text-slate-400 text-xs" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-600">Stage locked</p>
            <p className="text-xs text-slate-400">
              This stage unlocks once the previous stage is approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <FaClock className="text-amber-500 text-xs" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Awaiting Review</p>
            <p className="text-xs text-amber-600">Your submission is in the review queue</p>
          </div>
        </div>
        <p className="text-xs text-amber-700 leading-relaxed mt-3 pl-11">
          Our panel typically reviews submissions within 3–5 business days. You'll receive an email
          notification once a decision has been made.
        </p>
      </div>
    );
  }

  const sc = STATUS_CONFIG[status];
  const StatusIcon = sc.icon;

  return (
    <div className={`rounded-xl border p-5 ${sc.banner}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${sc.iconBg}`}>
          <StatusIcon className={`text-xs ${sc.iconText}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <p className={`text-sm font-bold ${sc.bannerText}`}>{sc.label}</p>
            {stageData.reviewedAt && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <FaCalendarAlt className="text-[9px]" /> {fmtTime(stageData.reviewedAt)}
              </span>
            )}
          </div>

          {stageData.reviewedBy && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaShieldAlt className="text-indigo-500 text-[9px]" />
              </div>
              <p className="text-xs text-slate-500">
                Reviewed by <span className="font-semibold text-slate-700">{stageData.reviewedBy}</span>
              </p>
            </div>
          )}

          {stageData.reviewComment && (
            <div className="bg-white/70 rounded-lg px-4 py-3 border border-white/60">
              <p className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1">
                <FaCommentAlt className="text-[9px]" /> Reviewer Comment
              </p>
              <p className={`text-sm leading-relaxed ${sc.bannerText}`}>{stageData.reviewComment}</p>
            </div>
          )}

          {stageData.rating != null && (
            <div className="mt-3">
              <RatingStars rating={stageData.rating} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const StageTimeline = ({ stage, stageData }) => {
  if (!stageData?.submittedAt) {
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

  const events = [
    {
      date: stageData.submittedAt,
      label: `${STAGE_LABELS[stage]} submitted`,
      icon: FaFileAlt,
      color: "bg-blue-500",
    },
    stageData.reviewedAt && {
      date: stageData.reviewedAt,
      label: `Reviewed — ${STATUS_CONFIG[stageData.status]?.label}`,
      icon: STATUS_CONFIG[stageData.status]?.icon || FaClock,
      color: STATUS_CONFIG[stageData.status]?.dot || "bg-slate-400",
    },
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {events.map((ev, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full ${ev.color} flex items-center justify-center flex-shrink-0`}>
              <ev.icon className="text-white text-[10px]" />
            </div>
            {i < events.length - 1 && <div className="w-px h-4 bg-slate-200 mt-1" />}
          </div>
          <div className="pb-3">
            <p className="text-sm font-semibold text-slate-800">{ev.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{fmtTime(ev.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};



const StagePanel = ({ stage, stageData, onResubmit,onAdvance  }) => {
  const [subTab, setSubTab] = useState("details");
  const status = stageData?.status || "locked";
  const sc = STATUS_CONFIG[status];
  const StatusIcon = sc.icon;

  const subTabs = [
    { id: "details", label: "Details", icon: FaBookOpen },
    { id: "review", label: "Review Feedback", icon: FaCommentAlt },
    { id: "timeline", label: "Timeline", icon: FaHistory },
  ];

  if (status === "locked") {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-slate-200" />
        <div className="p-10 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
            <FaLock className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">{STAGE_LABELS[stage]} is locked</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {stage === "progress"
                ? "Submit and get your Proposal approved to unlock progress reporting."
                : "Submit and get your Progress Report approved to unlock final paper submission."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fieldEntries = Object.entries(stageData.fields || {});

  return (
    <div className="space-y-5">
   
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
              <FaCalendarAlt /> Submitted {fmt(stageData.submittedAt)}
            </span>
            <span className="flex items-center gap-1">
              <FaFileAlt /> {stageData.files?.length || 0} file{stageData.files?.length === 1 ? "" : "s"}
            </span>
          </div>

{status === "rejected" && (
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

{status === "approved" && stage === "proposal" && (
  <div className="mt-4">
    <button
      type="button"
      onClick={() => onAdvance?.(stage)}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
    >
      <FaArrowRight className="text-[10px]" /> Submit Progress Report
    </button>
  </div>
)}

{status === "approved" && stage === "progress" && (
  <div className="mt-4">
    <button
      type="button"
      onClick={() => onAdvance?.(stage)}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
    >
      <FaArrowRight className="text-[10px]" /> Submit Final Paper
    </button>
  </div>
)}
        </div>
      </div>

   
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
              {tab.id === "review" && stageData.reviewComment && (
                <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  1
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
                {stageData.files?.length > 0 ? (
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
              <ReviewerFeedback stageData={stageData} />

              {stageData.reviewHistory?.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-3">
                    Previous Reviews
                  </p>
                  <div className="space-y-3">
                    {stageData.reviewHistory.map((rev, i) => {
                      const rsc = STATUS_CONFIG[rev.status] || STATUS_CONFIG.pending;
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
              <StageTimeline stage={stage} stageData={stageData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



const ProjectHeader = ({ project, onBack }) => {
  const proposalApproved = project.stages.proposal?.status === "approved";

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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
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

          {proposalApproved && project.certificate && (
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
        </div>
      </div>
    </div>
  );
};



const ResearchDetails = ({  onBack, onResubmit }) => {
   const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStage, setActiveStage] = useState(null);
  const [resubmitTarget, setResubmitTarget] = useState(null);


  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { paper, reviews } = await research.getResearchDetails(id);
      const mapped = mapResearchToProject(paper, reviews);
      setProject(mapped);
      setActiveStage((prev) => {
        if (prev && mapped.stages[prev]?.status !== "locked") return prev;
        const firstOpen = Object.keys(mapped.stages).find(
          (s) => mapped.stages[s].status !== "approved",
        );
        return firstOpen || Object.keys(mapped.stages).pop();
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

  const handleResubmit = async (stage, fields, file) => {
    try {
      await research.resubmitResearch(id, fields, file);
      toast.success("Resubmitted successfully!");
      setResubmitTarget(null);
      load();
    } catch (err) {
      toast.error(err.message || "Resubmission failed");
    }
  };
const handleAdvance = (stage) => {
  if (stage === "proposal") {
    navigate(`/research/dashboard/research-progress/${id}`);
  } else if (stage === "progress") {
    navigate(`/research/dashboard/submit-final/${id}`);
  }
};
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
    status: stages[stage]?.status || "locked",
  }));

  const handleSelectStage = (stage) => {
    if (stages[stage]?.status !== "locked") setActiveStage(stage);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto w-full px-4 py-4 space-y-4">
        <ProjectHeader project={project} onBack={() => navigate("/research/dashboard")} />

        
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-5">
            Submission Progress
          </p>
          <StageProgressStrip stages={stages} activeStage={activeStage} onSelectStage={handleSelectStage} />
        </div>

        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
           {overallTabs.map((tab) => {
            const isLocked = tab.status === "locked";
            const isActive = tab.id === activeStage;
            const sc = STATUS_CONFIG[tab.status];
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
                {isLocked ? <FaLock className="text-[11px]" /> : <sc.icon className="text-[11px]" />}
                {STAGE_LABELS[tab.id]}
              </button>
            );
          })}
        </div>

<StagePanel
  stage={activeStage}
  stageData={stages[activeStage]}
  onResubmit={(stage) => setResubmitTarget(stage)}
  onAdvance={handleAdvance}
/>
      </main>
        {/* {resubmitTarget && (
        <SlideModal onClose={() => setResubmitTarget(null)}>
        
        </SlideModal>
      )} */}
    </div>
  );
};

export default ResearchDetails;
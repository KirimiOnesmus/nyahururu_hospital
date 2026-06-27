import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaArrowLeft, FaCheckCircle, FaClock, FaDownload, FaShieldAlt,
  FaUserMd, FaBuilding, FaCalendarAlt, FaCheck, FaTimes, FaSpinner,
  FaFilePdf, FaFileAlt, FaHourglassHalf, FaInfoCircle, FaUser,
  FaStar, FaStarHalfAlt, FaRegStar, FaFileDownload, FaExternalLinkAlt,
  FaBookOpen, FaCommentDots, FaClipboardCheck,
} from "react-icons/fa";
import * as research from "../../../api/research";

//  Constants 
const LIFECYCLE_STAGES = [
  { id: "proposal",    label: "Stage 1",  sublabel: "Proposal"    },
  { id: "progress",    label: "Stage 2",  sublabel: "Progress"    },
  { id: "final_paper", label: "Stage 3",  sublabel: "Final Paper" },
  { id: "committee",   label: "Stage 4",  sublabel: "Committee"   },
  { id: "decision",    label: "Decision", sublabel: "Sign-off"    },
];

const STAGE_IDS = LIFECYCLE_STAGES.map((s) => s.id);


const STATUS_TO_STAGE_INDEX = {
  pending:                    0,
  pending_proposal_review:    0,
  under_review:               1,
  progress_review:            1,
  pending_progress_review:    1,
  final_paper:                2,
  final_review:               2,
  pending_final_review:       2,
  committee_review:           3,
  pending_committee_review:   3,
  awaiting_sign_off:          3,
  approved:                   4,
  published:                  4,
  rejected:                   4,
};


const STATUS_CONFIG = {
  pending_proposal_review:  { label: "Pending Proposal Review",  cls: "bg-slate-100 text-slate-600  border-slate-200"  },
  pending_progress_review:  { label: "Pending Progress Review",  cls: "bg-blue-50   text-blue-700   border-blue-200"   },
  pending_final_review:     { label: "Pending Final Review",     cls: "bg-blue-50   text-blue-700   border-blue-200"   },
  pending_committee_review: { label: "Pending Committee Review", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  committee_review:         { label: "Under Committee Review",   cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  awaiting_sign_off:        { label: "Awaiting Sign-off",        cls: "bg-amber-50  text-amber-700  border-amber-200"  },
  approved:                 { label: "Committee Approved",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: FaCheckCircle },
  published:                { label: "Published",                cls: "bg-teal-50   text-teal-700   border-teal-200"   },
  rejected:                 { label: "Rejected",                 cls: "bg-red-50    text-red-700    border-red-200"    },
  pending:                  { label: "Pending Review",           cls: "bg-slate-100 text-slate-600  border-slate-200"  },
  under_review:             { label: "Under Review",             cls: "bg-blue-50   text-blue-700   border-blue-200"   },
  revision_requested:       { label: "Revision Requested",       cls: "bg-orange-50 text-orange-700 border-orange-200" },
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
  d ? new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string" || !v.trim()) return [];
  return v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^\d+[.)]\s*/, "")); 
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

//  Status badge 
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown",
    cls: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${cfg.cls}`}>
      {Icon && <Icon className="text-[10px]" />}
      {cfg.label}
    </span>
  );
};

//  Lifecycle tracker (clickable) 
const LifecycleTracker = ({ status, activeStage, onStageClick }) => {
  const currentIndex = STATUS_TO_STAGE_INDEX[status] ?? 0;
  return (
    <div className="flex items-start">
      {LIFECYCLE_STAGES.map((stage, i) => {
        const isComplete = i < currentIndex;
        const isCurrent  = i === currentIndex;
        const isActive   = i === activeStage;
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
                  ${isComplete
                    ? "bg-blue-900 text-white"
                    : isCurrent
                    ? "bg-cyan-100 border-2 border-cyan-500"
                    : "bg-slate-100 border-2 border-slate-200 group-hover:border-blue-300"}`}
              >
                {isComplete
                  ? <FaCheck className="text-xs" />
                  : isCurrent
                  ? <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  : null}
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

//  Document row 
const DocumentRow = ({ label, url, stageLabel }) => {
  if (!url) return null;
  const filename = url.split("/").pop() || label;
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
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          aria-label={`View ${label}`}
        >
          <FaExternalLinkAlt className="text-xs" />
        </a>
        <a
          href={url}
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

//  Score card 
const ScoreCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 p-4 text-center">
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-2xl font-bold text-slate-800">
      {value != null ? Number(value).toFixed(1) : "—"}
    </p>
  </div>
);

//  Reviewer card 
const ReviewerCard = ({ review, index }) => {
  const name           = review.reviewerName || review.reviewer?.name || review.reviewer?.displayName || `Reviewer ${index + 1}`;
  const email          = review.reviewer?.email;
  const recommendation = review.recommendation || review.decision;
  const isApprove      = ["approved", "highly_recommended", "approve"].includes(recommendation);

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
            <p className="text-xs text-slate-500">{fmtDate(review.submittedAt || review.reviewedAt || review.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {review.overallScore != null && <StarRating value={review.overallScore} />}
          {recommendation && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border
                ${isApprove
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"}`}
            >
              {isApprove ? "Recommend: Approve" : "Recommend: Revise"}
            </span>
          )}
        </div>
      </div>

      {review.scores && Object.keys(review.scores).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {Object.entries(review.scores).map(([key, val]) => (
            <div key={key} className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-center">
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

//  Audit entry 
const AuditEntry = ({ text, time }) => (
  <div className="flex gap-3">
    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
    <div>
      <p className="text-sm text-slate-700">{text}</p>
      <p className="text-xs text-slate-400">{time}</p>
    </div>
  </div>
);

//  Stage-aware content panels 


const ProposalPanel = ({ r }) => (
  <>
    {(r.abstract || r.background || r.methodology || r.expectedOutcome || r.objectives.length > 0 || r.keywords.length > 0) && (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base">Proposal Content</h2>

        {r.abstract && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Abstract</p>
            <p className="text-sm text-slate-700 leading-relaxed">{r.abstract}</p>
          </div>
        )}
        {r.background && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Background</p>
            <p className="text-sm text-slate-700 leading-relaxed">{r.background}</p>
          </div>
        )}
        {r.methodology && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Methodology</p>
            <p className="text-sm text-slate-700 leading-relaxed">{r.methodology}</p>
          </div>
        )}
        {r.expectedOutcome && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Expected Outcome</p>
            <p className="text-sm text-slate-700 leading-relaxed">{r.expectedOutcome}</p>
          </div>
        )}
        {r.objectives.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Objectives</p>
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
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {r.keywords.map((kw, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">
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
        <DocumentRow
          label="Proposal File"
          url={r.proposalFile}
          stageLabel="Stage 1 · Proposal"
        />
      ) : (
        <EmptyState icon={FaFileAlt} title="No proposal document uploaded" sub="The researcher has not yet attached a proposal file." />
      )}
    </div>
  </>
);


const ProgressPanel = ({ r }) => {
  const pd = r.progressData || {};
  const progressFields = [
    { label: "Study Design",              value: pd.studyDesign },
    { label: "Sampling Method",           value: pd.samplingMethod },
    { label: "Sample Size (Target)",      value: pd.sampleSizeTarget },
    { label: "Sample Size (Achieved)",    value: pd.sampleSizeAchieved },
    { label: "Statistical Methods",       value: pd.statisticalMethods },
    { label: "Analysis Tools",            value: pd.analysisTools },
  ].filter((f) => f.value != null && f.value !== "");

  const progressNarrative = [
    { label: "Preliminary Findings",        value: pd.preliminaryFindings },
    { label: "Deviations from Protocol",    value: pd.deviationsFromProtocol },
    { label: "Ethical Incidents",           value: pd.ethicalIncidents },
    { label: "Methodology Notes",           value: pd.methodology },
  ].filter((f) => f.value);

  const progressFiles = Array.isArray(r.progressFiles) ? r.progressFiles : [];

  return (
    <>
      {(progressFields.length > 0 || progressNarrative.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Progress Report</h2>

          {progressFields.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {progressFields.map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          )}

          {progressNarrative.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
            </div>
          ))}

          {pd.submittedAt && (
            <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">
              Submitted {fmtDate(pd.submittedAt)}
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 text-base mb-4">Progress Documents</h2>
        {progressFiles.length === 0 ? (
          <EmptyState icon={FaFileAlt} title="No progress report uploaded" sub="The researcher has not yet submitted a progress report." />
        ) : (
          progressFiles.map((f, i) => (
            <DocumentRow
              key={f._id || f.id || i}
              label={f.label ? f.label.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase()) : `Progress File ${i + 1}`}
              url={f.url}
              stageLabel="Stage 2 · Progress"
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
    { label: "Final Paper",         url: r.finalPaperFile,              stageLabel: "Stage 3 · Final Paper" },
    { label: "Final Dataset",       url: supporting.finalDataset?.url,  stageLabel: "Stage 3 · Final Paper" },
    { label: "Data Dictionary",     url: supporting.dataDictionary?.url, stageLabel: "Stage 3 · Final Paper" },
    { label: "Statistical Scripts", url: supporting.statisticalScripts?.url, stageLabel: "Stage 3 · Final Paper" },
    { label: "Ethics Approval",     url: supporting.ethicsApproval?.url, stageLabel: "Compliance" },
    { label: "Funding Disclosure",  url: supporting.fundingDisclosure?.url, stageLabel: "Compliance" },
    { label: "Plagiarism Report",   url: fps.plagiarismReportLink,      stageLabel: "Compliance" },
  ].filter((d) => d.url);

  const aiDeclared  = declarations.aiUsageDeclared;
  const coiDeclared = declarations.conflictOfInterestDeclared;
  const fundingSource = fps.fundingSource || r.fundingSource;

  return (
    <>
      {(r.finalAbstract || r.abstract || r.keywords.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Final Paper Details</h2>
          {r.finalAbstract ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Final Abstract</p>
              <p className="text-sm text-slate-700 leading-relaxed">{r.finalAbstract}</p>
            </div>
          ) : r.abstract ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Abstract</p>
              <p className="text-sm text-slate-700 leading-relaxed">{r.abstract}</p>
            </div>
          ) : null}
          {r.keywords.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Keywords</p>
              <div className="flex flex-wrap gap-2">
                {r.keywords.map((kw, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              { label: "AI Usage", value: aiDeclared ? "Declared" : aiDeclared === false ? "Not declared" : null },
              { label: "COI",      value: coiDeclared ? "Declared" : coiDeclared === false ? "None" : null },
              { label: "Funding",  value: fundingSource },
            ].filter((i) => i.value).map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          {fps.noteToCommittee && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Note to Committee</p>
              <p className="text-xs text-amber-800 leading-relaxed">{fps.noteToCommittee}</p>
            </div>
          )}
          {declarations.aiUsageDetails && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">AI Usage Details</p>
              <p className="text-sm text-slate-700 leading-relaxed">{declarations.aiUsageDetails}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 text-base mb-4">Final Paper Documents</h2>
        {finalDocs.length === 0 ? (
          <EmptyState icon={FaFileAlt} title="No final paper documents uploaded" sub="The researcher has not yet submitted final paper files." />
        ) : (
          finalDocs.map((doc) => <DocumentRow key={doc.label} {...doc} />)
        )}
      </div>
    </>
  );
};


const CommitteePanel = ({ r, reviews, computedAvg, aggregatedScores }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6">
    <div className="flex items-start justify-between gap-4 mb-5">
      <h2 className="font-bold text-slate-900 text-base">Peer Review Evaluations</h2>
      {computedAvg != null && (
        <div className="text-right shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Avg Score</p>
          <p className="text-2xl font-bold text-blue-900">
            {Number(computedAvg).toFixed(1)}
            <span className="text-sm text-slate-400">/5</span>
          </p>
        </div>
      )}
    </div>

    {aggregatedScores && Object.keys(aggregatedScores).length > 0 && (
      <div className={`grid gap-3 mb-6 grid-cols-2 sm:grid-cols-${Math.min(Object.keys(aggregatedScores).length, 4)}`}>
        {Object.entries(aggregatedScores).map(([key, val]) => (
          <ScoreCard key={key} label={key.replace(/_/g, " ")} value={val} />
        ))}
      </div>
    )}

    {r.committeeRound > 1 && (
      <p className="text-xs text-slate-400 mb-4">Committee review round {r.committeeRound}</p>
    )}

    {reviews.length === 0 ? (
      <EmptyState icon={FaUser} title="No reviews yet" sub="No peer review submissions have been recorded for this research." />
    ) : (
      <>
        <h3 className="font-bold text-slate-800 text-sm mb-3">Reviewer Assessments</h3>
        <div className="space-y-3">
          {reviews.map((rv, i) => <ReviewerCard key={rv._id || i} review={rv} index={i} />)}
        </div>
      </>
    )}

    {r.committeeComment && (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 mt-4">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-1">Committee Comment</p>
        <p className="text-xs text-indigo-800 leading-relaxed">{r.committeeComment}</p>
      </div>
    )}
  </div>
);


const DecisionPanel = ({ r, decisionMade, decisionLoading, onApprove, onReject, noteToCommittee }) => {
  const rawStatus       = r.status || "pending";
  const isCommitteeStage = STATUS_TO_STAGE_INDEX[rawStatus] === 3;
  const isApproved      = ["approved", "published"].includes(rawStatus);

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
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Note from Researcher</p>
              <p className="text-xs text-amber-800 leading-relaxed">{noteToCommittee}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button type="button" className={primaryBtn} onClick={onApprove}>
              <FaCheck className="text-xs" />
              Sign Off & Approve
            </button>
            <button type="button" className={dangerOutlineBtn} disabled={decisionLoading} onClick={onReject}>
              {decisionLoading ? <FaSpinner className="animate-spin text-xs" /> : <FaTimes className="text-xs" />}
              Request Revisions
            </button>
          </div>
        </>
      )}

      {!decisionMade && isApproved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 flex items-start gap-3 text-sm text-emerald-800">
          <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" />
          <p>Signed off by the committee{r.publishedAt ? ` on ${fmtDate(r.publishedAt)}` : ""}.</p>
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

//  Main page 
const CommitteeResearchDetails = () => {
  const navigate  = useNavigate();
  const { state } = useLocation();
  const { id }    = useParams();

  const recordProp = state?.record ?? null;

  const [detail, setDetail]                   = useState(null);
  const [reviews, setReviews]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionMade, setDecisionMade]       = useState(null);
  const [downloading, setDownloading]         = useState(false);
  const [activeStage, setActiveStage]         = useState(null);

  //  Fetch full detail + reviews 
  const load = useCallback(async () => {
    const recordId = id || recordProp?._id || recordProp?.id;
    if (!recordId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [detailRes, reviewHistory] = await Promise.all([
        research.getResearchDetail(recordId),
        research.getReviewHistory(recordId).catch(() => []),
      ]);

      const paper = detailRes?.paper ?? detailRes ?? null;
      setDetail(paper);
      setReviews(Array.isArray(reviewHistory) ? reviewHistory : (reviewHistory?.reviews ?? []));


      if (paper?.committeeReviewedBy || ["approved", "rejected", "published"].includes(paper?.status)) {
        if (paper.status === "rejected") setDecisionMade("rejected");
        else if (["approved", "published"].includes(paper.status)) setDecisionMade("approved");
      }
    } catch {
      toast.error("Failed to load research details");
    } finally {
      setLoading(false);
    }
  }, [id, recordProp]);

  useEffect(() => { load(); }, [load]);

  //  Default activeStage to current lifecycle stage once data loads 
  useEffect(() => {
    if (detail && activeStage === null) {
      const rawStatus = detail.status || "pending";
      setActiveStage(STATUS_TO_STAGE_INDEX[rawStatus] ?? 0);
    }
  }, [detail, activeStage]);

  const goToSignOff = () => {
    const rid = detail?._id || detail?.id;
    if (!rid) return;
    navigate(`/research/dashboard/committee-sign-off/${rid}`);
  };

  const handleDecision = async (decision) => {
    const rid = detail?._id || detail?.id;
    if (!rid) return;
    setDecisionLoading(true);
    try {
      await research.submitCommitteeDecision(rid, { decision });
      setDecisionMade(decision);
      toast.success("Revision request recorded");
    } catch {
      toast.error("Could not record the committee decision. Please try again.");
    } finally {
      setDecisionLoading(false);
    }
  };

  //  Download full ZIP 
  const handleDownloadAll = async () => {
    const rid = detail?._id || detail?.id;
    if (!rid) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/research/${rid}/download-zip`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${detail.projectId || rid}-full-package.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download package. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  //  Guards 
  if (!id && !recordProp) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 text-sm">No research record selected.</p>
      </div>
    );
  }
  if (loading) return <PageSpinner label="Loading research details…" />;


  const r = { ...recordProp, ...detail };
  r.objectives      = toArray(r.objectives);
  r.keywords        = toArray(r.keywords);
  r.coInvestigators = Array.isArray(r.coInvestigators) ? r.coInvestigators : [];

  const rawStatus        = r.status || "pending";
  const isCommitteeStage = STATUS_TO_STAGE_INDEX[rawStatus] === 3;
  const isApproved       = ["approved", "published"].includes(rawStatus);

  //  Active stage 
  const resolvedActiveStage = activeStage ?? STATUS_TO_STAGE_INDEX[rawStatus] ?? 0;
  const viewingStageId      = STAGE_IDS[resolvedActiveStage];

  //  Reviews: use review history if present, else synthesize a single

  const effectiveReviews = (() => {
    if (reviews.length > 0) return reviews;
    if (r.reviewedBy && (r.reviewDecision || r.reviewComment)) {
      return [{
        reviewer: r.reviewedBy,
        recommendation: r.reviewDecision,
        comments: r.reviewComment,
        reviewedAt: r.reviewedAt,
        overallScore: r.aggregateScore ?? null,
      }];
    }
    return [];
  })();

  //  Computed scores 
  const computedAvg = effectiveReviews.length > 0 && effectiveReviews.some((rv) => rv.overallScore != null)
    ? effectiveReviews.reduce((sum, rv) => sum + (rv.overallScore || 0), 0) /
      effectiveReviews.filter((rv) => rv.overallScore != null).length
    : r.aggregateScore ?? r.avgScore ?? null;

  const aggregatedScores = (() => {
    if (effectiveReviews.length === 0) return r.scores || null;
    const keys = new Set(effectiveReviews.flatMap((rv) => Object.keys(rv.scores || {})));
    if (keys.size === 0) return r.scores || null;
    const totals = {};
    keys.forEach((k) => { totals[k] = 0; });
    effectiveReviews.forEach((rv) => {
      Object.entries(rv.scores || {}).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + Number(v); });
    });
    const result = {};
    keys.forEach((k) => { result[k] = totals[k] / effectiveReviews.length; });
    return result;
  })();

  //  Note to committee — only meaningful at the final-paper stage 
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
          <MetaItem icon={FaShieldAlt}   value={r.projectId || r.researchId || r._id} />
          <MetaItem icon={FaUserMd}      value={r.researcher?.displayName || r.researcher?.name || r.researcherName} />
          <MetaItem icon={FaBuilding}    value={r.discipline || r.department} />
          <MetaItem icon={FaCalendarAlt} value={r.createdAt ? `Submitted ${fmtDate(r.createdAt)}` : null} />
        </div>


        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button type="button" onClick={handleDownloadAll} disabled={downloading} className={secondaryBtn}>
            <FaFileDownload className="text-xs" />
            {downloading ? "Preparing…" : "Download All (.zip)"}
          </button>
          {isCommitteeStage && !decisionMade && (
            <button
              type="button"
              onClick={goToSignOff}
              className={primaryBtn}
            >
              <FaClipboardCheck className="text-sm" />
              Sign Off & Approve
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/*  Main column  */}
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

  
          {viewingStageId === "proposal" && (
            <ProposalPanel r={r} />
          )}

          {viewingStageId === "progress" && (
            <ProgressPanel r={r} />
          )}

          {viewingStageId === "final_paper" && (
            <FinalPaperPanel r={r} />
          )}

          {viewingStageId === "committee" && (
            <CommitteePanel
              r={r}
              reviews={effectiveReviews}
              computedAvg={computedAvg}
              aggregatedScores={aggregatedScores}
            />
          )}

          {viewingStageId === "decision" && (
            <DecisionPanel
              r={r}
              decisionMade={decisionMade}
              decisionLoading={decisionLoading}
              onDecision={handleDecision}
              noteToCommittee={noteToCommittee}
            />
          )}
        </div>

        {/*  Sidebar  */}
        <div className="space-y-6">

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Details</h2>
            <div className="space-y-3">
              {[
                { label: "Researcher", value: r.researcher?.displayName || r.researcher?.name },
                { label: "Discipline", value: r.discipline },
                { label: "Timeline",   value: r.timeline },
                { label: "Funding",    value: r.finalPaperSubmission?.fundingSource || r.fundingSource },
                { label: "Submitted",  value: fmtDate(r.createdAt) },
                { label: "AI Usage",   value: r.finalPaperSubmission?.declarations?.aiUsageDeclared
                                              ? "Declared"
                                              : r.finalPaperSubmission?.declarations?.aiUsageDeclared === false
                                              ? "Not declared" : null },
                { label: "COI",        value: r.finalPaperSubmission?.declarations?.conflictOfInterestDeclared
                                              ? "Declared"
                                              : r.finalPaperSubmission?.declarations?.conflictOfInterestDeclared === false
                                              ? "None" : null },
              ].filter((i) => i.value && i.value !== "—").map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">{label}</span>
                  <span className="text-xs font-semibold text-slate-700 text-right">{value}</span>
                </div>
              ))}
            </div>
            {r.coInvestigators?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Co-Investigators</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.coInvestigators.map((co, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
                      {co.name || co}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 text-sm mb-4">
              {isCommitteeStage ? "Committee Decision" : "Committee Record"}
            </h2>

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
                <p className="text-sm text-slate-500 mb-4">
                  Record the committee's final decision for this submission.
                </p>
                {noteToCommittee && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Note from Researcher</p>
                    <p className="text-xs text-amber-800 leading-relaxed">{noteToCommittee}</p>
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  <button type="button" className={primaryBtn} disabled={decisionLoading} onClick={() => handleDecision("approved")}>
                    {decisionLoading ? <FaSpinner className="animate-spin text-xs" /> : <FaCheck className="text-xs" />}
                    Approve Study
                  </button>
                  <button type="button" className={dangerOutlineBtn} disabled={decisionLoading} onClick={() => handleDecision("rejected")}>
                    <FaTimes className="text-xs" />
                    Request Revisions
                  </button>
                </div>
              </>
            )}

            {!decisionMade && isApproved && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 flex items-start gap-3 text-sm text-emerald-800">
                <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" />
                <p>Signed off by the committee{r.publishedAt ? ` on ${fmtDate(r.publishedAt)}` : ""}.</p>
              </div>
            )}

            {!decisionMade && !isCommitteeStage && !isApproved && (
              <p className="text-sm text-slate-400">
                This submission is not yet at the committee decision stage.
              </p>
            )}
          </div> */}

          {/* Audit trail */}
          {auditTrail.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Audit Trail</h2>
              <div className="space-y-4">
                {auditTrail.map((entry, i) => (
                  <AuditEntry key={i} text={entry.text || entry.action} time={entry.time || fmtDate(entry.createdAt)} />
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
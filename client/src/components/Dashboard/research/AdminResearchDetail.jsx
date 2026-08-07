import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaUser, FaEnvelope, FaUniversity, FaBookOpen,
  FaCheckCircle, FaClock, FaTimes, FaUserTie, FaRedo, FaFilePdf,
  FaShieldAlt, FaStamp, FaExclamationTriangle, FaClipboardCheck,
  FaHashtag, FaCalendarAlt, FaStar, FaChevronDown, FaChevronUp,
  FaFileAlt, FaPaperPlane, FaSave, FaLock, FaCrown, FaLayerGroup,
  FaMicroscope, FaMoneyBillWave, FaRegFileAlt, FaDownload,
  FaHistory, FaEdit, FaSpinner, FaTrash, FaPhone, FaCloudUploadAlt, FaPaperclip,
} from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import notify from "../../../common/utils/notify";
import api from "../../../api/axios";
import * as research from "../../../api/research";
import RevisionComparison from "../../research/RevisionComparison";
import { ASSET_BASE_URL } from "../../../config/env";

/* ────────────────────────────────────────────────────────────────── */
/*  Metadata maps                                                    */
/* ────────────────────────────────────────────────────────────────── */

const STAGE_META = {
  proposal:    { label: "Proposal",     color: "bg-amber-500",   light: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200", dot: "bg-amber-400",   icon: FaRegFileAlt },
  progress:    { label: "In Progress",  color: "bg-sky-500",     light: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",   dot: "bg-sky-400",     icon: FaLayerGroup },
  final_paper: { label: "Final Paper",  color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400", icon: FaMicroscope },
};

const STATUS_META = {
  submitted:                { label: "Submitted",              color: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-400",    icon: FaClock },
  pending:                  { label: "Under Review",           color: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-400",    icon: FaClock },
  returned_for_correction:  { label: "Returned for Correction",color: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-400",  icon: FaRedo },
  pending_committee_review: { label: "Awaiting Committee",     color: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-400",  icon: FaUserTie },
  pending_officer_review:   { label: "Awaiting Officer Release",color: "bg-indigo-100", text: "text-indigo-700",  dot: "bg-indigo-400",  icon: FaClipboardCheck },
  revision_requested:       { label: "Revision Requested",     color: "bg-amber-100",   text: "text-amber-700",  dot: "bg-amber-400",   icon: FaRedo },
  suspended:                { label: "Suspended",              color: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-500",  icon: FaShieldAlt },
  approved:                 { label: "Approved",               color: "bg-green-100",   text: "text-green-700",   dot: "bg-green-500",   icon: FaCheckCircle },
  rejected:                 { label: "Rejected",               color: "bg-red-100",     text: "text-red-700",     dot: "bg-red-400",     icon: FaTimes },
};

const DECISION_META = {
  approved:  { label: "Approved",           cls: "text-green-700 bg-green-50 border-green-200" },
  revision:  { label: "Revision Requested", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  rejected:  { label: "Rejected",           cls: "text-red-700 bg-red-50 border-red-200" },
  suspended: { label: "Suspended",          cls: "text-orange-700 bg-orange-50 border-orange-200" },
};

const TYPE_LABELS = {
  initial_proposal:   "Initial Proposal",
  amendment:          "Amendment",
  continuing_review:  "Continuing Review",
  study_closure:      "Study Closure",
};

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtFull = (d) => d ? new Date(d).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const formatKES = (n) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n || 0);

const resolveUrl = (url) => {
  if (!url) return null;
  const base = url.startsWith("http") ? url : `${ASSET_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  const token = localStorage.getItem("token");
  if (token && base.includes("/uploads/")) {
    return `${base}${base.includes("?") ? "&" : "?"}token=${token}`;
  }
  return base;
};

/* ────────────────────────────────────────────────────────────────── */
/*  Reusable building blocks                                         */
/* ────────────────────────────────────────────────────────────────── */

const InfoRow = ({ icon: Icon, label, value, mono }) => (
  <div className="flex items-start gap-3 py-2.5">
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
      <Icon className="text-gray-400 text-sm" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm text-gray-800 mt-0.5 ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  </div>
);

const Section = ({ title, icon: Icon, children, defaultOpen = true, badge, badgeColor = "bg-gray-100 text-gray-600" }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="text-gray-400 text-sm" />}
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {badge != null && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
          )}
        </div>
        {open ? <FaChevronUp className="text-gray-300 text-xs" /> : <FaChevronDown className="text-gray-300 text-xs" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-50">{children}</div>}
    </div>
  );
};

const CriteriaBar = ({ label, score, max = 10 }) => {
  const pct = Math.min(100, (score / max) * 100);
  const tone = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-500 w-36 truncate capitalize">{label.replace(/_/g, " ")}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-bold text-gray-600 w-10 text-right">{score}/{max}</span>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────── */
/*  Main page component                                              */
/* ────────────────────────────────────────────────────────────────── */

const AdminResearchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);

  // Multi-reviewer assignments
  const [reviewerAssignments, setReviewerAssignments] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Decision report (Chair's §6.1)
  const [decisionReport, setDecisionReport] = useState(null);

  // Protocol deviations
  const [deviations, setDeviations] = useState([]);

  // Revenue
  const [revenue, setRevenue] = useState(null);

  // Decision letters
  const [decisionLetters, setDecisionLetters] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [paperData, reviewerData, reviewData, reportData, devData, letterData] = await Promise.all([
        research.getResearchById(id),
        research.getResearchReviewers(id).catch(() => []),
        research.getReviewHistory(id).catch(() => []),
        research.getDecisionReport(id).catch(() => null),
        research.getProtocolDeviations(id).catch(() => []),
        research.getDecisionLetterHistory(id).catch(() => []),
      ]);

      setPaper(paperData);
      setReviewerAssignments(reviewerData);
      setReviews(reviewData);
      setDecisionReport(reportData);
      setDeviations(devData);
      setDecisionLetters(letterData);

      // Revenue
      try {
        const rev = await research.getResearcherRevenue(id);
        const revData = rev?.data || rev;
        setRevenue(revData?.revenue || revData);
      } catch { setRevenue(null); }
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to load research details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-3 text-sm">Loading research details…</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaBookOpen className="text-4xl text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Research not found</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-blue-600 text-sm hover:underline cursor-pointer">Go back</button>
        </div>
      </div>
    );
  }

  const stage = paper.stage || "proposal";
  const stageMeta = STAGE_META[stage] || STAGE_META.proposal;
  const statusMeta = STATUS_META[paper.status] || STATUS_META.pending;
  const StatusIcon = statusMeta.icon;

  // Merge review data with reviewer assignments for a complete picture
  const enrichedReviewers = reviewerAssignments.map((assignment) => {
    // Get ALL reviews by this reviewer, not just the first one
    const matchedReviews = reviews.filter(
      (r) => r.reviewerId === assignment.reviewerId || r.reviewerId === assignment.reviewer?.id
    );
    // The latest review is the "current" one
    const latestReview = matchedReviews.length > 0
      ? matchedReviews.sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt))[0]
      : null;
    return { ...assignment, review: latestReview, allReviews: matchedReviews };
  });

  // Reviews not matched to assignments (legacy single-reviewer)
  const matchedReviewerIds = new Set(
    reviewerAssignments.flatMap((a) => [a.reviewerId, a.reviewer?.id].filter(Boolean))
  );
  const unlinkedReviews = reviews.filter(
    (r) => !matchedReviewerIds.has(r.reviewerId)
  );

  const totalReviewers = enrichedReviewers.length;
  const submittedReviewers = enrichedReviewers.filter((r) => r.reviewStatus === "submitted" || r.review).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ── Back navigation ── */}
        <button
          onClick={() => navigate("/dashboard/research")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-5 cursor-pointer transition-colors"
        >
          <FaArrowLeft className="text-xs" /> Back to Research Management
        </button>

        {/* ── Header banner ── */}
        <div className={`${stageMeta.color} rounded-2xl px-6 py-5 mb-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {stageMeta.label}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${statusMeta.color} ${statusMeta.text}`}>
                  <StatusIcon className="text-[9px]" /> {statusMeta.label}
                </span>
                {paper.submissionType && (
                  <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[paper.submissionType] || paper.submissionType}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">{paper.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-white/90 text-sm flex-wrap">
                <span className="flex items-center gap-1.5">
                  <FaUser className="text-xs" />
                  {paper.researcher?.name || paper.author || "Unknown"}
                </span>
                {paper.researcher?.email && (
                  <span className="flex items-center gap-1.5">
                    <FaEnvelope className="text-xs" /> {paper.researcher.email}
                  </span>
                )}
                {paper.researcher?.institution && (
                  <span className="flex items-center gap-1.5">
                    <FaUniversity className="text-xs" /> {paper.researcher.institution}
                  </span>
                )}
              </div>
            </div>
            {paper.seruNumber && (
              <div className="bg-white/20 rounded-xl px-4 py-2.5 text-center shrink-0">
                <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">SERU</p>
                <p className="text-lg font-bold text-white font-mono">{paper.seruNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Status pipeline ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <ReviewPipeline status={paper.status} totalReviewers={totalReviewers} submittedReviewers={submittedReviewers} />
        </div>

        {/* ── Grid layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: 2/3 */}
          <div className="lg:col-span-2 space-y-5">

            {/* Continuing-review progress report: this submission's own row
                leaves abstract/background/etc. NULL (those live on the
                parent study), so the actual written content is the
                progress-report narrative the backend flattens onto
                `continuingReviewData`. Was previously not rendered at all,
                making every continuing review look empty here. */}
            {paper.submissionType === "continuing_review" && (
              <Section title="Continuing Review — Progress Report" icon={FaBookOpen} defaultOpen>
                <div className="space-y-4 pt-3">
                  {[
                    ["Progress Summary", paper.continuingReviewData?.progressSummary],
                    ["Adverse Events", paper.continuingReviewData?.adverseEvents],
                    ["Amendments During Period", paper.continuingReviewData?.amendments],
                    ["Constraints", paper.continuingReviewData?.constraints],
                    ["Plans For Next Year", paper.continuingReviewData?.plansForNextYear],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{value}</p>
                    </div>
                  ))}
                  {(paper.continuingReviewData?.participantsEnrolled != null ||
                    paper.continuingReviewData?.participantsContinuing != null) && (
                    <div className="flex gap-6">
                      {paper.continuingReviewData?.participantsEnrolled != null && (
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Participants Enrolled</p>
                          <p className="text-sm text-gray-700">{paper.continuingReviewData.participantsEnrolled}</p>
                        </div>
                      )}
                      {paper.continuingReviewData?.participantsContinuing != null && (
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Participants Continuing</p>
                          <p className="text-sm text-gray-700">{paper.continuingReviewData.participantsContinuing}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {!paper.continuingReviewData?.progressSummary && (
                    <p className="text-sm text-gray-400">No progress details recorded.</p>
                  )}
                </div>
              </Section>
            )}

            {/* Abstract & Content */}
            <Section title="Research Details" icon={FaBookOpen}>
              <div className="space-y-4 pt-3">
                {paper.abstract && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Abstract</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{paper.abstract}</p>
                  </div>
                )}
                {paper.background && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Background</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{paper.background}</p>
                  </div>
                )}
                {paper.methodology && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Methodology</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{paper.methodology}</p>
                  </div>
                )}
                {paper.expectedOutcome && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Expected Outcome</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{paper.expectedOutcome}</p>
                  </div>
                )}
                {paper.hypotheses && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Hypotheses</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{paper.hypotheses}</p>
                  </div>
                )}
              </div>
            </Section>

            {paper.resubmissionCount > 0 && (
              <Section
                title="Revision Comparison"
                icon={FaRedo}
                badge={`${paper.resubmissionCount} revision${paper.resubmissionCount > 1 ? "s" : ""}`}
                badgeColor="bg-purple-100 text-purple-700"
                defaultOpen={false}
              >
                <div className="pt-3">
                  <RevisionComparison researchId={paper.id} />
                </div>
              </Section>
            )}

            {/* Assigned Reviewers + Scores */}
            <Section
              title="Assigned Reviewers & Feedback"
              icon={FaUserTie}
              badge={`${submittedReviewers}/${totalReviewers} submitted`}
              badgeColor={submittedReviewers === totalReviewers && totalReviewers > 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}
            >
              <div className="space-y-3 pt-3">
                {enrichedReviewers.length === 0 && unlinkedReviews.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-4 text-center">No reviewers assigned yet.</p>
                ) : (
                  <>
                    {enrichedReviewers.map((assignment, idx) => (
                      <ReviewerCard key={assignment.id || idx} assignment={assignment} index={idx} />
                    ))}
                    {unlinkedReviews.map((review, idx) => (
                      <ReviewerCard
                        key={`unlinked-${review.id}`}
                        assignment={{ reviewer: review.reviewer || { name: `Reviewer (ID: ${review.reviewerId})` }, reviewStatus: "submitted", review }}
                        index={enrichedReviewers.length + idx}
                      />
                    ))}
                  </>
                )}
              </div>
            </Section>

            {/* Committee Comment */}
            {paper.committeeComment && (
              <Section title="Committee Comment" icon={FaCrown} defaultOpen>
                <div className="bg-violet-50 border border-violet-100 rounded-lg p-4 mt-3">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{paper.committeeComment}</p>
                </div>
              </Section>
            )}

            {/* Decision Report (Chair's §6.1) */}
            <DecisionReportSection report={decisionReport} researchId={id} onRefresh={fetchAll} />

            {/* Protocol Deviations */}
            {deviations.length > 0 && (
              <Section title="Protocol Deviations" icon={FaExclamationTriangle} badge={deviations.length} badgeColor="bg-red-100 text-red-700" defaultOpen={false}>
                <div className="space-y-3 pt-3">
                  {deviations.map((d) => {
                    const sevStyle = d.severity === "critical" ? "bg-red-100 text-red-700"
                      : d.severity === "major" ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600";
                    return (
                      <div key={d.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sevStyle}`}>
                            {d.severity?.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400 capitalize">{d.deviationType?.replace(/_/g, " ")}</span>
                          {d.isUrgentSafety && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">URGENT SAFETY</span>
                          )}
                          <span className="text-xs text-gray-300 ml-auto">{fmt(d.dateOfDeviation)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{d.description}</p>
                        {d.correctiveAction && (
                          <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Corrective action:</span> {d.correctiveAction}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>

          {/* Right column: 1/3 */}
          <div className="space-y-5">

            {/* Key Info Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-1">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Key Information</h3>
              <InfoRow icon={FaHashtag} label="Research ID" value={paper.researchId || paper.id} mono />
              {paper.seruNumber && <InfoRow icon={FaHashtag} label="SERU Number" value={paper.seruNumber} mono />}
              <InfoRow icon={FaCalendarAlt} label="Submitted" value={fmt(paper.createdAt)} />
              {paper.approvalValidUntil && <InfoRow icon={FaCalendarAlt} label="Approval Valid Until" value={fmt(paper.approvalValidUntil)} />}
              {paper.reviewDeadline && <InfoRow icon={FaClock} label="Review Deadline" value={fmt(paper.reviewDeadline)} />}
              <InfoRow icon={FaBookOpen} label="Discipline" value={paper.discipline} />
              {paper.category && <InfoRow icon={FaBookOpen} label="Category" value={paper.category} />}
              {paper.resubmissionCount > 0 && <InfoRow icon={FaRedo} label="Resubmissions" value={paper.resubmissionCount} />}
            </div>

            {/* Revenue Card */}
            {revenue && (revenue.proposalIncome > 0 || revenue.totalIncome > 0) && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-500" /> Revenue
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Proposal Fee</span>
                    <span className="text-sm font-bold text-green-700">{formatKES(revenue.proposalIncome)}</span>
                  </div>
                  {revenue.totalIncome > revenue.proposalIncome && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className="text-xs text-gray-500">Total Income</span>
                      <span className="text-sm font-bold text-green-700">{formatKES(revenue.totalIncome)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CSC Endorsement */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaStamp className="text-teal-500" /> CSC Endorsement
              </h3>
              {paper.cscApprovalDate ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 text-sm font-semibold mb-2">
                    <FaCheckCircle /> Endorsed
                  </div>
                  <InfoRow icon={FaCalendarAlt} label="Approval Date" value={fmt(paper.cscApprovalDate)} />
                  {paper.cscReviewDate && <InfoRow icon={FaCalendarAlt} label="Review Date" value={fmt(paper.cscReviewDate)} />}
                  {paper.cscContactName && <InfoRow icon={FaUser} label="CSC Contact" value={paper.cscContactName} />}
                  {paper.cscContactEmail && <InfoRow icon={FaEnvelope} label="CSC Contact Email" value={paper.cscContactEmail} />}
                  {paper.cscComments && (
                    <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 mt-2">
                      <p className="text-xs text-teal-700">{paper.cscComments}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <FaClock /> Pending endorsement
                </div>
              )}
            </div>

            {/* Completeness Status */}
            {(paper.completenessVerifiedAt || paper.completenessIssues?.length > 0 || paper.status === "returned_for_correction") && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaClipboardCheck className="text-amber-500" /> Administrative Completeness
                </h3>
                {paper.completenessVerifiedAt ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                    <FaCheckCircle /> Verified on {fmt(paper.completenessVerifiedAt)}
                  </div>
                ) : paper.completenessIssues?.length > 0 ? (
                  <div>
                    <p className="text-xs text-orange-600 font-semibold mb-2">Returned — issues to address:</p>
                    <ul className="space-y-1">
                      {paper.completenessIssues.map((issue, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-orange-400 mt-0.5">•</span> {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {/* Decision Letters */}
            {decisionLetters.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaFileAlt className="text-blue-500" /> Decision Letters
                </h3>
                <div className="space-y-2">
                  {decisionLetters.map((letter, i) => (
                    <div key={letter.id || i} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-xs font-bold text-blue-800">{letter.letterNumber || `Letter #${i + 1}`}</p>
                        <p className="text-[10px] text-blue-600">{fmt(letter.issuedAt)}</p>
                      </div>
                      {letter.decision && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DECISION_META[letter.decision]?.cls || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {DECISION_META[letter.decision]?.label || letter.decision}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents on file */}
            {(paper.proposalFile || paper.fileUrl) && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaFilePdf className="text-red-500" /> Documents
                </h3>
                {paper.proposalFile && (
                  <a
                    href={resolveUrl(paper.proposalFile)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 hover:bg-green-100 transition-colors"
                  >
                    <FaFilePdf className="text-green-600" />
                    <div>
                      <p className="text-xs font-semibold text-green-800">Proposal Document</p>
                      <p className="text-[10px] text-green-600">Click to open PDF</p>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Continuing-review supporting documents. Was previously
                never rendered on this page, even though the backend
                already returns them as `progressFiles`. */}
            {Array.isArray(paper.progressFiles) && paper.progressFiles.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaFilePdf className="text-red-500" /> Continuing Review Documents
                </h3>
                <div className="space-y-2">
                  {paper.progressFiles.map((f, i) => (
                    <a
                      key={f.key || f.url || i}
                      href={resolveUrl(f.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 hover:bg-green-100 transition-colors"
                    >
                      <FaFilePdf className="text-green-600" />
                      <div>
                        <p className="text-xs font-semibold text-green-800">{f.label || `Document ${i + 1}`}</p>
                        <p className="text-[10px] text-green-600">Click to open PDF</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaHistory className="text-gray-400" /> Timeline
              </h3>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between"><span>Created</span><span className="text-gray-700 font-medium">{fmtFull(paper.createdAt)}</span></div>
                <div className="flex justify-between"><span>Last Updated</span><span className="text-gray-700 font-medium">{fmtFull(paper.updatedAt)}</span></div>
                {paper.submittedAt && <div className="flex justify-between"><span>Submitted</span><span className="text-gray-700 font-medium">{fmtFull(paper.submittedAt)}</span></div>}
                {paper.approvedAt && <div className="flex justify-between"><span>Approved</span><span className="text-gray-700 font-medium">{fmtFull(paper.approvedAt)}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────── */
/*  Review Pipeline visual                                           */
/* ────────────────────────────────────────────────────────────────── */

const PIPELINE_STAGES = [
  { key: "submitted",  label: "Submitted",  statuses: ["submitted", "returned_for_correction"] },
  { key: "reviewing",  label: "Reviewing",  statuses: ["pending", "under_review"] },
  { key: "committee",  label: "Committee",  statuses: ["pending_committee_review"] },
  { key: "officer",    label: "Officer Release", statuses: ["pending_officer_review"] },
  { key: "outcome",    label: "Outcome",    statuses: ["approved", "rejected", "revision_requested", "suspended"] },
];

const ReviewPipeline = ({ status, totalReviewers, submittedReviewers }) => {
  const activeIdx = PIPELINE_STAGES.findIndex((s) => s.statuses.includes(status));
  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STAGES.map((stg, i) => {
        const isActive = i === activeIdx;
        const isPast = i < activeIdx;
        const isFuture = i > activeIdx;
        return (
          <React.Fragment key={stg.key}>
            {i > 0 && (
              <div className={`flex-1 h-0.5 ${isPast || isActive ? "bg-blue-400" : "bg-gray-200"}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${isActive ? "bg-blue-600 text-white ring-4 ring-blue-100" : isPast ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"}`}
              >
                {isPast ? <FaCheckCircle /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold text-center whitespace-nowrap ${isActive ? "text-blue-700" : isPast ? "text-blue-500" : "text-gray-400"}`}>
                {stg.label}
              </span>
              {stg.key === "reviewing" && totalReviewers > 0 && (
                <span className="text-[9px] text-gray-400">{submittedReviewers}/{totalReviewers}</span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────── */
/*  Reviewer Card (shows one reviewer + their feedback)              */
/* ────────────────────────────────────────────────────────────────── */

const ReviewerCard = ({ assignment, index }) => {
  const [expanded, setExpanded] = useState(false);
  const reviewer = assignment.reviewer || {};
  const review = assignment.review;
  const isPending = assignment.reviewStatus === "pending" && !review;
  const decision = review?.decision;
  const decMeta = DECISION_META[decision] || null;
  const criteria = review?.criteria || {};
  const criteriaEntries = Object.entries(criteria);
  const avgScore = criteriaEntries.length > 0
    ? (criteriaEntries.reduce((sum, [, v]) => sum + (Number(v) || 0), 0) / criteriaEntries.length).toFixed(1)
    : null;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isPending ? "border-gray-200" : "border-gray-100"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${isPending ? "bg-gray-300" : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}>
            {reviewer.name?.charAt(0)?.toUpperCase() || (index + 1)}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {reviewer.name || `${reviewer.firstName || ""} ${reviewer.lastName || ""}`.trim() || `Reviewer ${index + 1}`}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {reviewer.email && (
                <span className="text-[10px] text-gray-400 truncate">{reviewer.email}</span>
              )}
              {reviewer.institution && (
                <span className="text-[10px] text-gray-400 truncate flex items-center gap-0.5">
                  <FaUniversity className="text-[8px]" /> {reviewer.institution}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {avgScore && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              <FaStar className="text-[10px]" /> {avgScore}
            </span>
          )}
          {isPending ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
              <FaClock className="text-[8px]" /> Pending
            </span>
          ) : decMeta ? (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${decMeta.cls}`}>
              {decMeta.label}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">Submitted</span>
          )}
          {expanded ? <FaChevronUp className="text-gray-300 text-[10px]" /> : <FaChevronDown className="text-gray-300 text-[10px]" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          {isPending ? (
            <div className="text-center py-4">
              <FaClock className="text-gray-300 text-2xl mx-auto mb-2" />
              <p className="text-sm text-gray-400">Review not yet submitted</p>
              {assignment.assignedAt && (
                <p className="text-[10px] text-gray-300 mt-1">Assigned {fmt(assignment.assignedAt)}</p>
              )}
            </div>
          ) : (
            <>
              {/* Criteria Scores */}
              {criteriaEntries.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Evaluation Criteria</p>
                  <div className="space-y-1.5">
                    {criteriaEntries.map(([key, score]) => (
                      <CriteriaBar key={key} label={key} score={Number(score) || 0} />
                    ))}
                  </div>
                </div>
              )}

              {/* Comment */}
              {review?.comment && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Reviewer Comment</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              )}

              {/* Attachments (Chair's change #6) */}
              {review?.attachments?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Attachments</p>
                  <div className="space-y-1">
                    {review.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={resolveUrl(att.url || att)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                      >
                        <FaFileAlt className="text-[10px]" /> {att.label || `Attachment ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {review?.submittedAt && (
                <p className="text-[10px] text-gray-300">Submitted {fmtFull(review.submittedAt)}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────── */
/*  Decision Report Section (Chair's §6.1/§6.8)                      */
/*  RO can edit and release from here                                */
/* ────────────────────────────────────────────────────────────────── */

const DecisionReportSection = ({ report, researchId, onRefresh }) => {
  const [draftComment, setDraftComment] = useState(report?.committeeComment || "");
  const [draftDecision, setDraftDecision] = useState(report?.finalDecision || "");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    setDraftComment(report?.committeeComment || "");
    setDraftDecision(report?.finalDecision || "");
  }, [report]);

  if (!report) return null;

  const isReleased = Boolean(report.releasedAt);

  const handleSave = async () => {
    setSaving(true);
    try {
      await research.updateDecisionReport(researchId, report.id, {
        committeeComment: draftComment,
        ...(draftDecision ? { finalDecision: draftDecision } : {}),
        ...(attachmentFile ? { officerAttachmentFile: attachmentFile } : {}),
      });
      setAttachmentFile(null);
      notify.success("Draft saved.");
      onRefresh();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  };

  const handleRelease = async () => {
    if (!draftDecision) return notify.error("Set a final decision before releasing.");
    const meta = DECISION_META[draftDecision];
    if (!window.confirm(`Release as "${meta?.label || draftDecision}"? The researcher will receive the compiled report and decision letter. This cannot be undone.`)) return;
    setReleasing(true);
    try {
      await research.updateDecisionReport(researchId, report.id, {
        committeeComment: draftComment,
        finalDecision: draftDecision,
        ...(attachmentFile ? { officerAttachmentFile: attachmentFile } : {}),
      });
      await research.releaseDecisionReport(researchId, report.id);
      notify.success("Decision released to researcher.");
      onRefresh();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to release.");
    } finally { setReleasing(false); }
  };

  return (
    <Section title="Compiled Decision Report" icon={FaClipboardCheck} badge={isReleased ? "Released" : "Draft"} badgeColor={isReleased ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
      <div className="space-y-4 pt-3">
        {isReleased && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <FaCheckCircle className="text-green-600 shrink-0" />
            <p className="text-xs text-green-700">Released {fmt(report.releasedAt)} — visible to the researcher.</p>
          </div>
        )}

        {/* Identity-redacted reviewer feedback */}
        {report.reviewerComments?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <FaLock className="text-[8px]" /> Reviewer feedback (identity-redacted)
            </p>
            <div className="space-y-2">
              {report.reviewerComments.map((c, i) => {
                const meta = DECISION_META[c.decision];
                return (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">Reviewer {i + 1}</span>
                      {meta && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>{meta.label}</span>}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{c.comment}</p>
                    {c.criteria && Object.keys(c.criteria).length > 0 && (
                      <div className="flex flex-wrap gap-x-3 mt-2 pt-2 border-t border-gray-100">
                        {Object.entries(c.criteria).map(([k, s]) => (
                          <span key={k} className="text-[10px] text-gray-400">{k}: <span className="font-semibold text-gray-600">{s}/10</span></span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Officer's compiled report */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5">
            <FaEdit className="text-[8px]" /> Officer's Compiled Report
            {!isReleased && <span className="normal-case font-normal text-gray-300">— this is the full report the researcher will see</span>}
          </label>
          <textarea
            rows={10}
            value={draftComment}
            onChange={(e) => setDraftComment(e.target.value)}
            disabled={isReleased || saving || releasing}
            maxLength={50000}
            placeholder="Write the full compiled report here. This text will appear in the decision letter and on the researcher's feedback tab…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-y min-h-[180px] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all disabled:bg-gray-50 disabled:text-gray-400"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-300">Included in the decision letter PDF</span>
            <span className="text-[10px] text-gray-400">{draftComment.length.toLocaleString()} chars</span>
          </div>
        </div>

        {/* File attachment */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5">
            <FaPaperclip className="text-[8px]" /> Attach Supporting Document
            <span className="normal-case font-normal text-gray-300">— merged into the decision letter PDF</span>
          </label>
          {report?.officerAttachment && !attachmentFile && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-2">
              <FaFilePdf className="text-blue-600 text-sm" />
              <span className="text-xs text-blue-700 font-semibold">Attached: {report.officerAttachment.split("/").pop()}</span>
            </div>
          )}
          {!isReleased && (
            <label className="flex flex-col items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-colors text-center">
              <FaCloudUploadAlt className="text-lg text-gray-400" />
              <span className="text-xs font-semibold text-gray-600">
                {attachmentFile ? attachmentFile.name : "Click to upload PDF"}
              </span>
              <span className="text-[10px] text-gray-400">PDF only · appended to the decision letter</span>
              <input type="file" accept=".pdf" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} disabled={saving || releasing} className="hidden" />
            </label>
          )}
        </div>

        {/* Final decision selector */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Final Decision</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(DECISION_META).map(([val, meta]) => (
              <button
                key={val}
                type="button"
                disabled={isReleased || saving || releasing}
                onClick={() => setDraftDecision(val)}
                className={`px-2.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50
                  ${draftDecision === val ? `${meta.cls} ring-2 ring-offset-1 ring-blue-400` : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {!isReleased && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || releasing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave className="text-xs" />} Save draft
            </button>
            <button
              onClick={handleRelease}
              disabled={saving || releasing || !draftDecision}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {releasing ? <FaSpinner className="animate-spin" /> : <FaPaperPlane className="text-xs" />} Release to researcher
            </button>
          </div>
        )}

        <p className="text-[9px] text-gray-300 flex items-center gap-1">
          <FaLock className="text-[8px]" /> Reviewer and committee identities are never shown to the researcher.
        </p>
      </div>
    </Section>
  );
};

export default AdminResearchDetail;

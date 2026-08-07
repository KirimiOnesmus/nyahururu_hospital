import { useState, useEffect, useCallback } from "react";
import notify from "../../../common/utils/notify";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaChevronDown,
  FaShieldAlt,
  FaSpinner,
  FaFileAlt,
} from "react-icons/fa";
import * as research from "../../../api/research";
import { ASSET_BASE_URL } from "../../../config/env";
import { useParams, useNavigate } from "react-router-dom";

const DECISION_OPTIONS = [
  { value: "approved", label: "Approve Submission" },
  { value: "revision", label: "Return to Reviewer (Request Revisions)" },
  { value: "rejected", label: "Reject" },
];

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";


const getReviewCriteria = (rv) => {
  const c = rv?.scores || rv?.criteria;
  return c && typeof c === "object" ? c : null;
};

const averageOf = (values) =>
  values.length
    ? Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1))
    : null;

const computeLiveAggregate = (reviews) => {
  const perReviewerAverages = reviews
    .map((rv) => {
      const criteria = getReviewCriteria(rv);
      if (!criteria) return null;
      const values = Object.values(criteria).filter(
        (v) => typeof v === "number" && !Number.isNaN(v),
      );
      return averageOf(values);
    })
    .filter((v) => v !== null);

  return {
    score: averageOf(perReviewerAverages),
    reviewerCount: perReviewerAverages.length,
  };
};

const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const MetricCell = ({ label, children, border }) => (
  <div
    className={`flex-1 px-6 py-4 ${border ? "border-l border-slate-200" : ""}`}
  >
    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
      {label}
    </p>
    {children}
  </div>
);


const ComplianceItem = ({ label, met, onToggle }) => {
  const cfg =
    met === true
      ? {
          label: "PASSED",
          cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
          iconCls: "text-emerald-500",
          Icon: FaCheckCircle,
        }
      : met === false
        ? {
            label: "MISSING",
            cls: "bg-red-50 text-red-700 border-red-200",
            iconCls: "text-red-500",
            Icon: FaTimesCircle,
          }
        : {
            label: "N/A",
            cls: "bg-slate-100 text-slate-600 border-slate-200",
            iconCls: "text-slate-400",
            Icon: FaInfoCircle,
          };
  const { Icon } = cfg;
  return (
    <div
      onClick={onToggle}
      className={`flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white ${onToggle ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`text-sm shrink-0 ${cfg.iconCls}`} />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <span
        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.cls}`}
      >
        {cfg.label}
      </span>
    </div>
  );
};

const AuditStep = ({ label, datetime, isCurrent }) => (
  <div className="flex items-start gap-3">
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5
      ${isCurrent ? "bg-cyan-100 border-2 border-cyan-500" : "bg-blue-900"}`}
    >
      {isCurrent ? (
        <span className="w-2 h-2 rounded-full bg-cyan-500" />
      ) : (
        <FaCheckCircle className="text-white text-[10px]" />
      )}
    </div>
    <div>
      <p
        className={`text-sm font-bold ${isCurrent ? "text-blue-900" : "text-slate-800"}`}
      >
        {label}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{datetime}</p>
    </div>
  </div>
);

const CommitteeSignOff = ({ recordId: recordIdProp, onBack: onBackProp }) => {
  const [detail, setDetail] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState("approved");
  const [comment, setComment] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteStatus, setVoteStatus] = useState(null); 
  const [compliance, setCompliance] = useState([]);

  const { id } = useParams();
  const navigate = useNavigate();
  const recordId = recordIdProp ?? id;
  const onBack = onBackProp ?? (() => navigate(-1));

  const load = useCallback(async () => {
    if (!recordId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [detailRes, timelineRes, reviewHistory] = await Promise.all([
        research.getResearchDetail(recordId),
        research.getRecordTimeline(recordId).catch(() => ({ timeline: [] })),
        research.getReviewHistory(recordId).catch(() => []),
      ]);
      setDetail(detailRes.paper || detailRes);
      setTimeline(timelineRes.timeline || []);
      const reviewList = Array.isArray(reviewHistory) ? reviewHistory : (reviewHistory?.reviews ?? []);
      setReviews(reviewList);

      // If the research has moved past committee review, show finalized state
      const paper = detailRes.paper || detailRes;
      const postCommitteeStatuses = ["pending_officer_review", "approved", "rejected", "suspended", "revision_requested"];
      if (paper.status && postCommitteeStatuses.includes(paper.status)) {
        setVoteStatus({ finalized: true, votesReceived: "—", votesRequired: "—", votesMax: "—" });
      }
    } catch {
      notify.error("Failed to load sign-off details");
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  // Initialize compliance checklist — pre-fill based on what the reviewer approved
  useEffect(() => {
    if (!detail) return;
    const r = detail;
    const snapshot = r.proposalReview || {};
    const finalDecision = snapshot.decision ?? r.reviewDecisionRaw ?? r.reviewDecision;
    const rvApproved = String(finalDecision || "").toLowerCase() === "approved";
    const sub = r.closureReport || r.continuingReviewData || {};

    const initial = rvApproved
      ? [
          { label: "Ethics Approval Document", met: true },
          { label: "Conflict of Interest Declared", met: true },
          { label: "Plagiarism Report Provided", met: true },
          { label: "Assigned Reviewer Recommended Approval", met: true },
        ]
      : [
          { label: "Ethics Approval Document", met: !!sub.supportingFiles?.ethicsApproval },
          { label: "Conflict of Interest Declared", met: sub.declarations?.conflictOfInterestDeclared === true },
          { label: "Plagiarism Report Provided", met: !!sub.plagiarismReportLink },
          { label: "Assigned Reviewer Recommended Approval", met: false },
        ];
    setCompliance(initial);
  }, [detail]);

  const toggleCompliance = (index) => {
    setCompliance((prev) =>
      prev.map((item, i) => i === index ? { ...item, met: !item.met } : item)
    );
  };

  const handleSubmitVote = async () => {
    if (!authorized) {
      notify.error(
        "Please confirm formal authorization before casting your vote",
      );
      return;
    }
    if (!comment.trim()) {
      notify.error("Please add a remark explaining your decision");
      return;
    }
    setSubmitting(true);
    try {
      const result = await research.submitCommitteeReview(
        detail.id,
        {
          decision,
          comment,
        },
      );

      if (result?.finalized) {
        notify.success(
          `Quorum reached (${result.votesReceived}/${result.votesMax}). Final outcome recorded.`,
        );
        if (onBack) onBack();
      } else {
        setVoteStatus(result);
        notify.success(
          `Vote recorded — ${result?.votesReceived ?? "?"} of ${result?.votesRequired ?? "?"} required votes cast so far.`,
        );
        setAuthorized(false);
        setComment("");
        load(); 
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "";
      if (status === 409 || msg.toLowerCase().includes("already voted")) {
        setVoteStatus({ finalized: false, votesReceived: "?", votesRequired: "?", votesMax: "?", alreadyVoted: true });
        notify.error("You have already cast your vote for this round.");
      } else {
        notify.error(msg || "Failed to submit committee vote");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner label="Loading sign-off details…" />;

  if (!detail && !recordId) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 text-sm">
          No record selected for sign-off.
        </p>
      </div>
    );
  }

  const r = detail || {};
  const submission = r.closureReport || r.continuingReviewData || {};


  const snapshot = r.proposalReview || {};
  const isSubmission = true; 

  const { score: liveAggregateScore, reviewerCount } =
    computeLiveAggregate(reviews);

  const finalReview = {
    decision:
      snapshot.decision ??
      (isSubmission
        ? (r.reviewDecisionRaw ?? r.reviewDecision)
        : undefined),
    comment:
      snapshot.comment ?? (isSubmission ? r.reviewComment : undefined),

    computedAvg:
      snapshot.computedAvg ??
      liveAggregateScore ??
      (isSubmission ? r.aggregateScore : undefined),
    reviewedAt:
      snapshot.reviewedAt ?? (isSubmission ? r.reviewedAt : undefined),
    reviewedBy: snapshot.reviewedBy ?? r.reviewedBy,
  };

  const reviewerApproved = (() => {
    const r2 = detail || {};
    const sn = r2.proposalReview || {};
    const dec = sn.decision ?? r2.reviewDecisionRaw ?? r2.reviewDecision;
    return String(dec || "").toLowerCase() === "approved";
  })();

  const auditTrail = timeline.length
    ? timeline.map((t, i) => ({
        label: t.stageLabel,
        datetime: fmtDateTime(t.submittedAt),
        isCurrent: i === timeline.length - 1,
      }))
    : [
        {
          label: "Awaiting Final Sign-off",
          datetime: "No committee activity recorded yet",
          isCurrent: true,
        },
      ];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer"
      >
        <FaArrowLeft className="text-xs" /> Back to Reviews
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Committee Sign-off
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-sm font-bold text-blue-900">
              {r.researchId || "—"}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-sm text-slate-600">{r.title}</span>
            {r.researcher && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-sm text-slate-600">
                  {r.researcher.name || "—"}
                </span>
                {r.researcher.email && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm text-slate-400">
                      {r.researcher.email}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {voteStatus && !voteStatus.finalized && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            {voteStatus.votesReceived}/{voteStatus.votesRequired} committee votes
            cast — quorum requires {voteStatus.votesRequired} (up to {voteStatus.votesMax})
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-base">
                Assigned Reviewer Summary
              </h2>
              {reviewerApproved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                  <FaCheckCircle className="text-[10px]" /> Peer Review
                  Validated
                </span>
              )}
            </div>

            <div className="flex divide-x divide-slate-200 border-b border-slate-100">
              <MetricCell label="Aggregate Score">
                <p className="text-3xl font-bold text-slate-900">
                  {typeof finalReview.computedAvg === "number"
                    ? finalReview.computedAvg.toFixed(1)
                    : "—"}
                  <span className="text-base font-semibold text-slate-400">
                    /10
                  </span>
                </p>
                {reviewerCount > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    From {reviewerCount} reviewer
                    {reviewerCount > 1 ? "s'" : "'s"} submitted scores
                  </p>
                )}
              </MetricCell>
              <MetricCell label="Reviewer Decision" border>
                <p className="text-2xl font-bold text-blue-900 capitalize">
                  {finalReview.decision || "—"}
                </p>
              </MetricCell>
              <MetricCell label="Reviewed At" border>
                <p className="text-lg font-bold text-slate-900">
                  {fmtDateTime(finalReview.reviewedAt)}
                </p>
              </MetricCell>
            </div>

            <div className="px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Reviewer Final Comment
              </p>
              <blockquote className="border-l-4 border-slate-300 pl-4 italic text-sm text-slate-600 leading-relaxed">
                {finalReview.comment ||
                  "No comment recorded by the assigned reviewer."}
              </blockquote>

              {finalReview.reviewedBy && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-900">
                      {(finalReview.reviewedBy.name ||
                        finalReview.reviewedBy.firstName ||
                        "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {finalReview.reviewedBy.name ||
                        `${finalReview.reviewedBy.firstName || ""} ${finalReview.reviewedBy.lastName || ""}`.trim() ||
                        "Reviewer"}
                    </p>
                    {finalReview.reviewedBy.email && (
                      <p className="text-xs text-slate-400">
                        {finalReview.reviewedBy.email}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>


          {reviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-base">
                  All Reviewer Assessments ({reviews.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full comments and scores from each assigned reviewer.
                </p>
              </div>
              <div className="px-6 py-4 space-y-4">
                {reviews.map((rv, i) => {
                  const revName = rv.reviewerName || rv.reviewer?.name || `Reviewer ${i + 1}`;
                  const revEmail = rv.reviewer?.email;
                  const rec = rv.recommendation || rv.decision;
                  const isApprove = ["approved", "highly_recommended", "approve"].includes(rec);
                  const criteria = getReviewCriteria(rv);
                  return (
                    <div key={rv.id || i} className="border-l-2 border-blue-900 bg-slate-50/60 rounded-r-xl pl-4 pr-4 py-4">
                      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {revName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{revName}</p>
                            {revEmail && <p className="text-xs text-slate-400">{revEmail}</p>}
                            <p className="text-xs text-slate-500">
                              {fmtDateTime(rv.submittedAt || rv.reviewedAt || rv.createdAt)}
                            </p>
                          </div>
                        </div>
                        {rec && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border
                            ${isApprove ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                            {isApprove ? "Approve" : rec.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      {criteria && Object.keys(criteria).length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                          {Object.entries(criteria).map(([key, val]) => (
                            <div key={key} className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{key.replace(/_/g, " ")}</p>
                              <p className="text-sm font-bold text-slate-800">{Number(val).toFixed(1)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {(rv.comments || rv.comment) && (
                        <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-2 mt-1">{rv.comments || rv.comment}</p>
                      )}
                      {Array.isArray(rv.attachments) && rv.attachments.length > 0 && (
                        <div className="border-t border-slate-200 pt-2 mt-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                            Reviewer Attachments
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {rv.attachments.map((att, ai) => {
                              const url = att.url || att;
                              const label = att.label || `Attachment ${ai + 1}`;
                              const token = localStorage.getItem("token");
                              const fullUrl = url.startsWith("http") ? url : `${ASSET_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
                              const authUrl = token && fullUrl.includes("/uploads/")
                                ? `${fullUrl}${fullUrl.includes("?") ? "&" : "?"}token=${token}`
                                : fullUrl;
                              return (
                                <a
                                  key={ai}
                                  href={authUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                  <FaFileAlt className="text-[10px]" /> {label}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(r.abstract || r.methodology || r.objectives) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-bold text-slate-900 text-base">Research Content</h2>
              {r.abstract && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Abstract</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{r.abstract}</p>
                </div>
              )}
              {r.methodology && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Methodology</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{r.methodology}</p>
                </div>
              )}
              {r.objectives && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Objectives</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {Array.isArray(r.objectives) ? r.objectives.join("; ") : r.objectives}
                  </p>
                </div>
              )}
              {r.proposalFile && (() => {
                const token = localStorage.getItem("token");
                const base = r.proposalFile.startsWith("http") ? r.proposalFile : `${ASSET_BASE_URL}${r.proposalFile.startsWith("/") ? "" : "/"}${r.proposalFile}`;
                const url = token && base.includes("/uploads/")
                  ? `${base}${base.includes("?") ? "&" : "?"}token=${token}`
                  : base;
                return (
                <div className="flex items-center justify-between py-3 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-800">Proposal Document</span>
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:underline">
                    View / Download
                  </a>
                </div>
                );
              })()}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {voteStatus ? (
              voteStatus.finalized ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <FaCheckCircle className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-blue-800">Committee Review Complete</p>
                    <p className="text-xs text-blue-700 mt-1">
                      The committee quorum has been reached and the decision has been finalized.
                      This submission is now awaiting the Research Officer's review and release.
                    </p>
                  </div>
                </div>
                {/* Show all committee votes cast */}
                {reviews.filter((r) => r.reviewerRole === "committee").length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Committee Votes Cast</p>
                    <div className="space-y-2">
                      {reviews.filter((r) => r.reviewerRole === "committee").map((rv, i) => {
                        const isApprove = ["approved", "approve"].includes(rv.decision);
                        return (
                          <div key={rv.id || i} className="border border-slate-100 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-600">
                                {rv.reviewer?.name || rv.reviewerName || `Member ${i + 1}`}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isApprove ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                {rv.decision?.replace(/_/g, " ")}
                              </span>
                            </div>
                            {(rv.comment || rv.comments) && (
                              <p className="text-xs text-slate-500 mt-1">{rv.comment || rv.comments}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Show final outcome if paper status indicates it */}
                {r.status && r.status !== "pending_committee_review" && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 font-semibold">Final Outcome</p>
                    <p className="text-sm font-bold text-slate-800 capitalize mt-0.5">
                      {r.status.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
              </div>
              ) : voteStatus.alreadyVoted ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <FaCheckCircle className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">You Already Voted</p>
                  <p className="text-xs text-amber-700 mt-1">
                    You have already cast your committee vote for this round.
                    The outcome will be finalized once quorum is reached.
                  </p>
                </div>
              </div>
              ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 mb-4">
                  <FaCheckCircle className="text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Vote Submitted</p>
                    <p className="text-xs text-green-700 mt-1">
                      Your committee vote has been recorded. {voteStatus.votesReceived} of {voteStatus.votesRequired} required votes have been cast so far.
                      The outcome will be finalized once quorum is reached.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">You can close this page — no further action is needed from you.</p>
              </>
              )
            ) : (
            <>
            <h2 className="font-bold text-slate-900 text-lg mb-1">
              Cast Your Committee Vote
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Final-paper sign-off requires a quorum (minimum 3, maximum 5) of
              committee votes. Your vote is recorded individually and counted
              toward the outcome.
            </p>

            <div className="grid sm:grid-cols-1 gap-4 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Your Decision
                </label>
                <div className="relative">
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 pr-9 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {DECISION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Remarks (required)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Explain the basis for your decision…"
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                id="formalAuth"
                checked={authorized}
                onChange={(e) => setAuthorized(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-500 cursor-pointer shrink-0"
              />
              <label
                htmlFor="formalAuth"
                className="text-sm text-slate-700 leading-relaxed cursor-pointer"
              >
                <span className="font-bold">Formal Authorization:</span> I
                certify that I have personally reviewed this manuscript and am
                casting my vote as a member of the Research Committee.
              </label>
            </div>

            <button
              type="button"
              onClick={handleSubmitVote}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {submitting ? (
                <FaSpinner className="animate-spin text-xs" />
              ) : (
                <FaShieldAlt className="text-xs" />
              )}
              Submit Committee Vote
            </button>
            </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Compliance Checklist
            </h2>
            <p className="text-[10px] text-slate-400 mb-4">Click an item to toggle its status.</p>
            <div className="space-y-2.5">
              {compliance.map((item, index) => (
                <ComplianceItem
                  key={item.label}
                  label={item.label}
                  met={item.met}
                  onToggle={() => toggleCompliance(index)}
                />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">
              System Audit Trail
            </h2>
            <div className="space-y-5">
              {auditTrail.map((step, i) => (
                <AuditStep
                  key={i}
                  label={step.label}
                  datetime={step.datetime}
                  isCurrent={step.isCurrent}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeSignOff;
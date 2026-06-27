import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaChevronDown,
  FaShieldAlt,
  FaSpinner,
} from "react-icons/fa";
import * as research from "../../../api/research";
import { useParams, useNavigate } from "react-router-dom";

const DECISION_OPTIONS = [
  { value: "approved", label: "Approve for Publication" },
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

// Compliance item now driven by a real boolean/undefined value, not a hardcoded label
const ComplianceItem = ({ label, met }) => {
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
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white">
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
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState("approved");
  const [comment, setComment] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteStatus, setVoteStatus] = useState(null); // { finalized, votesReceived, votesRequired, votesMax }

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
      const [detailRes, timelineRes] = await Promise.all([
        research.getResearchDetail(recordId),
        research.getRecordTimeline(recordId).catch(() => ({ timeline: [] })),
      ]);
      setDetail(detailRes.paper || detailRes);
      setTimeline(timelineRes.timeline || []);
    } catch {
      toast.error("Failed to load sign-off details");
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmitVote = async () => {
    if (!authorized) {
      toast.error(
        "Please confirm formal authorization before casting your vote",
      );
      return;
    }
    if (!comment.trim()) {
      toast.error("Please add a remark explaining your decision");
      return;
    }
    setSubmitting(true);
    try {
      const result = await research.submitCommitteeReview(
        detail._id || detail.id,
        {
          decision,
          comment,
        },
      );

      if (result?.finalized) {
        toast.success(
          `Quorum reached (${result.votesReceived}/${result.votesMax}). Final outcome recorded.`,
        );
        if (onBack) onBack();
      } else {
        setVoteStatus(result);
        toast.success(
          `Vote recorded — ${result?.votesReceived ?? "?"} of ${result?.votesRequired ?? "?"} required votes cast so far.`,
        );
        setAuthorized(false);
        setComment("");
        load(); // refresh timeline with the new vote
      }
    } catch (err) {
      toast.error(err?.message || "Failed to submit committee vote");
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
  const submission = r.finalPaperSubmission || {};

  // Prefer snapshot; fall back to flat fields (guaranteed when stage === "final_paper")
  const snapshot = r.finalPaperReview || {};
  const isFinalPaperStage = r.stage === "final_paper";

  const finalReview = {
    decision:
      snapshot.decision ??
      (isFinalPaperStage
        ? (r.reviewDecisionRaw ?? r.reviewDecision)
        : undefined),
    comment:
      snapshot.comment ?? (isFinalPaperStage ? r.reviewComment : undefined),
    aggregateScore:
      snapshot.aggregateScore ??
      (isFinalPaperStage ? r.aggregateScore : undefined),
    reviewedAt:
      snapshot.reviewedAt ?? (isFinalPaperStage ? r.reviewedAt : undefined),
    reviewedBy: snapshot.reviewedBy ?? r.reviewedBy,
  };

  const reviewerApproved =
    String(finalReview.decision || "").toLowerCase() === "approved";

  const compliance = reviewerApproved
    ? [
        { label: "Ethics Approval Document", met: true },
        { label: "Conflict of Interest Declared", met: true },
        { label: "Plagiarism Report Provided", met: true },
        { label: "Assigned Reviewer Recommended Approval", met: true },
      ]
    : [
        {
          label: "Ethics Approval Document",
          met: !!submission.supportingFiles?.ethicsApproval,
        },
        {
          label: "Conflict of Interest Declared",
          met: submission.declarations?.conflictOfInterestDeclared === true,
        },
        {
          label: "Plagiarism Report Provided",
          met: !!submission.plagiarismReportLink,
        },
        { label: "Assigned Reviewer Recommended Approval", met: false },
      ];
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
            Final Committee Sign-off
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
            {voteStatus.votesReceived}/{voteStatus.votesMax} committee votes
            cast — quorum requires {voteStatus.votesRequired}
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
                  {typeof finalReview.aggregateScore === "number"
                    ? finalReview.aggregateScore.toFixed(1)
                    : "—"}
                  <span className="text-base font-semibold text-slate-400">
                    /10
                  </span>
                </p>
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

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Compliance Checklist
            </h2>
            <div className="space-y-2.5">
              {compliance.map((item) => (
                <ComplianceItem
                  key={item.label}
                  label={item.label}
                  met={item.met}
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

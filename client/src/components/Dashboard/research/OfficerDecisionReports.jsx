import { useEffect, useState, useCallback } from "react";
import {
  FaClipboardCheck, FaUser, FaUniversity, FaChevronRight, FaTimes,
  FaSave, FaPaperPlane, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaHashtag, FaHistory, FaEdit, FaLock, FaCloudUploadAlt, FaPaperclip, FaFilePdf,
} from "react-icons/fa";
import notify from "../../../common/utils/notify";
import * as research from "../../../api/research";

const DECISION_OPTIONS = [
  { value: "approved", label: "Approved", color: "text-green-700 bg-green-50 border-green-200" },
  { value: "revision", label: "Revision Requested", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "rejected", label: "Rejected", color: "text-red-700 bg-red-50 border-red-200" },
  { value: "suspended", label: "Suspended", color: "text-orange-700 bg-orange-50 border-orange-200" },
];

const decisionMeta = (value) =>
  DECISION_OPTIONS.find((d) => d.value === value) || {
    label: value || "Not set",
    color: "text-gray-500 bg-gray-50 border-gray-200",
  };

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

const SUBMISSION_TYPE_LABELS = {
  initial_proposal: "Initial Proposal",
  amendment: "Amendment",
  continuing_review: "Continuing Review",
  study_closure: "Study Closure",
};

const QueueRow = ({ item, active, onClick }) => {
  const hasDraft = Boolean(item.report);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-gray-100 transition-colors cursor-pointer
        ${active ? "bg-blue-50 border-l-4 border-l-blue-600" : "hover:bg-gray-50 border-l-4 border-l-transparent"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {SUBMISSION_TYPE_LABELS[item.submissionType] || item.submissionType}
            </span>
            {item.seruNumber && (
              <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-0.5">
                <FaHashtag className="text-[8px]" /> {item.seruNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <FaUser className="text-[10px]" /> {item.researcher?.name || "Unknown researcher"}
          </p>
        </div>
        <FaChevronRight className="text-gray-300 text-xs shrink-0 mt-1" />
      </div>
      <div className="mt-2">
        {hasDraft ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            <FaClipboardCheck className="text-[9px]" /> Draft ready to compile
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            <FaExclamationTriangle className="text-[9px]" /> No report yet
          </span>
        )}
      </div>
    </button>
  );
};

const ReviewerCommentCard = ({ comment, index }) => {
  const meta = decisionMeta(comment.decision);
  return (
    <div className="rounded-xl border border-gray-200 p-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Reviewer {index + 1} <span className="normal-case font-normal text-gray-300">(identity withheld)</span>
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
          {meta.label}
        </span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{comment.comment}</p>
      {comment.criteria && Object.keys(comment.criteria).length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-gray-100">
          {Object.entries(comment.criteria).map(([key, score]) => (
            <span key={key} className="text-[10px] text-gray-400">
              {key}: <span className="font-semibold text-gray-600">{score}/10</span>
            </span>
          ))}
        </div>
      )}
      {comment.submittedAt && (
        <p className="text-[10px] text-gray-300 mt-2">Submitted {fmt(comment.submittedAt)}</p>
      )}
    </div>
  );
};

const OfficerDecisionReports = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [draftComment, setDraftComment] = useState("");
  const [draftDecision, setDraftDecision] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const { records } = await research.getOfficerQueue({ limit: 50 });
      setQueue(records || []);
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to load officer queue");
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const selected = queue.find((q) => q.id === selectedId) || null;

  const openItem = async (item) => {
    setSelectedId(item.id);
    setReport(null);
    if (!item.report) return;
    setReportLoading(true);
    try {
      const full = await research.getDecisionReport(item.id);
      setReport(full);
      setDraftComment(full?.committeeComment || "");
      setDraftDecision(full?.finalDecision || "");
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to load decision report");
    } finally {
      setReportLoading(false);
    }
  };

  const closePanel = () => {
    setSelectedId(null);
    setReport(null);
  };

  const handleSaveDraft = async () => {
    if (!selected?.report) return;
    setSaving(true);
    try {
      const updates = {
        committeeComment: draftComment,
        ...(draftDecision ? { finalDecision: draftDecision } : {}),
        ...(attachmentFile ? { officerAttachmentFile: attachmentFile } : {}),
      };
      const updated = await research.updateDecisionReport(selected.id, selected.report.id, updates);
      setReport(updated);
      setAttachmentFile(null);
      notify.success("Draft saved.");
      fetchQueue();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async () => {
    if (!selected?.report) return;
    if (!draftDecision) {
      notify.error("Set a final decision before releasing.");
      return;
    }
    const meta = decisionMeta(draftDecision);
    if (
      !window.confirm(
        `Release this decision as "${meta.label}"? The researcher will immediately receive the compiled ` +
          `report and a decision-letter email. This cannot be undone.`,
      )
    ) {
      return;
    }
    setReleasing(true);
    try {
      // Persist any unsaved edits first so release reflects the latest text.
      const updates = {
        committeeComment: draftComment,
        finalDecision: draftDecision,
        ...(attachmentFile ? { officerAttachmentFile: attachmentFile } : {}),
      };
      await research.updateDecisionReport(selected.id, selected.report.id, updates);
      await research.releaseDecisionReport(selected.id, selected.report.id);
      notify.success("Decision released to researcher.");
      closePanel();
      fetchQueue();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to release decision");
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Awaiting Officer Release</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Compiled after committee quorum · confidential until released
            </p>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
            {queue.length}
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-400 mt-3 text-xs">Loading queue…</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-10 text-center">
            <FaClipboardCheck className="text-3xl text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Nothing awaiting release right now.</p>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            {queue.map((item) => (
              <QueueRow
                key={item.id}
                item={item}
                active={item.id === selectedId}
                onClick={() => openItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100">
        {!selected ? (
          <div className="p-16 text-center">
            <FaClipboardCheck className="text-4xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Select a submission on the left to compile or release its decision report.
            </p>
          </div>
        ) : reportLoading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : !selected.report ? (
          <div className="p-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selected.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{selected.researcher?.name}</p>
              </div>
              <button onClick={closePanel} className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <FaTimes className="text-gray-400" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">
                No draft Compiled Decision Report exists yet for this submission. It is auto-drafted the
                moment the committee reaches quorum — check back once committee voting completes.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{selected.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1"><FaUser className="text-[10px]" /> {selected.researcher?.name}</span>
                  {selected.researcher?.institution && (
                    <span className="flex items-center gap-1"><FaUniversity className="text-[10px]" /> {selected.researcher.institution}</span>
                  )}
                  {selected.seruNumber && (
                    <span className="flex items-center gap-1"><FaHashtag className="text-[10px]" /> {selected.seruNumber}</span>
                  )}
                </div>
              </div>
              <button onClick={closePanel} className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer shrink-0">
                <FaTimes className="text-gray-400" />
              </button>
            </div>

            {report?.releasedAt && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <FaCheckCircle className="text-green-600 shrink-0" />
                <p className="text-xs text-green-700">
                  Released {fmt(report.releasedAt)} — this report is now final and visible to the researcher.
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                <FaHistory className="text-[10px]" /> Reviewer feedback (identity-redacted)
              </p>
              {(report?.reviewerComments || []).length === 0 ? (
                <p className="text-xs text-gray-400 italic">No reviewer comments recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {report.reviewerComments.map((c, i) => (
                    <ReviewerCommentCard key={i} comment={c} index={i} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <FaEdit className="text-[10px]" /> Officer's Compiled Report
                <span className="normal-case font-normal text-gray-300">— this is the full report the researcher will see</span>
              </label>
              <textarea
                rows={12}
                value={draftComment}
                onChange={(e) => setDraftComment(e.target.value)}
                disabled={Boolean(report?.releasedAt) || saving || releasing}
                maxLength={50000}
                placeholder="Write the full compiled report here. This text will appear in the decision letter and on the researcher's feedback tab. Include all relevant committee and reviewer feedback in your own words…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none
                  resize-y min-h-[200px] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all
                  disabled:bg-gray-50 disabled:text-gray-400"
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-300">This commentary will be included in the decision letter PDF</span>
                <span className="text-[10px] text-gray-400">{draftComment.length.toLocaleString()} characters</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <FaPaperclip className="text-[10px]" /> Attach Supporting Document
                <span className="normal-case font-normal text-gray-300">— will be merged into the decision letter PDF</span>
              </label>
              {report?.officerAttachment && !attachmentFile && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <FaFilePdf className="text-blue-600 text-sm" />
                  <span className="text-xs text-blue-700 font-semibold">File already attached</span>
                  <span className="text-[10px] text-blue-500">{report.officerAttachment.split("/").pop()}</span>
                </div>
              )}
              {!report?.releasedAt && (
                <label className="flex flex-col items-center justify-center gap-1.5 px-3.5 py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-colors text-center">
                  <FaCloudUploadAlt className="text-xl text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">
                    {attachmentFile ? attachmentFile.name : "Click to upload a PDF document"}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    PDF only · this file will be appended to the decision letter
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                    disabled={saving || releasing}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Final decision
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DECISION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={Boolean(report?.releasedAt) || saving || releasing}
                    onClick={() => setDraftDecision(opt.value)}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50
                      ${draftDecision === opt.value
                        ? `${opt.color} ring-2 ring-offset-1 ring-blue-400`
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!report?.releasedAt && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || releasing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border
                    border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 cursor-pointer
                    transition-colors disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave className="text-xs" />}
                  Save draft
                </button>
                <button
                  onClick={handleRelease}
                  disabled={saving || releasing || !draftDecision}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                    bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!draftDecision ? "Set a final decision first" : "Release to researcher"}
                >
                  {releasing ? <FaSpinner className="animate-spin" /> : <FaPaperPlane className="text-xs" />}
                  Release to researcher
                </button>
              </div>
            )}

            <p className="text-[10px] text-gray-300 flex items-center gap-1.5 pt-1">
              <FaLock className="text-[9px]" />
              Reviewer and committee identities are never shown here or anywhere the researcher can see —
              this compiled version is the only thing they will ever receive.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDecisionReports;

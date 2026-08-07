import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import notify from "../../../common/utils/notify";
import * as research from "../../../api/research";
import {
  FaClipboardCheck, FaPaperPlane, FaSpinner, FaArrowLeft, FaSearch,
  FaExclamationTriangle,
} from "react-icons/fa";

const inputCls = "w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelCls = "block text-sm font-semibold text-slate-700 mb-1";
const sectionCls = "bg-white rounded-xl border border-slate-200 p-6 space-y-5";

const SubmitContinuingReview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reviseId = searchParams.get("revise");
  const isRevise = Boolean(reviseId);

  const [loading, setLoading] = useState(false);
  const [fetchingParent, setFetchingParent] = useState(true);
  const [eligibleResearch, setEligibleResearch] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [files, setFiles] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);
  const [form, setForm] = useState({
    progressSummary: "",
    participantsEnrolled: "",
    participantsContinuing: "",
    adverseEvents: "",
    amendments: "",
    constraints: "",
    plansForNextYear: "",
    isLastYear: false,
  });

  const fetchEligible = useCallback(async () => {
    try {
      setFetchingParent(true);
      const res = await research.getMyResearch({ submissionType: "initial_proposal", limit: 100 });
      // A study already has a continuing review "in flight" if any of its
      // child CRs is still moving through review. Those must not appear as
      // eligible for a new continuing review until the current one is resolved.
      const IN_FLIGHT = [
        "submitted",
        "under_review",
        "pending_committee_review",
        "revision_requested",
        "returned_for_correction",
      ];
      const hasActiveCR = (p) =>
        Array.isArray(p.childSubmissions) &&
        p.childSubmissions.some(
          (c) => c.submissionType === "continuing_review" && IN_FLIGHT.includes(c.status),
        );
      const eligible = (res.papers || []).filter(
        (p) => ["approved", "expired"].includes(p.status) && !hasActiveCR(p),
      );
      setEligibleResearch(eligible);
    } catch {
      notify.error("Failed to load your research");
    } finally {
      setFetchingParent(false);
    }
  }, []);

  // Revise mode: load the existing continuing review and auto-fill the form
  // so the researcher edits and resubmits the SAME record.
  const loadForRevision = useCallback(async () => {
    try {
      setFetchingParent(true);
      const cr = await research.getResearchById(reviseId);
      const data = cr?.continuingReviewData || {};
      setForm({
        progressSummary: data.progressSummary ?? "",
        participantsEnrolled: data.participantsEnrolled ?? "",
        participantsContinuing: data.participantsContinuing ?? "",
        adverseEvents: data.adverseEvents ?? "",
        amendments: data.amendments ?? "",
        constraints: data.constraints ?? "",
        plansForNextYear: data.plansForNextYear ?? "",
        isLastYear: Boolean(data.isLastYear),
      });
      setExistingDocs(Array.isArray(cr?.progressFiles) ? cr.progressFiles : []);
      // Lock the target to this CR; no parent picker in revise mode.
      setSelectedParent({ id: cr.parentResearchId || cr.id, title: cr.title });
    } catch {
      notify.error("Failed to load the continuing review for revision.");
    } finally {
      setFetchingParent(false);
    }
  }, [reviseId]);

  useEffect(() => {
    if (isRevise) loadForRevision();
    else fetchEligible();
  }, [isRevise, loadForRevision, fetchEligible]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map((f) => ({
      label: f.name.split(".")[0],
      file: f,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const isExpiringSoon = (paper) => {
    if (!paper.approvalValidUntil) return false;
    const daysLeft = (new Date(paper.approvalValidUntil) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 30 && daysLeft > 0;
  };

  const isExpired = (paper) => {
    if (!paper.approvalValidUntil) return false;
    return new Date(paper.approvalValidUntil) < new Date();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedParent) return notify.error("Select the research for continuing review.");
    if (!form.progressSummary.trim()) return notify.error("Progress summary is required.");
    // On a fresh submission at least one document is required; on a revision
    // the originally-uploaded documents are kept unless new ones are attached.
    if (!isRevise && files.length === 0)
      return notify.error("Upload at least one supporting document (e.g. annual progress report).");

    try {
      setLoading(true);
      if (isRevise) {
        await research.resubmitContinuingReview(reviseId, form, files);
        notify.success("Continuing review revised and resubmitted successfully!");
      } else {
        await research.submitContinuingReview(
          { ...form, parentResearchId: selectedParent.id },
          files,
        );
        notify.success("Continuing review submitted successfully!");
      }
      navigate("/research/dashboard");
    } catch (err) {
      notify.error(err.message || "Failed to submit continuing review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="  space-y-6">
      <div className="flex items-center gap-3">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isRevise ? "Revise Continuing Review" : "Continuing Review Report"}
          </h1>
          <p className="text-sm text-slate-500">
            {isRevise
              ? "Edit the fields the committee flagged and resubmit — this updates the same submission."
              : "Submit annual progress report for approval renewal (SERU Type B)"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {!isRevise && (
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FaSearch className="text-blue-500" /> Select Research
          </h2>

          {fetchingParent ? (
            <div className="flex items-center gap-2 text-slate-400 py-4">
             <FaSpinner className="animate-spin" /> Loading…
            </div>
          ) : eligibleResearch.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              No approved or expired research available for continuing review.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {eligibleResearch.map((paper) => (
                <button key={paper.id} type="button"
                  onClick={() => setSelectedParent(paper)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedParent?.id === paper.id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-slate-800">{paper.title}</p>
                    <div className="flex items-center gap-1.5">
                      {isExpired(paper) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Expired</span>
                      )}
                      {isExpiringSoon(paper) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold flex items-center gap-1">
                          <FaExclamationTriangle className="text-[10px]" /> Expiring soon
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {paper.researchId || paper.seruNumber || `ID: ${paper.id}`}
                    {paper.approvalValidUntil && ` · Approval expires ${new Date(paper.approvalValidUntil).toLocaleDateString("en-KE")}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
        )}

        {selectedParent && (
          <>
    
            <div className={sectionCls}>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FaClipboardCheck className="text-green-500" /> Progress Report
              </h2>

              <div>
                <label className={labelCls}>Research Progress Summary *</label>
                <textarea name="progressSummary" value={form.progressSummary} onChange={handleChange}
                  className={`${inputCls} h-32`} required
                  placeholder="Describe progress, key findings, achievements during the reporting period…" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Participants Enrolled</label>
                  <input type="number" name="participantsEnrolled" value={form.participantsEnrolled}
                    onChange={handleChange} className={inputCls} placeholder="Total enrolled" />
                </div>
                <div>
                  <label className={labelCls}>Participants Continuing</label>
                  <input type="number" name="participantsContinuing" value={form.participantsContinuing}
                    onChange={handleChange} className={inputCls} placeholder="Currently active" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Adverse Events</label>
                <textarea name="adverseEvents" value={form.adverseEvents} onChange={handleChange}
                  className={inputCls} rows={3}
                  placeholder="Report any adverse events, severity, and how they were handled…" />
              </div>

              <div>
                <label className={labelCls}>Amendments During Period</label>
                <textarea name="amendments" value={form.amendments} onChange={handleChange}
                  className={inputCls} rows={2}
                  placeholder="List any amendments made and approved during this period…" />
              </div>

              <div>
                <label className={labelCls}>Constraints</label>
                <textarea name="constraints" value={form.constraints} onChange={handleChange}
                  className={inputCls} rows={2}
                  placeholder="Funding, personnel, logistical constraints experienced…" />
              </div>

              <div>
                <label className={labelCls}>Plans for Next Project Year</label>
                <textarea name="plansForNextYear" value={form.plansForNextYear} onChange={handleChange}
                  className={inputCls} rows={3}
                  placeholder="Activities planned for the coming year…" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isLastYear" checked={form.isLastYear}
                  onChange={handleChange}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-700">This is the last project year</span>
              </label>
            </div>

  
            <div className={sectionCls}>
              <h2 className="text-lg font-semibold text-slate-800">
                Supporting Documents{isRevise ? "" : " *"}
              </h2>
              <p className="text-xs text-slate-500">
                {isRevise
                  ? "Your previously uploaded documents are kept. Attach new files only if you need to replace them."
                  : "At least one document is required — attach the annual progress report (and any publications or other supporting files)."}
              </p>
              {isRevise && existingDocs.length > 0 && (
                <ul className="text-xs text-slate-600 list-disc pl-5 space-y-0.5">
                  {existingDocs.map((d, i) => (
                    <li key={i}>{d.label || d.url?.split("/").pop() || `Document ${i + 1}`}</li>
                  ))}
                </ul>
              )}
              <input type="file" multiple onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {files.length > 0 && (
                <ul className="text-xs text-slate-600 space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded">
                      <span>{f.file.name}</span>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-red-500 hover:text-red-700 text-xs cursor-pointer">Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 cursor-pointer">
              {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              {loading ? "Submitting…" : "Submit Continuing Review"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default SubmitContinuingReview;
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import notify from "../../../common/utils/notify";
import * as research from "../../../api/research";
import {
  FaFileAlt, FaPaperPlane, FaSpinner, FaArrowLeft, FaSearch,
} from "react-icons/fa";

const inputCls = "w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelCls = "block text-sm font-semibold text-slate-700 mb-1";
const sectionCls = "bg-white rounded-xl border border-slate-200 p-6 space-y-5";

const SubmitAmendment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingParent, setFetchingParent] = useState(true);
  const [approvedResearch, setApprovedResearch] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    amendmentDetails: "",
    title: "",
    abstract: "",
    methodology: "",
    objectives: "",
    inclusionCriteria: "",
    exclusionCriteria: "",
    fundingSource: "",
  });

  const fetchApproved = useCallback(async () => {
    try {
      setFetchingParent(true);
      const res = await research.getMyResearch({ submissionType: "initial_proposal", limit: 100 });
      const approved = (res.papers || []).filter(
        (p) => p.status === "revision_requested"
      );
      setApprovedResearch(approved);
    } catch {
      notify.error("Failed to load your approved research");
    } finally {
      setFetchingParent(false);
    }
  }, []);

  useEffect(() => { fetchApproved(); }, [fetchApproved]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const [reviewComment, setReviewComment] = useState("");

  const handleSelectParent = async (paper) => {
    setSelectedParent(paper);
    setReviewComment(paper.reviewComment || "");

    try {
      const full = await research.getResearchById(paper.id);
      if (full) {
        setReviewComment(full.reviewComment || "");
        setForm((prev) => ({
          ...prev,
          title: full.title || "",
          abstract: full.abstract || "",
          methodology: full.methodology || "",
          objectives: full.objectives || "",
          inclusionCriteria: full.inclusionCriteria || "",
          exclusionCriteria: full.exclusionCriteria || "",
          fundingSource: full.fundingSource || "",
        }));
      }
    } catch { /* use defaults */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedParent) return notify.error("Select the research you want to revise.");
    if (!form.amendmentDetails.trim()) return notify.error("Revision details are required.");

    try {
      setLoading(true);
      await research.resubmitResearch(selectedParent.id, form, file);
      notify.success("Revision submitted successfully!");
      navigate("/research/dashboard");
    } catch (err) {
      notify.error(err.message || "Failed to submit revision");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" space-y-6">

      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Submit Revision</h1>
          <p className="text-sm text-slate-500">
            Address reviewer feedback and resubmit your research for re-evaluation
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FaSearch className="text-blue-500" /> Select Research to Revise
          </h2>

          {fetchingParent ? (
            <div className="flex items-center gap-2 text-slate-400 py-4">
              <FaSpinner className="animate-spin" /> Loading research needing revision…
            </div>
          ) : approvedResearch.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              No research currently needs revision. Revisions can only be submitted for research with a "Revision Requested" status.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {approvedResearch.map((paper) => (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() => handleSelectParent(paper)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedParent?.id === paper.id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium text-sm text-slate-800">{paper.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {paper.researchId || paper.seruNumber || `ID: ${paper.id}`}
                    {paper.approvalValidUntil && ` · Valid until ${new Date(paper.approvalValidUntil).toLocaleDateString("en-KE")}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedParent && (
          <>
            {reviewComment && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-1">
                  Reviewer Feedback — Address This
                </p>
                <p className="text-sm text-red-800 leading-relaxed">{reviewComment}</p>
              </div>
            )}

            <div className={sectionCls}>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FaFileAlt className="text-amber-500" /> Revision Details
              </h2>

              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Describe the changes you've made in response to the reviewer's feedback. Update the relevant sections below.
              </p>

              <div>
                <label className={labelCls}>What has been revised? *</label>
                <textarea name="amendmentDetails" value={form.amendmentDetails} onChange={handleChange}
                  className={`${inputCls} h-32`} required
                  placeholder="Describe the specific changes made in response to reviewer feedback…" />
              </div>
            </div>

    
            <div className={sectionCls}>
              <h2 className="text-lg font-semibold text-slate-800">Updated Sections</h2>
              <p className="text-xs text-slate-500">Only fill sections that are changing. Pre-filled from your original submission.</p>

              {[
                { name: "title", label: "Title (if changing)" },
                { name: "abstract", label: "Abstract", rows: 4 },
                { name: "objectives", label: "Objectives", rows: 3 },
                { name: "methodology", label: "Methodology", rows: 4 },
                { name: "inclusionCriteria", label: "Inclusion Criteria", rows: 2 },
                { name: "exclusionCriteria", label: "Exclusion Criteria", rows: 2 },
                { name: "fundingSource", label: "Funding Source" },
              ].map(({ name, label, rows }) => (
                <div key={name}>
                  <label className={labelCls}>{label}</label>
                  {rows ? (
                    <textarea name={name} value={form[name]} onChange={handleChange}
                      className={`${inputCls}`} rows={rows} />
                  ) : (
                    <input name={name} value={form[name]} onChange={handleChange} className={inputCls} />
                  )}
                </div>
              ))}
            </div>

 
            <div className={sectionCls}>
              <h2 className="text-lg font-semibold text-slate-800">Revised Document</h2>
              <input type="file" accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
              {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              {loading ? "Submitting…" : "Submit Revision"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default SubmitAmendment;
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import notify from "../../../common/utils/notify";
import * as research from "../../../api/research";
import {
  FaArchive, FaPaperPlane, FaSpinner, FaArrowLeft, FaSearch,
} from "react-icons/fa";

const inputCls = "w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelCls = "block text-sm font-semibold text-slate-700 mb-1";
const sectionCls = "bg-white rounded-xl border border-slate-200 p-6 space-y-5";

const CLOSURE_REASONS = [
  { value: "completed", label: "Study completed as described in protocol" },
  { value: "premature_discontinuation", label: "Permanent premature discontinuation" },
  { value: "not_started", label: "Study was not started / stopped before first enrolment" },
  { value: "transferred", label: "Study transferred to another institution" },
];

const SubmitStudyClosure = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingParent, setFetchingParent] = useState(true);
  const [approvedResearch, setApprovedResearch] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [form, setForm] = useState({
    closureReason: "",
    resultsSummary: "",
    publications: "",
    participantIdentifiersDestroyed: false,
    specimenDisposalPlan: "",
    dataFutureUsePlan: "",
    investigationalProductDisposal: "",
    publicationLink: "",
  });


  const [attestations, setAttestations] = useState({
    noActiveParticipants: false,
    noOutstandingAdverseEvents: false,
    noAmendmentsPending: false,
    noCrrPending: false,
    noDeviationsUnresolved: false,
    allDataCollected: false,
  });
  const [closeoutFile, setCloseoutFile] = useState(null);

  const fetchApproved = useCallback(async () => {
    try {
      setFetchingParent(true);
      const res = await research.getMyResearch({ submissionType: "initial_proposal", limit: 100 });

      const hasClosure = (p) =>
        Array.isArray(p.childSubmissions) &&
        p.childSubmissions.some((c) => c.submissionType === "study_closure");
      const approved = (res.papers || []).filter(
        (p) => p.status === "approved" && !hasClosure(p),
      );
      setApprovedResearch(approved);
    } catch {
      notify.error("Failed to load your research");
    } finally {
      setFetchingParent(false);
    }
  }, []);

  useEffect(() => { fetchApproved(); }, [fetchApproved]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const ATTESTATIONS = [
    { key: "noActiveParticipants", label: "No participants are still actively receiving study interventions" },
    { key: "noOutstandingAdverseEvents", label: "No outstanding adverse events require follow-up" },
    { key: "noAmendmentsPending", label: "No amendments are pending review" },
    { key: "noCrrPending", label: "No continuing review report is pending" },
    { key: "noDeviationsUnresolved", label: "No unresolved protocol deviations exist" },
    { key: "allDataCollected", label: "All data collection for the study objectives is complete" },
  ];

  const handleAttestation = (key) =>
    setAttestations((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedParent) return notify.error("Select the research to close.");
    if (!form.closureReason) return notify.error("Closure reason is required.");
    if (!form.resultsSummary.trim()) return notify.error("Results summary is required.");

    if (form.closureReason === "completed" && !closeoutFile) {
      return notify.error("A closeout report file is required when the reason is 'Completed'.");
    }

    const missing = ATTESTATIONS.filter((a) => !attestations[a.key]);
    if (missing.length) {
      return notify.error("Please confirm all closure conditions before submitting.");
    }

    try {
      setLoading(true);
      await research.submitStudyClosure(
        {
          ...form,
          parentResearchId: selectedParent.id,
          closureAttestations: attestations,
        },
        closeoutFile,
      );
      notify.success("Study closure report submitted successfully!");
      navigate("/research/dashboard");
    } catch (err) {
      notify.error(err.message || "Failed to submit closure report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">Study Closure Report</h1>
          <p className="text-sm text-slate-500">
            Request closure of an approved study (SERU Type A)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FaSearch className="text-blue-500" /> Select Research to Close
          </h2>
          {fetchingParent ? (
            <div className="flex items-center gap-2 text-slate-400 py-4">
              <FaSpinner className="animate-spin" /> Loading…
            </div>
          ) : approvedResearch.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No approved research available for closure.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {approvedResearch.map((paper) => (
                <button key={paper.id} type="button"
                  onClick={() => setSelectedParent(paper)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedParent?.id === paper.id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}>
                  <p className="font-medium text-sm text-slate-800">{paper.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {paper.researchId || paper.seruNumber || `ID: ${paper.id}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedParent && (
          <>
      
            <div className={sectionCls}>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FaArchive className="text-red-500" /> Closure Details
              </h2>

              <div>
                <label className={labelCls}>Reason for Closure *</label>
                <select name="closureReason" value={form.closureReason} onChange={handleChange}
                  className={inputCls} required>
                  <option value="">Select reason…</option>
                  {CLOSURE_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Summary of Results *</label>
                <textarea name="resultsSummary" value={form.resultsSummary} onChange={handleChange}
                  className={`${inputCls} h-32`} required
                  placeholder="Summarize the results, even if only for the locally enrolled cohort…" />
              </div>

              <div>
                <label className={labelCls}>Publications Arising from Study</label>
                <textarea name="publications" value={form.publications} onChange={handleChange}
                  className={inputCls} rows={3}
                  placeholder="List publications, abstracts, reports from this study…" />
              </div>
            </div>

   
            <div className={sectionCls}>
              <h2 className="text-lg font-semibold text-slate-800">Data & Specimen Disposition</h2>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="participantIdentifiersDestroyed"
                  checked={form.participantIdentifiersDestroyed} onChange={handleChange}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-700">
                  Participant identifiers have been destroyed (blacked out names in screening/enrolment logs)
                </span>
              </label>

              <div>
                <label className={labelCls}>Plan for Future Use of Data</label>
                <textarea name="dataFutureUsePlan" value={form.dataFutureUsePlan} onChange={handleChange}
                  className={inputCls} rows={3}
                  placeholder="How will de-identified data be used or stored after closure?" />
              </div>

              <div>
                <label className={labelCls}>Biological Specimen Disposal Plan</label>
                <textarea name="specimenDisposalPlan" value={form.specimenDisposalPlan} onChange={handleChange}
                  className={inputCls} rows={3}
                  placeholder="Plan for destruction, storage, or future use of specimens (include numbers)…" />
              </div>

              <div>
                <label className={labelCls}>Investigational Product Disposal</label>
                <textarea name="investigationalProductDisposal" value={form.investigationalProductDisposal}
                  onChange={handleChange} className={inputCls} rows={2}
                  placeholder="If applicable, describe disposal of surplus investigational agents…" />
              </div>
            </div>

            <div className={sectionCls}>
              <h2 className="text-lg font-semibold text-slate-800">Closeout Report</h2>
              <div>
                <label className={labelCls}>
                  Closeout Report File{form.closureReason === "completed" ? " *" : " (optional)"}
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.csv,.xls,.xlsx,.zip"
                  onChange={(e) => setCloseoutFile(e.target.files?.[0] || null)}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Required when closing a study as “completed”. PDF, DOCX, CSV, XLS/XLSX or ZIP.
                </p>
                {closeoutFile && (
                  <p className="mt-1 text-xs text-emerald-600">Selected: {closeoutFile.name}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Publication Link (optional)</label>
                <input name="publicationLink" type="url" value={form.publicationLink}
                  onChange={handleChange} className={inputCls}
                  placeholder="https://doi.org/…" />
              </div>
            </div>

            <div className={sectionCls}>
              <h2 className="text-lg font-semibold text-slate-800">Closure Conditions (SOP-4)</h2>
              <p className="text-sm text-slate-500">
                Confirm each condition below. All must be met for the committee to accept the closure.
              </p>
              <div className="space-y-2">
                {ATTESTATIONS.map((a) => (
                  <label key={a.key} className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={attestations[a.key]}
                      onChange={() => handleAttestation(a.key)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">{a.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 cursor-pointer">
              {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              {loading ? "Submitting…" : "Submit Closure Report"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default SubmitStudyClosure;
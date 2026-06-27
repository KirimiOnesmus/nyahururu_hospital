import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaCircle,
  FaFlask,
  FaUsers,
  FaChartBar,
  FaShieldAlt,
  FaCloudUploadAlt,
  FaFilePdf,
  FaDatabase,
  FaChartLine,
  FaFileAlt,
  FaMicroscope,
  FaClock,
  FaExclamationTriangle,
  FaSave,
  FaPaperPlane,
  FaEye,
  FaTrash,
  FaInfoCircle,
} from "react-icons/fa";
import {
  getResearchById,
  saveProgressDraft,
  submitProgressReport,
} from "../../api/research";

//  Constants
const STUDY_DESIGN_OPTIONS = [
  "In Design",
  "In Implementation",
  "Data Collection Complete",
  "Analysis Phase",
  "Writing Phase",
];

const ANALYSIS_TOOLS = [
  "SPSS",
  "R",
  "Stata",
  "Python (SciPy/Pandas)",
  "SAS",
  "Excel",
  "GraphPad Prism",
  "MATLAB",
  "Other",
];

const UPLOAD_SLOTS = [
  {
    key: "draftManuscript",
    label: "Draft Manuscript",
    icon: FaFilePdf,
    accept: ".pdf,.docx",
    hint: "PDF, DOCX · Max 20 MB",
    required: true, 
  },
  {
    key: "datasets",
    label: "Datasets",
    icon: FaDatabase,
    accept: ".csv,.xlsx,.sav",
    hint: "CSV, XLSX, SAV · Max 50 MB",
    required: true,
  },
  {
    key: "statisticalOutputs",
    label: "Statistical Outputs",
    icon: FaChartLine,
    accept: ".pdf,.png,.jpg",
    hint: "PDF, Images · Max 20 MB",
    required: true,
  },
  {
    key: "surveyTools",
    label: "Survey Tools",
    icon: FaFileAlt,
    accept: ".pdf,.docx",
    hint: "PDF, DOCX · Max 10 MB",
    required: false,
  },
  {
    key: "interviewGuides",
    label: "Interview Guides",
    icon: FaMicroscope,
    accept: ".pdf,.docx",
    hint: "PDF, DOCX · Max 10 MB",
    required: false,
  },
  {
    key: "supportingDocuments",
    label: "Supporting Documents",
    icon: FaFileAlt,
    accept: ".pdf,.docx,.zip",
    hint: "PDF, DOCX, ZIP · Max 30 MB",
    required: false,
  },
];

const CHECKLIST_ITEMS = [
  { key: "methodologyDone", label: "Methodology Updates" },
  { key: "sampleSizeDone", label: "Sample Size Update" },
  { key: "findingsDone", label: "Research Findings Detail" },
  { key: "ethicsDone", label: "Ethics & Deviation Report" },
  { key: "uploadsDone", label: "Required Files Uploaded" },
];

const UPLOAD_SLOT_KEYS = UPLOAD_SLOTS.map((s) => s.key);

//  Shared class strings
const labelCls =
  "text-xs font-semibold uppercase tracking-widest text-slate-500";

const inputCls = `w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800
   placeholder-slate-400 text-sm outline-none bg-white
   focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all`;

const textareaCls = `${inputCls} resize-none`;

const selectCls = `w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800
   text-sm outline-none bg-white cursor-pointer
   focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none`;

//  Micro building blocks
const Spinner = ({ size = 4, color = "border-t-blue-600" }) => (
  <div
    className={`w-${size} h-${size} border-2 border-slate-200 ${color} rounded-full animate-spin`}
  />
);

const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className={labelCls}>
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs">{error}</p>}
  </div>
);

//  Stage progress stepper
const STAGES = ["Proposal", "Progress", "Final"];

const StageStepper = ({ current = 1 }) => (
  <div className="flex items-center gap-0 mb-6">
    {STAGES.map((stage, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <div key={stage} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center
                text-sm font-bold border-2 transition-colors
                ${done ? "bg-blue-600 border-blue-600 text-white" : ""}
                ${active ? "bg-teal-600 border-teal-600 text-white" : ""}
                ${!done && !active ? "bg-white border-slate-300 text-slate-400" : ""}`}
            >
              {done ? <FaCheckCircle className="text-sm" /> : i + 1}
            </div>
            <span
              className={`text-xs font-semibold mt-1.5 tracking-wide
                ${active ? "text-teal-700" : ""}
                ${done ? "text-blue-600" : ""}
                ${!done && !active ? "text-slate-400" : ""}`}
            >
              {stage}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors
                ${done ? "bg-blue-500" : "bg-slate-200"}`}
            />
          )}
        </div>
      );
    })}
  </div>
);

//  Section card wrapper
const SectionCard = ({
  icon: Icon,
  title,
  accent = "blue",
  children,
  className = "",
}) => {
  const iconBg = {
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
    teal: "bg-teal-100 text-teal-600",
    amber: "bg-amber-100 text-amber-600",
  };
  return (
    <div
      className={`bg-white rounded-2xl border p-6 flex flex-col gap-5
        ${accent === "red" ? "border-red-200" : "border-slate-200"} ${className}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg[accent]}`}
        >
          <Icon className="text-sm" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">{title}</h3>
      </div>
      {children}
    </div>
  );
};

//  Upload slot
const UploadSlot = ({ slot, file, existingUrl, onChange, onRemove }) => {
  const { icon: Icon, label, accept, hint, required } = slot;
  const inputRef = useRef();

  const displayName =
    file?.name || (existingUrl ? existingUrl.split("/").pop() : null);
  const hasSomething = !!file || !!existingUrl;

  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {!required && (
          <span className="text-slate-400 font-normal normal-case tracking-normal ml-1">
            (optional)
          </span>
        )}
      </label>

      {!hasSomething ? (
        <label
          className="flex flex-col items-center justify-center gap-2 border-2
            border-dashed border-slate-200 rounded-xl px-4 py-5 cursor-pointer
            hover:border-blue-300 hover:bg-blue-50/30 transition-all text-sm text-slate-400"
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files[0];
              if (f) onChange(f);
            }}
          />
          <Icon className="text-2xl text-slate-300" />
          <div className="text-center">
            <p className="font-semibold text-slate-500 text-xs">
              Click to upload
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
          </div>
        </label>
      ) : (
        <div
          className="flex items-center gap-3 border border-green-200 bg-green-50
            rounded-xl px-4 py-2.5 text-sm"
        >
          <FaCheckCircle className="text-green-500 shrink-0" />
          <span className="flex-1 text-slate-800 truncate font-medium text-xs">
            {displayName}
            {!file && existingUrl && (
              <span className="text-slate-400 font-normal ml-1">(saved)</span>
            )}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove file"
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded cursor-pointer"
          >
            <FaTrash className="text-xs" />
          </button>
        </div>
      )}
    </div>
  );
};

//  Sidebar checklist
const ProgressSidebar = ({
  checklist,
  savingDraft,
  submitting,
  onSaveDraft,
  onSubmit,
  onViewProposal,
}) => {
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const allComplete = completedCount === CHECKLIST_ITEMS.length;

  return (
    <aside className="w-64 shrink-0 sticky top-6 flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Submission Status
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <p className="font-bold text-slate-900 text-sm leading-tight">
              Drafting Progress Report
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Completion Checklist
          </p>
          <ul className="flex flex-col gap-1.5">
            {CHECKLIST_ITEMS.map(({ key, label }) => (
              <li key={key} className="flex items-center gap-2">
                {checklist[key] ? (
                  <FaCheckCircle className="text-teal-500 shrink-0 text-sm" />
                ) : (
                  <FaCircle className="text-slate-200 shrink-0 text-sm" />
                )}
                <span
                  className={`text-xs ${
                    checklist[key]
                      ? "text-slate-700 font-medium"
                      : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{
                width: `${(completedCount / CHECKLIST_ITEMS.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {completedCount} of {CHECKLIST_ITEMS.length} sections complete
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <FaClock className="text-blue-500 text-xs shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
            Review Timeline
          </p>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed">
          Once submitted, your progress report will be reviewed by the IRB
          within <span className="font-bold">7 working days</span>.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-4 text-white flex flex-col gap-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Data Integrity Rating
        </p>
        <p
          className={`text-lg font-bold ${
            allComplete
              ? "text-teal-400"
              : completedCount > 2
                ? "text-amber-400"
                : "text-red-400"
          }`}
        >
          {allComplete
            ? "High Confidence"
            : completedCount > 2
              ? "Moderate"
              : "Incomplete"}
        </p>
        <p className="text-xs text-slate-400">
          {allComplete
            ? "All required sections are filled."
            : "Complete remaining sections to improve rating."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onViewProposal}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
            rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold
            hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <FaEye className="text-xs" /> View Proposal Details
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          disabled={savingDraft || submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
            rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold
            hover:border-slate-300 transition-colors cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingDraft ? (
            <>
              <Spinner size={4} /> Saving…
            </>
          ) : (
            <>
              <FaSave className="text-xs" /> Save Draft
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || savingDraft}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
            rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold
            transition-colors cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Spinner size={4} color="border-t-white" /> Submitting…
            </>
          ) : (
            <>
              <FaPaperPlane className="text-xs" /> Submit for Progress Review
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

//  Main component
const ResearchProgress = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  //  Form state
  const [form, setForm] = useState({
    methodologyUpdates: "",
    studyDesignStatus: "",
    samplingMethodDetails: "",

    sampleSizeAchieved: "",
    sampleSizeTarget: "",

    preliminaryFindings: "",
    statisticalMethods: "",
    analysisTool: "",
    interviewsCompleted: "",
    surveyResponses: "",
    labSamples: "",

    deviationsFromProtocol: "",
    ethicalIncidents: "",
  });

  const [files, setFiles] = useState({});

  const [existingFiles, setExistingFiles] = useState({});

  const [errors, setErrors] = useState({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  //  Derived checklist
  const checklist = {
    methodologyDone:
      form.methodologyUpdates.trim().length > 20 && !!form.studyDesignStatus,
    sampleSizeDone: !!form.sampleSizeAchieved && !!form.sampleSizeTarget,
    findingsDone: form.preliminaryFindings.trim().length > 20,
    ethicsDone:
      form.deviationsFromProtocol.trim().length > 0 ||
      form.ethicalIncidents.trim().length > 0,
    uploadsDone: ["draftManuscript", "datasets", "statisticalOutputs"].every(
      (k) => !!files[k] || !!existingFiles[k],
    ),
  };

  const samplePercent =
    form.sampleSizeTarget > 0
      ? Math.min(
          100,
          Math.round((form.sampleSizeAchieved / form.sampleSizeTarget) * 100),
        )
      : 0;

  //  Load submission for THIS research id ─
  const load = useCallback(async () => {
    if (!id) {
      setLoadError("No research ID was provided in the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const data = await getResearchById(id);
      const research = data.data?.paper || data.paper || data.research || data;
      setSubmission(research);

      const p = research?.progressData;
      if (p) {
        let counters = {};
        try {
          counters = JSON.parse(p.dataCollectionProgress || "{}");
        } catch {
          counters = {};
        }

        setForm((prev) => ({
          ...prev,
          methodologyUpdates: p.methodology || "",
          studyDesignStatus: p.studyDesign || "",
          samplingMethodDetails: p.samplingMethod || "",
          sampleSizeAchieved: p.sampleSizeAchieved ?? "",
          sampleSizeTarget: p.sampleSizeTarget ?? "",
          preliminaryFindings: p.preliminaryFindings || "",
          statisticalMethods: p.statisticalMethods || "",
          analysisTool: p.analysisTools || "",
          deviationsFromProtocol: p.deviationsFromProtocol || "",
          ethicalIncidents: p.ethicalIncidents || "",
          interviewsCompleted: counters.interviewsCompleted ?? "",
          surveyResponses: counters.surveyResponses ?? "",
          labSamples: counters.labSamples ?? "",
        }));
      }

      if (Array.isArray(research?.progressFiles)) {
        const map = {};
        research.progressFiles.forEach((f) => {
          if (UPLOAD_SLOT_KEYS.includes(f.label)) {
            map[f.label] = f.url;
          }
        });
        setExistingFiles(map);
      }
    } catch (err) {
      setLoadError(err.message || "Failed to load submission");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  //  Helpers
  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const setFile = (k, f) => {
    setFiles((p) => ({ ...p, [k]: f }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const clearFile = (k) => {
    setFiles((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
    setExistingFiles((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
  };

  const validate = () => {
    const e = {};
    if (!form.methodologyUpdates.trim()) e.methodologyUpdates = "Required";
    if (!form.studyDesignStatus) e.studyDesignStatus = "Required";
    if (!form.sampleSizeAchieved) e.sampleSizeAchieved = "Required";
    if (!form.sampleSizeTarget) e.sampleSizeTarget = "Required";
    if (!form.preliminaryFindings.trim()) e.preliminaryFindings = "Required";
    if (!files.draftManuscript && !existingFiles.draftManuscript)
      e.draftManuscript = "Draft manuscript is required";
    if (!files.datasets && !existingFiles.datasets)
      e.datasets = "Dataset file is required";
    if (!files.statisticalOutputs && !existingFiles.statisticalOutputs)
      e.statisticalOutputs = "Statistical output is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildFields = () => ({
    methodology: form.methodologyUpdates,
    studyDesign: form.studyDesignStatus,
    samplingMethod: form.samplingMethodDetails,
    sampleSizeAchieved: form.sampleSizeAchieved,
    sampleSizeTarget: form.sampleSizeTarget,
    preliminaryFindings: form.preliminaryFindings,
    statisticalMethods: form.statisticalMethods,
    analysisTools: form.analysisTool,
    deviationsFromProtocol: form.deviationsFromProtocol,
    ethicalIncidents: form.ethicalIncidents,
    dataCollectionProgress: JSON.stringify({
      interviewsCompleted: form.interviewsCompleted || 0,
      surveyResponses: form.surveyResponses || 0,
      labSamples: form.labSamples || 0,
    }),
  });

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await saveProgressDraft(id, buildFields(), files);
      toast.success("Draft saved!");
      await load();
    } catch (err) {
      toast.error(err.message || "Could not save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fill all required fields before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await submitProgressReport(id, buildFields(), files);
      toast.success("Progress report submitted for review!");
      navigate("/research/dashboard");
    } catch (err) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div
          className="w-10 h-10 border-4 border-slate-200 border-t-blue-600
          rounded-full animate-spin"
        />
        <p className="text-slate-500 font-medium text-sm">
          Loading submission…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700 max-w-lg mx-auto mt-8">
        <p className="font-bold mb-1">Could not load submission</p>
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/research/dashboard")}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500
          hover:text-blue-600 transition-colors cursor-pointer"
      >
        <FaArrowLeft className="text-xs" /> Back to Dashboard
      </button>

      <StageStepper current={1} />

      <div className="flex items-start justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          {submission?.researchId && (
            <p className="text-xs text-slate-400 font-mono mb-1">
              ID: {submission.researchId}
            </p>
          )}
          <h1 className="text-2xl font-bold text-slate-900 leading-snug">
            {submission?.title || "Research Progress Report"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lead Researcher:{" "}
            <span className="font-medium text-slate-700">
              {submission?.researcher?.name ||
                submission?.leadResearcher ||
                "—"}
            </span>
            {(submission?.researcher?.institution ||
              submission?.department) && (
              <>
                {" "}
                ·{" "}
                {submission?.researcher?.institution || submission?.department}
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/research/dashboard/view/${id}`)}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold
            px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600
            hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <FaEye className="text-[10px]" /> View Proposal Details
        </button>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <SectionCard icon={FaFlask} title="Progress Overview" accent="blue">
            <Field
              label="Methodology Updates"
              required
              error={errors.methodologyUpdates}
            >
              <textarea
                rows={4}
                value={form.methodologyUpdates}
                onChange={(e) => set("methodologyUpdates", e.target.value)}
                placeholder="Describe any technical or methodological shifts since the proposal…"
                className={`${textareaCls} ${errors.methodologyUpdates ? "border-red-400 focus:border-red-400" : ""}`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Study Design Status"
                required
                error={errors.studyDesignStatus}
              >
                <div className="relative">
                  <select
                    value={form.studyDesignStatus}
                    onChange={(e) => set("studyDesignStatus", e.target.value)}
                    className={`${selectCls} ${errors.studyDesignStatus ? "border-red-400" : ""}`}
                  >
                    <option value="">Select status…</option>
                    {STUDY_DESIGN_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Sampling Method Details">
                <input
                  type="text"
                  value={form.samplingMethodDetails}
                  onChange={(e) => set("samplingMethodDetails", e.target.value)}
                  placeholder="e.g. Stratified Random Sampling"
                  className={inputCls}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={FaUsers}
            title="Participant Sample Tracking"
            accent="teal"
          >
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Sample Size Achieved"
                required
                error={errors.sampleSizeAchieved}
              >
                <input
                  type="number"
                  min="0"
                  value={form.sampleSizeAchieved}
                  onChange={(e) => set("sampleSizeAchieved", e.target.value)}
                  placeholder="e.g. 245"
                  className={`${inputCls} ${errors.sampleSizeAchieved ? "border-red-400" : ""}`}
                />
              </Field>
              <Field
                label="Target Sample Size"
                required
                error={errors.sampleSizeTarget}
              >
                <input
                  type="number"
                  min="1"
                  value={form.sampleSizeTarget}
                  onChange={(e) => set("sampleSizeTarget", e.target.value)}
                  placeholder="e.g. 450"
                  className={`${inputCls} ${errors.sampleSizeTarget ? "border-red-400" : ""}`}
                />
              </Field>
            </div>

            {form.sampleSizeTarget > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500 text-xs font-medium">
                    Completion Rate
                  </span>
                  <span className="font-bold text-slate-900 text-xl tabular-nums">
                    {form.sampleSizeAchieved || 0}{" "}
                    <span className="text-slate-400 text-sm font-normal">
                      / {form.sampleSizeTarget}
                    </span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${samplePercent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-slate-400">
                  <span>{samplePercent}% completion rate</span>
                  <span>Target: {form.sampleSizeTarget} enrolled</span>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={FaChartBar}
            title="Research Findings"
            accent="blue"
          >
            <Field
              label="Preliminary Findings"
              required
              error={errors.preliminaryFindings}
            >
              <textarea
                rows={4}
                value={form.preliminaryFindings}
                onChange={(e) => set("preliminaryFindings", e.target.value)}
                placeholder="Enter early observations and data trends…"
                className={`${textareaCls} ${errors.preliminaryFindings ? "border-red-400" : ""}`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Statistical Methods">
                <input
                  type="text"
                  value={form.statisticalMethods}
                  onChange={(e) => set("statisticalMethods", e.target.value)}
                  placeholder="e.g. Chi-square, ANOVA"
                  className={inputCls}
                />
              </Field>

              <Field label="Analysis Tool">
                <select
                  value={form.analysisTool}
                  onChange={(e) => set("analysisTool", e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select tool…</option>
                  {ANALYSIS_TOOLS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <p className={`${labelCls} mb-2`}>Data Collection Progress</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "interviewsCompleted", label: "Interviews Completed" },
                  { key: "surveyResponses", label: "Survey Responses" },
                  { key: "labSamples", label: "Lab Samples" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {label}
                    </p>
                    <input
                      type="number"
                      min="0"
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder="0"
                      className="text-2xl font-bold text-slate-900 bg-transparent outline-none
                        w-full tabular-nums placeholder:text-slate-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={FaShieldAlt}
            title="Protocol Deviations & Ethics"
            accent="red"
          >
            <div
              className="flex items-start gap-2 bg-amber-50 border border-amber-200
              rounded-xl px-4 py-3 text-xs text-amber-800"
            >
              <FaExclamationTriangle className="shrink-0 mt-0.5 text-amber-500" />
              <p className="leading-relaxed">
                Report all deviations from the approved protocol honestly.
                Failure to disclose may result in suspension of study and
                revocation of clearance.
              </p>
            </div>

            <Field label="Deviations from Approved Protocol">
              <textarea
                rows={4}
                value={form.deviationsFromProtocol}
                onChange={(e) => set("deviationsFromProtocol", e.target.value)}
                placeholder="List any changes from the original ethics approval, including justifications…"
                className={textareaCls}
              />
            </Field>

            <Field label="Ethical Incidents / Participant Withdrawals">
              <textarea
                rows={4}
                value={form.ethicalIncidents}
                onChange={(e) => set("ethicalIncidents", e.target.value)}
                placeholder="Report adverse events, safety concerns, or participant withdrawals…"
                className={textareaCls}
              />
            </Field>
          </SectionCard>

          {/* 5. Required Uploads */}
          <SectionCard
            icon={FaCloudUploadAlt}
            title="Required Uploads"
            accent="teal"
          >
            <div
              className="flex items-start gap-2 bg-blue-50 border border-blue-100
              rounded-xl px-4 py-3 text-xs text-blue-800"
            >
              <FaInfoCircle className="shrink-0 mt-0.5 text-blue-500" />
              <p>
                Draft manuscript, datasets, and statistical outputs are required
                for submission. All files are stored encrypted and accessible
                only to assigned reviewers.
              </p>
            </div>

            {/* Required uploads — top 3 */}
            <div>
              <p className={`${labelCls} mb-3`}>Required Files</p>
              <div className="grid grid-cols-3 gap-3">
                {UPLOAD_SLOTS.filter((s) => s.required).map((slot) => (
                  <div key={slot.key}>
                    <UploadSlot
                      slot={slot}
                      file={files[slot.key] || null}
                      existingUrl={existingFiles[slot.key] || null}
                      onChange={(f) => setFile(slot.key, f)}
                      onRemove={() => clearFile(slot.key)}
                    />
                    {errors[slot.key] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[slot.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Optional uploads */}
            <div>
              <p className={`${labelCls} mb-3`}>Optional Supporting Files</p>
              <div className="grid grid-cols-3 gap-3">
                {UPLOAD_SLOTS.filter((s) => !s.required).map((slot) => (
                  <UploadSlot
                    key={slot.key}
                    slot={slot}
                    file={files[slot.key] || null}
                    existingUrl={existingFiles[slot.key] || null}
                    onChange={(f) => setFile(slot.key, f)}
                    onRemove={() => clearFile(slot.key)}
                  />
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Bottom action bar (mobile / narrow) */}
          <div className="flex gap-3 pt-2 pb-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/research/dashboard")}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500
                hover:text-slate-700 transition-colors cursor-pointer"
            >
              <FaArrowLeft className="text-xs" /> Cancel & Return
            </button>

            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200
                  text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors
                  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingDraft ? (
                  <Spinner size={4} />
                ) : (
                  <FaSave className="text-xs" />
                )}
                Save Draft
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || savingDraft}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600
                  hover:bg-teal-700 text-white text-sm font-bold transition-colors
                  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Spinner size={4} color="border-t-white" /> Submitting…
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="text-xs" /> Submit for Progress
                    Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <ProgressSidebar
          checklist={checklist}
          savingDraft={savingDraft}
          submitting={submitting}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onViewProposal={() => navigate(`/research/dashboard/view/${id}`)}
        />
      </div>
    </div>
  );
};

export default ResearchProgress;

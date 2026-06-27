import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaFilePdf,
  FaUpload,
  FaTrash,
  FaInfoCircle,
  FaEye,
  FaHistory,
  FaDatabase,
  FaBook,
  FaChartBar,
  FaShieldAlt,
  FaFileAlt,
  FaSave,
  FaPaperPlane,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaCloudUploadAlt,
  FaTag,
} from "react-icons/fa";
import { getResearchById, submitFinalPaper } from "../../api/research";

const STAGE_STEPS = ["Proposal", "Progress", "Final Paper"];

const SUPPORT_SLOTS = [
  {
    key: "finalDataset",
    label: "Final Dataset",
    subLabel: "CSV, XLSX, ZIP",
    icon: FaDatabase,
    accept: ".csv,.xlsx,.zip",
    required: true,
  },
  {
    key: "dataDictionary",
    label: "Data Dictionary",
    subLabel: "Variables & Metadata",
    icon: FaBook,
    accept: ".pdf,.docx,.xlsx",
    required: false,
  },
  {
    key: "statisticalScripts",
    label: "Statistical Scripts",
    subLabel: "R, STATA, Python",
    icon: FaChartBar,
    accept: ".r,.py,.do,.zip,.txt",
    required: false,
  },
  {
    key: "ethicsApproval",
    label: "Ethics Approval",
    subLabel: "ETH-2024-01-V2.pdf",
    icon: FaShieldAlt,
    accept: ".pdf",
    required: false,
    carriedOver: true,
  },
];

const DECLARATIONS = [
  {
    key: "conflictOfInterest",
    label: "Conflict of Interest Disclosure",
    description:
      "I declare that there are no financial or personal relationships that could influence my professional judgment.",
  },
  {
    key: "aiUsage",
    label: "AI Usage Declaration",
    description:
      "Specify if large language models or generative AI were used in data analysis or drafting.",
    hasTextarea: true,
    textareaKey: "aiUsageDetails",
    textareaPlaceholder: "If yes, please describe the scope of AI assistance…",
  },
];


const labelCls =
  "text-xs font-semibold uppercase tracking-widest text-slate-500";

const inputCls = `w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800
   placeholder-slate-400 text-sm outline-none bg-white
   focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all`;

const textareaCls = `${inputCls} resize-none`;


const Spinner = ({ size = 4, color = "border-t-blue-600" }) => (
  <div
    className={`w-${size} h-${size} border-2 border-slate-200 ${color} rounded-full animate-spin`}
  />
);

const StageStepper = () => (
  <div className="flex items-center gap-0">
    {STAGE_STEPS.map((stage, i) => {
      const done = i < 2;
      const active = i === 2;
      return (
        <div key={stage} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center
                text-xs font-bold border-2 transition-colors
                ${done ? "bg-blue-700 border-blue-700 text-white" : ""}
                ${active ? "bg-blue-700 border-blue-700 text-white" : ""}
                ${!done && !active ? "bg-white border-slate-300 text-slate-400" : ""}`}
            >
              {done ? <FaCheckCircle className="text-xs" /> : 3}
            </div>
            <span
              className={`text-[10px] font-semibold mt-1.5 tracking-wide whitespace-nowrap
                ${active ? "text-blue-700" : done ? "text-blue-600" : "text-slate-400"}`}
            >
              {stage}
            </span>
          </div>
          {i < STAGE_STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors
                ${done ? "bg-blue-600" : "bg-slate-200"}`}
            />
          )}
        </div>
      );
    })}
  </div>
);

//  Section card
const SectionCard = ({
  icon: Icon,
  title,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-600",
  children,
  className = "",
}) => (
  <div
    className={`bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5 ${className}`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <Icon className={`text-sm ${iconColor}`} />
      </div>
      <h3 className="font-bold text-slate-900 text-base">{title}</h3>
    </div>
    {children}
  </div>
);

//  Manuscript upload zone
const ManuscriptUpload = ({ file, onChange, onRemove, error }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f && (f.type === "application/pdf" || f.name.endsWith(".docx"))) {
        onChange(f);
      } else {
        toast.error("Only PDF or DOCX files are accepted");
      }
    },
    [onChange],
  );

  if (file) {
    return (
      <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-4">
        <div className="w-11 h-11 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
          <FaFilePdf className="text-red-500 text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {file.name}
          </p>
          <p className="text-xs text-slate-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB · PDF / DOCX
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove file"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <FaTrash size={13} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed
          rounded-2xl p-10 cursor-pointer transition-all
          ${
            dragging
              ? "border-blue-400 bg-blue-50/40"
              : error
                ? "border-red-400 bg-red-50"
                : "border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/20"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files[0];
            if (f) onChange(f);
          }}
        />
        <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
          <FaCloudUploadAlt className="text-slate-400 text-2xl" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-700 text-sm">
            Upload your final research paper
          </p>
          <p className="text-xs text-slate-400 mt-1">PDF or DOCX (Max 25MB)</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-5 py-2 rounded-xl border border-slate-300 text-slate-600 text-sm
            font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors bg-white"
        >
          Select File
        </button>
      </label>
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
};

//  Supporting document slot
const SupportSlot = ({ slot, file, onChange, onRemove }) => {
  const { icon: Icon, label, subLabel, accept, required, carriedOver } = slot;
  const inputRef = useRef();

  return (
    <div
      className={`relative flex items-center gap-3 border rounded-xl px-4 py-3.5 transition-all
        ${
          file
            ? "border-green-200 bg-green-50"
            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/20"
        }`}
    >
      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="text-slate-500 text-sm" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <p className="text-[10px] text-slate-400">
          {file ? file.name : subLabel}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {carriedOver && !file && (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
            Carried Over
          </span>
        )}
        {required && !file && (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
            Required
          </span>
        )}
        {file ? (
          <>
            <FaCheckCircle className="text-green-500 text-sm" />
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove"
              className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <FaTrash size={11} />
            </button>
          </>
        ) : (
          <>
            {carriedOver && (
              <button
                type="button"
                aria-label="Preview"
                className="p-1.5 text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <FaEye size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Upload"
              className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <FaUpload size={13} />
            </button>
          </>
        )}
      </div>

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
    </div>
  );
};

//  Checklist item
const DeclarationItem = ({
  item,
  checked,
  onCheck,
  textValue,
  onTextChange,
}) => (
  <div className="flex flex-col gap-2">
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
          ${
            checked
              ? "bg-blue-600 border-blue-600"
              : "border-slate-300 group-hover:border-blue-400"
          }`}
        onClick={() => onCheck(!checked)}
      >
        {checked && <FaCheckCircle className="text-white text-[10px]" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{item.label}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {item.description}
        </p>
      </div>
    </label>

    {item.hasTextarea && checked && (
      <textarea
        rows={3}
        value={textValue}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={item.textareaPlaceholder}
        className={`${textareaCls} ml-8 text-xs`}
      />
    )}
  </div>
);

//  Required items list (sidebar)
const RequiredItem = ({ label, done }) => (
  <div className="flex items-center gap-2">
    {done ? (
      <FaCheckCircle className="text-green-500 text-sm shrink-0" />
    ) : (
      <FaExclamationCircle className="text-red-500 text-sm shrink-0" />
    )}
    <span
      className={`text-xs ${done ? "text-slate-600 line-through" : "text-red-600 font-medium"}`}
    >
      {label}
    </span>
  </div>
);

//  Main component
const SubmitFinalPaper = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [manuscript, setManuscript] = useState(null);
  const [supportFiles, setSupportFiles] = useState({});
  const [fundingFile, setFundingFile] = useState(null);
  const fundingRef = useRef();
  const setSupportFile = (k, f) => setSupportFiles((p) => ({ ...p, [k]: f }));
  const clearSupportFile = (k) =>
    setSupportFiles((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
  const [declarations, setDeclarations] = useState({
    conflictOfInterest: false,
    aiUsage: false,
  });
  const [aiUsageDetails, setAiUsageDetails] = useState("");
  const [plagiarismLink, setPlagiarismLink] = useState("");
  const [fundingSource, setFundingSource] = useState("");
  const [noteToCommittee, setNoteToCommittee] = useState("");
  const [finalAbstract, setFinalAbstract] = useState("");
  const [errors, setErrors] = useState({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [keywords, setKeywords] = useState("");
  const requiredItems = [
    { label: "Manuscript File", done: !!manuscript },
    { label: "Final Dataset", done: !!supportFiles.finalDataset },
    { label: "Ethics Documents", done: !!supportFiles.ethicsApproval },
    { label: "AI Disclosure", done: declarations.aiUsage },
    { label: "Final Abstract", done: finalAbstract.trim().length > 0 },
  ];
  const allRequiredDone = requiredItems.every((i) => i.done);
  const completedCount = requiredItems.filter((i) => i.done).length;

  //  Validate
  const validate = () => {
    const e = {};
    if (!manuscript) e.manuscript = "Final manuscript is required";
    if (!supportFiles.finalDataset)
      e.finalDataset = "Final dataset is required";
    if (!finalAbstract.trim())
      e.finalAbstract = "Final abstract is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  //  Build FormData
  const buildFormData = (isDraft = false) => {
    const fd = new FormData();
    fd.append("isDraft", isDraft);
    if (manuscript) fd.append("finalPaperFile", manuscript);
    if (supportFiles.finalDataset)
      fd.append("finalDataset", supportFiles.finalDataset);
    if (supportFiles.dataDictionary)
      fd.append("dataDictionary", supportFiles.dataDictionary);
    if (supportFiles.statisticalScripts)
      fd.append("statisticalScripts", supportFiles.statisticalScripts);
    if (supportFiles.ethicsApproval)
      fd.append("ethicsApproval", supportFiles.ethicsApproval);
    if (fundingFile) fd.append("fundingDisclosure", fundingFile);
    fd.append("finalAbstract", finalAbstract);
    fd.append("conflictOfInterestDeclared", declarations.conflictOfInterest);
    fd.append("aiUsageDeclared", declarations.aiUsage);
    if (declarations.aiUsage) fd.append("aiUsageDetails", aiUsageDetails);
    if (plagiarismLink) fd.append("plagiarismLink", plagiarismLink);
    if (fundingSource) fd.append("fundingSource", fundingSource);
    if (noteToCommittee) fd.append("noteToCommittee", noteToCommittee);
    return fd;
  };

  const load = useCallback(async () => {
    if (!id) {
      setLoadError("No research ID was provided in the URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const research = await getResearchById(id);
      if (research.stage !== "progress" || research.status !== "approved") {
        setLoadError(
          `This research isn't ready for final paper submission. Current stage: '${research.stage}', status: '${research.status}'.`,
        );
      }
      setSubmission(research);
      setFinalAbstract(research.abstract || "");
    } catch (err) {
      setLoadError(err.message || "Failed to load submission");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  //  Submit
 const handleSubmit = async () => {
  if (!validate()) {
    toast.error("Please complete all required fields before submitting.");
    return;
  }
  setSubmitting(true);
  try {
    await submitFinalPaper(id, {
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      finalAbstract,
      finalPaperFile: manuscript,
      finalDataset: supportFiles.finalDataset,
      dataDictionary: supportFiles.dataDictionary,
      statisticalScripts: supportFiles.statisticalScripts,
      ethicsApproval: supportFiles.ethicsApproval,
      fundingDisclosure: fundingFile,
      conflictOfInterestDeclared: declarations.conflictOfInterest,
      aiUsageDeclared: declarations.aiUsage,
      aiUsageDetails: declarations.aiUsage ? aiUsageDetails : "",
      plagiarismReportLink: plagiarismLink,
      fundingSource,
      noteToCommittee,
    });
    toast.success("Final paper submitted for review!");
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
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
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
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate("/research/dashboard")}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500
          hover:text-blue-600 transition-colors cursor-pointer"
      >
        <FaArrowLeft className="text-xs" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
              Stage 3 of 3
            </p>
            <h1 className="text-2xl font-bold text-slate-900 leading-snug">
              Full Paper Submission
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ref ID:{" "}
              <span className="font-mono font-semibold text-slate-700">
                {submission.researchId}
              </span>
            </p>
          </div>
          <div className="text-right shrink-0 max-w-[220px]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
              Project Title
            </p>
            <p className="text-sm font-semibold text-slate-700 leading-snug">
              {submission.title}
            </p>
          </div>
        </div>

        <StageStepper />
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <SectionCard
            icon={FaFileAlt}
            title="Final Manuscript"
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
          >
            <ManuscriptUpload
              file={manuscript}
              onChange={setManuscript}
              onRemove={() => setManuscript(null)}
              error={errors.manuscript}
            />
          </SectionCard>

          <SectionCard
            icon={FaFileAlt}
            title="Final Abstract"
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
          >
            <div className="flex flex-col gap-3">
              {submission.abstract && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Original Proposal Abstract
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {submission.abstract}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>
                  Final Abstract <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={6}
                  value={finalAbstract}
                  onChange={(e) => setFinalAbstract(e.target.value)}
                  placeholder="Summarize the final findings, methodology, and conclusions of the completed study…"
                  className={textareaCls}
                />
                <p className="text-[10px] text-slate-400">
                  Prefilled from your proposal abstract — update it to reflect
                  your final results before submitting.
                </p>
                {errors.finalAbstract && (
                  <p className="text-red-500 text-xs">
                    {errors.finalAbstract}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={FaDatabase}
            title="Supporting Documents & Data"
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
          >
            <div className="grid grid-cols-2 gap-3">
              {SUPPORT_SLOTS.map((slot) => (
                <div key={slot.key}>
                  <SupportSlot
                    slot={slot}
                    file={supportFiles[slot.key] || null}
                    onChange={(f) => setSupportFile(slot.key, f)}
                    onRemove={() => clearSupportFile(slot.key)}
                  />
                  {errors[slot.key] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[slot.key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard
            icon={FaShieldAlt}
            title="Declarations Checklist"
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          >
            <div className="flex flex-col gap-4 divide-y divide-slate-100">
              {DECLARATIONS.map((item, i) => (
                <div key={item.key} className={i > 0 ? "pt-4" : ""}>
                  <DeclarationItem
                    item={item}
                    checked={declarations[item.key]}
                    onCheck={(v) =>
                      setDeclarations((p) => ({ ...p, [item.key]: v }))
                    }
                    textValue={
                      item.textareaKey === "aiUsageDetails"
                        ? aiUsageDetails
                        : ""
                    }
                    onTextChange={(v) => {
                      if (item.textareaKey === "aiUsageDetails")
                        setAiUsageDetails(v);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Plagiarism Report</label>
                <input
                  type="url"
                  value={plagiarismLink}
                  required
                  onChange={(e) => setPlagiarismLink(e.target.value)}
                  placeholder="Paste link (Turnitin/iThenticate)"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Funding Disclosure</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fundingSource}
                    onChange={(e) => setFundingSource(e.target.value)}
                    placeholder="Grant IDs or Organization Name"
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => fundingRef.current?.click()}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl
                      border border-slate-200 text-slate-600 text-xs font-semibold
                      hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer"
                    aria-label="Upload funding PDF"
                  >
                    <FaUpload className="text-[10px]" />
                    {fundingFile ? "Uploaded" : "Upload PDF"}
                  </button>
                  <input
                    ref={fundingRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (f) setFundingFile(f);
                    }}
                  />
                </div>
                {fundingFile && (
                  <p className="text-[10px] text-green-600 font-medium">
                    {fundingFile.name}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={FaTag}
            title="Keywords"
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
          >
         
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. antimicrobial resistance, pediatrics, UTI"
                className={inputCls}
              />
        
          </SectionCard>

          <div className="flex items-center gap-3 pt-2 pb-8 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/research/dashboard")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200
                text-slate-600 text-sm font-semibold hover:border-red-200 hover:text-red-600
                transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-700
    hover:bg-blue-800 text-white text-sm font-bold transition-colors
    cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Spinner size={4} color="border-t-white" /> Submitting…
                </>
              ) : (
                <>
                  <FaPaperPlane className="text-xs" /> Submit for Final Review
                </>
              )}
            </button>
          </div>
        </div>

        <aside className="w-64 shrink-0 sticky top-6 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Submission Summary
            </h3>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Status
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span className="text-sm font-bold text-blue-700">
                  Final Stage Ready
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Required Items Remaining
              </p>
              <div className="flex flex-col gap-2">
                {requiredItems.map((item) => (
                  <RequiredItem
                    key={item.label}
                    label={item.label}
                    done={item.done}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedCount / requiredItems.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {completedCount} of {requiredItems.length} required items
                complete
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
              Once submitted, the research will undergo a formal committee
              review. This process typically takes{" "}
              <span className="font-semibold text-slate-700">
                14–21 business days
              </span>
              .
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                  rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold
                  hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <FaEye className="text-[10px]" /> Preview Draft
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                  rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold
                  hover:border-slate-300 transition-colors cursor-pointer"
              >
                <FaHistory className="text-[10px]" /> View Submission History
              </button>
            </div>
          </div>

          {/* Warning if not all complete on attempt */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-2 items-start">
              <FaExclamationTriangle className="text-red-500 shrink-0 mt-0.5 text-xs" />
              <p className="text-xs text-red-700 leading-relaxed">
                Please upload the required files before submitting.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SubmitFinalPaper;
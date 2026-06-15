import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaFilePdf,
  FaUpload,
  FaTrash,
  FaInfoCircle,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { FaBook } from "react-icons/fa";
import api from "../../api/axios";

// ─── Constants ────────────────────────────────────────────────────────────────
const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;

const STEPS = [
  { id: "details", label: "Details" },
  { id: "upload",  label: "Upload"  },
  { id: "review",  label: "Review"  },
];

// ─── Shared class strings ─────────────────────────────────────────────────────
const inputCls = (err) =>
  `w-full px-3.5 py-2.5 border rounded-xl text-slate-800 placeholder-slate-400 text-sm
   outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10
   transition-all bg-white
   ${err ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"}`;

const labelCls = "text-xs font-semibold uppercase tracking-widest text-slate-500";

const primaryBtnCls =
  `flex items-center justify-center gap-2 flex-1 px-5 py-2.5 rounded-xl
   bg-green-700 hover:bg-green-800 text-white text-sm font-semibold
   transition-colors disabled:opacity-50 disabled:cursor-not-allowed`;

const secondaryBtnCls =
  `flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200
   text-slate-600 hover:border-green-400 hover:text-green-700 text-sm
   font-semibold transition-colors`;

// ─── Field wrapper ────────────────────────────────────────────────────────────
const Field = ({ label, required, error, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-red-500 text-xs">{error}</p>}
  </div>
);

// ─── Info callout ─────────────────────────────────────────────────────────────
const InfoBox = ({ color = "blue", children }) => {
  const map = {
    blue:   "bg-blue-50   border-blue-100  text-blue-700",
    amber:  "bg-amber-50  border-amber-100 text-amber-700",
    green:  "bg-green-50  border-green-200 text-green-700",
    red:    "bg-red-50    border-red-200   text-red-700",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 flex gap-2 items-start text-xs leading-relaxed ${map[color]}`}>
      <FaInfoCircle className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
};

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepBar = ({ current }) => (
  <div className="flex items-center gap-0 px-8 pt-6 pb-2">
    {STEPS.map((s, i) => {
      const done    = i < current;
      const active  = i === current;
      return (
        <div key={s.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              border-2 transition-all duration-300
              ${done   ? "bg-green-700 border-green-700 text-white"
              : active ? "bg-white border-green-600 text-green-700 shadow-sm"
              :          "bg-slate-50 border-slate-200 text-slate-400"}`}>
              {done ? <FaCheckCircle className="text-xs" /> : i + 1}
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap
              ${active ? "text-green-700" : done ? "text-green-500" : "text-slate-400"}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all duration-500
              ${i < current ? "bg-green-600" : "bg-slate-200"}`} />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Step 1: Paper details ────────────────────────────────────────────────────
const StepDetails = ({ form, setField, errors, research }) => (
  <div className="space-y-5">
    {/* Context banner */}
    <InfoBox color="green">
      Submitting final paper for:{" "}
      <span className="font-semibold">"{research.title}"</span>. Your proposal
      was approved — complete all fields below.
    </InfoBox>

    <Field
      label="Final abstract"
      required
      error={errors.finalAbstract}
      hint={`${wordCount(form.finalAbstract)} words`}
    >
      <div className="relative">
        <textarea
          rows={5}
          value={form.finalAbstract}
          onChange={(e) => setField("finalAbstract", e.target.value)}
          placeholder="The final, polished abstract for your published paper. Include background, methods, results, and conclusions…"
          className={`${inputCls(errors.finalAbstract)} resize-none pb-6`}
        />
        <span className="absolute bottom-2 right-3 text-xs text-slate-400 pointer-events-none">
          {wordCount(form.finalAbstract)} words
        </span>
      </div>
    </Field>

    <Field
      label="Keywords"
      required
      error={errors.keywords}
      hint="Comma-separated, min 3"
    >
      <input
        type="text"
        value={form.keywords}
        onChange={(e) => setField("keywords", e.target.value)}
        placeholder="e.g. malaria, prevention, Laikipia County, epidemiology"
        className={inputCls(errors.keywords)}
      />
      {!errors.keywords && form.keywords && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {form.keywords.split(",").map((k) => k.trim()).filter(Boolean).map((k) => (
            <span key={k} className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {k}
            </span>
          ))}
        </div>
      )}
    </Field>
  </div>
);

// ─── Step 2: Upload ────────────────────────────────────────────────────────────
const StepUpload = ({ file, onFile, onClear, error }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") onFile(f);
    else toast.error("Only PDF files are accepted");
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`flex flex-col items-center justify-center gap-4 border-2
            border-dashed rounded-2xl p-10 cursor-pointer transition-all
            ${error
              ? "border-red-400 bg-red-50"
              : "border-slate-200 bg-slate-50 hover:border-green-400 hover:bg-green-50/40"
            }`}
        >
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); }}
          />
          <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl
            flex items-center justify-center shadow-sm">
            <FaUpload className="text-green-600 text-xl" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700 text-sm">
              Drag & drop or{" "}
              <span className="text-green-700 underline underline-offset-2">browse files</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF only · Max 20 MB</p>
          </div>
        </label>
      ) : (
        <div className="flex items-center gap-3 border border-green-200 bg-green-50
          rounded-xl px-4 py-4">
          <div className="w-11 h-11 bg-red-50 border border-red-100 rounded-xl
            flex items-center justify-center shrink-0">
            <FaFilePdf className="text-red-500 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label="Remove file"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500
              hover:bg-red-50 transition-colors cursor-pointer"
          >
            <FaTrash size={13} />
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <InfoBox color="amber">
        <strong>Requirements:</strong> Include all sections, figures, tables, and appendices.
        Proper page numbers and a complete references section are mandatory.
        Files are stored securely — no direct URL is exposed to readers.
      </InfoBox>
    </div>
  );
};

// ─── Step 3: Review ───────────────────────────────────────────────────────────
const StepReview = ({ form, file, research }) => {
  const keywords = form.keywords.split(",").map((k) => k.trim()).filter(Boolean);

  const rows = [
    ["Research title",    research.title],
    ["Stage",             "Final Paper"],
    ["Final abstract",    form.finalAbstract],
    ["Keywords",          keywords.join(", ")],
  ];

  return (
    <div className="space-y-4">
      <InfoBox color="blue">
        Review everything carefully. Once submitted, the reviewer will be
        notified and you cannot edit this submission.
      </InfoBox>

      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
        {rows.filter(([, v]) => v).map(([label, value], i) => (
          <div
            key={label}
            className={`px-4 py-3 flex gap-3 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}
          >
            <span className="text-xs font-semibold text-slate-400 w-32 shrink-0 pt-0.5 uppercase tracking-wider">
              {label}
            </span>
            <span className="text-xs text-slate-700 leading-relaxed flex-1">
              {value.length > 180 ? value.slice(0, 180) + "…" : value}
            </span>
          </div>
        ))}
        {file && (
          <div className="px-4 py-3 flex gap-3 items-center bg-white">
            <span className="text-xs font-semibold text-slate-400 w-32 shrink-0 uppercase tracking-wider">
              Document
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-700">
              <FaFilePdf className="text-red-500" /> {file.name}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center pt-1">
        By submitting you confirm this is your original work and agree to the
        repository's publication terms.
      </p>
    </div>
  );
};

// ─── Main wizard ──────────────────────────────────────────────────────────────
const SubmitFinalPaper = ({ research, onClose, onSubmitted }) => {
  const [step, setStep]     = useState(0);
  const [errors, setErrors] = useState({});
  const [file, setFile]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const bodyRef = useRef(null);

  const [form, setFormRaw] = useState({
    finalAbstract: research.abstract || "",
    keywords:      "",
  });

  const setField = (k, v) => {
    setFormRaw((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      const wc = wordCount(form.finalAbstract);
      if (!form.finalAbstract.trim())    e.finalAbstract = "Final abstract is required";
      else if (wc < 30)                  e.finalAbstract = `Too short — ${wc} words (minimum 30)`;
      const kws = form.keywords.split(",").map((k) => k.trim()).filter(Boolean);
      if (!form.keywords.trim())         e.keywords = "At least 3 keywords are required";
      else if (kws.length < 3)           e.keywords = `Add at least 3 keywords — you have ${kws.length}`;
    }
    if (s === 1) {
      if (!file) e.file = "Please upload your final paper PDF";
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const back = () => { setErrors({}); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    setLoading(true);
    setApiError("");
    try {
      const fd = new FormData();
      fd.append("finalAbstract", form.finalAbstract);
      fd.append("keywords",      form.keywords);
      fd.append("finalPaperFile", file);

      await api.post(`/research/${research._id}/final-paper`, fd);

      toast.success("Final paper submitted successfully!");
      onSubmitted?.();
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepContent = [
    <StepDetails form={form} setField={setField} errors={errors} research={research} />,
    <StepUpload file={file} onFile={setFile} onClear={() => setFile(null)} error={errors.file} />,
    <StepReview form={form} file={file} research={research} />,
  ];

  const stepTitles = ["Paper details", "Upload document", "Review & submit"];
  const stepSubs = [
    "Provide your final abstract and keywords for the published paper.",
    "Upload your complete final paper as a PDF (max 20 MB).",
    "Check all details before submitting to your assigned reviewer.",
  ];

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="bg-green-800 rounded-t-2xl px-8 py-5 flex items-center gap-4">
        <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
          <FaBook className="text-white text-lg" />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-tight">Submit final paper</p>
          <p className="text-green-200 text-xs mt-0.5">Research Portal · Stage 3 of 3</p>
        </div>
      </div>

      {/* Step bar */}
      <StepBar current={step} />

      {/* Step label */}
      <div className="px-8 pb-1 pt-2">
        <h3 className="font-bold text-slate-900 text-base">{stepTitles[step]}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{stepSubs[step]}</p>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className="px-8 py-5 overflow-y-auto"
        style={{ maxHeight: 440 }}
      >
        {stepContent[step]}

        {apiError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4
            text-sm text-red-700 flex items-start gap-3">
            <FaInfoCircle className="mt-0.5 shrink-0 text-red-400" />
            {apiError}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/60
        rounded-b-2xl flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            disabled={loading}
            className={secondaryBtnCls}
          >
            <FaArrowLeft className="text-xs" /> Back
          </button>
        )}

        {!isLastStep && (
          <button type="button" onClick={next} className={primaryBtnCls}>
            Continue <FaArrowRight className="text-xs" />
          </button>
        )}

        {isLastStep && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={primaryBtnCls}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin text-sm" /> Submitting…
              </>
            ) : (
              <>
                <FaCheckCircle className="text-sm" /> Submit final paper
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SubmitFinalPaper;
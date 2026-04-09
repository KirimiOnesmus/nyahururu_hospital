import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaFlask, FaFileAlt, FaBullseye, FaUpload,
  FaFilePdf, FaTrash, FaMobileAlt, FaCheckCircle,
  FaSpinner, FaChevronDown, FaArrowRight,
  FaArrowLeft, FaInfoCircle, FaArrowUp,
} from "react-icons/fa";

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const DISCIPLINES = [
  "Medicine",
];
const SUBMISSION_FEE = 150;

const formatPhone = (v) => {
  const d = v.replace(/\D/g, "");
  if (d.startsWith("0"))   return d.slice(0, 10);
  if (d.startsWith("254")) return d.slice(0, 12);
  return d.slice(0, 10);
};

/* ══════════════════════════════════════════
   STEP CONFIG — Payment is now step 4 (last)
══════════════════════════════════════════ */
const STEPS = [
  { id: "basics",   label: "Basics",    icon: FaFileAlt   },
  { id: "research", label: "Research",  icon: FaBullseye  },
  { id: "upload",   label: "Upload",    icon: FaUpload    },
  { id: "review",   label: "Review",    icon: FaFlask     },
  { id: "payment",  label: "Payment",   icon: FaMobileAlt },
];

/* ══════════════════════════════════════════
   SMALL HELPERS
══════════════════════════════════════════ */
const inputCls = (err) =>
  `w-full px-3.5 py-2.5 border rounded-lg text-gray-800 placeholder-gray-400 text-sm
  outline-none focus:ring focus:ring-blue-500 transition-all bg-gray-50 hover:border-gray-300
   ${err ? "border-red-400 bg-red-50" : "border-gray-200"}`;

const Field = ({ label, error, required, hint, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

/* ══════════════════════════════════════════
   STEP 0 — BASICS
══════════════════════════════════════════ */
const StepBasics = ({ form, setField, errors }) => (
  <div className="space-y-5">
    <Field label="Research Title" required error={errors.title} hint="Be specific">
      <input
        type="text"
        placeholder="e.g. Impact of X on Y in Laikipia County"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        className={inputCls(errors.title)}
      />
    </Field>

    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-blue-600 font-bold text-lg">Rx</span>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">Research Discipline</p>
        <p className="font-semibold text-gray-900">Medicine</p>
        <p className="text-xs text-gray-500 mt-0.5">This portal is dedicated to medical research.</p>
      </div>
    </div>

    <Field label="Abstract" required error={errors.abstract} hint="50–200 words">
      <div className="relative">
        <textarea
          rows={4}
          placeholder="A brief summary of what you're researching, why it matters, and what you expect to find…"
          value={form.abstract}
          onChange={(e) => setField("abstract", e.target.value)}
          className={`${inputCls(errors.abstract)} resize-none`}
        />
        <span className="absolute bottom-2 right-3 text-xs text-gray-400">
          {form.abstract.trim().split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
    </Field>
  </div>
);

/* ══════════════════════════════════════════
   STEP 1 — RESEARCH DETAILS
══════════════════════════════════════════ */
const StepResearch = ({ form, setField, errors }) => (
  <div className="space-y-5">
    <Field label="Problem Statement" required error={errors.background} hint="2–4 sentences">
      <textarea
        rows={3}
        placeholder="What gap or problem does your research address? Why is it important now?"
        value={form.background}
        onChange={(e) => setField("background", e.target.value)}
        className={`${inputCls(errors.background)} resize-none`}
      />
    </Field>

    <Field label="Objectives" required error={errors.objectives} hint="One per line">
      <textarea
        rows={3}
        placeholder={"1. To investigate...\n2. To determine...\n3. To assess..."}
        value={form.objectives}
        onChange={(e) => setField("objectives", e.target.value)}
        className={`${inputCls(errors.objectives)} resize-none`}
      />
    </Field>

    <Field label="Methodology" required error={errors.methodology} hint="Brief overview">
      <textarea
        rows={3}
        placeholder="How will you collect and analyse data? e.g. surveys, interviews, lab analysis…"
        value={form.methodology}
        onChange={(e) => setField("methodology", e.target.value)}
        className={`${inputCls(errors.methodology)} resize-none`}
      />
    </Field>

    <div className="grid grid-cols-2 gap-4">
      <Field label="Expected Outcome" required error={errors.expectedOutcome}>
        <textarea
          rows={2}
          placeholder="What will this research produce or contribute?"
          value={form.expectedOutcome}
          onChange={(e) => setField("expectedOutcome", e.target.value)}
          className={`${inputCls(errors.expectedOutcome)} resize-none`}
        />
      </Field>
      <Field label="Duration" required error={errors.timeline}>
        <input
          type="text"
          placeholder="e.g. 6 months (Jan–Jun 2025)"
          value={form.timeline}
          onChange={(e) => setField("timeline", e.target.value)}
          className={inputCls(errors.timeline)}
        />
      </Field>
    </div>
  </div>
);

/* ══════════════════════════════════════════
   STEP 2 — UPLOAD
══════════════════════════════════════════ */
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
          className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all
            ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"}`}
        >
          <input type="file" accept=".pdf" className="hidden"
            onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); }} />
          <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
            <FaUpload className="text-blue-500 text-xl" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700 text-sm">
              Drag & drop or <span className="text-blue-600 underline underline-offset-2">browse files</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF only · Max 10 MB</p>
          </div>
        </label>
      ) : (
        <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-4">
          <div className="w-11 h-11 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FaFilePdf className="text-red-500 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
          </div>
          <button type="button" onClick={onClear}
            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 
            rounded-lg hover:bg-red-50 cursor-pointer">
            <FaTrash size={14} />
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 flex gap-2 items-start">
        <FaInfoCircle className="text-yellow-500 mt-0.5 flex-shrink-0 text-xs" />
        <p className="text-xs text-yellow-700 leading-relaxed">
          Your PDF should include all sections, figures, and appendices. Files are stored securely — no direct URL is exposed.
        </p>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   STEP 3 — REVIEW & SUBMIT
══════════════════════════════════════════ */
const StepReview = ({ form, file }) => {
  const rows = [
    { label: "Title",             value: form.title },
    { label: "Discipline",        value: form.discipline },
    { label: "Abstract",          value: form.abstract },
    { label: "Problem Statement", value: form.background },
    { label: "Objectives",        value: form.objectives },
    { label: "Methodology",       value: form.methodology },
    { label: "Expected Outcome",  value: form.expectedOutcome },
    { label: "Duration",          value: form.timeline },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-2 items-start">
        <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0 text-sm" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Please review your submission details below. After confirmation, you'll proceed to payment.
        </p>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
        {rows.map(({ label, value }) => value && (
          <div key={label} className="px-4 py-3 flex gap-3">
            <span className="text-xs font-semibold text-gray-400 w-32 flex-shrink-0 pt-0.5">{label}</span>
            <span className="text-xs text-gray-700 leading-relaxed flex-1 line-clamp-2">{value}</span>
          </div>
        ))}
        {file && (
          <div className="px-4 py-3 flex gap-3 items-center">
            <span className="text-xs font-semibold text-gray-400 w-32 flex-shrink-0">Document</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-700">
              <FaFilePdf className="text-red-500" /> {file.name}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center pt-1">
        By submitting you confirm this is original work and agree to the repository's publication terms.
      </p>
    </div>
  );
};

/* ══════════════════════════════════════════
   STEP 4 — PAYMENT (LAST STEP)
══════════════════════════════════════════ */
const StepPayment = ({ onPaid }) => {
  const [phone, setPhone]   = useState("");
  const [status, setStatus] = useState("idle"); // idle | processing | success
  const [error, setError]   = useState("");

  const handlePay = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setError("Enter a valid Safaricom number"); return; }
    setError(""); setStatus("processing");
    try {
      const res  = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digits.startsWith("0") ? "254" + digits.slice(1) : digits,
          amount: SUBMISSION_FEE,
          type: "proposal_submission",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment failed");
      setStatus("success");
      setTimeout(() => onPaid(data.transactionCode || "TXN-DEMO"), 1800);
    } catch (err) {
      setError(err.message); setStatus("idle");
    }
  };

  if (status === "processing") return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <FaSpinner className="text-4xl text-blue-600 animate-spin" />
      <div className="text-center">
        <p className="font-bold text-gray-900 text-lg">Check Your Phone</p>
        <p className="text-gray-500 text-sm mt-1">
          M-Pesa prompt sent to <strong>{phone}</strong>.<br/>Enter your PIN to confirm.
        </p>
      </div>
    </div>
  );

  if (status === "success") return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <FaCheckCircle className="text-3xl text-green-600" />
      </div>
      <div className="text-center">
        <p className="font-bold text-gray-900 text-lg">Payment Confirmed!</p>
        <p className="text-gray-500 text-sm mt-1">Submitting your proposal…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* amount card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">One-time submission fee</p>
          <p className="text-3xl font-extrabold text-gray-900">KES {SUBMISSION_FEE}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-0.5">via</p>
          <p className="font-extrabold text-green-600 flex items-center gap-1">
            <FaMobileAlt /> M-Pesa
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-2 items-start">
        <FaInfoCircle className="text-blue-400 mt-0.5 flex-shrink-0 text-sm" />
        <p className="text-xs text-blue-700 leading-relaxed">
          This is a one-time fee per proposal. Resubmissions after review are completely free.
        </p>
      </div>

      <Field label="Safaricom Number" required error={error}>
        <input
          type="tel"
          placeholder="0712 345 678"
          value={phone}
          onChange={(e) => { setPhone(formatPhone(e.target.value)); setError(""); }}
          className={inputCls(error)}
        />
      </Field>

      <button
        onClick={handlePay}
        className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer
         text-white font-bold py-3.5 rounded-xl transition-all
          hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
      >
        <FaMobileAlt /> Pay KES {SUBMISSION_FEE} via M-Pesa
      </button>
      <p className="text-center text-xs text-gray-400">
        An STK Push will appear on your phone · Receipt emailed on confirmation
      </p>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
const SubmitProposal = ({ onClose, onSubmitted }) => {
  const [step, setStep]           = useState(0);
  const [paid, setPaid]           = useState(false);
  const [transactionCode, setTxCode] = useState("");
  const [submitting, setSubmitting]  = useState(false);
  const [errors, setErrors]          = useState({});
  const [proposalFile, setFile]      = useState(null);
  const bodyRef = useRef(null);

  const [form, setFormState] = useState({
    title: "", discipline: "Medicine",
    abstract: "", background: "", objectives: "",
    methodology: "", expectedOutcome: "", timeline: "",
  });

  const setField = (k, v) => {
    setFormState((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  };

  /* scroll body to top on step change */
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  /* ── Validation per step ── */
  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.title.trim() || form.title.length < 10) e.title = "Please enter a descriptive title (min 10 chars)";
      const wc = form.abstract.trim().split(/\s+/).filter(Boolean).length;
      if (!form.abstract.trim()) e.abstract = "Abstract is required";
      else if (wc < 30) e.abstract = `Too short — ${wc} words (min 30)`;
    }
    if (s === 1) {
      if (!form.background.trim())     e.background     = "Required";
      if (!form.objectives.trim())     e.objectives     = "Required";
      if (!form.methodology.trim())    e.methodology    = "Required";
      if (!form.expectedOutcome.trim())e.expectedOutcome= "Required";
      if (!form.timeline.trim())       e.timeline       = "Required";
    }
    if (s === 2) {
      if (!proposalFile) e.proposalFile = "Please upload your proposal PDF";
    }
    return e;
  };

  const next = () => {
    const errs = validate(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const back = () => { setErrors({}); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    if (!paid) {
      toast.error("Please complete payment first");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("transactionCode", transactionCode);
      fd.append("proposalFile", proposalFile);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/research/submit-proposal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      toast.success("Proposal submitted successfully!");
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLastStep = step === STEPS.length - 1;

  /* ── Step content renderer ── */
  const renderStep = () => {
    switch (step) {
      case 0: return <StepBasics    form={form} setField={setField} errors={errors} />;
      case 1: return <StepResearch  form={form} setField={setField} errors={errors} />;
      case 2: return (
        <StepUpload
          file={proposalFile}
          onFile={setFile}
          onClear={() => setFile(null)}
          error={errors.proposalFile}
        />
      );
      case 3: return <StepReview form={form} file={proposalFile} />;
      case 4: return (
        <StepPayment
          onPaid={(code) => { setPaid(true); setTxCode(code); }}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* ── Header ── */}
      <div className="bg-blue-600 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
            <FaFlask className="text-white text-lg" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Submit Proposal</p>
            <p className="text-blue-200 text-sm">Research Portal · Stage 1 of 3</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-2
           hover:bg-white/10 rounded-lg cursor-pointer"
        >
          <FaArrowUp size={20} />
        </button>
      </div>

      {/* ── Step indicator ── */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const done    = i < step;
            const current = i === step;
            const Icon    = s.icon;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2
                    ${done    ? "bg-blue-600 border-blue-600 text-white"
                    : current ? "bg-white border-blue-600 text-blue-600 shadow-sm"
                    :           "bg-gray-100 border-gray-200 text-gray-400"}`}
                  >
                    {done
                      ? <FaCheckCircle className="text-sm" />
                      : <Icon className="text-sm" />}
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap
                    ${current ? "text-blue-600 font-bold" : done ? "text-blue-400" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-8 transition-all duration-500 ${i < step ? "bg-blue-500" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step title ── */}
      <div className="px-8 pt-6 pb-2">
        <h3 className="font-bold text-gray-900 text-lg">
          {step === 0 && "Basic Information"}
          {step === 1 && "Research Details"}
          {step === 2 && "Upload Document"}
          {step === 3 && "Review & Submit"}
          {step === 4 && "Complete Payment"}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {step === 0 && "Tell us the title, discipline, and what your research is about."}
          {step === 1 && "Describe the problem, objectives, and how you'll conduct the research."}
          {step === 2 && "Upload your full proposal document as a PDF."}
          {step === 3 && "Check your details before final submission."}
          {step === 4 && `A one-time fee of KES ${SUBMISSION_FEE} is required to submit your proposal.`}
        </p>
      </div>

      {/* ── Scrollable body ── */}
      <div ref={bodyRef} className="px-8 py-6 overflow-y-auto" style={{ maxHeight: "500px" }}>
        {renderStep()}
      </div>

      {/* ── Footer nav ── */}
      <div className="px-8 py-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-2 border-2 border-gray-200
             text-gray-600 hover:border-blue-300 hover:text-blue-600
              font-semibold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
          >
            <FaArrowLeft /> Back
          </button>
        )}

        {!isLastStep && (
          <button
            type="button"
            onClick={next}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600
             hover:from-blue-700 hover:to-indigo-700 text-white font-bold
              py-3 rounded-xl transition-all hover:shadow-lg flex items-center 
              justify-center gap-2 text-sm cursor-pointer"
          >
            Continue <FaArrowRight className="text-xs" />
          </button>
        )}

        {isLastStep && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !paid}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600
             hover:from-green-600 hover:to-emerald-700 text-white 
             font-bold py-3 rounded-xl transition-all hover:shadow-lg 
             flex items-center justify-center gap-2 text-sm disabled:opacity-50 
             disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
          >
            {submitting ? (
              <><FaSpinner className="animate-spin" /> Submitting…</>
            ) : paid ? (
              <><FaCheckCircle /> Submit Proposal</>
            ) : (
              <><FaFlask /> Complete Payment</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SubmitProposal;
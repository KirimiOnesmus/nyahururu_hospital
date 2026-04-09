import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaFlask, FaFileAlt, FaBook, FaUpload,
  FaFilePdf, FaTrash, FaMobileAlt, FaCheckCircle,
  FaSpinner, FaChevronDown, FaArrowRight,
  FaArrowLeft, FaInfoCircle, FaArrowUp,
} from "react-icons/fa";

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const SUBMISSION_FEE = 200;

const formatPhone = (v) => {
  const d = v.replace(/\D/g, "");
  if (d.startsWith("0"))   return d.slice(0, 10);
  if (d.startsWith("254")) return d.slice(0, 12);
  return d.slice(0, 10);
};

/* ══════════════════════════════════════════
   STEP CONFIG
══════════════════════════════════════════ */
const STEPS = [
  { id: "details",  label: "Details",   icon: FaFileAlt   },
  { id: "upload",   label: "Upload",    icon: FaUpload    },
  { id: "review",   label: "Review",    icon: FaBook      },
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
   STEP 0 — DETAILS
══════════════════════════════════════════ */
const StepDetails = ({ form, setField, errors, proposalTitle }) => (
  <div className="space-y-5">
    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-3 items-start">
      <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0 text-sm" />
      <p className="text-xs text-blue-700 leading-relaxed">
        You are submitting the final paper for: <span className="font-semibold">{proposalTitle}</span>
      </p>
    </div>

    <Field label="Paper Title" required error={errors.title} hint="Main title of your paper">
      <input
        type="text"
        placeholder="e.g. Impact of X on Y: A Comprehensive Analysis"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        className={inputCls(errors.title)}
      />
    </Field>

    <Field label="Keywords" required error={errors.keywords} hint="Comma-separated, min 3">
      <input
        type="text"
        placeholder="e.g. medicine, research, methodology, data analysis"
        value={form.keywords}
        onChange={(e) => setField("keywords", e.target.value)}
        className={inputCls(errors.keywords)}
      />
    </Field>

    <Field label="Authors" required error={errors.authors} hint="All co-authors">
      <textarea
        rows={3}
        placeholder="Enter author names, one per line. First author should be you."
        value={form.authors}
        onChange={(e) => setField("authors", e.target.value)}
        className={`${inputCls(errors.authors)} resize-none`}
      />
    </Field>

    <Field label="Summary/Abstract" required error={errors.summary} hint="100–300 words">
      <div className="relative">
        <textarea
          rows={4}
          placeholder="A concise summary of your research, findings, and conclusions…"
          value={form.summary}
          onChange={(e) => setField("summary", e.target.value)}
          className={`${inputCls(errors.summary)} resize-none`}
        />
        <span className="absolute bottom-2 right-3 text-xs text-gray-400">
          {form.summary.trim().split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
    </Field>

    <div className="grid grid-cols-2 gap-4">
      <Field label="Publication Status" required error={errors.publicationStatus}>
        <select
          value={form.publicationStatus}
          onChange={(e) => setField("publicationStatus", e.target.value)}
          className={`${inputCls(errors.publicationStatus)} appearance-none`}
        >
          <option value="">Select status…</option>
          <option value="original">Original Research</option>
          <option value="review">Literature Review</option>
          <option value="case">Case Study</option>
          <option value="meta">Meta-Analysis</option>
        </select>
        <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
      </Field>

      <Field label="Word Count" required error={errors.wordCount} hint="Approximate">
        <input
          type="number"
          placeholder="e.g. 8500"
          value={form.wordCount}
          onChange={(e) => setField("wordCount", e.target.value)}
          className={inputCls(errors.wordCount)}
        />
      </Field>
    </div>
  </div>
);

/* ══════════════════════════════════════════
   STEP 1 — UPLOAD
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
            <p className="text-xs text-gray-400 mt-1">PDF only · Max 50 MB</p>
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
            className="text-gray-400 hover:text-red-500 cursor-pointer
             transition-colors p-1.5 rounded-lg hover:bg-red-50">
            <FaTrash size={14} />
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 flex gap-2 items-start">
        <FaInfoCircle className="text-yellow-500 mt-0.5 flex-shrink-0 text-xs" />
        <div className="text-xs text-yellow-700 leading-relaxed">
          <p className="font-semibold mb-1">Requirements:</p>
          <ul className="space-y-0.5 ml-3 list-disc">
            <li>PDF format, max 50 MB</li>
            <li>Include all figures, tables, and appendices</li>
            <li>Proper formatting and page numbers</li>
            <li>References section included</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   STEP 2 — REVIEW
══════════════════════════════════════════ */
const StepReview = ({ form, file }) => {
  const rows = [
    { label: "Paper Title",         value: form.title },
    { label: "Keywords",            value: form.keywords },
    { label: "Authors",             value: form.authors },
    { label: "Summary",             value: form.summary },
    { label: "Publication Status",  value: form.publicationStatus },
    { label: "Word Count",          value: form.wordCount ? `${form.wordCount} words` : "" },
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
   STEP 3 — PAYMENT (LAST STEP)
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
          type: "final_paper_submission",
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
        <p className="text-gray-500 text-sm mt-1">Submitting your paper…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* amount card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Final paper submission fee</p>
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
          This fee applies only to final paper submissions. Your paper will be made available in the research repository upon approval.
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
        className="w-full bg-blue-600 hover:bg-blue-700 text-white 
        font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 
        shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
const SubmitFullPaper = ({ onClose, onSubmitted, proposalId, proposalTitle }) => {
  const [step, setStep]           = useState(0);
  const [paid, setPaid]           = useState(false);
  const [transactionCode, setTxCode] = useState("");
  const [submitting, setSubmitting]  = useState(false);
  const [errors, setErrors]          = useState({});
  const [paperFile, setFile]         = useState(null);
  const bodyRef = useRef(null);

  const [form, setFormState] = useState({
    title: "", keywords: "", authors: "",
    summary: "", publicationStatus: "", wordCount: "",
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
      if (!form.keywords.trim()) e.keywords = "Enter at least 3 keywords";
      else if (form.keywords.split(",").length < 3) e.keywords = "Provide at least 3 keywords, separated by commas";
      if (!form.authors.trim()) e.authors = "List all authors";
      const wc = form.summary.trim().split(/\s+/).filter(Boolean).length;
      if (!form.summary.trim()) e.summary = "Summary is required";
      else if (wc < 50) e.summary = `Too short — ${wc} words (min 50)`;
      if (!form.publicationStatus) e.publicationStatus = "Select publication type";
      if (!form.wordCount || parseInt(form.wordCount) < 1000) e.wordCount = "Word count must be at least 1000";
    }
    if (s === 1) {
      if (!paperFile) e.paperFile = "Please upload your paper PDF";
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
      fd.append("proposalId", proposalId);
      fd.append("paperFile", paperFile);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/research/submit-final-paper", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      toast.success("Final paper submitted successfully!");
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
      case 0: return <StepDetails form={form} setField={setField} errors={errors} proposalTitle={proposalTitle} />;
      case 1: return (
        <StepUpload
          file={paperFile}
          onFile={setFile}
          onClear={() => setFile(null)}
          error={errors.paperFile}
        />
      );
      case 2: return <StepReview form={form} file={paperFile} />;
      case 3: return (
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
      <div className="bg-green-800 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
            <FaBook className="text-white text-lg" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Submit Final Paper</p>
            <p className="text-green-200 text-sm">Research Portal · Stage 3 of 3</p>
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
                    ${done    ? "bg-green-600 border-green-600 text-white"
                    : current ? "bg-white border-green-600 text-green-600 shadow-sm"
                    :           "bg-gray-100 border-gray-200 text-gray-400"}`}
                  >
                    {done
                      ? <FaCheckCircle className="text-sm" />
                      : <Icon className="text-sm" />}
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap
                    ${current ? "text-green-600 font-bold" : done ? "text-green-400" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-8 transition-all duration-500 ${i < step ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step title ── */}
      <div className="px-8 pt-6 pb-2">
        <h3 className="font-bold text-gray-900 text-lg">
          {step === 0 && "Paper Details"}
          {step === 1 && "Upload Paper"}
          {step === 2 && "Review & Submit"}
          {step === 3 && "Complete Payment"}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {step === 0 && "Provide details about your final paper including title, authors, and abstract."}
          {step === 1 && "Upload your complete final paper as a PDF file."}
          {step === 2 && "Check your details before final submission."}
          {step === 3 && `A one-time fee of KES ${SUBMISSION_FEE} is required to submit your final paper.`}
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
             text-gray-600 hover:border-green-300 hover:text-green-600 font-semibold px-6 py-3 rounded-xl transition-all text-sm"
          >
            <FaArrowLeft /> Back
          </button>
        )}

        {!isLastStep && (
          <button
            type="button"
            onClick={next}
            className="flex-1 bg-green-600 hover:from-green-700 hover:to-teal-700 text-white 
            font-bold py-3 rounded-xl transition-all hover:shadow-lg flex items-center 
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
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600
             hover:from-green-600 hover:to-green-700 text-white font-bold 
             py-3 rounded-xl transition-all hover:shadow-lg flex items-center 
             justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer 
             disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitting ? (
              <><FaSpinner className="animate-spin" /> Submitting…</>
            ) : paid ? (
              <><FaCheckCircle /> Submit Paper</>
            ) : (
              <><FaFlask /> Complete Payment</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SubmitFullPaper;
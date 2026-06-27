import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaArrowLeft, FaArrowRight, FaCheckCircle, FaFilePdf, FaUpload, FaTrash,
  FaMobileAlt, FaPlus, FaTimes, FaInfoCircle, FaUserPlus, FaQuestionCircle,
} from "react-icons/fa";
import {
  initiateProposalSubmission,
  confirmProposalSubmission,
  verifyPaymentStatus,
} from "../../api/research";
import { formatApiError } from "../../utils/validationErrors";


const SUBMISSION_FEE = 1; // KES — change to 150 for production
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;
const FUNDING_SOURCES = [
  "Self-funded",
  "Institutional",
  "Government Grant",
  "NGO/Donor",
  "Other",
];

const STEP_FIELDS = [
  ["title", "duration", "fundingSource", "abstract"], // step 0 — Study Details
  ["background", "objectives", "methodology", "expectedOutcome"], // step 1 — Methodology & Ethics
  ["file"], // step 2 — Documents & Budget
  [], // step 3 — Review & Payment
];

const STEPS = [
  { label: "Study Details",        sub: "Step 1" },
  { label: "Methodology & Ethics", sub: "Step 2" },
  { label: "Documents & Budget",   sub: "Step 3" },
  { label: "Review & Payment",     sub: "Step 4" },
];

const formatPhone = (v) => {
  const d = v.replace(/\D/g, "");
  if (d.startsWith("0")) return d.slice(0, 10);
  if (d.startsWith("254")) return d.slice(0, 12);
  return d.slice(0, 10);
};

const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;

//  Shared field primitives 
const inputCls = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all
   bg-white placeholder-slate-400 text-slate-800
   ${err
     ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
     : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"}`;

const Field = ({ label, required, error, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <span className="text-xs text-slate-400 normal-case">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const InfoBox = ({ color = "primary", icon, children }) => {
  const map = {
    primary: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error:   "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-start gap-2.5 text-sm leading-relaxed ${map[color]}`}>
      <span className="shrink-0 mt-0.5">{icon || <FaInfoCircle />}</span>
      <span>{children}</span>
    </div>
  );
};

const Spinner = ({ size = 8, color = "border-t-blue-600" }) => (
  <div className={`w-${size} h-${size} border-4 border-slate-200 ${color}
    rounded-full animate-spin shrink-0`} />
);

//  Step 1 — Study Details 
const StepStudyDetails = ({ form, setField, errors }) => (
  <div className="flex flex-col gap-5">
    <Field
      label="Research title"
      required
      error={errors.title}
      hint={`${wordCount(form.title)} words (10–50)`}
    >
      <input
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        placeholder="Enter the full scientific title of your study…"
        className={inputCls(errors.title)}
      />
    </Field>

    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Study duration (months)" required error={errors.duration}>
        <input
          type="number"
          min={1}
          value={form.duration}
          onChange={(e) => setField("duration", e.target.value)}
          placeholder="e.g. 12"
          className={inputCls(errors.duration)}
        />
      </Field>

      <Field label="Funding source" required error={errors.fundingSource}>
        <select
          value={form.fundingSource}
          onChange={(e) => setField("fundingSource", e.target.value)}
          className={inputCls(errors.fundingSource)}
        >
          <option value="" disabled>Select source…</option>
          {FUNDING_SOURCES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </Field>
    </div>

    {/* Discipline indicator — fixed per the portal's current scope */}
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center
        justify-center shrink-0 font-extrabold text-sm text-blue-700">
        Rx
      </div>
      <div>
        <p className="text-xs text-slate-400">Research discipline</p>
        <p className="font-bold text-slate-800 text-sm">Medicine</p>
        <p className="text-xs text-slate-400 mt-0.5">This portal is dedicated to medical research</p>
      </div>
    </div>

    <Field
      label="Abstract"
      required
      error={errors.abstract}
      hint={`${wordCount(form.abstract)} words (min 30, max 300)`}
    >
      <textarea
        rows={5}
        value={form.abstract}
        onChange={(e) => setField("abstract", e.target.value)}
        placeholder="Provide a concise summary of the proposed research (max 300 words)…"
        className={`${inputCls(errors.abstract)} resize-none`}
      />
    </Field>



   
    <CoInvestigators
      list={form.coInvestigators}
      onChange={(list) => setField("coInvestigators", list)}
      error={errors.coInvestigators}
    />
  </div>
);



const CoInvestigators = ({ list, onChange, error }) => {
  const [draft, setDraft] = useState({ name: "", role: "", email: "" });

  const addEntry = () => {
    if (!draft.name.trim() || !draft.role.trim()) return;
    onChange([...list, draft]);
    setDraft({ name: "", role: "", email: "" });
  };

  const removeEntry = (i) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        Co-investigators <span className="text-slate-400 font-normal normal-case">(optional)</span>
      </label>

      {list.length > 0 && (
        <div className="flex flex-col gap-2">
          {list.map((p, i) => (
            <div key={`${p.name}-${i}`}
              className="flex items-center gap-3 border border-slate-200 rounded-xl px-3.5 py-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs
                flex items-center justify-center shrink-0">
                {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                <p className="text-xs text-slate-400 truncate">{p.role}</p>
              </div>
              <button type="button" onClick={() => removeEntry(i)}
                aria-label={`Remove ${p.name}`}
                className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-1">
                <FaTrash className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-2 mt-1">
        <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Full name" className={inputCls(false)} />
        <input value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
          placeholder="Role e.g. Epidemiologist" className={inputCls(false)} />
        <input value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          placeholder="Email (optional)" className={inputCls(false)} />
      </div>
      <button type="button" onClick={addEntry}
        className="self-start flex items-center gap-1.5 text-xs font-semibold text-blue-600
          hover:underline transition-colors cursor-pointer mt-1">
        <FaUserPlus className="text-[10px]" /> Add co-investigator
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

//  Step 2 — Methodology & Ethics 
const StepMethodology = ({ form, setField, errors }) => {
  const fields = [
    { key: "background",  label: "Problem statement", hint: "2–4 sentences", rows: 3,
      placeholder: "What gap or problem does your research address? Why is it important now?" },
    { key: "methodology",  label: "Methodology",       hint: "Brief overview", rows: 3,
      placeholder: "How will you collect and analyse data? e.g. surveys, interviews, lab analysis…" },
    { key: "expectedOutcome", label: "Expected outcomes", hint: null, rows: 3,
      placeholder: "What are the anticipated findings or clinical impacts?" },
  ];

  const setObjective = (i, value) => {
    const next = [...form.objectives];
    next[i] = value;
    setField("objectives", next);
  };
  const addObjective = () => setField("objectives", [...form.objectives, ""]);
  const removeObjective = (i) => setField("objectives", form.objectives.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-5">
      <Field label={fields[0].label} required error={errors.background} hint={fields[0].hint}>
        <textarea rows={fields[0].rows} value={form.background}
          onChange={(e) => setField("background", e.target.value)}
          placeholder={fields[0].placeholder} className={`${inputCls(errors.background)} resize-none`} />
      </Field>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Specific objectives <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col gap-2">
          {form.objectives.map((obj, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{i + 1}.</span>
              <input
                value={obj}
                onChange={(e) => setObjective(i, e.target.value)}
                placeholder="Identify the correlation between…"
                className={inputCls(errors.objectives)}
              />
              {form.objectives.length > 1 && (
                <button type="button" onClick={() => removeObjective(i)}
                  aria-label={`Remove objective ${i + 1}`}
                  className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer shrink-0">
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addObjective}
          className="self-start flex items-center gap-1.5 text-xs font-semibold text-blue-600
            hover:underline transition-colors cursor-pointer mt-1">
          <FaPlus className="text-[10px]" /> Add objective
        </button>
        <p className="text-xs text-slate-400 italic">
          Add at least 3 specific objectives for a complete proposal.
        </p>
        {errors.objectives && <p className="text-xs text-red-500">{errors.objectives}</p>}
      </div>

      <Field label={fields[1].label} required error={errors.methodology} hint={fields[1].hint}>
        <textarea rows={fields[1].rows} value={form.methodology}
          onChange={(e) => setField("methodology", e.target.value)}
          placeholder={fields[1].placeholder} className={`${inputCls(errors.methodology)} resize-none`} />
      </Field>

      <Field label={fields[2].label} required error={errors.expectedOutcome}>
        <textarea rows={fields[2].rows} value={form.expectedOutcome}
          onChange={(e) => setField("expectedOutcome", e.target.value)}
          placeholder={fields[2].placeholder} className={`${inputCls(errors.expectedOutcome)} resize-none`} />
      </Field>
    </div>
  );
};

//  Step 3 — Documents & Budget 
const StepDocuments = ({ file, onFile, onClear, error }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") onFile(f);
    else toast.error("Only PDF files are accepted");
  };

  return (
    <div className="flex flex-col gap-4">
      {!file ? (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`flex flex-col items-center justify-center gap-3.5 px-6 py-10
            border-2 border-dashed rounded-2xl cursor-pointer transition-all
            ${error ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"}`}
        >
          <input type="file" accept=".pdf" className="hidden"
            onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); }} />
          <div className="w-[52px] h-[52px] bg-white border border-slate-200 rounded-2xl
            flex items-center justify-center">
            <FaUpload className="text-blue-600 text-lg" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800 text-sm mb-1">
              Drag & drop or <span className="text-blue-600 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400">PDF only · Max 20 MB</p>
          </div>
        </label>
      ) : (
        <div className="flex items-center gap-3 border border-emerald-200 bg-emerald-50
          rounded-xl px-4 py-3.5">
          <div className="w-[42px] h-[42px] bg-red-50 border border-red-200 rounded-xl
            flex items-center justify-center shrink-0">
            <FaFilePdf className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
          </div>
          <button type="button" onClick={onClear} aria-label="Remove file"
            className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1.5 shrink-0">
            <FaTrash className="text-xs" />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      <InfoBox color="warning">
        Your PDF should include all sections, figures, budget breakdown, and appendices.
        Files are stored securely — no direct URL is exposed.
      </InfoBox>
    </div>
  );
};

//  Step 4 — Review & Payment 
const ReviewRows = ({ form, file }) => {
  const rows = [
    ["Title", form.title],
    ["Duration", form.duration && `${form.duration} months`],
    ["Funding source", form.fundingSource],
    ["Abstract", form.abstract],
    ["Problem statement", form.background],
    ["Objectives", form.objectives.filter(Boolean).join(" · ")],
    ["Methodology", form.methodology],
    ["Expected outcomes", form.expectedOutcome],
       ["Co-investigators", form.coInvestigators.map((p) => `${p.name} (${p.role})`).join(", ")],
  ].filter(([, v]) => v);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {rows.map(([label, value], i) => (
        <div key={label}
          className={`grid grid-cols-[130px_1fr] gap-3 px-3.5 py-2.5 border-b border-slate-100
            last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
          <span className="text-xs font-semibold text-slate-400 pt-0.5">{label}</span>
          <span className="text-sm text-slate-700 leading-relaxed">
            {value.length > 140 ? value.slice(0, 140) + "…" : value}
          </span>
        </div>
      ))}
      {file && (
        <div className="grid grid-cols-[130px_1fr] gap-3 px-3.5 py-2.5 bg-slate-50">
          <span className="text-xs font-semibold text-slate-400">Document</span>
          <span className="text-sm text-slate-700 flex items-center gap-1.5">
            <FaFilePdf className="text-red-500" /> {file.name}
          </span>
        </div>
      )}
    </div>
  );
};

const StepReviewPayment = ({ form, file, onComplete, onServerError }) => {
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState("input"); // input | initiating | waiting | submitting | success | error
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [pollPct, setPollPct] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const buildPayload = () => ({
    title: form.title,
    discipline: form.discipline,
    duration: form.duration,
    fundingSource: form.fundingSource,
    abstract: form.abstract,
    background: form.background,
    objectives: form.objectives.filter(Boolean),
    methodology: form.methodology,
    expectedOutcome: form.expectedOutcome,
       coInvestigators: form.coInvestigators,
  });

  const startPolling = (checkoutRequestId, paymentId) => {
    setStage("waiting");
    setPollPct(0);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      setPollPct(Math.min(Math.round((attempts / POLL_MAX_ATTEMPTS) * 100), 99));
      try {
        const res = await verifyPaymentStatus(checkoutRequestId);
        if (res.status === "completed") {
          clearInterval(pollRef.current);
          setReceipt(res.mpesaReceiptNumber || "");
          submitProposal(paymentId, res.mpesaReceiptNumber);
        } else if (["failed", "cancelled"].includes(res.status)) {
          clearInterval(pollRef.current);
          setError(res.status === "cancelled" ? "Payment was cancelled." : "Payment failed. Please try again.");
          setStage("error");
        }
      } catch (_) {}
      if (attempts >= POLL_MAX_ATTEMPTS) {
        clearInterval(pollRef.current);
        setError("Verification timed out after 2 minutes. Contact support with your M-Pesa receipt.");
        setStage("error");
      }
    }, POLL_INTERVAL_MS);
  };

  const submitProposal = async (paymentId, mpesaReceipt) => {
    setStage("submitting");
    try {
      await confirmProposalSubmission(buildPayload(), paymentId, file);
      setStage("success");
      setTimeout(() => onComplete({ paymentId, receipt: mpesaReceipt }), 1800);
    } catch (err) {
      const { summary } = formatApiError(err);
      setError(`${summary} Your payment was received — please contact support rather than resubmitting.`);
      setStage("error");
    }
  };

  const handlePay = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setError("Enter a valid Safaricom number (10 digits)"); return; }
    setError("");
    setStage("initiating");
    try {
      const res = await initiateProposalSubmission(buildPayload(), phone);
      startPolling(res.checkoutRequestId, res.paymentId);
    } catch (err) {
      const { summary, fieldErrors } = formatApiError(err);
      if (fieldErrors.phone) setError(fieldErrors.phone);
      else { setError(summary); onServerError?.(err); }
      setStage("input");
    }
  };

  if (stage === "initiating") return (
    <div className="flex flex-col items-center gap-4 py-9">
      <Spinner size={10} />
      <div className="text-center">
        <p className="font-bold text-slate-800 mb-1">Initiating payment…</p>
        <p className="text-sm text-slate-400">Sending M-Pesa prompt to <strong>{phone}</strong></p>
      </div>
    </div>
  );

  if (stage === "waiting") return (
    <div className="flex flex-col items-center gap-4 py-9">
      <Spinner size={10} />
      <div className="text-center w-full max-w-xs">
        <p className="font-bold text-slate-800 mb-1">Waiting for confirmation</p>
        <p className="text-sm text-slate-400 mb-4">Enter your M-Pesa PIN on your phone to complete the payment</p>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pollPct}%` }} />
        </div>
        <p className="text-xs text-slate-400">Verifying… {pollPct}%</p>
      </div>
    </div>
  );

  if (stage === "submitting") return (
    <div className="flex flex-col items-center gap-4 py-9">
      <Spinner size={10} color="border-t-emerald-600" />
      <div className="text-center">
        <p className="font-bold text-slate-800 mb-1">Payment confirmed ✓</p>
        {receipt && <p className="text-xs text-slate-400 mb-2">Receipt: <strong>{receipt}</strong></p>}
        <p className="text-sm text-slate-400">Submitting your proposal…</p>
      </div>
    </div>
  );

  if (stage === "success") return (
    <div className="flex flex-col items-center gap-4 py-9">
      <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full
        flex items-center justify-center">
        <FaCheckCircle className="text-emerald-500 text-2xl" />
      </div>
      <div className="text-center">
        <p className="font-bold text-slate-800 text-lg mb-1.5">Proposal submitted successfully!</p>
        <p className="text-sm text-slate-400">Awaiting reviewer assignment. You'll receive an email notification.</p>
        {receipt && <p className="text-xs text-slate-400 mt-2">M-Pesa receipt: <strong>{receipt}</strong></p>}
      </div>
    </div>
  );

  if (stage === "error") return (
    <div className="flex flex-col gap-3.5">
      <InfoBox color="error" icon="⚠">{error}</InfoBox>
      <button type="button" onClick={() => { setStage("input"); setError(""); }}
        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white
          font-semibold text-sm transition-colors cursor-pointer">
        Try again
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <InfoBox color="primary">
        Review your details carefully. Once you proceed to payment your submission will be locked.
      </InfoBox>

      <ReviewRows form={form} file={file} />

      <p className="text-xs text-slate-400 text-center">
        By submitting you confirm this is original work and agree to the repository's publication terms.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">One-time submission fee</p>
          <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
            KES {SUBMISSION_FEE.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 mb-0.5">via</p>
          <p className="font-bold text-emerald-600 flex items-center gap-1.5 text-sm">
            <FaMobileAlt /> M-Pesa
          </p>
        </div>
      </div>

      <InfoBox color="primary">
        Once you click "Pay & Submit", we'll send an STK Push to your phone. Enter your
        PIN to confirm — your proposal submits automatically after payment.
      </InfoBox>

      <Field label="Safaricom number" required error={error}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => { setPhone(formatPhone(e.target.value)); setError(""); }}
          placeholder="0712 345 678"
          className={inputCls(!!error)}
        />
      </Field>

      <button type="button" onClick={handlePay}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white
          font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
        <FaMobileAlt /> Pay KES {SUBMISSION_FEE.toLocaleString()} & submit
      </button>

      <p className="text-xs text-slate-400 text-center">
        M-Pesa prompt will appear on your phone · Proposal submits automatically on confirmation
      </p>
    </div>
  );
};

//  Step bar 
const StepBar = ({ current }) => (
  <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 flex items-center">
    {STEPS.map((s, i) => {
      const done = i < current, active = i === current;
      return (
        <div key={s.label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0
              border-2 transition-colors
              ${done ? "bg-blue-600 border-blue-600 text-white"
                : active ? "border-blue-600 text-blue-600 bg-white"
                : "border-slate-200 text-slate-400 bg-slate-50"}`}>
              {done ? <FaCheckCircle className="text-xs" /> : i + 1}
            </div>
            <div>
              <p className="text-xs text-slate-400">{s.sub}</p>
              <p className={`text-sm font-semibold ${active ? "text-blue-700" : done ? "text-slate-700" : "text-slate-400"}`}>
                {s.label}
              </p>
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 rounded-full ${i < current ? "bg-blue-600" : "bg-slate-200"}`} />
          )}
        </div>
      );
    })}
  </div>
);

//  Submission checklist sidebar 
const checklistStatus = (form, file, step) => [
  {
    label: "Basic Info",
    sub: "Study title and duration entered.",
    done: !!form.title.trim() && !!form.duration,
  },
  {
    label: "Proposal Narrative",
    sub: !form.abstract.trim() || form.objectives.filter(Boolean).length < 3
      ? "Abstract and objectives missing."
      : "Abstract and objectives complete.",
    done: !!form.abstract.trim() && form.objectives.filter(Boolean).length >= 3,
  },
  {
    label: "Methodology Detail",
    sub: !form.methodology.trim() ? "Methodology required." : "Methodology complete.",
    done: !!form.methodology.trim() && !!form.background.trim(),
  },
  {
    label: "Document Upload",
    sub: file ? "Proposal PDF attached." : "Upload your proposal PDF.",
    done: !!file,
  },
  {
    label: "M-Pesa Payment",
    sub: "Process in the final step to submit.",
    done: false,
  },
];

const ChecklistSidebar = ({ form, file, step }) => {
  const items = checklistStatus(form, file, step);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Submission Checklist</h3>
        </div>
        <div className="p-5 space-y-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                shrink-0 mt-0.5 ${item.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                {item.done && <FaCheckCircle className="text-white text-[10px]" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400 italic">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};
 
//  Submit Proposal 
const SubmitProposal = ({ onClose, onSubmitted }) => {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const bodyRef = useRef(null);

  const [form, setFormRaw] = useState({
    title: "",
    discipline: "Medicine",
    duration: "",
    fundingSource: "",
    abstract: "",
    background: "",
    objectives: [""],
    methodology: "",
    expectedOutcome: "",
      coInvestigators: [],
  });

  const setField = (k, v) => {
    setFormRaw((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const validate = (s) => {
    const e = {};

    if (s === 0) {
      const titleWc = wordCount(form.title);
      if (!form.title.trim() || titleWc < 10 || titleWc > 50)
        e.title = `Title must be between 10 and 50 words (currently ${titleWc})`;

      if (!form.duration || Number(form.duration) <= 0)
        e.duration = "Enter a valid study duration in months";

      if (!form.fundingSource) e.fundingSource = "Select a funding source";

      const wc = wordCount(form.abstract);
      if (!form.abstract.trim()) e.abstract = "Abstract is required";
      else if (wc < 30) e.abstract = `Too short — ${wc} words (minimum 30)`;
      else if (wc > 300) e.abstract = `Too long — ${wc} words (maximum 300 words)`;

    }

    if (s === 1) {
      ["background", "methodology", "expectedOutcome"].forEach((k) => {
        if (!form[k].trim()) e[k] = "This field is required";
      });
      const filled = form.objectives.filter((o) => o.trim());
      if (filled.length < 3) e.objectives = "Add at least 3 specific objectives";
    }

    if (s === 2 && !file) e.file = "Please upload your proposal PDF";

    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const back = () => { setErrors({}); setStep((s) => s - 1); };

  const handleComplete = () => {
    toast.success("Proposal submitted successfully!");
    setTimeout(() => { onSubmitted?.(); onClose?.(); }, 2000);
  };

  const handleServerValidationError = (err) => {
    const { fieldErrors } = formatApiError(err);
    const targetStep = STEP_FIELDS.findIndex((fields) => fields.some((f) => fieldErrors[f]));
    if (targetStep !== -1) {
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setStep(targetStep);
    }
  };

  const handleSaveDraft = () => {

    toast.success("Draft saved");
  };

  const stepContent = [
    <StepStudyDetails form={form} setField={setField} errors={errors} />,
    <StepMethodology form={form} setField={setField} errors={errors} />,
    <StepDocuments file={file} onFile={setFile} onClear={() => setFile(null)} error={errors.file} />,
    <StepReviewPayment form={form} file={file} onComplete={handleComplete} onServerError={handleServerValidationError} />,
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submit New Proposal</h1>
      </div>

      <StepBar current={step} />

      {step === 0 && (
        <InfoBox color="primary">
          <span className="font-semibold">Submission Fee Policy:</span> To ensure administrative
          processing and ethics committee review, a one-time M-Pesa processing fee will be
          required in the final step (Review & Payment) to unlock the official review workflow.
        </InfoBox>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-900 text-sm">
                {step === 0 && "Core Proposal Information"}
                {step === 1 && "Methodology & Ethics"}
                {step === 2 && "Documents & Budget"}
                {step === 3 && "Review & Payment"}
              </h2>
            </div>
            <div ref={bodyRef} className="p-6 max-h-[560px] overflow-y-auto">
              {stepContent[step]}
            </div>
          </div>

        
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSaveDraft}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600
                text-sm font-semibold hover:border-slate-300 transition-colors cursor-pointer">
              Save Draft
            </button>

            <div className="flex-1" />

            {step > 0 && step < 3 && (
              <button type="button" onClick={back}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200
                  text-slate-600 text-sm font-semibold hover:border-slate-300
                  transition-colors cursor-pointer">
                <FaArrowLeft className="text-xs" /> Back
              </button>
            )}

            {step < 3 && (
              <button type="button" onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600
                  hover:bg-blue-700 text-white text-sm font-bold transition-colors cursor-pointer">
                Next: {STEPS[step + 1].label} <FaArrowRight className="text-xs" />
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <ChecklistSidebar form={form} file={file} step={step} />
        </div>
      </div>
    </div>
  );
};

export default SubmitProposal;
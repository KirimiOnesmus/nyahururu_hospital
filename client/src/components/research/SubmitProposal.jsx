import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaArrowLeft, FaArrowRight, FaCheckCircle, FaFilePdf,
  FaUpload, FaTrash, FaInfoCircle, FaMobileAlt,
} from "react-icons/fa";
import {
  initiateProposalSubmission,
  confirmProposalSubmission,
  verifyPaymentStatus,
} from "../../api/research";

// ─── Config ───────────────────────────────────────────────────────────────────
const SUBMISSION_FEE = 1; // KES — change to 150 for production
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40; // 40 × 3s = 2 min

const formatPhone = (v) => {
  const d = v.replace(/\D/g, "");
  if (d.startsWith("0"))   return d.slice(0, 10);
  if (d.startsWith("254")) return d.slice(0, 12);
  return d.slice(0, 10);
};

const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;

// ─── Design tokens ────────────────────────────────────────────────────────────
const clr = {
  primary: "#1D4ED8",
  primaryLight: "#EFF6FF",
  primaryBorder: "#BFDBFE",
  success: "#16A34A",
  successLight: "#F0FDF4",
  successBorder: "#BBF7D0",
  error: "#DC2626",
  errorLight: "#FEF2F2",
  errorBorder: "#FECACA",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  warningBorder: "#FDE68A",
  border: "#E2E8F0",
  muted: "#64748B",
  body: "#1E293B",
  surface: "#F8FAFC",
};

// ─── Shared primitives ────────────────────────────────────────────────────────
const inputStyle = (err) => ({
  width: "100%",
  padding: "9px 13px",
  border: `1px solid ${err ? clr.error : clr.border}`,
  borderRadius: 10,
  fontSize: 14,
  color: clr.body,
  background: err ? clr.errorLight : "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
});

const Field = ({ label, required, error, hint, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: clr.body }}>
        {label}{required && <span style={{ color: clr.error, marginLeft: 2 }}>*</span>}
      </label>
      {hint && <span style={{ fontSize: 11, color: clr.muted }}>{hint}</span>}
    </div>
    {children}
    {error && <p style={{ fontSize: 12, color: clr.error, margin: 0 }}>{error}</p>}
  </div>
);

const InfoBox = ({ color = "primary", icon = "ℹ", children }) => {
  const map = { primary: [clr.primaryLight, clr.primaryBorder, clr.primary], warning: [clr.warningLight, clr.warningBorder, clr.warning], success: [clr.successLight, clr.successBorder, clr.success], error: [clr.errorLight, clr.errorBorder, clr.error] };
  const [bg, border, txt] = map[color] || map.primary;
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: txt }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ lineHeight: 1.55 }}>{children}</span>
    </div>
  );
};

const Spinner = ({ size = 22, color = clr.primary }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", border: `2.5px solid ${color}22`, borderTopColor: color, animation: "spin 0.65s linear infinite", flexShrink: 0 }} />
);

// ─── Step 1 — Basics ──────────────────────────────────────────────────────────
const StepBasics = ({ form, setField, errors }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <Field label="Research title" required error={errors.title} hint="Be descriptive">
      <input
        value={form.title} onChange={e => setField("title", e.target.value)}
        placeholder="e.g. Impact of X on Y in Laikipia County"
        style={inputStyle(errors.title)}
      />
    </Field>

    <div style={{ background: clr.primaryLight, border: `1px solid ${clr.primaryBorder}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, background: "#fff", border: `1px solid ${clr.primaryBorder}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 14, color: clr.primary }}>Rx</div>
      <div>
        <p style={{ fontSize: 11, color: clr.muted, margin: "0 0 2px" }}>Research discipline</p>
        <p style={{ fontWeight: 700, color: clr.body, margin: 0 }}>Medicine</p>
        <p style={{ fontSize: 11, color: clr.muted, margin: "2px 0 0" }}>This portal is dedicated to medical research</p>
      </div>
    </div>

    <Field label="Abstract" required error={errors.abstract} hint={`${wordCount(form.abstract)} words (min 30)`}>
      <div style={{ position: "relative" }}>
        <textarea
          rows={5} value={form.abstract} onChange={e => setField("abstract", e.target.value)}
          placeholder="A brief summary of what you're researching, why it matters, and what you expect to find…"
          style={{ ...inputStyle(errors.abstract), resize: "vertical", paddingBottom: 24 }}
        />
        <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 11, color: clr.muted, pointerEvents: "none" }}>
          {wordCount(form.abstract)} words
        </span>
      </div>
    </Field>
  </div>
);

// ─── Step 2 — Research details ────────────────────────────────────────────────
const StepResearch = ({ form, setField, errors }) => {
  const fields = [
    { key: "background",      label: "Problem statement",  hint: "2–4 sentences",  rows: 3, placeholder: "What gap or problem does your research address? Why is it important now?" },
    { key: "objectives",      label: "Objectives",          hint: "One per line",   rows: 3, placeholder: "1. To investigate…\n2. To determine…\n3. To assess…" },
    { key: "methodology",     label: "Methodology",         hint: "Brief overview", rows: 3, placeholder: "How will you collect and analyse data? e.g. surveys, interviews, lab analysis…" },
    { key: "expectedOutcome", label: "Expected outcome",    hint: null,             rows: 2, placeholder: "What will this research produce or contribute?" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {fields.map(({ key, label, hint, rows, placeholder }) => (
        <Field key={key} label={label} required error={errors[key]} hint={hint}>
          <textarea rows={rows} value={form[key]} onChange={e => setField(key, e.target.value)}
            placeholder={placeholder}
            style={{ ...inputStyle(errors[key]), resize: "vertical" }}
          />
        </Field>
      ))}
      <Field label="Timeline / Duration" required error={errors.timeline}>
        <input value={form.timeline} onChange={e => setField("timeline", e.target.value)}
          placeholder="e.g. 6 months (Jan–Jun 2025)"
          style={inputStyle(errors.timeline)}
        />
      </Field>
    </div>
  );
};

// ─── Step 3 — Upload ──────────────────────────────────────────────────────────
const StepUpload = ({ file, onFile, onClear, error }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") onFile(f);
    else toast.error("Only PDF files are accepted");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!file ? (
        <label
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 14, padding: "40px 24px",
            border: `2px dashed ${error ? clr.error : clr.border}`,
            borderRadius: 14, cursor: "pointer",
            background: error ? clr.errorLight : clr.surface,
            transition: "all 0.15s",
          }}
        >
          <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) onFile(f); }} />
          <div style={{ width: 52, height: 52, background: "#fff", border: `1px solid ${clr.border}`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaUpload style={{ color: clr.primary, fontSize: 20 }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 600, color: clr.body, margin: "0 0 4px", fontSize: 14 }}>
              Drag & drop or <span style={{ color: clr.primary, textDecoration: "underline" }}>browse files</span>
            </p>
            <p style={{ fontSize: 12, color: clr.muted, margin: 0 }}>PDF only · Max 20 MB</p>
          </div>
        </label>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `1px solid ${clr.successBorder}`, borderRadius: 12, background: clr.successLight }}>
          <div style={{ width: 42, height: 42, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FaFilePdf style={{ color: clr.error, fontSize: 18 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: clr.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
            <p style={{ fontSize: 12, color: clr.muted, margin: 0 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
          </div>
          <button type="button" onClick={onClear}
            style={{ background: "none", border: "none", cursor: "pointer", color: clr.muted, padding: 6, borderRadius: 8, display: "flex" }}
            onMouseEnter={e => e.currentTarget.style.color = clr.error}
            onMouseLeave={e => e.currentTarget.style.color = clr.muted}
          >
            <FaTrash size={13} />
          </button>
        </div>
      )}
      {error && <p style={{ fontSize: 12, color: clr.error, margin: 0 }}>{error}</p>}
      <InfoBox color="warning" >
        Your PDF should include all sections, figures, and appendices. Files are stored securely — no direct URL is exposed.
      </InfoBox>
    </div>
  );
};

// ─── Step 4 — Review ─────────────────────────────────────────────────────────
const StepReview = ({ form, file }) => {
  const rows = [
    ["Title", form.title], ["Discipline", form.discipline],
    ["Abstract", form.abstract], ["Problem statement", form.background],
    ["Objectives", form.objectives], ["Methodology", form.methodology],
    ["Expected outcome", form.expectedOutcome], ["Timeline", form.timeline],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <InfoBox color="primary" icon="ℹ">
        Review your details carefully. Once you proceed to payment your submission will be locked.
      </InfoBox>
      <div style={{ border: `1px solid ${clr.border}`, borderRadius: 12, overflow: "hidden" }}>
        {rows.filter(([, v]) => v).map(([label, value], i) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, padding: "10px 14px", background: i % 2 === 0 ? "#fff" : clr.surface, borderBottom: `1px solid ${clr.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: clr.muted, paddingTop: 1 }}>{label}</span>
            <span style={{ fontSize: 13, color: clr.body, lineHeight: 1.55 }}>
              {value.length > 140 ? value.slice(0, 140) + "…" : value}
            </span>
          </div>
        ))}
        {file && (
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, padding: "10px 14px", background: rows.filter(([, v]) => v).length % 2 === 0 ? "#fff" : clr.surface }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: clr.muted }}>Document</span>
            <span style={{ fontSize: 13, color: clr.body, display: "flex", alignItems: "center", gap: 6 }}>
              <FaFilePdf style={{ color: clr.error }} /> {file.name}
            </span>
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, color: clr.muted, textAlign: "center", margin: 0 }}>
        By submitting you confirm this is original work and agree to the repository's publication terms.
      </p>
    </div>
  );
};

// ─── Step 5 — Payment ────────────────────────────────────────────────────────
const StepPayment = ({ form, file, onComplete }) => {
  const [phone, setPhone]       = useState("");
  const [stage, setStage]       = useState("input");
  const [error, setError]       = useState("");
  const [receipt, setReceipt]   = useState("");
  const [pollPct, setPollPct]   = useState(0);
  const pollRef                 = useRef(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startPolling = (checkoutRequestId, paymentId) => {
    setStage("waiting"); setPollPct(0);
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
      } catch (_) {  }
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
      const fd = new FormData();
      const allowed = ["title","discipline","abstract","background","objectives","methodology","expectedOutcome","timeline"];
      allowed.forEach(k => { if (form[k]) fd.append(k, form[k]); });
      if (file) fd.append("proposalFile", file);
      await confirmProposalSubmission(form, paymentId, file);
      setStage("success");
      setTimeout(() => onComplete({ paymentId, receipt: mpesaReceipt }), 1800);
    } catch (err) {
      setError(err.message || "Proposal submission failed after payment. Please contact support — your payment was received.");
      setStage("error");
    }
  };

  const handlePay = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setError("Enter a valid Safaricom number (10 digits)"); return; }
    setError(""); setStage("initiating");
    try {
      const res = await initiateProposalSubmission({
        title: form.title, discipline: form.discipline, abstract: form.abstract,
        background: form.background, objectives: form.objectives, methodology: form.methodology,
        expectedOutcome: form.expectedOutcome, timeline: form.timeline,
      }, phone);
      startPolling(res.checkoutRequestId, res.paymentId);
    } catch (err) {
      setError(err.message || "Failed to initiate payment. Check your number and try again.");
      setStage("input");
    }
  };


  if (stage === "initiating") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "36px 0" }}>
      <Spinner size={40} />
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, color: clr.body, margin: "0 0 4px" }}>Initiating payment…</p>
        <p style={{ fontSize: 13, color: clr.muted, margin: 0 }}>Sending M-Pesa prompt to <strong>{phone}</strong></p>
      </div>
    </div>
  );

  if (stage === "waiting") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "36px 0" }}>
      <Spinner size={40} />
      <div style={{ textAlign: "center", width: "100%", maxWidth: 280 }}>
        <p style={{ fontWeight: 700, color: clr.body, margin: "0 0 4px" }}>Waiting for confirmation</p>
        <p style={{ fontSize: 13, color: clr.muted, margin: "0 0 16px" }}>Enter your M-Pesa PIN on your phone to complete the payment</p>
        <div style={{ height: 6, background: clr.surface, borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", width: `${pollPct}%`, background: clr.primary, borderRadius: 99, transition: "width 1s ease" }} />
        </div>
        <p style={{ fontSize: 11, color: clr.muted, margin: 0 }}>Verifying… {pollPct}%</p>
      </div>
    </div>
  );

  if (stage === "submitting") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "36px 0" }}>
      <Spinner size={40} color={clr.success} />
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, color: clr.body, margin: "0 0 4px" }}>Payment confirmed ✓</p>
        {receipt && <p style={{ fontSize: 12, color: clr.muted, margin: "0 0 8px" }}>Receipt: <strong>{receipt}</strong></p>}
        <p style={{ fontSize: 13, color: clr.muted, margin: 0 }}>Submitting your proposal…</p>
      </div>
    </div>
  );

  if (stage === "success") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "36px 0" }}>
      <div style={{ width: 64, height: 64, background: clr.successLight, border: `1px solid ${clr.successBorder}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FaCheckCircle style={{ color: clr.success, fontSize: 28 }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, color: clr.body, margin: "0 0 6px", fontSize: 17 }}>Proposal submitted successfully!</p>
        <p style={{ fontSize: 13, color: clr.muted, margin: 0 }}>Awaiting reviewer assignment. You'll receive an email notification.</p>
        {receipt && <p style={{ fontSize: 12, color: clr.muted, margin: "8px 0 0" }}>M-Pesa receipt: <strong>{receipt}</strong></p>}
      </div>
    </div>
  );

  if (stage === "error") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <InfoBox color="error" icon="⚠">{error}</InfoBox>
      <button onClick={() => { setStage("input"); setError(""); }}
        style={{ padding: "11px 0", background: clr.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}>
        Try again
      </button>
    </div>
  );

  // ── Input state ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: clr.primaryLight, border: `1px solid ${clr.primaryBorder}`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 12, color: clr.muted, margin: "0 0 2px" }}>One-time submission fee</p>
          <p style={{ fontSize: 30, fontWeight: 800, color: clr.body, margin: 0, letterSpacing: "-1px" }}>KES {SUBMISSION_FEE.toLocaleString()}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: clr.muted, margin: "0 0 2px" }}>via</p>
          <p style={{ fontWeight: 700, color: clr.success, margin: 0, display: "flex", alignItems: "center", gap: 5, fontSize: 15 }}>
            <FaMobileAlt /> M-Pesa
          </p>
        </div>
      </div>

      <InfoBox color="primary" icon="ℹ">
        Once you click "Pay & Submit", we'll send an STK Push to your phone. Enter your PIN to confirm — your proposal submits automatically after payment.
      </InfoBox>

      <Field label="Safaricom number" required error={error}>
        <input type="tel" value={phone} onChange={e => { setPhone(formatPhone(e.target.value)); setError(""); }}
          placeholder="0712 345 678" style={inputStyle(!!error)} />
      </Field>

      <button onClick={handlePay}
        style={{ padding: "13px 0", background: clr.primary, color: "#fff", border: "none", borderRadius: 11, fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = "#1E40AF"}
        onMouseLeave={e => e.currentTarget.style.background = clr.primary}
      >
        <FaMobileAlt /> Pay KES {SUBMISSION_FEE.toLocaleString()} & submit
      </button>

      <p style={{ fontSize: 12, color: clr.muted, textAlign: "center", margin: 0 }}>
        M-Pesa prompt will appear on your phone · Proposal submits automatically on confirmation
      </p>
    </div>
  );
};


const STEPS = ["Basics", "Research", "Upload", "Review", "Payment"];

const StepBar = ({ current }) => (
  <div style={{ display: "flex", alignItems: "center", padding: "20px 32px 0" }}>
    {STEPS.map((label, i) => {
      const done = i < current, active = i === current;
      return (
        <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700,
              background: done ? clr.primary : active ? "#fff" : clr.surface,
              color: done ? "#fff" : active ? clr.primary : clr.muted,
              border: active ? `2px solid ${clr.primary}` : done ? "none" : `1.5px solid ${clr.border}`,
              transition: "all 0.3s",
            }}>
              {done ? <FaCheckCircle size={13} /> : i + 1}
            </div>
            <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? clr.primary : done ? "#93C5FD" : clr.muted, whiteSpace: "nowrap" }}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 1.5, background: i < current ? clr.primary : clr.border, margin: "0 6px", marginBottom: 20, transition: "background 0.4s" }} />
          )}
        </div>
      );
    })}
  </div>
);


const SubmitProposal = ({ onClose, onSubmitted }) => {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [done, setDone] = useState(false);
  const bodyRef = useRef(null);

  const [form, setFormRaw] = useState({
    title: "", discipline: "Medicine", abstract: "",
    background: "", objectives: "", methodology: "",
    expectedOutcome: "", timeline: "",
  });

  const setField = (k, v) => { setFormRaw(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.title.trim() || form.title.length < 10) e.title = "Title must be at least 10 characters";
      const wc = wordCount(form.abstract);
      if (!form.abstract.trim()) e.abstract = "Abstract is required";
      else if (wc < 30) e.abstract = `Too short — ${wc} words (minimum 30)`;
    }
    if (s === 1) {
      ["background","objectives","methodology","expectedOutcome","timeline"]
        .forEach(k => { if (!form[k].trim()) e[k] = "This field is required"; });
    }
    if (s === 2 && !file) e.file = "Please upload your proposal PDF";
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setStep(s => s + 1);
  };

  const back = () => { setErrors({}); setStep(s => s - 1); };

  const handleComplete = (data) => {
    setDone(true);
    toast.success("Proposal submitted successfully!");
    setTimeout(() => { onSubmitted?.(); onClose(); }, 2000);
  };

  const stepContent = [
    <StepBasics form={form} setField={setField} errors={errors} />,
    <StepResearch form={form} setField={setField} errors={errors} />,
    <StepUpload file={file} onFile={setFile} onClear={() => setFile(null)} error={errors.file} />,
    <StepReview form={form} file={file} />,
    <StepPayment form={form} file={file} onComplete={handleComplete} />,
  ];

  const stepTitles = ["Basic information", "Research details", "Upload document", "Review & confirm", "Complete payment"];
  const stepSubs   = [
    "Tell us your title, discipline, and what your research is about.",
    "Describe the problem, objectives, and how you'll conduct the research.",
    "Upload your full proposal document as a PDF.",
    "Check all details before proceeding to payment.",
    `A one-time fee of KES ${SUBMISSION_FEE.toLocaleString()} is required. Your proposal submits automatically after payment confirmation.`,
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: clr.primary, borderRadius: "16px 16px 0 0", padding: "20px 28px", display: "flex", alignItems: "center", gap: 14 }}>
        <div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 17, margin: 0 }}>Submit research proposal</p>
          <p style={{ color: "#93C5FD", fontSize: 12, margin: 0 }}>Nyahururu Research Portal · Stage 1 of 3</p>
        </div>
      </div>

      
      <StepBar current={step} />

      
      <div style={{ padding: "18px 32px 4px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: clr.body }}>{stepTitles[step]}</h3>
        <p style={{ margin: 0, fontSize: 13, color: clr.muted }}>{stepSubs[step]}</p>
      </div>

  
      <div ref={bodyRef} style={{ padding: "16px 32px 8px", maxHeight: 420, overflowY: "auto" }}>
        {stepContent[step]}
      </div>

 
      <div style={{ padding: "16px 32px 20px", borderTop: `1px solid ${clr.border}`, background: clr.surface, borderRadius: "0 0 16px 16px", display: "flex", gap: 10 }}>
        {step > 0 && !done && (
          <button type="button" onClick={back}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: `1.5px solid ${clr.border}`, borderRadius: 10, background: "#fff", color: clr.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = clr.primary; e.currentTarget.style.color = clr.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = clr.border; e.currentTarget.style.color = clr.muted; }}
          >
            <FaArrowLeft size={11} /> Back
          </button>
        )}
        {step < 4 && !done && (
          <button type="button" onClick={next}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", background: clr.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1E40AF"}
            onMouseLeave={e => e.currentTarget.style.background = clr.primary}
          >
            Continue <FaArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SubmitProposal;
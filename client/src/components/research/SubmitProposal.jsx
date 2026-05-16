import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaFlask,
  FaFileAlt,
  FaBullseye,
  FaUpload,
  FaFilePdf,
  FaTrash,
  FaMobileAlt,
  FaCheckCircle,
  FaSpinner,
  FaChevronDown,
  FaArrowRight,
  FaArrowLeft,
  FaInfoCircle,
  FaArrowUp,
} from "react-icons/fa";
import {
  initiateProposalSubmission,
  confirmProposalSubmission,
  verifyPaymentStatus,
} from "../../api/research";

const DISCIPLINES = ["Medicine"];
const SUBMISSION_FEE = 1; // Set to 1 KES for testing. Change to 150 for production.

const formatPhone = (v) => {
  const d = v.replace(/\D/g, "");
  if (d.startsWith("0")) return d.slice(0, 10);
  if (d.startsWith("254")) return d.slice(0, 12);
  return d.slice(0, 10);
};

const STEPS = [
  { id: "basics", label: "Basics", icon: FaFileAlt },
  { id: "research", label: "Research", icon: FaBullseye },
  { id: "upload", label: "Upload", icon: FaUpload },
  { id: "review", label: "Review", icon: FaFlask },
  { id: "payment", label: "Payment", icon: FaMobileAlt },
];

const inputCls = (err) =>
  `w-full px-3.5 py-2.5 border rounded-lg text-gray-800 placeholder-gray-400 text-sm
  outline-none focus:ring focus:ring-blue-500 transition-all bg-gray-50 hover:border-gray-300
   ${err ? "border-red-400 bg-red-50" : "border-gray-200"}`;

const Field = ({ label, error, required, hint, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const StepBasics = ({ form, setField, errors }) => (
  <div className="space-y-5">
    <Field
      label="Research Title"
      required
      error={errors.title}
      hint="Be specific"
    >
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
        <p className="text-xs text-gray-500 mt-0.5">
          This portal is dedicated to medical research.
        </p>
      </div>
    </div>

    <Field
      label="Abstract"
      required
      error={errors.abstract}
      hint="50–200 words"
    >
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

const StepResearch = ({ form, setField, errors }) => (
  <div className="space-y-5">
    <Field
      label="Problem Statement"
      required
      error={errors.background}
      hint="2–4 sentences"
    >
      <textarea
        rows={3}
        placeholder="What gap or problem does your research address? Why is it important now?"
        value={form.background}
        onChange={(e) => setField("background", e.target.value)}
        className={`${inputCls(errors.background)} resize-none`}
      />
    </Field>

    <Field
      label="Objectives"
      required
      error={errors.objectives}
      hint="One per line"
    >
      <textarea
        rows={3}
        placeholder={
          "1. To investigate...\n2. To determine...\n3. To assess..."
        }
        value={form.objectives}
        onChange={(e) => setField("objectives", e.target.value)}
        className={`${inputCls(errors.objectives)} resize-none`}
      />
    </Field>

    <Field
      label="Methodology"
      required
      error={errors.methodology}
      hint="Brief overview"
    >
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
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files[0];
              if (f) onFile(f);
            }}
          />
          <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
            <FaUpload className="text-blue-500 text-xl" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700 text-sm">
              Drag & drop or{" "}
              <span className="text-blue-600 underline underline-offset-2">
                browse files
              </span>
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
            <p className="text-sm font-semibold text-gray-800 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 
            rounded-lg hover:bg-red-50 cursor-pointer"
          >
            <FaTrash size={14} />
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 flex gap-2 items-start">
        <FaInfoCircle className="text-yellow-500 mt-0.5 flex-shrink-0 text-xs" />
        <p className="text-xs text-yellow-700 leading-relaxed">
          Your PDF should include all sections, figures, and appendices. Files
          are stored securely — no direct URL is exposed.
        </p>
      </div>
    </div>
  );
};

const StepReview = ({ form, file }) => {
  const rows = [
    { label: "Title", value: form.title },
    { label: "Discipline", value: form.discipline },
    { label: "Abstract", value: form.abstract },
    { label: "Problem Statement", value: form.background },
    { label: "Objectives", value: form.objectives },
    { label: "Methodology", value: form.methodology },
    { label: "Expected Outcome", value: form.expectedOutcome },
    { label: "Duration", value: form.timeline },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-2 items-start">
        <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0 text-sm" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Please review your submission details below. After confirmation,
          you'll proceed to payment.
        </p>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
        {rows.map(
          ({ label, value }) =>
            value && (
              <div key={label} className="px-4 py-3 flex gap-3">
                <span className="text-xs font-semibold text-gray-400 w-32 flex-shrink-0 pt-0.5">
                  {label}
                </span>
                <span className="text-xs text-gray-700 leading-relaxed flex-1 line-clamp-2">
                  {value}
                </span>
              </div>
            ),
        )}
        {file && (
          <div className="px-4 py-3 flex gap-3 items-center">
            <span className="text-xs font-semibold text-gray-400 w-32 flex-shrink-0">
              Document
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-700">
              <FaFilePdf className="text-red-500" /> {file.name}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center pt-1">
        By submitting you confirm this is original work and agree to the
        repository's publication terms.
      </p>
    </div>
  );
};

const StepPayment = ({ form, file, onPaymentComplete }) => {
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState("input");
  const [error, setError] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const [pollProgress, setPollProgress] = useState(0);
  const pollIntervalRef = useRef(null);
  const abortControllerRef = useRef(new AbortController());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      abortControllerRef.current.abort();
    };
  }, []);

  const pollPaymentAndSubmit = async (checkoutRequestId, paymentId) => {
    let attempts = 0;
    const maxAttempts = 40; // Poll for up to 2 minutes (40 attempts x 3 seconds)

    setStage("waiting");
    setPollProgress(0);

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      const progress = (attempts / maxAttempts) * 100;
      setPollProgress(progress);

      try {
        if (abortControllerRef.current.signal.aborted) {
          clearInterval(pollIntervalRef.current);
          return;
        }

        const result = await verifyPaymentStatus(checkoutRequestId);
        console.log("Payment status:", result.status);

        if (result.status === "completed") {
          clearInterval(pollIntervalRef.current);
          setPaymentData({
            paymentId,
            transactionCode: result.transactionId || checkoutRequestId,
            mpesaReceiptNumber: result.mpesaReceiptNumber,
          });

          setStage("success");
          console.log("✅ Payment confirmed, submitting proposal...");

          // Wait 1.5 seconds to show success, then submit proposal
          setTimeout(() => submitProposal(paymentId), 1500);
        } else if (
          result.status === "failed" ||
          result.status === "cancelled"
        ) {
          clearInterval(pollIntervalRef.current);
          setStage("error");
          setError(
            result.status === "cancelled"
              ? "Payment was cancelled. Please try again."
              : "Payment failed. Please try again.",
          );
          console.log("❌ Payment failed");
        }
      } catch (err) {
        console.error("Payment status check error:", err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollIntervalRef.current);
        setStage("error");
        setError(
          "Payment verification timed out after 2 minutes. Please contact support.",
        );
        console.log("⏱️ Payment polling timeout");
      }
    }, 3000); // Poll every 3 seconds
  };

  const submitProposal = async (paymentId) => {
    try {
      setStage("processing");
      console.log("📝 Submitting proposal with paymentId:", paymentId);

      const result = await confirmProposalSubmission(
        {
          title: form.title,
          discipline: form.discipline,
          abstract: form.abstract,
          background: form.background,
          objectives: form.objectives,
          methodology: form.methodology,
          expectedOutcome: form.expectedOutcome,
          timeline: form.timeline,
        },
        paymentId,
        file
      );

      console.log("✅ Proposal submitted successfully:", result);
      setStage("success");

      // Notify parent component
      onPaymentComplete({
        paymentId,
        researchId: result.research?.id,
        status: "completed",
      });

      toast.success("Proposal submitted successfully! 🎉");
    } catch (err) {
      console.error("Proposal submission error:", err);
      setStage("error");
      setError(
        err.message ||
          "Failed to submit proposal after payment. Please contact support.",
      );
      toast.error("Proposal submission failed: " + err.message);
    }
  };

  const handleComplete = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid Safaricom number");
      return;
    }

    setError("");
    setStage("processing");

    try {
      console.log("🚀 Initiating payment for phone:", phone);

      // Step 1: Initiate M-Pesa STK Push
      const result = await initiateProposalSubmission(
        {
          title: form.title,
          discipline: form.discipline,
          abstract: form.abstract,
          background: form.background,
          objectives: form.objectives,
          methodology: form.methodology,
          expectedOutcome: form.expectedOutcome,
          timeline: form.timeline,
        },
        phone,
      );

      console.log("📱 STK Push initiated:", result);
      setPaymentData(result);

      // Step 2: Start polling payment status and auto-submit proposal
      pollPaymentAndSubmit(result.checkoutRequestId, result.paymentId);
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(err.message || "Failed to initiate payment");
      setStage("input");
    }
  };

  // Processing state - showing spinner while initiating STK
  if (stage === "processing" && !paymentData)
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <FaSpinner className="text-4xl text-blue-600 animate-spin" />
        <div className="text-center">
          <p className="font-bold text-gray-900 text-lg">Initiating Payment</p>
          <p className="text-gray-500 text-sm mt-1">
            Sending M-Pesa prompt to <strong>{phone}</strong>…
          </p>
        </div>
      </div>
    );

  // Waiting state - polling payment status
  if (stage === "waiting")
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <FaSpinner className="text-4xl text-blue-600 animate-spin" />
        <div className="text-center">
          <p className="font-bold text-gray-900 text-lg">Waiting for Payment</p>
          <p className="text-gray-500 text-sm mt-1">
            Enter your M-Pesa PIN on your phone to confirm payment.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Verifying…{" "}
            <span className="font-semibold">{Math.round(pollProgress)}%</span>
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pollProgress}%` }}
            />
          </div>
        </div>
      </div>
    );

  // Processing state - submitting proposal
  if (stage === "processing" && paymentData)
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <FaSpinner className="text-4xl text-green-600 animate-spin" />
        <div className="text-center">
          <p className="font-bold text-gray-900 text-lg">Payment Confirmed</p>
          <p className="text-gray-500 text-sm mt-1">
            Receipt: <strong>{paymentData.mpesaReceiptNumber}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Submitting your proposal to the system…
          </p>
        </div>
      </div>
    );

  // Success state
  if (stage === "success")
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <FaCheckCircle className="text-3xl text-green-600" />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900 text-lg">
            Proposal Submitted Successfully!
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Your research proposal has been received and is awaiting reviewer
            feedback.
          </p>
          {paymentData?.mpesaReceiptNumber && (
            <p className="text-xs text-gray-400 mt-3">
              M-Pesa Receipt: <strong>{paymentData.mpesaReceiptNumber}</strong>
            </p>
          )}
        </div>
      </div>
    );

  // Error state
  if (stage === "error")
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-4 flex gap-3 items-start">
          <FaInfoCircle className="text-red-500 mt-0.5 flex-shrink-0 text-sm" />
          <div>
            <p className="text-sm font-semibold text-red-700">Error</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setStage("input");
            setError("");
            setPaymentData(null);
            setPollProgress(0);
            abortControllerRef.current = new AbortController();
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );

  // Input state - phone number and complete button
  return (
    <div className="space-y-5">
      {/* Amount card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">
            One-time submission fee
          </p>
          <p className="text-3xl font-extrabold text-gray-900">
            KES {SUBMISSION_FEE}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-0.5">via</p>
          <p className="font-extrabold text-green-600 flex items-center gap-1">
            <FaMobileAlt /> M-Pesa
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex gap-2 items-start">
        <FaInfoCircle className="text-blue-400 mt-0.5 flex-shrink-0 text-sm" />
        <p className="text-xs text-blue-700 leading-relaxed">
          This is a one-time fee per proposal. Once you click "Complete", we'll
          send an M-Pesa prompt to your phone. Enter your PIN to confirm, and
          your proposal will be automatically submitted.
        </p>
      </div>

      {/* Phone input */}
      <Field label="Safaricom Number" required error={error}>
        <input
          type="tel"
          placeholder="0712 345 678"
          value={phone}
          onChange={(e) => {
            setPhone(formatPhone(e.target.value));
            setError("");
          }}
          className={inputCls(error)}
        />
      </Field>

      {/* Single Complete button */}
      <button
        onClick={handleComplete}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600
         hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 
         rounded-xl transition-all hover:shadow-lg flex items-center justify-center 
         gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaMobileAlt /> Complete & Pay KES {SUBMISSION_FEE}
      </button>

      <p className="text-center text-xs text-gray-400">
        M-Pesa prompt will appear on your phone · Your proposal will be
        submitted automatically
      </p>
    </div>
  );
};

const SubmitProposal = ({ onClose, onSubmitted }) => {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [proposalFile, setFile] = useState(null);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const bodyRef = useRef(null);

  const [form, setFormState] = useState({
    title: "",
    discipline: "Medicine",
    abstract: "",
    background: "",
    objectives: "",
    methodology: "",
    expectedOutcome: "",
    timeline: "",
  });

  const setField = (k, v) => {
    setFormState((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  };

  // Scroll body to top on step change
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Validation per step
  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.title.trim() || form.title.length < 10)
        e.title = "Please enter a descriptive title (min 10 chars)";
      const wc = form.abstract.trim().split(/\s+/).filter(Boolean).length;
      if (!form.abstract.trim()) e.abstract = "Abstract is required";
      else if (wc < 30) e.abstract = `Too short — ${wc} words (min 30)`;
    }
    if (s === 1) {
      if (!form.background.trim()) e.background = "Required";
      if (!form.objectives.trim()) e.objectives = "Required";
      if (!form.methodology.trim()) e.methodology = "Required";
      if (!form.expectedOutcome.trim()) e.expectedOutcome = "Required";
      if (!form.timeline.trim()) e.timeline = "Required";
    }
    if (s === 2) {
      if (!proposalFile) e.proposalFile = "Please upload your proposal PDF";
    }
    return e;
  };

  const next = () => {
    const errs = validate(step);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const back = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handlePaymentComplete = (paymentData) => {
    setSubmissionComplete(true);
    console.log("Payment and submission complete:", paymentData);

    // Auto-close modal after 2 seconds to show success
    setTimeout(() => {
      onSubmitted?.();
      onClose();
    }, 2000);
  };

  const isLastStep = step === STEPS.length - 1;

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepBasics form={form} setField={setField} errors={errors} />;
      case 1:
        return <StepResearch form={form} setField={setField} errors={errors} />;
      case 2:
        return (
          <StepUpload
            file={proposalFile}
            onFile={setFile}
            onClear={() => setFile(null)}
            error={errors.proposalFile}
          />
        );
      case 3:
        return <StepReview form={form} file={proposalFile} />;
      case 4:
        return (
          <StepPayment
            form={form}
            file={proposalFile}
            onPaymentComplete={handlePaymentComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-2">
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-gray-600 hover:cursor-pointer hover:text-gray-900 transition-colors mb-6"
      >
        <FaArrowLeft /> Back to Dashboard
      </button>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
              <FaFlask className="text-white text-lg" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Submit Proposal</p>
              <p className="text-blue-200 text-sm">
                Research Portal · Stage 1 of 3
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const done = i < step;
              const current = i === step;
              const Icon = s.icon;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2
                    ${
                      done
                        ? "bg-blue-600 border-blue-600 text-white"
                        : current
                          ? "bg-white border-blue-600 text-blue-600 shadow-sm"
                          : "bg-gray-100 border-gray-200 text-gray-400"
                    }`}
                    >
                      {done ? (
                        <FaCheckCircle className="text-sm" />
                      ) : (
                        <Icon className="text-sm" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap
                    ${current ? "text-blue-600 font-bold" : done ? "text-blue-400" : "text-gray-400"}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mb-8 transition-all duration-500 ${i < step ? "bg-blue-500" : "bg-gray-200"}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="px-8 pt-6 pb-2">
          <h3 className="font-bold text-gray-900 text-lg">
            {step === 0 && "Basic Information"}
            {step === 1 && "Research Details"}
            {step === 2 && "Upload Document"}
            {step === 3 && "Review & Submit"}
            {step === 4 && "Complete Payment & Submit"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {step === 0 &&
              "Tell us the title, discipline, and what your research is about."}
            {step === 1 &&
              "Describe the problem, objectives, and how you'll conduct the research."}
            {step === 2 && "Upload your full proposal document as a PDF."}
            {step === 3 && "Check your details before final submission."}
            {step === 4 &&
              `A one-time fee of KES ${SUBMISSION_FEE} is required. Your proposal will be automatically submitted after payment confirmation.`}
          </p>
        </div>

        <div
          ref={bodyRef}
          className="px-8 py-6 overflow-y-auto"
          style={{ maxHeight: "500px" }}
        >
          {renderStep()}
        </div>

        <div className="px-8 py-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
          {step > 0 && !submissionComplete && (
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

          {!isLastStep && !submissionComplete && (
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
        </div>
      </div>
    </div>
  );
};

export default SubmitProposal;

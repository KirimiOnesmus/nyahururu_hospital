import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import {
  FaCertificate, FaClock, FaCalendarAlt, FaFileAlt, FaAward, FaEye,
  FaDownload, FaQrcode, FaTimes, FaInfoCircle, FaFlask,
} from "react-icons/fa";
import * as research from "../../../api/research";

// ─── Constants ───────────────────────────────────────────────────────────────
// Only the two certificate types the spec doc actually defines: Clearance Certificate: issued automatically after PROPOSAL approval and Completion Certificate: issued after final approval + publication.

const CERT_TYPES = {
  clearance: {
    label: "Research Approval & Clearance Certificate",
    issuer: "Ethics Review Board",
    icon: FaFileAlt,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  completion: {
    label: "Completion Certificate",
    issuer: "Research Committee",
    icon: FaAward,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
};

const STATUS_CONFIG = {
  active:  { label: "Active",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── Local building blocks ───────────────────────────────────────────────────
const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, title, sub }) => (
  <div className="flex flex-col items-center py-16 gap-3 text-center">
    <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200
      flex items-center justify-center">
      <Icon className="text-2xl text-slate-400" />
    </div>
    <p className="font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-400 max-w-xs">{sub}</p>
  </div>
);

const StatCard = ({ icon: Icon, value, label, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
      <Icon className={`text-lg ${iconColor}`} />
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

// ─── QR verification modal ───────────────────────────────────────────────────
const VerifyModal = ({ cert, onClose }) => {
  const verifyUrl = `${window.location.origin}/verify/${cert.certificateNumber}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Verify Certificate</h2>
          <button type="button" onClick={onClose} aria-label="Close"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg
              hover:bg-slate-50 transition-colors cursor-pointer">
            <FaTimes />
          </button>
        </div>
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl">
            <QRCodeSVG value={verifyUrl} size={180} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800">{cert.typeInfo.label}</p>
            <p className="text-xs text-slate-400 mt-1">Certificate No. {cert.certificateNumber}</p>
          </div>
          <p className="text-xs text-slate-400 text-center break-all">{verifyUrl}</p>
        </div>
        <div className="px-6 pb-6">
          <button type="button" onClick={onClose}
            className="w-full px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600
              text-sm font-semibold hover:border-slate-300 transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Certificate row ──────────────────────────────────────────────────────────
const CertificateRow = ({ cert, onVerify, onView, onDownload }) => {
  const sc = STATUS_CONFIG[cert.status] || STATUS_CONFIG.pending;
  const { icon: Icon, iconBg, iconColor, label, issuer } = cert.typeInfo;
  const isPending = cert.status === "pending";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
            ${isPending ? "bg-slate-100" : iconBg}`}>
            <Icon className={`text-sm ${isPending ? "text-slate-400" : iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-snug">{label}</p>
            <p className="text-xs text-slate-400">{issuer}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-slate-700 whitespace-nowrap">
        {cert.researchId || "Pending…"}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
        {isPending ? "-- -- ----" : fmtDate(cert.issuedAt)}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1
          rounded-full border ${sc.cls}`}>
          {sc.label}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        {isPending ? (
          <span className="text-xs text-slate-400 italic">Awaiting approval</span>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <button type="button" onClick={() => onVerify(cert)} aria-label="Show verification QR"
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50
                transition-colors cursor-pointer">
              <FaQrcode className="text-sm" />
            </button>
            <button type="button" onClick={() => onView(cert)} aria-label="View certificate"
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50
                transition-colors cursor-pointer">
              <FaEye className="text-sm" />
            </button>
            <button type="button" onClick={() => onDownload(cert)} aria-label="Download certificate"
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50
                transition-colors cursor-pointer">
              <FaDownload className="text-sm" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

// ─── Certificates page ────────────────────────────────────────────────────────
const Certificates = () => {
  const [papers, setPapers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getMyResearch();
      setPapers(Array.isArray(res.papers) ? res.papers : []);
    } catch {
      toast.error("Failed to load your certificates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derive certificates straight from each paper's lifecycle status — no
  // separate certificates endpoint. A clearance certificate exists once a
  // proposal is approved; a completion certificate exists once the paper's
  // final stage is approved (treated here as "published").
  const certificates = useMemo(() => {
    const list = [];
    papers.forEach((p) => {
      if (p.stage === "proposal" && p.status === "approved") {
        list.push({
          id: `${p._id}-clearance`,
          researchItemId: p._id,
          typeInfo: CERT_TYPES.clearance,
          researchId: p.researchId,
          issuedAt: p.reviewedAt || p.updatedAt,
          status: "active",
          certificateNumber: p.clearanceCertificateNumber || `CLR-${p.researchId || p._id}`,
        });
      }
      if (p.stage === "final_paper") {
        const done = p.status === "approved" || p.status === "published";
        list.push({
          id: `${p._id}-completion`,
          researchItemId: p._id,
          typeInfo: CERT_TYPES.completion,
          researchId: p.researchId,
          issuedAt: p.publishedAt || p.reviewedAt,
          status: done ? "active" : "pending",
          certificateNumber: p.completionCertificateNumber || `CPL-${p.researchId || p._id}`,
        });
      }
    });
    return list;
  }, [papers]);

  const stats = useMemo(() => ({
    total: certificates.filter((c) => c.status === "active").length,
    pending: certificates.filter((c) => c.status === "pending").length,
    mostRecent: certificates
      .filter((c) => c.status === "active" && c.issuedAt)
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))[0]?.issuedAt,
  }), [certificates]);

  const handleView = (cert) => {
    toast.success(`Opening ${cert.typeInfo.label} for ${cert.researchId}`);
  };

  const handleDownload = (cert) => {
    toast.success(`Preparing ${cert.certificateNumber} for download`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            My Certificates
          </h1>
          <p className="text-slate-500 mt-1">
            Your clearance and completion certificates, issued automatically as your
            research moves through approval and publication. Each carries a unique
            certificate number and a QR code for institutional verification.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={FaCertificate} value={stats.total} label="Total Certificates"
          iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard icon={FaClock} value={stats.pending} label="Pending Issuance"
          iconBg="bg-amber-50" iconColor="text-amber-500" />
        <StatCard icon={FaCalendarAlt} value={fmtDate(stats.mostRecent)} label="Most Recent Issue"
          iconBg="bg-indigo-50" iconColor="text-indigo-600" />
      </div>

      {/* Certificates table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">Certificates</h3>
        </div>

        {loading ? (
          <PageSpinner label="Loading certificates…" />
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={FaFlask}
            title="No certificates yet"
            sub="Certificates are issued automatically once a proposal is approved or a final paper is published."
          />
        ) : ( 
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Certificate Type", "Project ID", "Issue Date", "Status", ""].map((h, i) => (
                    <th key={h || i} className={`px-6 py-3 text-xs font-bold uppercase
                      tracking-widest text-slate-400 ${i === 4 ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <CertificateRow
                    key={cert.id}
                    cert={cert}
                    onVerify={setVerifying}
                    onView={handleView}
                    onDownload={handleDownload}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Support panel */}
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6
        flex flex-col sm:flex-row items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <FaInfoCircle className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-sm mb-1.5">Missing a certificate?</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Certificates are issued automatically once a proposal is approved or a final
            paper is published. If you believe a certificate is missing, contact the
            research administrative office for assistance.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <a href="mailto:research-admin@nyahururuhospital.org?subject=Certificate%20replacement%20request"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm
              font-semibold hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap">
            Request Replacement
          </a>
          <a href="mailto:support@nyahururuhospital.org?subject=Certificate%20support"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm
              font-semibold transition-colors cursor-pointer whitespace-nowrap">
            Contact Support
          </a>
        </div>
      </div>

      {verifying && <VerifyModal cert={verifying} onClose={() => setVerifying(null)} />}
    </div>
  );
};

export default Certificates;
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import {
  FaFileInvoiceDollar,
  FaReceipt,
  FaShieldAlt,
  FaClock,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaPhoneAlt,
  FaEnvelope,
  FaFlask,
} from "react-icons/fa";
import * as research from "../../../api/research";

// ─── Constants ───────────────────────────────────────────────────────────────
// Payment status is read straight off each research item's payment fields

const PAY_STATUS_CONFIG = {
  completed: {
    label: "Completed",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700 border-red-200" },
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtKES = (n) =>
  `KES ${Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAGE_SIZE = 5;

const STATUS_FILTERS = [
  { id: "all", label: "All Statuses" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];

// ─── Local building blocks ───────────────────────────────────────────────────
const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, title, sub }) => (
  <div className="flex flex-col items-center py-16 gap-3 text-center">
    <div
      className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200
      flex items-center justify-center"
    >
      <Icon className="text-2xl text-slate-400" />
    </div>
    <p className="font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-400 max-w-xs">{sub}</p>
  </div>
);

const StatCard = ({
  icon: Icon,
  value,
  label,
  badge,
  badgeCls,
  iconBg,
  iconColor,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div className="flex items-start justify-between mb-3">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <Icon className={`text-lg ${iconColor}`} />
      </div>
      {badge && (
        <span
          className={`text-[11px] font-bold px-2 py-1 rounded-full ${badgeCls}`}
        >
          {badge}
        </span>
      )}
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
      {label}
    </p>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

// ─── Payments & Financials page ──────────────────────────────────────────────
const Payments = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await research.getMyResearch();
      setPapers(Array.isArray(res.papers) ? res.papers : []);
    } catch {
      toast.error("Failed to load your payment records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Each paper carries its own one-time payment (per the spec doc, fee is

  const transactions = useMemo(
    () =>
      papers
        .filter((p) => p.submissionPayment)
        .map((p) => ({
          id:
            p.submissionPayment?.mpesaReceiptNumber ||
            p.submissionPayment?.checkoutRequestId ||
            p._id,
          receiptNumber: p.submissionPayment?.mpesaReceiptNumber,
          title: p.title,
          researchId: p.researchId,
          date:
            p.submissionPayment?.paidAt ||
            p.submissionPayment?.createdAt ||
            p.createdAt,
          amount: p.submissionPayment?.amount,
          status: p.submissionPayment?.status || "pending",
          researchItemId: p._id,
        })),
    [papers],
  );

  const filtered = useMemo(
    () =>
      status === "all"
        ? transactions
        : transactions.filter((t) => t.status === status),
    [transactions, status],
  );

  useEffect(() => {
    setPage(1);
  }, [status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const completed = transactions.filter((t) => t.status === "completed");
    const pending = transactions.filter((t) => t.status === "pending");
    return {
      totalPaid: completed.reduce((sum, t) => sum + Number(t.amount || 0), 0),
      pendingCount: pending.length,
      receiptCount: completed.filter((t) => t.receiptNumber).length,
    };
  }, [transactions]);

  const handleDownloadReceipt = (txn) => {
    if (!txn.receiptNumber) {
      toast.error("No receipt available for this transaction yet");
      return;
    }
    toast.success(
      `Receipt ${txn.receiptNumber} — check your email for the official PDF`,
    );
  };

  const handleDownloadStatement = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export yet");
      return;
    }
    const rows = transactions.map((t) => ({
      id: t.receiptNumber || t.id,
      title: t.title,
      date: fmtDate(t.date),
      amount: t.amount,
      status: t.status,
    }));
    const csv = [
      "Receipt,Research Title,Date,Amount (KES),Status",
      ...rows.map(
        (r) => `"${r.id}","${r.title}","${r.date}","${r.amount}","${r.status}"`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payment-statement.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Payments & Financials
          </h1>
          <p className="text-slate-500 mt-1">
            Your one-time M-Pesa submission fees and receipts, per the research
            portal's single-payment policy.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadStatement}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200
            text-slate-600 text-sm font-semibold hover:border-slate-300 transition-colors
            cursor-pointer whitespace-nowrap"
        >
          <FaDownload className="text-xs" /> Download Statement
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={FaFileInvoiceDollar}
          value={fmtKES(stats.totalPaid)}
          label="Total Paid Fees"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={FaClock}
          value={stats.pendingCount}
          label="Pending Confirmation"
          badge={stats.pendingCount > 0 ? "Action may be needed" : undefined}
          badgeCls="bg-amber-50 text-amber-600"
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
        <StatCard
          icon={FaReceipt}
          value={stats.receiptCount}
          label="Available Receipts"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Transaction history */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-base">
              Transaction History
            </h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-700
                outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
                transition-all bg-white"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <PageSpinner label="Loading transactions…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FaFlask}
              title="No transactions yet"
              sub="Your M-Pesa payment receipt will appear here once you submit a proposal."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {[
                        "Receipt",
                        "Research Title",
                        "Date",
                        "Amount (KES)",
                        "Status",
                        "",
                      ].map((h, i) => (
                        <th
                          key={h || i}
                          className={`px-6 py-3 text-xs font-bold uppercase
                          tracking-widest text-slate-400 ${i === 3 ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((t) => {
                      const sc =
                        PAY_STATUS_CONFIG[t.status] ||
                        PAY_STATUS_CONFIG.pending;
                      return (
                        <tr
                          key={t.researchItemId}
                          className="border-b border-slate-100 last:border-0
                          hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-bold text-blue-700 whitespace-nowrap">
                            {t.receiptNumber || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-800 max-w-xs">
                            <p className="font-semibold leading-snug">
                              {t.title}
                            </p>
                            {t.researchId && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {t.researchId}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {fmtDate(t.date)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                            {Number(t.amount || 0).toLocaleString("en-KE", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold
                              px-3 py-1 rounded-full border ${sc.cls}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />{" "}
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(t)}
                              aria-label="Download receipt"
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600
                                hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <FaReceipt className="text-sm" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div
                className="px-6 py-4 border-t border-slate-100 flex items-center justify-between
                bg-slate-50 flex-wrap gap-3"
              >
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}-
                  {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length} transactions
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="p-2 rounded-lg border border-slate-200 text-slate-500
                      hover:border-blue-300 hover:text-blue-600 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                    className="p-2 rounded-lg border border-slate-200 text-slate-500
                      hover:border-blue-300 hover:text-blue-600 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FaShieldAlt className="text-emerald-500" />
              <h3 className="font-bold text-slate-900 text-sm">
                Payment Policy
              </h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Nyahururu Hospital charges a single, one-time M-Pesa submission
              fee per research proposal. Once paid, it unlocks every subsequent
              stage — progress submission, final paper review, and publication —
              at no extra cost.
            </p>
          </div>

          <div className="bg-blue-500 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-sm mb-3">Payment Support</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Need help with a failed payment or reconciling a receipt? Our
              finance office is available weekdays, 8 AM – 5 PM.
            </p>
            <div className="space-y-2 text-sm">
              <a
                href="tel:+2547000000"
                className="flex items-center gap-2.5 text-slate-200
                hover:text-white transition-colors"
              >
                <FaPhoneAlt className="text-xs" /> +254 7XX XXX XXX
              </a>
              <a
                href="mailto:finance@nyahururuhospital.org"
                className="flex items-center gap-2.5
                text-slate-200 hover:text-white transition-colors break-all"
              >
                <FaEnvelope className="text-xs" /> finance@nyahururuhospital.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;

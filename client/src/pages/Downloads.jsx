import React, { useState, useEffect, useCallback } from "react";
import { Header, Footer } from "../components/layouts";
import api from "../api/axios";
import {
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaDownload,
  FaCalendarAlt,
  FaUser,
  FaSearch,
  FaFolder,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";

const EXT_ICONS = {
  pdf: <FaFilePdf className="text-red-500 text-3xl" />,
  doc: <FaFileWord className="text-blue-500 text-3xl" />,
  docx: <FaFileWord className="text-blue-500 text-3xl" />,
  xls: <FaFileExcel className="text-green-500 text-3xl" />,
  xlsx: <FaFileExcel className="text-green-500 text-3xl" />,
  jpg: <FaFileImage className="text-purple-500 text-3xl" />,
  jpeg: <FaFileImage className="text-purple-500 text-3xl" />,
  png: <FaFileImage className="text-purple-500 text-3xl" />,
  gif: <FaFileImage className="text-purple-500 text-3xl" />,
};

const BASE_CARD = `
  bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4
  transition-colors hover:border-blue-300
`.trim();

const PRIMARY_BTN = `
  w-full flex items-center justify-center gap-2 px-4 py-2.5
  rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
  transition-colors disabled:opacity-50 disabled:cursor-not-allowed
`.trim();

const getFileIcon = (filename) => {
  const ext = filename?.split(".").pop()?.toLowerCase();
  return EXT_ICONS[ext] ?? <FaFileAlt className="text-slate-400 text-3xl" />;
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
};

const Meta = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
    <Icon className="shrink-0" />
    {children}
  </span>
);

const ReportCard = ({ report, onDownload, isDownloading }) => (
  <div className={BASE_CARD}>
    <div className="flex items-start gap-4">
      <div className="shrink-0 mt-0.5">{getFileIcon(report.filename)}</div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-slate-900 leading-tight line-clamp-2 mb-1">
          {report.title}
        </h3>

        {report.description && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
            {report.description}
          </p>
        )}
      </div>
    </div>

    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {report.category && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
          <FaFolder className="text-[10px]" />
          {report.category}
        </span>
      )}
      <Meta icon={FaCalendarAlt}>{formatDate(report.createdAt)}</Meta>
      {report.createdBy?.name && (
        <Meta icon={FaUser}>{report.createdBy.name}</Meta>
      )}
      {formatSize(report.fileSize) && (
        <span className="text-xs text-slate-400">
          {formatSize(report.fileSize)}
        </span>
      )}
    </div>

    <button
      type="button"
      onClick={() => onDownload(report)}
      disabled={isDownloading}
      aria-label={`Download ${report.title}`}
      className={PRIMARY_BTN}
    >
      {isDownloading ? (
        <>
          <FaSpinner className="animate-spin" />
          Downloading…
        </>
      ) : (
        <>
          <FaDownload />
          Download
        </>
      )}
    </button>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-slate-500">Loading reports…</p>
  </div>
);

const EmptyState = ({ hasFilters }) => (
  <div className="flex flex-col items-center py-24 gap-3 text-center">
    <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
      <FaFileAlt className="text-2xl text-slate-400" />
    </div>
    <p className="font-semibold text-slate-700">
      {hasFilters ? "No reports match your search" : "No reports yet"}
    </p>
    <p className="text-sm text-slate-400">
      {hasFilters
        ? "Try a different search term or clear the filter."
        : "Reports will appear here once they're uploaded."}
    </p>
  </div>
);

const ErrorBanner = ({ onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3 text-sm text-red-700">
    <FaExclamationTriangle className="shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="font-semibold">Failed to load reports.</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-red-600 font-semibold hover:underline mt-1"
      >
        Try again
      </button>
    </div>
  </div>
);

const Downloads = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloading, setDownloading] = useState({});

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const response = await api.get("/reports");
      const data = response.data.data ?? response.data ?? [];
      setReports(Array.isArray(data) ? data : []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = reports.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
    );
  });

  const handleDownload = async (report) => {
    setDownloading((prev) => ({ ...prev, [report._id]: true }));

    try {
      const response = await api.get(`/reports/${report._id}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", report.fileName || report.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`"${report.title}" downloaded.`);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading((prev) => ({ ...prev, [report._id]: false }));
    }
  };

  const hasFilters = searchTerm.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
            Resources
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Downloads
          </h1>
          <p className="text-slate-500 mt-1">
            Access reports, documents, and resources.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, description, or category…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                         text-sm text-slate-800 outline-none placeholder:text-slate-400
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {!loading && !fetchError && (
            <p className="text-xs text-slate-400 shrink-0">
              {filteredReports.length} of {reports.length}{" "}
              {reports.length === 1 ? "report" : "reports"}
            </p>
          )}
        </div>

        {loading ? (
          <LoadingState />
        ) : fetchError ? (
          <ErrorBanner onRetry={fetchReports} />
        ) : filteredReports.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onDownload={handleDownload}
                isDownloading={!!downloading[report._id]}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Downloads;

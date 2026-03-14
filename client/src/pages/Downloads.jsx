import React, { useState, useEffect } from "react";
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
  FaFilter,
  FaFolder,
  FaChevronDown,
} from "react-icons/fa";
import { toast } from "react-toastify";

const Downloads = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [selectedCategory, searchTerm, reports]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get("/reports");
      const reportsData = response.data.data || response.data || [];
      setReports(reportsData);
      console.log("The reports to download:", reportsData);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(reportsData.map((r) => r.category).filter(Boolean)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FaFileAlt className="text-gray-500 text-3xl" />;

    const ext = filename.split(".").pop()?.toLowerCase();

    if (ext === "pdf") return <FaFilePdf className="text-red-500 text-3xl" />;
    if (["doc", "docx"].includes(ext))
      return <FaFileWord className="text-blue-500 text-3xl" />;
    if (["xls", "xlsx"].includes(ext))
      return <FaFileExcel className="text-green-500 text-3xl" />;
    if (["jpg", "jpeg", "png", "gif"].includes(ext))
      return <FaFileImage className="text-purple-500 text-3xl" />;

    return <FaFileAlt className="text-gray-500 text-3xl" />;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleDownload = async (report) => {
    try {
      const response = await api.get(`/reports/${report._id}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", report.filename || report.title);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const ReportCard = ({ report }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">{getFileIcon(report.filename)}</div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {report.title}
            </h3>

            {report.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {report.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
              {report.category && (
                <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                  <FaFolder className="mr-1" />
                  {report.category}
                </span>
              )}

              <span className="inline-flex items-center">
                <FaCalendarAlt className="mr-1" />
                {formatDate(report.createdAt)}
              </span>

              {report.createdBy?.name && (
                <span className="inline-flex items-center">
                  <FaUser className="mr-1" />
                  {report.createdBy.name}
                </span>
              )}

              {report.fileSize && (
                <span className="inline-flex items-center">
                  📦 {formatFileSize(report.fileSize)}
                </span>
              )}
            </div>

            <button
              onClick={() => handleDownload(report)}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FaDownload className="mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 border-l-4 border-blue-500 pl-3">
            Downloads Center
          </h1>
          <p className="text-xl text-blue-500">
            Access reports, documents, and resources
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
            <p className="text-gray-600 font-medium text-lg">
              Loading Reports...
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Reports Found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <ReportCard key={report._id} report={report} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Downloads;

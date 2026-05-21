import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaTrash,
  FaUser,
  FaSearch,
  FaFilter,
  FaEye,
  FaTimes,
  FaCheckCircle,
  FaClock,
  FaUserTie,
  FaEnvelope,
  FaUniversity,
  FaRedo,
  FaUserCheck,
  FaUserSlash,
  FaCrown,
  FaBookOpen,
  FaFilePdf,
  FaFileAlt,
  FaImage,
  FaDownload,
  FaPhone,
  FaShieldAlt,
  FaKey,
  FaUserPlus,
  FaLayerGroup,
  FaMicroscope,
  FaRegFileAlt,
  FaChevronDown,
  FaGlobe,
} from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import { toast } from "react-toastify";
import api from "../../api/axios";
import * as research from "../../api/research";

const STAGE_META = {
  proposal: {
    label: "Proposal",
    color: "bg-amber-500",
    lightColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-400",
    icon: FaRegFileAlt,
  },
  abstract: {
    label: "Abstract",
    color: "bg-sky-500",
    lightColor: "bg-sky-50",
    textColor: "text-sky-700",
    borderColor: "border-sky-200",
    dotColor: "bg-sky-400",
    icon: FaLayerGroup,
  },
  final_paper: {
    label: "Final Paper",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-400",
    icon: FaMicroscope,
  },
};

const STATUS_META = {
  pending: {
    label: "Under Review",
    color: "bg-blue-100",
    textColor: "text-blue-700",
    icon: FaClock,
    dot: "bg-blue-400",
  },
  approved: {
    label: "Approved",
    color: "bg-green-100",
    textColor: "text-green-700",
    icon: FaCheckCircle,
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100",
    textColor: "text-red-700",
    icon: FaTimes,
    dot: "bg-red-400",
  },
};

const CATEGORY_COLORS = [
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-lime-100", text: "text-lime-700" },
];

const buildCategoryColorMap = (papers) => {
  const cats = [...new Set(papers.map((p) => p.category).filter(Boolean))];
  return cats.reduce((acc, cat, i) => {
    acc[cat] = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    return acc;
  }, {});
};

// ─── Shared sub-components ────────────────────────────────────────────────────
const ROLE_META = {
  admin: {
    label: "Research Admin",
    color: "bg-purple-100 text-purple-700",
    icon: FaCrown,
  },
  reviewer: {
    label: "Reviewer",
    color: "bg-blue-100 text-blue-700",
    icon: FaUserTie,
  },
  researcher: {
    label: "Researcher",
    color: "bg-gray-100 text-gray-600",
    icon: FaUser,
  },
};

const RoleBadge = ({ role }) => {
  const meta = ROLE_META[role] ?? ROLE_META.researcher;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${meta.color}`}
    >
      <Icon className="text-[10px]" />
      {meta.label}
    </span>
  );
};

const EMPTY_RESEARCHER = { firstName: "", lastName: "", email: "", phone: "" };
const EMPTY_INVITE = {
  email: "",
  firstName: "",
  lastName: "",
  institution: "",
  department: "",
  discipline: "",
};

const TOP_TABS = [
  { key: "papers", label: "Research Papers", icon: FaBookOpen },
  { key: "reviewers", label: "Reviewer Management", icon: FaUserTie },
];

const ResearchPage = () => {
  const [topTab, setTopTab] = useState("papers");
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center ">
              <FaBookOpen className="text-white" />
            </div>
            <div className="flex flex-col">
              {" "}
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Research Management
              </h1>
              <p className="text-gray-500 text-sm">
                Manage research papers across all stages and reviewer
                assignments
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 mb-6 p-1 w-fit">
          {TOP_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTopTab(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
                topTab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <Icon className="text-xs" />
              {label}
            </button>
          ))}
        </div>
        {topTab === "papers" && <PapersPanel />}
        {topTab === "reviewers" && <ReviewersPanel />}
      </div>
    </div>
  );
};

const PapersPanel = () => {
  const [researchList, setResearchList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [categoryColorMap, setCategoryColorMap] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  const [viewModal, setViewModal] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState(null);

  const [addResearcherOpen, setAddResearcherOpen] = useState(false);
  const [researcherForm, setResearcherForm] = useState(EMPTY_RESEARCHER);
  const [researcherLoading, setResearcherLoading] = useState(false);
  const [researcherSubmitted, setResearcherSubmitted] = useState(false);

  const [assignReviewerOpen, setAssignReviewerOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignReviewerEmail, setAssignReviewerEmail] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchResearch = async () => {
    try {
      setLoading(true);
      const res = await api.get("/research/admin/all");
      const papers = Array.isArray(res.data)
        ? res.data
        : res.data.research || [];
      setResearchList(papers);
      setCategoryColorMap(buildCategoryColorMap(papers));
    } catch (err) {
      console.error("Research Fetch error:", err);
      try {
        const fallback = await api.get("/research");
        const papers = Array.isArray(fallback.data)
          ? fallback.data
          : fallback.data.research || [];
        setResearchList(papers);
        setCategoryColorMap(buildCategoryColorMap(papers));
      } catch {
        toast.error("Error fetching research papers");
        setResearchList([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearch();
  }, []);

  const filtered = researchList.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.title?.toLowerCase().includes(q) ||
      item.researcher?.name?.toLowerCase().includes(q) ||
      item.author?.toLowerCase().includes(q) ||
      item.abstract?.toLowerCase().includes(q);
    const matchStage =
      filterStage === "all" || (item.stage || "proposal") === filterStage;
    const matchStatus = filterStatus === "all" || item.status === filterStatus;
    return matchSearch && matchStage && matchStatus;
  });

  const stageCounts = {
    proposal: researchList.filter((r) => (r.stage || "proposal") === "proposal")
      .length,
    abstract: researchList.filter((r) => r.stage === "abstract").length,
    final_paper: researchList.filter((r) => r.stage === "final_paper").length,
  };

  const openAddResearcher = () => {
    setResearcherForm(EMPTY_RESEARCHER);
    setResearcherSubmitted(false);
    setAddResearcherOpen(true);
  };
  const closeAddResearcher = () => {
    setAddResearcherOpen(false);
    setResearcherForm(EMPTY_RESEARCHER);
    setResearcherSubmitted(false);
  };
  const handleResearcherChange = (e) =>
    setResearcherForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAddResearcher = async (e) => {
    e.preventDefault();
    setResearcherLoading(true);
    try {
      await api.post("/admin/researchers/create", researcherForm);
      setResearcherSubmitted(true);
      toast.success("Researcher added! Login credentials sent via email.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add researcher");
    } finally {
      setResearcherLoading(false);
    }
  };

  const handleDownload = async (item) => {
    try {
      setDownloadingId(item._id);
      const fileUrl = item.fileUrl || item.proposalFile;
      if (!fileUrl) {
        toast.error("No PDF available for download");
        return;
      }
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `${item.title || "research"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      try {
        await api.post(`/research/${item._id}/download`);
      } catch (err) {
        console.warn("Could not record download:", err);
      }
      toast.success("Download started");
    } catch (err) {
      toast.error("Download failed");
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePublish = async (item) => {
    if (
      !window.confirm(
        `Publish "${item.title}"? This will make it publicly visible.`,
      )
    )
      return;
    try {
      setPublishingId(item._id);
      await api.patch(`/research/${item._id}/publish`);
      toast.success("Research published successfully!");
      fetchResearch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish");
    } finally {
      setPublishingId(null);
    }
  };

  const handleAssignReviewer = async (e) => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      await api.post(`/research/${assignTarget._id}/assign-reviewer`, {
        email: assignReviewerEmail,
      });
      toast.success("Reviewer assigned successfully!");
      setAssignReviewerOpen(false);
      setAssignReviewerEmail("");
      setAssignTarget(null);
      fetchResearch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign reviewer");
    } finally {
      setAssignLoading(false);
    }
  };

  const openAssignModal = (item) => {
    setAssignTarget(item);

    setAssignReviewerEmail(item.assignedReviewer?.email || "");
    setAssignReviewerOpen(true);
  };

  return (
    <>
      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Papers",
            value: researchList.length,
            color: "blue",
            icon: FaBookOpen,
          },
          {
            label: "Proposals",
            value: stageCounts.proposal,
            color: "amber",
            icon: FaRegFileAlt,
          },
          {
            label: "Final Papers",
            value: stageCounts.final_paper,
            color: "emerald",
            icon: FaMicroscope,
          },
          {
            label: "Published",
            value: researchList.filter((r) => r.isPublished).length,
            color: "purple",
            icon: FaGlobe,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <h3 className={`text-2xl font-bold text-${color}-600`}>
                  {value}
                </h3>
              </div>
              <div
                className={`w-11 h-11 bg-${color}-50 rounded-lg flex items-center justify-center`}
              >
                <Icon className={`text-lg text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          {
            key: "all",
            label: "All Stages",
            count: researchList.length,
            color: "bg-gray-100 text-gray-600 border-gray-200",
          },
          {
            key: "proposal",
            label: "Proposal",
            count: stageCounts.proposal,
            color: "bg-amber-50 text-amber-700 border-amber-200",
          },
          {
            key: "abstract",
            label: "Abstract",
            count: stageCounts.abstract,
            color: "bg-sky-50 text-sky-700 border-sky-200",
          },
          {
            key: "final_paper",
            label: "Final Paper",
            count: stageCounts.final_paper,
            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setFilterStage(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all
              ${
                filterStage === key
                  ? "ring-2 ring-offset-1 ring-blue-400 shadow-sm " + color
                  : color + " opacity-70 hover:opacity-100"
              }`}
          >
            {label}
            <span className="bg-white/60 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by title, author, or abstract…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer outline-none focus:ring focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {/* <button
            onClick={openAddResearcher}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer outline-none hover:bg-blue-700 transition-colors shadow-sm shrink-0"
          >
            <FaUserPlus /> Add Researcher
          </button> */}
        </div>

        {/* Active filter chips */}
        {(filterStage !== "all" || filterStatus !== "all" || searchTerm) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
            <span className="text-xs text-gray-400">
              Showing {filtered.length} of {researchList.length} papers
            </span>
            {[
              filterStage !== "all" && {
                label: STAGE_META[filterStage]?.label || filterStage,
                clear: () => setFilterStage("all"),
              },
              filterStatus !== "all" && {
                label: STATUS_META[filterStatus]?.label || filterStatus,
                clear: () => setFilterStatus("all"),
              },
              searchTerm && {
                label: `"${searchTerm}"`,
                clear: () => setSearchTerm(""),
              },
            ]
              .filter(Boolean)
              .map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100"
                >
                  {chip.label}
                  <button
                    onClick={chip.clear}
                    className="hover:text-red-500 cursor-pointer ml-0.5"
                  >
                    <FaTimes className="text-[9px]" />
                  </button>
                </span>
              ))}
            <button
              onClick={() => {
                setFilterStage("all");
                setFilterStatus("all");
                setSearchTerm("");
              }}
              className="text-xs text-gray-400 hover:text-red-500 cursor-pointer underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-500 mt-3 text-sm">
              Loading research papers…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FaBookOpen className="text-4xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No research papers match your filters
            </p>
            <button
              onClick={() => {
                setFilterStage("all");
                setFilterStatus("all");
                setSearchTerm("");
              }}
              className="mt-3 text-blue-600 text-xs hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                    Title
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                    Author
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Stage
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                    Assigned Reviewer
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Downloads
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => {
                  const stage = item.stage || "proposal";
                  const stageMeta = STAGE_META[stage] || STAGE_META.proposal;
                  const statusMeta =
                    STATUS_META[item.status] || STATUS_META.pending;
                  const StatusIcon = statusMeta.icon;
                  const hasFile = item.fileUrl || item.proposalFile;
                  const canPublish =
                    stage === "final_paper" &&
                    item.status === "approved" &&
                    !item.isPublished;

                  const assignedReviewer =
                    item.assignedReviewer &&
                    typeof item.assignedReviewer === "object"
                      ? item.assignedReviewer
                      : null;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3 min-w-0">
                          {item.thumbnailUrl && (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p
                              className="font-semibold text-gray-900 truncate hover:text-blue-600 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedResearch(item);
                                setViewModal(true);
                              }}
                            >
                              {item.title}
                            </p>
                            {item.isPublished && (
                              <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-50 text-green-700 mt-0.5">
                                Published
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <FaUser className="text-gray-400 text-xs shrink-0" />
                          <span className="truncate text-xs">
                            {item.researcher?.name || item.author || "Unknown"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${stageMeta.dotColor}`}
                          />
                          <span className="inline-block text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-700 uppercase tracking-wider">
                            {stageMeta.label}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${statusMeta.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot} shrink-0`}
                          />
                          <StatusIcon
                            className={`text-[10px] ${statusMeta.textColor}`}
                          />
                          <span
                            className={`text-[11px] font-semibold ${statusMeta.textColor}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {assignedReviewer ? (
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">
                                {assignedReviewer.name ||
                                  `${assignedReviewer.firstName ?? ""} ${assignedReviewer.lastName ?? ""}`.trim() ||
                                  "—"}
                              </p>
                              {assignedReviewer.email && (
                                <p className="text-[10px] text-gray-400 truncate">
                                  {assignedReviewer.email}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400 italic">
                            <FaUserTie className="text-gray-300" /> Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="text-gray-600 font-semibold text-xs">
                          {item.downloads ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {hasFile && (
                            <button
                              onClick={() => handleDownload(item)}
                              disabled={downloadingId === item._id}
                              className="p-2 rounded-lg text-green-600 hover:bg-green-50 cursor-pointer transition-colors disabled:opacity-50"
                              title="Download PDF"
                            >
                              {downloadingId === item._id ? (
                                <div className="w-4 h-4 border-2 border-green-400 border-t-green-600 rounded-full animate-spin" />
                              ) : (
                                <FaDownload className="text-sm" />
                              )}
                            </button>
                          )}

                          {/* View */}
                          <button
                            onClick={() => {
                              setSelectedResearch(item);
                              setViewModal(true);
                            }}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                            title="View details"
                          >
                            <FaEye className="text-sm" />
                          </button>

                          <button
                            onClick={() => openAssignModal(item)}
                            className={`p-2 rounded-lg cursor-pointer transition-colors ${
                              assignedReviewer
                                ? "text-purple-500 hover:bg-purple-50 ring-1 ring-purple-200"
                                : "text-purple-600 hover:bg-purple-50"
                            }`}
                            title={
                              assignedReviewer
                                ? "Re-assign reviewer"
                                : "Assign reviewer"
                            }
                          >
                            <FaUserTie className="text-sm" />
                          </button>

                          {canPublish && (
                            <button
                              onClick={() => handlePublish(item)}
                              disabled={publishingId === item._id}
                              className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors disabled:opacity-50"
                              title="Publish paper"
                            >
                              {publishingId === item._id ? (
                                <div className="w-4 h-4 border-2 border-emerald-400 border-t-emerald-600 rounded-full animate-spin" />
                              ) : (
                                <FaGlobe className="text-sm" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewModal &&
        selectedResearch &&
        (() => {
          const stage = selectedResearch.stage || "proposal";
          const stageMeta = STAGE_META[stage] || STAGE_META.proposal;
          const statusMeta =
            STATUS_META[selectedResearch.status] || STATUS_META.pending;
          const StatusIcon = statusMeta.icon;
          const assignedReviewer =
            selectedResearch.assignedReviewer &&
            typeof selectedResearch.assignedReviewer === "object"
              ? selectedResearch.assignedReviewer
              : null;

          return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className={`${stageMeta.color} px-6 py-4 rounded-t-2xl`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {stageMeta.label}
                        </span>
                        <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {statusMeta.label}
                        </span>
                        {selectedResearch.isPublished && (
                          <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            Published
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white leading-tight">
                        {selectedResearch.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-white text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                          <FaUser className="text-xs" />
                          {selectedResearch.researcher?.name ||
                            selectedResearch.author ||
                            "Unknown"}
                        </span>
                        <p className="text-sm text-white flex items-center gap-1">
                          <FaUniversity />{" "}
                          {selectedResearch.researcher.institution}
                        </p>
                        {selectedResearch.researcher.email && (
                          <p className="text-sm text-white flex items-center gap-1 ">
                            <FaEnvelope /> {selectedResearch.researcher.email}
                          </p>
                        )}
                      </div>
                      <div></div>
                    </div>
                    <button
                      onClick={() => setViewModal(false)}
                      className="p-2 cursor-pointer rounded-lg bg-white/20 hover:bg-white/30 transition-colors ml-4 shrink-0"
                    >
                      <FaTimes className="text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {selectedResearch.thumbnailUrl && (
                    <img
                      src={selectedResearch.thumbnailUrl}
                      alt={selectedResearch.title}
                      className="w-full h-56 object-cover rounded-lg"
                    />
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Abstract
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedResearch.abstract || "No abstract available"}
                    </p>
                  </div>

                  {selectedResearch.background && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Background
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedResearch.background}
                      </p>
                    </div>
                  )}

                  {selectedResearch.methodology && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Methodology
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedResearch.methodology}
                      </p>
                    </div>
                  )}

                  {(selectedResearch.fileUrl ||
                    selectedResearch.proposalFile) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaFilePdf className="text-2xl text-green-600" />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            PDF Document
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedResearch.isPublished
                              ? `Price: KES ${selectedResearch.downloadPrice}`
                              : "Full document available"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(selectedResearch)}
                        disabled={downloadingId === selectedResearch._id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white cursor-pointer rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {downloadingId === selectedResearch._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Downloading…
                          </>
                        ) : (
                          <>
                            <FaDownload /> Download
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {assignedReviewer && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Assigned Reviewer
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(
                            assignedReviewer.name ||
                            assignedReviewer.firstName ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {assignedReviewer.name ||
                              `${assignedReviewer.firstName ?? ""} ${assignedReviewer.lastName ?? ""}`.trim()}
                          </p>
                          {assignedReviewer.email && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                              <FaEnvelope className="text-[10px]" />{" "}
                              {assignedReviewer.email}
                            </p>
                          )}
                          {assignedReviewer.institution && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                              <MdSchool /> {assignedReviewer.institution}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedResearch.reviewComment && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Reviewer Comment
                      </p>
                      <p className="text-sm text-gray-700">
                        {selectedResearch.reviewComment}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setViewModal(false)}
                      className="px-4 py-2 border border-gray-200 hover:text-white rounded-lg text-sm hover:bg-red-500 cursor-pointer transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── Add Researcher Modal ── */}
      {addResearcherOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            style={{
              animation: "modalPop .25s cubic-bezier(.34,1.56,.64,1) both",
            }}
          >
            <div className="relative bg-blue-700 px-6 pt-6 pb-8">
              <button
                onClick={closeAddResearcher}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
              >
                <FaTimes className="text-white text-xs" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FaUserPlus className="text-white text-base" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    Add Researcher
                  </h3>
                  <p className="text-blue-200 text-xs">
                    Account created by admin
                  </p>
                </div>
              </div>
            </div>
            <div className="h-3 bg-gradient-to-br from-blue-600 to-blue-700 relative">
              <div className="absolute inset-x-0 bottom-0 h-3 bg-white rounded-t-2xl" />
            </div>

            {!researcherSubmitted ? (
              <form
                onSubmit={handleAddResearcher}
                className="px-6 pb-6 pt-2 space-y-4"
              >
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <FaKey className="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    A secure password will be{" "}
                    <span className="font-semibold">auto-generated</span> and
                    sent to the researcher's email along with their login
                    credentials.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["firstName", "First Name", "Jane"],
                    ["lastName", "Last Name", "Wanjiru"],
                  ].map(([name, label, ph]) => (
                    <div key={name}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {label} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name={name}
                        required
                        value={researcherForm[name]}
                        onChange={handleResearcherChange}
                        placeholder={ph}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={researcherForm.email}
                      onChange={handleResearcherChange}
                      placeholder="jane.wanjiru@university.ac.ke"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Login credentials will be delivered to this address.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={researcherForm.phone}
                      onChange={handleResearcherChange}
                      placeholder="+254 700 000 000"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeAddResearcher}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={researcherLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 cursor-pointer transition-colors"
                  >
                    {researcherLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <FaUserPlus /> Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="px-6 pb-8 pt-4 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <FaCheckCircle className="text-green-500 text-3xl" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">
                  Account Created!
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                  <span className="font-semibold text-gray-700">
                    {researcherForm.firstName} {researcherForm.lastName}
                  </span>{" "}
                  has been added as a researcher. Login instructions have been
                  sent to{" "}
                  <span className="font-semibold text-blue-600">
                    {researcherForm.email}
                  </span>
                  .
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setResearcherForm(EMPTY_RESEARCHER);
                      setResearcherSubmitted(false);
                    }}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    Add Another
                  </button>
                  <button
                    onClick={closeAddResearcher}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Assign / Re-assign Reviewer Modal ── */}
      {assignReviewerOpen && assignTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{
              animation: "modalPop .25s cubic-bezier(.34,1.56,.64,1) both",
            }}
          >
            <div className="relative bg-gradient-to-br from-purple-600 to-purple-700 px-6 pt-6 pb-8">
              <button
                onClick={() => {
                  setAssignReviewerOpen(false);
                  setAssignTarget(null);
                  setAssignReviewerEmail("");
                }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
              >
                <FaTimes className="text-white text-xs" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FaUserTie className="text-white text-base" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {assignTarget.assignedReviewer &&
                    typeof assignTarget.assignedReviewer === "object"
                      ? "Re-assign Reviewer"
                      : "Assign Reviewer"}
                  </h3>
                  <p className="text-purple-200 text-xs truncate">
                    {assignTarget.title}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-3 bg-gradient-to-br from-purple-600 to-purple-700 relative">
              <div className="absolute inset-x-0 bottom-0 h-3 bg-white rounded-t-2xl" />
            </div>

            <form
              onSubmit={handleAssignReviewer}
              className="px-6 pb-6 pt-2 space-y-4"
            >
              {assignTarget.assignedReviewer &&
                typeof assignTarget.assignedReviewer === "object" && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <FaUserTie className="text-amber-500 text-sm mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 mb-0.5">
                        Already assigned
                      </p>
                      <p className="text-xs text-amber-700">
                        Currently assigned to{" "}
                        <span className="font-semibold">
                          {assignTarget.assignedReviewer.name ||
                            `${assignTarget.assignedReviewer.firstName ?? ""} ${assignTarget.assignedReviewer.lastName ?? ""}`.trim()}
                        </span>
                        {assignTarget.assignedReviewer.email &&
                          ` (${assignTarget.assignedReviewer.email})`}
                        . Submitting will replace them.
                      </p>
                    </div>
                  </div>
                )}

              <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                <FaShieldAlt className="text-purple-500 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-xs text-purple-700 leading-relaxed">
                  Enter the email of an existing{" "}
                  <span className="font-semibold">reviewer or admin</span>. They
                  will receive a notification to review this paper.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Reviewer Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="email"
                    required
                    value={assignReviewerEmail}
                    onChange={(e) => setAssignReviewerEmail(e.target.value)}
                    placeholder="reviewer@institution.ac.ke"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Must be a registered reviewer or research admin.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Paper being assigned
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {assignTarget.title}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 uppercase tracking-wider">
                    {STAGE_META[assignTarget.stage || "proposal"]?.label}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {assignTarget.researcher?.name ||
                      assignTarget.author ||
                      "Unknown author"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAssignReviewerOpen(false);
                    setAssignTarget(null);
                    setAssignReviewerEmail("");
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 cursor-pointer transition-colors"
                >
                  {assignLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Assigning…
                    </>
                  ) : (
                    <>
                      <FaUserTie />{" "}
                      {assignTarget.assignedReviewer &&
                      typeof assignTarget.assignedReviewer === "object"
                        ? "Re-assign"
                        : "Assign Reviewer"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  );
};

const ReviewersPanel = () => {
  const [reviewers, setReviewers] = useState([]);
  const [researchers, setResearchers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [memberTab, setMemberTab] = useState("reviewers");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [drawer, setDrawer] = useState(null);

  const loadReviewers = async () => {
    try {
      const data = await research.listReviewers();
      setReviewers(data.reviewers ?? []);
    } catch {
      toast.error("Failed to load reviewers");
    }
  };

  const loadResearchers = async () => {
    try {
      const data = await research.listAllResearchers({
        role: "researcher",
        limit: 200,
      });
      setResearchers(data.researchers ?? []);
    } catch {
      toast.error("Failed to load researchers");
    }
  };

  const loadAll = async () => {
    try {
      const data = await research.listAllResearchers({ limit: 200 });
      setAllMembers(data.researchers ?? []);
    } catch {
      toast.error("Failed to load all members");
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([loadReviewers(), loadResearchers(), loadAll()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const SOURCE_MAP = {
    reviewers: reviewers,
    researchers: researchers,
    all: allMembers,
  };
  const source = SOURCE_MAP[memberTab] ?? [];

  const filtered = source.filter((m) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.institution?.toLowerCase().includes(q) ||
      m.discipline?.toLowerCase().includes(q);
    const matchRole = filterRole === "all" || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const totalReviewers = reviewers.filter((r) => r.role === "reviewer").length;
  const totalAdmins = reviewers.filter((r) => r.role === "admin").length;
  const pendingSetup = reviewers.filter((r) => !r.emailVerified).length;
  const totalResearchers = researchers.length;

  const roleFilterOptions = {
    reviewers: [
      { value: "all", label: "All Roles" },
      { value: "admin", label: "Research Admin" },
      { value: "reviewer", label: "Reviewer" },
    ],
    researchers: [],
    all: [
      { value: "all", label: "All Roles" },
      { value: "admin", label: "Research Admin" },
      { value: "reviewer", label: "Reviewer" },
      { value: "researcher", label: "Researcher" },
    ],
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const result = await research.inviteReviewer(inviteForm);
      toast.success(result.message);
      setInviteOpen(false);
      setInviteForm(EMPTY_INVITE);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to invite reviewer");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = async (member) => {
    if (!window.confirm(`Revoke reviewer access for ${member.name}?`)) return;
    try {
      const result = await research.revokeReviewer(member._id);
      toast.success(result.message);
      if (drawer?._id === member._id) setDrawer(null);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke reviewer");
    }
  };

  const handlePromote = async (member) => {
    if (!window.confirm(`Promote ${member.name} to Research Admin?`)) return;
    try {
      const result = await research.promoteToAdmin(member._id);
      toast.success(result.message);
      if (drawer?._id === member._id) setDrawer({ ...drawer, role: "admin" });
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Promotion failed");
    }
  };

  const handleResend = async (member) => {
    try {
      const result = await research.resendInvite(member._id);
      toast.success(result.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend invite");
    }
  };

  const handleAssignAsReviewer = async (member) => {
    try {
      const result = await research.inviteReviewer({ email: member.email });
      toast.success(result.message);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const switchTab = (key) => {
    setMemberTab(key);
    setSearchTerm("");
    setFilterRole("all");
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Active Reviewers",
            value: totalReviewers,
            color: "blue",
            icon: FaUserTie,
          },
          {
            label: "Research Admins",
            value: totalAdmins,
            color: "purple",
            icon: FaCrown,
          },
          {
            label: "Pending Setup",
            value: pendingSetup,
            color: "orange",
            icon: FaClock,
          },
          {
            label: "Researchers",
            value: totalResearchers,
            color: "teal",
            icon: FaUser,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <h3 className={`text-2xl font-bold text-${color}-600`}>
                  {value}
                </h3>
              </div>
              <div
                className={`w-11 h-11 bg-${color}-50 rounded-lg flex items-center justify-center`}
              >
                <Icon className={`text-lg text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 bg-white p-1 w-fit border border-gray-100 rounded-lg">
          {[
            { key: "reviewers", label: "Reviewers & Admins" },
            { key: "researchers", label: "Researchers" },
            { key: "all", label: "All Members" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                memberTab === key
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {label}
              <span
                className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  memberTab === key
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {SOURCE_MAP[key]?.length ?? 0}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm cursor-pointer transition-colors"
        >
          <FaPlus /> Invite Reviewer
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name, email, institution, discipline…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 outline-none rounded-lg text-sm focus:ring focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {memberTab !== "researchers" &&
            roleFilterOptions[memberTab]?.length > 0 && (
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-400 text-sm" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer outline-none focus:ring focus:ring-blue-500"
                >
                  {roleFilterOptions[memberTab].map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
        </div>

        {/* active filter chips */}
        {(searchTerm || filterRole !== "all") && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
            <span className="text-xs text-gray-400">
              Showing {filtered.length} of {source.length}
            </span>
            {[
              searchTerm && {
                label: `"${searchTerm}"`,
                clear: () => setSearchTerm(""),
              },
              filterRole !== "all" && {
                label: ROLE_META[filterRole]?.label || filterRole,
                clear: () => setFilterRole("all"),
              },
            ]
              .filter(Boolean)
              .map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100"
                >
                  {chip.label}
                  <button
                    onClick={chip.clear}
                    className="hover:text-red-500 cursor-pointer ml-0.5"
                  >
                    <FaTimes className="text-[9px]" />
                  </button>
                </span>
              ))}
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterRole("all");
              }}
              className="text-xs text-gray-400 hover:text-red-500 cursor-pointer underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-500 mt-3 text-sm">Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FaUser className="text-4xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No members found</p>
            {(searchTerm || filterRole !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterRole("all");
                }}
                className="mt-2 text-xs text-blue-500 hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Member",
                    "Institution",
                    "Discipline",
                    "Role",
                    "Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                        h ? "text-left" : "text-right"
                      }`}
                    >
                      {h || "Actions"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((member) => (
                  <tr
                    key={member._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Member */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {member.institution || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {member.discipline || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-5 py-4">
                      {member.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <FaCheckCircle /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500">
                          <FaClock /> Pending setup
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDrawer(member)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                          title="View details"
                        >
                          <FaEye />
                        </button>
                        {!member.emailVerified &&
                          (member.role === "reviewer" ||
                            member.role === "admin") && (
                            <button
                              onClick={() => handleResend(member)}
                              className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-50 cursor-pointer"
                              title="Resend invite"
                            >
                              <FaRedo />
                            </button>
                          )}
                        {member.role === "reviewer" && (
                          <button
                            onClick={() => handlePromote(member)}
                            className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-50 cursor-pointer"
                            title="Promote to admin"
                          >
                            <FaCrown />
                          </button>
                        )}
                        {member.role === "researcher" && (
                          <button
                            onClick={() => handleAssignAsReviewer(member)}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-50 cursor-pointer"
                            title="Assign as reviewer"
                          >
                            <FaUserCheck />
                          </button>
                        )}
                        {member.role === "reviewer" && (
                          <button
                            onClick={() => handleRevoke(member)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 cursor-pointer"
                            title="Revoke reviewer access"
                          >
                            <FaUserSlash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Invite Modal ── */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Invite Reviewer
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter an existing researcher's email to promote them, or fill
                  all fields to create a new account.
                </p>
              </div>
              <button
                onClick={() => {
                  setInviteOpen(false);
                  setInviteForm(EMPTY_INVITE);
                }}
                className="p-2 rounded-lg cursor-pointer"
              >
                <FaTimes className="text-gray-400 hover:text-red-500 text-xl" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="reviewer@institution.ac.ke"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  If this email belongs to an existing researcher they'll be
                  promoted automatically.
                </p>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
                New account details (leave blank if promoting existing)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["firstName", "First Name", "Jane"],
                  ["lastName", "Last Name", "Wanjiru"],
                ].map(([name, label, ph]) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={inviteForm[name]}
                      onChange={(e) =>
                        setInviteForm((p) => ({ ...p, [name]: e.target.value }))
                      }
                      placeholder={ph}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  <FaUniversity className="inline mr-1" />
                  Institution
                </label>
                <input
                  type="text"
                  value={inviteForm.institution}
                  onChange={(e) =>
                    setInviteForm((p) => ({
                      ...p,
                      institution: e.target.value,
                    }))
                  }
                  placeholder="University of Nairobi"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["department", "Department", "Medicine"],
                  ["discipline", "Discipline", "Public Health"],
                ].map(([name, label, ph]) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={inviteForm[name]}
                      onChange={(e) =>
                        setInviteForm((p) => ({ ...p, [name]: e.target.value }))
                      }
                      placeholder={ph}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInviteOpen(false);
                    setInviteForm(EMPTY_INVITE);
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 cursor-pointer rounded-lg text-sm hover:bg-red-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-5 py-2 bg-blue-600 text-white cursor-pointer rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {inviteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                      Sending…
                    </>
                  ) : (
                    <>
                      <FaEnvelope /> Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Drawer ── */}
      {drawer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-xl bg-white shadow-3xl rounded-2xl flex flex-col"
            style={{
              animation: "modalPop .25s cubic-bezier(.34,1.56,.64,1) both",
            }}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Member Details</h3>
              <button
                onClick={() => setDrawer(null)}
                className="p-1.5  rounded-lg cursor-pointer"
              >
                <FaTimes className="text-gray-400 hover:text-red-500 text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex flex-col items-center text-center gap-2 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {drawer.name?.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-gray-900 text-lg">{drawer.name}</p>
                <p className="text-sm text-gray-400">{drawer.email}</p>
                <RoleBadge role={drawer.role} />
                {drawer.emailVerified ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <FaCheckCircle /> Account active
                  </span>
                ) : (
                  <span className="text-xs text-orange-500 flex items-center gap-1">
                    <FaClock /> Awaiting password setup
                  </span>
                )}
              </div>
              {[
                { label: "Institution", value: drawer.institution },
                { label: "Department", value: drawer.department },
                { label: "Discipline", value: drawer.discipline },
                {
                  label: "Member since",
                  value: drawer.createdAt
                    ? new Date(drawer.createdAt).toLocaleDateString("en-KE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—",
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm text-gray-700">{value || "—"}</p>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-100 space-y-2">
              {!drawer.emailVerified &&
                (drawer.role === "reviewer" || drawer.role === "admin") && (
                  <button
                    onClick={() => handleResend(drawer)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-orange-100"
                  >
                    <FaRedo /> Resend Invite Email
                  </button>
                )}
              {drawer.role === "reviewer" && (
                <>
                  <button
                    onClick={() => handlePromote(drawer)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-purple-100"
                  >
                    <FaCrown /> Promote to Admin
                  </button>
                  <button
                    onClick={() => handleRevoke(drawer)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-red-100"
                  >
                    <FaUserSlash /> Revoke Reviewer Access
                  </button>
                </>
              )}
              {drawer.role === "researcher" && (
                <button
                  onClick={() => {
                    handleAssignAsReviewer(drawer);
                    setDrawer(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-100"
                >
                  <FaUserCheck /> Assign as Reviewer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResearchPage;

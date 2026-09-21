import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FaPhone,
  FaShieldAlt,
  FaKey,
  FaUserPlus,
  FaLayerGroup,
  FaArchive,
  FaMicroscope,
  FaRegFileAlt,
  FaChevronDown,
  FaMoneyBillWave,
  FaStamp,
  FaExclamationTriangle,
  FaClipboardCheck,
  FaChartBar,
} from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import notify from "../../common/utils/notify";
import api from "../../api/axios";
import * as research from "../../api/research";
import {DataTable} from "../../common/components"
import OfficerDecisionReports from "./research/OfficerDecisionReports";
import ReviewerWorkloadPanel from "./research/ReviewerWorkloadPanel";

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
  continuing_review: {
    label: "Continuing Review",
    color: "bg-sky-500",
    lightColor: "bg-sky-50",
    textColor: "text-sky-700",
    borderColor: "border-sky-200",
    dotColor: "bg-sky-400",
    icon: FaLayerGroup,
  },
  closed: {
    label: "Closed",
    color: "bg-slate-500",
    lightColor: "bg-slate-50",
    textColor: "text-slate-700",
    borderColor: "border-slate-200",
    dotColor: "bg-slate-400",
    icon: FaArchive,
  },
};


const SUBMISSION_TYPE_META = {
  continuing_review: { label: "Continuing Review", dotColor: "bg-purple-400" },
  amendment: { label: "Amendment", dotColor: "bg-indigo-400" },
  study_closure: { label: "Study Closure", dotColor: "bg-slate-400" },
};

const studyCategory = (study) => {
  const kids = study.childSubmissions || [];
  const closed =
    study.status === "closed" ||
    kids.some(
      (c) => c.submissionType === "study_closure" && ["approved", "closed"].includes(c.status),
    );
  if (closed) return "closed";
  if (kids.some((c) => c.submissionType === "continuing_review")) return "continuing_review";
  return "proposal";
};

const resolveStageMeta = (item) => {
  if (item.parentResearchId && SUBMISSION_TYPE_META[item.submissionType]) {
    return SUBMISSION_TYPE_META[item.submissionType];
  }
  return STAGE_META[studyCategory(item)] || STAGE_META.proposal;
};

const STATUS_META = {
  pending: {
    label: "Under Review",
    color: "bg-blue-100",
    textColor: "text-blue-700",
    icon: FaClock,
    dot: "bg-blue-400",
  },
  returned_for_correction: {
    label: "Returned for Correction",
    color: "bg-orange-100",
    textColor: "text-orange-700",
    icon: FaRedo,
    dot: "bg-orange-400",
  },
  pending_committee_review: {
    label: "Awaiting Committee",
    color: "bg-violet-100",
    textColor: "text-violet-700",
    icon: FaUserTie,
    dot: "bg-violet-400",
  },

  pending_officer_review: {
    label: "Awaiting Officer Release",
    color: "bg-indigo-100",
    textColor: "text-indigo-700",
    icon: FaClipboardCheck,
    dot: "bg-indigo-400",
  },
  revision_requested: {
    label: "Revision Requested",
    color: "bg-amber-100",
    textColor: "text-amber-700",
    icon: FaRedo,
    dot: "bg-amber-400",
  },
  suspended: {
    label: "Suspended",
    color: "bg-orange-100",
    textColor: "text-orange-700",
    icon: FaShieldAlt,
    dot: "bg-orange-500",
  },
  approved: {
    label: "Approved",
    color: "bg-green-100",
    textColor: "text-green-700",
    icon: FaCheckCircle,
    dot: "bg-green-500",
  },
  closed: {
    label: "Closed",
    color: "bg-slate-100",
    textColor: "text-slate-700",
    icon: FaArchive,
    dot: "bg-slate-500",
  },
  under_review: {
    label: "Under Review",
    color: "bg-blue-100",
    textColor: "text-blue-700",
    icon: FaClock,
    dot: "bg-blue-400",
  },
  submitted: {
    label: "Submitted",
    color: "bg-blue-100",
    textColor: "text-blue-700",
    icon: FaClock,
    dot: "bg-blue-400",
  },
  draft: {
    label: "Draft",
    color: "bg-gray-100",
    textColor: "text-gray-600",
    icon: FaRegFileAlt,
    dot: "bg-gray-400",
  },
  expired: {
    label: "Expired",
    color: "bg-orange-100",
    textColor: "text-orange-700",
    icon: FaClock,
    dot: "bg-orange-400",
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

const formatKES = (n) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n || 0);

const ROLE_META = {
  admin: {
    label: "Committee",
    color: "bg-purple-100 text-purple-700",
    icon: FaCrown,
  },
  research_committee: {
    label: "Committee",
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

const RoleBadge = ({ role, isCommittee }) => {
  const effectiveRole = isCommittee ? "research_committee" : role;
  const meta = ROLE_META[effectiveRole] ?? ROLE_META.researcher;
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

  { key: "decisions", label: "Decision Reports", icon: FaClipboardCheck },
  { key: "reviewers", label: "Reviewer Management", icon: FaUserTie },
  { key: "workload", label: "Reviewer Workload", icon: FaChartBar },
];

const ResearchPage = () => {
  const [topTab, setTopTab] = useState("papers");
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center ">
              <FaBookOpen className="text-white" />
            </div>
            <div className="flex flex-col">
              {" "}
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Research Management</h1>
              <p className="text-gray-500 text-sm">
                Manage research papers across all stages and reviewer assignments
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
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <Icon className="text-xs" />
              {label}
            </button>
          ))}
        </div>
        {topTab === "papers" && <PapersPanel />}
        {topTab === "decisions" && <OfficerDecisionReports />}
        {topTab === "reviewers" && <ReviewersPanel />}
        {topTab === "workload" && <ReviewerWorkloadPanel />}
      </div>
    </div>
  );
};

const PapersPanel = () => {
  const navigate = useNavigate();
  const [researchList, setResearchList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [categoryColorMap, setCategoryColorMap] = useState({});
  const [revenue, setRevenue] = useState({
    totalIncome: 0,
    proposalIncome: 0,
    byResearch: [],
  });
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [addResearcherOpen, setAddResearcherOpen] = useState(false);
  const [researcherForm, setResearcherForm] = useState(EMPTY_RESEARCHER);
  const [researcherLoading, setResearcherLoading] = useState(false);
  const [researcherSubmitted, setResearcherSubmitted] = useState(false);

  const [assignReviewerOpen, setAssignReviewerOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [availableReviewers, setAvailableReviewers] = useState([]);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([]);
  const [existingReviewers, setExistingReviewers] = useState([]);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [reviewersLoading, setReviewersLoading] = useState(false);

  const [cscModalOpen, setCscModalOpen] = useState(false);
  const [cscTarget, setCscTarget] = useState(null);
  const [cscForm, setCscForm] = useState({
    cscApprovalDate: "", cscReviewDate: "", cscComments: "",
    cscContactName: "", cscContactEmail: "",
  });
  const [cscEvidenceFile, setCscEvidenceFile] = useState(null);
  const [cscSaving, setCscSaving] = useState(false);

  const openCscModal = (item) => {
    setCscTarget(item);
    setCscForm({
      cscApprovalDate: item.cscApprovalDate?.slice(0, 10) || "",
      cscReviewDate: item.cscReviewDate?.slice(0, 10) || "",
      cscComments: item.cscComments || "",
      cscContactName: item.cscContactName || "",
      cscContactEmail: item.cscContactEmail || "",
    });
    setCscEvidenceFile(null);
    setCscModalOpen(true);
  };

  const submitCscEndorsement = async () => {
    if (!cscTarget) return;
    if (!cscForm.cscApprovalDate) return notify.error("CSC approval date is required.");
    if (!cscForm.cscContactName.trim() || !cscForm.cscContactEmail.trim()) {
      return notify.error("The attesting CSC contact's name and email are required.");
    }
    if (!cscEvidenceFile) {
      return notify.error("Please attach the signed CSC evidence letter (per SOP-1 §10).");
    }
    setCscSaving(true);
    try {
      await research.recordCscEndorsement(cscTarget.id, { ...cscForm, evidenceFile: cscEvidenceFile });
      notify.success("CSC endorsement recorded.");
      setCscModalOpen(false);
      setCscTarget(null);
      fetchResearch();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to record CSC endorsement");
    } finally {
      setCscSaving(false);
    }
  };


  const [completenessModalOpen, setCompletenessModalOpen] = useState(false);
  const [completenessTarget, setCompletenessTarget] = useState(null);
  const [completenessIssues, setCompletenessIssues] = useState([""]);
  const [completenessSaving, setCompletenessSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const openCompletenessModal = (item) => {
    setCompletenessTarget(item);
    setCompletenessIssues(
      Array.isArray(item.completenessIssues) && item.completenessIssues.length
        ? item.completenessIssues
        : [""],
    );
    setCompletenessModalOpen(true);
  };

  const submitReturnForCorrection = async () => {
    if (!completenessTarget) return;
    const cleanIssues = completenessIssues.map((i) => i.trim()).filter(Boolean);
    if (!cleanIssues.length) return notify.error("List at least one issue.");
    setCompletenessSaving(true);
    try {
      await research.returnForCorrection(completenessTarget.id, cleanIssues);
      notify.success("Proposal returned for correction.");
      setCompletenessModalOpen(false);
      setCompletenessTarget(null);
      fetchResearch();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to return proposal");
    } finally {
      setCompletenessSaving(false);
    }
  };

  const handleVerifyCompleteness = async (item) => {
    setVerifyingId(item.id);
    try {
      await research.markCompletenessVerified(item.id);
      notify.success("Completeness verified.");
      fetchResearch();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to verify completeness");
    } finally {
      setVerifyingId(null);
    }
  };

  const [deviationsModalOpen, setDeviationsModalOpen] = useState(false);
  const [deviationsTarget, setDeviationsTarget] = useState(null);
  const [deviationsList, setDeviationsList] = useState([]);
  const [deviationsLoading, setDeviationsLoading] = useState(false);

  const openDeviationsModal = async (item) => {
    setDeviationsTarget(item);
    setDeviationsModalOpen(true);
    setDeviationsLoading(true);
    try {
      const list = await research.getProtocolDeviations(item.id);
      setDeviationsList(list);
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to load protocol deviations");
      setDeviationsList([]);
    } finally {
      setDeviationsLoading(false);
    }
  };

  const MIN_REVIEWERS = 2;

  const fetchResearch = async () => {
    try {
      setLoading(true);
      const res = await api.get("/research/admin/all", { params: { limit: 50 } });
      const papers = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setResearchList(papers);
      setCategoryColorMap(buildCategoryColorMap(papers));
    } catch (err) {
      console.error("Research Fetch error:", err);
      notify.error(err.response?.data?.message || "Error fetching research papers");
      setResearchList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    try {
      setRevenueLoading(true);
      const data = await research.getAllResearchRevenue();
      setRevenue({
        totalIncome: data.totalIncome ?? 0,
        proposalIncome: data.proposalIncome ?? 0,
        byResearch: data.byResearch ?? [],
      });
    } catch (err) {
      console.error("Revenue fetch error:", err);
      notify.error(err.message || "Failed to fetch revenue data");
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => {
    fetchResearch();
    fetchRevenue();
  }, []);


  const nested = React.useMemo(() => {
    const byId = new Map();
    researchList.forEach((r) => byId.set(r.id, { ...r, childSubmissions: [] }));
    const top = [];
    researchList.forEach((r) => {
      const node = byId.get(r.id);
      if (r.parentResearchId && byId.has(r.parentResearchId)) {
        byId.get(r.parentResearchId).childSubmissions.push(node);
      } else {
        top.push(node);
      }
    });
    return top;
  }, [researchList]);

  const filtered = nested.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchIn = (p) =>
      p.title?.toLowerCase().includes(q) ||
      p.researcher?.name?.toLowerCase().includes(q) ||
      p.author?.toLowerCase().includes(q) ||
      p.abstract?.toLowerCase().includes(q);
    const kids = item.childSubmissions || [];
    const matchSearch = !q || matchIn(item) || kids.some(matchIn);
    const matchStage = filterStage === "all" || studyCategory(item) === filterStage;
    const matchStatus =
      filterStatus === "all" ||
      item.status === filterStatus ||
      kids.some((c) => c.status === filterStatus);
    return matchSearch && matchStage && matchStatus;
  });

  const revenueByResearch = revenue.byResearch.reduce((acc, r) => {
    acc[r.researchId] = r;
    return acc;
  }, {});


  const stageCounts = {
    proposal: nested.filter((s) => studyCategory(s) === "proposal").length,
    continuing_review: nested.filter((s) => studyCategory(s) === "continuing_review").length,
    closed: nested.filter((s) => studyCategory(s) === "closed").length,
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
      await api.post("/researchers/admin/create", researcherForm);
      setResearcherSubmitted(true);
      notify.success("Researcher added! Login credentials sent via email.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to add researcher");
    } finally {
      setResearcherLoading(false);
    }
  };

  const handleAssignReviewers = async (e) => {
    e.preventDefault();
    const selectedEmails = availableReviewers
      .filter((r) => selectedReviewerIds.includes(r.id))
      .map((r) => r.email);
    if (selectedEmails.length < MIN_REVIEWERS) {
      notify.error(`At least ${MIN_REVIEWERS} reviewers are required.`);
      return;
    }
    setAssignLoading(true);
    try {
      await research.assignReviewers(assignTarget.id, selectedEmails);
      notify.success(`${selectedEmails.length} reviewer(s) assigned successfully!`);
      setAssignReviewerOpen(false);
      setSelectedReviewerIds([]);
      setExistingReviewers([]);
      setAssignTarget(null);
      setReviewerSearch("");
      fetchResearch();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to assign reviewers");
    } finally {
      setAssignLoading(false);
    }
  };

  const openAssignModal = async (item) => {
    setAssignTarget(item);
    setAssignReviewerOpen(true);
    setReviewerSearch("");
    setReviewersLoading(true);
    try {
      const [reviewerData, existing] = await Promise.all([
        research.listReviewers(),
        research.getResearchReviewers(item.id).catch(() => []),
      ]);
      const allReviewers = reviewerData.reviewers ?? [];
      setAvailableReviewers(allReviewers);
      setExistingReviewers(existing);
      const existingIds = existing.map((r) => r.reviewer?.id || r.reviewerId).filter(Boolean);
      setSelectedReviewerIds(existingIds);
    } catch {
      setAvailableReviewers([]);
      setExistingReviewers([]);
      setSelectedReviewerIds([]);
    } finally {
      setReviewersLoading(false);
    }
  };

  const toggleReviewer = (id) => {
    setSelectedReviewerIds((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Studies",
            value: nested.length,
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
            label: "Continuing Review",
            value: stageCounts.continuing_review,
            color: "indigo",
            icon: FaLayerGroup,
          },
          {
            label: "Closed",
            value: stageCounts.closed,
            color: "emerald",
            icon: FaArchive,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <h3 className={`text-2xl font-bold text-${color}-600`}>{value}</h3>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          {
            label: "Total Income",
            value: revenue.totalIncome,
            color: "green",
            icon: FaMoneyBillWave,
          },
          {
            label: "Proposal Income",
            value: revenue.proposalIncome,
            color: "amber",
            icon: FaRegFileAlt,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <h3 className={`text-2xl font-bold text-${color}-600`}>
                  {revenueLoading ? "…" : formatKES(value)}
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
            count: nested.length,
            color: "bg-gray-100 text-gray-600 border-gray-200",
          },
          {
            key: "proposal",
            label: "Proposal",
            count: stageCounts.proposal,
            color: "bg-amber-50 text-amber-700 border-amber-200",
          },
          {
            key: "continuing_review",
            label: "Continuing Review",
            count: stageCounts.continuing_review,
            color: "bg-sky-50 text-sky-700 border-sky-200",
          },
          {
            key: "closed",
            label: "Closed",
            count: stageCounts.closed,
            color: "bg-slate-100 text-slate-700 border-slate-200",
          },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setFilterStage(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all
              ${
                filterStage === key
                  ? "ring-2 ring-offset-1 ring-blue-400 " + color
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

      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
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
              <option value="submitted">Submitted</option>
              <option value="returned_for_correction">Returned for Correction</option>
              <option value="pending">Under Review</option>
              <option value="pending_committee_review">Awaiting Committee</option>
              <option value="pending_officer_review">Awaiting Officer Release</option>
              <option value="revision_requested">Revision Requested</option>
              <option value="suspended">Suspended</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {(filterStage !== "all" || filterStatus !== "all" || searchTerm) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
            <span className="text-xs text-gray-400">
              Showing {filtered.length} of {nested.length} papers
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
                  <button onClick={chip.clear} className="hover:text-red-500 cursor-pointer ml-0.5">
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

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-500 mt-3 text-sm">Loading research papers…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FaBookOpen className="text-4xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No research papers match your filters</p>
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
          <DataTable
            columns={[
              {
                key: "title",
                label: "Title",
                render: (item) => (
                  <div className="flex items-start gap-3 min-w-0 max-w-[280px]">
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
                        title={item.title}
                        onClick={() => navigate(`/dashboard/research/${item.id}`)}
                      >
                        {item.title}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "author",
                label: "Author",
                render: (item) => (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaUser className="text-gray-400 text-xs shrink-0" />
                    <span className="truncate text-xs">
                      {item.researcher?.name || item.author || "Unknown"}
                    </span>
                  </div>
                ),
              },
              {
                key: "stage",
                label: "Stage",
                align: "center",
                render: (item) => {
                  const stageMeta = resolveStageMeta(item);
                  return (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${stageMeta.dotColor}`} />
                      <span className="inline-block text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-700 uppercase tracking-wider">
                        {stageMeta.label}
                      </span>
                    </div>
                  );
                },
              },
              {
                key: "status",
                label: "Status",
                align: "center",
                render: (item) => {
                  const statusMeta = STATUS_META[item.status] || STATUS_META.pending;
                  const StatusIcon = statusMeta.icon;
                  return (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${statusMeta.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot} shrink-0`} />
                      <StatusIcon className={`text-[10px] ${statusMeta.textColor}`} />
                      <span className={`text-[11px] font-semibold ${statusMeta.textColor}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                  );
                },
              },
              {
                key: "reviewer",
                label: "Assigned Reviewer",
                render: (item) => {
                  const assignedReviewer =
                    item.assignedReviewer && typeof item.assignedReviewer === "object"
                      ? item.assignedReviewer
                      : null;
                  return assignedReviewer ? (
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
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 italic">
                      <FaUserTie className="text-gray-300" /> Unassigned
                    </span>
                  );
                },
              },
              {
                key: "income",
                label: "Proposal Fee",
                align: "right",
                render: (item) => {
                  const itemRevenue = revenueByResearch[item.id];
                  return !itemRevenue || itemRevenue.proposalIncome === 0 ? (
                    <span className="text-xs text-gray-300">—</span>
                  ) : (
                    <span className="text-xs font-bold text-gray-800">
                      {formatKES(itemRevenue.proposalIncome)}
                    </span>
                  );
                },
              },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                render: (item) => {
                  const ASSIGNABLE_STATUSES = [
                    "submitted",
                    "pending",
                    "under_review",
                    "revision_requested",
                    "rejected",
                  ];
                  const canAssignReviewer = ASSIGNABLE_STATUSES.includes(item.status);
                  const assignedReviewer =
                    item.assignedReviewer && typeof item.assignedReviewer === "object"
                      ? item.assignedReviewer
                      : null;
                  return (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/dashboard/research/${item.id}`)}
                        className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                        title="View details"
                      >
                        <FaEye className="text-sm" />
                      </button>
                      {canAssignReviewer && (
                        <button
                          onClick={() => openDeviationsModal(item)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                          title="View protocol deviations"
                        >
                          <FaExclamationTriangle className="text-sm" />
                        </button>
                      )}
                      {canAssignReviewer && item.status === "submitted" && (
                        <>
                          <button
                            onClick={() => openCompletenessModal(item)}
                            className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors"
                            title="Return for correction"
                          >
                            <FaRedo className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleVerifyCompleteness(item)}
                            disabled={verifyingId === item.id}
                            className="p-2 rounded-xl text-green-600 hover:bg-green-50 cursor-pointer transition-colors disabled:opacity-50"
                            title="Verify completeness"
                          >
                            {verifyingId === item.id ? (
                              <div className="w-4 h-4 border-2 border-green-400 border-t-green-600 rounded-full animate-spin" />
                            ) : (
                              <FaCheckCircle className="text-sm" />
                            )}
                          </button>
                        </>
                      )}
                      {item.status === "returned_for_correction" && (
                        <button
                          onClick={() => openCompletenessModal(item)}
                          className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 ring-1 ring-amber-200 cursor-pointer transition-colors"
                          title="View/edit correction issues"
                        >
                          <FaRedo className="text-sm" />
                        </button>
                      )}
                      {canAssignReviewer && item.submissionType === "initial_proposal" && (
                        <button
                          onClick={() => openCscModal(item)}
                          className={`p-2 rounded-xl cursor-pointer transition-colors ${item.cscApprovalDate ? "text-teal-500 hover:bg-teal-50 ring-1 ring-teal-200" : "text-teal-600 hover:bg-teal-50"}`}
                          title={item.cscApprovalDate ? "CSC endorsement recorded" : "Record CSC endorsement"}
                        >
                          <FaStamp className="text-sm" />
                        </button>
                      )}
                      {canAssignReviewer && (
                        <button
                          onClick={() => openAssignModal(item)}
                          className={`p-2 rounded-xl cursor-pointer transition-colors ${assignedReviewer ? "text-purple-500 hover:bg-purple-50 ring-1 ring-purple-200" : "text-purple-600 hover:bg-purple-50"}`}
                          title={assignedReviewer ? "Manage reviewers" : "Assign reviewers"}
                        >
                          <FaUserTie className="text-sm" />
                        </button>
                      )}
                    </div>
                  );
                },
              },
            ]}
            data={filtered}
            rowKey={(item) => item.id}
            expandable={{
              getChildren: (row) => row.childSubmissions,
              childUsesColumns: true,
            }}
          />
        )}
      </div>


      {addResearcherOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-xl overflow-hidden"
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
                  <h3 className="text-lg font-bold text-white leading-tight">Add Researcher</h3>
                  <p className="text-blue-200 text-xs">Account created by admin</p>
                </div>
              </div>
            </div>
            <div className="h-3 bg-primary relative">
              <div className="absolute inset-x-0 bottom-0 h-3 bg-white rounded-t-2xl" />
            </div>

            {!researcherSubmitted ? (
              <form onSubmit={handleAddResearcher} className="px-6 pb-6 pt-2 space-y-4">
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <FaKey className="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    A secure password will be <span className="font-semibold">auto-generated</span>{" "}
                    and sent to the researcher's email along with their login credentials.
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
                <h4 className="text-lg font-bold text-gray-900">Account Created!</h4>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                  <span className="font-semibold text-gray-700">
                    {researcherForm.firstName} {researcherForm.lastName}
                  </span>{" "}
                  has been added as a researcher. Login instructions have been sent to{" "}
                  <span className="font-semibold text-blue-600">{researcherForm.email}</span>.
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

      {assignReviewerOpen && assignTarget && (() => {
        const closeAssignModal = () => {
          setAssignReviewerOpen(false);
          setAssignTarget(null);
          setSelectedReviewerIds([]);
          setExistingReviewers([]);
          setReviewerSearch("");
        };

        const q = reviewerSearch.trim().toLowerCase();
        const visibleReviewers = availableReviewers.filter((r) => {
          if (!q) return true;
          return (
            r.name?.toLowerCase().includes(q) ||
            r.email?.toLowerCase().includes(q) ||
            r.institution?.toLowerCase().includes(q)
          );
        });
        const selectedCount = selectedReviewerIds.length;
        const canSubmit = selectedCount >= MIN_REVIEWERS;

        return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{
              animation: "modalPop .25s cubic-bezier(.34,1.56,.64,1) both",
            }}
          >
            <div className="relative bg-purple-700 px-6 pt-6 pb-8 shrink-0">
              <button
                onClick={closeAssignModal}
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
                    Assign Reviewers
                  </h3>
                  <p className="text-purple-200 text-xs truncate">{assignTarget.title}</p>
                </div>
              </div>
            </div>
            <div className="h-3 bg-primary relative shrink-0">
              <div className="absolute inset-x-0 bottom-0 h-3 bg-white rounded-t-2xl" />
            </div>

            <form
              onSubmit={handleAssignReviewers}
              className="px-6 pb-6 pt-2 space-y-4 overflow-y-auto flex-1 min-h-0"
            >
              <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                <FaShieldAlt className="text-purple-500 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-xs text-purple-700 leading-relaxed">
                  Select at least <span className="font-semibold">{MIN_REVIEWERS} reviewers</span>{" "}
                  from the registered reviewer pool. Each selected reviewer will be notified.
                </p>
              </div>

              {existingReviewers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-amber-800 mb-1.5">Currently assigned</p>
                  <div className="space-y-1">
                    {existingReviewers.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-amber-700">
                        <FaUserTie className="text-amber-500 text-[10px] shrink-0" />
                        <span className="font-medium">{r.reviewer?.name || r.name || "Reviewer"}</span>
                        <span className="text-amber-500">({r.reviewer?.email || r.email})</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1.5">
                    Submitting will update the full reviewer list.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Reviewers <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {selectedCount} selected · minimum {MIN_REVIEWERS}
                  </span>
                </div>

                {/* Select dropdown to add reviewers */}
                <div className="relative">
                  {reviewersLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400">
                      <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                      Loading reviewers…
                    </div>
                  ) : (
                    <select
                      value=""
                      onChange={(e) => {
                        const id = Number(e.target.value) || e.target.value;
                        if (id && !selectedReviewerIds.includes(id)) {
                          setSelectedReviewerIds((prev) => [...prev, id]);
                        }
                      }}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer appearance-none bg-white"
                    >
                      <option value="">— Select a reviewer to add —</option>
                      {availableReviewers
                        .filter((r) => !selectedReviewerIds.includes(r.id))
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} — {r.email}{r.institution ? ` (${r.institution})` : ""}
                          </option>
                        ))}
                    </select>
                  )}
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                </div>

   
                {selectedCount > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedReviewerIds.map((id) => {
                      const r = availableReviewers.find((rev) => rev.id === id);
                      if (!r) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-xs font-semibold text-purple-700">
                          {r.name}
                          <button
                            type="button"
                            onClick={() => setSelectedReviewerIds((prev) => prev.filter((rid) => rid !== id))}
                            className="text-purple-400 hover:text-red-500 cursor-pointer"
                          >
                            <FaTimes className="text-[9px]" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {availableReviewers.length === 0 && !reviewersLoading && (
                  <p className="text-xs text-gray-400 text-center py-2">No reviewers available yet.</p>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Paper being assigned
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">{assignTarget.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 uppercase tracking-wider">
                    {STAGE_META[assignTarget.stage || "proposal"]?.label}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {assignTarget.researcher?.name || assignTarget.author || "Unknown author"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !canSubmit}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  {assignLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Assigning…
                    </>
                  ) : (
                    <>
                      <FaUserTie /> Assign {selectedCount} Reviewer{selectedCount !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {cscModalOpen && cscTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-teal-600 px-6 py-4 flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <FaStamp /> CSC Endorsement
                </h3>
                <p className="text-teal-100 text-xs truncate max-w-lg">{cscTarget.title}</p>
              </div>
              <button onClick={() => setCscModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500">
                Reviewer assignment is blocked until Centre Scientific Committee (CSC) endorsement
                is recorded here, per SOP-1 to 10. A supporting evidence document (e.g. the signed
                Secretary letter) and the attesting contact's details are required.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">CSC Approval Date *</label>
                  <input type="date" value={cscForm.cscApprovalDate}
                    onChange={(e) => setCscForm((f) => ({ ...f, cscApprovalDate: e.target.value }))}
                    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">CSC Review Date</label>
                  <input type="date" value={cscForm.cscReviewDate}
                    onChange={(e) => setCscForm((f) => ({ ...f, cscReviewDate: e.target.value }))}
                    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Attesting CSC Contact Name *</label>
                  <input type="text" value={cscForm.cscContactName}
                    onChange={(e) => setCscForm((f) => ({ ...f, cscContactName: e.target.value }))}
                    placeholder="e.g. Dr. Jane Doe, CSC Secretary"
                    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Attesting CSC Contact Email *</label>
                  <input type="email" value={cscForm.cscContactEmail}
                    onChange={(e) => setCscForm((f) => ({ ...f, cscContactEmail: e.target.value }))}
                    placeholder="jane.doe@example.org"
                    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Comments</label>
                <textarea rows={2} value={cscForm.cscComments}
                  onChange={(e) => setCscForm((f) => ({ ...f, cscComments: e.target.value }))}
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Evidence Document (signed CSC letter) *
                </label>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setCscEvidenceFile(e.target.files[0] || null)}
                  className="w-full mt-1 text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg
                    file:border-0 file:bg-teal-50 file:text-teal-700 file:text-xs file:font-semibold" />
                {cscEvidenceFile && <p className="text-xs text-emerald-600 mt-1">Selected: {cscEvidenceFile.name}</p>}
                {!cscEvidenceFile && cscTarget.cscEvidenceFile && (
                  <p className="text-xs text-gray-400 mt-1">
                    Evidence already on file — select a new file only to replace it.
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setCscModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button onClick={submitCscEndorsement} disabled={cscSaving}
                className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer disabled:opacity-50">
                {cscSaving ? "Saving…" : "Record Endorsement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {completenessModalOpen && completenessTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-amber-500 px-6 py-4 flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <FaRedo /> Administrative Completeness
                </h3>
                <p className="text-amber-100 text-xs truncate">{completenessTarget.title}</p>
              </div>
              <button onClick={() => setCompletenessModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500">
                List each missing or incorrect item. The proposal will be returned to the
                researcher with these issues and cannot proceed to CSC endorsement or reviewer
                assignment until resubmitted.
              </p>

              <div className="space-y-2">
                {completenessIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={issue}
                      onChange={(e) => {
                        const next = [...completenessIssues];
                        next[idx] = e.target.value;
                        setCompletenessIssues(next);
                      }}
                      placeholder={`Issue ${idx + 1} (e.g. "Budget breakdown missing")`}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    {completenessIssues.length > 1 && (
                      <button
                        onClick={() => setCompletenessIssues(completenessIssues.filter((_, i) => i !== idx))}
                        className="p-2 text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setCompletenessIssues([...completenessIssues, ""])}
                  className="text-xs font-semibold text-amber-600 hover:underline cursor-pointer"
                >
                  Add another issue
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setCompletenessModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button onClick={submitReturnForCorrection} disabled={completenessSaving}
                className="px-4 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg cursor-pointer disabled:opacity-50">
                {completenessSaving ? "Saving…" : "Return for Correction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deviationsModalOpen && deviationsTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="bg-rose-600 px-6 py-4 flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <FaExclamationTriangle /> Protocol Deviations
                </h3>
                <p className="text-rose-100 text-xs truncate">{deviationsTarget.title}</p>
              </div>
              <button onClick={() => setDeviationsModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <FaTimes />
              </button>
            </div>

            <div className="p-6">
              {deviationsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                </div>
              ) : deviationsList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No protocol deviations reported for this study.</p>
              ) : (
                <div className="space-y-3">
                  {deviationsList.map((d) => {
                    const sevStyle = d.severity === "critical" ? "bg-red-100 text-red-700"
                      : d.severity === "major" ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600";
                    return (
                      <div key={d.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sevStyle}`}>
                              {d.severity?.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400 capitalize">
                              {d.deviationType?.replace(/_/g, " ")}
                            </span>
                            {d.isUrgentSafety && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-600 text-white">
                                URGENT SAFETY
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {d.dateOfDeviation ? new Date(d.dateOfDeviation).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{d.description}</p>
                        {d.correctiveAction && (
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="font-semibold">Corrective action:</span> {d.correctiveAction}
                          </p>
                        )}
                        {d.researcher?.name && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            Reported by {d.researcher.name}
                            {d.participantsAffected ? ` · ${d.participantsAffected} participant(s) affected` : ""}
                          </p>
                        )}
                        {d.deadline && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            Response due: {new Date(d.deadline).toLocaleDateString()}
                          </p>
                        )}
                        {d.atRiskParticipantList && (
                          <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2">
                            <p className="text-[11px] font-semibold text-red-600">At-risk participant details</p>
                            <p className="text-xs text-red-700">{d.atRiskParticipantList}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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

  const [committeeInviteOpen, setCommitteeInviteOpen] = useState(false);
  const [committeeInviteForm, setCommitteeInviteForm] = useState(EMPTY_INVITE);
  const [committeeInviteLoading, setCommitteeInviteLoading] = useState(false);

  const [addResearcherOpen, setAddResearcherOpen] = useState(false);
  const [researcherForm, setResearcherForm] = useState(EMPTY_RESEARCHER);
  const [researcherLoading, setResearcherLoading] = useState(false);
  const [researcherSubmitted, setResearcherSubmitted] = useState(false);

  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const [drawer, setDrawer] = useState(null);

  const loadReviewers = async () => {
    try {
      const data = await research.listReviewers();
      setReviewers(data.reviewers ?? []);
    } catch {
      notify.error("Failed to load reviewers");
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
      notify.error("Failed to load researchers");
    }
  };

  const loadAll = async () => {
    try {
      const data = await research.listAllResearchers({ limit: 200 });
      setAllMembers(data.researchers ?? []);
    } catch {
      notify.error("Failed to load all members");
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

  const committeeMembers = reviewers.filter(
    (r) => r.role === "research_committee" || r.isCommittee === true
  );
  const activeReviewers = reviewers.filter((r) => r.role === "reviewer" && !r.isCommittee);

  const SOURCE_MAP = {
    reviewers: activeReviewers,
    committee: committeeMembers,
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

  const totalReviewers = activeReviewers.length;
  const pendingSetup = reviewers.filter((r) => !r.emailVerified).length;
  const totalResearchers = researchers.length;

  const roleFilterOptions = {
    reviewers: [
      { value: "all", label: "All Roles" },
      { value: "reviewer", label: "Reviewer" },
    ],
    committee: [],
    researchers: [],
    all: [
      { value: "all", label: "All Roles" },
      { value: "research_committee", label: "Committee" },
      { value: "reviewer", label: "Reviewer" },
      { value: "researcher", label: "Researcher" },
    ],
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const result = await research.inviteReviewer(inviteForm);
      notify.success(result.message);
      setInviteOpen(false);
      setInviteForm(EMPTY_INVITE);
      refreshAll();
    } catch (err) {
      notify.error(err.message || "Failed to invite reviewer");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCommitteeInvite = async (e) => {
    e.preventDefault();
    setCommitteeInviteLoading(true);
    try {
      const result = await research.inviteCommitteeMember(committeeInviteForm);
      notify.success(result.message);
      setCommitteeInviteOpen(false);
      setCommitteeInviteForm(EMPTY_INVITE);
      refreshAll();
    } catch (err) {
      notify.error(err.message || "Failed to invite committee member");
    } finally {
      setCommitteeInviteLoading(false);
    }
  };

  const handleAddResearcher = async (e) => {
    e.preventDefault();
    setResearcherLoading(true);
    try {
      await api.post("/researchers/admin/create", researcherForm);
      setResearcherSubmitted(true);
      notify.success("Researcher added! Login credentials sent via email.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to add researcher");
    } finally {
      setResearcherLoading(false);
    }
  };

  const handleRevoke = async (member) => {
    if (!window.confirm(`Revoke reviewer access for ${member.name}?`)) return;
    try {
      const result = await research.revokeReviewer(member.id);
      notify.success(result.message);
      if (drawer?.id === member.id) setDrawer(null);
      refreshAll();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to revoke reviewer");
    }
  };

  const handlePromote = async (member) => {
    if (!window.confirm(`Promote ${member.name} to Research Committee?`)) return;
    try {
      const result = await research.promoteToAdmin(member.id, member.email);
      notify.success(result.message);
      if (drawer?.id === member.id) setDrawer({ ...drawer });
      refreshAll();
    } catch (err) {
      notify.error(err.response?.data?.message || "Promotion failed");
    }
  };

  const handleResend = async (member) => {
    try {
      const result = await research.resendInvite(member.id);
      notify.success(result.message);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to resend invite");
    }
  };

  const handleAssignAsReviewer = async (member) => {
    try {
      const result = await research.inviteReviewer({ email: member.email });
      notify.success(result.message);
      refreshAll();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed");
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
            label: "Committee",
            value: committeeMembers.length,
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
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <h3 className={`text-2xl font-bold text-${color}-600`}>{value}</h3>
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
            { key: "reviewers", label: "Reviewers" },
            { key: "committee", label: "Committee" },
            { key: "researchers", label: "Researchers" },
            { key: "all", label: "All Members" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                memberTab === key ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {label}
              <span
                className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  memberTab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {SOURCE_MAP[key]?.length ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setActionMenuOpen((p) => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 cursor-pointer transition-colors"
          >
            <FaPlus /> Add Member <FaChevronDown className="text-xs ml-1" />
          </button>
          {actionMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl z-20 overflow-hidden">
                <button
                  onClick={() => {
                    setInviteOpen(true);
                    setActionMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                >
                  <FaUserTie className="text-blue-500 shrink-0" />
                  <span className="font-semibold">Invite Reviewer</span>
                </button>
                <div className="border-t border-gray-50" />
                <button
                  onClick={() => {
                    setCommitteeInviteOpen(true);
                    setActionMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition-colors"
                >
                  <FaCrown className="text-purple-500 shrink-0" />
                  <span className="font-semibold">Invite Committee</span>
                </button>
                <div className="border-t border-gray-50" />
                <button
                  onClick={() => {
                    setResearcherForm(EMPTY_RESEARCHER);
                    setResearcherSubmitted(false);
                    setAddResearcherOpen(true);
                    setActionMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 cursor-pointer transition-colors"
                >
                  <FaUserPlus className="text-teal-500 shrink-0" />
                  <span className="font-semibold">Add Researcher</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
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
          {roleFilterOptions[memberTab]?.length > 0 && (
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
                  <button onClick={chip.clear} className="hover:text-red-500 cursor-pointer ml-0.5">
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

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                  {["Member", "Institution", "Discipline", "Role", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h ? "text-left" : "text-right"}`}
                    >
                      {h || "Actions"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-400 truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{member.institution || "—"}</td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{member.discipline || "—"}</td>
                    <td className="px-5 py-4">
                      <RoleBadge role={member.role} isCommittee={member.isCommittee} />
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
                            member.role === "research_committee" ||
                            member.role === "admin") && (
                            <button
                              onClick={() => handleResend(member)}
                              className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-50 cursor-pointer"
                              title="Resend invite"
                            >
                              <FaRedo />
                            </button>
                          )}
                        {member.role === "reviewer" && !member.isCommittee && (
                          <button
                            onClick={() => handlePromote(member)}
                            className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-50 cursor-pointer"
                            title="Promote to Committee"
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
                        {member.role === "reviewer" && !member.isCommittee && (
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

      {inviteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Invite Reviewer</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter an existing researcher's email to promote them, or fill all fields to create
                  a new account.
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
                    onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="reviewer@institution.ac.ke"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  If this email belongs to an existing researcher they'll be promoted automatically.
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
                      onChange={(e) => setInviteForm((p) => ({ ...p, [name]: e.target.value }))}
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
                      onChange={(e) => setInviteForm((p) => ({ ...p, [name]: e.target.value }))}
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

      {committeeInviteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Invite Committee Member</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter an existing member's email to grant committee access, or fill all fields to
                  create a new account.
                </p>
              </div>
              <button
                onClick={() => {
                  setCommitteeInviteOpen(false);
                  setCommitteeInviteForm(EMPTY_INVITE);
                }}
                className="p-2 rounded-lg cursor-pointer"
              >
                <FaTimes className="text-gray-400 hover:text-red-500 text-xl" />
              </button>
            </div>
            <form onSubmit={handleCommitteeInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email"
                    required
                    value={committeeInviteForm.email}
                    onChange={(e) =>
                      setCommitteeInviteForm((p) => ({
                        ...p,
                        email: e.target.value,
                      }))
                    }
                    placeholder="committee@institution.ac.ke"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Existing researchers or reviewers will be promoted to the Research Committee
                  automatically.
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
                      value={committeeInviteForm[name]}
                      onChange={(e) =>
                        setCommitteeInviteForm((p) => ({
                          ...p,
                          [name]: e.target.value,
                        }))
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
                  value={committeeInviteForm.institution}
                  onChange={(e) =>
                    setCommitteeInviteForm((p) => ({
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
                      value={committeeInviteForm[name]}
                      onChange={(e) =>
                        setCommitteeInviteForm((p) => ({
                          ...p,
                          [name]: e.target.value,
                        }))
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
                    setCommitteeInviteOpen(false);
                    setCommitteeInviteForm(EMPTY_INVITE);
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 cursor-pointer rounded-lg text-sm hover:bg-red-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={committeeInviteLoading}
                  className="px-5 py-2 bg-purple-600 text-white cursor-pointer rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {committeeInviteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                      Sending…
                    </>
                  ) : (
                    <>
                      <FaCrown /> Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addResearcherOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-xl overflow-hidden"
            style={{
              animation: "modalPop .25s cubic-bezier(.34,1.56,.64,1) both",
            }}
          >
            <div className="relative bg-blue-700 px-6 pt-6 pb-8">
              <button
                onClick={() => {
                  setAddResearcherOpen(false);
                  setResearcherForm(EMPTY_RESEARCHER);
                  setResearcherSubmitted(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
              >
                <FaTimes className="text-white text-xs" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FaUserPlus className="text-white text-base" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">Add Researcher</h3>
                  <p className="text-blue-200 text-xs">Account created by admin</p>
                </div>
              </div>
            </div>
            <div className="h-3 bg-primary relative">
              <div className="absolute inset-x-0 bottom-0 h-3 bg-white rounded-t-2xl" />
            </div>
            {!researcherSubmitted ? (
              <form onSubmit={handleAddResearcher} className="px-6 pb-6 pt-2 space-y-4">
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <FaKey className="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    A secure password will be <span className="font-semibold">auto-generated</span>{" "}
                    and sent to the researcher's email along with their login credentials.
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
                        onChange={(e) =>
                          setResearcherForm((p) => ({
                            ...p,
                            [e.target.name]: e.target.value,
                          }))
                        }
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
                      onChange={(e) =>
                        setResearcherForm((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setResearcherForm((p) => ({
                          ...p,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+254 700 000 000"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAddResearcherOpen(false);
                      setResearcherForm(EMPTY_RESEARCHER);
                      setResearcherSubmitted(false);
                    }}
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
                <h4 className="text-lg font-bold text-gray-900">Account Created!</h4>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                  <span className="font-semibold text-gray-700">
                    {researcherForm.firstName} {researcherForm.lastName}
                  </span>{" "}
                  has been added as a researcher. Login instructions have been sent to{" "}
                  <span className="font-semibold text-blue-600">{researcherForm.email}</span>.
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
                    onClick={() => {
                      setAddResearcherOpen(false);
                      setResearcherForm(EMPTY_RESEARCHER);
                      setResearcherSubmitted(false);
                      refreshAll();
                    }}
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
              <button onClick={() => setDrawer(null)} className="p-1.5 rounded-lg cursor-pointer">
                <FaTimes className="text-gray-400 hover:text-red-500 text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex flex-col items-center text-center gap-2 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                  {drawer.name?.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-gray-900 text-lg">{drawer.name}</p>
                <p className="text-sm text-gray-400">{drawer.email}</p>
                <RoleBadge role={drawer.role} isCommittee={drawer.isCommittee} />
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
                (drawer.role === "reviewer" ||
                  drawer.role === "research_committee" ||
                  drawer.role === "admin") && (
                  <button
                    onClick={() => handleResend(drawer)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-orange-100"
                  >
                    <FaRedo /> Resend Invite Email
                  </button>
                )}
              {drawer.role === "reviewer" && !drawer.isCommittee && (
                <>
                  <button
                    onClick={() => handlePromote(drawer)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-purple-100"
                  >
                    <FaCrown /> Promote to Committee
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
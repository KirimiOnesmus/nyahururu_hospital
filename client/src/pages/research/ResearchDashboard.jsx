import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Header, Footer } from "../../components/layouts";
import ReviewModal from "../../components/research/ReviewModal";
import SubmitProposalPage from "../../components/research/SubmitProposal";
import SubmitFullPaper from "../../components/research/SubmitFullPaper";
import MyProfile from "./MyProfile";
import { ResearcherStatsSection } from "../../components/research/ResearcherStatsSection"
import {
  FaFlask, FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaPlus, FaEye, FaDownload, FaUsers, FaChartBar, FaInbox,
  FaBell, FaSearch, FaChevronDown, FaChevronRight, FaUserCircle,
  FaSignOutAlt, FaBookOpen, FaEdit, FaCommentAlt, FaArrowRight,
  FaShieldAlt, FaStar, FaCalendarAlt, FaUniversity, FaUser,
} from "react-icons/fa";
import { getResearcherProfile } from "../../api/auth";
import * as research from "../../api/research";


export const STAGE_LABELS = { 
  proposal: "Proposal", 
  abstract: "Abstract", 
  final_paper: "Final Paper" 
};

export const STAGE_COLORS = {
  proposal: "bg-blue-100 text-blue-700",
  abstract: "bg-purple-100 text-purple-700",
  final_paper: "bg-green-100 text-green-700",
};

const STATUS_CONFIG = {
  approved: { label: "Approved", icon: FaCheckCircle, cls: "text-green-600 bg-green-50 border-green-200" },
  pending: { label: "Under Review", icon: FaClock, cls: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  rejected: { label: "Needs Revision", icon: FaTimesCircle, cls: "text-red-600 bg-red-50 border-red-200" },
};

const PAGE_LABELS = {
  dashboard: { researcher: "My Dashboard", admin: "Reviewer Dashboard" },
  "submit-proposal": { researcher: "Submit Proposal", admin: "Submit Proposal" },
  "submit-full-paper": { researcher: "Submit Final Paper", admin: "Submit Final Paper" },
  profile: { researcher: "My Profile", admin: "My Profile" },
};

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });


const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="text-lg text-white" />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 leading-tight">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// RESEARCHER DASHBOARD

const ResearcherDashboard = ({ user, onNewProposal, onSubmitFullPaper }) => {
  const [myResearch, setMyResearch] = useState([]);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [loadingResearch, setLoadingResearch] = useState(true);

  // Fetch researcher's research submissions
  useEffect(() => {
    const fetchMyResearch = async () => {
      try {
        setLoadingResearch(true);
        const response = await research.getMyResearch();
        setMyResearch(response.research || []);
      } catch (err) {
        console.error("Failed to fetch my research:", err);
        toast.error("Failed to load your research submissions");
      } finally {
        setLoadingResearch(false);
      }
    };

    fetchMyResearch();
  }, []);

  const filtered = filter === "all" 
    ? myResearch 
    : myResearch.filter((r) => r.status === filter);

  const nextStageAction = (item) => {
    if (item.status !== "approved") return null;
    if (item.stage === "proposal") 
      return { label: "Submit Abstract", action: "submit-abstract" };
    if (item.stage === "abstract") 
      return { label: "Submit Final Paper", action: "submit-final" };
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative bg-blue-700 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back,</p>
            <h2 className="text-2xl font-extrabold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              {user.institution} · {user.discipline}
            </p>
          </div>
          <button
            onClick={onNewProposal}
            className="flex items-center gap-2 bg-yellow-400
             hover:bg-yellow-300 text-gray-900 font-bold px-5 py-3 rounded-xl
              transition-all hover:-translate-y-0.5 shadow-md self-start 
              sm:self-auto whitespace-nowrap cursor-pointer"
          >
            <FaPlus /> New Proposal
          </button>
        </div>
      </div>

  
      <ResearcherStatsSection myResearch={myResearch} isLoading={loadingResearch} />

    
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <FaBookOpen className="text-blue-500" /> My Research
          </h3>
          <div className="flex gap-2 flex-wrap">
            {["all", "approved", "pending", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold 
                  border transition-all cursor-pointer ${
                  filter === f
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {f === "all" 
                  ? "All" 
                  : f === "approved" 
                    ? "Approved" 
                    : f === "pending" 
                      ? "Pending" 
                      : "Needs Revision"}
              </button>
            ))}
          </div>
        </div>

        {loadingResearch ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
            <p className="text-gray-500 font-medium mt-2">Loading your research...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FaFlask className="text-gray-200 text-4xl mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No submissions yet</p>
            <button 
              onClick={onNewProposal}
              className="mt-4 text-blue-600 text-sm font-semibold 
              hover:underline flex items-center gap-1 mx-auto cursor-pointer"
            >
              Submit your first proposal <FaArrowRight className="text-xs" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((item) => {
              const sc = STATUS_CONFIG[item.status];
              const StatusIcon = sc.icon;
              const action = nextStageAction(item);
              const isOpen = expanded === item.id;
              return (
                <div key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <div
                    className="px-6 py-4 cursor-pointer flex items-start gap-4"
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                  >
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-0.5 flex-shrink-0 ${STAGE_COLORS[item.stage]}`}>
                      {STAGE_LABELS[item.stage]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt /> Submitted {fmt(item.submittedAt)}
                            
                        </span>
                        {item.downloads > 0 && (
                          <span className="flex items-center gap-1">
                            <FaDownload /> {item.downloads} downloads
                          </span>
                        )}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${sc.cls}`}>
                      <StatusIcon className="text-[11px]" /> {sc.label}
                    </span>
                    <FaChevronDown 
                      className={`text-gray-400 text-xs mt-1.5 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`} 
                    />
                  </div>

                  {isOpen && (
                    <div className="px-6 pb-5 space-y-3 border-t border-gray-50 pt-4 bg-gray-50/50">
                      {item.reviewComment && (
                        <div 
                          className={`rounded-lg px-4 py-3 border text-sm leading-relaxed flex items-start gap-2 ${
                            item.status === "approved"
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-red-50 border-red-200 text-red-800"
                          }`}
                        >
                          <FaCommentAlt className="mt-0.5 flex-shrink-0 text-xs" />
                          <span>
                            <span className="font-semibold">Reviewer feedback: </span>
                            {item.reviewComment}
                          </span>
                        </div>
                      )}
                      {item.reviewedAt && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <FaCalendarAlt /> Reviewed on {fmt(item.reviewedAt)}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {item.status === "rejected" && (
                          <button 
                            onClick={onNewProposal}
                            className="flex items-center gap-2 bg-blue-600
                             hover:bg-blue-700 text-white text-xs cursor-pointer
                             font-bold px-4 py-2 rounded-lg transition-all"
                          >
                            <FaEdit /> Resubmit (Free)
                          </button>
                        )}
                        {action && (
                          <button
                            onClick={() => 
                              action.action === "submit-final" 
                                ? onSubmitFullPaper(item) 
                                : onNewProposal()
                            }
                            className="flex items-center gap-2 bg-green-600
                             hover:bg-green-700 text-white text-xs cursor-pointer
                             font-bold px-4 py-2 rounded-lg transition-all"
                          >
                            <FaArrowRight /> {action.label}
                          </button>
                        )}
                        <button className="flex items-center gap-2 border
                         border-gray-200 text-gray-600 hover:border-blue-300
                          hover:text-blue-600 text-xs font-semibold px-4 py-2 
                          rounded-lg transition-all cursor-pointer">
                          <FaEye /> View Full
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <FaStar className="text-yellow-400" /> Submission Tips
        </h4>
        <ul className="space-y-1.5 text-sm text-gray-600">
          {[
            "Abstracts must be at least 30 words with clear objectives",
            "Resubmissions after rejection are completely free",
            "Final papers must be submitted as PDF (max 10 MB)",
            "You'll receive an email notification on every status change",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0 text-xs" /> {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

//admin / reviewer dashboard
const AdminDashboard = ({ user }) => {
  const [queue, setQueue] = useState([]);
  const [reviewing, setReviewing] = useState(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [loadingQueue, setLoadingQueue] = useState(true);

  
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoadingQueue(true);
        const response = await research.getPendingReviews({
          stage: stageFilter === "all" ? undefined : stageFilter,
          search: search || undefined,
          page: 1,
          limit: 50,
        });
        setQueue(response.queue || []);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        toast.error("Failed to load review queue");
      } finally {
        setLoadingQueue(false);
      }
    };

    fetchQueue();
  }, [stageFilter, search]);

  // Calculate stats from real data
  const stats = {
    total: queue.length,
    pending: queue.filter((q) => q.status === "pending").length,
    approved: 0, 
    researchers: 0, 
  };

  const handleDecision = (id) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
    setReviewing(null);
    toast.success("Decision recorded successfully");
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FaShieldAlt className="text-yellow-300 text-sm" />
              <p className="text-indigo-200 text-sm font-medium">Reviewer Panel</p>
            </div>
            <h2 className="text-2xl font-extrabold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-indigo-200 text-sm mt-1">{user.institution}</p>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/30 border border-red-400/40 rounded-xl px-4 py-2 self-start sm:self-auto">
              <FaBell className="text-red-300 animate-pulse" />
              <span className="text-white text-sm font-bold">
                {queue.length} pending review{queue.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={FaInbox} 
          label="Total Submissions" 
          value={stats.total} 
          color="bg-indigo-500" 
        />
        <StatCard 
          icon={FaClock} 
          label="Awaiting Review" 
          value={stats.pending} 
          color="bg-yellow-500" 
          sub="Needs action" 
        />
        <StatCard 
          icon={FaCheckCircle} 
          label="Approved" 
          value={stats.approved} 
          color="bg-green-500" 
        />
        <StatCard 
          icon={FaUsers} 
          label="Researchers" 
          value={stats.researchers} 
          color="bg-blue-500" 
        />
      </div>

      {/* Review Queue */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <FaInbox className="text-indigo-500" /> Review Queue
              {queue.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {queue.length}
                </span>
              )}
            </h3>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input 
                type="text" 
                placeholder="Search by title or author…" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200
                 rounded-lg text-sm text-gray-800 placeholder-gray-400
                  outline-none focus:ring focus:ring-indigo-400 bg-gray-50" 
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "proposal", "abstract", "final_paper"].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setStageFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold 
                    border transition-all whitespace-nowrap cursor-pointer ${
                    stageFilter === s 
                      ? "bg-indigo-600 text-white border-indigo-600" 
                      : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {s === "all" 
                    ? "All" 
                    : s === "final_paper" 
                      ? "Final Paper" 
                      : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadingQueue ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
            <p className="text-gray-500 font-medium mt-2">Loading review queue...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-16">
            <FaCheckCircle className="text-green-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">All caught up!</p>
            <p className="text-gray-400 text-sm mt-1">No submissions pending review.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {queue.map((item, i) => (
              <div 
                key={item.id} 
                className="px-6 py-5 hover:bg-gray-50/60 transition-colors"
                style={{ animation: `fadeIn .3s ease ${i * 0.05}s both` }}
              >
                <div className="flex items-start gap-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-0.5 flex-shrink-0 ${STAGE_COLORS[item.stage]}`}>
                    {STAGE_LABELS[item.stage]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm leading-snug mb-1">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <FaUserCircle /> {item.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaUniversity /> {item.institution}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt /> {fmt(item.submittedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {item.abstract}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button 
                      onClick={() => setReviewing(item)}
                      className="flex items-center gap-2 bg-indigo-600
                       hover:bg-indigo-700 text-white text-xs font-bold 
                       px-4 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 
                       shadow-sm whitespace-nowrap cursor-pointer"
                    >
                      <FaShieldAlt /> Review
                    </button>
                    <button className="flex items-center gap-2 border border-gray-200
                     text-gray-500 hover:border-indigo-300 hover:text-indigo-600 
                     text-xs font-semibold px-4 py-2 rounded-lg transition-all
                      whitespace-nowrap cursor-pointer">
                      <FaEye /> View File
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewing && (
        <ReviewModal 
          item={reviewing} 
          onClose={() => setReviewing(null)} 
          onDecision={handleDecision} 
        />
      )}
    </div>
  );
};


const ResearchDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedResearch, setSelectedResearch] = useState(null);

  const role = localStorage.getItem("role") || "researcher";
  const isAdmin = ["admin", "superadmin", "it", "reviewer"].includes(role);

 
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getResearcherProfile();
        setUser(response.researcher);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        const storedUser = localStorage.getItem("researcher");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          toast.error("Failed to load user profile");
          navigate("/hmis");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("collection");
    localStorage.removeItem("researcher");
    navigate("/hmis");
    toast.success("Logged out successfully");
  };

  const goTo = (page) => setCurrentPage(page);
  const backToDashboard = () => setCurrentPage("dashboard");

  const breadcrumbLabel =
    PAGE_LABELS[currentPage]?.[isAdmin ? "admin" : "researcher"] ?? "Dashboard";

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600 font-medium">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <FaFlask className="text-gray-300 text-5xl mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Unable to load user profile</p>
            <button 
              onClick={() => navigate("/hmis")} 
              className="mt-4 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <main className="flex-grow">
      
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap h-full">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaFlask className="text-blue-500" />
              <button
                onClick={backToDashboard}
                className={`hover:text-blue-600 transition-colors cursor-pointer
                  ${currentPage === "dashboard" ? "font-semibold text-gray-800" : ""}`}
              >
                Research Portal
              </button>
              {currentPage !== "dashboard" && (
                <>
                  <FaChevronRight className="text-xs text-gray-300" />
                  <span className="font-semibold text-gray-800">{breadcrumbLabel}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
            
              <button
                onClick={() => goTo("profile")}
                className={`flex items-center gap-2 border rounded-lg px-3 py-1.5
                   transition-all cursor-pointer ${
                  currentPage === "profile"
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <FaUserCircle 
                  className={currentPage === "profile" ? "text-blue-500" : "text-gray-400"} 
                />
                <span className="text-xs font-semibold hidden sm:inline">
                  {user.firstName} {user.lastName}
                </span>
                {currentPage !== "profile" && (
                  <FaUser className="text-[10px] text-gray-400 hidden sm:inline" />
                )}
              </button>

              
              <button 
                onClick={handleLogout}
                title="Log Out"
                className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer
                 text-gray-500 hover:text-red-500 border border-gray-200
                  hover:border-red-500 px-3 py-1.5 rounded-lg transition-all"
              >
                <FaSignOutAlt />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content switcher */}
        <div className="max-w-7xl mx-auto px-6 py-4 h-full">
          {currentPage === "submit-proposal" && (
            <SubmitProposalPage
              onClose={backToDashboard}
              onSubmitted={backToDashboard}
            />
          )}

          {currentPage === "submit-full-paper" && (
            <SubmitFullPaper
              onClose={backToDashboard}
              onSubmitted={backToDashboard}
              proposalId={selectedResearch?.id}
              proposalTitle={selectedResearch?.title}
            />
          )}

          {currentPage === "profile" && (
            <MyProfile onBack={backToDashboard} />
          )}

          {currentPage === "dashboard" && isAdmin && (
            <AdminDashboard user={user} />
          )}

          {currentPage === "dashboard" && !isAdmin && (
            <ResearcherDashboard
              user={user}
              onNewProposal={() => goTo("submit-proposal")}
              onSubmitFullPaper={(research) => {
                setSelectedResearch(research);
                goTo("submit-full-paper");
              }}
            />
          )}
        </div>
      </main>

      <Footer />

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ResearchDashboard;
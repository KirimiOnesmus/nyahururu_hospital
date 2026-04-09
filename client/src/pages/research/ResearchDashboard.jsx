import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Header, Footer } from "../../components/layouts";
import ReviewModal       from "../../components/research/ReviewModal";
import SubmitProposalPage from "../../components/research/SubmitProposal";
import SubmitFullPaper   from "../../components/research/SubmitFullPaper";
import MyProfile         from "./MyProfile";
import {
  FaFlask, FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaPlus, FaEye, FaDownload, FaUsers, FaChartBar, FaInbox,
  FaBell, FaSearch, FaChevronDown, FaChevronRight, FaUserCircle,
  FaSignOutAlt, FaBookOpen, FaEdit, FaCommentAlt, FaArrowRight,
  FaShieldAlt, FaStar, FaCalendarAlt, FaUniversity, FaUser,
} from "react-icons/fa";

/* ══════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════ */
const MOCK_RESEARCHER = {
  name: "Dr. Amina Wanjiku", email: "amina.wanjiku@egerton.ac.ke",
  institution: "Egerton University", discipline: "Agriculture", role: "researcher",
};
const MOCK_REVIEWER = {
  name: "Prof. David Otieno", email: "d.otieno@admin.ncrh.go.ke",
  institution: "Nyahururu County Referral Hospital", discipline: "Public Health", role: "admin",
};
const MOCK_MY_RESEARCH = [
  {
    id: "r1", title: "Impact of Climate Change on Agricultural Productivity in the Rift Valley",
    stage: "final_paper", status: "approved", submittedAt: "2024-03-10", reviewedAt: "2024-03-18",
    downloads: 342, reviewComment: "Excellent methodology and clear writing. Approved for publication.",
  },
  {
    id: "r2", title: "Soil Microbiome Diversity and Crop Yield in Semi-Arid Laikipia",
    stage: "abstract", status: "approved", submittedAt: "2024-06-02", reviewedAt: "2024-06-09",
    downloads: 0, reviewComment: "Strong abstract. Please proceed to final paper submission.",
  },
  {
    id: "r3", title: "Irrigation Efficiency and Water Conservation in Smallholder Farms",
    stage: "proposal", status: "pending", submittedAt: "2024-08-15",
    reviewedAt: null, downloads: 0, reviewComment: null,
  },
  {
    id: "r4", title: "Fertiliser Use Patterns Among Women-Led Farms in Nakuru County",
    stage: "proposal", status: "rejected", submittedAt: "2024-07-01", reviewedAt: "2024-07-12",
    downloads: 0, reviewComment: "Methodology section needs significant revision. Please address the sampling strategy and resubmit.",
  },
];
const MOCK_QUEUE = [
  {
    id: "q1", title: "Mobile Money Adoption and Financial Inclusion Among Rural Youth",
    author: "Prof. James Kariuki", institution: "University of Nairobi",
    discipline: "Economics", stage: "proposal", submittedAt: "2024-08-20",
    abstract: "An analysis of M-Pesa usage patterns among 18–30 year-olds in rural Kenya, exploring barriers to formal banking and how mobile payment platforms bridge the financial inclusion gap.",
  },
  {
    id: "q2", title: "Digital Literacy and Secondary School Performance in Rural Laikipia County",
    author: "Ms. Ruth Wambui", institution: "Laikipia University",
    discipline: "Education", stage: "abstract", submittedAt: "2024-08-22",
    abstract: "A quantitative study measuring the correlation between computer lab access, teacher ICT proficiency, and national examination results across 60 secondary schools in Laikipia County.",
  },
  {
    id: "q3", title: "Water Resource Management and Community Governance in Semi-Arid Laikipia",
    author: "Dr. Sarah Njoki", institution: "Mount Kenya University",
    discipline: "Environment", stage: "final_paper", submittedAt: "2024-08-24",
    abstract: "Three years of participatory action research evaluating the effectiveness of water user associations in managing scarce resources during prolonged dry seasons.",
  },
];
const MOCK_STATS = {
  researcher: { total: 4, approved: 2, pending: 1, rejected: 1, downloads: 342 },
  admin:      { total: 48, pending: 3, approved: 38, rejected: 7, researchers: 24 },
};

/* ══════════════════════════════════════════
   SHARED CONSTANTS
══════════════════════════════════════════ */
export const STAGE_LABELS = { proposal: "Proposal", abstract: "Abstract", final_paper: "Final Paper" };
export const STAGE_COLORS = {
  proposal:    "bg-blue-100 text-blue-700",
  abstract:    "bg-purple-100 text-purple-700",
  final_paper: "bg-green-100 text-green-700",
};
const STATUS_CONFIG = {
  approved: { label: "Approved",       icon: FaCheckCircle, cls: "text-green-600 bg-green-50 border-green-200"    },
  pending:  { label: "Under Review",   icon: FaClock,       cls: "text-yellow-600 bg-yellow-50 border-yellow-200"  },
  rejected: { label: "Needs Revision", icon: FaTimesCircle, cls: "text-red-600 bg-red-50 border-red-200"           },
};
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

/* ══════════════════════════════════════════
   BREADCRUMB LABELS
══════════════════════════════════════════ */
const PAGE_LABELS = {
  dashboard:        { researcher: "My Dashboard", admin: "Reviewer Dashboard" },
  "submit-proposal":{ researcher: "Submit Proposal",   admin: "Submit Proposal"   },
  "submit-full-paper":{ researcher: "Submit Final Paper", admin: "Submit Final Paper" },
  profile:          { researcher: "My Profile",      admin: "My Profile"        },
};

/* ══════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   RESEARCHER DASHBOARD
══════════════════════════════════════════ */
const ResearcherDashboard = ({ user, onNewProposal, onSubmitFullPaper }) => {
  const [research]          = useState(MOCK_MY_RESEARCH);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const stats = MOCK_STATS.researcher;

  const filtered = filter === "all" ? research : research.filter((r) => r.status === filter);

  const nextStageAction = (item) => {
    if (item.status !== "approved") return null;
    if (item.stage === "proposal") return { label: "Submit Abstract",    action: "submit-abstract"  };
    if (item.stage === "abstract") return { label: "Submit Final Paper", action: "submit-final"     };
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back,</p>
            <h2 className="text-2xl font-extrabold">{user.name}</h2>
            <p className="text-blue-200 text-sm mt-1">{user.institution} · {user.discipline}</p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FaFileAlt}     label="Total Submissions" value={stats.total}     color="bg-blue-500"   />
        <StatCard icon={FaCheckCircle} label="Approved"          value={stats.approved}  color="bg-green-500"  />
        <StatCard icon={FaClock}       label="Under Review"      value={stats.pending}   color="bg-yellow-500" />
        <StatCard icon={FaDownload}    label="Total Downloads"   value={stats.downloads} color="bg-indigo-500" />
      </div>

      {/* My Research */}
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
                {f === "all" ? "All" : f === "approved" ? "Approved" : f === "pending" ? "Pending" : "Needs Revision"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FaFlask className="text-gray-200 text-4xl mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No submissions yet</p>
            <button onClick={onNewProposal}
              className="mt-4 text-blue-600 text-sm font-semibold 
              hover:underline flex items-center gap-1 mx-auto cursor-pointer">
              Submit your first proposal <FaArrowRight className="text-xs" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((item) => {
              const sc         = STATUS_CONFIG[item.status];
              const StatusIcon = sc.icon;
              const action     = nextStageAction(item);
              const isOpen     = expanded === item.id;
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
                      <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><FaCalendarAlt /> Submitted {fmt(item.submittedAt)}</span>
                        {item.downloads > 0 && (
                          <span className="flex items-center gap-1"><FaDownload /> {item.downloads} downloads</span>
                        )}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${sc.cls}`}>
                      <StatusIcon className="text-[11px]" /> {sc.label}
                    </span>
                    <FaChevronDown className={`text-gray-400 text-xs mt-1.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </div>

                  {isOpen && (
                    <div className="px-6 pb-5 space-y-3 border-t border-gray-50 pt-4 bg-gray-50/50">
                      {item.reviewComment && (
                        <div className={`rounded-lg px-4 py-3 border text-sm leading-relaxed flex items-start gap-2 ${
                          item.status === "approved"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}>
                          <FaCommentAlt className="mt-0.5 flex-shrink-0 text-xs" />
                          <span><span className="font-semibold">Reviewer feedback: </span>{item.reviewComment}</span>
                        </div>
                      )}
                      {item.reviewedAt && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <FaCalendarAlt /> Reviewed on {fmt(item.reviewedAt)}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {item.status === "rejected" && (
                          <button onClick={onNewProposal}
                            className="flex items-center gap-2 bg-blue-600
                             hover:bg-blue-700 text-white text-xs cursor-pointer
                             font-bold px-4 py-2 rounded-lg transition-all">
                            <FaEdit /> Resubmit (Free)
                          </button>
                        )}
                        {action && (
                          <button
                            onClick={() => action.action === "submit-final" ? onSubmitFullPaper(item) : onNewProposal()}
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
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

/* ══════════════════════════════════════════
   ADMIN / REVIEWER DASHBOARD
══════════════════════════════════════════ */
const AdminDashboard = ({ user }) => {
  const [queue, setQueue]             = useState(MOCK_QUEUE);
  const [reviewing, setReviewing]     = useState(null);
  const [search, setSearch]           = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const stats = MOCK_STATS.admin;

  const filtered = queue.filter((q) => {
    const matchStage  = stageFilter === "all" || q.stage === stageFilter;
    const s           = search.toLowerCase();
    const matchSearch = !s || q.title.toLowerCase().includes(s) || q.author.toLowerCase().includes(s);
    return matchStage && matchSearch;
  });

  const handleDecision = (id) => setQueue((prev) => prev.filter((q) => q.id !== id));

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FaShieldAlt className="text-yellow-300 text-sm" />
              <p className="text-indigo-200 text-sm font-medium">Reviewer Panel</p>
            </div>
            <h2 className="text-2xl font-extrabold">{user.name}</h2>
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
        <StatCard icon={FaInbox}       label="Total Submissions" value={stats.total}       color="bg-indigo-500" />
        <StatCard icon={FaClock}       label="Awaiting Review"   value={stats.pending}     color="bg-yellow-500" sub="Needs action" />
        <StatCard icon={FaCheckCircle} label="Approved"          value={stats.approved}    color="bg-green-500"  />
        <StatCard icon={FaUsers}       label="Researchers"       value={stats.researchers} color="bg-blue-500"   />
      </div>

      {/* Review Queue */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <FaInbox className="text-indigo-500" /> Review Queue
              {filtered.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{filtered.length}</span>
              )}
            </h3>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input type="text" placeholder="Search by title or author…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200
                 rounded-lg text-sm text-gray-800 placeholder-gray-400
                  outline-none focus:ring focus:ring-indigo-400 bg-gray-50" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "proposal", "abstract", "final_paper"].map((s) => (
                <button key={s} onClick={() => setStageFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold 
                    border transition-all whitespace-nowrap cursor-pointer ${
                    stageFilter === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}>
                  {s === "all" ? "All" : s === "final_paper" ? "Final Paper" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FaCheckCircle className="text-green-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">All caught up!</p>
            <p className="text-gray-400 text-sm mt-1">No submissions pending review.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((item, i) => (
              <div key={item.id} className="px-6 py-5 hover:bg-gray-50/60 transition-colors"
                style={{ animation: `fadeIn .3s ease ${i * 0.05}s both` }}>
                <div className="flex items-start gap-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-0.5 flex-shrink-0 ${STAGE_COLORS[item.stage]}`}>
                    {STAGE_LABELS[item.stage]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{item.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2 flex-wrap">
                      <span className="flex items-center gap-1"><FaUserCircle /> {item.author}</span>
                      <span className="flex items-center gap-1"><FaUniversity /> {item.institution}</span>
                      <span className="flex items-center gap-1"><FaCalendarAlt /> {fmt(item.submittedAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{item.abstract}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => setReviewing(item)}
                      className="flex items-center gap-2 bg-indigo-600
                       hover:bg-indigo-700 text-white text-xs font-bold 
                       px-4 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 
                       shadow-sm whitespace-nowrap cursor-pointer">
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

      {/* Overview */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <FaChartBar className="text-blue-500" /> Submission Overview
          </h3>
          <button className="text-xs text-blue-600 font-semibold 
          hover:underline flex items-center gap-1 cursor-pointer">
            View all <FaArrowRight className="text-[10px]" />
          </button>
        </div>
        <div className="p-6 grid sm:grid-cols-3 gap-4">
          {[
            { stage: "proposal",    approved: 16, pending: 2, rejected: 4 },
            { stage: "abstract",    approved: 12, pending: 1, rejected: 2 },
            { stage: "final_paper", approved: 10, pending: 0, rejected: 1 },
          ].map(({ stage, approved, pending, rejected }) => {
            const total = approved + pending + rejected;
            return (
              <div key={stage} className={`rounded-xl border p-4 ${STAGE_COLORS[stage].replace("text-", "border-").replace("-700", "-200").replace("-100", "-50")}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${STAGE_COLORS[stage].split(" ")[1]}`}>
                  {STAGE_LABELS[stage]}
                </p>
                <div className="space-y-2">
                  {[["Approved", approved, "text-green-600"], ["Pending", pending, "text-yellow-600"], ["Rejected", rejected, "text-red-600"]].map(([l, v, c]) => (
                    <div key={l} className="flex justify-between text-sm">
                      <span className="text-gray-500">{l}</span>
                      <span className={`font-bold ${c}`}>{v}</span>
                    </div>
                  ))}
                  <div className="pt-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="bg-green-500 h-full"  style={{ width: `${(approved / total) * 100}%` }} />
                      <div className="bg-yellow-400 h-full" style={{ width: `${(pending  / total) * 100}%` }} />
                      <div className="bg-red-400 h-full"    style={{ width: `${(rejected / total) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {reviewing && (
        <ReviewModal item={reviewing} onClose={() => setReviewing(null)} onDecision={handleDecision} />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════════ */
const ResearchDashboard = () => {
  const navigate = useNavigate();
  const role    = localStorage.getItem("role") || "researcher";
  const isAdmin = ["admin", "superadmin", "it"].includes(role);

  const [demoRole, setDemoRole]                 = useState(isAdmin ? "admin" : "researcher");
  const [currentPage, setCurrentPage]           = useState("dashboard");
  const [selectedResearch, setSelectedResearch] = useState(null);

  const user = demoRole === "admin" ? MOCK_REVIEWER : MOCK_RESEARCHER;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/hmis");
    toast.success("Logged out successfully");
  };

  const goTo = (page) => setCurrentPage(page);
  const backToDashboard = () => setCurrentPage("dashboard");

  /* ── Breadcrumb label ── */
  const breadcrumbLabel =
    PAGE_LABELS[currentPage]?.[demoRole] ??
    PAGE_LABELS[currentPage]?.researcher ??
    "Dashboard";

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <main className="flex-grow">
        {/* ── Top navigation bar ── */}
        <div className="bg-white border-b border-gray-100 ">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap h-full">

            {/* Breadcrumb — clickable "Dashboard" resets to home */}
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
              {/* Role switcher — remove in production */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                <button onClick={() => { setDemoRole("researcher"); backToDashboard(); }}
                  className={`text-xs font-semibold px-3 py-1.5 cursor-pointer
                   rounded-md transition-all ${demoRole === "researcher" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  Researcher
                </button>
                <button onClick={() => { setDemoRole("admin"); backToDashboard(); }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md  cursor-pointer
                  transition-all ${demoRole === "admin" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  Reviewer
                </button>
              </div>

              {/* ── User pill → navigates to profile page ── */}
              <button
                onClick={() => goTo("profile")}
                className={`flex items-center gap-2 border rounded-lg px-3 py-1.5
                   transition-all cursor-pointer ${
                  currentPage === "profile"
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <FaUserCircle className={currentPage === "profile" ? "text-blue-500" : "text-gray-400"} />
                <span className="text-xs font-semibold hidden sm:inline">{user.name}</span>
                {currentPage !== "profile" && (
                  <FaUser className="text-[10px] text-gray-400 hidden sm:inline" />
                )}
              </button>

              {/* Logout */}
              <button onClick={handleLogout}
              title="Log Out"
                className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer
                 text-gray-500 hover:text-red-500 border border-gray-200
                  hover:border-red-500 px-3 py-1.5 rounded-lg transition-all">
                <FaSignOutAlt /><span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Page content switcher ── */}
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

          {currentPage === "dashboard" && demoRole === "admin" && (
            <AdminDashboard user={user} />
          )}

          {currentPage === "dashboard" && demoRole === "researcher" && (
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
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
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
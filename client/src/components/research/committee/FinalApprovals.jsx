import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { toast } from "react-toastify";
import {
  FaCertificate, FaFileAlt, FaExclamationTriangle, FaCheckCircle,
  FaHourglassHalf, FaClock, FaSearch, FaEye, FaFileCsv,
  FaFilter, FaPaperPlane, FaCommentDots, FaShieldAlt,
} from "react-icons/fa";
import * as research from "../../../api/research";

//  Constants 
const OUTCOME_CONFIG = {
  highly_recommended: {
    label: "Highly Recommended",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  approved_minors: {
    label: "Approved with Minors",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  pending_clarification: {
    label: "Pending Clarification",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

// Fixed per-stage color coding for the Discussion Feed — color depends on

const STAGE_STYLE = {
  proposal: {
    label: "Proposal",
    border: "border-l-indigo-400",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    avatar: "bg-indigo-600",
  },
  progress: {
    label: "Progress",
    border: "border-l-blue-400",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    avatar: "bg-blue-600",
  },
  final_paper: {
    label: "Final Paper",
    border: "border-l-violet-400",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    avatar: "bg-violet-600",
  },
  committee: {
    label: "Committee",
    border: "border-l-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    avatar: "bg-emerald-600",
  },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "—";

//  Local building blocks 
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

const StatCard = ({ icon: Icon, value, label, sub, iconBg, iconColor, valueColor, subColor }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
      <Icon className={`text-lg ${iconColor}`} />
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${valueColor || "text-slate-900"}`}>{value}</p>
    {sub && <p className={`text-xs mt-0.5 font-semibold ${subColor || "text-slate-400"}`}>{sub}</p>}
  </div>
);

const OutcomeBadge = ({ outcome }) => {
  const cfg = OUTCOME_CONFIG[outcome] || OUTCOME_CONFIG.pending_clarification;
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-3 py-1
      rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

//  Feed item 
const FeedItem = ({ item }) => {
  const style = STAGE_STYLE[item.stage] || STAGE_STYLE.committee;
  return (
    <div className={`px-4 py-3 border-l-2 ${style.border} bg-slate-50/60 rounded-r-xl`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-6 h-6 rounded-full ${style.avatar} text-white text-[10px] font-bold
          flex items-center justify-center shrink-0`}>
          {item.initials}
        </div>
        <span className="text-sm font-semibold text-slate-800">{item.author}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px]
          font-bold uppercase tracking-wide border ${style.badge}`}>
          {item.stageLabel || style.label}
        </span>
        <span className="text-xs text-slate-400 ml-auto">{item.time}</span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{item.message}</p>
    </div>
  );
};

//  Queue row 
const QueueRow = ({ record, isSelected, onSelect, onView,onOpen }) => (
  <tr
    onClick={() => onSelect(record)}
    aria-selected={isSelected}
    className={`border-b border-slate-100 last:border-0 transition-colors cursor-pointer
      ${isSelected ? "bg-blue-50/70 hover:bg-blue-50" : "hover:bg-slate-50/60"}`}>
    <td className="px-6 py-4">
      <span className="text-sm font-bold text-blue-900">{record.projectId}</span>
    </td>
    <td className="px-6 py-4 max-w-sm">
      <p className="text-sm font-semibold text-slate-800 leading-snug truncate"
        title={record.title}>
        {record.title}
      </p>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <p className="text-sm font-semibold text-slate-700">{record.principalReviewer}</p>
    </td>
    <td className="px-6 py-4">
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold
        bg-emerald-50 text-emerald-700 border border-emerald-200">
        {record.avgScore?.toFixed(1)}/5.0
      </span>
    </td>
    <td className="px-6 py-4">
      <OutcomeBadge outcome={record.outcome} />
    </td>
    <td className="px-6 py-4 text-right">
      <div className="flex items-center justify-end gap-2">
        <button type="button"
          onClick={(e) => { e.stopPropagation(); onView(record); }}
        
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50
            transition-colors cursor-pointer border ">
         View Details
        </button> 
        <button type="button"
          onClick={(e)=>{e.stopPropagation(); onOpen(record)}}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50
            transition-colors cursor-pointer border">

          Approve
        </button>
      </div>
    </td>
  </tr>
);

//  Main page

const FinalApprovals = ({ onOpenRecord }) => {
  const [records, setRecords]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [draft, setDraft]       = useState("");
  const [posting, setPosting]   = useState(false);

  const [selectedRecord, setSelectedRecord]   = useState(null);
  const [timeline, setTimeline]               = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const feedEndRef = useRef(null);

  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [queueRes, statsRes] = await Promise.all([
        research.getFinalApprovalQueue(),
        research.getFinalApprovalStats(),
      ]);
      setRecords(Array.isArray(queueRes.records) ? queueRes.records : []);
      setStats(statsRes || null);
    } catch {
      toast.error("Failed to load final approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadTimeline = useCallback(async (record) => {
    if (!record?._id) return;
    setTimelineLoading(true);
    try {
      const res = await research.getRecordTimeline(record._id);
      setTimeline(Array.isArray(res.timeline) ? res.timeline : []);
    } catch {
      toast.error("Failed to load discussion history for this record");
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const handleSelectRecord = (record) => {

    if (selectedRecord?._id === record._id) {
      setSelectedRecord(null);
      setTimeline([]);
      return;
    }
    setSelectedRecord(record);
    loadTimeline(record);
  };

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline.length]);

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.principalReviewer?.toLowerCase().includes(q) ||
        r.projectId?.toLowerCase().includes(q)
    );
  }, [records, search]);

  const handlePostComment = async () => {
    if (!draft.trim() || !selectedRecord?._id) return;
    setPosting(true);
    try {
      await research.postApprovalComment({
        researchId: selectedRecord._id,
        message: draft.trim(),
      });
      setDraft("");
      await loadTimeline(selectedRecord);
      toast.success("Comment posted");
    } catch (err) {
      toast.error(err?.message || "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

const handleView = (record) => {
  navigate(`../committee-research-detail/${record._id || record.id}`, {
    state: { record },
  });
};

const handleOpen = (record)=>{
 navigate(`/research/dashboard/committee-sign-off/${record._id}`)
}



  return (
    <div className="space-y-4">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Committee Final Approvals
          </h1>
        </div> 

      </div>


      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FaHourglassHalf}
          value={loading ? "—" : (stats?.awaitingSignOff  ?? "—")}
          label="Awaiting Final Sign-off"
          sub={stats?.awaitingSignOffDelta}
          subColor="text-emerald-600"
          iconBg="bg-blue-50" iconColor="text-blue-600"
        />
        <StatCard
          icon={FaCheckCircle}
          value={loading ? "—" : (stats?.totalApprovedMtd ?? "—")}
          label="Total Approved (MTD)"
          sub={stats?.approvedTarget ? `Target: ${stats.approvedTarget}` : undefined}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
        />
        <StatCard
          icon={FaExclamationTriangle}
          value={loading ? "—" : (stats?.pendingClarifications ?? "—")}
          label="Pending Clarifications"
          sub={stats?.pendingClarificationsNote}
          valueColor="text-red-600"
          subColor="text-red-500"
          iconBg="bg-red-50" iconColor="text-red-500"
        />
        <StatCard
          icon={FaClock}
          value={loading ? "—" : (stats?.avgReviewTimeDays ? `${stats.avgReviewTimeDays}d` : "—")}
          label="Average Review Time"
          sub={stats?.avgReviewTimeDelta ? `↓ ${stats.avgReviewTimeDelta}` : undefined}
          subColor="text-emerald-600"
          iconBg="bg-indigo-50" iconColor="text-indigo-600"
        />
      </div>


      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap
          items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-base">Priority Approval Queue</h3>
          <div className="flex items-center gap-2">
        
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2
                text-slate-400 text-xs pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ID, title or reviewer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50
                  text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none
                  focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
            <button type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border
                border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-300
                transition-colors cursor-pointer">
              <FaFileCsv className="text-xs" />
              Export CSV
            </button>
            <button type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border
                border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-300
                transition-colors cursor-pointer">
              <FaFilter className="text-xs" />
              Filters
            </button>
          </div>
        </div>

        {loading ? (
          <PageSpinner label="Loading approval queue…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FaExclamationTriangle}
            title="No matching approvals"
            sub="Try a different search term or clear your filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Project ID", "Research Title", "Principal Reviewer",
                    "Avg Score", "Peer Review Outcome", ""].map((h, i) => (
                    <th key={h || i}
                      className={`px-6 py-3 text-xs font-bold uppercase tracking-widest
                        text-slate-400 ${i === 5 ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <QueueRow
                    key={record._id || record.projectId}
                    record={record}
                    isSelected={selectedRecord?._id === record._id}
                    onSelect={handleSelectRecord}
                    onView={handleView}
                    onOpen={handleOpen} 
                  
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">
            Showing {filtered.length} of {records.length} priority entries
          </p>
          <p className="text-xs text-slate-400">
            Select a row to view its full discussion history
          </p>
        </div>
      </div>

   
      {selectedRecord && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center
            justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FaCommentDots className="text-blue-600 text-sm shrink-0" />
              <h3 className="font-bold text-slate-900 text-base shrink-0">Discussion Feed</h3>
              <span className="text-slate-300 shrink-0">·</span>
              <span className="text-sm font-semibold text-slate-500 truncate" title={selectedRecord.title}>
                {selectedRecord.projectId} — {selectedRecord.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectRecord(selectedRecord)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600
                transition-colors cursor-pointer shrink-0">
              Close
            </button>
          </div>

     
          <div className="px-6 py-2.5 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            {Object.entries(STAGE_STYLE).map(([key, style]) => (
              <span key={key} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-full ${style.avatar}`} />
                {style.label}
              </span>
            ))}
          </div>

          {timelineLoading ? (
            <PageSpinner label="Loading discussion history…" />
          ) : timeline.length === 0 ? (
            <EmptyState
              icon={FaCommentDots}
              title="No comments yet"
              sub="No reviewer or committee comments have been recorded for this submission."
            />
          ) : (
            <div className="px-6 py-4 flex flex-col gap-3 max-h-80 overflow-y-auto">
              {timeline.map((item) => (
                <FeedItem key={item._id} item={item} />
              ))}
              <div ref={feedEndRef} />
            </div>
          )}


          <div className="px-6 py-4 border-t border-slate-100">
            <div className="flex gap-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Add a note about ${selectedRecord.projectId}…`}
                rows={2}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                  text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none
                  focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                type="button"
                onClick={handlePostComment}
                disabled={!draft.trim() || posting}
                className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white
                  text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40
                  disabled:pointer-events-none flex items-center gap-2 self-end shrink-0">
                <FaPaperPlane className="text-xs" />
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default FinalApprovals;
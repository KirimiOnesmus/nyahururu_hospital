import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import notify from "../../../common/utils/notify";
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaHourglassHalf,
  FaClock,
  FaEye,
  FaFileCsv,
  FaFilter,
  FaPaperPlane,
  FaCommentDots,
} from "react-icons/fa";
import * as research from "../../../api/research";
import {
  Card,
  Button,
  StatCard,
  StatusBadge,
  Spinner,
  EmptyState,
  SearchBox,
  DataTable,
  Avatar,
} from "../../../common/components";

const OUTCOME_CONFIG = {
  highly_recommended: {
    label: "Highly Recommended",
    colors: { text: "text-emerald-700", dot: "bg-emerald-500" },
  },
  approved_minors: {
    label: "Approved with Minors",
    colors: { text: "text-blue-700", dot: "bg-blue-500" },
  },
  pending_clarification: {
    label: "Pending Clarification",
    colors: {  text: "text-amber-700", dot: "bg-amber-500" },
  },
};

const STAGE_STYLE = {
  proposal: {
    label: "Proposal",
    banner: "bg-indigo-50 border-indigo-200",
    bannerText: "text-indigo-800",
    iconBg: "bg-indigo-100",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  progress: {
    label: "Progress",
    banner: "bg-blue-50 border-blue-200",
    bannerText: "text-blue-800",
    iconBg: "bg-blue-100",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  final_paper: {
    label: "Final Paper",
    banner: "bg-violet-50 border-violet-200",
    bannerText: "text-violet-800",
    iconBg: "bg-violet-100",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  committee: {
    label: "Committee",
    banner: "bg-emerald-50 border-emerald-200",
    bannerText: "text-emerald-800",
    iconBg: "bg-emerald-100",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

const normalizeQueueRecords = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.records)) return res.records;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.records)) return res.data.records;
  return [];
};

const parseAvgScore = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const OutcomeBadge = ({ outcome }) => {
  const cfg = OUTCOME_CONFIG[outcome] || OUTCOME_CONFIG.pending_clarification;
  return <StatusBadge status={outcome} label={cfg.label} colors={cfg.colors} />;
};

const FeedItem = ({ item }) => {
  const style = STAGE_STYLE[item.stage] || STAGE_STYLE.committee;
  return (
    <div className={`rounded-xl border p-4 ${style.banner}`}>
      <div className="flex items-start gap-3">
        <Avatar name={item.author} size="xs" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate">{item.author}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px]
                font-bold uppercase tracking-wide border ${style.badge}`}
              >
                {item.stageLabel || style.label}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">{item.time}</span>
          </div>
          <p className={`text-xs leading-relaxed ${style.bannerText}`}>{item.message}</p>
        </div>
      </div>
    </div>
  );
};

const FinalApprovals = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [timeline, setTimeline] = useState([]);
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
      setRecords(normalizeQueueRecords(queueRes));
      setStats(statsRes || null);
    } catch {
      notify.error("Failed to load final approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadTimeline = useCallback(async (record) => {
    if (!record?.id) return;
    setTimelineLoading(true);
    try {
      const res = await research.getRecordTimeline(record.id);
      setTimeline(Array.isArray(res.timeline) ? res.timeline : []);
    } catch {
      notify.error("Failed to load discussion history for this record");
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const handleSelectRecord = (record) => {
    if (selectedRecord?.id === record.id) {
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
    return records.filter((r) => {
      const reviewerNames = Array.isArray(r.reviewers)
        ? r.reviewers.map((rv) => rv.name).filter(Boolean)
        : [r.principalReviewer].filter(Boolean);
      return (
        r.title?.toLowerCase().includes(q) ||
        r.projectId?.toLowerCase().includes(q) ||
        reviewerNames.some((name) => name.toLowerCase().includes(q))
      );
    });
  }, [records, search]);

  const handlePostComment = async () => {
    if (!draft.trim() || !selectedRecord?.id) return;
    setPosting(true);
    try {
      await research.postApprovalComment({
        researchId: selectedRecord.id,
        message: draft.trim(),
      });
      setDraft("");
      await loadTimeline(selectedRecord);
      notify.success("Comment posted");
    } catch (err) {
      notify.error(err?.message || "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const handleView = (record) => {
    navigate(`../committee-research-detail/${record.id}`, {
      state: { record },
    });
  };

  const handleOpen = (record) => {
    navigate(`/research/dashboard/committee-sign-off/${record.id}`);
  };

  const columns = [
    {
      key: "projectId",
      label: "Project ID",
      render: (record) => (
        <span className="text-xs font-bold text-blue-900 truncate">{record.projectId}</span>
      ),
    },
    {
      key: "title",
      label: "Research Title",
      render: (record) => (
        <div className="max-w-[260px] min-w-0">
          <p
            className="text-xs font-semibold text-slate-800 leading-snug truncate"
            title={record.title}
          >
            {record.title}
          </p>
        </div>
      ),
    },
    {
      key: "principalReviewer",
      label: "Reviewers",
      render: (record) => {
        const reviewers =
          Array.isArray(record.reviewers) && record.reviewers.length
            ? record.reviewers
            : record.principalReviewer
              ? [{ name: record.principalReviewer }]
              : [];

        if (reviewers.length === 0) {
          return <span className="text-xs text-slate-400">—</span>;
        }

        const names = reviewers.map((rv) => rv.name).filter(Boolean);

        return (
          <div className="flex items-start gap-2 min-w-0 max-w-[220px]">
            <div className="flex space-y-0.5 shrink-0 flex-col ">
              {reviewers.slice(0, 3).map((rv, i) => (
                <Avatar key={rv.id || i} name={rv.name} size="xs" />
              ))}
            </div>

            <div className="flex flex-col min-w-0 ">
              {names.map((name, index) => (
                <p
                  key={index}
                  className="text-sm font-semibold text-slate-700 truncate "
                  title={name}
                >
                  {name}
                </p>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      key: "avgScore",
      label: "Avg Score",
      render: (record) => {
        const score = parseAvgScore(record.avgScore);
        return (
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
            bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            {score != null ? `${score.toFixed(1)}/10.0` : "Not yet scored"}
          </span>
        );
      },
    },
    {
      key: "outcome",
      label: "Peer Review Outcome",
      render: (record) => <OutcomeBadge outcome={record.outcome} />,
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (record) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="xs"
            icon={FaEye}
            onClick={(e) => {
              e.stopPropagation();
              handleView(record);
            }}
          >
            View Details
          </Button>
          <Button
            variant="secondary"
            size="xs"
            icon={FaCheckCircle}
            onClick={(e) => {
              e.stopPropagation();
              handleOpen(record);
            }}
          >
            Approve
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-2">
          Committee Workspace
        </p>
        <h1 className="text-xl font-extrabold text-slate-900 leading-snug">
          Committee Final Approvals
        </h1>
        <p className="text-xs text-slate-400 mt-2">
          Review, discuss, and sign off research submissions awaiting final committee decision.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FaHourglassHalf}
          value={loading ? "—" : (stats?.awaitingSignOff ?? "—")}
          label="Awaiting Final Sign-off"
          sub={stats?.awaitingSignOffDelta}
          accent={{ bg: "bg-blue-50", icon: "text-blue-600" }}
        />
        <StatCard
          icon={FaCheckCircle}
          value={loading ? "—" : (stats?.totalApprovedMtd ?? "—")}
          label="Total Approved (MTD)"
          sub={stats?.approvedTarget ? `Target: ${stats.approvedTarget}` : undefined}
          accent={{ bg: "bg-emerald-50", icon: "text-emerald-600" }}
        />
        <StatCard
          icon={FaExclamationTriangle}
          value={loading ? "—" : (stats?.pendingClarifications ?? "—")}
          label="Pending Clarifications"
          sub={stats?.pendingClarificationsNote}
          accent={{ bg: "bg-red-50", icon: "text-red-500", num: "text-red-600" }}
        />
        <StatCard
          icon={FaClock}
          value={loading ? "—" : stats?.avgReviewTimeDays ? `${stats.avgReviewTimeDays}d` : "—"}
          label="Average Review Time"
          sub={stats?.avgReviewTimeDelta ? `${stats.avgReviewTimeDelta}` : undefined}
          accent={{ bg: "bg-indigo-50", icon: "text-indigo-600" }}
        />
      </div>

      <Card padding="p-0" className="overflow-hidden">
        <div
          className="px-6 py-4 border-b border-slate-100 flex flex-wrap
          items-center justify-between gap-3"
        >
          <h3 className="font-bold text-slate-900 text-base">Priority Approval Queue</h3>
          <div className="flex items-center gap-2">
            <SearchBox
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search by ID, title or reviewer…"
              className="w-56"
            />
            <Button variant="secondary" size="sm" icon={FaFileCsv}>
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" icon={FaFilter}>
              Filters
            </Button>
          </div>
        </div>

        {loading ? (
          <Spinner text="Loading approval queue…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FaExclamationTriangle}
            text="No matching approvals. Try a different search term or clear your filters."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(record) => record.id || record.projectId}
            onRowClick={handleSelectRecord}
            isRowSelected={(record) => selectedRecord?.id === record.id}
            bare
          />
        )}

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
            Showing {filtered.length} of {records.length} priority entries
          </p>
          <p className="text-xs text-slate-400">Select a row to view its full discussion history</p>
        </div>
      </Card>

      {selectedRecord && (
        <Card padding="p-0" className="overflow-hidden">
          <div
            className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center
            justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FaCommentDots className="text-blue-600 text-sm shrink-0" />
              <h3 className="font-bold text-slate-900 text-base shrink-0">Discussion Feed</h3>
              <span className="text-slate-300 shrink-0">·</span>
              <span
                className="text-sm font-semibold text-slate-500 truncate"
                title={selectedRecord.title}
              >
                {selectedRecord.projectId} — {selectedRecord.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectRecord(selectedRecord)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600
                transition-colors cursor-pointer shrink-0"
            >
              Close
            </button>
          </div>

          <div className="px-6 py-2.5 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            {Object.entries(STAGE_STYLE).map(([key, style]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                {style.label}
              </span>
            ))}
          </div>

          {timelineLoading ? (
            <Spinner text="Loading discussion history…" />
          ) : timeline.length === 0 ? (
            <EmptyState
              icon={FaCommentDots}
              text="No comments yet. No reviewer or committee comments have been recorded for this submission."
            />
          ) : (
            <div className="px-6 py-4 flex flex-col gap-3 max-h-80 overflow-y-auto">
              {timeline.map((item) => (
                <FeedItem key={item.id} item={item} />
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
                  disabled:pointer-events-none flex items-center gap-2 self-end shrink-0"
              >
                <FaPaperPlane className="text-xs" />
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FinalApprovals;

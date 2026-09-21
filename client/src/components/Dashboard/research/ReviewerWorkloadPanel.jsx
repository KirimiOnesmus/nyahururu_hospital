import { useEffect, useState, useCallback } from "react";
import { FaUserTie, FaEnvelope, FaUniversity, FaCrown, FaClock } from "react-icons/fa";
import notify from "../../../common/utils/notify";
import * as research from "../../../api/research";

const StatChip = ({ label, value, tone = "gray" }) => (
  <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-gray-50 min-w-[64px]">
    <span className={`text-sm font-bold text-${tone}-600`}>{value}</span>
    <span className="text-[9px] uppercase tracking-wider text-gray-400">{label}</span>
  </div>
);

const ReviewerWorkloadPanel = () => {
  const [data, setData] = useState({ reviewers: [], committee: [] });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const workload = await research.getReviewerWorkload();
      setData({
        reviewers: workload?.reviewers || [],
        committee: workload?.committee || [],
      });
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || "Failed to load reviewer workload");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
        <p className="text-gray-500 mt-3 text-sm">Loading reviewer workload…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FaUserTie className="text-blue-500" /> Reviewer Load
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Assignment counts and average turnaround, per assigned reviewer
          </p>
        </div>

        {data.reviewers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No reviewer assignments yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.reviewers.map((row) => (
              <div key={row.reviewer?.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {row.reviewer?.name || "Unknown reviewer"}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {row.reviewer?.email && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <FaEnvelope className="text-[10px]" /> {row.reviewer.email}
                      </span>
                    )}
                    {row.reviewer?.institution && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <FaUniversity className="text-[10px]" /> {row.reviewer.institution}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatChip label="Assigned" value={row.totalAssignments} tone="gray" />
                  <StatChip label="Pending" value={row.pendingCount} tone="amber" />
                  <StatChip label="Completed" value={row.completedCount} tone="green" />
                  <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-gray-50 min-w-[80px]">
                    <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
                      <FaClock className="text-[10px]" />
                      {row.avgTurnaroundHours != null ? `${row.avgTurnaroundHours}h` : "—"}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-gray-400">Avg turnaround</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FaCrown className="text-purple-500" /> Committee Voting Activity
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Votes cast by each committee member across all final-approval rounds
          </p>
        </div>

        {data.committee.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No committee votes recorded yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.committee.map((row) => (
              <div key={row.memberId} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{row.memberName}</p>
                  {row.email && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FaEnvelope className="text-[10px]" /> {row.email}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatChip label="Total Votes" value={row.totalVotes} tone="gray" />
                  <StatChip label="Approved" value={row.approvedVotes} tone="green" />
                  <StatChip label="Revision" value={row.revisionVotes} tone="amber" />
                  <StatChip label="Rejected" value={row.rejectedVotes} tone="red" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewerWorkloadPanel;

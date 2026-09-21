import { useState, useEffect, useCallback } from "react";
import { FaHistory, FaArrowRight, FaExclamationCircle } from "react-icons/fa";
import { getRevisionComparison } from "../../api/research";

const FIELD_LABELS = {
  abstract: "Abstract",
  background: "Background",
  objectives: "Objectives",
  methodology: "Methodology",
  expectedOutcome: "Expected Outcome",
  timeline: "Timeline",
  justification: "Justification",
  inclusionCriteria: "Inclusion Criteria",
  exclusionCriteria: "Exclusion Criteria",
  amendmentDetails: "Amendment Details",
  ethicsHumanSubjects: "Ethics / Human Subjects",
  budgetSummary: "Budget Summary",
  proposalFile: "Proposal Document",
};

const labelFor = (key) =>
  FIELD_LABELS[key] ||
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const toText = (v) => {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
};

const FieldDiff = ({ field, previous, revised }) => (
  <div className="border border-slate-200 rounded-xl overflow-hidden">
    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
        {labelFor(field)}
      </span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
      <div className="p-4 bg-rose-50/40">
        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">
          Original
        </p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
          {toText(previous)}
        </p>
      </div>
      <div className="p-4 bg-emerald-50/40">
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
          Revised
        </p>
        <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed font-medium">
          {toText(revised)}
        </p>
      </div>
    </div>
  </div>
);

const RevisionComparison = ({ researchId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRound, setActiveRound] = useState(null);

  const load = useCallback(async () => {
    if (!researchId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getRevisionComparison(researchId);
      setData(result);
      const revs = result?.revisions || [];
      if (revs.length) setActiveRound(revs[revs.length - 1].round);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load revision comparison.",
      );
    } finally {
      setLoading(false);
    }
  }, [researchId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
        <FaExclamationCircle className="shrink-0" /> {error}
      </div>
    );
  }

  const revisions = data?.revisions || [];

  if (!revisions.length) {
    return (
      <div className="flex flex-col items-center py-10 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <FaHistory className="text-xl text-slate-400" />
        </div>
        <p className="font-semibold text-slate-700">No revisions yet</p>
        <p className="text-sm text-slate-400 max-w-xs">
          A comparison will appear here once the researcher submits a revised
          version.
        </p>
      </div>
    );
  }

  const current = revisions.find((r) => r.round === activeRound) || revisions[0];
  const changed = current?.changedFields || Object.keys(current?.revised || {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <FaHistory className="text-purple-500" /> Revision Comparison
        </h3>
        {revisions.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {revisions.map((r) => (
              <button
                key={r.round}
                type="button"
                onClick={() => setActiveRound(r.round)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  r.round === activeRound
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-purple-300"
                }`}
              >
                Revision {r.round}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 flex items-center gap-1.5">
        Original <FaArrowRight className="text-[9px]" /> Revised
        {current?.snapshotAt && (
          <span className="ml-1">
            · submitted {new Date(current.snapshotAt).toLocaleDateString()}
          </span>
        )}
      </p>

      {changed.length === 0 ? (
        <p className="text-sm text-slate-400 italic py-4 text-center">
          No tracked fields changed in this revision.
        </p>
      ) : (
        <div className="space-y-3">
          {changed.map((field) => (
            <FieldDiff
              key={field}
              field={field}
              previous={current?.previous?.[field]}
              revised={current?.revised?.[field]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RevisionComparison;

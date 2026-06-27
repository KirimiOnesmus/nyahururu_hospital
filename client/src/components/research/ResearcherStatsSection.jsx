
import { useState, useEffect, useRef } from "react";
import {
  FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaDownload, FaEye, FaAward, FaFire,
} from "react-icons/fa";

// ─── Animated counter ─────────────────────────────────────────────────────────
const useCountUp = (target, duration = 700, active = true) => {
  const [count, setCount] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!active || target === 0) { setCount(0); return; }
    let start = null;
    const from = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (target - from) * ease));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, active]);

  return count;
};

// ─── Shared tokens ────────────────────────────────────────────────────────────
const T = {
  blue:   { bg: "#EFF6FF", border: "#BFDBFE", icon: "#2563EB", text: "#1E40AF" },
  green:  { bg: "#F0FDF4", border: "#BBF7D0", icon: "#16A34A", text: "#14532D" },
  amber:  { bg: "#FFFBEB", border: "#FDE68A", icon: "#D97706", text: "#78350F" },
  red:    { bg: "#FEF2F2", border: "#FECACA", icon: "#DC2626", text: "#7F1D1D" },
  indigo: { bg: "#EEF2FF", border: "#C7D2FE", icon: "#4F46E5", text: "#312E81" },
  teal:   { bg: "#F0FDFA", border: "#99F6E4", icon: "#0D9488", text: "#134E4A" },
};

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
const Skeleton = ({ w = "60%", h = 28 }) => (
  <div style={{ width: w, height: h, borderRadius: 6, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
);

// ─── Single stat card ─────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, token, loading, delay = 0, sub }) => {
  const [visible, setVisible] = useState(false);
  const displayed = useCountUp(value, 650, visible);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const c = T[token] || T.blue;

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #F1F5F9",
      borderRadius: 16,
      padding: "20px 20px 18px",
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
      transition: "box-shadow 0.2s",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transitionDuration: "0.4s",
      transitionDelay: `${delay}ms`,
      cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)"; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: c.bg, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon style={{ color: c.icon, fontSize: 18 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <>
            <Skeleton w="50%" h={28} />
            <Skeleton w="70%" h={14} />
          </>
        ) : (
          <>
            <p style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "0 0 2px", letterSpacing: "-0.5px", lineHeight: 1 }}>
              {displayed.toLocaleString()}
            </p>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontWeight: 500 }}>{label}</p>
            {sub && <p style={{ fontSize: 11, color: "#94A3B8", margin: "3px 0 0" }}>{sub}</p>}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Progress ring ────────────────────────────────────────────────────────────
const ProgressRing = ({ pct, color, icon: Icon, label }) => {
  const r = 42, circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 300);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="#F1F5F9" strokeWidth="6" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={circ - (animated / 100) * circ}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <Icon style={{ color, fontSize: 18 }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", lineHeight: 1 }}>{animated}%</span>
        </div>
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#64748B", margin: 0, textAlign: "center" }}>{label}</p>
    </div>
  );
};

// ─── Horizontal bar ───────────────────────────────────────────────────────────
const Bar = ({ label, value, max, color }) => {
  const [w, setW] = useState(0);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  useEffect(() => { const t = setTimeout(() => setW(pct), 400); return () => clearTimeout(t); }, [pct]);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 99, transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </div>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const ResearcherStatsSection = ({ myResearch = [], isLoading = false }) => {
  const stats = {
    total:     myResearch.length,
    approved:  myResearch.filter(r => r.status === "approved").length,
    pending:   myResearch.filter(r => r.status === "pending").length,
    rejected:  myResearch.filter(r => r.status === "rejected").length,
    downloads: myResearch.reduce((s, r) => s + (r.downloads || 0), 0),
    views:     myResearch.reduce((s, r) => s + (r.views || 0), 0),
    published: myResearch.filter(r => r.isPublished).length,
  };

  const acceptanceRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  const cards = [
    { icon: FaFileAlt,     label: "Total submissions",  value: stats.total,     token: "blue",   delay: 0 },
    { icon: FaCheckCircle, label: "Approved",            value: stats.approved,  token: "green",  delay: 60 },
    { icon: FaClock,       label: "Under review",        value: stats.pending,   token: "amber",  delay: 120 },
    { icon: FaTimesCircle, label: "Needs revision",      value: stats.rejected,  token: "red",    delay: 180 },
    { icon: FaDownload,    label: "Total downloads",     value: stats.downloads, token: "indigo", delay: 240 },
  ];

  return (
    <div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
        {cards.map(c => (
          <StatCard key={c.label} {...c} loading={isLoading} />
        ))}
      </div>

      {/* Bottom row — only shown when data exists */}
      {!isLoading && stats.total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>

          {/* Acceptance ring */}
          <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 16, padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <ProgressRing pct={acceptanceRate} color="#16A34A" icon={FaAward} label="Acceptance rate" />
          </div>

          {/* Research metrics */}
          <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 16, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
              <FaEye style={{ color: "#0D9488" }} /> Research metrics
            </p>
            <Bar label="Views" value={stats.views} max={Math.max(stats.views, stats.downloads, 1)} color="#0D9488" />
            <Bar label="Downloads" value={stats.downloads} max={Math.max(stats.views, stats.downloads, 1)} color="#4F46E5" />
            <Bar label="Published" value={stats.published} max={Math.max(stats.total, 1)} color="#16A34A" />
          </div>

          {/* Performance summary */}
          <div style={{ background: "linear-gradient(135deg,#EFF6FF 0%,#F0FDF4 100%)", border: "1px solid #BFDBFE", borderRadius: 16, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
              <FaFire style={{ color: "#D97706" }} /> Performance
            </p>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Approval ratio</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{stats.approved}/{stats.total}</span>
              </div>
              <div style={{ height: 8, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${acceptanceRate}%`, background: "linear-gradient(90deg,#16A34A,#0D9488)", borderRadius: 99, transition: "width 1s ease" }} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, margin: 0 }}>
              {stats.approved === stats.total && stats.total > 0
                ? "All submissions approved — excellent track record!"
                : stats.approved > 0
                  ? `${stats.approved} approved submission${stats.approved !== 1 ? "s" : ""}. Keep going!`
                  : "Submit your first proposal to build your record."}
            </p>
          </div>
        </div>
      )}
    </div>
  ); 
};

export default ResearcherStatsSection;
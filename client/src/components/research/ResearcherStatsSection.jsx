// import React, { useState, useEffect } from "react";
// import {
//   FaFlask, FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaDownload, FaStar, FaFire,
//   FaCalendarAlt, FaAward,
// } from "react-icons/fa";
// import { FaChartLine,FaChartColumn  } from "react-icons/fa6";


// const AnimatedCounter = ({ value, duration = 800 }) => {
//   const [count, setCount] = useState(0);

//   useEffect(() => {
//     if (value === 0) {
//       setCount(0);
//       return;
//     }

//     let start = 0;
//     const increment = value / (duration / 16);
//     let animationId;

//     const animate = () => {
//       start += increment;
//       if (start < value) {
//         setCount(Math.floor(start));
//         animationId = requestAnimationFrame(animate);
//       } else {
//         setCount(value);
//       }
//     };

//     animationId = requestAnimationFrame(animate);
//     return () => cancelAnimationFrame(animationId);
//   }, [value, duration]);

//   return <span>{count}</span>;
// };


// const StatCard = ({ icon: Icon, label, value, color, trend, sub, isLoading }) => {
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   return (
//     <div
//       className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md 
//         p-5 flex items-start gap-4 transition-all duration-300 cursor-default
//         ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
//       style={{
//         transitionDelay: "0ms",
//       }}
//     >
//       <div className={`w-12 h-12 rounded-xl flex items-center justify-center 
//         flex-shrink-0 text-lg text-white relative overflow-hidden group
//         ${color}`}>
//         {/* Animated background shine */}
//         <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
//         <Icon className="relative z-10" />
//       </div>

//       <div className="flex-1 min-w-0">
//         <p className="text-2xl font-extrabold text-gray-900">
//           {isLoading ? (
//             <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse" />
//           ) : (
//             <AnimatedCounter value={value} duration={600} />
//           )}
//         </p>
//         <p className="text-sm text-gray-500 leading-tight font-medium">{label}</p>
//         {/* {trend !== undefined && (
//           <div className="flex items-center gap-1 mt-1">
//             {trend > 0 ? (
//               <FaChartLine className="text-green-500 text-xs" />
//             ) : trend < 0 ? (
//               <FaChartLine  className="text-red-500 text-xs transform rotate-180" />
//             ) : null}
//             <span className={`text-xs font-semibold ${
//               trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-400"
//             }`}>
//               {trend > 0 ? "+" : ""}{trend}% from last month
//             </span>
//           </div>
//         )} */}
//         {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
//       </div>
//     </div>
//   );
// };


// const StatGrid = ({ stats, isLoading }) => {
//   const gridCols = {
//     2: "grid-cols-1 sm:grid-cols-2",
//     3: "grid-cols-1 sm:grid-cols-3",
//     4: "grid-cols-2 lg:grid-cols-4",
//     5: "grid-cols-2 lg:grid-cols-5",
//   };

//   const colClass = gridCols[stats.length] || gridCols[5];

//   return (
//     <div className={`grid ${colClass} gap-4`}>
//       {stats.map((stat, idx) => (
//         <div key={stat.label} style={{ animationDelay: `${idx * 50}ms` }}>
//           <StatCard {...stat} isLoading={isLoading} />
//         </div>
//       ))}
//     </div>
//   );
// };


// const ProgressRing = ({ percentage, label, color, icon: Icon }) => {
//   const circumference = 2 * Math.PI * 45;
//   const offset = circumference - (percentage / 100) * circumference;

//   return (
//     <div className="flex flex-col items-center gap-3">
//       <div className="relative w-32 h-32">
//         <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
//           <circle
//             cx="50"
//             cy="50"
//             r="45"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="3"
//             className="text-gray-100"
//           />
//           <circle
//             cx="50"
//             cy="50"
//             r="45"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="3"
//             strokeDasharray={circumference}
//             strokeDashoffset={offset}
//             className={`${color} transition-all duration-1000 ease-out`}
//             strokeLinecap="round"
//           />
//         </svg>
//         <div className="absolute inset-0 flex flex-col items-center justify-center">
//           <Icon className={`text-2xl ${color}`} />
//           <span className="text-xl font-bold text-gray-900 mt-1">{percentage}%</span>
//         </div>
//       </div>
//       <p className="text-sm font-medium text-gray-600 text-center">{label}</p>
//     </div>
//   );
// };


// export const ResearcherStatsSection = ({ myResearch, isLoading }) => {
//   const [stats, setStats] = useState({
//     total: 0,
//     approved: 0,
//     pending: 0,
//     rejected: 0,
//     downloads: 0,
//     views: 0,
//     averageScore: 0,
//   });

  
//   useEffect(() => {
//     if (myResearch && myResearch.length > 0) {
//       const newStats = {
//         total: myResearch.length,
//         approved: myResearch.filter((r) => r.status === "approved").length,
//         pending: myResearch.filter((r) => r.status === "pending").length,
//         rejected: myResearch.filter((r) => r.status === "rejected").length,
//         downloads: myResearch.reduce((sum, r) => sum + (r.downloads || 0), 0),
//         views: myResearch.reduce((sum, r) => sum + (r.views || 0), 0),
//         averageScore: Math.round(
//           myResearch.reduce((sum, r) => sum + (r.reviewScore || 0), 0) / myResearch.length
//         ),
//       };
//       setStats(newStats);
//     }
//   }, [myResearch]);


//   const acceptanceRate = stats.total > 0 
//     ? Math.round((stats.approved / stats.total) * 100)
//     : 0;

 
//   const statCards = [
//     {
//       icon: FaFileAlt,
//       label: "Total Submissions",
//       value: stats.total,
//       color: "bg-blue-500",
//       trend: 5,
//     },
//     {
//       icon: FaCheckCircle,
//       label: "Approved",
//       value: stats.approved,
//       color: "bg-green-500",
//       trend: 12,
//     },
//     {
//       icon: FaClock,
//       label: "Under Review",
//       value: stats.pending,
//       color: "bg-yellow-500",
//     },
//     {
//       icon: FaTimesCircle,
//       label: "Needs Revision",
//       value: stats.rejected,
//       color: "bg-red-500",
//       trend: -8,
//     },
//     {
//       icon: FaDownload,
//       label: "Total Downloads",
//       value: stats.downloads,
//       color: "bg-indigo-500",
//       trend: 18,
//     },
//   ];

//   return (
//     <div className="space-y-8">
 
//       <StatGrid stats={statCards} isLoading={isLoading} />

//       {!isLoading && stats.total > 0 && (
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {/* Acceptance Rate */}
//           <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
//             <ProgressRing
//               percentage={acceptanceRate}
//               label="Acceptance Rate"
//               color="text-green-500"
//               icon={FaAward}
//             />
//           </div>

//           {/* Quick Stats */}
//           <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
//             <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
//               <FaChartColumn  className="text-indigo-500" /> Research Metrics
//             </h4>
//             <div className="space-y-3">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600 flex items-center gap-2">
//                   <FaEye className="text-blue-500 text-xs" /> Total Views
//                 </span>
//                 <span className="font-bold text-gray-900">{stats.views}</span>
//               </div>
//               <div className="h-px bg-gray-100" />
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600 flex items-center gap-2">
//                   <FaDownload className="text-indigo-500 text-xs" /> Downloads
//                 </span>
//                 <span className="font-bold text-gray-900">{stats.downloads}</span>
//               </div>
//               <div className="h-px bg-gray-100" />
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600 flex items-center gap-2">
//                   <FaStar className="text-yellow-500 text-xs" /> Avg Score
//                 </span>
//                 <span className="font-bold text-gray-900">{stats.averageScore}/100</span>
//               </div>
//             </div>
//           </div>

//           {/* Performance Summary */}
//           <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm p-6">
//             <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
//               <FaFire className="text-orange-500" /> Performance
//             </h4>
//             <div className="space-y-3">
//               <div>
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-xs font-semibold text-gray-600">Submission Status</span>
//                   <span className="text-xs font-bold text-gray-900">
//                     {stats.approved} / {stats.total}
//                   </span>
//                 </div>
//                 <div className="h-2 bg-white rounded-full overflow-hidden border border-blue-200">
//                   <div
//                     className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
//                     style={{
//                       width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%`,
//                     }}
//                   />
//                 </div>
//               </div>
//               <div className="text-xs text-gray-600 mt-3 leading-relaxed">
//                 {stats.approved === stats.total && stats.total > 0
//                   ? "All submissions approved!"
//                   : stats.approved > 0
//                   ? `Keep up the great work! You have ${stats.approved} approved submission${stats.approved !== 1 ? "s" : ""}.`
//                   : "Submit your first proposal to get started."}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Empty State */}
//       {!isLoading && stats.total === 0 && (
//         <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-12 text-center">
//           <FaFlask className="text-gray-300 text-4xl mx-auto mb-3" />
//           <h3 className="font-bold text-gray-900 mb-1">No submissions yet</h3>
//           <p className="text-gray-600 text-sm">
//             Your statistics will appear here as soon as you submit your first proposal.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ResearcherStatsSection;

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
                ? "🎉 All submissions approved — excellent track record!"
                : stats.approved > 0
                  ? `${stats.approved} approved submission${stats.approved !== 1 ? "s" : ""}. Keep going!`
                  : "Submit your first proposal to build your record."}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {/* {!isLoading && stats.total === 0 && (
        <div style={{ background: "linear-gradient(135deg,#F8FAFC,#EFF6FF)", border: "1px dashed #CBD5E1", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>

          <p style={{ fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>No submissions yet</p>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Your statistics will appear here after your first proposal.</p>
        </div>
      )} */}
    </div>
  ); 
};

export default ResearcherStatsSection;
import React, { useState, useEffect } from "react";
import {
  FaFlask, FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaDownload, FaStar, FaFire,
  FaCalendarAlt, FaAward,
} from "react-icons/fa";
import { FaChartLine,FaChartColumn  } from "react-icons/fa6";


const AnimatedCounter = ({ value, duration = 800 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const increment = value / (duration / 16);
    let animationId;

    const animate = () => {
      start += increment;
      if (start < value) {
        setCount(Math.floor(start));
        animationId = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [value, duration]);

  return <span>{count}</span>;
};


const StatCard = ({ icon: Icon, label, value, color, trend, sub, isLoading }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md 
        p-5 flex items-start gap-4 transition-all duration-300 cursor-default
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{
        transitionDelay: "0ms",
      }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center 
        flex-shrink-0 text-lg text-white relative overflow-hidden group
        ${color}`}>
        {/* Animated background shine */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
        <Icon className="relative z-10" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-2xl font-extrabold text-gray-900">
          {isLoading ? (
            <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse" />
          ) : (
            <AnimatedCounter value={value} duration={600} />
          )}
        </p>
        <p className="text-sm text-gray-500 leading-tight font-medium">{label}</p>
        {/* {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend > 0 ? (
              <FaChartLine className="text-green-500 text-xs" />
            ) : trend < 0 ? (
              <FaChartLine  className="text-red-500 text-xs transform rotate-180" />
            ) : null}
            <span className={`text-xs font-semibold ${
              trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-400"
            }`}>
              {trend > 0 ? "+" : ""}{trend}% from last month
            </span>
          </div>
        )} */}
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
};


const StatGrid = ({ stats, isLoading }) => {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
  };

  const colClass = gridCols[stats.length] || gridCols[5];

  return (
    <div className={`grid ${colClass} gap-4`}>
      {stats.map((stat, idx) => (
        <div key={stat.label} style={{ animationDelay: `${idx * 50}ms` }}>
          <StatCard {...stat} isLoading={isLoading} />
        </div>
      ))}
    </div>
  );
};


const ProgressRing = ({ percentage, label, color, icon: Icon }) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-100"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${color} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`text-2xl ${color}`} />
          <span className="text-xl font-bold text-gray-900 mt-1">{percentage}%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 text-center">{label}</p>
    </div>
  );
};


export const ResearcherStatsSection = ({ myResearch, isLoading }) => {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    downloads: 0,
    views: 0,
    averageScore: 0,
  });

  
  useEffect(() => {
    if (myResearch && myResearch.length > 0) {
      const newStats = {
        total: myResearch.length,
        approved: myResearch.filter((r) => r.status === "approved").length,
        pending: myResearch.filter((r) => r.status === "pending").length,
        rejected: myResearch.filter((r) => r.status === "rejected").length,
        downloads: myResearch.reduce((sum, r) => sum + (r.downloads || 0), 0),
        views: myResearch.reduce((sum, r) => sum + (r.views || 0), 0),
        averageScore: Math.round(
          myResearch.reduce((sum, r) => sum + (r.reviewScore || 0), 0) / myResearch.length
        ),
      };
      setStats(newStats);
    }
  }, [myResearch]);


  const acceptanceRate = stats.total > 0 
    ? Math.round((stats.approved / stats.total) * 100)
    : 0;

 
  const statCards = [
    {
      icon: FaFileAlt,
      label: "Total Submissions",
      value: stats.total,
      color: "bg-blue-500",
      trend: 5,
    },
    {
      icon: FaCheckCircle,
      label: "Approved",
      value: stats.approved,
      color: "bg-green-500",
      trend: 12,
    },
    {
      icon: FaClock,
      label: "Under Review",
      value: stats.pending,
      color: "bg-yellow-500",
    },
    {
      icon: FaTimesCircle,
      label: "Needs Revision",
      value: stats.rejected,
      color: "bg-red-500",
      trend: -8,
    },
    {
      icon: FaDownload,
      label: "Total Downloads",
      value: stats.downloads,
      color: "bg-indigo-500",
      trend: 18,
    },
  ];

  return (
    <div className="space-y-8">
 
      <StatGrid stats={statCards} isLoading={isLoading} />

      {!isLoading && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Acceptance Rate */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
            <ProgressRing
              percentage={acceptanceRate}
              label="Acceptance Rate"
              color="text-green-500"
              icon={FaAward}
            />
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaChartColumn  className="text-indigo-500" /> Research Metrics
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <FaEye className="text-blue-500 text-xs" /> Total Views
                </span>
                <span className="font-bold text-gray-900">{stats.views}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <FaDownload className="text-indigo-500 text-xs" /> Downloads
                </span>
                <span className="font-bold text-gray-900">{stats.downloads}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <FaStar className="text-yellow-500 text-xs" /> Avg Score
                </span>
                <span className="font-bold text-gray-900">{stats.averageScore}/100</span>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm p-6">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaFire className="text-orange-500" /> Performance
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">Submission Status</span>
                  <span className="text-xs font-bold text-gray-900">
                    {stats.approved} / {stats.total}
                  </span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-blue-200">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
                    style={{
                      width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-3 leading-relaxed">
                {stats.approved === stats.total && stats.total > 0
                  ? "All submissions approved!"
                  : stats.approved > 0
                  ? `Keep up the great work! You have ${stats.approved} approved submission${stats.approved !== 1 ? "s" : ""}.`
                  : "Submit your first proposal to get started."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && stats.total === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-12 text-center">
          <FaFlask className="text-gray-300 text-4xl mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-1">No submissions yet</h3>
          <p className="text-gray-600 text-sm">
            Your statistics will appear here as soon as you submit your first proposal.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResearcherStatsSection;
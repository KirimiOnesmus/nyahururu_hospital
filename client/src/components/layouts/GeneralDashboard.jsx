import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaUsers, FaCalendarAlt, FaNewspaper, FaCalendarDay,
  FaFileAlt, FaComments, FaChartLine, FaCheckCircle,
  FaClock, FaExclamationCircle, FaBell, FaArrowRight,
  FaBriefcase, FaAmbulance, FaBoxes, FaTruck, FaImages,
  FaBullhorn, FaGavel, FaClipboardCheck, FaExclamationTriangle,
  FaFlask, FaUserCircle, FaSpinner,
} from "react-icons/fa";
import { BiSolidDonateHeart } from "react-icons/bi";
import api from "../../api/axios";


const STAT_DEFINITIONS = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: FaUsers,
    color: "blue",
    sub: { icon: FaArrowRight, text: "Manage all users" },
    roles: ["superadmin", "admin", "it"],
    fetch: async () => {
      const res = await api.get("/users");
      return Array.isArray(res.data) ? res.data.length : res.data.length ?? 0;
    },
  },
  {
    key: "pendingAppointments",
    label: "Pending Appointments",
    icon: FaCalendarAlt,
    color: "orange",
    sub: { icon: FaClock, text: "Requires attention" },
    roles: ["superadmin", "admin", "doctor"],
    fetch: async () => {
      const res = await api.get("/appointments/pending");
      return Array.isArray(res.data) ? res.data.length : res.data.length ?? 0;
    
    },
  
  },
  {
    key: "activeNews",
    label: "Active News",
    icon: FaNewspaper,
    color: "green",
    sub: { icon: FaCheckCircle, text: "Published" },
    roles: ["superadmin", "admin", "it", "communication"],
    fetch: async () => {
      const res = await api.get("/news/active");
      return Array.isArray(res.data) ? res.data.length : res.data.length ?? 0;
    },
  },
  {
    key: "upcomingEvents",
    label: "Upcoming Events",
    icon: FaCalendarDay,
    color: "purple",
    sub: { icon: FaCalendarDay, text: "This month" },
    roles: ["superadmin", "admin", "it", "communication"],
    fetch: async () => {
      const res = await api.get("/events/upcoming");
      return Array.isArray(res.data) ? res.data.length : res.data.length ?? 0;
    },
  },
  {
    key: "recentFeedback",
    label: "Recent Feedback",
    icon: FaComments,
    color: "pink",
    sub: { icon: FaComments, text: "Awaiting review" },
    roles: ["superadmin", "admin", "it", "communication"],
    fetch: async () => {
      const res = await api.get("/feedback");
      return Array.isArray(res.data) ? res.data.length : res.data.length ?? 0;
    },
  },
  {
    key: "pendingAmbulanceBookings",
    label: "Pending Ambulance Bookings",
    icon: FaAmbulance,
    color: "yellow",
    sub: { icon: FaClock, text: "Awaiting dispatch" },
    roles: ["superadmin", "admin", "it"],
    fetch: async () => {
      const res = await api.get("/ambulance-bookings");
      const list = Array.isArray(res.data) ? res.data : res.data.data || [];
      return list.filter(b => b.status === "Pending" || b.status === "Waiting").length;
    },
  },
  {
    key: "criticalBookings",
    label: "Critical Bookings",
    icon: FaExclamationCircle,
    color: "red",
    sub: { icon: FaExclamationCircle, text: "Immediate attention" },
    roles: ["superadmin", "admin", "it"],
    fetch: async () => {
      const res = await api.get("/ambulance-bookings");
      const list = Array.isArray(res.data) ? res.data : res.data.data || [];
      return list.filter(b => b.emergencyLevel === "critical").length;
    },
  },
  {
    key: "researchPapers",
    label: "Research Papers",
    icon: FaFileAlt,
    color: "teal",
    sub: { icon: FaChartLine, text: "In repository" },
    roles: ["superadmin", "admin", "it", "research"],
    fetch: async () => {
      const res = await api.get("/research");
      return Array.isArray(res.data) ? res.data.length : res.data.length ?? 0;
    },
  },
  {
    key: "activeNotices",
    label: "Active Notices",
    icon: FaBullhorn,
    color: "indigo",
    sub: { icon: FaBullhorn, text: "Published" },
    roles: ["superadmin", "admin", "it", "communication", "research"],
    fetch: async () => {
      const res = await api.get("/notices/active");
      return Array.isArray(res.data) ? res.data.length : res.data.length ?? 0;
    },
  },
];

// ── Action definitions ─────────────────────────────────────────────────────────
const ACTION_DEFINITIONS = [
  { title:"Manage Users",       icon: FaUsers,              path:"/dashboard/users",         color:"bg-blue-500",   roles:["superadmin","admin","it"]                              },
  { title:"View Appointments",  icon: FaCalendarAlt,        path:"/dashboard/appointments",  color:"bg-green-500",  roles:["superadmin","admin","doctor"]                          },
  { title:"Create News",        icon: FaNewspaper,          path:"/dashboard/news",          color:"bg-purple-500", roles:["superadmin","admin","it","communication"]              },
  { title:"Manage Events",      icon: FaCalendarDay,        path:"/dashboard/events",        color:"bg-orange-500", roles:["superadmin","admin","it","communication"]              },
  { title:"Gallery",            icon: FaImages,             path:"/dashboard/gallery",       color:"bg-pink-500",   roles:["superadmin","admin","it","communication"]              },
  { title:"Research Papers",    icon: FaFlask,              path:"/dashboard/research",      color:"bg-teal-500",   roles:["superadmin","admin","it","research"]                   },
  { title:"Ambulance Bookings", icon: FaAmbulance,          path:"/dashboard/logistics",     color:"bg-red-500",    roles:["superadmin","admin","it"]                              },
  { title:"Inventory",          icon: FaBoxes,              path:"/dashboard/inventory",     color:"bg-amber-500",  roles:["superadmin","admin","it"]                              },
  { title:"Logistics",          icon: FaTruck,              path:"/dashboard/logistics",     color:"bg-cyan-500",   roles:["superadmin","admin","it"]                              },
  { title:"Notices",            icon: FaBullhorn,           path:"/dashboard/notices",       color:"bg-violet-500", roles:["superadmin","admin","it","communication","research"]   },
  { title:"Tenders",            icon: FaGavel,              path:"/dashboard/tenders",       color:"bg-lime-600",   roles:["superadmin","admin","it","communication","research"]   },
  { title:"Donations",          icon: BiSolidDonateHeart,   path:"/dashboard/donations",     color:"bg-rose-500",   roles:["superadmin","admin","it"]                              },
  { title:"Fraud Reports",      icon: FaExclamationTriangle,path:"/dashboard/fraud",         color:"bg-orange-600", roles:["superadmin","admin","it"]                              },
  { title:"Audit Logs",         icon: FaClipboardCheck,     path:"/dashboard/audit-logs",    color:"bg-slate-600",  roles:["superadmin"]                                          },
  { title:"View Feedback",      icon: FaComments,           path:"/dashboard/feedback",      color:"bg-fuchsia-500",roles:["superadmin","admin","it","communication"]              },
];

// ── Color palette ──────────────────────────────────────────────────────────────
const COLOR_MAP = {
  blue:   { bg:"bg-blue-50",   text:"text-blue-600",   num:"text-blue-700"   },
  orange: { bg:"bg-orange-50", text:"text-orange-600", num:"text-orange-700" },
  green:  { bg:"bg-green-50",  text:"text-green-600",  num:"text-green-700"  },
  purple: { bg:"bg-purple-50", text:"text-purple-600", num:"text-purple-700" },
  pink:   { bg:"bg-pink-50",   text:"text-pink-600",   num:"text-pink-700"   },
  yellow: { bg:"bg-yellow-50", text:"text-yellow-600", num:"text-yellow-700" },
  red:    { bg:"bg-red-50",    text:"text-red-600",    num:"text-red-700"    },
  teal:   { bg:"bg-teal-50",   text:"text-teal-600",   num:"text-teal-700"   },
  indigo: { bg:"bg-indigo-50", text:"text-indigo-600", num:"text-indigo-700" },
};


const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
};


const decodeToken = (token) => {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};


const StatCard = ({ stat, value, loading }) => {
  const Icon    = stat.icon;
  const SubIcon = stat.sub.icon;
  const c       = COLOR_MAP[stat.color] || COLOR_MAP.blue;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
          <div className={`text-3xl font-black ${c.num} mb-2`}>
            {loading ? <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" /> : value ?? 0}
          </div>
          <p className={`text-xs flex items-center gap-1.5 font-semibold ${c.text}`}>
            <SubIcon className="text-[10px]" />{stat.sub.text}
          </p>
        </div>
        <div className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center shrink-0`}>
          <Icon className={`text-2xl ${c.text}`} />
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ action }) => {
  const Icon = action.icon;
  return (
    <button
      onClick={() => window.location.href = action.path}
      className="flex flex-col items-center p-4 rounded-2xl cursor-pointer hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100 hover:shadow-sm"
    >
      <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
        <Icon className="text-xl text-white" />
      </div>
      <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{action.title}</span>
    </button>
  );
};


const GeneralDashboard = () => {
  const role  = localStorage.getItem("role") ?? "staff";
  const token = localStorage.getItem("token");

  const [user,        setUser]        = useState(null);
  const [statsValues, setStatsValues] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [statsLoading,setStatsLoading]= useState(true);
  const [error,       setError]       = useState(null);


  const visibleStats   = useMemo(() => STAT_DEFINITIONS.filter(s => s.roles.includes(role)),   [role]);
  const visibleActions = useMemo(() => ACTION_DEFINITIONS.filter(a => a.roles.includes(role)), [role]);


  const fetchUserInfo = useCallback(async () => {
    try {
      const decoded = decodeToken(token);
      const userID  = decoded?.id;
      if (!userID) {
       
        setUser({ name: decoded?.name || "Staff Member", role });
        return;
      }
      const res  = await api.get(`/users/${userID}`);
      const data = res.data;
      setUser({
        name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Staff Member",
        role: data.role ?? role,
      });
    } catch {
      
      setUser({ name: "Staff Member", role });
    }
  }, [token, role]);


  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    const results = await Promise.allSettled(
      visibleStats.map(async stat => {
        try {
          const value = await stat.fetch();
          return { key: stat.key, value };
        } catch {
          return { key: stat.key, value: 0 };
        }
      })
    );
    const merged = {};
    results.forEach(r => {
      if (r.status === "fulfilled") merged[r.value.key] = r.value.value;
    });
    setStatsValues(merged);
    setStatsLoading(false);
  }, [visibleStats]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUserInfo(), fetchStats()]);
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchUserInfo, fetchStats]);

  const displayName = user?.name || "Staff Member";
  const displayRole = user?.role || role;

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <style>{`
        .fade-up { animation: fadeUp .4s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .stagger-1 { animation-delay:.05s; }
        .stagger-2 { animation-delay:.1s;  }
        .stagger-3 { animation-delay:.15s; }
      `}</style>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 px-6 py-3 flex items-center gap-2">
          <FaExclamationTriangle className="text-rose-500 shrink-0" />
          <p className="text-rose-700 text-sm">{error}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">


        <div className="mb-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg shadow-blue-200 fade-up">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  {loading
                    ? <FaSpinner className="text-white animate-spin" />
                    : <FaUserCircle className="text-white text-xl" />
                  }
                </div>
                <div>
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">{getGreeting()}</p>
                  <h1 className="text-2xl font-black truncate">{displayName}</h1>
                </div>
              </div>
              <p className="text-blue-100 text-sm">Welcome to your dashboard. Here's what's happening today.</p>
            </div>
            <div className="hidden md:block shrink-0">
              <div className="bg-white/10 rounded-xl px-5 py-4 backdrop-blur-sm text-right">
                <p className="text-base font-bold">
                  {new Date().toLocaleDateString("en-KE", { weekday:"long", month:"long", day:"numeric" })}
                </p>
                <p className="text-blue-200 text-xs mt-0.5 capitalize">{displayRole} account</p>
              </div>
            </div>
          </div>
        </div>

       
        {visibleStats.length > 0 && (
          <div className="mb-8 fade-up stagger-1">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FaBell className="text-gray-300" /> Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleStats.map(stat => (
                <StatCard
                  key={stat.key}
                  stat={stat}
                  value={statsValues[stat.key]}
                  loading={statsLoading}
                />
              ))}
            </div>
          </div>
        )}

        
        {visibleActions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 fade-up stagger-2">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-5 flex items-center gap-2">
              <FaBriefcase className="text-blue-500" /> Quick Actions
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {visibleActions.map(action => (
                <ActionCard key={action.path + action.title} action={action} />
              ))}
            </div>
          </div>
        )}

       
        {!loading && visibleStats.length === 0 && visibleActions.length === 0 && (
          <div className="text-center py-20 fade-up">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaBriefcase className="text-3xl text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">No dashboard data configured for your role.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralDashboard;
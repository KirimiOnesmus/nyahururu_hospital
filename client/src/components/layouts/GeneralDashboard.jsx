import React, { useState, useEffect } from "react";
import {
  FaUsers, FaCalendarAlt, FaNewspaper, FaCalendarDay,
  FaFileAlt, FaComments, FaChartLine, FaCheckCircle,
  FaClock, FaExclamationCircle, FaBell, FaArrowRight,
  FaTasks, FaBriefcase, FaAmbulance, FaHospital,
  FaBoxes, FaTruck, FaImages, FaBullhorn, FaGavel,
  FaClipboardCheck, FaExclamationTriangle, FaFlask,
} from "react-icons/fa";
import { BiSolidDonateHeart } from "react-icons/bi";
import api from "../../api/axios";


const STAT_DEFINITIONS = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: FaUsers,
    color: "blue",
    sub: { icon: FaArrowRight, text: "Manage all users", color: "green" },
    roles: ["superadmin", "admin", "it"],
    fetch: async (token) => {
      const res = await api.get("/users", { headers: { Authorization: `Bearer ${token}` } });
      return res.data.length ?? 0;
    },
  },
  {
    key: "pendingAppointments",
    label: "Pending Appointments",
    icon: FaCalendarAlt,
    color: "orange",
    sub: { icon: FaClock, text: "Requires attention", color: "orange" },
    roles: ["superadmin", "admin", "doctor"],
    fetch: async (token) => {
      const res = await api.get("/appointments/pending", { headers: { Authorization: `Bearer ${token}` } });
      return res.data.length ?? 0;
    },
  },
  {
    key: "activeNews",
    label: "Active News",
    icon: FaNewspaper,
    color: "green",
    sub: { icon: FaCheckCircle, text: "Published", color: "green" },
    roles: ["superadmin", "admin", "it", "communication"],
    fetch: async (token) => {
      const res = await api.get("/news/active", { headers: { Authorization: `Bearer ${token}` } });
      return res.data.length ?? 0;
    },
  },
  {
    key: "upcomingEvents",
    label: "Upcoming Events",
    icon: FaCalendarDay,
    color: "purple",
    sub: { icon: FaCalendarDay, text: "This month", color: "purple" },
    roles: ["superadmin", "admin", "it", "communication"],
    fetch: async (token) => {
      const res = await api.get("/events/upcoming", { headers: { Authorization: `Bearer ${token}` } });
      return res.data.length ?? 0;
    },
  },
  {
    key: "recentFeedback",
    label: "Recent Feedback",
    icon: FaComments,
    color: "pink",
    sub: { icon: FaComments, text: "Awaiting review", color: "pink" },
    roles: ["superadmin", "admin", "it", "communication"],
    fetch: async (token) => {
      const res = await api.get("/feedback", { headers: { Authorization: `Bearer ${token}` } });
      return res.data.length ?? 0;
    },
  },
  {
    key: "pendingAmbulanceBookings",
    label: "Pending Ambulance Bookings",
    icon: FaAmbulance,
    color: "yellow",
    sub: { icon: FaClock, text: "Awaiting dispatch", color: "yellow" },
    roles: ["superadmin", "admin", "it"],
    fetch: async (token) => {
      const res = await api.get("/ambulance-bookings", { headers: { Authorization: `Bearer ${token}` } });
      const bookings = res.data ?? [];
      return bookings.filter((b) => b.status === "Pending" || b.status === "Waiting").length;
    },
  },
  {
    key: "criticalBookings",
    label: "Critical Bookings",
    icon: FaExclamationCircle,
    color: "red",
    sub: { icon: FaExclamationCircle, text: "Immediate attention", color: "red" },
    roles: ["superadmin", "admin", "it"],
    fetch: async (token) => {
      const res = await api.get("/ambulance-bookings", { headers: { Authorization: `Bearer ${token}` } });
      const bookings = res.data ?? [];
      return bookings.filter((b) => b.emergencyLevel === "critical").length;
    },
  },
  {
    key: "researchPapers",
    label: "Research Papers",
    icon: FaFileAlt,
    color: "teal",
    sub: { icon: FaChartLine, text: "In repository", color: "teal" },
    roles: ["superadmin", "admin", "it", "research"],
    fetch: async (token) => {
      const res = await api.get("/research", { headers: { Authorization: `Bearer ${token}` } });
      return res.data.length ?? 0;
    },
  },
  {
    key: "activeNotices",
    label: "Active Notices",
    icon: FaBullhorn,
    color: "indigo",
    sub: { icon: FaBullhorn, text: "Published", color: "indigo" },
    roles: ["superadmin", "admin", "it", "communication", "research"],
    fetch: async (token) => {
      const res = await api.get("/notices/active", { headers: { Authorization: `Bearer ${token}` } });
      return res.data.length ?? 0;
    },
  },
];


const ACTION_DEFINITIONS = [
  { title: "Manage Users",        icon: FaUsers,              path: "/dashboard/users",         color: "bg-blue-500",   roles: ["superadmin", "admin", "it"] },
  { title: "View Appointments",   icon: FaCalendarAlt,        path: "/dashboard/appointments",  color: "bg-green-500",  roles: ["superadmin", "admin", "doctor"] },
  { title: "Create News",         icon: FaNewspaper,          path: "/dashboard/news",          color: "bg-purple-500", roles: ["superadmin", "admin", "it", "communication"] },
  { title: "Manage Events",       icon: FaCalendarDay,        path: "/dashboard/events",        color: "bg-orange-500", roles: ["superadmin", "admin", "it", "communication"] },
  { title: "Gallery",             icon: FaImages,             path: "/dashboard/gallery",       color: "bg-pink-500",   roles: ["superadmin", "admin", "it", "communication"] },
  { title: "Research Papers",     icon: FaFlask,              path: "/dashboard/research",      color: "bg-teal-500",   roles: ["superadmin", "admin", "it", "research"] },
  { title: "Ambulance Bookings",  icon: FaAmbulance,          path: "/dashboard/logistics",     color: "bg-red-500",    roles: ["superadmin", "admin", "it"] },
  { title: "Inventory",           icon: FaBoxes,              path: "/dashboard/inventory",     color: "bg-amber-500",  roles: ["superadmin", "admin", "it"] },
  { title: "Logistics",           icon: FaTruck,              path: "/dashboard/logistics",     color: "bg-cyan-500",   roles: ["superadmin", "admin", "it"] },
  { title: "Notices",             icon: FaBullhorn,           path: "/dashboard/notices",       color: "bg-violet-500", roles: ["superadmin", "admin", "it", "communication", "research"] },
  { title: "Tenders",             icon: FaGavel,              path: "/dashboard/tenders",       color: "bg-lime-600",   roles: ["superadmin", "admin", "it", "communication", "research"] },
  { title: "Donations",           icon: BiSolidDonateHeart,   path: "/dashboard/donations",     color: "bg-rose-500",   roles: ["superadmin", "admin", "it"] },
  { title: "Fraud Reports",       icon: FaExclamationTriangle,path: "/dashboard/fraud",         color: "bg-orange-600", roles: ["superadmin", "admin", "it"] },
  { title: "Audit Logs",          icon: FaClipboardCheck,     path: "/dashboard/audit-logs",    color: "bg-slate-600",  roles: ["superadmin"] },
  { title: "View Feedback",       icon: FaComments,           path: "/dashboard/feedback",      color: "bg-fuchsia-500",roles: ["superadmin", "admin", "it", "communication"] },
];

const COLOR_MAP = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   icon: "text-blue-600" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-600" },
  green:  { bg: "bg-green-50",  text: "text-green-600",  icon: "text-green-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-600" },
  pink:   { bg: "bg-pink-50",   text: "text-pink-600",   icon: "text-pink-600" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-600", icon: "text-yellow-600" },
  red:    { bg: "bg-red-50",    text: "text-red-600",    icon: "text-red-600" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-600",   icon: "text-teal-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "text-indigo-600" },
};

const GeneralDashboard = () => {
  const role  = localStorage.getItem("role") ?? "staff";
  const token = localStorage.getItem("token");

  const [user,    setUser]    = useState({ name: "Staff Member", role });
  const [stats,   setStats]   = useState({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);


  const visibleStats   = STAT_DEFINITIONS.filter((s) => s.roles.includes(role));
  const visibleActions = ACTION_DEFINITIONS.filter((a) => a.roles.includes(role));


  const getUserIdFromToken = () => {
    try {
      const payload = token?.split(".")[1];
      if (!payload) return null;
      return JSON.parse(atob(payload))?.id ?? null;
    } catch {
      return null;
    }
  };


  const fetchUserInfo = async () => {
    try {
      const userID = getUserIdFromToken();
      if (!userID) throw new Error("Could not extract user ID");
      const res  = await api.get(`/users/${userID}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data;
      setUser({
        name: data.name || `${data.firstName} ${data.lastName}`,
        role: data.role ?? role,
      });
    } catch (err) {
      console.error("User fetch error:", err);
    }
  };

  // ── Fetch only the stats this role needs ─────────────────────────────────
  const fetchStats = async () => {
    const results = await Promise.allSettled(
      visibleStats.map(async (stat) => {
        try {
          const value = await stat.fetch(token);
          return { key: stat.key, value };
        } catch {
          return { key: stat.key, value: 0 };
        }
      })
    );

    const merged = {};
    results.forEach((r) => {
      if (r.status === "fulfilled") merged[r.value.key] = r.value.value;
    });
    setStats(merged);
  };

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
 
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  };




  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">

        <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {getGreeting()}, {user.name}! 
              </h1>
              <p className="text-blue-100 text-lg">
                Welcome to your dashboard. Here's what's happening today.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-xl font-semibold">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric",
                  })}
                </p>
                <p className="text-blue-200 text-sm mt-1 capitalize">{role} account</p>
              </div>
            </div>
          </div>
        </div>

        {visibleStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {visibleStats.map((stat) => {
              const Icon    = stat.icon;
              const SubIcon = stat.sub.icon;
              const c       = COLOR_MAP[stat.color] ?? COLOR_MAP.blue;

              return (
                <div
                  key={stat.key}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                      <h3 className={`text-3xl font-bold ${c.text}`}>
                        {stats[stat.key] ?? 0}
                      </h3>
                      <p className={`text-sm ${c.text} mt-2 flex items-center gap-1`}>
                        <SubIcon />
                        {stat.sub.text}
                      </p>
                    </div>
                    <div className={`w-14 h-14 ${c.bg} rounded-full flex items-center justify-center`}>
                      <Icon className={`text-2xl ${c.icon}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {visibleActions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FaBriefcase className="mr-2 text-blue-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.path + action.title}
                    onClick={() => (window.location.href = action.path)}
                    className="flex flex-col items-center p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                  >
                    <div
                      className={`w-14 h-14 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="text-2xl text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center">
                      {action.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

   
        {visibleStats.length === 0 && visibleActions.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FaBriefcase className="text-5xl mx-auto mb-4 opacity-30" />
            <p className="text-lg">No dashboard data configured for your role.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralDashboard;
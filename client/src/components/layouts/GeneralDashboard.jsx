import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaCalendarAlt,
  FaNewspaper,
  FaCalendarDay,
  FaFileAlt,
  FaComments,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaBell,
  FaArrowRight,
  FaTasks,
  FaBriefcase,
  FaAmbulance,
  FaHospital,
} from "react-icons/fa";
import api from "../../api/axios";

const GeneralDashboard = () => {
  const [user, setUser] = useState({ name: "Staff Member", role: "staff" });
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingAppointments: 0,
    activeNews: 0,
    upcomingEvents: 0,
    recentFeedback: 0,
    totalAmbulanceBookings: 0,
    pendingAmbulanceBookings: 0,
    assignedAmbulanceBookings: 0,
    criticalBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quickActions] = useState([
    {
      title: "Manage Users",
      icon: FaUsers,
      path: "/dashboard/users",
      color: "bg-blue-500",
    },
    {
      title: "View Appointments",
      icon: FaCalendarAlt,
      path: "/dashboard/appointments",
      color: "bg-green-500",
    },
    {
      title: "Create News",
      icon: FaNewspaper,
      path: "/dashboard/news",
      color: "bg-purple-500",
    },
    {
      title: "Manage Events",
      icon: FaCalendarDay,
      path: "/dashboard/events",
      color: "bg-orange-500",
    },
    {
      title: "Research Papers",
      icon: FaFileAlt,
      path: "/dashboard/research",
      color: "bg-teal-500",
    },
    {
      title: "Ambulance Bookings",
      icon: FaAmbulance,
      path: "/dashboard/logistics",
      color: "bg-red-500",
    },
  ]);

  // Helper function to extract user ID from JWT token
  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const payload = token.split(".")[1];
      if (!payload) return null;

      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload.id || decodedPayload.userId || null;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Fetching user details
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const userID = getUserIdFromToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      if (!userID) {
        throw new Error("Could not extract user ID from token");
      }

      console.log("Fetching user info for ID:", userID);

      const response = await api.get(`/users/${userID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data;
      setUser({
        name: userData.name || `${userData.firstName} ${userData.lastName}`,
        role: userData.role || "staff",
      });
    } catch (error) {
      console.error("User fetch error:", error);
      setError("Failed to load user information");
    }
  };

  // Fetching other stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Fetch total users
      try {
        const usersResponse = await api.get("/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats((prev) => ({
          ...prev,
          totalUsers: usersResponse.data.length || 0,
        }));
      } catch (err) {
        console.log("Users endpoint error:", err.message);
      }

      // Fetch pending appointments
      try {
        const appointmentsResponse = await api.get("/appointments/pending", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const pendingCount = appointmentsResponse.data.length || 0;
        setStats((prev) => ({
          ...prev,
          pendingAppointments: pendingCount,
        }));
      } catch (err) {
        console.log("Appointments endpoint not available");
      }

      // Fetch active news
      try {
        const newsResponse = await api.get("/news/active", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats((prev) => ({
          ...prev,
          activeNews: newsResponse.data.length || 0,
        }));
      } catch (err) {
        console.log("News endpoint not available");
      }

      // Fetch upcoming events
      try {
        const eventsResponse = await api.get("/events/upcoming", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats((prev) => ({
          ...prev,
          upcomingEvents: eventsResponse.data.length || 0,
        }));
      } catch (err) {
        console.log("Events endpoint not available");
      }

      // Fetch feedback
      try {
        const feedbackResponse = await api.get("/feedback", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats((prev) => ({
          ...prev,
          recentFeedback: feedbackResponse.data.length || 0,
        }));
      } catch (err) {
        console.log("Feedback endpoint not available");
      }

      // Fetch ambulance bookings statistics
      try {
        const bookingsResponse = await api.get("/ambulance-bookings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const bookings = bookingsResponse.data || [];
        
        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter(
          (b) => b.status === "Pending" || b.status === "Waiting"
        ).length;
        const assignedBookings = bookings.filter(
          (b) => b.status === "Assigned"
        ).length;
        const criticalBookings = bookings.filter(
          (b) => b.emergencyLevel === "critical"
        ).length;

        setStats((prev) => ({
          ...prev,
          totalAmbulanceBookings: totalBookings,
          pendingAmbulanceBookings: pendingBookings,
          assignedAmbulanceBookings: assignedBookings,
          criticalBookings: criticalBookings,
        }));
      } catch (err) {
        console.log("Ambulance bookings endpoint not available");
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
      setError("Failed to load dashboard statistics");
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUserInfo(), fetchStats()]);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {getGreeting()}, {user.name}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Welcome to your dashboard. Here's what's happening today.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-xl font-semibold">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {stats.totalUsers}
                </h3>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <FaArrowRight className="mr-1" />
                  Manage all users
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                <FaUsers className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Pending Appointments
                </p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {stats.pendingAppointments}
                </h3>
                <p className="text-sm text-orange-600 mt-2 flex items-center">
                  <FaClock className="mr-1" />
                  Requires attention
                </p>
              </div>
              <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center">
                <FaCalendarAlt className="text-2xl text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active News</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {stats.activeNews}
                </h3>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <FaCheckCircle className="mr-1" />
                  Published
                </p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <FaNewspaper className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Upcoming Events</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {stats.upcomingEvents}
                </h3>
                <p className="text-sm text-purple-600 mt-2 flex items-center">
                  <FaCalendarDay className="mr-1" />
                  This month
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center">
                <FaCalendarDay className="text-2xl text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Recent Feedback</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {stats.recentFeedback}
                </h3>
                <p className="text-sm text-pink-600 mt-2 flex items-center">
                  <FaComments className="mr-1" />
                  Awaiting review
                </p>
              </div>
              <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center">
                <FaComments className="text-2xl text-pink-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Ambulance Bookings</p>
                <h3 className="text-3xl font-bold text-yellow-600">
                  {stats.pendingAmbulanceBookings}
                </h3>
                <p className="text-sm text-yellow-600 mt-2 flex items-center">
                  <FaClock className="mr-1" />
                  Awaiting dispatch
                </p>
              </div>
              <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center">
                <FaClock className="text-2xl text-yellow-600" />
              </div>
            </div>
          </div>


        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FaBriefcase className="mr-2 text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => (window.location.href = action.path)}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
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
      </div>
    </div>
  );
};

export default GeneralDashboard;
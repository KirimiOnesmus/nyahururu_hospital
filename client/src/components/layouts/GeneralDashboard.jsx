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
} from "react-icons/fa";

const GeneralDashboard = () => {
  const [user, setUser] = useState({ name: "Staff Member", role: "staff" });
  const [stats, setStats] = useState({
    totalUsers: 156,
    pendingAppointments: 23,
    activeNews: 8,
    upcomingEvents: 5,
    recentFeedback: 12,
    tasksToday: 7,
  });



  const [quickActions, setQuickActions] = useState([
    { title: "Manage Users", icon: FaUsers, path: "/dashboard/users", color: "bg-blue-500" },
    { title: "View Appointments", icon: FaCalendarAlt, path: "/dashboard/appointments", color: "bg-green-500" },
    { title: "Create News", icon: FaNewspaper, path: "/dashboard/news", color: "bg-purple-500" },
    { title: "Manage Events", icon: FaCalendarDay, path: "/dashboard/events", color: "bg-orange-500" },
    { title: "Research Papers", icon: FaFileAlt, path: "/dashboard/research", color: "bg-teal-500" },
    { title: "View Feedback", icon: FaComments, path: "/dashboard/feedback", color: "bg-pink-500" },
  ]);

  const [tasks, setTasks] = useState([
    { id: 1, title: "Review pending appointments", completed: false, priority: "high" },
    { id: 2, title: "Update hospital news section", completed: false, priority: "medium" },
    { id: 3, title: "Prepare event materials", completed: true, priority: "low" },
    { id: 4, title: "Respond to feedback", completed: false, priority: "high" },
  ]);

  useEffect(() => {
    // Get user info from localStorage
    const role = localStorage.getItem("role");
    const userName = localStorage.getItem("userName") || "Staff Member";
    setUser({ name: userName, role: role || "staff" });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
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
              <div className=" bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
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
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers}</h3>
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
                <p className="text-sm text-gray-500 mb-1">Pending Appointments</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.pendingAppointments}</h3>
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
                <h3 className="text-3xl font-bold text-gray-900">{stats.activeNews}</h3>
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
                <h3 className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</h3>
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
                <h3 className="text-3xl font-bold text-gray-900">{stats.recentFeedback}</h3>
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

        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
                    <div className={`w-14 h-14 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
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
    </div>
  );
};

export default GeneralDashboard;
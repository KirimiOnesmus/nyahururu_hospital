import React, { useState, useEffect } from "react";
import {
  FaHospital,
  FaCheckCircle,
  FaClock,
  FaChartLine,
  FaUsers,
  FaCalendarAlt,
  FaComments,
  FaExclamationTriangle,
  FaNewspaper,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

const SuperAdmin = () => {
  const [stats, setStats] = useState({
    totalHospitals: 0,
    activeHospitals: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    totalAppointments: 0,
    totalFeedback: 0,
    fraudReports: 0,
    contentItems: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call - Replace with actual API endpoint
    setTimeout(() => {
      setStats({
        totalHospitals: 47,
        activeHospitals: 42,
        pendingApprovals: 5,
        totalUsers: 1234,
        totalAppointments: 856,
        totalFeedback: 342,
        fraudReports: 12,
        contentItems: 156,
      });
      setLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, bgColor, iconColor }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
              <Icon className={`text-xl ${iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{title}</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  value
                )}
              </h3>
            </div>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm font-semibold ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
            {trend > 0 ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );

  const QuickActionButton = ({ icon: Icon, title, description, onClick, color }) => (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-5 hover:shadow-md transition-all border border-gray-100 text-left group"
    >
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="text-xl text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );

  const SystemStat = ({ label, value, color }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{loading ? "..." : value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
             Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive overview of all system operations
          </p>
        </div>

        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FaHospital}
            title="Total Hospitals"
            value={stats.totalHospitals}
            subtitle="Registered facilities"
            trend={8}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={FaCheckCircle}
            title="Active Hospitals"
            value={stats.activeHospitals}
            subtitle="Currently operational"
            trend={5}
            bgColor="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            icon={FaClock}
            title="Pending Approvals"
            value={stats.pendingApprovals}
            subtitle="Awaiting review"
            bgColor="bg-orange-50"
            iconColor="text-orange-600"
          />
          <StatCard
            icon={FaChartLine}
            title="System Health"
            value="98.5%"
            subtitle="Uptime this month"
            trend={2}
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* System Statistics Card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaChartLine className="mr-2 text-purple-600" />
              System Statistics
            </h3>
            <div className="space-y-1">
              <SystemStat
                label="Total Users"
                value={stats.totalUsers.toLocaleString()}
                color="text-blue-600"
              />
              <SystemStat
                label="Total Appointments"
                value={stats.totalAppointments.toLocaleString()}
                color="text-green-600"
              />
              <SystemStat
                label="Feedback Received"
                value={stats.totalFeedback.toLocaleString()}
                color="text-teal-600"
              />
              <SystemStat
                label="Fraud Reports"
                value={stats.fraudReports}
                color="text-red-600"
              />
              <SystemStat
                label="Content Items"
                value={stats.contentItems.toLocaleString()}
                color="text-purple-600"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickActionButton
                icon={FaUsers}
                title="Manage All Users"
                description="View and manage user accounts"
                onClick={() => window.location.href = "/dashboard/users"}
                color="bg-blue-600"
              />
              <QuickActionButton
                icon={FaCalendarAlt}
                title="Appointments"
                description="Monitor appointment system"
                onClick={() => window.location.href = "/dashboard/appointments"}
                color="bg-green-600"
              />
              <QuickActionButton
                icon={FaComments}
                title="View Feedback"
                description="Review user feedback"
                onClick={() => window.location.href = "/dashboard/feedback"}
                color="bg-teal-600"
              />
              <QuickActionButton
                icon={FaExclamationTriangle}
                title="Fraud Reports"
                description="Investigate fraud cases"
                onClick={() => window.location.href = "/dashboard/fraud"}
                color="bg-red-600"
              />
              <QuickActionButton
                icon={FaNewspaper}
                title="Content Management"
                description="Manage news, research & events"
                onClick={() => window.location.href = "/dashboard/news"}
                color="bg-purple-600"
              />
              <QuickActionButton
                icon={FaHospital}
                title="Hospital Management"
                description="Manage hospital facilities"
                onClick={() => window.location.href = "/dashboard/hospitals"}
                color="bg-indigo-600"
              />
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default SuperAdmin;
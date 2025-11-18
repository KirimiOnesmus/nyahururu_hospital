import React, { useEffect, useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import {
  FaUsers,
  FaCalendarAlt,
  FaNewspaper,
  FaCalendarDay,
  FaBriefcase,
  FaStethoscope,
  FaFileAlt,
  FaComments,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaChevronDown,
  FaUser,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/hmis");
  }, [token, navigate]);


  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const links = [
    {
      title: "Users",
      path: "/dashboard/users",
      roles: ["superadmin", "admin", "it"],
      icon: FaUsers,
    },
    {
      title: "Appointments",
      path: "/dashboard/appointments",
      roles: ["superadmin", "doctor", "admin"],
      icon: FaCalendarAlt,
    },
    {
      title: "News",
      path: "/dashboard/news",
      roles: ["superadmin", "communication", "it", "admin"],
      icon: FaNewspaper,
    },
    {
      title: "Events",
      path: "/dashboard/events",
      roles: ["superadmin", "communication", "it", "admin"],
      icon: FaCalendarDay,
    },
    {
      title: "Careers",
      path: "/dashboard/careers",
      roles: ["superadmin", "it", "admin"],
      icon: FaBriefcase,
    },
    {
      title: "Services",
      path: "/dashboard/services",
      roles: ["superadmin", "it", "admin"],
      icon: FaStethoscope,
    },
    {
      title: "Research",
      path: "/dashboard/research",
      roles: ["superadmin", "it", "admin"],
      icon: FaFileAlt,
    },
    {
      title: "Feedback",
      path: "/dashboard/feedback",
      roles: ["superadmin", "communication", "it", "admin"],
      icon: FaComments,
    },
    {
      title: "Fraud Reports",
      path: "/dashboard/fraud",
      roles: ["superadmin", "it", "admin"],
      icon: FaExclamationTriangle,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/hmis");
  };

  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg z-50">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-xl font-bold text-white">N.C.R.H</h2>
            <p className="text-xs text-blue-100">CMS</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 bg-white shadow-xl flex flex-col border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        <div className="hidden lg:block p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-2xl font-bold text-white mb-1">N.C.R.H</h2>
          <p className="text-sm text-blue-100">Content Management System</p>
        </div>


        <div className="lg:hidden h-20" />

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {links.map((link) => {
              if (!link.roles.includes(role)) return null;

              const Icon = link.icon;
              const isActive = isActivePath(link.path);

              return (
                <Link
                  key={link.title}
                  to={link.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`transition-colors ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  />
                  <span
                    className={`font-medium ${isActive ? "font-semibold" : ""}`}
                  >
                    {link.title}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Profile Section */}
        <div className="p-4   bg-gray-50">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                {role?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-800 capitalize">
                  {role}
                </p>
                <p className="text-xs text-gray-500">View profile</p>
              </div>
              <FaChevronDown
                className={`text-gray-400 transition-transform duration-200 ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
              />
            </button>

          
            {showProfileMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <Link
                  to="/dashboard/profile"
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-600 hover:text-blue-600 cursor-pointer"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <FaUser />
                  <span className="text-sm">My Profile</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center cursor-pointer space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            <FaSignOutAlt className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full pt-20 lg:pt-0">
        <div className="p-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
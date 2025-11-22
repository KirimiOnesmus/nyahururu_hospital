import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
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
  FaChevronLeft,
  FaUser,
  FaHospital,
  FaTh,
  FaCog,
  FaMoon,
  FaBoxes,
  FaTruck,
  FaImages,
  FaClipboardList,
  FaBullhorn,
  FaGavel,
  FaClipboardCheck,
} from "react-icons/fa";
import { MdMenu,MdClose } from "react-icons/md";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) navigate("/hmis");
  }, [token, navigate]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Grouped navigation structure
  const navigationGroups = [
    {
      category: "Management",
      items: [
        { title: "Dashboard", path: "/dashboard", roles: ["superadmin", "admin", "it", "doctor", "communication"], icon: FaTh },
        { title: "Hospitals", path: "/dashboard/hospitals", roles: ["superadmin"], icon: FaHospital },
        { title: "Appointments", path: "/dashboard/appointments", roles: ["superadmin", "doctor", "admin"], icon: FaCalendarAlt },
        { title: "Careers", path: "/dashboard/careers", roles: ["superadmin", "it", "admin"], icon: FaBriefcase },
        { title: "Services", path: "/dashboard/services", roles: ["superadmin", "it", "admin"], icon: FaStethoscope },
        { title: "Research", path: "/dashboard/research", roles: ["superadmin", "it", "admin"], icon: FaFileAlt },
        { title: "Feedback", path: "/dashboard/feedback", roles: ["superadmin", "communication", "it", "admin"], icon: FaComments },
      ]
    },
    {
      category: "Users",
      items: [
        { title: "Users", path: "/dashboard/users", roles: ["superadmin", "admin", "it"], icon: FaUsers },
        // { title: "Access Cards", path: "/dashboard/users/access-cards", roles: ["superadmin", "admin", "it"], icon: FaIdCard },
      ]
    },
    {
      category: "Inventory & Logistics",
      items: [
        { title: "Inventory", path: "/dashboard/inventory", roles: ["admin", "it","superadmin"], icon: FaBoxes },
        { title: "Logistics", path: "/dashboard/logistics", roles: ["admin", "it","superadmin"], icon: FaTruck },
      ]
    },
    {
      category: "News & Media",
      items: [
        { title: "News", path: "/dashboard/news", roles: ["superadmin", "communication", "it", "admin"], icon: FaNewspaper },
        { title: "Events", path: "/dashboard/events", roles: ["superadmin", "communication", "it", "admin"], icon: FaCalendarDay },
        { title: "Gallery", path: "/dashboard/gallery", roles: ["superadmin", "communication", "it", "admin"], icon: FaImages },
      ]
    },
    {
      category: "Downloads & Resources",
      items: [
        { title: "Reports", path: "/dashboard/reports", roles: ["admin", "it"], icon: FaFileAlt },
      ]
    },
    {
      category: "Public Notice & Announcements",
      items: [
        { title: "Notices", path: "/dashboard/notices", roles: ["superadmin", "communication", "it", "admin"], icon: FaBullhorn },
        { title: "Tenders", path: "/dashboard/tenders", roles: ["superadmin", "communication", "it", "admin"], icon: FaGavel },
      ]
    },
    {
      category: "System",
      items: [
        { title: "Audit Logs", path: "/dashboard/audit-logs", roles: ["superadmin"], icon: FaClipboardCheck },
        { title: "Fraud Reports", path: "/dashboard/fraud", roles: ["superadmin", "it", "admin"], icon: FaExclamationTriangle },
      ]
    },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/hmis");
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">N.C.R.H</h2>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg border border-gray-200 text-md cursor-pointer focus:outline-none "
        >
          {isMobileMenuOpen ? <MdClose /> :  <MdMenu />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/75 bg-opacity-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static z-40 h-full bg-white
          flex flex-col transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >

        <div className="p-6 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NC</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">N.C.R.H</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">NC</span>
            </div>
          )}
        </div>

        {/* CATEGORY LABEL */}
        {!collapsed && (
          <div className="px-6 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main
            </p>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-3">
          {navigationGroups.map((group, groupIndex) => {
            // Filter items user has access to
            const accessibleItems = group.items.filter(item => 
              item.roles.includes(role)
            );

            // Skip empty groups
            if (accessibleItems.length === 0) return null;

            return (
              <div key={groupIndex} className="mb-4">
                {/* Category Header */}
                {!collapsed && (
                  <div className="px-3 mb-2 mt-4 first:mt-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {group.category}
                    </p>
                  </div>
                )}

                {/* Category Items */}
                {accessibleItems.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`
                        flex items-center mb-1 px-3 py-2.5 rounded-lg
                        transition-all duration-150
                        ${active
                          ? "bg-blue-100 text-blue-500"
                          : "text-gray-600 hover:bg-gray-50"
                        }
                        ${collapsed ? "justify-center" : ""}
                      `}
                      title={collapsed ? link.title : ""}
                    >
                      <Icon className={`text-lg ${active ? "text-blue-500" : "text-gray-500"}`} />
                      {!collapsed && (
                        <span className="ml-3 text-sm font-medium">{link.title}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* SETTINGS SECTION */}
        <div className="px-3 mb-4 border-t border-gray-100 pt-4">
          <Link
            to="/dashboard/settings"
            className="flex items-center px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <FaCog className="text-lg text-gray-500" />
            {!collapsed && <span className="ml-3 text-sm font-medium">Settings</span>}
          </Link>
          
          <button
            className="flex items-center w-full px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <FaMoon className="text-lg text-gray-500" />
            {!collapsed && (
              <span className="ml-3 text-sm font-medium flex items-center justify-between w-full">
                Dark mode
                <div className="w-9 h-5 bg-gray-200 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                </div>
              </span>
            )}
          </button>
        </div>

        {/* PROFILE SECTION */}
        <div className="p-4 border-t border-gray-100">
          <Link
            to="/dashboard/profile"
            className={`flex items-center p-2 rounded-lg hover:bg-gray-50 ${collapsed ? "justify-center" : ""}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
              {role?.charAt(0).toUpperCase()}
            </div>

            {!collapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 capitalize truncate">
                  {role || "User"}
                </p>
                <p className="text-xs text-gray-500">Admin Manager</p>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
                title="Logout"
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            )}
          </Link>

          {collapsed && (
            <button
              onClick={handleLogout}
              className="w-full mt-2 p-2 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center"
              title="Logout"
            >
              <FaSignOutAlt className="text-lg" />
            </button>
          )}
        </div>

        {/* COLLAPSE BUTTON */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow hidden lg:flex"
        >
          <FaChevronLeft className={`text-xs text-gray-600 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto pt-20 lg:pt-0 bg-gray-50">
        <div className="py-1 px-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
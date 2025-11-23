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
  FaChevronDown,
  FaChevronRight,
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
  const [expandedCategories, setExpandedCategories] = useState(new Set(["Management", "Users", "Inventory & Logistics", "News & Media", "Public Notice & Announcements", "System"]));

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
          shadow-xl border-r border-gray-100
          overflow-hidden
          overflow-x-hidden
        `}
      >

        <div className={`flex items-center transition-all duration-300 ${collapsed ? "p-4 justify-center" : "p-6"} flex-shrink-0`}>
          {!collapsed && (
            <div className="flex items-center space-x-3 w-full">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NC</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">N.C.R.H</span>
              {/* Sidebar Toggle Button - Right next to text */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Collapse sidebar"
              >
                <MdMenu className="text-xl" />
              </button>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex flex-col items-center">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NC</span>
              </div>
              {/* Sidebar Toggle Button - Below logo when collapsed */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="mt-2 p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Expand sidebar"
              >
                <MdMenu className="text-xl" />
              </button>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 flex flex-col min-h-0">
          {navigationGroups.map((group, groupIndex) => {
            // Filter items user has access to
            const accessibleItems = group.items.filter(item => 
              item.roles.includes(role)
            );

            // Skip empty groups
            if (accessibleItems.length === 0) return null;

            const isExpanded = expandedCategories.has(group.category);
            const isAccordionCategory = ["Management", "Users", "Inventory & Logistics", "News & Media", "Public Notice & Announcements", "System"].includes(group.category);

            const toggleCategory = () => {
              if (!isAccordionCategory) return;
              const newExpanded = new Set(expandedCategories);
              if (isExpanded) {
                newExpanded.delete(group.category);
              } else {
                newExpanded.add(group.category);
              }
              setExpandedCategories(newExpanded);
            };

            return (
              <div key={groupIndex} className="mb-2">
                {/* Category Header - Clickable for accordion categories */}
                {!collapsed ? (
                  <button
                    onClick={toggleCategory}
                    className={`
                      w-full px-3 py-2.5 mb-1 rounded-lg
                      flex items-center justify-between
                      transition-all duration-300
                      ${isAccordionCategory 
                        ? "hover:bg-gray-50 cursor-pointer" 
                        : "cursor-default"
                      }
                      ${isAccordionCategory && isExpanded
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : isAccordionCategory
                        ? "text-gray-700 font-medium"
                        : "text-gray-400 font-semibold"
                      }
                    `}
                    disabled={!isAccordionCategory}
                  >
                    <span className="text-xs uppercase tracking-wider">
                      {group.category}
                    </span>
                    {isAccordionCategory && (
                      <span className="text-xs">
                        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                      </span>
                    )}
                  </button>
                ) : collapsed && accessibleItems.length > 0 ? (
                  // Collapsed state: Show category icon with tooltip for all categories
                  <div className="relative group mb-1">
                    <div 
                      onClick={isAccordionCategory ? toggleCategory : undefined}
                      className={`
                      relative w-10 h-10 mx-auto rounded-lg flex items-center justify-center
                      ${isAccordionCategory && isExpanded ? "bg-blue-50" : "bg-gray-50"}
                      transition-all duration-300
                      ${isAccordionCategory ? "cursor-pointer hover:bg-gray-100" : ""}
                    `}>
                      {(() => {
                        const FirstIcon = accessibleItems[0].icon;
                        return <FirstIcon className={`text-lg ${isAccordionCategory && isExpanded ? "text-blue-500" : "text-gray-500"} group-hover:opacity-0 transition-opacity`} />;
                      })()}
                      {/* Tooltip for collapsed category - appears on icon */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg px-2 py-1">
                        {group.category}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Category Items - Show only if expanded or not accordion category, or if sidebar is collapsed */}
                {(!isAccordionCategory || isExpanded || collapsed) && (
                  <div className={collapsed ? "" : "ml-2"}>
                    {accessibleItems.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.path);

                      return (
                        <div key={link.path} className="relative group">
                          <Link
                            to={link.path}
                            className={`
                              relative flex items-center mb-1 px-3 py-2.5 rounded-lg
                              transition-all duration-300
                              ${active
                                ? "bg-blue-100 text-blue-500 shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 hover:shadow-sm"
                              }
                              ${collapsed ? "justify-center" : ""}
                              hover:translate-x-1
                            `}
                          >
                            <Icon className={`text-lg ${active ? "text-blue-500" : "text-gray-500"} ${collapsed ? "group-hover:opacity-0 transition-opacity" : ""}`} />
                            {!collapsed && (
                              <span className="ml-3 text-sm font-medium">{link.title}</span>
                            )}
                            {/* Tooltip for collapsed state - appears on icon */}
                            {collapsed && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg px-2 py-1">
                                {link.title}
                              </div>
                            )}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* SETTINGS SECTION */}
        <div className="px-3 mb-4 border-t border-gray-100 pt-4 flex-shrink-0">
          <div className="relative group">
            <Link
              to="/dashboard/settings"
              className={`relative flex items-center px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 ${collapsed ? "justify-center" : ""}`}
            >
              <FaCog className={`text-lg text-gray-500 ${collapsed ? "group-hover:opacity-0 transition-opacity" : ""}`} />
              {!collapsed && <span className="ml-3 text-sm font-medium">Settings</span>}
              {/* Tooltip for collapsed state - appears on icon */}
              {collapsed && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg px-2 py-1">
                  Settings
                </div>
              )}
            </Link>
          </div>
          
          <div className="relative group">
            <button
              className={`relative flex items-center w-full px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 ${collapsed ? "justify-center" : ""}`}
            >
              <FaMoon className={`text-lg text-gray-500 ${collapsed ? "group-hover:opacity-0 transition-opacity" : ""}`} />
              {!collapsed && (
                <span className="ml-3 text-sm font-medium flex items-center justify-between w-full">
                  Dark mode
                  <div className="w-9 h-5 bg-gray-200 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                  </div>
                </span>
              )}
              {/* Tooltip for collapsed state - appears on icon */}
              {collapsed && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg px-2 py-1">
                  Dark mode
                </div>
              )}
            </button>
          </div>
        </div>

        {/* PROFILE SECTION */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <div className="relative group">
            <Link
              to="/dashboard/profile"
              className={`relative flex items-center p-2 rounded-lg hover:bg-gray-50 ${collapsed ? "justify-center" : ""}`}
            >
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm ${collapsed ? "group-hover:opacity-0 transition-opacity" : ""}`}>
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
              {/* Tooltip for collapsed state - appears on icon */}
              {collapsed && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg px-2 py-1">
                  {role || "User"} Profile
                </div>
              )}
            </Link>
          </div>

          {collapsed && (
            <div className="relative group mt-2">
              <button
                onClick={handleLogout}
                className="relative w-full p-2 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center"
                title="Logout"
              >
                <FaSignOutAlt className={`text-lg group-hover:opacity-0 transition-opacity`} />
              </button>
              {/* Tooltip for collapsed state - appears on icon */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg px-2 py-1">
                Logout
              </div>
            </div>
          )}
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 overflow-auto pt-20 lg:pt-0 bg-gray-50 relative transition-all duration-300`}>
        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed lg:hidden top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Toggle menu"
        >
          {isMobileMenuOpen ? <MdClose className="text-xl text-gray-700" /> : <MdMenu className="text-xl text-gray-700" />}
        </button>
        
        <div className="py-1 px-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
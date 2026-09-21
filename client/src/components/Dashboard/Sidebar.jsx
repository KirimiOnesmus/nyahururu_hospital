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
  FaHospital,
  FaTh,
  FaBoxes,
  FaTruck,
  FaImages,
  FaBullhorn,
  FaGavel,
  FaClipboardCheck,
} from "react-icons/fa";
import { MdMenu, MdClose } from "react-icons/md";
import { BiSolidDonateHeart } from "react-icons/bi";
import api from "../../api/axios";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");

  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!role) navigate("/hmis");
  }, [role, navigate]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navigationGroups = [
    {
      category: "Management",
      items: [
        {
          title: "Dashboard",
          path: "/dashboard",
          roles: ["superadmin", "admin", "it", "doctor", "communication", "research"],
          icon: FaTh,
        },
        {
          title: "Hospitals",
          path: "/dashboard/hospitals",
          roles: ["superadmin"],
          icon: FaHospital,
        },
        {
          title: "Appointments",
          path: "/dashboard/appointments",
          roles: ["superadmin", "doctor", "admin"],
          icon: FaCalendarAlt,
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
          roles: ["superadmin", "it", "admin", "research"],
          icon: FaFileAlt,
        },
        {
          title: "Feedback",
          path: "/dashboard/feedback",
          roles: ["superadmin", "communication", "it", "admin"],
          icon: FaComments,
        },
        {
          title: "Donations",
          path: "/dashboard/donations",
          roles: ["superadmin", "it", "admin"],
          icon: BiSolidDonateHeart,
        },
      ],
    },
    {
      category: "Users",
      items: [
        {
          title: "Users",
          path: "/dashboard/users",
          roles: ["superadmin", "admin", "it"],
          icon: FaUsers,
        },
      ],
    },
    {
      category: "Inventory & Logistics",
      items: [
        {
          title: "Inventory",
          path: "/dashboard/inventory",
          roles: ["admin", "it", "superadmin"],
          icon: FaBoxes,
        },
        {
          title: "Logistics",
          path: "/dashboard/logistics",
          roles: ["admin", "it", "superadmin"],
          icon: FaTruck,
        },
      ],
    },
    {
      category: "News & Media",
      items: [
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
          title: "Gallery",
          path: "/dashboard/gallery",
          roles: ["superadmin", "communication", "it", "admin"],
          icon: FaImages,
        },
      ],
    },
    {
      category: "Downloads & Resources",
      items: [
        { title: "Reports", path: "/dashboard/reports", roles: ["admin", "it"], icon: FaFileAlt },
      ],
    },
    {
      category: "Public Notice & Announcements",
      items: [
        {
          title: "Notices",
          path: "/dashboard/notices",
          roles: ["superadmin", "communication", "it", "admin", "research"],
          icon: FaBullhorn,
        },
        {
          title: "Tenders",
          path: "/dashboard/tenders",
          roles: ["superadmin", "communication", "it", "admin", "research"],
          icon: FaGavel,
        },
      ],
    },
    {
      category: "System",
      items: [
        {
          title: "Audit Logs",
          path: "/dashboard/audit-logs",
          roles: ["superadmin", "it"],
          icon: FaClipboardCheck,
        },
        {
          title: "Fraud Reports",
          path: "/dashboard/fraud",
          roles: ["superadmin", "it", "admin"],
          icon: FaExclamationTriangle,
        },
      ],
    },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors during logout
    }
    localStorage.removeItem("role");
    localStorage.removeItem("collection");
    localStorage.removeItem("token");
    localStorage.removeItem("researcher");
    navigate("/hmis");
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">N.C.R.H</h2>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg border border-gray-200 text-md cursor-pointer focus:outline-none "
        >
          {isMobileMenuOpen ? <MdClose /> : <MdMenu />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/75 bg-opacity-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

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

        {!collapsed && (
          <div className="px-6 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3">
          {navigationGroups.map((group, groupIndex) => {
            const accessibleItems = group.items.filter((item) => item.roles.includes(role));

            if (accessibleItems.length === 0) return null;

            return (
              <div key={groupIndex} className="mb-4">
                {!collapsed && (
                  <div className="px-3 mb-2 mt-4 first:mt-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {group.category}
                    </p>
                  </div>
                )}

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
                        ${active ? "bg-blue-100 text-blue-500" : "text-gray-600 hover:bg-gray-50"}
                        ${collapsed ? "justify-center" : ""}
                      `}
                      title={collapsed ? link.title : ""}
                    >
                      <Icon className={`text-lg ${active ? "text-blue-500" : "text-gray-500"}`} />
                      {!collapsed && <span className="ml-3 text-sm font-medium">{link.title}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>


        <div className="px-3 pt-3 ">
          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600
               hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <FaSignOutAlt className="text-base shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>


        <div className="p-3 mt-1">
          <Link
            to="/dashboard/profile"
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {role?.charAt(0).toUpperCase()}
            </div>

            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 capitalize truncate">
                    {role || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">Admin Manager</p>
                </div>
                <FaChevronDown className="text-xs text-gray-400 shrink-0" />
              </>
            )}
          </Link>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center
           justify-center transition-shadow hidden lg:flex cursor-pointer hover:shadow-md"
        >
          <FaChevronLeft
            className={`text-xs text-gray-600 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>

      <main className="flex-1 overflow-auto pt-20 lg:pt-0 bg-gray-50">
        <div className="py-1 px-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
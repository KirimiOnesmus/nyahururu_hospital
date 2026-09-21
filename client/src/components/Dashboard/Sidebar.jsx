import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  IconUsers,
  IconCalendar,
  IconNewspaper,
  IconCalendarDays,
  IconBriefcase,
  IconHospital,
  IconDocument,
  IconChat,
  IconWarning,
  IconLogout,
  IconChevronLeft,
  IconChevronDown,
  IconGrid,
  IconBox,
  IconAmbulance,
  IconPhoto,
  IconMegaphone,
  IconScale,
  IconClipboard,
  IconHeart,
  IconMenu,
  IconClose,
} from "../../common/icons";
import ThemeToggle from "../../common/components/ThemeToggle";
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
          icon: IconGrid,
        },
        {
          title: "Hospitals",
          path: "/dashboard/hospitals",
          roles: ["superadmin"],
          icon: IconHospital,
        },
        {
          title: "Appointments",
          path: "/dashboard/appointments",
          roles: ["superadmin", "doctor", "admin"],
          icon: IconCalendar,
        },
        {
          title: "Careers",
          path: "/dashboard/careers",
          roles: ["superadmin", "it", "admin"],
          icon: IconBriefcase,
        },
        {
          title: "Services",
          path: "/dashboard/services",
          roles: ["superadmin", "it", "admin"],
          icon: IconHospital,
        },
        {
          title: "Research",
          path: "/dashboard/research",
          roles: ["superadmin", "it", "admin", "research"],
          icon: IconDocument,
        },
        {
          title: "Feedback",
          path: "/dashboard/feedback",
          roles: ["superadmin", "communication", "it", "admin"],
          icon: IconChat,
        },
        {
          title: "Donations",
          path: "/dashboard/donations",
          roles: ["superadmin", "it", "admin"],
          icon: IconHeart,
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
          icon: IconUsers,
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
          icon: IconBox,
        },
        {
          title: "Logistics",
          path: "/dashboard/logistics",
          roles: ["admin", "it", "superadmin"],
          icon: IconAmbulance,
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
          icon: IconNewspaper,
        },
        {
          title: "Events",
          path: "/dashboard/events",
          roles: ["superadmin", "communication", "it", "admin"],
          icon: IconCalendarDays,
        },
        {
          title: "Gallery",
          path: "/dashboard/gallery",
          roles: ["superadmin", "communication", "it", "admin"],
          icon: IconPhoto,
        },
      ],
    },
    {
      category: "Downloads & Resources",
      items: [
        { title: "Reports", path: "/dashboard/reports", roles: ["admin", "it"], icon: IconDocument },
      ],
    },
    {
      category: "Public Notice & Announcements",
      items: [
        {
          title: "Notices",
          path: "/dashboard/notices",
          roles: ["superadmin", "communication", "it", "admin", "research"],
          icon: IconMegaphone,
        },
        {
          title: "Tenders",
          path: "/dashboard/tenders",
          roles: ["superadmin", "communication", "it", "admin", "research"],
          icon: IconScale,
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
          icon: IconClipboard,
        },
        {
          title: "Fraud Reports",
          path: "/dashboard/fraud",
          roles: ["superadmin", "it", "admin"],
          icon: IconWarning,
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
    <div className="flex h-screen bg-canvas overflow-hidden">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface border-b border-line px-4 h-16 flex justify-between items-center">
        <h2 className="text-lg font-bold text-ink">N.C.R.H</h2>
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl border border-line text-ink"
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <IconClose className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static z-40 h-full bg-surface border-r border-line
          flex flex-col transition-all duration-200
          ${collapsed ? "w-20" : "w-64"}
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-5 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NC</span>
              </div>
              <span className="font-bold text-ink text-lg">N.C.R.H</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">NC</span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          {navigationGroups.map((group, groupIndex) => {
            const accessibleItems = group.items.filter((item) => item.roles.includes(role));

            if (accessibleItems.length === 0) return null;

            return (
              <div key={groupIndex} className="mb-4">
                {!collapsed && (
                  <div className="px-3 mb-2 mt-4 first:mt-0">
                    <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
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
                        flex items-center mb-1 px-3 min-h-11 rounded-xl
                        transition-colors
                        ${active ? "bg-primary-soft text-primary" : "text-ink-muted hover:bg-canvas hover:text-ink"}
                        ${collapsed ? "justify-center" : ""}
                      `}
                      title={collapsed ? link.title : ""}
                    >
                      <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} aria-hidden="true" />
                      {!collapsed && <span className="ml-3 text-sm font-medium">{link.title}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="px-3 pt-3 space-y-1">
          {!collapsed && <ThemeToggle />}
          {collapsed && <ThemeToggle compact className="mx-auto" />}
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className={`w-full flex items-center gap-3 px-3 min-h-11 rounded-xl text-sm font-medium text-ink-muted
               hover:bg-red-50 hover:text-danger transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <IconLogout className="w-5 h-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>

        <div className="p-3 mt-1">
          <Link
            to="/dashboard/profile"
            className={`flex items-center gap-3 p-2 min-h-11 rounded-xl hover:bg-canvas transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {role?.charAt(0).toUpperCase()}
            </div>

            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink capitalize truncate">
                    {role || "User"}
                  </p>
                  <p className="text-xs text-ink-muted truncate">Open profile</p>
                </div>
                <IconChevronDown className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
              </>
            )}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-8 h-8 bg-surface border border-line rounded-full hidden lg:flex items-center justify-center hover:shadow-md"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <IconChevronLeft
            className={`w-4 h-4 text-ink transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>

      <main className="flex-1 overflow-auto pt-16 lg:pt-0 bg-canvas">
        <div className="py-4 px-4 lg:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Sidebar;

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
  FaHospital,
  FaTh,
  FaBoxes,
  FaTruck,
  FaImages,
  FaBullhorn,
  FaGavel,
  FaClipboardCheck,
} from "react-icons/fa";
import { BiSolidDonateHeart } from "react-icons/bi";

// Single source of truth for which staff roles can see/access each
// /dashboard/* route. Sidebar.jsx uses this to decide what to render;
// RequireRole (src/components/auth/RequireRole.jsx) uses the same list to
// guard the route itself, so the nav and the guard can never drift apart.
export const DASHBOARD_NAV = [
  {
    category: "Management",
    items: [
      {
        title: "Dashboard",
        path: "/dashboard",
        roles: ["superadmin", "admin", "it", "doctor", "communication", "research"],
        icon: FaTh,
      },
      { title: "Hospitals", path: "/dashboard/hospitals", roles: ["superadmin"], icon: FaHospital },
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
        roles: ["superadmin"],
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

// Routes that exist but aren't part of the visible nav (edit sub-pages etc.)
// still need a roles entry so RequireRole can guard them.
export const EXTRA_DASHBOARD_ROUTE_ROLES = {
  "/dashboard/users/edit/:id": ["superadmin", "admin", "it"],
  "/dashboard/profile": ["superadmin", "admin", "it", "doctor", "communication", "research"],
};

export const getDashboardRoles = (path) => {
  for (const group of DASHBOARD_NAV) {
    const match = group.items.find((item) => item.path === path);
    if (match) return match.roles;
  }
  return EXTRA_DASHBOARD_ROUTE_ROLES[path] || null;
};

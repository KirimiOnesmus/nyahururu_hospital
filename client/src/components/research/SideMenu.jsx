import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaFlask, FaTachometerAlt, FaFileAlt, FaWallet, FaCertificate,
  FaUserCircle, FaInbox, FaHistory, FaCheckDouble, FaBookOpen,
  FaSignOutAlt, FaBars, FaTimes, FaQuestionCircle,
} from "react-icons/fa";

const ROLE_CONFIG = {
  researcher: {
    label: "Researcher",
    nav: ["dashboard", "submissions", "payments", "certificates", "profile"],
  },
  reviewer: {
    label: "Reviewer",
    nav: ["dashboard", "review-queue", "review-history", "profile"],
  },
  committee: {
    label: "Research Committee",
    nav: ["dashboard", "final-approvals", "all-research", "profile"],
  },
};

const ROLE_ALIAS = {
  research_committee: "committee",
  committee: "committee",
  reviewer: "reviewer",
  researcher: "researcher",
};


const navLinkCls = ({ isActive }) =>
  `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
   transition-colors cursor-pointer
   ${isActive
     ? "bg-blue-50 text-blue-700"
     : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`;

const SidebarContent = ({ role, user, onLogout, onNavigate }) => {

  const NAV_ITEMS = {
    dashboard:         { to: `/research/dashboard/${role}`,         label: "Dashboard",      icon: FaTachometerAlt },
    submissions:       { to: "/research/dashboard/submissions",     label: "My Submissions", icon: FaFileAlt },
    payments:          { to: "/research/dashboard/payments",        label: "Payments",       icon: FaWallet },
    certificates:      { to: "/research/dashboard/certificates",    label: "Certificates",   icon: FaCertificate },
    "review-queue":    { to: "/research/dashboard/review-queue",    label: "Review Queue",   icon: FaInbox },
    "review-history":  { to: "/research/dashboard/review-history",  label: "Review History", icon: FaHistory },
    "final-approvals": { to: "/research/dashboard/final-approvals", label: "Final Approvals",icon: FaCheckDouble },
    "all-research":    { to: "/research/dashboard/all-research",    label: "All Research",   icon: FaBookOpen },
  };

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.researcher;
  const items = config.nav.map((key) => NAV_ITEMS[key]).filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <FaFlask className="text-white text-base" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-tight truncate">
            Nyahururu Hospital
          </p>
          <p className="text-xs text-slate-400 leading-tight">Research Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkCls} onClick={onNavigate} end>
            <Icon className="text-base shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3 space-y-1">
        <NavLink to="/research/dashboard/profile" className={navLinkCls} onClick={onNavigate}>
          <FaUserCircle className="text-base shrink-0 text-slate-400" />
          <span className="flex-1 min-w-0 text-left">
            <span className="block truncate text-slate-800">
              {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "My Profile"}
            </span>
            <span className="block text-[11px] font-medium text-slate-400 truncate">
              {config.label}
            </span>
          </span>
        </NavLink>

        
         <a href="/help"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
            text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <FaQuestionCircle className="text-base shrink-0" />
          Help Center
        </a>

        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
            text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <FaSignOutAlt className="text-base shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
};

const SideMenu = ({ user }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const rawRole = (localStorage.getItem("role") || "researcher").toLowerCase();
  const normalizedRole = ROLE_ALIAS[rawRole] || "researcher";

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = () => {
    ["token", "role", "collection", "researcher", "researcher_token"].forEach(
      (k) => localStorage.removeItem(k)
    );
    navigate("/hmis");
    toast.success("Logged out successfully");
  };

  return (
    <>
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-100
        flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <FaFlask className="text-white text-sm" />
          </div>
          <span className="font-bold text-slate-900 text-sm">Research Portal</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800
            transition-colors cursor-pointer"
        >
          <FaBars className="text-lg" />
        </button>
      </div>

      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64
        bg-white border-r border-slate-100 z-30">
        <SidebarContent role={normalizedRole} user={user} onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-xl flex flex-col">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400
                hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <FaTimes className="text-base" />
            </button>
            <SidebarContent
              role={normalizedRole}
              user={user}
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SideMenu;
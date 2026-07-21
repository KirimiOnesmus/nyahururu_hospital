import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUserRole, isAuthenticated } from "../../api/auth";

/**
 * Wraps a single route's element and checks the logged-in user's role
 * against an allow-list before rendering its children.
 *
 * FH1 (security review): previously Sidebar.jsx only checked "is there a
 * token at all" — any authenticated staff role could load the React
 * component tree for every /dashboard/* and /research/dashboard/* route,
 * relying entirely on the backend to reject the underlying API calls.
 * This adds a client-side fail-closed check that mirrors each route's
 * backend authorizeRoles(...) list (see src/config/dashboardRoles.js),
 * so the UI itself refuses to render for the wrong role instead of
 * quietly leaking a partial/broken screen.
 *
 * Usage:
 *   <Route
 *     path="/dashboard/users"
 *     element={
 *       <RequireRole roles={getDashboardRoles("/dashboard/users")}>
 *         <Users />
 *       </RequireRole>
 *     }
 *   />
 */
const RequireRole = ({ roles, children, loginPath = "/hmis", deniedPath }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  const role = getUserRole();
  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
    if (deniedPath) {
      return <Navigate to={deniedPath} replace />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md text-center bg-white border border-slate-200 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Not authorized</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Your account role doesn't have access to this section. If you believe this is a mistake,
            contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireRole;

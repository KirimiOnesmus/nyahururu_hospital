import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUserRole, isAuthenticated } from "../../api/auth";


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

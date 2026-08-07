import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUserRole, isAuthenticated, isResearcher } from "../../api/auth";


const RequireRole = ({ roles, children, loginPath = "/hmis", deniedPath }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (isResearcher()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md text-center bg-white border border-slate-200 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Wrong portal</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            You are signed in as a researcher. The staff dashboard is not available for researcher accounts.
          </p>
          <a
            href="/research/dashboard"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            Go to Research Dashboard
          </a>
        </div>
      </div>
    );
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
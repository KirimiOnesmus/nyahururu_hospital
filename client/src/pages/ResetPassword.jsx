import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import notify from "../common/utils/notify";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaShieldAlt,
  FaExclamationTriangle,
} from "react-icons/fa";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character (@$!%*?&)", test: (v) => /[@$!%*?&]/.test(v) },
];

const inputClass =
  "w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 " +
  "outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors " +
  "placeholder:text-slate-400";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");


  const isResearcher = !userId && !!email;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    if (!token || (!userId && !email)) {
      setInvalidLink(true);
    }
  }, [token, userId, email]);

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canSubmit = allRulesPass && passwordsMatch && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      if (isResearcher) {
        await api.post("/researchers/reset-password", {
          token,
          email,
          password: newPassword,
          confirmPassword,
        });
      } else {
        await api.post("/users/reset-password", {
          token,
          userId,
          newPassword,
        });
      }
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Password reset failed. The link may have expired.";
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Invalid / missing token state
  if (invalidLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200">
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 mx-auto flex items-center justify-center">
              <FaExclamationTriangle className="text-2xl text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Invalid Reset Link</h2>
            <p className="text-sm text-slate-500">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate("/forgot-password")}
                className="w-full px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold
                           transition-colors cursor-pointer"
              >
                Request New Link
              </button>
              <button
                onClick={() => navigate("/hmis")}
                className="w-full px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium
                           hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <FaArrowLeft className="text-xs" />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-200">

          <div className="px-8 pt-8 pb-6 text-center border-b border-slate-200">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 mx-auto mb-4 flex items-center justify-center">
              <FaShieldAlt className="text-2xl text-blue-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {success ? "Password Reset!" : "Set New Password"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {success
                ? "Your password has been updated successfully."
                : "Create a strong new password for your account."}
            </p>
          </div>

          <div className="p-8">
            {success ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center">
                  <FaCheckCircle className="text-3xl text-emerald-500" />
                </div>
                <p className="text-sm text-slate-600">
                  You can now log in with your new password.
                </p>
                <button
                  onClick={() => navigate("/hmis")}
                  className="w-full px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold
                             transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1 block">
                    New Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      type={showNew ? "text" : "password"}
                      className={inputClass}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNew ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Password rules */}
                {newPassword && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                    {PASSWORD_RULES.map((rule, i) => {
                      const pass = rule.test(newPassword);
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {pass ? (
                            <FaCheckCircle className="text-emerald-500 shrink-0" />
                          ) : (
                            <FaTimesCircle className="text-slate-300 shrink-0" />
                          )}
                          <span className={pass ? "text-emerald-700 font-medium" : "text-slate-400"}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}


                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={inputClass}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold
                               transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Resetting…
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>


          {!success && (
            <div className="px-8 pb-8 text-center border-t border-slate-200 pt-5">
              <button
                onClick={() => navigate("/hmis")}
                className="text-sm font-semibold text-blue-700 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <FaArrowLeft className="text-xs" />
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

import React, { useState } from "react";
import api from "../../api/axios";
import notify from "../../common/utils/notify";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
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

const ChangePasswordModal = ({ open, currentPassword, onSuccess, onLogout }) => {
  const [oldPassword, setOldPassword] = useState(currentPassword || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canSubmit = oldPassword && allRulesPass && passwordsMatch && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      await api.post("/profile/change-password", {
        currentPassword: oldPassword,
        newPassword,
      });
      notify.success("Password changed successfully! Redirecting…");
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to change password";
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("role");
    localStorage.removeItem("collection");
    onLogout?.();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 mx-auto mb-3 flex items-center justify-center">
            <FaShieldAlt className="text-2xl text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Change Your Password</h2>
          <p className="text-sm text-slate-500 mt-1">
            Your account is using a temporary password. Please set a new one to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current password */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1 block">
              Current Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type={showOld ? "text" : "password"}
                className={inputClass}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowOld((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showOld ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* New password */}
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

          {/* Password strength rules */}
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

          {/* Confirm password */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1 block">
              Confirm New Password
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

          {/* Actions */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Updating…
                </>
              ) : (
                "Set New Password"
              )}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium
                         hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Log Out Instead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

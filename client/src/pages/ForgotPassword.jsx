import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import notify from "../common/utils/notify";
import {
  FaEnvelope,
  FaArrowLeft,
  FaSpinner,
  FaPaperPlane,
  FaCheckCircle,
  FaLock,
} from "react-icons/fa";

const inputClass =
  "w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 " +
  "outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors " +
  "placeholder:text-slate-400";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


  const isResearcher = searchParams.get("type") === "researcher";
  const endpoint = isResearcher
    ? "/researchers/forgot-password"
    : "/users/forgot-password";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      notify.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post(endpoint, { email: email.trim() });
      setSent(true);
    } catch (err) {

      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-200">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-slate-200">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 mx-auto mb-4 flex items-center justify-center">
              <FaLock className="text-2xl text-blue-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {sent ? "Check Your Email" : "Forgot Password"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {sent
                ? "We've sent you a password reset link if the email matches an account."
                : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          <div className="p-8">
            {sent ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center">
                  <FaCheckCircle className="text-3xl text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    A reset link has been sent to <span className="font-semibold text-slate-800">{email}</span>.
                  </p>
                  <p className="text-xs text-slate-400">
                    Didn't receive it? Check your spam folder, or try again in a few minutes.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="w-full px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium
                               hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Try Another Email
                  </button>
                  <button
                    onClick={() => navigate("/hmis")}
                    className="w-full px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold
                               transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FaArrowLeft className="text-xs" />
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-xs font-semibold uppercase tracking-widest text-slate-500"
                    htmlFor="reset-email"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      className={inputClass}
                      type="email"
                      id="reset-email"
                      value={email}
                      placeholder="Enter your registered email"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold
                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="text-xs" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

    
          {!sent && (
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

export default ForgotPassword;

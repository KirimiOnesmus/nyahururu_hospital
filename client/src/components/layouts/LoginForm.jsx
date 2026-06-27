import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  loginUser,
  loginResearcher,
  verifyResearcherEmail,
} from "../../api/auth";
import { toast } from "react-toastify";
import { FaUserMd, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";

const STAFF_ROLES = [
  "superadmin",
  "admin",
  "it",
  "communication",
  "doctor",
  "staff",
  "research",
];


const RESEARCHER_REGISTER_PATH = "/research/register";
const SUPPORT_EMAIL = "onesmuskirimi64@gmail.com";

const inputClass =
  "w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 " +
  "outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 fo transition-colors " +
  "placeholder:text-slate-400 cursor-pointer";

const primaryButtonClass =
  "w-full px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold cursor-pointer" +
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

const ghostLinkClass =
  "text-sm font-semibold text-blue-700 hover:underline transition-colors cursor-pointer";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loginType, setLoginType] = useState("staff");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const isVerifying = searchParams.get("verify");
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (isVerifying && token && emailParam) {
      handleEmailVerification(token, emailParam);
    }
   
  }, [searchParams]);

  const handleEmailVerification = async (token, emailParam) => {
    setVerifying(true);
    try {
      const response = await verifyResearcherEmail(token, emailParam);

      if (response) {
        toast.success("Email verified successfully! You can now log in.");
        setEmail(emailParam);
        setLoginType("researcher");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Verification link is invalid or expired";
      toast.error(errorMsg);
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setVerifying(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      if (loginType === "staff") {
        const data = await loginUser(email, password);

        if (data?.user?.role && STAFF_ROLES.includes(data.user.role)) {
          localStorage.setItem("role", data.user.role);
          localStorage.setItem("collection", "users");
          toast.success("Logged in successfully!");
          navigate("/dashboard");
        } else {
          toast.error("Login failed. Please check your credentials.");
        }
      } else {
        const data = await loginResearcher(email, password);

        const ROLE_ALIAS = {
          research_committee: "committee",
          reviewer: "reviewer",
          researcher: "researcher",
        };
        const normalizedRole = ROLE_ALIAS[data?.researcher?.role] || "researcher";
        localStorage.setItem("role", normalizedRole);
        localStorage.setItem("collection", "researchers");

        toast.success("Logged in successfully!");
        navigate(`/research/dashboard/${normalizedRole}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

 
  const handleSecondaryAction = () => {
    if (loginType === "researcher") {
      navigate(RESEARCHER_REGISTER_PATH);
    } else {
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        "New staff account request"
      )}`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-200">
  
          <div className="px-8 pt-8 pb-6 text-center border-b border-slate-200">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 mx-auto mb-4 flex items-center justify-center">
              <FaUserMd className="text-2xl text-blue-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to access your dashboard</p>
          </div>

          <div className="p-8 space-y-6">
            {verifying && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <FaSpinner className="animate-spin text-blue-700 shrink-0" />
                <span className="text-sm font-semibold text-blue-800">Verifying your email...</span>
              </div>
            )}

           
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setLoginType("staff")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  loginType === "staff"
                    ? "bg-blue-700 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                Hospital Portal
              </button>
              <button
                type="button"
                onClick={() => setLoginType("researcher")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  loginType === "researcher"
                    ? "bg-blue-700 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                Research Portal
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    className={inputClass}
                    type="email"
                    id="email"
                    value={email}
                    placeholder="Enter your email"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    className={`${inputClass} pr-10`}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600/20"
                  />
                  <span className="text-slate-600">Remember me</span>
                </label>
                <button type="button" className={ghostLinkClass} onClick={() => navigate("/forgot-password")}>
                  Forgot password?
                </button>
              </div>

              <button className={primaryButtonClass} type="submit" disabled={loading || verifying}>
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  `Sign In as ${loginType === "staff" ? "Staff" : "Researcher / Reviewer / Committee"}`
                )}
              </button>
            </form>
          </div>

          <div className="px-8 pb-8 text-center border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <button type="button" onClick={handleSecondaryAction} className={ghostLinkClass}>
                {loginType === "staff" ? "Contact Administrator" : "Register as Researcher"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
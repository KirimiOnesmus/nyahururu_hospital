import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  loginUser,
  loginResearcher,
  verifyResearcherEmail,
} from "../../api/auth";
import notify from "../../common/utils/notify";
import ChangePasswordModal from "../../components/modals/ChangePasswordModal";
import { joinRole } from "../../api/socket";
import { IconUser, IconMail, IconLock, IconEye, IconEyeOff } from "../icons";
import ThemeToggle from "../components/ThemeToggle";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

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

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loginType, setLoginType] = useState("staff");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
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
        notify.success("Email verified successfully! You can now log in.");
        setEmail(emailParam);
        setLoginType("researcher");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "This verification link is invalid or has expired.";
      notify.error(errorMsg);
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setVerifying(false);
    }
  };

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Enter the email you use for this portal.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address, like name@hospital.go.ke.";
    if (!password) next.password = "Enter your password to continue.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (loginType === "staff") {
        const data = await loginUser(email, password);

        if (data?.user?.role && STAFF_ROLES.includes(data.user.role)) {
          localStorage.setItem("role", data.user.role);
          localStorage.setItem("collection", "users");
          joinRole(data.user.role);

          if (data.mustChangePassword) {
            setTempPassword(password);
            setShowChangePassword(true);
            setLoading(false);
            return;
          }

          notify.success("You're signed in.");
          navigate("/dashboard");
        } else {
          notify.error("We couldn't sign you in. Check your email and password.");
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

        joinRole(normalizedRole);
        notify.success("You're signed in.");
        navigate(`/research/dashboard/${normalizedRole}`);
      }
    } catch (err) {
      notify.error(err.message || err.response?.data?.message || "We couldn't sign you in. Try again.");
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

  const handlePasswordChanged = () => {
    setShowChangePassword(false);
    setTempPassword("");
    notify.success("Password updated. Taking you to the dashboard…");
    setTimeout(() => navigate("/dashboard"), 600);
  };

  const handlePasswordLogout = () => {
    setShowChangePassword(false);
    setTempPassword("");
    localStorage.removeItem("role");
    localStorage.removeItem("collection");
    notify.info("You've been logged out.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle compact />
      </div>
      <div className="w-full max-w-lg">
        <div className="bg-surface rounded-2xl border border-line shadow-md">
          <div className="px-8 pt-8 pb-6 text-center border-b border-line">
            <div className="w-14 h-14 rounded-full bg-primary-soft mx-auto mb-4 flex items-center justify-center">
              <IconUser className="w-7 h-7 text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Welcome back</h1>
            <p className="text-sm text-ink-muted mt-1">Sign in to open your dashboard</p>
          </div>

          <div className="p-8 space-y-6">
            {verifying && (
              <Alert variant="info">Verifying your email…</Alert>
            )}

            <div className="flex rounded-xl border border-line overflow-hidden">
              <button
                type="button"
                onClick={() => setLoginType("staff")}
                className={`flex-1 min-h-11 py-2.5 text-sm font-semibold transition-colors ${
                  loginType === "staff"
                    ? "bg-primary text-white"
                    : "bg-surface text-ink-muted hover:bg-canvas"
                }`}
              >
                Hospital Portal
              </button>
              <button
                type="button"
                onClick={() => setLoginType("researcher")}
                className={`flex-1 min-h-11 py-2.5 text-sm font-semibold transition-colors ${
                  loginType === "researcher"
                    ? "bg-primary text-white"
                    : "bg-surface text-ink-muted hover:bg-canvas"
                }`}
              >
                Research Portal
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                placeholder="name@hospital.go.ke"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                error={fieldErrors.email}
                icon={IconMail}
                required
              />

              <Input
                label="Password"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                placeholder="Your password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                error={fieldErrors.password}
                icon={IconLock}
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="min-w-11 min-h-11 inline-flex items-center justify-center text-ink-muted hover:text-ink"
                  >
                    {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                }
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 min-h-11 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-line text-primary focus:ring-primary/30"
                  />
                  <span className="text-ink-muted">Remember me</span>
                </label>
                <button
                  type="button"
                  className="min-h-11 text-sm font-semibold text-primary hover:underline"
                  onClick={() =>
                    navigate(
                      loginType === "researcher"
                        ? "/forgot-password?type=researcher"
                        : "/forgot-password"
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                loadingText="Signing in…"
                disabled={verifying}
              >
                {loginType === "staff" ? "Sign in as staff" : "Sign in to research"}
              </Button>
            </form>
          </div>

          <div className="px-8 pb-8 text-center border-t border-line pt-5">
            <p className="text-sm text-ink-muted">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={handleSecondaryAction}
                className="font-semibold text-primary hover:underline"
              >
                {loginType === "staff" ? "Contact an administrator" : "Create a researcher account"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        open={showChangePassword}
        currentPassword={tempPassword}
        onSuccess={handlePasswordChanged}
        onLogout={handlePasswordLogout}
      />
    </div>
  );
};

export default LoginForm;

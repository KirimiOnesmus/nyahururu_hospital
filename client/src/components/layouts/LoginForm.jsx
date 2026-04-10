import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginUser, loginResearcher, verifyResearcherEmail } from "../../api/auth";
import { toast } from "react-toastify";

const STAFF_ROLES = ["superadmin", "admin", "it", "communication", "doctor", "staff","research"];

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
      const errorMsg = err.response?.data?.message || err.message || "Verification link is invalid or expired";
      toast.error(errorMsg);
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setVerifying(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (loginType === "staff") {
        const data = await loginUser(email, password);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("collection", "users");

        if (STAFF_ROLES.includes(data.user.role)) {
          toast.success("Logged in successfully!");
          navigate("/dashboard");
        } else {
          toast.error("Login failed. Please check your credentials.");
        }
      } else {
        
        const data = await loginResearcher(email, password);
        toast.success("Logged in successfully!");

       
        if (["researcher", "reviewer"].includes(data.researcher.role)) {
          navigate("/research/dashboard");           
        } else {
          navigate("/research/dashboard");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

     
          <div className="bg-blue-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-blue-100">Sign in to access your dashboard</p>
          </div>

          <div className="p-8 space-y-6">

           
            {verifying && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-blue-700 font-medium">Verifying your email...</span>
              </div>
            )}

           
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setLoginType("staff")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer duration-200 ${
                  loginType === "staff"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                Hospital Staff
              </button>
              <button
                type="button"
                onClick={() => setLoginType("researcher")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer duration-200 ${
                  loginType === "researcher"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                Researcher / Reviewer
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

            
              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-sm" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring
                     focus:ring-blue-500 focus:border-transparent transition duration-200"
                    type="email"
                    id="email"
                    value={email}
                    placeholder="Enter your email"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-sm" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg outline-none focus:ring
                     focus:ring-blue-500 focus:border-transparent transition duration-200"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex cursor-pointer 
                    items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

             
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <span className="ml-2 text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">Forgot password?</a>
              </div>

             
              <button
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700
                 transform hover:scale-[1.02] transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 
                 cursor-pointer disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                type="submit"
                disabled={loading || verifying}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  `Sign In as ${loginType === "staff" ? "Staff" : "Researcher / Reviewer"}`
                )}
              </button>
            </form>
          </div>

          <div className="px-8 pb-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <span className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">
                {loginType === "staff" ? "Contact Administrator" : "Register as Researcher"}
              </span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;
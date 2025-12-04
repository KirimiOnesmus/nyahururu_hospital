import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/auth";
import {toast} from "react-toastify"

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser( email, password );
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("token", data.token);
      if (
        ["superadmin","admin", "it", "communication", "doctor", "staff"].includes(
          data.user.role
        )
      ) {
        navigate("/dashboard");
        toast.success("Logged In Successfully!");
      } else {
        // alert("Login failed. Please check your credentials.");
        toast.error("Login failed. Please check your credentials.")
      }
    } catch (err) {
      console.error(err.response?.data?.message || "Login failed");
      toast.error("Login failed")
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              className="block text-gray-700 mb-2 font-semibold"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:ring-1 focus:border-none"
              type="email"
              id="email"
              value={email}
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 mb-2 font-semibold"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:ring-1 focus:border-none"
              type="password"
              id="password"
              value={password}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 hover:cursor-pointer transition duration-200"
            type="submit"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

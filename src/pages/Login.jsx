import { useState, useContext, useEffect, useRef } from "react";
import { loginUser } from "../api/authAPI";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaSignInAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);
  const [checking, setChecking] = useState(true);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const prevStatusRef = useRef(null);

  const checkBackendStatus = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL_HEALTH;
      const res = await axios.get(baseUrl);

      const isOnline =
        res.status === 200 && res.data.includes("API is running");

      if (prevStatusRef.current !== isOnline) {
        if (isOnline) toast.success("Backend connected.");
        else if (prevStatusRef.current !== null)
          toast.error("Backend disconnected.");
      }

      prevStatusRef.current = isOnline;
      setBackendOnline(isOnline);
    } catch (error) {
      const wasOnline = prevStatusRef.current;
      if (wasOnline !== false) {
        toast.error(`Backend disconnected: ${error.message || error}`);
      }
      prevStatusRef.current = false;
      setBackendOnline(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginUser(form);
      toast.success("Logged in successfully.");
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("sessionExpires", res.data.sessionExpires);
      localStorage.setItem("username", res.data.username);
      setUser(res.data);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center flex-col justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">OTFlow</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <FaSignInAlt className="text-sm" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Backend Status */}
      <motion.div className="flex justify-center items-center mt-10">
        {checking ? (
          <>
            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-gray-600 text-sm">Trying to connect...</span>
          </>
        ) : backendOnline ? (
          <>
            <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
            <span className="text-sm text-green-600">Connected to backend</span>
          </>
        ) : (
          <>
            <span className="h-3 w-3 bg-red-500 rounded-full mr-2"></span>
            <span className="text-sm text-red-600">Backend offline</span>
          </>
        )}
      </motion.div>
    </div>
  );
}

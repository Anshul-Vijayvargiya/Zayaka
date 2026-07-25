import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize Google OAuth Button if GOOGLE_CLIENT_ID is set
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            setLoading(true);
            const res = await googleLogin(response.credential);
            redirectByRole(res.user.role);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, []);

  const redirectByRole = (role) => {
    if (role === "kitchen") {
      navigate("/app/kitchen");
    } else if (["owner", "staff"].includes(role)) {
      navigate("/app/orders");
    } else {
      navigate("/r/zayka-demo?table=4");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      redirectByRole(data.user.role);
    } catch (err) {
      if (err.message === "unverified" || err.response?.data?.error === "unverified") {
        navigate("/verify-otp", { state: { email: email.toLowerCase() } });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setError("");
    setLoading(true);
    try {
      const data = await login(demoEmail, "Password@123");
      redirectByRole(data.user.role);
    } catch {
      setError("Demo login failed. Did you run the seed?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-paper-card p-8 rounded-3xl border border-paper-border shadow-xl">
          <div className="text-center mb-8">
            <h1 className="font-heading font-extrabold text-2xl text-ink">
              Welcome Back to Zayka
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Sign in to manage your restaurant or track orders
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* One-tap Demo Logins for Judges */}
          <div className="mb-6 p-3.5 bg-saffron-pale rounded-2xl border border-saffron/20 space-y-2">
            <span className="text-xs font-bold text-saffron font-heading block text-center">
              ⚡ Trying the demo? One tap:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("owner@zayka.app")}
                className="py-2 px-2 rounded-xl bg-white text-ink border border-saffron/30 font-heading font-bold text-xs hover:bg-saffron hover:text-white transition-all shadow-sm"
              >
                👑 Owner
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("staff@zayka.app")}
                className="py-2 px-2 rounded-xl bg-white text-ink border border-saffron/30 font-heading font-bold text-xs hover:bg-saffron hover:text-white transition-all shadow-sm"
              >
                🤵 Staff
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("kitchen@zayka.app")}
                className="py-2 px-2 rounded-xl bg-white text-ink border border-saffron/30 font-heading font-bold text-xs hover:bg-saffron hover:text-white transition-all shadow-sm"
              >
                👨‍🍳 Kitchen
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-ink-muted absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@zayka.app"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-paper-border bg-paper focus:outline-none focus:ring-2 focus:ring-saffron focus:border-transparent text-sm text-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-ink-muted absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-paper-border bg-paper focus:outline-none focus:ring-2 focus:ring-saffron focus:border-transparent text-sm text-ink"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-saffron hover:bg-saffron-hover text-white font-heading font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <>
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-paper-border" />
                <span className="text-xs text-ink-muted">OR</span>
                <div className="flex-1 h-px bg-paper-border" />
              </div>

              <div id="googleBtn" className="w-full" />
            </>
          )}

          <div className="mt-6 text-center text-xs text-ink-muted">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-saffron hover:underline">
              Create Restaurant SaaS Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { User, Mail, Lock, Store, ArrowRight, AlertCircle } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("owner"); // Default owner for SaaS signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await register({
        name,
        email,
        password,
        role,
        restaurantName: role === "owner" ? restaurantName : undefined,
      });
      navigate("/verify-otp", { state: { email: res.email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md bg-paper-card p-8 rounded-3xl border border-paper-border shadow-xl">
          <div className="text-center mb-6">
            <h1 className="font-heading font-extrabold text-2xl text-ink">
              Create Your Zayka Account
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Self-serve onboarding for restaurant owners & diners
            </p>
          </div>

          {/* Account Type Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-paper border border-paper-border mb-6">
            <button
              type="button"
              onClick={() => setRole("owner")}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                role === "owner"
                  ? "bg-saffron text-white shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Restaurant Owner
            </button>
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                role === "customer"
                  ? "bg-saffron text-white shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Diner / Customer
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {role === "owner" && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Restaurant Name
                </label>
                <div className="relative">
                  <Store className="w-5 h-5 text-ink-muted absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="e.g. Spice Symphony Kitchen"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-paper-border bg-paper focus:outline-none focus:ring-2 focus:ring-saffron text-sm text-ink"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-ink-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anshul Sharma"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-paper-border bg-paper focus:outline-none focus:ring-2 focus:ring-saffron text-sm text-ink"
                />
              </div>
            </div>

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
                  placeholder="owner@yourrestaurant.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-paper-border bg-paper focus:outline-none focus:ring-2 focus:ring-saffron text-sm text-ink"
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-paper-border bg-paper focus:outline-none focus:ring-2 focus:ring-saffron text-sm text-ink"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-saffron hover:bg-saffron-hover text-white font-heading font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Continue to Verification"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-ink-muted">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-saffron hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

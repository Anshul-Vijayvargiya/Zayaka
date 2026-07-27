import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { KeyRound, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const [email] = useState(location.state?.email || "");
  const from = location.state?.from;
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Missing email address. Please register again.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const data = await verifyOtp(email, code);
      const role = data.user.role;
      // The page that sent the customer here always wins over role-based routing.
      if (from) navigate(from, { replace: true });
      else if (role === "kitchen") navigate("/app/kitchen");
      else if (["owner", "staff"].includes(role)) navigate("/app/orders");
      else navigate("/r/spice-route?table=4");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError("");
    setInfo("");
    try {
      await resendOtp(email);
      setInfo("A new verification code has been sent!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-paper-card p-8 rounded-3xl border border-paper-border shadow-xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-saffron-pale text-saffron flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>

          <h1 className="font-heading font-extrabold text-2xl text-ink mb-1">
            Verify Your Email
          </h1>
          <p className="text-sm text-ink-muted mb-6">
            Enter the 6-digit OTP code sent to{" "}
            <span className="font-semibold text-ink">{email || "your email"}</span>
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3 text-left">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm text-left">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                placeholder="123456"
                className="w-full text-center text-3xl tracking-widest font-heading font-bold py-3.5 rounded-2xl border border-paper-border bg-paper focus:outline-none focus:ring-2 focus:ring-saffron text-ink"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3.5 rounded-xl bg-saffron hover:bg-saffron-hover text-white font-heading font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-muted">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              className="font-semibold text-saffron hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Resend Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

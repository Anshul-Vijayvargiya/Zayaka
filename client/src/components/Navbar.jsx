import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UtensilsCrossed, LayoutDashboard, LogOut, User as UserIcon, Sparkles } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-paper-card border-b border-paper-border sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center font-heading font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
            Z
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl text-ink tracking-tight">
              Zayka
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-saffron-pale text-saffron">
              Dine-in OS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/r/zayka-demo?table=4"
            className="text-xs sm:text-sm font-semibold text-ink hover:text-saffron transition-colors px-3 py-1.5 rounded-xl hover:bg-paper-border/50 flex items-center gap-1.5"
          >
            <UtensilsCrossed className="w-4 h-4 text-saffron" />
            <span>Demo Customer Menu</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              {["owner", "staff", "kitchen"].includes(user.role) ? (
                <Link
                  to={user.role === "kitchen" ? "/app/kitchen" : "/app/orders"}
                  className="bg-ink text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-ink-light transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4 text-saffron" />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <span className="text-xs font-medium text-ink-muted bg-paper px-3 py-1.5 rounded-xl flex items-center gap-1 border border-paper-border">
                  <UserIcon className="w-3.5 h-3.5" />
                  {user.name}
                </span>
              )}
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="p-2 text-ink-muted hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-ink px-3 py-1.5 rounded-xl hover:bg-paper-border/50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-saffron text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-saffron-hover transition-all shadow-sm flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start SaaS Free</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

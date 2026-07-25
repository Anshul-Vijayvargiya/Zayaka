import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import {
  LayoutDashboard,
  ChefHat,
  UtensilsCrossed,
  QrCode,
  Users,
  Package,
  UserCheck,
  TrendingUp,
  Sparkles,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const isOwner = user?.role === "owner";
  const isKitchen = user?.role === "kitchen";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/app/orders", label: "Live Orders", icon: LayoutDashboard, roles: ["owner", "staff"] },
    { to: "/app/kitchen", label: "Kitchen Board", icon: ChefHat, roles: ["owner", "staff", "kitchen"] },
    { to: "/app/menu", label: "Menu & Stock 86", icon: UtensilsCrossed, roles: ["owner", "staff"] },
    { to: "/app/tables", label: "Tables & QR", icon: QrCode, roles: ["owner", "staff"] },
    { to: "/app/waitlist", label: "Live Waitlist", icon: Users, roles: ["owner", "staff"] },
    { to: "/app/inventory", label: "Inventory", icon: Package, roles: ["owner", "staff"] },
    { to: "/app/customers", label: "Customers", icon: UserCheck, roles: ["owner", "staff"] },
    { to: "/app/analytics", label: "Sales Analytics", icon: TrendingUp, roles: ["owner", "staff"] },
    { to: "/app/ai", label: "AI Copilot & Forecast", icon: Sparkles, roles: ["owner", "staff"] },
    { to: "/app/staff", label: "Staff Team", icon: Users, roles: ["owner"] },
  ];

  const allowedNavItems = navItems.filter((item) => item.roles.includes(user?.role || "staff"));

  return (
    <div className="min-h-screen bg-paper flex font-body">
      {/* Ink Navy Sidebar */}
      <aside className="w-64 bg-ink text-white flex flex-col fixed inset-y-0 z-30 shadow-xl">
        {/* Brand Header */}
        <div className="p-5 border-b border-ink-light flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center font-heading font-bold text-xl shadow-md">
            Z
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-lg text-white tracking-tight">
              Zayka OS
            </h1>
            <p className="text-[11px] text-gray-400 capitalize">
              {user?.role} Portal
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading font-semibold text-xs transition-all ${
                    isActive
                      ? "bg-saffron text-white shadow-md"
                      : "text-gray-300 hover:bg-ink-light hover:text-white"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Live Socket & User Profile Footer */}
        <div className="p-4 border-t border-ink-light bg-ink-dark/50 space-y-3">
          {/* Socket Connection Status Indicator */}
          <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-ink-light/50">
            <span className="text-gray-400 text-[11px]">Real-time Sync</span>
            {connected ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                <WifiOff className="w-3 h-3" /> Reconnecting...
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="truncate">
              <p className="font-heading font-semibold text-xs text-white truncate">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-ink-light transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

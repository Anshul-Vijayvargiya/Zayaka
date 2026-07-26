import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import CustomerMenu from "./pages/CustomerMenu";
import CustomerWaitlist from "./pages/CustomerWaitlist";
import CustomerOrderTracker from "./pages/CustomerOrderTracker";

import DashboardLayout from "./pages/dashboard/DashboardLayout";
import KanbanOrders from "./pages/dashboard/KanbanOrders";
import KitchenKDS from "./pages/dashboard/KitchenKDS";
import MenuManager from "./pages/dashboard/MenuManager";
import TableManager from "./pages/dashboard/TableManager";
import WaitlistManager from "./pages/dashboard/WaitlistManager";
import InventoryManager from "./pages/dashboard/InventoryManager";
import StaffManager from "./pages/dashboard/StaffManager";
import CustomerList from "./pages/dashboard/CustomerList";
import SalesAnalytics from "./pages/dashboard/SalesAnalytics";
import AiCopilot from "./pages/dashboard/AiCopilot";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  useEffect(() => {
    // Force the correct tab title on every load — guards against a browser
    // tab left open from before a title fix, or from a different project
    // that previously ran on this same dev-server port.
    document.title = "Zayka — Scan. See. Order.";
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Public & Diner Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          <Route path="/r/:slug" element={<CustomerMenu />} />
          <Route path="/r/:slug/waitlist" element={<CustomerWaitlist />} />
          <Route path="/r/:slug/order/:orderId" element={<CustomerOrderTracker />} />

          {/* Management Dashboard Suite */}
          <Route
            path="/app"
            element={
              <ProtectedRoute roles={["owner", "staff", "kitchen"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/orders" replace />} />
            <Route
              path="orders"
              element={
                <ProtectedRoute roles={["owner", "staff"]}>
                  <KanbanOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="kitchen"
              element={
                <ProtectedRoute roles={["owner", "staff", "kitchen"]}>
                  <KitchenKDS />
                </ProtectedRoute>
              }
            />
            <Route
              path="menu"
              element={
                <ProtectedRoute roles={["owner", "staff"]}>
                  <MenuManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="tables"
              element={
                <ProtectedRoute roles={["owner", "staff"]}>
                  <TableManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="waitlist"
              element={
                <ProtectedRoute roles={["owner", "staff"]}>
                  <WaitlistManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute roles={["owner", "staff"]}>
                  <InventoryManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff"
              element={
                <ProtectedRoute roles={["owner"]}>
                  <StaffManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers"
              element={
                <ProtectedRoute roles={["owner", "staff"]}>
                  <CustomerList />
                </ProtectedRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <ProtectedRoute roles={["owner", "staff"]}>
                  <SalesAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="ai"
              element={
                <ProtectedRoute roles={["owner", "staff"]}>
                  <AiCopilot />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

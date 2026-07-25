import React, { useState, useEffect } from "react";
import api, { errMsg } from "../../api/client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Award,
  AlertCircle,
} from "lucide-react";

export default function SalesAnalytics() {
  const [summary, setSummary] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [hourlyOrders, setHourlyOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [sumRes, dailyRes, topRes, hourlyRes] = await Promise.all([
        api.get("/analytics/summary"),
        api.get("/analytics/revenue-daily?days=21"),
        api.get("/analytics/top-items"),
        api.get("/analytics/orders-hourly"),
      ]);

      setSummary(sumRes.data);
      setDailyRevenue(dailyRes.data.rows);
      setTopItems(topRes.data.rows);
      setHourlyOrders(hourlyRes.data.rows);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-heading font-semibold text-xs text-ink">Loading sales aggregations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-paper-border">
        <h1 className="font-heading font-extrabold text-2xl text-ink">
          Sales Analytics & Operational Performance
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          21-day sales trends, hourly peak demand patterns, and menu popularity charts
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-3xl bg-paper-card border border-paper-border shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-semibold">Today's Revenue</span>
            <DollarSign className="w-5 h-5 text-saffron" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-ink">
            ₹{summary?.today?.revenue || 0}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {summary?.today?.orders || 0} paid orders today
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-paper-card border border-paper-border shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-semibold">Average Order Value</span>
            <TrendingUp className="w-5 h-5 text-saffron" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-ink">
            ₹{summary?.today?.avgOrder || 0}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">Per transaction avg</p>
        </div>

        <div className="p-5 rounded-3xl bg-paper-card border border-paper-border shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-semibold">Active Pipeline Orders</span>
            <ShoppingBag className="w-5 h-5 text-saffron" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-saffron">
            {summary?.activeOrders || 0}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">Orders in preparation/serving</p>
        </div>

        <div className="p-5 rounded-3xl bg-paper-card border border-paper-border shadow-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-semibold">Low Stock Items</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-red-600">
            {summary?.lowStock || 0}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">Below alert threshold</p>
        </div>
      </div>

      {/* 21-Day Revenue Trend Chart */}
      <div className="p-6 rounded-3xl bg-paper-card border border-paper-border shadow-sm space-y-4">
        <div>
          <h2 className="font-heading font-bold text-lg text-ink">21-Day Revenue Trend (₹)</h2>
          <p className="text-xs text-ink-muted">Daily sales revenue performance over the last 3 weeks</p>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyRevenue}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8830C" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#E8830C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE5DC" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1E2E",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#E8830C"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Top Items & Hourly Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Dishes Bar Chart */}
        <div className="p-6 rounded-3xl bg-paper-card border border-paper-border shadow-sm space-y-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
              <Award className="w-5 h-5 text-saffron" /> Top 8 Menu Best-Sellers
            </h2>
            <p className="text-xs text-ink-muted">Total units sold across historical orders</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAE5DC" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#6B7280" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#1A1E2E" }} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1E2E",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="qty" fill="#E8830C" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Peak Pattern Bar Chart */}
        <div className="p-6 rounded-3xl bg-paper-card border border-paper-border shadow-sm space-y-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
              <Clock className="w-5 h-5 text-saffron" /> Hourly Order Distribution
            </h2>
            <p className="text-xs text-ink-muted">Identifies peak lunch (12-14h) & dinner (19-21h) rushes</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyOrders}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE5DC" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1E2E",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="orders" fill="#1A1E2E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

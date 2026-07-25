import React, { useState, useEffect } from "react";
import api, { errMsg } from "../../api/client";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Bell,
  Utensils,
  CheckCheck,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const COLUMNS = [
  { id: "placed", title: "Placed", icon: Clock, bg: "bg-blue-50 border-blue-200", badge: "bg-blue-600 text-white" },
  { id: "accepted", title: "Accepted", icon: CheckCircle2, bg: "bg-amber-50 border-amber-200", badge: "bg-amber-600 text-white" },
  { id: "preparing", title: "Preparing", icon: ChefHat, bg: "bg-orange-50 border-orange-200", badge: "bg-orange-600 text-white" },
  { id: "ready", title: "Ready", icon: Bell, bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-600 text-white" },
  { id: "served", title: "Served", icon: Utensils, bg: "bg-purple-50 border-purple-200", badge: "bg-purple-600 text-white" },
];

const NEXT_STATUS = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "served",
  served: "paid",
};

export default function KanbanOrders() {
  const { user } = useAuth();
  const { socket, joinRooms } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOrders();
    if (user?.restaurantId) {
      joinRooms([`restaurant:${user.restaurantId}`]);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/manage/orders?active=1");
      setOrders(res.data.orders);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  // Socket listeners for new and updated orders
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o._id !== newOrder._id)]);
    };

    const handleUpdateOrder = (updatedOrder) => {
      if (updatedOrder.status === "paid" || updatedOrder.status === "cancelled") {
        setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      }
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:update", handleUpdateOrder);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:update", handleUpdateOrder);
    };
  }, [socket]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/manage/orders/${orderId}/status`, { status: newStatus });
      const updated = res.data.order;
      if (newStatus === "paid" || newStatus === "cancelled") {
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
      } else {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      }
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      !search ||
      o.customerName?.toLowerCase().includes(q) ||
      String(o.tableNumber).includes(q) ||
      o._id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-ink">
            Live Orders Pipeline
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Real-time status management with instant Socket.io broadcast to kitchen & tables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search table, customer..."
              className="pl-9 pr-4 py-1.5 rounded-xl border border-paper-border text-xs text-ink bg-paper-card focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-paper-card border border-paper-border text-ink hover:text-saffron transition-colors"
            title="Refresh orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Kanban 5 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.id);
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className={`p-3 rounded-2xl border flex flex-col min-h-[70vh] ${col.bg}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/10">
                <div className="flex items-center gap-1.5">
                  <ColIcon className="w-4 h-4 text-ink" />
                  <h2 className="font-heading font-bold text-xs text-ink">
                    {col.title}
                  </h2>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-heading font-extrabold text-[10px] ${col.badge}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Column Orders List */}
              <div className="my-3 space-y-3 flex-1 overflow-y-auto pr-1">
                {colOrders.length === 0 ? (
                  <div className="text-center py-10 text-xs text-ink-muted italic opacity-60">
                    No orders
                  </div>
                ) : (
                  colOrders.map((ord) => {
                    const elapsedMins = Math.floor(
                      (Date.now() - new Date(ord.placedAt).getTime()) / 60000
                    );
                    const nextSt = NEXT_STATUS[ord.status];

                    return (
                      <div
                        key={ord._id}
                        className="p-3.5 rounded-xl bg-white border border-paper-border shadow-sm hover:shadow-md transition-shadow space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-extrabold text-sm text-saffron">
                            Table #{ord.tableNumber || "N/A"}
                          </span>
                          <span className="text-[10px] font-semibold text-ink-muted bg-paper px-2 py-0.5 rounded-full border border-paper-border">
                            {elapsedMins}m ago
                          </span>
                        </div>

                        <div className="text-xs">
                          <p className="font-semibold text-ink">{ord.customerName}</p>
                          <p className="text-[10px] text-ink-muted font-mono">
                            #{ord._id.slice(-6)}
                          </p>
                        </div>

                        {/* Items summary */}
                        <div className="space-y-1 py-1 border-y border-paper-border text-xs">
                          {ord.items.map((it, i) => (
                            <div key={i} className="flex justify-between items-start text-[11px]">
                              <span className="text-ink">
                                <strong className="text-saffron">{it.qty}x</strong> {it.name}
                              </span>
                              {it.notes && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded italic">
                                  {it.notes}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="font-heading font-bold text-ink">
                            ₹{ord.total}
                          </span>

                          <div className="flex items-center gap-1">
                            {nextSt && (
                              <button
                                onClick={() => updateStatus(ord._id, nextSt)}
                                className="px-2.5 py-1 rounded-lg bg-saffron hover:bg-saffron-hover text-white font-heading font-semibold text-[10px] transition-all shadow-sm flex items-center gap-1"
                              >
                                <span>Advance</span>
                                →
                              </button>
                            )}

                            {ord.status === "served" && (
                              <button
                                onClick={() => updateStatus(ord._id, "paid")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-semibold text-[10px] transition-all shadow-sm"
                              >
                                Pay & Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

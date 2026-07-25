import React, { useState, useEffect } from "react";
import api, { errMsg } from "../../api/client";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { ChefHat, Clock, CheckCircle2, AlertCircle, Play, Check } from "lucide-react";

function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, now + 0.16);
    gain2.gain.setValueAtTime(0.0001, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.18, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.4);
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

function notifyNewOrder(order) {
  playOrderChime();
  if ("Notification" in window && Notification.permission === "granted") {
    const tableStr = order.tableNumber ? `Table #${order.tableNumber}` : "Takeout";
    const itemsStr = order.items.map((i) => `${i.qty}× ${i.name}`).join(", ");
    new Notification(`New order · ${tableStr}`, {
      body: itemsStr || "New order received!",
    });
  }
}

export default function KitchenKDS() {
  const { user } = useAuth();
  const { socket, joinRooms } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchActiveOrders();
    if (user?.restaurantId) {
      joinRooms([`restaurant:${user.restaurantId}`]);
    }
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/manage/orders?active=1");
      const kitchenOrders = res.data.orders.filter((o) =>
        ["placed", "accepted", "preparing"].includes(o.status)
      );
      setOrders(kitchenOrders);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleNew = (ord) => {
      if (["placed", "accepted", "preparing"].includes(ord.status)) {
        notifyNewOrder(ord);
        setOrders((prev) => [ord, ...prev.filter((o) => o._id !== ord._id)]);
      }
    };

    const handleUpdate = (ord) => {
      if (!["placed", "accepted", "preparing"].includes(ord.status)) {
        setOrders((prev) => prev.filter((o) => o._id !== ord._id));
      } else {
        setOrders((prev) => prev.map((o) => (o._id === ord._id ? ord : o)));
      }
    };

    socket.on("order:new", handleNew);
    socket.on("order:update", handleUpdate);

    return () => {
      socket.off("order:new", handleNew);
      socket.off("order:update", handleUpdate);
    };
  }, [socket]);

  const setStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/manage/orders/${orderId}/status`, { status: newStatus });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-paper-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ink text-saffron flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-ink">
              Kitchen Display System (KDS)
            </h1>
            <p className="text-xs text-ink-muted">
              Live preparation queue for kitchen staff
            </p>
          </div>
        </div>

        <div className="bg-paper-card px-4 py-2 rounded-2xl border border-paper-border text-xs font-bold text-ink">
          Active Tickets: <span className="text-saffron font-heading text-sm">{orders.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-paper-card rounded-3xl border border-paper-border p-8">
          <ChefHat className="w-16 h-16 text-ink-muted mx-auto mb-3 opacity-40" />
          <h2 className="font-heading font-bold text-lg text-ink">Kitchen Queue Clear!</h2>
          <p className="text-xs text-ink-muted mt-1">All orders have been prepared and dispatched.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((ord) => {
            const elapsedMins = Math.floor(
              (Date.now() - new Date(ord.placedAt).getTime()) / 60000
            );
            const isUrgent = elapsedMins > 15;

            return (
              <div
                key={ord._id}
                className={`p-5 rounded-3xl bg-ink text-white shadow-xl flex flex-col justify-between border-2 transition-all ${
                  isUrgent ? "border-red-500 ring-2 ring-red-500/20" : "border-ink-light"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-ink-light">
                    <div>
                      <span className="font-heading font-extrabold text-xl text-saffron">
                        Table #{ord.tableNumber || "N/A"}
                      </span>
                      <p className="text-[10px] text-gray-400 font-mono">
                        #{ord._id.slice(-6).toUpperCase()}
                      </p>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-xl text-xs font-bold font-heading flex items-center gap-1 ${
                        isUrgent ? "bg-red-600 text-white animate-pulse" : "bg-ink-light text-gray-200"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsedMins}m</span>
                    </div>
                  </div>

                  {/* Customer & Status Badge */}
                  <div className="my-3 flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-medium">{ord.customerName}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === "preparing"
                          ? "bg-saffron text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  {/* Dish items */}
                  <div className="my-4 space-y-2.5 bg-ink-dark/60 p-3.5 rounded-2xl border border-ink-light/50">
                    {ord.items.map((it, i) => (
                      <div key={i} className="flex items-start justify-between text-sm">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-lg bg-saffron text-white flex items-center justify-center font-heading font-bold text-xs">
                            {it.qty}
                          </span>
                          <div>
                            <span className="font-heading font-semibold text-white">
                              {it.name}
                            </span>
                            {it.notes && (
                              <p className="text-xs text-amber-400 font-medium italic mt-0.5">
                                Note: {it.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  {ord.status !== "preparing" ? (
                    <button
                      onClick={() => setStatus(ord._id, "preparing")}
                      className="flex-1 py-3 rounded-2xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Preparing</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(ord._id, "ready")}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Ready for Table</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

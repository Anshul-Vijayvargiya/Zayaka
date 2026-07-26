import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api, { errMsg } from "../api/client";
import { useSocket } from "../context/SocketContext";
import VegBadge from "../components/VegBadge";
import {
  Utensils,
  Clock,
  CheckCircle2,
  ChefHat,
  Bell,
  Receipt,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Wallet,
  Star,
  QrCode,
} from "lucide-react";

const STEPS = [
  { key: "placed", label: "Placed", icon: Clock, desc: "Sent to kitchen" },
  { key: "accepted", label: "Accepted", icon: CheckCircle2, desc: "Order confirmed" },
  { key: "preparing", label: "Preparing", icon: ChefHat, desc: "Chef is cooking" },
  { key: "ready", label: "Ready", icon: Bell, desc: "Ready for table" },
  { key: "served", label: "Served", icon: Utensils, desc: "Served at table" },
  { key: "paid", label: "Paid", icon: Wallet, desc: "Bill settled" },
];

export default function CustomerOrderTracker() {
  const { slug, orderId } = useParams();
  const { socket, joinRooms } = useSocket();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoverStar, setHoverStar] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    fetchOrder();
    if (orderId) {
      joinRooms([`order:${orderId}`]);
    }
  }, [slug, orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/public/${slug}/my-orders`);
      const found = res.data.orders.find((o) => o._id === orderId);
      if (found) {
        setOrder(found);
      } else if (res.data.orders.length > 0) {
        setOrder(res.data.orders[0]);
      } else {
        setError("Order not found.");
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (value) => {
    if (ratingSubmitting || order?.rating) return;
    setRatingSubmitting(true);
    try {
      const res = await api.patch(`/public/${slug}/orders/${order._id}/rating`, { rating: value });
      setOrder(res.data.order);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Socket listener for order status changes
  useEffect(() => {
    if (!socket || !orderId) return;

    const handleOrderUpdate = (updatedOrder) => {
      if (updatedOrder._id === orderId) {
        setOrder(updatedOrder);
      }
    };

    socket.on("order:update", handleOrderUpdate);
    return () => {
      socket.off("order:update", handleOrderUpdate);
    };
  }, [socket, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-heading font-semibold text-xs text-ink">Connecting to live order feed...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="max-w-md bg-paper-card p-6 rounded-3xl border border-paper-border text-center shadow-lg">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h2 className="font-heading font-bold text-lg text-ink">Order Not Found</h2>
          <p className="text-xs text-ink-muted mt-1">{error || "Could not retrieve order details."}</p>
          <Link
            to={`/r/${slug}`}
            className="inline-block mt-4 px-5 py-2 rounded-xl bg-saffron text-white text-xs font-semibold"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);
  const shortId = order._id.slice(-6).toUpperCase();
  const upiUrl = `upi://pay?pa=zayka.demo@upi&pn=Zayka%20Demo%20Kitchen&am=${order.total}&cu=INR&tn=Order%20${shortId}`;

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center p-4">
      <div className="w-full max-w-lg bg-paper-card rounded-3xl border border-paper-border shadow-xl p-5 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-paper-border">
          <Link
            to={`/r/${slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-saffron"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu</span>
          </Link>

          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Table #{order.tableNumber || "Takeout"}
            </span>
            <h1 className="font-heading font-extrabold text-sm text-ink">
              Order #{order._id.slice(-6).toUpperCase()}
            </h1>
          </div>
        </div>

        {/* Live Status Pipeline Timeline */}
        <div className="py-2">
          <h2 className="font-heading font-bold text-sm text-ink mb-4 text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-saffron" />
            <span>Real-time Order Progress</span>
          </h2>

          <div className="space-y-4">
            {STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-start gap-3 relative">
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-6 -ml-px transition-colors ${
                        idx < currentStepIndex ? "bg-saffron" : "bg-paper-border"
                      }`}
                    />
                  )}

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 ${
                      isCurrent
                        ? "bg-saffron text-white ring-4 ring-saffron-pale scale-110 shadow-md"
                        : isCompleted
                        ? "bg-saffron text-white"
                        : "bg-paper border border-paper-border text-ink-muted"
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`font-heading font-semibold text-xs ${
                          isCurrent ? "text-saffron text-sm font-bold" : isCompleted ? "text-ink" : "text-ink-muted"
                        }`}
                      >
                        {step.label}
                      </h3>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saffron-pale text-saffron animate-pulse">
                          IN PROGRESS
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details & Items Breakdown */}
        <div className="p-4 rounded-2xl bg-paper border border-paper-border space-y-3">
          <div className="flex items-center justify-between border-b border-paper-border pb-2">
            <span className="font-heading font-bold text-xs text-ink flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-saffron" /> Order Summary
            </span>
            <span className="text-[10px] text-ink-muted font-medium">
              {new Date(order.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-paper-card border border-paper-border flex items-center justify-center font-bold text-[10px] text-ink">
                    {it.qty}x
                  </span>
                  <span className="font-medium text-ink">{it.name}</span>
                </div>
                <span className="font-semibold text-ink">₹{it.price * it.qty}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-paper-border text-xs space-y-1">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>GST</span>
              <span>₹{order.gst}</span>
            </div>
            <div className="flex justify-between font-heading font-bold text-sm text-ink pt-1">
              <span>Total Paid/Due</span>
              <span className="text-saffron">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Time to Pay — UPI intent QR, shown once food is served. Payment
            confirmation stays manual: staff taps "Mark paid" on the
            dashboard after receiving money (real gateway = future work). */}
        {order.status === "served" && (
          <div className="p-4 rounded-2xl bg-paper border border-paper-border text-center space-y-3">
            <span className="font-heading font-bold text-sm text-ink flex items-center justify-center gap-1.5">
              <QrCode className="w-4 h-4 text-saffron" /> Time to Pay
            </span>

            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-2xl border border-paper-border">
                <QRCodeSVG value={upiUrl} size={168} includeMargin={false} />
              </div>
            </div>

            <p className="text-[11px] text-ink-muted">
              Scan with any UPI app — GPay, PhonePe, Paytm
            </p>
            <p className="text-[11px] text-ink-muted border-t border-paper-border pt-3">
              Paying cash at the counter? Just let your waiter know — they'll
              mark the bill settled once it's received.
            </p>
          </div>
        )}

        {/* Paid — thank-you + one-tap rating */}
        {order.status === "paid" && (
          <div className="p-4 rounded-2xl bg-paper border border-paper-border text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-ink">Paid — thank you!</p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                ₹{order.total} settled. Hope you enjoyed the meal.
              </p>
            </div>

            {order.rating ? (
              <p className="text-xs font-semibold text-saffron">
                You rated this visit {order.rating} / 5 — thanks for the feedback!
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[11px] text-ink-muted">Rate your visit</p>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={ratingSubmitting}
                      onClick={() => submitRating(n)}
                      onMouseEnter={() => setHoverStar(n)}
                      onMouseLeave={() => setHoverStar(0)}
                      className="p-1 disabled:opacity-50"
                      aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          n <= hoverStar ? "fill-saffron text-saffron" : "text-ink-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

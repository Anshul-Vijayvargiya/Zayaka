import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import api, { errMsg } from "../api/client";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import VegBadge from "../components/VegBadge";
import {
  Utensils,
  Clock,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Users,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function CustomerMenu() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table") || "";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinRooms, socket } = useSocket();

  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [kitchenLoad, setKitchenLoad] = useState({ activeOrders: 0, estimatedMinutes: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Menu filters
  const [activeCategory, setActiveCategory] = useState("All");
  const [vegFilter, setVegFilter] = useState("all"); // 'all' | 'veg' | 'nonveg'
  const [searchQuery, setSearchQuery] = useState("");

  // Group Ordering Shared Cart State
  const [tableNumber, setTableNumber] = useState(tableParam);
  const [members, setMembers] = useState(1);
  const sharedKey = restaurant?.id && tableNumber ? `${restaurant.id}:${tableNumber}` : "";

  // Fetch menu and load data
  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, loadRes] = await Promise.all([
        api.get(`/public/${slug}/menu`),
        api.get(`/public/${slug}/kitchen-load`),
      ]);
      setRestaurant(menuRes.data.restaurant);
      setItems(menuRes.data.items);
      setKitchenLoad(loadRes.data);

      if (menuRes.data.restaurant?.id) {
        joinRooms([`public:${menuRes.data.restaurant.id}`]);
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  // Socket listener for Group Ordering Shared Table Cart
  useEffect(() => {
    if (!socket || !sharedKey) return;

    socket.emit("cart:join", { key: sharedKey });

    const handleCartState = ({ key, lines, members: memberCount }) => {
      if (key === sharedKey) {
        setCart(lines || []);
        if (typeof memberCount === "number") setMembers(memberCount);
      }
    };

    socket.on("cart:state", handleCartState);

    return () => {
      socket.off("cart:state", handleCartState);
    };
  }, [socket, sharedKey]);

  // Socket listener for real-time 86'd items & menu changes
  useEffect(() => {
    if (!socket || !restaurant?.id) return;

    const handleMenuUpdate = (updatedItem) => {
      setItems((prev) =>
        prev.map((it) => (it._id === updatedItem._id ? updatedItem : it))
      );
      // Remove 86'd items from cart if out of stock
      if (!updatedItem.available) {
        if (sharedKey) {
          socket.emit("cart:remove", { key: sharedKey, itemId: updatedItem._id });
        } else {
          setCart((prev) => prev.filter((c) => c.menuItemId !== updatedItem._id));
        }
      }
    };

    const handleMenuRemove = (id) => {
      setItems((prev) => prev.filter((it) => it._id !== id));
      if (sharedKey) {
        socket.emit("cart:remove", { key: sharedKey, itemId: id });
      } else {
        setCart((prev) => prev.filter((c) => c.menuItemId !== id));
      }
    };

    socket.on("menu:update", handleMenuUpdate);
    socket.on("menu:remove", handleMenuRemove);

    return () => {
      socket.off("menu:update", handleMenuUpdate);
      socket.off("menu:remove", handleMenuRemove);
    };
  }, [socket, restaurant, sharedKey]);

  // Cart operations (shared if sharedKey is active, solo otherwise)
  const updateQuantity = (item, delta) => {
    const itemId = item._id || item.menuItemId;
    if (sharedKey && socket) {
      if (delta > 0) {
        socket.emit("cart:add", {
          key: sharedKey,
          item: {
            menuItemId: itemId,
            name: item.name,
            price: item.price,
            isVeg: item.isVeg,
            qty: 1,
          },
        });
      } else {
        socket.emit("cart:remove", { key: sharedKey, itemId });
      }
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === itemId);
      if (!existing && delta > 0) {
        return [
          ...prev,
          {
            menuItemId: itemId,
            name: item.name,
            price: item.price,
            isVeg: item.isVeg,
            qty: 1,
            notes: "",
          },
        ];
      }
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) {
          return prev.filter((c) => c.menuItemId !== itemId);
        }
        return prev.map((c) =>
          c.menuItemId === itemId ? { ...c, qty: newQty } : c
        );
      }
      return prev;
    });
  };

  const updateItemNotes = (itemId, notes) => {
    if (sharedKey && socket) {
      socket.emit("cart:updateNotes", { key: sharedKey, itemId, notes });
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.menuItemId === itemId ? { ...c, notes } : c))
    );
  };

  const getItemQty = (itemId) => {
    return cart.find((c) => c.menuItemId === itemId)?.qty || 0;
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  }, [cart]);

  const gstRate = restaurant?.gstRate || 18;
  const cartGst = Math.round(cartSubtotal * (gstRate / 100) * 100) / 100;
  const cartTotal = Math.round((cartSubtotal + cartGst) * 100) / 100;
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/r/${slug}?table=${tableNumber}` } });
      return;
    }
    if (cart.length === 0) return;
    if (!tableNumber) {
      setOrderError("Please enter your table number.");
      return;
    }

    setOrderError("");
    setPlacingOrder(true);

    try {
      const res = await api.post(`/public/${slug}/orders`, {
        items: cart.map((i) => ({
          menuItemId: i.menuItemId,
          qty: i.qty,
          notes: i.notes,
        })),
        tableNumber: Number(tableNumber),
      });

      if (sharedKey && socket) {
        socket.emit("cart:clear", { key: sharedKey });
      }
      setCart([]);
      setIsCartOpen(false);
      navigate(`/r/${slug}/order/${res.data.order._id}`);
    } catch (err) {
      setOrderError(errMsg(err));
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-saffron border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-heading font-semibold text-ink text-sm">Loading live menu...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="max-w-md bg-paper-card p-6 rounded-3xl border border-paper-border text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="font-heading font-bold text-xl text-ink">Restaurant Not Found</h2>
          <p className="text-sm text-ink-muted mt-1">{error || "Invalid restaurant link."}</p>
          <Link
            to="/"
            className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-saffron text-white text-sm font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center">
      {/* Mobile-first max-w-lg container */}
      <div className="w-full max-w-lg bg-paper min-h-screen flex flex-col pb-28 border-x border-paper-border shadow-sm">
        
        {/* Restaurant Header Banner */}
        <header className="bg-ink text-white p-5 rounded-b-3xl shadow-md sticky top-0 z-30">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-saffron text-white flex items-center justify-center font-heading font-bold text-sm">
                  Z
                </span>
                <h1 className="font-heading font-extrabold text-xl text-white tracking-tight">
                  {restaurant.name}
                </h1>
              </div>
              <p className="text-xs text-gray-300 mt-1">{restaurant.tagline || "Freshly Prepared Dine-in"}</p>
            </div>

            {tableNumber && (
              <div className="flex flex-col items-end gap-1">
                <div className="bg-saffron text-white px-3 py-1 rounded-xl text-xs font-bold font-heading shadow-sm flex items-center gap-1">
                  <span>Table #{tableNumber}</span>
                </div>
                {members > 1 && (
                  <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                    <Users className="w-3 h-3" />
                    <span>{members} phones sharing this cart</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Honest Kitchen Wait Estimate */}
          <div className="mt-4 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-saffron" />
              <div>
                <span className="font-semibold text-white">Honest Prep Estimate</span>
                <p className="text-gray-300 text-[11px]">
                  Based on {kitchenLoad.activeOrders} active kitchen orders
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-heading font-extrabold text-sm text-saffron">
                ~{kitchenLoad.estimatedMinutes} mins
              </span>
            </div>
          </div>
        </header>

        {/* Search & Veg/Non-Veg Filter Controls */}
        <div className="p-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes or ingredients..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-paper-card border border-paper-border text-xs text-ink focus:outline-none focus:ring-2 focus:ring-saffron"
            />
          </div>

          {/* Veg / Non-Veg Toggle Chips */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVegFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                vegFilter === "all"
                  ? "bg-ink text-white shadow-sm"
                  : "bg-paper-card text-ink-muted border border-paper-border"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setVegFilter("veg")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                vegFilter === "veg"
                  ? "bg-leaf text-white shadow-sm"
                  : "bg-paper-card text-ink-muted border border-paper-border"
              }`}
            >
              <VegBadge isVeg={true} />
              <span>Veg Only</span>
            </button>
            <button
              onClick={() => setVegFilter("nonveg")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                vegFilter === "nonveg"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-paper-card text-ink-muted border border-paper-border"
              }`}
            >
              <VegBadge isVeg={false} />
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* Sticky Category Scroll Chips */}
        <div className="sticky top-[108px] z-20 bg-paper py-2 px-4 border-b border-paper-border overflow-x-auto no-scrollbar flex items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-saffron text-white shadow-sm"
                  : "bg-paper-card text-ink-muted border border-paper-border hover:bg-paper-border/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div className="p-4 space-y-4 flex-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-paper-card rounded-3xl border border-paper-border p-6">
              <Utensils className="w-10 h-10 text-ink-muted mx-auto mb-2 opacity-50" />
              <p className="font-heading font-semibold text-ink text-sm">No dishes match your search</p>
              <p className="text-xs text-ink-muted mt-1">Try clearing filters or search terms.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const qty = getItemQty(item._id);
              return (
                <div
                  key={item._id}
                  className={`p-4 rounded-2xl bg-paper-card border transition-all ${
                    !item.available
                      ? "opacity-60 border-gray-200 bg-gray-50"
                      : "border-paper-border hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <VegBadge isVeg={item.isVeg} />
                        <h3 className="font-heading font-semibold text-sm text-ink">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-xs text-ink-muted mt-1 line-clamp-2 leading-relaxed">
                        {item.description || "Prepared fresh upon order."}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="font-heading font-bold text-sm text-ink">
                          ₹{item.price}
                        </span>
                        {item.prepMinutes && (
                          <span className="text-[10px] text-ink-muted bg-paper px-2 py-0.5 rounded-full border border-paper-border">
                            ⏱ {item.prepMinutes} mins
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add / Quantity Controls */}
                    <div className="flex flex-col items-end justify-between self-stretch">
                      {!item.available ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl">
                          Sold Out (86'd)
                        </span>
                      ) : qty === 0 ? (
                        <button
                          onClick={() => updateQuantity(item, 1)}
                          className="px-3.5 py-1.5 rounded-xl bg-saffron-pale text-saffron font-heading font-bold text-xs border border-saffron/20 hover:bg-saffron hover:text-white transition-all shadow-sm flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ADD</span>
                        </button>
                      ) : (
                        <div className="flex items-center bg-saffron text-white rounded-xl shadow-sm overflow-hidden text-xs font-bold">
                          <button
                            onClick={() => updateQuantity(item, -1)}
                            className="px-2.5 py-1.5 hover:bg-saffron-hover transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2">{qty}</span>
                          <button
                            onClick={() => updateQuantity(item, 1)}
                            className="px-2.5 py-1.5 hover:bg-saffron-hover transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Floating Cart Bar */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
            <div className="bg-ink text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-ink-light">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-saffron text-white flex items-center justify-center font-heading font-bold text-sm shadow-sm">
                  {totalQty}
                </div>
                <div>
                  <div className="font-heading font-bold text-sm text-white">
                    ₹{cartTotal.toFixed(0)}{" "}
                    <span className="text-[10px] font-normal text-gray-300">
                      (incl. GST)
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-300">
                    {cart.length} item{cart.length > 1 ? "s" : ""} in cart
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="px-4 py-2 rounded-xl bg-saffron hover:bg-saffron-hover text-white font-heading font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>View Cart</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Slide-Up Bottom Sheet Cart Modal */}
        {isCartOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="w-full max-w-lg bg-paper-card rounded-t-3xl p-5 border-t border-paper-border max-h-[85vh] flex flex-col animate-slide-up shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-paper-border">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-saffron" />
                  <div>
                    <h2 className="font-heading font-bold text-base text-ink">
                      {tableNumber ? `Table #${tableNumber}'s Order` : "Your Order Summary"}
                    </h2>
                    {tableNumber && (
                      <p className="text-[11px] text-ink-muted">
                        Live shared table cart — items added on any device update in real-time
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full hover:bg-paper text-ink-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orderError && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              {/* Table Number Input */}
              <div className="mt-4 p-3 rounded-2xl bg-paper border border-paper-border flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Table Number:</span>
                <input
                  type="number"
                  min={1}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. 4"
                  className="w-20 px-3 py-1 rounded-xl bg-white border border-paper-border text-center font-heading font-bold text-sm text-ink focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              {/* Items List */}
              <div className="my-4 space-y-3 overflow-y-auto max-h-60 pr-1">
                {cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="p-3 rounded-2xl bg-paper border border-paper-border flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <VegBadge isVeg={item.isVeg} />
                        <span className="font-heading font-semibold text-xs text-ink">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-heading font-bold text-xs text-ink">
                        ₹{item.price * item.qty}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Add cooking notes (e.g. less spicy)..."
                        value={item.notes || ""}
                        onChange={(e) => updateItemNotes(item.menuItemId, e.target.value)}
                        className="flex-1 px-2.5 py-1 rounded-lg bg-white border border-paper-border text-[11px] text-ink focus:outline-none focus:ring-1 focus:ring-saffron"
                      />

                      <div className="flex items-center bg-ink text-white rounded-lg overflow-hidden text-xs font-bold">
                        <button
                          onClick={() => updateQuantity({ _id: item.menuItemId }, -1)}
                          className="px-2 py-1 hover:bg-ink-light"
                        >
                          -
                        </button>
                        <span className="px-2">{item.qty}</span>
                        <button
                          onClick={() => updateQuantity({ _id: item.menuItemId }, 1)}
                          className="px-2 py-1 hover:bg-ink-light"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Breakdown */}
              <div className="space-y-1.5 pt-3 border-t border-paper-border text-xs text-ink-muted">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-ink">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({gstRate}%)</span>
                  <span className="font-medium text-ink">₹{cartGst}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-paper-border font-heading font-bold text-base text-ink">
                  <span>Grand Total</span>
                  <span className="text-saffron">₹{cartTotal}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2">
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || cart.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-sm shadow-lg shadow-saffron/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {placingOrder ? (
                    "Sending to Kitchen..."
                  ) : (
                    <>
                      <Utensils className="w-4 h-4" />
                      <span>{user ? "Confirm & Send to Kitchen" : "Sign In to Place Order"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

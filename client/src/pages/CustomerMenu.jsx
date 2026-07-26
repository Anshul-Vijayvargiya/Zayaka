import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
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

// Category defaults from the seed data — only show a per-item prep chip when it deviates.
const CATEGORY_DEFAULT_PREP = { Drinks: 5, Breads: 8 };
const getDefaultPrep = (category) => CATEGORY_DEFAULT_PREP[category] ?? 15;

const CATEGORY_EMOJI = {
  Starters: "🍢",
  Mains: "🍛",
  Breads: "🫓",
  Desserts: "🍮",
  Drinks: "🥤",
};

const NAME_EMOJI = [
  [/paneer tikka/i, "🧀"],
  [/chicken\s*65/i, "🍗"],
  [/biryani/i, "🍛"],
  [/naan|roti|paratha/i, "🫓"],
  [/chai/i, "☕"],
  [/coffee/i, "☕"],
  [/lassi|milk/i, "🥛"],
  [/gulab jamun/i, "🍮"],
  [/rasmalai|kulfi|falooda/i, "🍨"],
  [/soda|lime|juice/i, "🥤"],
  [/dal/i, "🍲"],
  [/kebab|mushroom|tikka/i, "🍢"],
  [/chicken/i, "🍗"],
];

function getEmoji(item) {
  const match = NAME_EMOJI.find(([re]) => re.test(item.name || ""));
  if (match) return match[1];
  return CATEGORY_EMOJI[item.category] || "🍽️";
}

const BESTSELLERS = new Set(["Butter Naan", "Butter Chicken", "Chicken Biryani"]);

function MenuSkeleton() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-paper md:[background:radial-gradient(ellipse_at_top,_#FDF0E0_0%,_#FAF7F2_45%)]">
      <div className="max-w-6xl mx-auto px-5 pb-10">
        <div className="bg-ink p-5 rounded-2xl shadow-md mt-0 md:mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-5 w-36 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-14 bg-white/10 rounded-2xl animate-pulse md:hidden" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 py-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="min-h-[180px] p-4 rounded-2xl bg-paper-card border border-paper-border flex gap-3"
            >
              <div className="w-12 h-12 rounded-full flex-shrink-0 animate-shimmer" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-2/3 rounded animate-shimmer" />
                <div className="h-3 w-full rounded animate-shimmer" />
                <div className="h-3 w-1/3 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

  // Cart / checkout state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Category chip underline — measured against the actually-rendered chip
  const chipRefs = useRef({});
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

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

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
    return ["All", ...unique];
  }, [items]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    items.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) return false;
      if (vegFilter === "veg" && !item.isVeg) return false;
      if (vegFilter === "nonveg" && item.isVeg) return false;
      if (q && !item.name?.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [items, activeCategory, vegFilter, searchQuery]);

  // Keep the sliding saffron underline glued to whichever chip is active
  useLayoutEffect(() => {
    const el = chipRefs.current[activeCategory];
    if (el) {
      setUnderline({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeCategory, categories]);

  const estMinutes = kitchenLoad.estimatedMinutes;
  const estColor = estMinutes <= 15 ? "text-leaf" : estMinutes <= 30 ? "text-saffron" : "text-red-400";

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
    return <MenuSkeleton />;
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
    <div className="relative min-h-screen overflow-x-hidden bg-paper md:[background:radial-gradient(ellipse_at_top,_#FDF0E0_0%,_#FAF7F2_45%)]">
      {/* Faint desktop dot-grid texture */}
      <div
        aria-hidden="true"
        className="hidden md:block pointer-events-none fixed inset-0 opacity-[0.035] [background-image:radial-gradient(#1A1E2E_1px,transparent_1px)] [background-size:22px_22px]"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 pb-28 md:pb-24">

          {/* Restaurant Header Banner */}
          <header className="bg-ink text-white p-5 rounded-2xl shadow-md mt-0 md:mt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-saffron text-white flex items-center justify-center font-heading font-bold text-sm">
                    Z
                  </span>
                  <h1 className="font-heading font-extrabold text-xl md:text-2xl text-white tracking-tight">
                    {restaurant.name}
                  </h1>
                </div>
                <p className="text-xs text-gray-300 mt-1">{restaurant.tagline || "Freshly Prepared Dine-in"}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      restaurant.isOpen === false ? "bg-red-400" : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-gray-300">
                    {restaurant.isOpen === false ? "Closed" : "Open now"}
                  </span>
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

                {/* Compact prep-estimate pill — desktop only */}
                <div className="hidden md:flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-xs">
                  <Clock className="w-3.5 h-3.5 text-saffron" />
                  <span
                    key={estMinutes}
                    className={`font-heading font-extrabold animate-pop inline-block ${estColor}`}
                  >
                    ~{estMinutes} mins
                  </span>
                </div>
              </div>
            </div>

            {/* Honest Kitchen Wait Estimate — mobile only */}
            <div className="mt-4 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between text-xs md:hidden">
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
                <span
                  key={estMinutes}
                  className={`font-heading font-extrabold text-sm animate-pop inline-block ${estColor}`}
                >
                  ~{estMinutes} mins
                </span>
              </div>
            </div>
          </header>

          {/* Search & Veg/Non-Veg Filter Controls */}
          <div className="py-4 space-y-3">
            {/* Search Bar */}
            <div className="relative max-w-md">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  vegFilter === "all"
                    ? "bg-ink text-white shadow-sm"
                    : "bg-paper-card text-ink-muted border border-paper-border"
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setVegFilter("veg")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-150 ${
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
          <div className="sticky top-0 z-20 bg-paper py-2 border-b border-paper-border">
            <div className="relative overflow-x-auto no-scrollbar snap-x snap-mandatory flex items-center gap-2 pb-2">
              {categories.map((cat) => {
                const count = cat === "All" ? items.length : categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    ref={(el) => (chipRefs.current[cat] = el)}
                    onClick={() => setActiveCategory(cat)}
                    className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                      activeCategory === cat
                        ? "bg-ink text-white shadow-sm"
                        : "bg-paper-card text-ink-muted border border-paper-border hover:bg-paper-border/50"
                    }`}
                  >
                    {cat} <span className="opacity-60">· {count}</span>
                  </button>
                );
              })}
              {/* Sliding saffron underline indicator */}
              <span
                className="absolute -bottom-0.5 h-0.5 bg-saffron rounded-full transition-all duration-200 ease-out"
                style={{ left: underline.left, width: underline.width }}
              />
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="py-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-paper-card rounded-3xl border border-paper-border p-6">
                <Utensils className="w-10 h-10 text-ink-muted mx-auto mb-2 opacity-50" />
                <p className="font-heading font-semibold text-ink text-sm">No dishes match your search</p>
                <p className="text-xs text-ink-muted mt-1">Try clearing filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                {filteredItems.map((item) => {
                  const qty = getItemQty(item._id);
                  const isBestseller = BESTSELLERS.has(item.name);
                  const showPrepChip = item.prepMinutes && item.prepMinutes !== getDefaultPrep(item.category);

                  return (
                    <div
                      key={item._id}
                      className={`relative overflow-hidden min-h-[180px] p-4 rounded-2xl bg-paper-card border transition-all duration-150 ease-out ${
                        !item.available
                          ? "opacity-70 grayscale border-paper-border"
                          : "border-paper-border hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      {!item.available && (
                        <div className="absolute top-3 -left-9 -rotate-45 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-9 py-0.5 shadow-md z-10">
                          Out of stock
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Dish emoji avatar */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                            item.isVeg ? "bg-saffron-pale" : "bg-red-50"
                          }`}
                        >
                          <span aria-hidden="true">{getEmoji(item)}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <VegBadge isVeg={item.isVeg} />
                            <h3 className="font-heading font-semibold text-base text-ink">
                              {item.name}
                            </h3>
                            {isBestseller && (
                              <span className="text-[9px] font-bold text-saffron bg-saffron-pale border border-saffron/30 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                Bestseller <span aria-hidden="true">⭐</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-ink-muted mt-1 line-clamp-2 leading-relaxed">
                            {item.description || "Prepared fresh upon order."}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="font-heading font-bold text-sm text-ink">
                              ₹{item.price}
                            </span>
                            {showPrepChip && (
                              <span className="text-[10px] text-ink-muted bg-paper px-2 py-0.5 rounded-full border border-paper-border">
                                ⏱ {item.prepMinutes} mins
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Add / Quantity Controls */}
                        <div className="flex flex-col items-end justify-center self-stretch">
                          {!item.available ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl">
                              Sold Out (86'd)
                            </span>
                          ) : qty === 0 ? (
                            <button
                              key="add"
                              onClick={() => updateQuantity(item, 1)}
                              className="animate-pop px-3.5 py-1.5 rounded-xl bg-saffron-pale text-saffron font-heading font-bold text-xs border border-saffron/20 hover:bg-saffron hover:text-white transition-all duration-150 shadow-sm flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>ADD</span>
                            </button>
                          ) : (
                            <div
                              key="stepper"
                              className="animate-pop flex items-center bg-saffron text-white rounded-xl shadow-sm overflow-hidden text-xs font-bold"
                            >
                              <button
                                onClick={() => updateQuantity(item, -1)}
                                className="px-2.5 py-1.5 hover:bg-saffron-hover transition-colors duration-150"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span key={qty} className="px-2 animate-pop inline-block">{qty}</span>
                              <button
                                onClick={() => updateQuantity(item, 1)}
                                className="px-2.5 py-1.5 hover:bg-saffron-hover transition-colors duration-150"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Floating Cart Bar — full-width bar on mobile, floating pill bottom-right on desktop */}
          {cart.length > 0 && (
            <div className="fixed z-40 animate-slide-up bottom-4 inset-x-0 mx-auto w-full max-w-md px-4 md:inset-x-auto md:right-6 md:bottom-6 md:mx-0 md:w-auto md:max-w-none md:px-0">
              <div
                key={totalQty}
                className="animate-cart-pulse bg-ink text-white p-3.5 md:py-3 md:pl-4 md:pr-3 rounded-2xl md:rounded-full shadow-xl flex items-center justify-between gap-4 border border-ink-light"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl md:rounded-full bg-saffron text-white flex items-center justify-center font-heading font-bold text-sm shadow-sm">
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
                  className="px-4 py-2 rounded-xl md:rounded-full bg-saffron hover:bg-saffron-hover text-white font-heading font-semibold text-xs transition-all duration-150 shadow-sm flex items-center gap-1.5"
                >
                  <span>View Cart</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Cart Modal — bottom sheet on mobile, right-side drawer on desktop */}
          {isCartOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center md:items-stretch md:justify-end animate-fade-in">
              <div className="w-full max-w-lg bg-paper-card rounded-t-3xl p-5 border-t border-paper-border max-h-[85vh] flex flex-col animate-slide-up shadow-2xl md:max-w-none md:w-96 md:h-full md:max-h-full md:rounded-none md:rounded-l-3xl md:border-t-0 md:border-l md:animate-slide-in-right">
                <div className="w-10 h-1.5 bg-paper-border rounded-full mx-auto mb-3 md:hidden" />

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
                <div className="my-4 space-y-3 overflow-y-auto max-h-60 md:max-h-none md:flex-1 pr-1">
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
                    className="w-full py-3.5 rounded-2xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-sm shadow-lg shadow-saffron/20 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
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

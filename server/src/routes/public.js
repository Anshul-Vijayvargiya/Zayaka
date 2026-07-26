import { Router } from "express";
import { Restaurant, MenuItem, Table, Order, Waitlist } from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

async function findRestaurant(req, res, next) {
  const r = await Restaurant.findOne({ slug: req.params.slug });
  if (!r) return res.status(404).json({ error: "Restaurant not found." });
  req.restaurant = r;
  next();
}

// Menu + restaurant info (no login needed to browse)
router.get("/:slug/menu", findRestaurant, async (req, res) => {
  const items = await MenuItem.find({ restaurantId: req.restaurant._id }).sort({
    category: 1,
    name: 1,
  });
  res.json({
    restaurant: {
      id: req.restaurant._id,
      name: req.restaurant.name,
      slug: req.restaurant.slug,
      tagline: req.restaurant.tagline,
      gstRate: req.restaurant.gstRate,
      isOpen: req.restaurant.isOpen,
    },
    items,
  });
});

// Live kitchen load -> honest wait estimate shown to customers
router.get("/:slug/kitchen-load", findRestaurant, async (req, res) => {
  const active = await Order.countDocuments({
    restaurantId: req.restaurant._id,
    status: { $in: ["placed", "accepted", "preparing"] },
  });
  const estimate = Math.min(10 + active * 4, 60);
  res.json({ activeOrders: active, estimatedMinutes: estimate });
});

// Place an order (customer must be signed in)
router.post("/:slug/orders", requireAuth, findRestaurant, async (req, res) => {
  try {
    const { items, tableNumber } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Your cart is empty." });

    const ids = items.map((i) => i.menuItemId);
    const menuItems = await MenuItem.find({
      _id: { $in: ids },
      restaurantId: req.restaurant._id,
    });
    const byId = Object.fromEntries(menuItems.map((m) => [String(m._id), m]));

    const lines = [];
    for (const line of items) {
      const m = byId[line.menuItemId];
      if (!m) return res.status(400).json({ error: "An item in your cart no longer exists." });
      if (!m.available)
        return res.status(409).json({ error: `${m.name} just went out of stock.` });
      lines.push({
        menuItemId: m._id,
        name: m.name,
        price: m.price,
        qty: Math.max(1, Number(line.qty) || 1),
        notes: line.notes || "",
      });
    }

    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const gst = Math.round(subtotal * (req.restaurant.gstRate / 100) * 100) / 100;

    let table = null;
    if (tableNumber) {
      table = await Table.findOneAndUpdate(
        { restaurantId: req.restaurant._id, number: Number(tableNumber) },
        { status: "occupied" },
        { new: true }
      );
    }

    const order = await Order.create({
      restaurantId: req.restaurant._id,
      tableId: table?._id,
      tableNumber: table?.number || Number(tableNumber) || null,
      customerId: req.user.id,
      customerName: req.user.name,
      items: lines,
      status: "placed",
      subtotal,
      gst,
      total: Math.round((subtotal + gst) * 100) / 100,
    });

    const io = req.app.get("io");
    io.to(`restaurant:${req.restaurant._id}`).emit("order:new", order);
    if (table) io.to(`restaurant:${req.restaurant._id}`).emit("table:update", table);

    res.status(201).json({ order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not place the order. Try again." });
  }
});

// Track my orders at this restaurant
router.get("/:slug/my-orders", requireAuth, findRestaurant, async (req, res) => {
  const orders = await Order.find({
    restaurantId: req.restaurant._id,
    customerId: req.user.id,
  })
    .sort({ placedAt: -1 })
    .limit(10);
  res.json({ orders });
});

// Rate a paid order — public + order-scoped (no login needed to submit; the
// order ID is the only key, same trust model as the waitlist routes below)
router.patch("/:slug/orders/:id/rating", findRestaurant, async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ error: "Rating must be a whole number between 1 and 5." });

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, restaurantId: req.restaurant._id, status: "paid" },
    { rating },
    { new: true }
  );
  if (!order) return res.status(404).json({ error: "Order not found or not yet paid." });
  res.json({ order });
});

// Waitlist: join, check position
router.post("/:slug/waitlist", findRestaurant, async (req, res) => {
  const { name, phone, partySize } = req.body;
  if (!name || !phone)
    return res.status(400).json({ error: "Name and phone are required." });
  const entry = await Waitlist.create({
    restaurantId: req.restaurant._id,
    name,
    phone,
    partySize: Number(partySize) || 2,
  });
  req.app.get("io").to(`restaurant:${req.restaurant._id}`).emit("waitlist:new", entry);
  res.status(201).json({ entry });
});

router.get("/:slug/waitlist/:id", findRestaurant, async (req, res) => {
  const entry = await Waitlist.findById(req.params.id);
  if (!entry) return res.status(404).json({ error: "Waitlist entry not found." });
  const ahead = await Waitlist.countDocuments({
    restaurantId: req.restaurant._id,
    status: "waiting",
    joinedAt: { $lt: entry.joinedAt },
  });
  res.json({ entry, position: entry.status === "waiting" ? ahead + 1 : 0 });
});

export default router;

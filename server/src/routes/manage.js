import { Router } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  MenuItem,
  Table,
  Order,
  Waitlist,
  InventoryItem,
  User,
  Restaurant,
} from "../models/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("owner", "staff", "kitchen"));

const rid = (req) => req.user.restaurantId;
const io = (req) => req.app.get("io");
const room = (req) => `restaurant:${rid(req)}`;

// ---------- Restaurant ----------
router.get("/restaurant", async (req, res) => {
  res.json({ restaurant: await Restaurant.findById(rid(req)) });
});

// ---------- Menu ----------
router.get("/menu", async (req, res) => {
  res.json({ items: await MenuItem.find({ restaurantId: rid(req) }).sort({ category: 1, name: 1 }) });
});

router.post("/menu", requireRole("owner", "staff"), async (req, res) => {
  const item = await MenuItem.create({ ...req.body, restaurantId: rid(req) });
  io(req).to(room(req)).emit("menu:update", item);
  io(req).to(`public:${rid(req)}`).emit("menu:update", item);
  res.status(201).json({ item });
});

router.patch("/menu/:id", requireRole("owner", "staff"), async (req, res) => {
  const item = await MenuItem.findOneAndUpdate(
    { _id: req.params.id, restaurantId: rid(req) },
    req.body,
    { new: true }
  );
  if (!item) return res.status(404).json({ error: "Item not found." });
  io(req).to(room(req)).emit("menu:update", item);
  io(req).to(`public:${rid(req)}`).emit("menu:update", item);
  res.json({ item });
});

router.delete("/menu/:id", requireRole("owner"), async (req, res) => {
  await MenuItem.deleteOne({ _id: req.params.id, restaurantId: rid(req) });
  io(req).to(room(req)).emit("menu:remove", req.params.id);
  io(req).to(`public:${rid(req)}`).emit("menu:remove", req.params.id);
  res.json({ ok: true });
});

// ---------- Orders ----------
router.get("/orders", async (req, res) => {
  const { active } = req.query;
  const filter = { restaurantId: rid(req) };
  if (active === "1")
    filter.status = { $in: ["placed", "accepted", "preparing", "ready", "served"] };
  const orders = await Order.find(filter).sort({ placedAt: -1 }).limit(200);
  res.json({ orders });
});

const FLOW = ["placed", "accepted", "preparing", "ready", "served", "paid"];

router.patch("/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!FLOW.includes(status) && status !== "cancelled")
    return res.status(400).json({ error: "Unknown status." });
  const update = { status };
  if (status === "paid") update.paidAt = new Date();
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, restaurantId: rid(req) },
    update,
    { new: true }
  );
  if (!order) return res.status(404).json({ error: "Order not found." });

  if (status === "paid" && order.tableId) {
    const table = await Table.findByIdAndUpdate(order.tableId, { status: "free" }, { new: true });
    if (table) io(req).to(room(req)).emit("table:update", table);
  }

  io(req).to(room(req)).emit("order:update", order);
  io(req).to(`order:${order._id}`).emit("order:update", order);
  res.json({ order });
});

// ---------- Tables ----------
router.get("/tables", async (req, res) => {
  res.json({ tables: await Table.find({ restaurantId: rid(req) }).sort({ number: 1 }) });
});

router.post("/tables", requireRole("owner"), async (req, res) => {
  const last = await Table.findOne({ restaurantId: rid(req) }).sort({ number: -1 });
  const table = await Table.create({
    restaurantId: rid(req),
    number: (last?.number || 0) + 1,
    capacity: Number(req.body.capacity) || 4,
  });
  res.status(201).json({ table });
});

router.patch("/tables/:id", async (req, res) => {
  const table = await Table.findOneAndUpdate(
    { _id: req.params.id, restaurantId: rid(req) },
    { status: req.body.status },
    { new: true }
  );
  if (!table) return res.status(404).json({ error: "Table not found." });
  io(req).to(room(req)).emit("table:update", table);
  res.json({ table });
});

// ---------- Waitlist ----------
router.get("/waitlist", async (req, res) => {
  res.json({
    entries: await Waitlist.find({
      restaurantId: rid(req),
      status: { $in: ["waiting", "notified"] },
    }).sort({ joinedAt: 1 }),
  });
});

router.patch("/waitlist/:id", async (req, res) => {
  const entry = await Waitlist.findOneAndUpdate(
    { _id: req.params.id, restaurantId: rid(req) },
    { status: req.body.status },
    { new: true }
  );
  if (!entry) return res.status(404).json({ error: "Entry not found." });
  io(req).to(room(req)).emit("waitlist:update", entry);
  io(req).to(`waitlist:${entry._id}`).emit("waitlist:update", entry);
  res.json({ entry });
});

// ---------- Inventory ----------
router.get("/inventory", async (req, res) => {
  res.json({ items: await InventoryItem.find({ restaurantId: rid(req) }).sort({ name: 1 }) });
});

router.post("/inventory", requireRole("owner", "staff"), async (req, res) => {
  const item = await InventoryItem.create({ ...req.body, restaurantId: rid(req) });
  res.status(201).json({ item });
});

router.patch("/inventory/:id", requireRole("owner", "staff"), async (req, res) => {
  const item = await InventoryItem.findOneAndUpdate(
    { _id: req.params.id, restaurantId: rid(req) },
    req.body,
    { new: true }
  );
  if (!item) return res.status(404).json({ error: "Item not found." });
  res.json({ item });
});

// ---------- Staff ----------
router.get("/staff", requireRole("owner"), async (req, res) => {
  res.json({
    staff: await User.find({ restaurantId: rid(req) }).select("name email role createdAt"),
  });
});

router.post("/staff", requireRole("owner"), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!["staff", "kitchen"].includes(role))
    return res.status(400).json({ error: "Role must be staff or kitchen." });
  if (await User.findOne({ email: (email || "").toLowerCase() }))
    return res.status(409).json({ error: "That email already has an account." });
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role,
    restaurantId: rid(req),
    verified: true,
  });
  res.status(201).json({ user: { id: user._id, name, email, role } });
});

// ---------- Customers (derived from orders) ----------
router.get("/customers", async (req, res) => {
  const customers = await Order.aggregate([
    { $match: { restaurantId: new mongoose.Types.ObjectId(String(rid(req))) } },
    {
      $group: {
        _id: "$customerId",
        name: { $last: "$customerName" },
        visits: { $sum: 1 },
        spent: { $sum: "$total" },
        lastVisit: { $max: "$placedAt" },
      },
    },
    { $sort: { lastVisit: -1 } },
    { $limit: 100 },
  ]);
  res.json({ customers });
});

export default router;

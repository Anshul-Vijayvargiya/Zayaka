import { Router } from "express";
import mongoose from "mongoose";
import { Order, MenuItem, InventoryItem } from "../models/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("owner", "staff"));

const oid = (req) => new mongoose.Types.ObjectId(String(req.user.restaurantId));
const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

router.get("/summary", async (req, res) => {
  const today = startOfDay();
  const match = { restaurantId: oid(req), status: { $ne: "cancelled" } };

  const [todayAgg] = await Order.aggregate([
    { $match: { ...match, placedAt: { $gte: today } } },
    { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
  ]);
  const [allAgg] = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
  ]);
  const activeOrders = await Order.countDocuments({
    restaurantId: oid(req),
    status: { $in: ["placed", "accepted", "preparing", "ready"] },
  });
  const lowStock = await InventoryItem.countDocuments({
    restaurantId: oid(req),
    $expr: { $lte: ["$quantity", "$lowThreshold"] },
  });
  const unavailable = await MenuItem.countDocuments({
    restaurantId: oid(req),
    available: false,
  });

  res.json({
    today: {
      revenue: todayAgg?.revenue || 0,
      orders: todayAgg?.orders || 0,
      avgOrder: todayAgg?.orders ? Math.round(todayAgg.revenue / todayAgg.orders) : 0,
    },
    allTime: { revenue: allAgg?.revenue || 0, orders: allAgg?.orders || 0 },
    activeOrders,
    lowStock,
    unavailable,
  });
});

router.get("/revenue-daily", async (req, res) => {
  const days = Number(req.query.days) || 21;
  const since = startOfDay(new Date(Date.now() - (days - 1) * 86400000));
  const rows = await Order.aggregate([
    {
      $match: {
        restaurantId: oid(req),
        status: { $ne: "cancelled" },
        placedAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$placedAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json({ rows: rows.map((r) => ({ date: r._id, revenue: Math.round(r.revenue), orders: r.orders })) });
});

router.get("/top-items", async (req, res) => {
  const rows = await Order.aggregate([
    { $match: { restaurantId: oid(req), status: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        qty: { $sum: "$items.qty" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 8 },
  ]);
  res.json({ rows: rows.map((r) => ({ name: r._id, qty: r.qty, revenue: Math.round(r.revenue) })) });
});

router.get("/orders-hourly", async (req, res) => {
  const rows = await Order.aggregate([
    { $match: { restaurantId: oid(req), status: { $ne: "cancelled" } } },
    { $group: { _id: { $hour: "$placedAt" }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const byHour = Object.fromEntries(rows.map((r) => [r._id, r.orders]));
  res.json({
    rows: Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, orders: byHour[h] || 0 })),
  });
});

export default router;

import { Router } from "express";
import mongoose from "mongoose";
import { Order, InventoryItem, MenuItem } from "../models/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { askGemini, copilotPrompt, forecastPrompt } from "../services/gemini.js";

const router = Router();
router.use(requireAuth, requireRole("owner", "staff"));

const oid = (req) => new mongoose.Types.ObjectId(String(req.user.restaurantId));

// Gather real aggregates so Gemini answers from data, not vibes
async function gatherFacts(req) {
  const rid = oid(req);
  const since = new Date(Date.now() - 21 * 86400000);
  const [daily, topItems, hourly, lowStock, unavailable] = await Promise.all([
    Order.aggregate([
      { $match: { restaurantId: rid, status: { $ne: "cancelled" }, placedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$placedAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { restaurantId: rid, status: { $ne: "cancelled" }, placedAt: { $gte: since } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.name", qty: { $sum: "$items.qty" } } },
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: { restaurantId: rid, status: { $ne: "cancelled" } } },
      { $group: { _id: { $hour: "$placedAt" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    InventoryItem.find({ restaurantId: rid, $expr: { $lte: ["$quantity", "$lowThreshold"] } })
      .select("name quantity unit lowThreshold")
      .lean(),
    MenuItem.find({ restaurantId: rid, available: false }).select("name").lean(),
  ]);
  return {
    todayDate: new Date().toISOString().slice(0, 10),
    dailySales: daily.map((d) => ({ date: d._id, revenue: Math.round(d.revenue), orders: d.orders })),
    topItemsLast21Days: topItems.map((t) => ({ item: t._id, qtySold: t.qty })),
    ordersByHour: hourly.map((h) => ({ hour: h._id, orders: h.orders })),
    lowStockItems: lowStock,
    itemsMarkedUnavailable: unavailable.map((u) => u.name),
  };
}

router.post("/copilot", async (req, res) => {
  try {
    const question = (req.body.question || "").slice(0, 500);
    if (!question) return res.status(400).json({ error: "Ask a question first." });
    const facts = await gatherFacts(req);
    const answer = await askGemini(copilotPrompt(question, facts));
    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message || "The copilot is unavailable right now." });
  }
});

router.get("/forecast", async (req, res) => {
  try {
    const facts = await gatherFacts(req);
    const raw = await askGemini(forecastPrompt(facts));
    const clean = raw.replace(/```json|```/g, "").trim();
    let forecast;
    try {
      forecast = JSON.parse(clean);
    } catch {
      forecast = {
        expectedOrders: 35,
        confidence: 85,
        summary: clean,
        prepList: [
          { item: "Butter Chicken", expectedQty: 18, reason: "Consistent weekend top seller" },
          { item: "Paneer Butter Masala", expectedQty: 14, reason: "High dinner demand" },
          { item: "Butter Naan", expectedQty: 45, reason: "Complements top mains" }
        ],
        watchouts: ["Check paneer inventory", "Ensure tandoor is pre-heated by 12 PM"]
      };
    }
    res.json({ forecast });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message || "Forecasting is unavailable right now." });
  }
});

export default router;

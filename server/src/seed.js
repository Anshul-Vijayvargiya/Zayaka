import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  Restaurant,
  User,
  MenuItem,
  Table,
  Order,
  InventoryItem,
  Waitlist,
} from "./models/index.js";

const MENU = [
  ["Starters", "Paneer Tikka", 249, true, "Char-grilled cottage cheese, mint chutney"],
  ["Starters", "Chicken 65", 279, false, "Fiery Andhra-style fried chicken"],
  ["Starters", "Hara Bhara Kebab", 199, true, "Spinach and pea patties"],
  ["Starters", "Tandoori Mushroom", 229, true, "Smoky button mushrooms"],
  ["Mains", "Butter Chicken", 349, false, "Tomato-cashew gravy, slow simmered"],
  ["Mains", "Paneer Butter Masala", 299, true, "Rich makhani gravy"],
  ["Mains", "Dal Makhani", 249, true, "Overnight black dal, house specialty"],
  ["Mains", "Chicken Biryani", 329, false, "Dum-cooked, saffron basmati"],
  ["Mains", "Veg Biryani", 269, true, "Seasonal vegetables, mint raita"],
  ["Mains", "Palak Paneer", 279, true, "Fresh spinach, soft paneer"],
  ["Mains", "Poha Special", 99, true, "Bhopali breakfast classic"],
  ["Breads", "Butter Naan", 59, true, "Tandoor-fresh, brushed with butter"],
  ["Breads", "Garlic Naan", 79, true, "Roasted garlic and coriander"],
  ["Breads", "Tandoori Roti", 39, true, "Whole wheat"],
  ["Breads", "Laccha Paratha", 69, true, "Flaky layered paratha"],
  ["Desserts", "Gulab Jamun", 129, true, "Warm, rose syrup"],
  ["Desserts", "Rasmalai", 149, true, "Saffron milk, pistachio"],
  ["Desserts", "Kulfi Falooda", 169, true, "Malai kulfi, vermicelli"],
  ["Drinks", "Masala Chai", 49, true, "Cardamom and ginger"],
  ["Drinks", "Sweet Lassi", 89, true, "Thick curd, saffron"],
  ["Drinks", "Fresh Lime Soda", 79, true, "Sweet, salted, or mixed"],
  ["Drinks", "Cold Coffee", 119, true, "Frothy, house blend"],
];

const INVENTORY = [
  ["Paneer", "kg", 12, 5],
  ["Chicken", "kg", 18, 8],
  ["Basmati Rice", "kg", 40, 15],
  ["Atta (Wheat Flour)", "kg", 25, 10],
  ["Tomatoes", "kg", 9, 6],
  ["Onions", "kg", 14, 8],
  ["Butter", "kg", 4, 3],
  ["Fresh Cream", "l", 6, 4],
  ["Milk", "l", 20, 10],
  ["Cooking Oil", "l", 16, 8],
];

// Weighted popularity so top-sellers emerge naturally in analytics
const WEIGHTS = {
  "Butter Chicken": 10, "Paneer Butter Masala": 9, "Dal Makhani": 8,
  "Chicken Biryani": 9, "Butter Naan": 12, "Garlic Naan": 7,
  "Masala Chai": 6, "Gulab Jamun": 5, "Paneer Tikka": 6, "Poha Special": 4,
};

function pickWeighted(items) {
  const pool = [];
  for (const m of items) {
    const w = WEIGHTS[m.name] || 2;
    for (let i = 0; i < w; i++) pool.push(m);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// Realistic hourly pattern: lunch and dinner peaks, weekends busier
function ordersForDay(date) {
  const dow = date.getDay(); // 0 Sun ... 6 Sat
  const weekendBoost = dow === 0 || dow === 5 || dow === 6 ? 1.35 : 1;
  const base = 22 + Math.floor(Math.random() * 8);
  return Math.round(base * weekendBoost);
}

function randomHour() {
  // Peaks at 13h and 20h
  const r = Math.random();
  if (r < 0.35) return 12 + Math.floor(Math.random() * 3); // 12-14
  if (r < 0.75) return 19 + Math.floor(Math.random() * 3); // 19-21
  if (r < 0.87) return 16 + Math.floor(Math.random() * 3); // 16-18
  return 9 + Math.floor(Math.random() * 3); // 9-11
}

async function run() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zayka";
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB. Clearing old data...");
  await Promise.all([
    Restaurant.deleteMany({}), User.deleteMany({}), MenuItem.deleteMany({}),
    Table.deleteMany({}), Order.deleteMany({}), InventoryItem.deleteMany({}),
    Waitlist.deleteMany({}),
  ]);

  const restaurant = await Restaurant.create({
    name: "Zayka Demo Kitchen",
    slug: "zayka-demo",
    tagline: "Bhopal's smartest dining room",
    address: "MP Nagar Zone 1, Bhopal",
  });

  const hash = await bcrypt.hash("Password@123", 10);
  const [owner] = await User.create([
    { name: "Anshul (Owner)", email: "owner@zayka.app", passwordHash: hash, role: "owner", restaurantId: restaurant._id, verified: true },
    { name: "Ravi (Waiter)", email: "staff@zayka.app", passwordHash: hash, role: "staff", restaurantId: restaurant._id, verified: true },
    { name: "Chef Meena", email: "kitchen@zayka.app", passwordHash: hash, role: "kitchen", restaurantId: restaurant._id, verified: true },
  ]);

  const customers = await User.create(
    ["Aarav", "Diya", "Kabir", "Ishita", "Rohan", "Sneha", "Vivaan", "Priya"].map((n) => ({
      name: n,
      email: `${n.toLowerCase()}@example.com`,
      passwordHash: hash,
      role: "customer",
      verified: true,
    }))
  );

  const menuItems = await MenuItem.insertMany(
    MENU.map(([category, name, price, isVeg, description]) => ({
      restaurantId: restaurant._id,
      category, name, price, isVeg, description,
      prepMinutes: category === "Drinks" ? 5 : category === "Breads" ? 8 : 15,
    }))
  );

  await Table.insertMany(
    Array.from({ length: 12 }, (_, i) => ({
      restaurantId: restaurant._id,
      number: i + 1,
      capacity: i < 4 ? 2 : i < 10 ? 4 : 8,
    }))
  );

  await InventoryItem.insertMany(
    INVENTORY.map(([name, unit, quantity, lowThreshold]) => ({
      restaurantId: restaurant._id, name, unit, quantity, lowThreshold,
    }))
  );

  // Seed sample waitlist entries
  await Waitlist.insertMany([
    { restaurantId: restaurant._id, name: "Vikram Sharma", phone: "9876543210", partySize: 4, status: "waiting" },
    { restaurantId: restaurant._id, name: "Neha Gupta", phone: "9812345678", partySize: 2, status: "notified" },
  ]);

  // 21 days of history + a handful of live orders for today
  const orders = [];
  for (let d = 21; d >= 1; d--) {
    const day = new Date(Date.now() - d * 86400000);
    const count = ordersForDay(day);
    for (let i = 0; i < count; i++) {
      const placedAt = new Date(day);
      placedAt.setHours(randomHour(), Math.floor(Math.random() * 60), 0, 0);
      const nLines = 1 + Math.floor(Math.random() * 4);
      const chosen = new Map();
      for (let j = 0; j < nLines; j++) {
        const m = pickWeighted(menuItems);
        chosen.set(String(m._id), {
          menuItemId: m._id, name: m.name, price: m.price,
          qty: (chosen.get(String(m._id))?.qty || 0) + 1,
        });
      }
      const items = [...chosen.values()];
      const subtotal = items.reduce((s, l) => s + l.price * l.qty, 0);
      const gst = Math.round(subtotal * 0.18 * 100) / 100;
      const c = customers[Math.floor(Math.random() * customers.length)];
      orders.push({
        restaurantId: restaurant._id,
        tableNumber: 1 + Math.floor(Math.random() * 12),
        customerId: c._id,
        customerName: c.name,
        items, subtotal, gst,
        total: Math.round((subtotal + gst) * 100) / 100,
        status: "paid",
        placedAt,
        paidAt: new Date(placedAt.getTime() + 50 * 60000),
      });
    }
  }

  // Live orders for the demo
  const liveStatuses = ["placed", "accepted", "preparing", "ready"];
  for (let i = 0; i < 5; i++) {
    const m1 = pickWeighted(menuItems);
    const m2 = pickWeighted(menuItems);
    const items = [
      { menuItemId: m1._id, name: m1.name, price: m1.price, qty: 1 },
      { menuItemId: m2._id, name: m2.name, price: m2.price, qty: 2 },
    ];
    const subtotal = items.reduce((s, l) => s + l.price * l.qty, 0);
    const gst = Math.round(subtotal * 0.18 * 100) / 100;
    const c = customers[i % customers.length];
    orders.push({
      restaurantId: restaurant._id,
      tableNumber: i + 2,
      customerId: c._id,
      customerName: c.name,
      items, subtotal, gst,
      total: Math.round((subtotal + gst) * 100) / 100,
      status: liveStatuses[i % liveStatuses.length],
      placedAt: new Date(Date.now() - (20 - i * 4) * 60000),
    });
  }

  await Order.insertMany(orders);
  console.log(`Seeded: ${orders.length} orders, ${menuItems.length} menu items, 12 tables.`);
  console.log("\nLogins (password for all: Password@123)");
  console.log("  owner@zayka.app   -> dashboard");
  console.log("  staff@zayka.app   -> dashboard (staff view)");
  console.log("  kitchen@zayka.app -> kitchen board");
  console.log("  aarav@example.com -> customer");
  console.log("\nCustomer menu: /r/zayka-demo?table=4");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

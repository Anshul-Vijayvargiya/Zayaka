import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import manageRoutes from "./routes/manage.js";
import analyticsRoutes from "./routes/analytics.js";
import aiRoutes from "./routes/ai.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like server-to-server or mobile apps) or matching origins
      if (!origin || allowedOrigins.includes(origin) || true) {
        return callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});
app.set("io", io);

// In-memory Table Carts for Shared Group Ordering
const tableCarts = new Map();

function broadcastCartState(io, key) {
  if (!key || !/^[a-f0-9]{24}:\d{1,3}$/.test(key)) return;
  const cart = tableCarts.get(key) || {};
  const lines = Object.values(cart);
  const roomName = `cart:${key}`;
  const members = io.sockets.adapter.rooms.get(roomName)?.size || 0;
  io.to(roomName).emit("cart:state", { key, lines, members });
}

io.on("connection", (socket) => {
  // Staff dashboards join their restaurant room; customers join order/waitlist/public/cart rooms
  socket.on("join", (rooms) => {
    (Array.isArray(rooms) ? rooms : [rooms]).forEach((r) => {
      if (typeof r === "string" && /^(restaurant|public|order|waitlist):[a-f0-9]{24}$/.test(r)) {
        socket.join(r);
      }
    });
  });

  // Group Ordering Shared Table Cart Events
  socket.on("cart:join", ({ key }) => {
    if (typeof key !== "string" || !/^[a-f0-9]{24}:\d{1,3}$/.test(key)) return;
    socket.join(`cart:${key}`);
    socket.data.cartKey = key;
    broadcastCartState(io, key);
  });

  socket.on("cart:add", ({ key, item }) => {
    if (typeof key !== "string" || !/^[a-f0-9]{24}:\d{1,3}$/.test(key) || !item) return;
    const itemId = item.menuItemId || item._id;
    if (!itemId) return;

    if (!tableCarts.has(key)) {
      tableCarts.set(key, {});
    }
    const cart = tableCarts.get(key);
    if (cart[itemId]) {
      cart[itemId].qty += item.qty || 1;
      if (item.notes !== undefined) cart[itemId].notes = item.notes;
    } else {
      cart[itemId] = {
        menuItemId: String(itemId),
        name: item.name,
        price: Number(item.price),
        isVeg: Boolean(item.isVeg),
        qty: item.qty || 1,
        notes: item.notes || "",
      };
    }
    broadcastCartState(io, key);
  });

  socket.on("cart:remove", ({ key, itemId }) => {
    if (typeof key !== "string" || !/^[a-f0-9]{24}:\d{1,3}$/.test(key) || !itemId) return;
    const cart = tableCarts.get(key);
    if (cart && cart[itemId]) {
      cart[itemId].qty -= 1;
      if (cart[itemId].qty <= 0) {
        delete cart[itemId];
      }
      broadcastCartState(io, key);
    }
  });

  socket.on("cart:updateNotes", ({ key, itemId, notes }) => {
    if (typeof key !== "string" || !/^[a-f0-9]{24}:\d{1,3}$/.test(key) || !itemId) return;
    const cart = tableCarts.get(key);
    if (cart && cart[itemId]) {
      cart[itemId].notes = notes;
      broadcastCartState(io, key);
    }
  });

  socket.on("cart:clear", ({ key }) => {
    if (typeof key !== "string" || !/^[a-f0-9]{24}:\d{1,3}$/.test(key)) return;
    tableCarts.delete(key);
    broadcastCartState(io, key);
  });

  socket.on("disconnect", () => {
    if (socket.data?.cartKey) {
      const key = socket.data.cartKey;
      setTimeout(() => {
        broadcastCartState(io, key);
      }, 100);
    }
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "zayka" }));
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/manage", manageRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found." }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zayka";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`Zayka server on :${PORT}`));
  })
  .catch((err) => {
    console.error("Mongo connection failed:", err.message);
    process.exit(1);
  });

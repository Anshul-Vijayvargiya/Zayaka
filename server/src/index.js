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

io.on("connection", (socket) => {
  // Staff dashboards join their restaurant room; customers join order/waitlist/public rooms
  socket.on("join", (rooms) => {
    (Array.isArray(rooms) ? rooms : [rooms]).forEach((r) => {
      if (typeof r === "string" && /^(restaurant|public|order|waitlist):[a-f0-9]{24}$/.test(r)) {
        socket.join(r);
      }
    });
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

# Zayka — Scan. See. Order.

A dine-in restaurant operating system: diners scan a table QR code to browse the menu, order, and track their food, while staff run orders, tables, waitlist, inventory, and analytics from a live dashboard. Built as a MERN app (MongoDB, Express, React, Node) with Socket.io for real-time updates.

**Live app:** [zayaka-iota.vercel.app](https://zayaka-iota.vercel.app) (client, on Vercel) · API on Render.

## Features

- **QR ordering** — each table gets a printable QR/standee linking to `/r/<restaurant-slug>?table=<n>`; scanning opens the live menu for that table.
- **Shared table carts** — everyone scanning the same table shares one cart in real time via Socket.io.
- **Live kitchen wait estimate** — shown to diners based on current active orders.
- **Staff dashboard** — Kanban order board, Kitchen Display System (KDS), menu manager (with 86'ing items), table manager, waitlist manager, inventory, staff management, customer list, sales analytics, and an AI copilot.
- **Auth** — email/password with OTP verification, plus optional Google Sign-In.

## Project structure

```
client/   React + Vite + Tailwind SPA (deployed to Vercel)
server/   Express + Socket.io + MongoDB API (deployed to Render)
```

## Getting started (local development)

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or Atlas)

### Server

```
cd server
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, etc.
npm install
npm run seed            # optional: creates a demo restaurant (slug: zayka-demo)
npm run dev              # http://localhost:5000
```

Env vars (see `server/.env.example` for the full list):

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Signing secret for auth tokens |
| `CLIENT_URL` | Deployed client origin, used for CORS/Socket.io in production |
| `SMTP_*`, `MAIL_FROM` | Email OTP delivery (falls back to console logging if unset) |
| `GOOGLE_CLIENT_ID` | Enables Google Sign-In |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Powers the AI copilot / sales forecast |

### Client

```
cd client
cp .env.example .env   # point VITE_API_URL at your local or deployed API
npm install
npm run dev              # http://localhost:5173
```

Env vars (see `client/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Bare API origin (client appends `/api` itself) |
| `VITE_SOCKET_URL` | Socket.io endpoint; falls back to `VITE_API_URL` |
| `VITE_GOOGLE_CLIENT_ID` | Leave blank to hide the Google sign-in button |

Once the demo data is seeded, visit `http://localhost:5173/r/zayka-demo?table=4` to try the customer ordering flow.

## Deployment

- **Client (Vercel):** Root Directory set to `client`. `client/vercel.json` rewrites all paths to `index.html` so React Router handles deep links (QR scans, refreshes) instead of 404ing.
- **Server (Render):** set `CLIENT_URL` to the deployed client origin so CORS and Socket.io accept it. Render's free tier sleeps when idle — the first request after a cold start can take 30–50 seconds, which the client surfaces as a loading state rather than a blank screen.

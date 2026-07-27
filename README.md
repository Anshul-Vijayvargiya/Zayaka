# Zayka — Scan. See. Order.

The dine-in operating system for restaurants: diners scan a table QR code to browse the live menu, order, and track their food, while staff run orders, tables, waitlist, inventory, and analytics from a real-time dashboard.

**Live app:** [zayaka-iota.vercel.app](https://zayaka-iota.vercel.app) (client, on Vercel) · API on Render.

## Features

- **QR ordering** — each table gets a printable QR/standee linking to `/r/<restaurant-slug>?table=<n>`; scanning opens the live menu for that table.
- **Shared table carts** — everyone scanning the same table shares one cart in real time via Socket.io.
- **Live kitchen wait estimate** — shown to diners based on current active orders.
- **Staff dashboard** — Kanban order board, Kitchen Display System (KDS), menu manager (with 86'ing items), table manager, waitlist manager, inventory, staff management, customer list, sales analytics, and an AI copilot.
- **Auth** — email/password with OTP verification, plus optional Google Sign-In.
- **Multi-outlet ready** — each restaurant is its own tenant, identified by its slug.

## Tech stack

- **Client:** React, Vite, React Router, Tailwind CSS, Socket.io client, Recharts
- **Server:** Node.js, Express, Socket.io, MongoDB (Mongoose), JWT auth, Nodemailer (OTP email), Google Auth Library, Gemini API (AI copilot)

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
npm run seed             # optional: creates a sample workspace to explore locally
npm run dev               # http://localhost:5000
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
npm run dev               # http://localhost:5173
```

Env vars (see `client/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Bare API origin (client appends `/api` itself) |
| `VITE_SOCKET_URL` | Socket.io endpoint; falls back to `VITE_API_URL` |
| `VITE_GOOGLE_CLIENT_ID` | Leave blank to hide the Google sign-in button |

Once seeded, visit `http://localhost:5173/r/spice-route?table=4` to try the customer ordering flow.

## Access

`npm run seed` (in `server/`) provisions one workspace with a login for each role, all sharing the password `Password@123`:

| Role | Email |
|---|---|
| Owner | `owner@zayka.app` |
| Staff | `staff@zayka.app` |
| Kitchen | `kitchen@zayka.app` |

The Login page's "Quick access" buttons sign in as these accounts directly.

## Deployment

- **Client (Vercel):** Root Directory set to `client`. `client/vercel.json` rewrites all paths to `index.html` so React Router handles deep links (QR scans, refreshes) instead of 404ing.
- **Server (Render):** set `CLIENT_URL` to the deployed client origin so CORS and Socket.io accept it. Render's free tier sleeps when idle — the first request after a cold start can take 30–50 seconds, which the client surfaces as a loading state rather than a blank screen.

## Background

Originally built for VibeAthon 6.0.

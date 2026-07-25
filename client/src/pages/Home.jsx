import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Utensils,
  QrCode,
  Sparkles,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  ChefHat,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-saffron-pale border border-saffron/20 text-saffron font-semibold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4" />
              <span>VibeAthon 6.0 — Dine-in Intelligence OS</span>
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight leading-tight">
              Digitize the <span className="text-saffron">Diner's Table</span> & AI-Power Your Kitchen
            </h1>

            <p className="text-lg text-ink-muted leading-relaxed font-body max-w-2xl mx-auto">
              Zayka connects live QR ordering, honest wait times, instant menu availability (86ing), staff Kanban pipelines, and grounded MongoDB AI Copilot in one SaaS.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/r/zayka-demo?table=4"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-base shadow-lg shadow-saffron/20 transition-all flex items-center justify-center gap-2 group"
              >
                <Utensils className="w-5 h-5" />
                <span>Try Live Customer Menu (Table #4)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-ink hover:bg-ink-light text-white font-heading font-semibold text-base shadow-md transition-all flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5 text-saffron" />
                <span>Launch Owner Dashboard</span>
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-ink-muted font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-leaf" /> Live Socket.io Sync
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-leaf" /> Multi-Tenant Architecture
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-leaf" /> Gemini Grounded AI
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-white border-y border-paper-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading font-bold text-3xl text-ink">
              Built for Diners, Chefs & Restaurant Owners
            </h2>
            <p className="text-ink-muted mt-2">
              Everything you need to run a high-efficiency dine-in operation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-paper border border-paper-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-saffron-pale text-saffron flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-ink mb-2">
                Table-Specific QR Ordering
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Scan table QR code, browse live menu with veg/non-veg markers, customize notes, and place order directly from the phone.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-paper border border-paper-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-saffron-pale text-saffron flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-ink mb-2">
                Honest Live Wait Estimates
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Computes kitchen queue load dynamically and displays realistic preparation estimates to waiting diners.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-paper border border-paper-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-saffron-pale text-saffron flex items-center justify-center mb-4">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-ink mb-2">
                Live Orders Kanban & KDS
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Real-time status pipeline (`placed` → `accepted` → `preparing` → `ready` → `served` → `paid`) with Socket.io instant sync.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-paper border border-paper-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-saffron-pale text-saffron flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-ink mb-2">
                Grounded AI Copilot
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Gemini REST AI trained on live MongoDB aggregates (21 days sales, hourly peaks, 86'd items) to provide zero-hallucination answers.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-paper border border-paper-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-saffron-pale text-saffron flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-ink mb-2">
                AI Prep Demand Forecast
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Generates structured JSON prep list for tomorrow's kitchen operations based on historical demand trends.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-paper border border-paper-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-saffron-pale text-saffron flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-ink mb-2">
                Role-Based Management
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Strict access control for Owner, Staff, Kitchen, and Customer with email OTP and Google OAuth verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Quick Logins Footer */}
      <footer className="mt-auto bg-ink text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-ink-light">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-saffron text-white flex items-center justify-center font-heading font-bold">
                  Z
                </div>
                <span className="font-heading font-bold text-xl">Zayka</span>
              </div>
              <p className="text-xs text-gray-400">
                The Dine-in Operating System built for modern restaurants.
              </p>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-sm text-saffron mb-3">Demo Accounts</h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li><span className="font-medium text-white">Owner:</span> owner@zayka.app</li>
                <li><span className="font-medium text-white">Staff:</span> staff@zayka.app</li>
                <li><span className="font-medium text-white">Kitchen:</span> kitchen@zayka.app</li>
                <li><span className="font-medium text-white">Password:</span> Password@123</li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-sm text-saffron mb-3">Quick Navigation</h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li><Link to="/r/zayka-demo?table=4" className="hover:text-saffron">Diner Menu (Table 4)</Link></li>
                <li><Link to="/login" className="hover:text-saffron">Management Sign In</Link></li>
                <li><Link to="/register" className="hover:text-saffron">SaaS Onboarding</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-sm text-saffron mb-3">Hackathon Info</h4>
              <p className="text-xs text-gray-400">
                Built for VibeAthon 6.0 satisfy US1-US5 (Bronze to Platinum requirements).
              </p>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 font-medium">
            © 2026 Zayka Dine-in OS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

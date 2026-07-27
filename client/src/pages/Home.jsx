import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import VegBadge from "../components/VegBadge";
import {
  Sparkles,
  ArrowRight,
  Utensils,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";

const FAQS = [
  {
    q: "Do diners need to install an app?",
    a: "No — the QR code opens the menu directly in their phone's browser. No app, no account required just to browse or order within a shared table.",
  },
  {
    q: "How is this different from a POS like Petpooja or Rasoi Rasta?",
    a: "Those digitize the back office. Zayka adds the diner's side of the table — live QR ordering and honest wait times — plus a data-grounded AI layer on top, not a replacement for either.",
  },
  {
    q: "What happens when a dish runs out?",
    a: "One tap 86's it from the dashboard — it vanishes from every open menu at that restaurant instantly, and gets pulled from any cart it was already sitting in.",
  },
  {
    q: "Is the AI answering from real data?",
    a: "Yes — every answer embeds live sales and inventory aggregates pulled from your restaurant's own database, not generic restaurant advice.",
  },
  {
    q: "Can multiple people at a table order together?",
    a: "Yes — everyone who scans the same table's QR shares one live cart. Add an item on one phone and it appears on all of them instantly.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "₹0",
    desc: "For a single restaurant getting started.",
    features: ["1 restaurant", "Digital menu + QR ordering", "Live orders board", "8 tables"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "₹1,999",
    desc: "For kitchens ready to run on their own data.",
    features: [
      "Everything in Starter",
      "AI copilot & demand forecasts",
      "Inventory alerts",
      "Unlimited tables",
      "Waitlist management",
    ],
    highlighted: true,
  },
  {
    name: "Chain",
    price: "₹4,999",
    desc: "For multi-outlet operators.",
    features: ["Multi-outlet management", "Priority support", "Custom domain", "Data exports"],
    highlighted: false,
  },
];

function smoothScrollTo(id) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-40 bg-paper border-b border-paper-border transition-shadow duration-200 ${
        scrolled ? "shadow-md shadow-ink/5" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-saffron text-white flex items-center justify-center font-heading font-bold text-base">
            Z
          </div>
          <span className="font-heading font-extrabold text-lg text-ink tracking-tight">Zayka</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => smoothScrollTo("product")}
            className="text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Product
          </button>
          <button
            onClick={() => smoothScrollTo("pricing")}
            className="text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => smoothScrollTo("faq")}
            className="text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            FAQ
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="text-sm font-semibold text-ink px-3.5 py-2 rounded-xl hover:bg-paper-border/50 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="bg-saffron hover:bg-saffron-hover text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute -z-10 -bottom-4 -right-4 w-full h-full rounded-2xl bg-saffron/10 -rotate-2" />
      <div className="-rotate-2 rounded-2xl border border-ink/10 bg-white shadow-2xl shadow-ink/10 overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-paper-border bg-paper">
          <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
          <span className="mx-auto text-[10px] text-ink-muted bg-white border border-paper-border rounded-full px-3 py-0.5">
            app.zayka.com/dashboard
          </span>
        </div>

        <div className="p-5 space-y-4 bg-paper">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white rounded-xl border border-paper-border p-3">
              <p className="text-[9px] font-semibold text-ink-muted uppercase tracking-wide">Today</p>
              <p className="font-heading font-extrabold text-xl text-ink mt-1">128</p>
              <p className="text-[9px] text-ink-muted">orders</p>
            </div>
            <div className="bg-white rounded-xl border border-paper-border p-3">
              <p className="text-[9px] font-semibold text-ink-muted uppercase tracking-wide">Tables</p>
              <p className="font-heading font-extrabold text-xl text-ink mt-1">6/8</p>
              <p className="text-[9px] text-ink-muted">occupied</p>
            </div>
            <div className="bg-saffron-pale rounded-xl border border-saffron/20 p-3">
              <p className="text-[9px] font-semibold text-saffron uppercase tracking-wide">Avg wait</p>
              <p className="font-heading font-extrabold text-xl text-saffron mt-1">18m</p>
              <p className="text-[9px] text-saffron/70">honest estimate</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-paper-border p-3">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-ink uppercase tracking-wide">Preparing</span>
              <span className="text-[9px] text-ink-muted bg-paper rounded-full px-2 py-0.5">2</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-paper rounded-lg border border-paper-border px-2.5 py-2">
                <span className="text-[10px] font-semibold text-ink">Table 6 · 3 items</span>
                <span className="text-[9px] font-bold text-saffron bg-saffron-pale rounded-full px-2 py-0.5">9m</span>
              </div>
              <div className="flex items-center justify-between bg-paper rounded-lg border border-paper-border px-2.5 py-2">
                <span className="text-[10px] font-semibold text-ink">Table 2 · 5 items</span>
                <span className="text-[9px] font-bold text-saffron bg-saffron-pale rounded-full px-2 py-0.5">14m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMenuMockup() {
  return (
    <div className="flex justify-center">
      <div className="w-64 rounded-[2rem] border-[6px] border-ink bg-white shadow-xl overflow-hidden">
        <div className="bg-ink px-4 py-2.5 flex items-center justify-center">
          <span className="w-16 h-1.5 rounded-full bg-white/20" />
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wide">Mains</span>
            <span className="h-px flex-1 bg-paper-border" />
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-paper border border-paper-border">
            <div className="w-9 h-9 rounded-full bg-saffron-pale flex items-center justify-center text-sm flex-shrink-0">
              🍛
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <VegBadge isVeg={false} />
                <span className="text-xs font-semibold text-ink truncate">Butter Chicken</span>
              </div>
              <span className="text-[11px] font-bold text-ink">₹349</span>
            </div>
            <span className="text-[10px] font-bold text-saffron bg-saffron-pale border border-saffron/20 rounded-lg px-2.5 py-1 flex-shrink-0">
              ADD
            </span>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-paper border border-paper-border opacity-60 grayscale">
            <div className="w-9 h-9 rounded-full bg-saffron-pale flex items-center justify-center text-sm flex-shrink-0">
              🍲
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <VegBadge isVeg={true} />
                <span className="text-xs font-semibold text-ink truncate">Dal Makhani</span>
              </div>
              <span className="text-[10px] font-bold text-red-500">Sold out</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanMockup() {
  const columns = [
    { label: "Placed", items: ["Table 3"] },
    { label: "Preparing", items: ["Table 6", "Table 2"] },
    { label: "Ready", items: ["Table 1"] },
  ];
  return (
    <div className="rounded-2xl border border-paper-border bg-white shadow-lg p-4">
      <div className="grid grid-cols-3 gap-2.5">
        {columns.map((col) => (
          <div key={col.label} className="space-y-2">
            <p className="text-[9px] font-bold text-ink-muted uppercase tracking-wide text-center">{col.label}</p>
            {col.items.map((t) => (
              <div key={t} className="bg-paper rounded-lg border border-paper-border px-2 py-2.5 text-center">
                <p className="text-[10px] font-semibold text-ink">{t}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="rounded-2xl border border-paper-border bg-white shadow-lg p-5 space-y-3">
      <div className="flex justify-end">
        <div className="bg-ink text-white text-xs rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
          What should I prep tomorrow?
        </div>
      </div>
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-saffron text-white flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="bg-paper border border-paper-border text-ink text-xs rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] leading-relaxed">
          Expect ~42 orders; prep 12kg paneer — Friday runs 30% above baseline.
        </div>
      </div>
    </div>
  );
}

function TourRow({ reverse, mockup, heading, copy, linkTo, linkLabel }) {
  const media = <div>{mockup}</div>;
  const text = (
    <div className="space-y-3">
      <h3 className="font-heading font-bold text-2xl sm:text-3xl text-ink">{heading}</h3>
      <p className="text-ink-muted leading-relaxed">{copy}</p>
      <Link to={linkTo} className="inline-flex items-center gap-1.5 text-saffron font-semibold text-sm group">
        <span>{linkLabel}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );

  return (
    <Reveal className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      {reverse ? (
        <>
          {text}
          {media}
        </>
      ) : (
        <>
          {media}
          {text}
        </>
      )}
    </Reveal>
  );
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {FAQS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className="rounded-2xl border border-paper-border bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={open}
            >
              <span className="font-heading font-semibold text-sm sm:text-base text-ink">{item.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-ink-muted flex-shrink-0 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-200 ease-out ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm text-ink-muted leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <LandingNavbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-saffron uppercase">
              The Dine-in Operating System
            </span>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] leading-[1.08] text-ink tracking-tight mt-4">
              Your restaurant, running like software.
            </h1>
            <p className="text-lg text-ink-muted leading-relaxed mt-6 max-w-xl">
              Live menus that update the instant a dish sells out, orders your
              kitchen and your diners watch move in real time, wait times
              that are actually true, and an AI copilot that knows your
              numbers — not just clichés.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8">
              <Link
                to="/r/spice-route?table=4"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-sm shadow-lg shadow-saffron/20 transition-all flex items-center justify-center gap-2 group"
              >
                <Utensils className="w-4 h-4" />
                <span>See the diner experience</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-ink/15 text-ink hover:bg-white font-heading font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-saffron" />
                <span>See the owner dashboard</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 mt-6 text-xs text-ink-muted font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron animate-pulse" />
              <span>Live now · Real-time orders, real data</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-8 border-y border-paper-border">
        <Reveal>
          <p className="max-w-6xl mx-auto px-5 text-center text-xs sm:text-sm font-medium text-ink/60">
            Live menus · Real-time orders · AI insights · Multi-outlet ready
          </p>
        </Reveal>
      </section>

      {/* Product tour */}
      <section id="product" className="scroll-mt-20 max-w-6xl mx-auto px-5 py-20 lg:py-28 space-y-24">
        <TourRow
          mockup={<PhoneMenuMockup />}
          heading="Scan. See. Order."
          copy="The menu goes live the second the kitchen 86's a dish — every phone at the table sees it disappear instantly, no refresh, no stale QR codes."
          linkTo="/r/spice-route?table=4"
          linkLabel="Try the live menu"
        />
        <TourRow
          reverse
          mockup={<KanbanMockup />}
          heading="A kitchen that talks back"
          copy="Orders flow placed → preparing → ready on a live Kanban board, and diners watch their own order's status tick forward on their phone in real time."
          linkTo="/login"
          linkLabel="See the owner dashboard"
        />
        <TourRow
          mockup={<ChatMockup />}
          heading="An owner who knows"
          copy="Ask it anything about tomorrow's prep or this week's slow hours — answers are grounded in your actual sales data, never generic, never hallucinated."
          linkTo="/login"
          linkLabel="See the owner dashboard"
        />
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-white border-y border-paper-border py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-ink">Simple, honest pricing</h2>
            <p className="text-ink-muted mt-3">Start free. Upgrade when the AI and the alerts start paying for themselves.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
            {PLANS.map((plan) => (
              <Reveal key={plan.name}>
                <div
                  className={`relative h-full rounded-3xl p-7 flex flex-col ${
                    plan.highlighted
                      ? "bg-white border-2 border-saffron shadow-xl -translate-y-2"
                      : "bg-paper border border-paper-border"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-saffron text-white text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm">
                      Most popular
                    </span>
                  )}

                  <h3 className="font-heading font-bold text-lg text-ink">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-heading font-extrabold text-3xl text-ink">{plan.price}</span>
                    <span className="text-sm text-ink-muted">/mo</span>
                  </div>
                  <p className="text-sm text-ink-muted mt-2">{plan.desc}</p>

                  <ul className="mt-6 space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink">
                        <span className="w-1.5 h-1.5 rounded-full bg-saffron mt-1.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/register"
                    className={`mt-7 w-full py-3 rounded-xl font-heading font-semibold text-sm text-center transition-all ${
                      plan.highlighted
                        ? "bg-saffron hover:bg-saffron-hover text-white shadow-md shadow-saffron/20"
                        : "bg-ink hover:bg-ink-light text-white"
                    }`}
                  >
                    Start free
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 max-w-6xl mx-auto px-5 py-20 lg:py-28">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-ink">Questions, answered</h2>
        </Reveal>
        <Reveal>
          <FaqAccordion />
        </Reveal>
      </section>

      {/* Final CTA band */}
      <section className="px-5 pb-20 lg:pb-28">
        <Reveal className="max-w-6xl mx-auto">
          <div className="bg-ink rounded-3xl px-8 py-14 sm:py-16 text-center space-y-6">
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
              See it live in 30 seconds.
            </h2>
            <Link
              to="/r/spice-route?table=4"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-sm shadow-lg shadow-saffron/30 transition-all group"
            >
              <Utensils className="w-4 h-4" />
              <span>Try the live menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="bg-paper border-t border-paper-border py-14">
        <div className="max-w-6xl mx-auto px-5 grid sm:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-saffron text-white flex items-center justify-center font-heading font-bold">
                Z
              </div>
              <span className="font-heading font-extrabold text-lg text-ink">Zayka</span>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed max-w-xs">
              The dine-in operating system — live menus, real-time orders, and an AI that knows your numbers.
            </p>
            <p className="text-xs text-ink-muted mt-4">Made in Bhopal, India ♥</p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-ink mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li>
                <Link to="/r/spice-route?table=4" className="hover:text-saffron transition-colors">
                  Customer menu
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-saffron transition-colors">
                  Dashboard
                </Link>
              </li>
              <li className="text-ink-muted/60 cursor-default">GitHub repo</li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-ink mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-ink-muted/60">
              <li className="cursor-default">README</li>
              <li className="cursor-default">Problem statement</li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-5 mt-10 pt-6 border-t border-paper-border text-xs text-ink-muted/70 text-center">
          © 2026 Zayka
        </div>
      </footer>
    </div>
  );
}

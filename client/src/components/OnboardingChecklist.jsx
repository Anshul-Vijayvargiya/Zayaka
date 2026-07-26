import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { Sparkles, CheckCircle2, Circle, ArrowRight } from "lucide-react";

const storageKey = (restaurantId) => `zayka_onboarding_${restaurantId}`;

function loadProgress(restaurantId) {
  try {
    const raw = localStorage.getItem(storageKey(restaurantId));
    return raw && raw !== "undefined" ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(restaurantId, progress) {
  if (!restaurantId) return;
  try {
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(progress));
  } catch {
    // ignore quota errors — worst case the checklist re-shows a completed step
  }
}

export default function OnboardingChecklist({ restaurantId }) {
  const [menuCount, setMenuCount] = useState(null);
  const [slug, setSlug] = useState(null);
  const [progress, setProgress] = useState(() => loadProgress(restaurantId));

  useEffect(() => {
    if (!restaurantId) return;
    api
      .get("/manage/menu")
      .then((res) => setMenuCount(res.data.items.length))
      .catch(() => setMenuCount(0));
    api
      .get("/manage/restaurant")
      .then((res) => setSlug(res.data.restaurant?.slug))
      .catch(() => {});
  }, [restaurantId]);

  const markDone = (key) => {
    setProgress((prev) => {
      const next = { ...prev, [key]: true };
      saveProgress(restaurantId, next);
      return next;
    });
  };

  // Avoid a flash of the card before we actually know the menu count.
  if (menuCount === null) return null;

  const steps = [
    {
      key: "menu",
      label: "Add your first dish",
      done: menuCount > 0,
      cta: (
        <Link
          to="/app/menu"
          className="inline-flex items-center gap-1 text-xs font-semibold text-saffron hover:gap-1.5 transition-all"
        >
          <span>Go to Menu</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ),
    },
    {
      key: "qr",
      label: "Print your table QRs",
      done: !!progress.qr,
      cta: (
        <Link
          to="/app/tables"
          onClick={() => markDone("qr")}
          className="inline-flex items-center gap-1 text-xs font-semibold text-saffron hover:gap-1.5 transition-all"
        >
          <span>Go to Tables</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ),
    },
    {
      key: "open",
      label: "Open your menu",
      done: !!progress.open,
      cta: (
        <a
          href={slug ? `/r/${slug}?table=1` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => markDone("open")}
          className="inline-flex items-center gap-1 text-xs font-semibold text-saffron hover:gap-1.5 transition-all"
        >
          <span>Preview Menu</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      ),
    },
  ];

  const allDone = steps.every((s) => s.done);
  if (allDone) return null;

  return (
    <div className="p-5 rounded-3xl border border-saffron/30 bg-saffron-pale/40 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-saffron" />
        <h2 className="font-heading font-bold text-sm text-ink">Get live in 3 steps</h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {steps.map((step) => (
          <div
            key={step.key}
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 bg-white ${
              step.done ? "border-paper-border" : "border-saffron/30"
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 text-leaf flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-ink-muted flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${step.done ? "text-ink-muted line-through" : "text-ink"}`}>
                {step.label}
              </p>
              {!step.done && <div className="mt-1">{step.cta}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

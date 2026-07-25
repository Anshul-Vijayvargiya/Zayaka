import React, { useState } from "react";
import api, { errMsg } from "../../api/client";
import {
  Sparkles,
  Send,
  Calendar,
  ChefHat,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function AiCopilot() {
  // Copilot State
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am Zayka Copilot, grounded in your restaurant's live MongoDB sales history, top items, and inventory status. Ask me about your revenue trends, top dishes, or low stock items!",
    },
  ]);
  const [asking, setAsking] = useState(false);
  const [copilotError, setCopilotError] = useState("");

  // Forecast State
  const [forecast, setForecast] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState("");

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const q = question.trim();
    setQuestion("");
    setCopilotError("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setAsking(true);

    try {
      const res = await api.post("/ai/copilot", { question: q });
      setMessages((prev) => [...prev, { role: "assistant", text: res.data.answer }]);
    } catch (err) {
      setCopilotError(errMsg(err));
    } finally {
      setAsking(false);
    }
  };

  const handleFetchForecast = async () => {
    setForecastError("");
    setLoadingForecast(true);
    try {
      const res = await api.get("/ai/forecast");
      setForecast(res.data.forecast);
    } catch (err) {
      setForecastError(errMsg(err));
    } finally {
      setLoadingForecast(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-paper-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saffron-pale text-saffron text-xs font-bold mb-1">
            <Sparkles className="w-4 h-4" /> Grounded Gemini AI Engine
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-ink">
            AI Operations Copilot & Demand Forecast
          </h1>
          <p className="text-xs text-ink-muted">
            Zero-hallucination insights grounded in 21-day MongoDB aggregations
          </p>
        </div>

        <button
          onClick={handleFetchForecast}
          disabled={loadingForecast}
          className="px-5 py-2.5 rounded-2xl bg-saffron hover:bg-saffron-hover text-white font-heading font-bold text-xs shadow-md transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          {loadingForecast ? (
            "Analyzing Sales Data..."
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              <span>Generate Tomorrow's Prep Plan</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: Copilot Chat & Forecast Prep Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Copilot Q&A Chat */}
        <div className="p-6 rounded-3xl bg-paper-card border border-paper-border shadow-sm flex flex-col h-[600px]">
          <div className="flex items-center justify-between pb-3 border-b border-paper-border mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-saffron" />
              <h2 className="font-heading font-bold text-base text-ink">
                Grounded Operational Copilot
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-ink-muted bg-paper px-2 py-0.5 rounded-full border border-paper-border">
              Gemini 2.0 Flash
            </span>
          </div>

          {copilotError && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{copilotError}</span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-saffron text-white rounded-br-none shadow-sm"
                      : "bg-paper text-ink border border-paper-border rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-ink-muted mt-1 px-1">
                  {m.role === "user" ? "You" : "Zayka Copilot"}
                </span>
              </div>
            ))}
            {asking && (
              <div className="flex items-center gap-2 text-xs text-ink-muted italic p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-saffron" />
                <span>Reading MongoDB facts & generating response...</span>
              </div>
            )}
          </div>

          {/* Question Input Form */}
          <form onSubmit={handleAsk} className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask e.g. What were our top sellers this weekend?"
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-paper border border-paper-border text-xs text-ink focus:outline-none focus:ring-2 focus:ring-saffron"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="absolute right-2 top-2 p-2 rounded-xl bg-saffron text-white hover:bg-saffron-hover transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: AI Tomorrow Demand Forecast Card */}
        <div className="p-6 rounded-3xl bg-paper-card border border-paper-border shadow-sm flex flex-col h-[600px] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-paper-border mb-4">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-saffron" />
              <h2 className="font-heading font-bold text-base text-ink">
                Tomorrow's Kitchen Prep Forecast
              </h2>
            </div>
            {forecast && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {forecast.confidence || 88}% Confidence
              </span>
            )}
          </div>

          {forecastError && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{forecastError}</span>
            </div>
          )}

          {!forecast && !loadingForecast && (
            <div className="text-center my-auto p-8 space-y-3">
              <Sparkles className="w-12 h-12 text-saffron mx-auto opacity-50" />
              <h3 className="font-heading font-bold text-base text-ink">
                Ready to Generate Demand Plan
              </h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                Click "Generate Tomorrow's Prep Plan" above to analyze 21-day sales history and produce a structured prep list.
              </p>
            </div>
          )}

          {forecast && (
            <div className="space-y-4 text-xs">
              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-saffron-pale border border-saffron/20 space-y-1">
                <span className="font-heading font-bold text-saffron text-sm">
                  Expected Orders: ~{forecast.expectedOrders || 35}
                </span>
                <p className="text-ink text-xs leading-relaxed">
                  {forecast.summary || "High dinner demand anticipated for weekend peak."}
                </p>
              </div>

              {/* Structured Kitchen Prep List */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-xs text-ink uppercase tracking-wider">
                  Recommended Kitchen Batch Prep
                </h4>
                {forecast.prepList?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-paper border border-paper-border flex items-center justify-between"
                  >
                    <div>
                      <span className="font-heading font-bold text-ink">{item.item}</span>
                      <p className="text-[11px] text-ink-muted mt-0.5">{item.reason}</p>
                    </div>
                    <span className="font-heading font-extrabold text-sm text-saffron px-3 py-1 bg-white rounded-xl border border-paper-border">
                      {item.expectedQty} Portions
                    </span>
                  </div>
                ))}
              </div>

              {/* Watchouts & Inventory Warnings */}
              {forecast.watchouts?.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
                  <h4 className="font-heading font-bold text-xs text-red-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> Operational Watchouts
                  </h4>
                  <ul className="space-y-1 text-xs text-red-800 list-disc list-inside">
                    {forecast.watchouts.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Server-side Gemini calls. The API key never reaches the browser.
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export async function askGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  if (!key) {
    return "AI is not configured yet. Add GEMINI_API_KEY to the server .env to enable the copilot.";
  }
  const res = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Gemini error", res.status, body.slice(0, 300));
    throw new Error("The AI service is unavailable right now.");
  }
  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
    "No answer was generated."
  );
}

export function copilotPrompt(question, facts) {
  return `You are Zayka Copilot, an operations assistant for a restaurant owner.
Answer the owner's question using ONLY the data below. Be specific with numbers.
If the data can't answer the question, say what data would be needed.
Keep the answer under 120 words, plain text, no markdown formatting.

RESTAURANT DATA:
${JSON.stringify(facts, null, 2)}

QUESTION:
${question}`;
}

export function forecastPrompt(facts) {
  return `You are Zayka AI Demand Forecaster for a dine-in restaurant.
Analyze the 21-day sales history, top selling items, peak hours, and low stock items below.
Generate tomorrow's demand forecast and kitchen preparation plan.

RESTAURANT DATA:
${JSON.stringify(facts, null, 2)}

Respond with STRICT JSON ONLY. Do not include markdown code fences (no \`\`\`json). The response must be a valid JSON object matching this schema:
{
  "expectedOrders": number (e.g. 35),
  "confidence": number (0-100 percentage e.g. 88),
  "summary": string (brief summary of tomorrow's expectation),
  "prepList": [
    {
      "item": string,
      "expectedQty": number,
      "reason": string
    }
  ],
  "watchouts": [ string ]
}`;
}

import { GoogleGenAI } from "@google/genai";

export type CopilotContext = {
  action: "PAUSE" | "REDUCE";
  durationMonths: number;
  monthlyAmount: number;
  proposedAmount: number;
  contributionDifference: number;
  goalName: string;
  yearsRemaining: number;
  marketLabel: string;
  marketSummary: string;
};

export type CopilotExplanation = {
  headline: string;
  explanation: string;
  considerations: string[];
  model: "gemini" | "fallback";
  modelName?: string;
  reasonCode?: string;
};

function providerStatus(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : undefined;
}

export async function explainDecision(context: CopilotContext): Promise<CopilotExplanation> {
  const fallback: CopilotExplanation = {
    headline: "A change to this SIP changes your planned contributions",
    explanation: `Over ${context.durationMonths} months, this choice means ₹${context.contributionDifference.toLocaleString("en-IN")} less in planned contributions toward ${context.goalName}. This is contribution arithmetic, not a forecast of investment value.`,
    considerations: [
      `Your goal is ${context.yearsRemaining} years away; a contribution change may affect your plan.`,
      `${context.marketLabel} is context only and does not indicate what markets will do next.`,
      "If cash flow is the concern, a smaller SIP may be another option to consider.",
    ],
    model: "fallback",
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ...fallback, reasonCode: "missing_api_key" };

  try {
    const client = new GoogleGenAI({ apiKey });
    const primaryModel = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
    const backupModel = process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.5-flash";
    const generate = (model: string) => client.models.generateContent({
      model,
      contents: JSON.stringify(context),
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        systemInstruction: "You explain supplied SIP decision context in plain language. Do not recommend an action, predict or guarantee returns, invent facts, or shame the investor. State uncertainty. The investor retains control. Return JSON with headline (string), explanation (string), considerations (array of 3 short strings).",
      },
    });
    let modelName = primaryModel;
    let result;
    try {
      result = await generate(primaryModel);
    } catch (error) {
      if (providerStatus(error) !== 503 || backupModel === primaryModel) throw error;
      modelName = backupModel;
      result = await generate(backupModel);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(result.text ?? "{}");
    } catch {
      return { ...fallback, reasonCode: "invalid_model_json" };
    }
    if (!parsed || typeof parsed !== "object") return { ...fallback, reasonCode: "invalid_model_json" };
    const value = parsed as Record<string, unknown>;
    if (typeof value.headline !== "string" || typeof value.explanation !== "string" || !Array.isArray(value.considerations) || value.considerations.some((item) => typeof item !== "string")) return { ...fallback, reasonCode: "invalid_model_shape" };
    return { headline: value.headline.slice(0, 120), explanation: value.explanation.slice(0, 600), considerations: value.considerations.slice(0, 3).map((item: string) => item.slice(0, 180)), model: "gemini", modelName };
  } catch (error) {
    const status = providerStatus(error);
    const rawMessage = error instanceof Error ? error.message : "Unknown provider error";
    const safeMessage = rawMessage.replaceAll(apiKey, "[redacted]").replace(/([?&](?:key|token)=)[^&\s]+/gi, "$1[redacted]").slice(0, 240);
    // Log only the provider response summary; never log request data or the API key.
    console.error("Gemini explanation request failed", { status, errorName: error instanceof Error ? error.name : "UnknownError", message: safeMessage });
    return { ...fallback, reasonCode: status ? `provider_http_${status}` : "provider_request_failed" };
  }
}

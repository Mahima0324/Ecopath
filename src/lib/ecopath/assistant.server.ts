/** EcoPath AI assistant — server-only. Uses the EcoPath AI gateway. */

const GATEWAY = "https://ai.gateway.EcoPath.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export const ASSISTANT_SYSTEM_PROMPT = `You are EcoPath AI, an assistant inside a pollution-aware route planner.

You help travellers understand how a journey affects their exposure to air pollution and how to reduce it.

Rules:
- Be concise and practical. Aim for 120 words or fewer unless the user asks for detail.
- Use the supplied route data (AQI exposure, road composition, traffic, duration, distance, EcoPath score) and cite concrete numbers.
- Adapt advice to the user's declared pollution sensitivity.
- Give general wellbeing guidance only. Never diagnose, never suggest medication, never claim medical authority.
- Close health-related answers with: "This is general guidance, not medical advice."
- Format with short paragraphs and bullet points where helpful. No headings.`;

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantResult {
  reply: string;
}

export async function askAssistant(
  contextBlock: string,
  messages: AssistantMessage[],
): Promise<AssistantResult> {
  const apiKey = process.env["EcoPath_API_KEY"];
  if (!apiKey) throw new Error("The AI assistant is not configured.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "EcoPath-API-Key": apiKey,
      "X-EcoPath-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
        { role: "system", content: contextBlock },
        ...messages,
      ],
    }),
  });

  if (res.status === 429) throw new Error("EcoPath AI is busy right now. Please try again in a moment.");
  if (res.status === 402) throw new Error("EcoPath AI is out of credits. Please add credits to continue.");
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, detail);
    throw new Error("EcoPath AI could not answer that right now.");
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const reply = json.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("EcoPath AI returned an empty answer.");
  return { reply };
}

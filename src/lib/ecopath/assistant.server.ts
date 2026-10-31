/** EcoPath AI assistant — server-only. Uses Google Gemini API. */

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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
  const apiKey = process.env["GEMINI_API_KEY"];

  if (!apiKey) {
    throw new Error("The AI assistant is not configured.");
  }

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `${ASSISTANT_SYSTEM_PROMPT}\n\nRoute context:\n${contextBlock}`,
        },
      ],
    },
    ...messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
  ];

  const res = await fetch(
    `${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 300,
        },
      }),
    },
  );

  if (res.status === 429) {
    throw new Error(
      "EcoPath AI is busy right now. Please try again in a moment.",
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Gemini API error", res.status, detail);
    throw new Error("EcoPath AI could not answer that right now.");
  }

  const json = (await res.json()) as {
    candidates?: {
      content?: {
        parts?: {
          text?: string;
        }[];
      };
    }[];
  };

  const reply = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!reply) {
    throw new Error("EcoPath AI returned an empty answer.");
  }

  return { reply };
}
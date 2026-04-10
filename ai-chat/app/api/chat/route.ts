import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

// Updated to the Gemini 2.0 Flash model name
const MODEL_NAME = "gemini-2.5-flash"; 
function toUserFriendlyError(error: any): { message: string; status: number } {
  const details = error?.message?.toLowerCase() || "";
  
  if (details.includes("429") || details.includes("quota")) {
    return { 
      message: "You've reached the message limit for now. Please wait a moment before trying again.", 
      status: 429 
    };
  }

  if (details.includes("503") || details.includes("overloaded")) {
    return { 
      message: "Gemini is currently under high demand. Please try again in a few seconds.", 
      status: 503 
    };
  }

  return { 
    message: "I'm having trouble connecting to the AI right now. Please try again.", 
    status: 500 
  };
}
function getGeminiApiKeys(): string[] {
  const raw = process.env.GEMINI_API_KEY; // or GEMINI_API_KEYS
  if (!raw?.trim()) {
    throw new Error("Missing API Key in .env.local");
  }

  // This splits by comma if you have many, or just returns one key in an array
  return raw.split(",").map(k => k.trim()).filter(Boolean);
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function isQuotaOrRateLimit(details: string): boolean {
  const lower = details.toLowerCase();
  return lower.includes("429") || lower.includes("quota") || lower.includes("rate limit");
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json(); // Get the array of messages from App.tsx

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    // Get the very last message the user just typed
    const latestMessage = messages[messages.length - 1].content;

    const keys = getGeminiApiKeys();
    let lastErr: any;

    for (const key of keys) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          systemInstruction: "You are a professional assistant. Respond in a formal, concise, and respectful tone."
        });

        // Pass the latest message string to Gemini
        const result = await model.generateContent(latestMessage);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });
      } catch (err) {
        lastErr = err;
        console.error("Key failed:", err);
        continue; 
      }
    }

    return NextResponse.json({ error: "Service Error", details: String(lastErr) }, { status: 500 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
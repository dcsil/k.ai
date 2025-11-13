import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400, headers: { "Content-Type": "application/json" } });

    // Server-side only
    const systemPrompt = `You are an expert on releasing music for independent musicians. Provide practical, actionable advice tailored to indie artists' budgets and constraints. Answer questions clearly and concisely.`;

    // Combined system prompt and user prompt
    const contents = `${systemPrompt}\n\nUser: ${prompt}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    const response = result as { text?: string; candidates?: Array<{ content?: { text?: string } }> };
    const text = response.text || response.candidates?.[0]?.content?.text || JSON.stringify(result);

    return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

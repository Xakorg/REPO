import { NextRequest, NextResponse } from "next/server";
import { VOLTRA_OS_BIBLE } from "./memory";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Hardcode the VoltraOS brain into the AI context
    const formattedMessages = [
      { role: "user", parts: [{ text: VOLTRA_OS_BIBLE }] },
      { role: "model", parts: [{ text: "Understood. I am Antigravity. I am ready to help build VoltraOS." }] },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    ];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not found in .env" }, { status: 500 });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: formattedMessages })
    });

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Transmission error.";

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, code } = body || {};

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // If a real Copilot SDK key is configured, this is where we'd call it.
    // For now we return a stub suggestion and instructions for enabling Copilot SDK.

    if (!process.env.COPILOT_API_KEY && !process.env.NEXT_PUBLIC_COPILOT_KEY) {
      return NextResponse.json({
        suggestion: `// Copilot SDK not configured.\n// To enable: add COPILOT_API_KEY (server-side) or NEXT_PUBLIC_COPILOT_KEY (client) and implement Copilot SDK server integration.\n// Received prompt: ${prompt.slice(0, 200)}`
      });
    }

    // TODO: integrate @github/copilot-sdk server call here when API details available.
    // Returning a placeholder suggestion for now.
    const suggestion = `// Copilot (stub) suggestion based on prompt:\n// ${prompt.replace(/\n/g, ' ')}\n\n// Suggestion:\nfunction example() {\n  console.log('This is a placeholder Copilot suggestion.');\n}\n`;

    return NextResponse.json({ suggestion });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}

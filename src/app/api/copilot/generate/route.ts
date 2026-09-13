import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, code, githubToken } = body || {};

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Prefer per-user GitHub token (from OAuth) if provided, otherwise fall back to server COPILOT_API_KEY
    const serverKey = process.env.COPILOT_API_KEY;
    const effectiveKey = githubToken || serverKey;

    if (!effectiveKey) {
      return NextResponse.json({ error: 'No Copilot credential provided. Provide githubToken in the request (user OAuth token with Copilot permission) or set COPILOT_API_KEY on the server.' }, { status: 400 });
    }

    // Try to load the official Copilot SDK dynamically and call common methods using the effective credential.
    try {
      const sdk = await import('@github/copilot-sdk');

      // Try various constructor helpers
      const ClientConstructors = [sdk.default, sdk.Copilot, sdk.Client, sdk.createClient, sdk.create];
      let client: any = null;

      for (const C of ClientConstructors) {
        if (!C) continue;
        try {
          if (typeof C === 'function') {
            // try factory
            try {
              const maybe = (C as any)({ apiKey: effectiveKey, token: effectiveKey });
              client = maybe && typeof maybe.then === 'function' ? await maybe : maybe;
            } catch (err) {
              // try as constructor
              try {
                client = new (C as any)({ apiKey: effectiveKey, token: effectiveKey });
              } catch (_) {
                // ignore
              }
            }
          }
        } catch (e) {
          // ignore and continue
        }
        if (client) break;
      }

      if (!client) {
        return NextResponse.json({ error: 'Failed to construct Copilot client from SDK. SDK exports: ' + Object.keys(sdk).join(', ') }, { status: 500 });
      }

      // Try calling known methods on the client
      const methodCandidates = [
        'generate',
        'createCompletion',
        'createChatCompletion',
        'completion',
        'complete',
        'create',
        'request',
      ];

      for (const name of methodCandidates) {
        if (typeof client[name] === 'function') {
          try {
            const res = await client[name]({ prompt, input: code });
            if (!res) continue;
            if (typeof res === 'string') return NextResponse.json({ suggestion: res });
            if (res.text) return NextResponse.json({ suggestion: res.text });
            if (res.output) return NextResponse.json({ suggestion: res.output });
            if (res.choices && Array.isArray(res.choices)) {
              const text = res.choices.map((c: any) => c.text || c.message?.content || c.message?.content?.[0]?.content || '').join('\n');
              return NextResponse.json({ suggestion: text || JSON.stringify(res) });
            }
            return NextResponse.json({ suggestion: JSON.stringify(res) });
          } catch (err: any) {
            console.error(`Copilot client method ${name} failed:`, err?.message || err);
          }
        }
      }

      return NextResponse.json({ error: 'Copilot SDK loaded but no compatible method succeeded. Inspect server logs.' }, { status: 500 });
    } catch (err: any) {
      console.error('Failed to import or call Copilot SDK:', err?.message || err);
      return NextResponse.json({ error: 'Failed to import or call Copilot SDK: ' + (err?.message || err) }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}

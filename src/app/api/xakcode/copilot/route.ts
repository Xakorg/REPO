import { NextResponse } from "next/server";
import { CopilotClient, approveAll } from "@github/copilot-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CopilotRequest = {
  prompt?: string;
  code?: string;
  files?: Record<string, string>;
  githubToken?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CopilotRequest;
  const prompt = body.prompt?.trim();
  const githubToken = body.githubToken?.trim();

  if (!prompt || !githubToken) {
    return NextResponse.json({ error: "A prompt and GitHub connection are required." }, { status: 400 });
  }

  const client = new CopilotClient({ mode: "empty", gitHubToken: githubToken });
  try {
    await client.start();
    const session = await client.createSession({
      model: "gpt-5",
      onPermissionRequest: approveAll,
      systemMessage: {
        mode: "append",
        content:
          "You are XakCode, a careful repository coding agent. Return a concise explanation followed by the complete updated file content. Never invent files or claim changes were made outside the provided workspace."
      }
    });

    let responseText = "";
    const responseComplete = new Promise<void>((resolve) => {
      session.on("assistant.message", (event) => {
        responseText += event.data.content;
      });
      session.on("session.idle", () => resolve());
    });

    await session.send({
      prompt: [
        prompt,
        "",
        "Current active file:",
        body.code || "(empty)",
        "",
        "Workspace files:",
        JSON.stringify(body.files || {}, null, 2),
        "",
        "Respond with:",
        "EXPLANATION: one short paragraph",
        "CODE: a fenced code block containing the complete replacement for the active file."
      ].join("\n")
    });
    await responseComplete;
    await session.disconnect();

    const codeMatch = responseText.match(/```(?:[\w+-]+)?\s*([\s\S]*?)```/);
    const code = codeMatch?.[1]?.trim() || body.code || "";
    const explanation = responseText.replace(/```(?:[\w+-]+)?\s*[\s\S]*?```/g, "").replace(/^EXPLANATION:\s*/i, "").trim();
    return NextResponse.json({ code, explanation, raw: responseText });
  } finally {
    await client.stop();
  }
}

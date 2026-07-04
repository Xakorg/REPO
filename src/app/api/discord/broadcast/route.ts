import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, content, authorName, avatarUrl } = await req.json();

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1522632943888240670/dgcHcGN-cOGjL0EqzliXjOZotfA2V-FkA5s79MUpgG_eNQbUY1yLMAQomooH9EWuZrwp";
    if (!webhookUrl) {
      console.warn("DISCORD_WEBHOOK_URL is not configured.");
      return NextResponse.json({ success: true, warning: "Webhook not configured" });
    }

    const formattedMessage = `# ${title}\n${content}`;

    const payload = {
      content: formattedMessage
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("Discord Webhook Error:", await response.text());
      return NextResponse.json({ success: false, error: "Failed to post to Discord" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Broadcast API Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, content, authorName, avatarUrl } = await req.json();

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("DISCORD_WEBHOOK_URL is not configured.");
      return NextResponse.json({ success: true, warning: "Webhook not configured" });
    }

    const payload = {
      username: "Xakteir Broadcast System",
      avatar_url: "https://github.com/171-netizen.png",
      embeds: [
        {
          title: `📣 GLOBAL BROADCAST: ${title}`,
          description: content,
          color: 0x4f46e5, // Indigo primary color
          author: {
            name: authorName || "Admin",
            icon_url: avatarUrl || "https://github.com/171-netizen.png"
          },
          footer: {
            text: "Xakteir Multiverse Authority"
          },
          timestamp: new Date().toISOString()
        }
      ]
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

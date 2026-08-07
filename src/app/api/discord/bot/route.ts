import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { channelId, message, authorName } = await req.json();

    const botToken = process.env.DISCORD_BOT_TOKEN || 'MTUzNDg5MzgzNjk4MjAyNjMyMA.Gem6K6.k5N0LvYBW1-_YArElnQd6Tov3Pq833kMBCtvh0';
    if (!botToken) {
      return NextResponse.json({ error: 'DISCORD_BOT_TOKEN missing' }, { status: 500 });
    }

    if (!channelId || !message) {
      return NextResponse.json({ error: 'channelId and message required' }, { status: 400 });
    }

    // Post message to Discord channel via Bot API
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `**[Xakchat - ${authorName || 'Member'}]**: ${message}`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Discord Bot API error:', data);
      return NextResponse.json({ error: data.message || 'Failed to send message via Discord Bot' }, { status: response.status });
    }

    return NextResponse.json({ success: true, messageId: data.id });
  } catch (error: any) {
    console.error('Discord bot handler error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

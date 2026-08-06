import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const discordClientId = process.env.DISCORD_CLIENT_ID;
  if (!discordClientId) {
    return NextResponse.json({ error: 'Discord Client ID not configured.' }, { status: 500 });
  }

  // The state parameter should be passed from the frontend to link accounts
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state') || 'none';
  const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/auth/discord/callback`);
  
  const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email&state=${state}`;

  return NextResponse.redirect(discordUrl);
}

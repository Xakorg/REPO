import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // uid if linking, or 'none' if signing in

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/auth/discord/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Discord credentials missing' }, { status: 500 });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error('Discord token error:', tokenData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/profile?error=discord_auth_failed`);
    }

    // 2. Fetch user profile from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();
    if (!userData.id) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/profile?error=discord_user_fetch_failed`);
    }

    const discordId = userData.id;
    const discordEmail = userData.email;
    const discordUsername = userData.username;

    // 3. Check if linking or signing in
    if (state && state !== 'none') {
      // LINKING ACCOUNT to existing UID
      const uid = state;
      
      // Save Discord connection to Firestore
      await adminDb.collection('users').doc(uid).set({
        discord: {
          id: discordId,
          username: discordUsername,
          email: discordEmail,
          linkedAt: new Date(),
        }
      }, { merge: true });

      // Also create a reverse lookup mapping for sign in later
      await adminDb.collection('discord_mappings').doc(discordId).set({
        uid: uid
      });

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/profile?discord_linked=true`);
    } else {
      // SIGNING IN
      // Find if this Discord ID is mapped to a Firebase UID
      const mappingDoc = await adminDb.collection('discord_mappings').doc(discordId).get();
      let uidToLogin = null;

      if (mappingDoc.exists) {
        uidToLogin = mappingDoc.data()?.uid;
      } else {
        // Create a new user since they don't have an account
        const newUser = await adminAuth.createUser({
          email: discordEmail,
          displayName: discordUsername,
          emailVerified: true,
        });
        uidToLogin = newUser.uid;
        
        await adminDb.collection('discord_mappings').doc(discordId).set({
          uid: uidToLogin
        });

        await adminDb.collection('users').doc(uidToLogin).set({
          email: discordEmail,
          displayName: discordUsername,
          discord: {
            id: discordId,
            username: discordUsername,
            email: discordEmail,
            linkedAt: new Date(),
          }
        }, { merge: true });
      }

      // Mint a custom token for the user to log in on the frontend
      const customToken = await adminAuth.createCustomToken(uidToLogin);

      // Redirect to a special auth handler page on the frontend to process the token
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/oauth/callback?token=${customToken}`);
    }

  } catch (error) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/profile?error=discord_server_error`);
  }
}

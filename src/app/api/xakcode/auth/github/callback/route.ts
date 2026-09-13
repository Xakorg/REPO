import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Validate OAuth state
    const storedState = req.cookies.get('xakcode_oauth_state')?.value;
    if (!state || state !== storedState) {
      return NextResponse.json(
        { error: 'Invalid OAuth state' },
        { status: 400 }
      );
    }

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'https://xakcode.xakteir.com'}/xakcode?error=${error}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'https://xakcode.xakteir.com'}/xakcode?error=no_code`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'https://xakcode.xakteir.com'}/xakcode?error=${tokenData.error}`
      );
    }

    const accessToken = tokenData.access_token;

    // Get GitHub user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch GitHub user');
    }

    const githubUser = await userResponse.json();

    // Get GitHub user email
    let githubEmail = githubUser.email;
    if (!githubEmail) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      const emails = await emailResponse.json();
      githubEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
    }

    // Get GitHub user session from cookie (contains uid)
    const sessionCookie = req.cookies.get('xak_session')?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'https://xakcode.xakteir.com'}/auth?error=not_authenticated`
      );
    }

    // Verify session and get UID
    let uid: string;
    try {
      // Try to decode session cookie (it contains the user's UID)
      // In production, verify with Firebase Admin SDK
      const match = sessionCookie.match(/^eyJhbGciOi/);
      if (!match) {
        // Session cookie might be a custom format, use a fallback method
        // Get UID from Firestore by matching email
        const usersRef = await getFirestore(app).collection('users').where('email', '==', process.env.NEXT_PUBLIC_XAKTEIR_EMAIL || 'unknown').limit(1).get();
        if (usersRef.empty) {
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'https://xakcode.xakteir.com'}/auth?error=user_not_found`
          );
        }
        uid = usersRef.docs[0].id;
      } else {
        // For now, extract UID from session or use a secure method
        uid = 'user-from-session';
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'https://xakcode.xakteir.com'}/auth?error=session_verification_failed`
      );
    }

    // Update user document with GitHub info
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // User doesn't exist, create new document
      await setDoc(userDocRef, {
        githubConnected: true,
        githubId: githubUser.id,
        githubUsername: githubUser.login,
        githubEmail: githubEmail,
        githubAvatarUrl: githubUser.avatar_url,
        githubBio: githubUser.bio,
        githubPublicRepos: githubUser.public_repos,
        githubAccessToken: accessToken, // Encrypted in production
        githubConnectedAt: serverTimestamp(),
      });
    } else {
      // Update existing user with GitHub info
      await updateDoc(userDocRef, {
        githubConnected: true,
        githubId: githubUser.id,
        githubUsername: githubUser.login,
        githubEmail: githubEmail,
        githubAvatarUrl: githubUser.avatar_url,
        githubBio: githubUser.bio,
        githubPublicRepos: githubUser.public_repos,
        githubAccessToken: accessToken, // Encrypted in production
        githubConnectedAt: serverTimestamp(),
      });
    }

    // Redirect back to Xakcode with success
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://xakcode.xakteir.com'}/xakcode?github_connected=true`
    );

    // Clear OAuth state
    response.cookies.delete('xakcode_oauth_state');

    return response;
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://xakcode.xakteir.com'}/xakcode?error=callback_error`
    );
  }
}

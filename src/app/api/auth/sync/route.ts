import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { idToken, action } = await req.json();

    const host = req.headers.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const cookieDomain = isLocal ? undefined : '.xakteir.com';

    if (action === 'clear') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete({
        name: 'xak_session',
        domain: cookieDomain,
        path: '/',
      });
      return response;
    }

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // Verify token and create a session cookie valid for 5 days
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: 'xak_session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: true,
      domain: cookieDomain,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Auth sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const match = cookieHeader?.match(/(?:^|;\s*)xak_session=([^;]*)/);
    const sessionCookie = match ? match[1] : null;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session cookie' }, { status: 401 });
    }

    // Verify the session cookie and extract UID
    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    
    // Mint a new custom token for the client
    const customToken = await getAdminAuth().createCustomToken(decodedClaims.uid);

    return NextResponse.json({ customToken });
  } catch (error: any) {
    console.error('SSO token error:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}

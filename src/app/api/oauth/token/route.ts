import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase without client-specific logic
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export async function POST(req: Request) {
  try {
    const { client_id, client_secret, code, grant_type } = await req.json().catch(() => ({}));

    if (grant_type !== "authorization_code") {
      return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
    }

    if (!client_id || !client_secret || !code) {
      return NextResponse.json({ error: "invalid_request", message: "Missing required parameters" }, { status: 400 });
    }

    // 1. Verify Client ID & Secret
    const appDoc = await getDoc(doc(firestore, "oauth_apps", client_id));
    if (!appDoc.exists() || appDoc.data().clientSecret !== client_secret) {
      return NextResponse.json({ error: "invalid_client", message: "Invalid client_id or client_secret" }, { status: 401 });
    }

    // 2. Verify Authorization Code
    const codeDoc = await getDoc(doc(firestore, "oauth_codes", code));
    if (!codeDoc.exists()) {
      return NextResponse.json({ error: "invalid_grant", message: "Invalid or expired authorization code" }, { status: 400 });
    }

    const codeData = codeDoc.data();
    
    if (codeData.clientId !== client_id) {
       return NextResponse.json({ error: "invalid_grant", message: "Code was issued to a different client" }, { status: 400 });
    }

    if (codeData.used || Date.now() > codeData.expiresAt) {
      return NextResponse.json({ error: "invalid_grant", message: "Code has expired or already been used" }, { status: 400 });
    }

    // Mark code as used (prevent replay attacks)
    await setDoc(doc(firestore, "oauth_codes", code), { ...codeData, used: true });

    // 3. Issue Access Token
    const accessToken = "xak_at_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    
    // Store token
    await setDoc(doc(firestore, "oauth_tokens", accessToken), {
      clientId: client_id,
      userId: codeData.userId,
      expiresAt: Date.now() + 3600 * 1000 // 1 hour expiry
    });

    // Cleanup the used code
    await deleteDoc(doc(firestore, "oauth_codes", code));

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: "read:profile"
    });

  } catch (error: any) {
    console.error("OAuth Token Error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

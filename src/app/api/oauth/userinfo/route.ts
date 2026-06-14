import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized", message: "Missing or invalid Bearer token" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // 1. Validate Token
    const tokenDoc = await getDoc(doc(firestore, "oauth_tokens", token));
    if (!tokenDoc.exists()) {
      return NextResponse.json({ error: "invalid_token", message: "Token not found or invalid" }, { status: 401 });
    }

    const tokenData = tokenDoc.data();
    if (Date.now() > tokenData.expiresAt) {
      return NextResponse.json({ error: "invalid_token", message: "Token has expired" }, { status: 401 });
    }

    // 2. Fetch User Profile
    const userDoc = await getDoc(doc(firestore, "users", tokenData.userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const userData = userDoc.data();

    // 3. Return safe profile data (DO NOT return currencyBalance or private settings)
    const safeProfile = {
      id: tokenData.userId,
      username: userData.displayName || "Xakteir User",
      email: userData.email,
      avatar_url: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tokenData.userId}`,
      role: userData.role || "user",
      joinedAt: userData.createdAt || new Date().toISOString()
    };

    return NextResponse.json(safeProfile);

  } catch (error: any) {
    console.error("OAuth UserInfo Error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    
    const { targetUid, newPassword } = await req.json();
    if (!targetUid || !newPassword) {
      return NextResponse.json({ error: "Missing targetUid or newPassword" }, { status: 400 });
    }

    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(decodedToken.email?.toLowerCase() || "");
    let canChangePasswords = isSuperAdmin;

    if (!isSuperAdmin) {
      const adminDoc = await getAdminDb().collection("admins").doc(decodedToken.uid).get();
      if (!adminDoc.exists || !adminDoc.data()?.canChangePasswords) {
        return NextResponse.json({ error: "Forbidden: Missing permissions" }, { status: 403 });
      }
      canChangePasswords = true;
    }

    if (!canChangePasswords) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await getAdminAuth().updateUser(targetUid, { password: newPassword });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

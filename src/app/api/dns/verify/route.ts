import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { uid, domainId, domainName, verifyRecord } = await req.json();

    if (!uid || !domainId || !domainName || !verifyRecord) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getAdminDb();
    
    // 1. Query Google DoH for TXT records
    const dohUrl = `https://dns.google/resolve?name=${domainName}&type=TXT`;
    const dohResponse = await fetch(dohUrl);
    
    if (!dohResponse.ok) {
      throw new Error("Failed to reach DNS resolver");
    }

    const dnsData = await dohResponse.json();
    
    // 2. Check if any TXT record matches the verifyRecord
    let isVerified = false;
    
    if (dnsData.Answer && Array.isArray(dnsData.Answer)) {
      for (const record of dnsData.Answer) {
        // TXT records from DoH come wrapped in quotes, so we check for includes
        if (record.type === 16 && record.data.includes(verifyRecord)) {
          isVerified = true;
          break;
        }
      }
    }

    if (isVerified) {
      // 3. Mark as verified in Firestore
      await db.doc(`dev_accounts/${uid}/email_domains/${domainId}`).update({
        status: "Verified",
        verifiedAt: new Date().toISOString()
      });
      return NextResponse.json({ success: true, verified: true });
    } else {
      return NextResponse.json({ success: true, verified: false, message: "TXT record not found globally yet." });
    }
  } catch (error: any) {
    console.error("DNS Verify Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

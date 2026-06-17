import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest, props: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await props.params;
  const uid = req.nextUrl.searchParams.get("uid");

  if (!uid) {
    return NextResponse.json(
      { error: "Missing required query parameter: 'uid'" },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();
    const docRef = db.doc(`dev_accounts/${uid}/edge_config/${storeId}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Edge Config store not found" },
        { status: 404 }
      );
    }

    const data = docSnap.data();
    
    let configObj = {};
    try {
      configObj = JSON.parse(data?.config || "{}");
    } catch (e) {
      // Return raw string if not JSON parsable, but we enforce JSON in the UI
      configObj = { _raw: data?.config };
    }

    // Set Cache-Control for edge caching
    return NextResponse.json(configObj, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate",
        "X-Xakteir-Edge": "hit",
      },
    });
  } catch (error: any) {
    console.error("Edge Config API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

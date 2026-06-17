import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest, props: { params: Promise<{ hookId: string }> }) {
  const { hookId } = await props.params;

  try {
    const db = getAdminDb();
    
    // Extract everything we can from the incoming request
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let body = null;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        body = await req.json();
      } catch (e) {
        body = await req.text();
      }
    } else {
      body = await req.text();
    }

    const webhookData = {
      method: "POST",
      url: req.url,
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown IP",
      headers,
      body,
      timestamp: Date.now()
    };

    // Save to the user's webhooks collection
    const hookRef = db.collection(`dev_accounts/${hookId}/webhooks`).doc();
    await hookRef.set(webhookData);

    return NextResponse.json({ success: true, id: hookRef.id }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Support other methods too so users can test GET, PUT, etc.
export async function GET(req: NextRequest, props: { params: Promise<{ hookId: string }> }) {
  return handleAnyMethod(req, props, "GET");
}

export async function PUT(req: NextRequest, props: { params: Promise<{ hookId: string }> }) {
  return handleAnyMethod(req, props, "PUT");
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ hookId: string }> }) {
  return handleAnyMethod(req, props, "DELETE");
}

async function handleAnyMethod(req: NextRequest, props: { params: Promise<{ hookId: string }> }, method: string) {
  const { hookId } = await props.params;

  try {
    const db = getAdminDb();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let body = null;
    if (method !== "GET") {
      body = await req.text();
    }

    const webhookData = {
      method,
      url: req.url,
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown IP",
      headers,
      body,
      timestamp: Date.now()
    };

    const hookRef = db.collection(`dev_accounts/${hookId}/webhooks`).doc();
    await hookRef.set(webhookData);

    return NextResponse.json({ success: true, id: hookRef.id }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createRepo } from "@/lib/github";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const res = await createRepo({ name: body.name, private: body.private ?? false, description: body.description ?? "" });
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: e.status || 500 });
  }
}

import { NextResponse } from "next/server";
import { listUserRepos } from "@/lib/github";

export async function GET() {
  try {
    const repos = await listUserRepos();
    return NextResponse.json(repos);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: e.status || 500 });
  }
}

import { NextResponse } from "next/server";
import { getRepoFile, createOrUpdateFile } from "@/lib/github";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { owner, repo, path, content, message = "Update via app", branch } = body;
    if (!owner || !repo || !path || typeof content !== "string") {
      return NextResponse.json({ error: "owner, repo, path, content required" }, { status: 400 });
    }

    let sha: string | undefined;
    try {
      const existing = await getRepoFile(owner, repo, path, branch);
      sha = existing?.sha;
    } catch (err: any) {
      // ignore — file might not exist
    }

    const res = await createOrUpdateFile(owner, repo, path, content, message, branch, sha);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: e.status || 500 });
  }
}

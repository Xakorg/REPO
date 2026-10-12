import { NextRequest, NextResponse } from "next/server"
import { mailBucket, uploadAttachment, attachmentExists } from "@/lib/mail/storage"
import { mailDb } from "@/lib/firebase-admin"
import { getUserFromRequest } from "@/lib/auth-helpers"
import { toRouteError } from "@/lib/errors"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * ATTACHMENTS UPLOAD/DOWNLOAD
 *
 * Real Firebase Storage. This route does not invent bytes and does not trust
 * client-provided content-type. The Qt client uploads here; the web client
 * may use the same helper.
 *
 * POST /api/mail/attachments
 * - multipart/form-data: file + messageId? + accountId? + draftId?
 * - returns { ok, attachmentId, storagePath, sizeBytes, contentType, digestSha256 }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const messageId = (form.get("messageId") as string) || null
    const draftId = (form.get("draftId") as string) || null
    const accountId = (form.get("accountId") as string) || null

    const bytes = Buffer.from(await file.arrayBuffer())
    if (bytes.length === 0) return NextResponse.json({ error: "Empty file" }, { status: 400 })

    const name = file.name || "attachment"
    const contentType = file.type || undefined

    const result = await uploadAttachment({
      uid: user.uid,
      fileName: name,
      contentType,
      bytes,
      messageId,
      draftId,
      accountId,
    })

    // Best-effort bookkeeping: mark message/draft hasAttachments if provided
    try {
      const db = mailDb()
      if (messageId) {
        await db.collection("users").doc(user.uid).collection("mails").doc(messageId).set(
          { hasAttachments: true, updatedAt: Date.now() },
          { merge: true }
        )
      }
      if (draftId) {
        await db.collection("users").doc(user.uid).collection("mails").doc(draftId).set(
          { hasAttachments: true, updatedAt: Date.now() },
          { merge: true }
        )
      }
    } catch {}

    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    const r = toRouteError(e)
    return NextResponse.json(r.body, { status: r.status })
  }
}

/**
 * GET /api/mail/attachments/[id]
 * Downloads by attachment id. The id is the storage object name suffix or we
 * can look up; minimal pass-through: if bucket allows, stream. Here we return
 * 501 to force Qt client to use its own download path? But we must be real.
 * Return the signed URL or bytes? Keep simple: redirect to signed URL.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const id = params.id
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const bucket = mailBucket()
    const [exists] = await bucket.file(id).exists()
    if (!exists) {
      // try path-based? no. just 404
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const [url] = await bucket.file(id).getSignedUrl({
      action: "read",
      expires: Date.now() + 300000,
    })
    return NextResponse.redirect(url)
  } catch (e) {
    const r = toRouteError(e)
    return NextResponse.json(r.body, { status: r.status })
  }
}

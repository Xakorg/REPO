import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { simpleParser } from "mailparser";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-email-webhook-secret");
    if (authHeader !== "super-secret-key-123") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { from, to, rawEmail } = await req.json();

    if (!rawEmail) {
      return NextResponse.json({ error: "No raw email provided" }, { status: 400 });
    }

    // Parse the MIME email
    const parsed = await simpleParser(rawEmail);

    // Extract the username part from "username@mail.xakteir.com"
    const targetEmail = to.toLowerCase();
    const targetUsername = targetEmail.split("@")[0];

    // Find the user in Firestore who owns this email
    // We check if the user's 'username' matches the start of the email
    // Or if they explicitly have a 'xakteirEmail' field
    const db = getAdminDb();
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("username", "==", targetUsername).limit(1).get();
    
    let userId = null;
    let userEmail = null;
    
    if (!snapshot.empty) {
      userId = snapshot.docs[0].id;
      userEmail = snapshot.docs[0].data().email;
    } else {
      // Fallback: check if any user has this exact email saved as xakteirEmail
      const emailSnapshot = await usersRef.where("xakteirEmail", "==", targetEmail).limit(1).get();
      if (!emailSnapshot.empty) {
        userId = emailSnapshot.docs[0].id;
        userEmail = emailSnapshot.docs[0].data().email;
      }
    }

    if (!userId) {
      // User not found, but we still received it (Catch-all)
      console.log("Received email for unknown user:", targetEmail);
      return NextResponse.json({ success: true, message: "User not found, ignored." });
    }

    // Save the email into the root emails collection so the old UI can query it
    await db.collection("emails").add({
      senderUserId: "external",
      senderEmail: from,
      senderName: parsed.from?.text || from,
      recipientList: [targetEmail, userEmail].filter(Boolean),
      subject: parsed.subject || "No Subject",
      body: parsed.text || "",
      html: parsed.html || "",
      sentDateTime: (parsed.date || new Date()).toISOString(),
      isRead: false,
      isDeleted: false,
      isStarred: false,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Email receive error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

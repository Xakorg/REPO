import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
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
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("username", "==", targetUsername).limit(1).get();
    
    let userId = null;
    
    if (!snapshot.empty) {
      userId = snapshot.docs[0].id;
    } else {
      // Fallback: check if any user has this exact email saved as xakteirEmail
      const emailSnapshot = await usersRef.where("xakteirEmail", "==", targetEmail).limit(1).get();
      if (!emailSnapshot.empty) {
        userId = emailSnapshot.docs[0].id;
      }
    }

    if (!userId) {
      // User not found, but we still received it (Catch-all)
      console.log("Received email for unknown user:", targetEmail);
      return NextResponse.json({ success: true, message: "User not found, ignored." });
    }

    // Save the email into the user's inbox
    await db.collection("users").doc(userId).collection("emails").add({
      from: parsed.from?.text || from,
      to: targetEmail,
      subject: parsed.subject || "No Subject",
      text: parsed.text || "",
      html: parsed.html || "",
      date: parsed.date || new Date(),
      read: false,
      folder: "inbox",
      createdAt: new Date()
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Email receive error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

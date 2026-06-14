import { getAdminDb } from "./src/lib/firebase-admin.js";

async function checkEmails() {
  const db = getAdminDb();
  console.log("Fetching emails...");
  const snapshot = await db.collection("emails").orderBy("createdAt", "desc").limit(5).get();
  
  if (snapshot.empty) {
    console.log("No emails found.");
    return;
  }
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log("Email ID:", doc.id);
    console.log("Sender:", data.senderEmail);
    console.log("Recipients:", data.recipientList);
    console.log("Subject:", data.subject);
    console.log("Time:", data.createdAt?.toDate());
    console.log("---");
  });
}

checkEmails().catch(console.error);

const fs = require('fs');

const BUCKET_URL = "https://keyvalue.immanuel.co/api/KeyVal";
const APP_KEY = "xakteir_collab_2026";

async function run() {
  const args = process.argv.slice(2);
  const action = args[0];

  if (action === "send") {
    const sender = args[1];
    const message = args.slice(2).join(" ");
    
    // Fetch current history
    let history = [];
    try {
      const res = await fetch(`${BUCKET_URL}/GetValue/${APP_KEY}`);
      if (res.ok) {
        const text = await res.text();
        // The API returns strings quoted, e.g. "\"[...]\""
        let raw = text;
        if (raw.startsWith('"') && raw.endsWith('"')) {
          raw = raw.slice(1, -1).replace(/\\"/g, '"');
        }
        if (raw && raw.trim().startsWith('[')) {
          history = JSON.parse(raw);
        }
      }
    } catch (e) {
      // Ignore
    }

    history.push({
      sender,
      message,
      time: new Date().toISOString()
    });

    // Keep only last 50 messages
    if (history.length > 50) history = history.slice(history.length - 50);

    // Update (API expects POST to /UpdateValue/AppKey/ValueStr)
    const valStr = JSON.stringify(history);
    await fetch(`${BUCKET_URL}/UpdateValue/${APP_KEY}/${encodeURIComponent(valStr)}`, {
      method: 'POST'
    });
    console.log(`Message sent successfully by ${sender}`);
  } else if (action === "read") {
    try {
      const res = await fetch(`${BUCKET_URL}/GetValue/${APP_KEY}`);
      if (res.ok) {
        const text = await res.text();
        let raw = text;
        if (raw.startsWith('"') && raw.endsWith('"')) {
          raw = raw.slice(1, -1).replace(/\\"/g, '"');
        }
        if (raw && raw.trim().startsWith('[')) {
          const history = JSON.parse(raw);
          console.log(JSON.stringify(history, null, 2));
          return;
        }
      }
      console.log("[]");
    } catch (e) {
      console.log("[]");
    }
  } else {
    console.log("Usage: node collab_sync.js [send <sender_name> <message...>] | [read]");
  }
}

run();

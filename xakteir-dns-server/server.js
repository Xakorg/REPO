const dns2 = require('dns2');
const admin = require('firebase-admin');
const { Packet } = dns2;

// 1. Initialize Firebase Admin
// Make sure to download your service account key and place it in the same directory as 'serviceAccountKey.json'
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. Fetch DNS Records from Firestore
// We will cache them in memory and refresh every 30 seconds to minimize Firestore reads
let dnsCache = new Map();

async function refreshCache() {
  try {
    const snapshot = await db.collection('dns_records').get();
    const newCache = new Map();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const type = data.type; // e.g. "A", "CNAME", "TXT", "MX"
      const domainName = data.domainName; // e.g. "example.com"
      const recordName = data.name; // e.g. "@", "www"
      
      let fullHost = domainName;
      if (recordName && recordName !== '@') {
          fullHost = `${recordName}.${domainName}`;
      }
      
      const key = `${fullHost.toLowerCase()}_${type}`;
      
      if (!newCache.has(key)) {
          newCache.set(key, []);
      }
      newCache.get(key).push({
          value: data.value,
          ttl: data.ttl || 3600
      });
    });
    
    dnsCache = newCache;
    console.log(`[${new Date().toISOString()}] Cache refreshed. Loaded ${dnsCache.size} unique records.`);
  } catch (err) {
    console.error("Error refreshing DNS cache:", err);
  }
}

// Initial fetch and interval
refreshCache();
setInterval(refreshCache, 30 * 1000); // 30 seconds

// 3. Create DNS Server
const server = dns2.createServer({
  udp: true,
  tcp: true,
  handle: (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    if (!request.questions || request.questions.length === 0) {
      send(response);
      return;
    }
    const [question] = request.questions;
    const { name } = question;
    
    console.log(`[Query] ${rinfo.address}:${rinfo.port} -> ${name} (Type: ${question.type})`);
    
    let typeStr = "A";
    if (question.type === Packet.TYPE.A) typeStr = "A";
    else if (question.type === Packet.TYPE.CNAME) typeStr = "CNAME";
    else if (question.type === Packet.TYPE.TXT) typeStr = "TXT";
    else if (question.type === Packet.TYPE.MX) typeStr = "MX";
    
    const key = `${name.toLowerCase()}_${typeStr}`;
    const records = dnsCache.get(key);
    
    if (records && records.length > 0) {
      records.forEach(rec => {
        let answerData = {
          name,
          type: question.type,
          class: Packet.CLASS.IN,
          ttl: rec.ttl
        };
        
        if (question.type === Packet.TYPE.A) {
          answerData.address = rec.value;
        } else if (question.type === Packet.TYPE.CNAME) {
          answerData.domain = rec.value;
        } else if (question.type === Packet.TYPE.TXT) {
          answerData.data = rec.value;
        } else if (question.type === Packet.TYPE.MX) {
          // Simplistic MX parsing, assumes value is domain (priority 10 hardcoded for now)
          answerData.exchange = rec.value;
          answerData.priority = 10;
        }
        
        response.answers.push(answerData);
      });
    }

    send(response);
  }
});

server.on('requestError', (error) => {
  console.log('Client Error', error);
});
server.on('listening', () => {
  console.log('XakteirDNS Server is running on port 53 (UDP & TCP)...');
});
server.on('close', () => {
  console.log('Server closed');
});

// Port 53 requires root/sudo privileges on Linux!
server.listen({
  udp: { port: 53, address: "0.0.0.0", type: "udp4" },
  tcp: { port: 53, address: "0.0.0.0" }
});

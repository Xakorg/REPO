require('dotenv').config({ path: '../.env.local' });
const { Client, GatewayIntentBits } = require('discord.js');
const admin = require('firebase-admin');

// Initialize Firebase Admin (assuming a service account is provided or ADC is used)
// For local dev without a service account JSON, we might need a workaround or we can just initialize it 
// with the config if it's available. For a Discord bot connecting to Firebase, you typically need a serviceAccountKey.json
// Let's assume the user will set GOOGLE_APPLICATION_CREDENTIALS or we initialize with a basic config if possible.

// We will attempt default initialization.
admin.initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

const db = admin.firestore();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ['CHANNEL']
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Hardcode channel mapping for simplicity, or fetch from DB in a real app
// Xakchat Channel ID -> Discord Channel ID
const CHANNEL_MAP = {
  // "xakchat-channel-id": "discord-channel-id"
};

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}!`);
  startFirestoreListener();
});

client.on('messageCreate', async (message) => {
  // Ignore bots
  if (message.author.bot) return;

  console.log(`Received message in Discord: ${message.content}`);

  // Find if this Discord channel is mapped to a Xakchat channel
  const xakchatChannelId = Object.keys(CHANNEL_MAP).find(key => CHANNEL_MAP[key] === message.channel.id);
  
  if (xakchatChannelId) {
    // Post to Xakchat
    try {
      await db.collection("chats").doc(xakchatChannelId).collection("messages").add({
        content: message.content,
        senderId: message.author.id,
        senderName: `${message.author.username} From Xakteir`,
        senderPhoto: message.author.displayAvatarURL(),
        channelId: xakchatChannelId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        source: 'discord'
      });
      console.log('✅ Forwarded Discord message to Xakchat');
    } catch (err) {
      console.error('Error forwarding to Xakchat:', err);
    }
  }

  // Handle DMs
  if (!message.guild) {
    // If it's a DM to the bot, we could route it to a specific Xakchat user's DM 
    // by finding the Xakchat user linked to this Discord ID.
    const usersSnapshot = await db.collection("users").where("discord.id", "==", message.author.id).get();
    if (!usersSnapshot.empty) {
      // It's a DM from a linked user.
      console.log('Received DM from linked user:', message.author.username);
    }
  }
});

let unsubscribe = null;
function startFirestoreListener() {
  // For this simple bridge, we watch all messages in all mapped Xakchat channels
  const xakchatChannelIds = Object.keys(CHANNEL_MAP);
  
  if (xakchatChannelIds.length === 0) {
    console.log("No channels mapped yet.");
    // We could use a collectionGroup query to watch ALL messages
    unsubscribe = db.collectionGroup("messages")
      .where("timestamp", ">", admin.firestore.Timestamp.now())
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === "added") {
            const data = change.doc.data();
            // Ignore messages that came FROM discord to prevent infinite loops
            if (data.source === 'discord') return;
            
            // For now, let's just log it if we aren't explicitly mapping
            console.log(`[XAKCHAT] ${data.senderName}: ${data.content}`);
          }
        });
      });
    return;
  }
}

if (!DISCORD_BOT_TOKEN) {
  console.error("❌ NO DISCORD BOT TOKEN PROVIDED! The bot cannot start.");
} else {
  client.login(DISCORD_BOT_TOKEN).catch(console.error);
}

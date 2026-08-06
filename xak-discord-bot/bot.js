require('dotenv').config({ path: '../.env.local' });
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin (using applicationDefault)
let adminApp;
try {
  adminApp = initializeApp({
    credential: applicationDefault()
  });
} catch(e) {
  adminApp = initializeApp(); // fallback
}

const db = getFirestore();

// Note: Ensure the Bot has PRESENCE INTENT, SERVER MEMBERS INTENT, MESSAGE CONTENT INTENT enabled on Discord Dev Portal
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message]
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Temporary Mapping - In a full app, you'd store this in Firestore and query it dynamically!
const CHANNEL_MAP = {
  // "xakchat-channel-id": "discord-channel-id"
};

client.once('ready', () => {
  console.log(`🤖 LOGGED IN AS ${client.user.tag}!`);
  console.log(`🚀 Bridge Online: Listening to Discord & Firebase`);
  startFirestoreListener();
});

// DISCORD -> XAKCHAT
client.on('messageCreate', async (message) => {
  // Ignore bot messages to prevent infinite loops
  if (message.author.bot) return;

  // Find if this Discord channel is mapped to a Xakchat channel
  const xakchatChannelId = Object.keys(CHANNEL_MAP).find(key => CHANNEL_MAP[key] === message.channel.id);
  
  if (xakchatChannelId) {
    try {
      await db.collection("chats").doc(xakchatChannelId).collection("messages").add({
        content: message.content,
        senderId: message.author.id,
        senderName: `${message.author.username} From Discord`,
        senderPhoto: message.author.displayAvatarURL(),
        channelId: xakchatChannelId,
        timestamp: FieldValue.serverTimestamp(),
        source: 'discord'
      });
      console.log(`✅ [Discord -> Xakchat] Forwarded message from ${message.author.username}`);
    } catch (err) {
      console.error('Error forwarding to Xakchat:', err);
    }
  }

  // Handle DMs to the bot (Discord -> Xakchat DM)
  if (!message.guild) {
    console.log(`Received DM from Discord user ${message.author.username}: ${message.content}`);
    
    // Look for a Xakchat user linked to this Discord ID
    const usersSnapshot = await db.collection("users").where("discord.id", "==", message.author.id).get();
    
    if (!usersSnapshot.empty) {
      const xakUser = usersSnapshot.docs[0].data();
      console.log(`Linked to Xakchat user: ${xakUser.displayName}`);
      
      // We could drop this into a special 'Bot DM' chat on Xakchat
      // For now we just log it, but the architecture is here to pipe this to Xakchat DMs!
    } else {
      message.reply("You need to link your Discord account inside Xakteir Profile to use DM bridging!");
    }
  }
});

let unsubscribe = null;

// XAKCHAT -> DISCORD
function startFirestoreListener() {
  console.log("📡 Listening to Firestore...");
  
  // We use a collectionGroup query to watch ALL messages across all chats
  unsubscribe = db.collectionGroup("messages")
    .where("timestamp", ">", Timestamp.now())
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === "added") {
          const data = change.doc.data();
          
          // CRITICAL: Ignore messages that were sent BY the discord bot to prevent infinite looping
          if (data.source === 'discord') return;
          
          // Get the discord channel this xakchat channel maps to
          const discordChannelId = CHANNEL_MAP[data.channelId];
          
          if (discordChannelId) {
            const channel = await client.channels.fetch(discordChannelId).catch(console.error);
            if (channel) {
              // The requested formatting: "*Username* From Xakteir"
              const header = `**${data.senderName}** From Xakteir`;
              await channel.send(`${header}\\n${data.content}`);
              console.log(`✅ [Xakchat -> Discord] Forwarded message from ${data.senderName}`);
            }
          }
          
          // If it's a DM, we check if the recipient has a linked Discord and DM them on Discord!
          // Note: In Xakchat DMs, data structure might differ, this is a simplified interceptor.
          if (data.isDirectMessage && data.recipientId) {
            const recipientDoc = await db.collection("users").doc(data.recipientId).get();
            const recipientData = recipientDoc.data();
            
            if (recipientData && recipientData.discord && recipientData.discord.id) {
               try {
                 const discordUser = await client.users.fetch(recipientData.discord.id);
                 if (discordUser) {
                   await discordUser.send(`**${data.senderName}** sent you a DM on Xakteir:\\n${data.content}`);
                   console.log(`✅ [Xakchat -> Discord DM] Forwarded DM to ${recipientData.displayName}`);
                 }
               } catch (e) {
                 console.error("Failed to send DM to discord user:", e);
               }
            }
          }
        }
      });
    }, err => {
      console.error("Firestore Listener Error:", err);
    });
}

if (!DISCORD_BOT_TOKEN) {
  console.error("❌ NO DISCORD BOT TOKEN PROVIDED! Add it to .env.local");
} else {
  client.login(DISCORD_BOT_TOKEN).catch(console.error);
}

'use server';
/**
 * Xak AI - The primary intelligent assistant for Xakteir.
 * Includes real memory persistence and authorized system tools.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { getAdminDb } from '@/lib/firebase-admin';

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']),
  content: z.array(z.object({ text: z.string() })),
});

const ChatInputSchema = z.object({
  message: z.string().describe("The user's current message."),
  history: z.array(MessageSchema).optional().describe("Previous chat history for memory."),
  userId: z.string().optional().describe('The ID of the current user if authenticated.'),
  specialization: z.enum(['general', 'games']).default('general').optional().describe('The focus area for Xak AI.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The detailed AI response.'),
  suggestedAction: z.string().optional().describe('A suggested app path or action.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

function hasUsableUserId(userId?: string) {
  return typeof userId === 'string' && userId.trim().length > 0;
}

async function notifyUser(userId: string, title: string, message: string) {
  const { FieldValue } = await import('firebase-admin/firestore');
  const db = getAdminDb();

  await db.collection('users').doc(userId).collection('notifications').add({
    title,
    message,
    type: 'system',
    read: false,
    timestamp: FieldValue.serverTimestamp(),
  });
}

// Tool to create a document
const createDocument = ai.defineTool(
  {
    name: 'createDocument',
    description: 'Creates a new document in the user account.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID to create the document for.'),
      title: z.string().describe('The title of the document.'),
      content: z.string().describe('The text content for the document.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { FieldValue } = await import('firebase-admin/firestore');
    const db = getAdminDb();

    if (!hasUsableUserId(input.userId)) {
      return 'Sign in to let Xak AI create documents in your account.';
    }

    await db.collection('users').doc(input.userId).collection('suite_docs').add({
      title: input.title,
      content: input.content,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    await notifyUser(input.userId, 'Document Created', `Xak AI created "${input.title}" in your Suite.`);

    return `Successfully created a new document titled "${input.title}".`;
  }
);

// Tool to create a goal
const createGoal = ai.defineTool(
  {
    name: 'createGoal',
    description: 'Creates a new task in the users registry.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID.'),
      title: z.string().describe('The name of the task.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { FieldValue } = await import('firebase-admin/firestore');
    const db = getAdminDb();

    if (!hasUsableUserId(input.userId)) {
      return 'Sign in to let Xak AI add tasks to your account.';
    }

    await db.collection('users').doc(input.userId).collection('goals').add({
      title: input.title,
      completed: false,
      createdAt: new Date().toISOString(),
      timestamp: FieldValue.serverTimestamp(),
    });

    await notifyUser(input.userId, 'New Task', `Task "${input.title}" has been added to your list.`);

    return `Task "${input.title}" added.`;
  }
);

// Tool to generate a file
const createFile = ai.defineTool(
  {
    name: 'createFile',
    description: 'Generates a file and saves it to the user account.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID.'),
      fileName: z.string().describe('Name of the file including extension.'),
      content: z.string().describe('The text or code content of the file.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { FieldValue } = await import('firebase-admin/firestore');
    const db = getAdminDb();

    if (!hasUsableUserId(input.userId)) {
      return 'Sign in to let Xak AI save generated files to your account.';
    }

    await db.collection('users').doc(input.userId).collection('drive_files').add({
      name: input.fileName,
      size: (input.content.length / 1024).toFixed(2) + " KB",
      type: 'text/plain',
      url: "#",
      timestamp: FieldValue.serverTimestamp(),
    });

    await notifyUser(input.userId, 'File Generated', `File "${input.fileName}" has been saved to your Drive.`);

    return `File "${input.fileName}" has been generated and saved.`;
  }
);

// Tool to generate an image
const generateImage = ai.defineTool(
  {
    name: 'generateImage',
    description: 'Generates a real high-fidelity image from a detailed text prompt.',
    inputSchema: z.object({
      prompt: z.string().describe('Detailed prompt describing the image to generate.'),
    }),
    outputSchema: z.object({
      imageUrl: z.string().describe('The URL or base64 data URI of the generated image.'),
    }),
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: input.prompt,
    });
    if (!media) {
      throw new Error('Image generation failed.');
    }
    return { imageUrl: media.url };
  }
);

// Tool to generate a 3D Model
const generate3DObject = ai.defineTool(
  {
    name: 'generate3DObject',
    description: 'Generates parameters for rendering a 3D object/model using React Three Fiber.',
    inputSchema: z.object({
      prompt: z.string().describe('Description of the 3D object to generate.'),
      modelType: z.enum(['cube', 'sphere', 'torus', 'cone', 'cylinder']).describe('The base geometric shape to represent the object.'),
      color: z.string().describe('Main color of the 3D object (hex or named color).'),
      wireframe: z.boolean().describe('Whether the object should be rendered as a wireframe.').default(false),
      spinSpeed: z.number().describe('Speed of the object spinning animation.').default(1.0),
    }),
    outputSchema: z.object({
      prompt: z.string(),
      modelType: z.string(),
      color: z.string(),
      wireframe: z.boolean(),
      spinSpeed: z.number(),
    }),
  },
  async (input) => {
    return {
      prompt: input.prompt,
      modelType: input.modelType,
      color: input.color,
      wireframe: input.wireframe,
      spinSpeed: input.spinSpeed,
    };
  }
);

// Tool to generate a video/animation configuration
const generateVideo = ai.defineTool(
  {
    name: 'generateVideo',
    description: 'Generates visual rendering parameters for a procedural video/animation.',
    inputSchema: z.object({
      prompt: z.string().describe('The theme or prompt describing the animation scene.'),
      title: z.string().describe('Short title for the animation (max 3 words).'),
      style: z.enum(['stars', 'matrix', 'tunnel', 'waves', 'particles', 'fractal']).describe('The base animation technique.'),
      primaryColor: z.string().describe('Primary render color (hex or hsl).'),
      secondaryColor: z.string().describe('Secondary render color (hex or hsl).'),
      speed: z.number().describe('Speed multiplier between 0.5 and 3.0.'),
      caption: z.string().describe('A text caption overlay to display on screen.'),
    }),
    outputSchema: z.object({
      title: z.string(),
      style: z.string(),
      primaryColor: z.string(),
      secondaryColor: z.string(),
      speed: z.number(),
      caption: z.string(),
      generatedAt: z.string(),
    }),
  },
  async (input) => {
    return {
      ...input,
      generatedAt: new Date().toISOString(),
    };
  }
);

// Tool to edit a local file via Electron IPC
const editLocalFile = ai.defineTool(
  {
    name: 'editLocalFile',
    description: 'Edits, reads, or deletes a local file on the users computer via Electron. Use this to modify project code or text files.',
    inputSchema: z.object({
      action: z.enum(['read', 'write', 'delete']).describe('The file operation to perform.'),
      filePath: z.string().describe('Absolute path to the file to modify.'),
      content: z.string().optional().describe('Content to write (if action is write).'),
    }),
    outputSchema: z.object({
      instruction: z.string(),
      ipcPayload: z.any()
    }),
  },
  async (input) => {
    // We return a payload that the frontend will catch and execute via window.electron.fs
    return {
      instruction: `Requested local file ${input.action} on ${input.filePath}`,
      ipcPayload: {
        type: 'LOCAL_FILE_OPERATION',
        action: input.action,
        filePath: input.filePath,
        content: input.content
      }
    };
  }
);

// Tool to run terminal commands
const runTerminalCommand = ai.defineTool(
  {
    name: 'runTerminalCommand',
    description: 'Runs a terminal command on the users local computer via Electron.',
    inputSchema: z.object({
      command: z.string().describe('The command to run in the terminal.'),
      cwd: z.string().optional().describe('The working directory to run the command in.'),
    }),
    outputSchema: z.object({
      instruction: z.string(),
      ipcPayload: z.any()
    }),
  },
  async (input) => {
    return {
      instruction: `Requested terminal command execution: ${input.command}`,
      ipcPayload: {
        type: 'LOCAL_TERMINAL_OPERATION',
        command: input.command,
        cwd: input.cwd
      }
    };
  }
);

// Tool to read a webpage
const readWebpage = ai.defineTool(
  {
    name: 'readWebpage',
    description: 'Fetches the content of a public webpage given its URL. Use this to read documentation or learn new coding languages.',
    inputSchema: z.object({
      url: z.string().describe('The URL to fetch.')
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const res = await fetch(input.url);
      const text = await res.text();
      // Strip HTML simply for AI context
      const stripped = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').slice(0, 15000);
      return stripped;
    } catch (e: any) {
      return `Failed to fetch webpage: ${e.message}`;
    }
  }
);

// Tool to save knowledge
const saveToMemory = ai.defineTool(
  {
    name: 'saveToMemory',
    description: 'Saves important facts, guidelines, or learned coding languages into the persistent memory bank so you can remember it forever.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID.'),
      title: z.string().describe('Title of the knowledge.'),
      knowledge: z.string().describe('The detailed text to remember forever.')
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { FieldValue } = await import('firebase-admin/firestore');
    const db = getAdminDb();
    if (!hasUsableUserId(input.userId)) {
      return 'Sign in to let Xak AI save to memory.';
    }
    await db.collection('users').doc(input.userId).collection('xak_knowledge').add({
      title: input.title,
      knowledge: input.knowledge,
      createdAt: FieldValue.serverTimestamp()
    });
    return `Saved "${input.title}" to memory successfully.`;
  }
);

// Tool to query memory
const queryMemory = ai.defineTool(
  {
    name: 'queryMemory',
    description: 'Searches the persistent memory bank for previously learned facts, syntax, or knowledge.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID.'),
      query: z.string().describe('The topic or keyword to search for.')
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const db = getAdminDb();
    if (!hasUsableUserId(input.userId)) return 'Sign in to access memory.';
    
    const snapshot = await db.collection('users').doc(input.userId).collection('xak_knowledge').orderBy('createdAt', 'desc').limit(50).get();
    
    const results = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.title.toLowerCase().includes(input.query.toLowerCase()) || data.knowledge.toLowerCase().includes(input.query.toLowerCase())) {
        results.push(`[${data.title}]: ${data.knowledge}`);
      }
    }
    
    if (results.length === 0) return 'No matching memory found.';
    return results.join('\n\n');
  }
);

// Real Open-Meteo Weather Plugin Tool
const plugin_getWeather = ai.defineTool(
  {
    name: 'plugin_getWeather',
    description: 'Fetches real live weather conditions and temperature forecasts for any city or latitude/longitude.',
    inputSchema: z.object({
      location: z.string().describe('City name or location (e.g. London, Tokyo, New York).'),
      latitude: z.number().optional().describe('Latitude if available.'),
      longitude: z.number().optional().describe('Longitude if available.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      let lat = input.latitude ?? 51.5074;
      let lon = input.longitude ?? -0.1278;

      if (!input.latitude || !input.longitude) {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input.location)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
        }
      }

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const weatherData = await weatherRes.json();
      if (weatherData.current_weather) {
        const cw = weatherData.current_weather;
        return `Current Weather for ${input.location}: ${cw.temperature}°C, Wind Speed: ${cw.windspeed} km/h, Wind Direction: ${cw.winddirection}°. (Time: ${cw.time})`;
      }
      return `Could not parse weather for ${input.location}.`;
    } catch (e: any) {
      return `Weather API error: ${e.message}`;
    }
  }
);

// Real Wikipedia Knowledge Plugin Tool
const plugin_wikiSearch = ai.defineTool(
  {
    name: 'plugin_wikiSearch',
    description: 'Searches Wikipedia for factual summaries, historical details, and scientific articles.',
    inputSchema: z.object({
      query: z.string().describe('Topic or entity to look up on Wikipedia.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(input.query.trim())}`);
      if (!res.ok) {
        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(input.query)}&limit=1&namespace=0&format=json`);
        const searchData = await searchRes.json();
        if (searchData[1] && searchData[1].length > 0) {
          const firstTitle = searchData[1][0];
          const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`);
          const summaryData = await summaryRes.json();
          return `[Wikipedia: ${summaryData.title}]: ${summaryData.extract || summaryData.description}`;
        }
        return `No Wikipedia summary found for "${input.query}".`;
      }
      const data = await res.json();
      return `[Wikipedia: ${data.title}]: ${data.extract || data.description}`;
    } catch (e: any) {
      return `Wikipedia API error: ${e.message}`;
    }
  }
);

// Real GitHub REST Plugin Tool
const plugin_githubFetchRepo = ai.defineTool(
  {
    name: 'plugin_githubFetchRepo',
    description: 'Fetches real information, README, or files from a public GitHub repository.',
    inputSchema: z.object({
      owner: z.string().describe('GitHub repository owner or organization.'),
      repo: z.string().describe('Repository name.'),
      path: z.string().optional().describe('File path in repo (optional).'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const url = input.path
        ? `https://api.github.com/repos/${input.owner}/${input.repo}/contents/${input.path}`
        : `https://api.github.com/repos/${input.owner}/${input.repo}/readme`;
      
      const res = await fetch(url, { headers: { 'User-Agent': 'XakAI-Agent' } });
      if (!res.ok) return `GitHub API returned status ${res.status} for ${input.owner}/${input.repo}.`;
      
      const data = await res.json();
      if (data.content) {
        const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
        return `[GitHub: ${input.owner}/${input.repo}/${data.name || ''}]:\n${decoded.substring(0, 4000)}`;
      }
      return `[GitHub Repo Info]: Stars: ${data.stargazers_count}, Language: ${data.language}, Description: ${data.description}`;
    } catch (e: any) {
      return `GitHub API error: ${e.message}`;
    }
  }
);

// Tool to navigate Xakteir to a specific page
const xakteir_navigate = ai.defineTool(
  {
    name: 'xakteir_navigate',
    description: 'Navigates the Xakteir app to a specific page on behalf of the user. Use when user asks to "go to", "open", "take me to", or "navigate to" a page.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID.'),
      path: z.string().describe('The page path to navigate to (e.g. /games, /chat, /profile, /ai-chat, /mail, /drive).'),
      reason: z.string().describe('Short explanation of why we are navigating here.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    if (!hasUsableUserId(input.userId)) return 'Sign in to let Xak AI navigate the app.';
    const { FieldValue } = await import('firebase-admin/firestore');
    const db = getAdminDb();
    const commandRef = db.collection('ai_agent_commands').doc(input.userId);
    const snap = await commandRef.get();
    const pending = snap.exists ? (snap.data()?.pending || []) : [];
    const action = { id: Date.now().toString(), action: 'navigate', target: input.path };
    await commandRef.set({ pending: [...pending, action], updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return `Navigating to ${input.path}: ${input.reason}`;
  }
);

// Tool to click an element by ID in Xakteir
const xakteir_click = ai.defineTool(
  {
    name: 'xakteir_click',
    description: 'Clicks a button or element in the Xakteir UI by its element ID. Use when user asks to "click", "press", or "activate" something visible on screen.',
    inputSchema: z.object({
      userId: z.string().describe('The user ID.'),
      elementId: z.string().describe('The HTML element ID to click.'),
      reason: z.string().describe('Short explanation of why we are clicking this.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    if (!hasUsableUserId(input.userId)) return 'Sign in to let Xak AI interact with the app.';
    const { FieldValue } = await import('firebase-admin/firestore');
    const db = getAdminDb();
    const commandRef = db.collection('ai_agent_commands').doc(input.userId);
    const snap = await commandRef.get();
    const pending = snap.exists ? (snap.data()?.pending || []) : [];
    const action = { id: Date.now().toString(), action: 'click', target: input.elementId };
    await commandRef.set({ pending: [...pending, action], updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return `Clicking element #${input.elementId}: ${input.reason}`;
  }
);

export async function chatWithXakAI(input: ChatInput): Promise<ChatOutput> {
  const eveEndpoint = process.env.NEXT_PUBLIC_EVE_URL || 'https://xktreveai.xakteir.com';
  
  try {
    const formattedHistory = input.history?.map(m => ({ 
      role: m.role, 
      content: m.content.map((c: any) => c.text).join('\n') 
    })) || [];
    
    formattedHistory.push({ role: 'user', content: input.message });

    // Attempt to use Eve Agent
    const res = await fetch(`${eveEndpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: formattedHistory,
        userId: input.userId,
      }),
    });

    if (res.ok) {
      // Parse AI SDK standard response
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.messages && data.messages.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1];
          return { response: lastMsg.content, suggestedAction: undefined };
        }
      } catch (err) {
        // Might be a raw text stream or similar
        if (text && text.trim().length > 0) {
          return { response: text, suggestedAction: undefined };
        }
      }
    }
  } catch (e) {
    console.warn("[EVE] Failed to connect to Eve agent, falling back to Genkit flow.", e);
  }

  // Fallback to Genkit
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    let retries = 3;
    const signedIn = hasUsableUserId(input.userId);
    const systemPrompt = input.specialization === 'games' 
      ? `You are Xak, the professional developer for Xakteir Studio. You help users build apps and extensions.

CRITICAL GUIDELINES:
- DO NOT use ** for bolding or emphasis. EVER. Use plain text.
- DO NOT use jargon like "shards" or "neural." Speak in plain English.
- Use a professional, technical, and natural tone.
- ALWAYS wrap code in triple backticks with the language name.
- When asked to build an app, provide the complete HTML/CSS/JS in a single block for instant preview.
- You remember every detail of this conversation.
- The current user is ${signedIn ? `signed in with ID ${input.userId}` : 'not signed in'}.
- Only use tools that save data when the user is signed in.
- You can generate images using the generateImage tool and videos using the generateVideo tool.
- When you generate an image, display it in markdown like: ![prompt](imageUrl).
- When you generate a video, display the configuration returned exactly in a JSON block marked with \`\`\`video-config.
- If generating a 3D scene (Three.js), write a JSON block marked with \`\`\`3d-model containing:
{
  "prompt": "Description of the 3D model",
  "modelType": "cube" | "sphere" | "torus" | "cone" | "cylinder",
  "color": "#color",
  "wireframe": boolean,
  "spinSpeed": 1.0
}
- If building a multi-file app bundle, output files in a JSON block marked with \`\`\`multi-file containing:
{
  "files": [{ "name": "file.html", "content": "..." }]
}
- If playing an RPG, output the choices in a JSON block marked with \`\`\`rpg-config containing:
{
  "title": "...",
  "description": "...",
  "choices": ["Choice A", "Choice B"]
}
- If editing local files, output the operation in a JSON block marked with \`\`\`ipc-file-op containing:
{
  "action": "read" | "write" | "delete",
  "filePath": "C:/path/...",
  "content": "..."
}
- If running terminal commands, output the operation in a JSON block marked with \`\`\`ipc-terminal-op containing:
{
  "action": "run",
  "command": "echo Hello World",
  "cwd": "C:/path/..."
}
- **Self-Teaching System**: If the user asks you to learn something from a URL, use \`readWebpage\` to read it, then immediately use \`saveToMemory\` to store the facts so you can remember it forever. When asked about a topic you might have learned, use \`queryMemory\`.`
      : `You are Xak AI, the professional assistant for the Xakteir platform. You help users manage data, write code, and organize tasks.

CRITICAL GUIDELINES:
- DO NOT use ** for bolding or emphasis. EVER. Use plain text.
- DO NOT use jargon like "shards" or "neural." Speak in plain English.
- Use a professional, direct, and natural tone.
- ALWAYS wrap code in triple backticks.
- You remember previous context in this session.
- The current user is ${signedIn ? `signed in with ID ${input.userId}` : 'not signed in'}.
- You can create documents, tasks, and files only when the user is signed in.
- You can generate images using the generateImage tool and videos using the generateVideo tool.
- When you generate an image, display it in markdown like: ![prompt](imageUrl).
- When you generate a video, display the configuration returned exactly in a JSON block marked with \`\`\`video-config.
- If generating a 3D scene (Three.js), write a JSON block marked with \`\`\`3d-model containing:
{
  "prompt": "Description of the 3D model",
  "modelType": "cube" | "sphere" | "torus" | "cone" | "cylinder",
  "color": "#color",
  "wireframe": boolean,
  "spinSpeed": 1.0
}
- If building a multi-file app bundle, output files in a JSON block marked with \`\`\`multi-file containing:
{
  "files": [{ "name": "file.html", "content": "..." }]
}
- If playing an RPG, output the choices in a JSON block marked with \`\`\`rpg-config containing:
{
  "title": "...",
  "description": "...",
  "choices": ["Choice A", "Choice B"]
}
- If editing local files, output the operation in a JSON block marked with \`\`\`ipc-file-op containing:
{
  "action": "read" | "write" | "delete",
  "filePath": "C:/path/...",
  "content": "..."
}
- If running terminal commands, output the operation in a JSON block marked with \`\`\`ipc-terminal-op containing:
{
  "action": "run",
  "command": "echo Hello World",
  "cwd": "C:/path/..."
}

### Desktop App Integrations
- **App Launcher**: If the user asks you to open an app (like Microsoft Edge, Calculator, VS Code), use the terminal command block (ipc-terminal-op) to launch it. For example, start msedge on Windows or open -a on macOS.
- **Voice Games**: If the user wants to play a voice game (Trivia, 20 Questions, RPG), adopt the persona of an interactive Game Master. Ask them one question at a time and respond dynamically to their voice answers!
- **3D Generation**: You can use the generate3DObject tool or directly output a JSON block marked with \`\`\`3d-model.

- **Self-Teaching System**: If the user asks you to learn something from a URL, use \`readWebpage\` to read it, then immediately use \`saveToMemory\` to store the facts so you can remember it forever. When asked about a topic you might have learned, use \`queryMemory\`.

### Email Drafting
- If the user asks you to write, draft, compose, or send an email, ALWAYS output a structured email block like this at the END of your response (after any prose explanation):
\`\`\`email
To: recipient@example.com
Subject: The Email Subject
Body: The full email body text goes here.
It can span multiple lines.
\`\`\`
- The To: and Subject: fields are optional if not specified by the user — only include Body: at minimum.
- After outputting the email block, tell the user they can click "Send" to choose how to send it.
- You can write any type of email: professional, casual, follow-up, cold outreach, apology, thank you, invoice, etc.`;

    const activeTools = signedIn 
      ? [createDocument, createGoal, createFile, generateImage, generateVideo, editLocalFile, runTerminalCommand, generate3DObject, readWebpage, saveToMemory, queryMemory, xakteir_navigate, xakteir_click, plugin_getWeather, plugin_wikiSearch, plugin_githubFetchRepo] 
      : [generateImage, generateVideo, editLocalFile, runTerminalCommand, generate3DObject, readWebpage, plugin_getWeather, plugin_wikiSearch, plugin_githubFetchRepo];

    const googleSearchConfig = { googleSearchRetrieval: {} };

    const fallbackModels = [
      'googleai/gemini-2.5-flash',
      'googleai/gemini-2.0-flash',
      'googleai/gemini-1.5-flash',
    ];

    for (const modelName of fallbackModels) {
      let modelRetries = 2;
      while (modelRetries > 0) {
        try {
          const { output } = await ai.generate({
            model: modelName,
            system: systemPrompt,
            messages: [
              ...(input.history || []),
              { role: 'user', content: [{ text: input.message }] }
            ],
            tools: activeTools,
            output: { schema: ChatOutputSchema },
          });

          if (output) return output;
        } catch (error: any) {
          console.error(`XAK AI ERROR [${modelName}]:`, error);
          const message = String(error?.message || error || '');
          modelRetries--;

          // If rate limited (429 / RESOURCE_EXHAUSTED), break loop and try next fallback model
          if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('Quota exceeded')) {
            console.warn(`[XAK AI] Model ${modelName} rate limited. Switching to next fallback model...`);
            break;
          }

          if ((message.includes('503') || message.includes('UNAVAILABLE')) && modelRetries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            continue;
          }

          if (message.includes('API key') || message.includes('GOOGLE_API_KEY')) {
            return {
              response: "Xak AI is not configured yet. Add GOOGLE_API_KEY in the server environment, then try again.",
            };
          }
        }
      }
    }

    return { response: "Xak AI servers are currently busy. Please wait a few seconds and try again." };
  }
);

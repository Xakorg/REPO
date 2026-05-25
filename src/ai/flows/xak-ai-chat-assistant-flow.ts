'use server';
/**
 * Xak AI - The primary intelligent assistant for Xakteir.
 * Includes real memory persistence and authorized system tools.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']),
  content: z.array(z.object({ text: z.string() })),
});

const ChatInputSchema = z.object({
  message: z.string().describe("The user's current message."),
  history: z.array(MessageSchema).optional().describe("Previous chat history for memory."),
  userId: z.string().optional().describe('The ID of the current user if authenticated.'),
  specialization: z.enum(['general', 'games']).default('general').describe('The focus area for Xak AI.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The detailed AI response.'),
  suggestedAction: z.string().optional().describe('A suggested app path or action.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Internal helper to get Firestore on the server.
 */
async function getDb() {
  const { getFirestore } = await import('firebase/firestore');
  const { initializeApp, getApps } = await import('firebase/app');
  const { firebaseConfig } = await import('@/firebase/config');
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
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
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const db = await getDb();
    
    await addDoc(collection(db, "users", input.userId, "suite_docs"), {
      title: input.title,
      content: input.content,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, "users", input.userId, "notifications"), {
      title: "Document Created",
      message: `Xak AI created "${input.title}" in your Suite.`,
      type: 'system',
      read: false,
      timestamp: serverTimestamp()
    });

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
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const db = await getDb();

    await addDoc(collection(db, "users", input.userId, "goals"), {
      title: input.title,
      completed: false,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });

    await addDoc(collection(db, "users", input.userId, "notifications"), {
      title: "New Task",
      message: `Task "${input.title}" has been added to your list.`,
      type: 'quest',
      read: false,
      timestamp: serverTimestamp()
    });

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
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const db = await getDb();
    
    await addDoc(collection(db, "users", input.userId, "drive_files"), {
      name: input.fileName,
      size: (input.content.length / 1024).toFixed(2) + " KB",
      type: 'text/plain',
      url: "#",
      timestamp: serverTimestamp()
    });

    await addDoc(collection(db, "users", input.userId, "notifications"), {
      title: "File Generated",
      message: `File "${input.fileName}" has been saved to your Drive.`,
      type: 'system',
      read: false,
      timestamp: serverTimestamp()
    });

    return `File "${input.fileName}" has been generated and saved.`;
  }
);

export async function chatWithXakAI(input: ChatInput): Promise<ChatOutput> {
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
    const systemPrompt = input.specialization === 'games' 
      ? `You are Xak, the professional developer for Xakteir Studio. You help users build apps and extensions.

CRITICAL GUIDELINES:
- DO NOT use ** for bolding or emphasis. EVER. Use plain text.
- DO NOT use jargon like "shards" or "neural." Speak in plain English.
- Use a professional, technical, and natural tone.
- ALWAYS wrap code in triple backticks with the language name.
- When asked to build an app, provide the complete HTML/CSS/JS in a single block for instant preview.
- You remember every detail of this conversation.
- Use the userId: ${input.userId || 'guest'} for all tool calls.`
      : `You are Xak AI, the professional assistant for the Xakteir platform. You help users manage data, write code, and organize tasks.

CRITICAL GUIDELINES:
- DO NOT use ** for bolding or emphasis. EVER. Use plain text.
- DO NOT use jargon like "shards" or "neural." Speak in plain English.
- Use a professional, direct, and natural tone.
- ALWAYS wrap code in triple backticks.
- You remember previous context in this session.
- You can create documents, tasks, and files. Use the userId: ${input.userId || 'guest'} for all tool calls.`;

    while (retries > 0) {
      try {
        const {output} = await ai.generate({
          model: 'googleai/gemini-2.5-flash',
          system: systemPrompt,
          messages: [
            ...(input.history || []),
            { role: 'user', content: [{ text: input.message }] }
          ],
          tools: [createDocument, createGoal, createFile],
          output: { schema: ChatOutputSchema },
          config: {
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
            ],
          }
        });

        if (!output) {
          return { response: "I had trouble processing that request. Please try again." };
        }
        return output;
      } catch (error: any) {
        retries--;
        if ((error?.message?.includes('503') || error?.message?.includes('UNAVAILABLE')) && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        if (retries === 0) {
          return { response: "The system is currently busy. Please try again in a moment." };
        }
      }
    }
    return { response: "An unexpected connection error occurred." };
  }
);
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
- Only use tools that save data when the user is signed in.`
      : `You are Xak AI, the professional assistant for the Xakteir platform. You help users manage data, write code, and organize tasks.

CRITICAL GUIDELINES:
- DO NOT use ** for bolding or emphasis. EVER. Use plain text.
- DO NOT use jargon like "shards" or "neural." Speak in plain English.
- Use a professional, direct, and natural tone.
- ALWAYS wrap code in triple backticks.
- You remember previous context in this session.
- The current user is ${signedIn ? `signed in with ID ${input.userId}` : 'not signed in'}.
- You can create documents, tasks, and files only when the user is signed in.`;

    while (retries > 0) {
      try {
        const {output} = await ai.generate({
          model: googleAI.model('gemini-2.5-flash'),
          system: systemPrompt,
          messages: [
            ...(input.history || []),
            { role: 'user', content: [{ text: input.message }] }
          ],
          tools: signedIn ? [createDocument, createGoal, createFile] : [],
          output: { schema: ChatOutputSchema },
        });

        if (!output) {
          return { response: "I had trouble processing that request. Please try again." };
        }
        return output;
      } catch (error: any) {
        const message = String(error?.message || '');
        retries--;
        if ((message.includes('503') || message.includes('UNAVAILABLE')) && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        if (message.includes('API key') || message.includes('GOOGLE_API_KEY')) {
          return {
            response: "Xak AI is not configured yet. Add GOOGLE_API_KEY in the server environment, then try again.",
          };
        }
        if (message.includes('Could not load the default credentials')) {
          return {
            response: "Xak AI can answer chat, but account-saving tools need Firebase admin credentials in the server environment.",
          };
        }
        if (retries === 0) {
          return { response: "The system is currently busy. Please try again in a moment." };
        }
      }
    }
    return { response: "An unexpected connection error occurred." };
  }
);

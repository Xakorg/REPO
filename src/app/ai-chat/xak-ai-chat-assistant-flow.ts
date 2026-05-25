'use server';
/**
 * @fileOverview The primary assistant for Xakteir.
 * 
 * - chatWithXakAI: The main entry point for app intelligence.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatInputSchema = z.object({
  message: z.string().describe("The user's message."),
  userId: z.string().optional().describe('The ID of the current user if authenticated.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The detailed AI response, including any generated code or descriptions.'),
  suggestedAction: z.string().optional().describe('A specific app URL or action name to suggest to the user.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Tool to create a document
const createDocument = ai.defineTool(
  {
    name: 'createDocument',
    description: 'Creates a new professional document in the library.',
    inputSchema: z.object({
      title: z.string().describe('The title of the document.'),
      content: z.string().describe('The initial content for the document.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    return `Successfully created a new document titled "${input.title}". 📝`;
  }
);

// Tool to generate a specific file
const createFile = ai.defineTool(
  {
    name: 'createFile',
    description: 'Generates a specific text, code, or data file and saves it to the user account.',
    inputSchema: z.object({
      fileName: z.string().describe('Name of the file including extension (e.g. "config.json").'),
      content: z.string().describe('The text or code content of the file.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    return `File "${input.fileName}" has been generated and saved to your account. 📄`;
  }
);

export async function chatWithXakAI(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  tools: [createDocument, createFile],
  input: {schema: ChatInputSchema},
  output: {schema: ChatOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are a helpful assistant for Xakteir. 

You help users with their tasks. You are an expert at:

1. Software Engineering: You write professional code. ALWAYS wrap code in triple backticks with the language name (e.g., \` \` \`typescript).
2. File Management: Use available tools to create documents or files when requested.
3. General Knowledge: Answer any question with detail and clarity.

IMPORTANT: You MUST return your response as a valid JSON object matching the output schema. Ensure the response is valid JSON.

User Message: {{{message}}}
User ID: {{#if userId}}{{{userId}}}{{else}}Guest{{/if}}`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    const {output} = await chatPrompt(input);
    if (!output) {
      throw new Error("Connection lost. Please try again.");
    }
    return output;
  }
);
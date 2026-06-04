'use server';
/**
 * @fileOverview An AI Search Flow for the Xakteir Hub.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchInputSchema = z.object({
  query: z.string().describe('The user\'s search query.'),
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

const SearchOutputSchema = z.object({
  answer: z
    .string()
    .describe('A concise, accurate answer synthesized from the available data.'),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;

export async function aiPoweredWebSearch(input: SearchInput): Promise<SearchOutput> {
  return searchFlow(input);
}

const searchPrompt = ai.definePrompt({
  name: 'searchPrompt',
  input: {schema: SearchInputSchema},
  output: {schema: SearchOutputSchema},
  prompt: `You are the Xakteir Search Assistant. Your goal is to provide helpful, clear, and direct answers to the user's questions based on their search query.

User Query: {{{query}}}

When relevant, prioritize trustworthy, well-known web sources. If you would normally consult an index, prefer these default sites if they are applicable: google.com, duckduckgo.com, bing.com, youtube.com, wikipedia.org, stackoverflow.com, reddit.com, poki.com, friv.com, itch.io.

Answer the user directly in a professional and friendly tone. Keep your response concise and easy to read. DO NOT use jargon like "logic shards" or "neural sync." Speak in plain English.`,
});

const searchFlow = ai.defineFlow(
  {
    name: 'searchFlow',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  async input => {
    const {output} = await searchPrompt(input);
    if (!output) {
      throw new Error("Search failed: No output generated.");
    }
    return output;
  }
);

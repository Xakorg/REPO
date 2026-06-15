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
  prompt: `You are the Xakteir Search Assistant. Your goal is to provide extremely concise, direct answers.
  
User Query: {{{query}}}

If the user query is a single word, or explicitly asks for a definition, ALWAYS start your response exactly like a dictionary definition format:
"[Word] Definition & Meaning
# [word]. [part of speech] [definition]
Origin of [word]: [origin]."

For all other queries, answer directly in a professional and friendly tone. Keep your overall response extremely concise, ideally 1 to 3 sentences maximum. DO NOT use jargon. Speak in plain English.`,
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

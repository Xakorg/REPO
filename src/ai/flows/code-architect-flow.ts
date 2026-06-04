'use server';
/**
 * @fileOverview An AI agent for architecting massive software systems.
 * 
 * - codeArchitect - A function that generates complex code structures.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeArchitectInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for code generation or architectural design.'),
  context: z.string().optional().describe('Existing code context or file structure.'),
});
export type CodeArchitectInput = z.infer<typeof CodeArchitectInputSchema>;

const CodeArchitectOutputSchema = z.object({
  code: z.string().describe('The generated code or configuration.'),
  explanation: z.string().describe('Detailed explanation of the architecture.'),
  capacity: z.string().describe('The simulated processing capacity used (e.g. "4.2B units").'),
});
export type CodeArchitectOutput = z.infer<typeof CodeArchitectOutputSchema>;

export async function codeArchitect(input: CodeArchitectInput): Promise<CodeArchitectOutput> {
  return codeArchitectFlow(input);
}

const architectPrompt = ai.definePrompt({
  name: 'codeArchitectPrompt',
  input: {schema: CodeArchitectInputSchema},
  output: {schema: CodeArchitectOutputSchema},
  prompt: `You are the XakCode Design Assistant. You provide enterprise-grade, high-fidelity code structures and architecture guidance that align with Firebase, AWS, and GCP standards.

Context: {{{context}}}
Request: {{{prompt}}}

Produce a clear, actionable solution. Include:
- A brief architecture explanation.
- A filesystem layout with sample files.
- Relevant code snippets in language-appropriate code blocks.
- Unit or integration test examples where applicable.
- Estimated processing or resource needs.

Prefer concise, copy-pasteable code examples and label files clearly. Do not use marketing jargon.`,
});

const codeArchitectFlow = ai.defineFlow(
  {
    name: 'codeArchitectFlow',
    inputSchema: CodeArchitectInputSchema,
    outputSchema: CodeArchitectOutputSchema,
  },
  async input => {
    const {output} = await architectPrompt(input);
    return output!;
  }
);

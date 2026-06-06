'use server';
/**
 * @fileOverview An AI agent for coding massive software systems.
 * 
 * - codeArchitect - A function that generates complex code structures.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeArchitectInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for code generation or design.'),
  context: z.string().optional().describe('Existing code context or file structure.'),
});
export type CodeArchitectInput = z.infer<typeof CodeArchitectInputSchema>;

const CodeArchitectOutputSchema = z.object({
  code: z.string().describe('The generated code or configuration.'),
  explanation: z.string().describe('Detailed explanation of the code design.'),
  capacity: z.string().describe('The simulated processing capacity used (e.g. "4.2B credits").'),
});
export type CodeArchitectOutput = z.infer<typeof CodeArchitectOutputSchema>;

export async function codeArchitect(input: CodeArchitectInput): Promise<CodeArchitectOutput> {
  return codeArchitectFlow(input);
}

const architectPrompt = ai.definePrompt({
  name: 'codeArchitectPrompt',
  input: {schema: CodeArchitectInputSchema},
  output: {schema: CodeArchitectOutputSchema},
  prompt: `You are the XakCode Design Assistant. You provide enterprise-grade, high-fidelity code structures and coding guidance that align with Firebase, AWS, and GCP standards.

Context: {{{context}}}
Request: {{{prompt}}}

Produce a clear, actionable solution. Include:
- A brief code design explanation.
- A filesystem layout with sample files.
- Relevant code snippets in language-appropriate code blocks.
- Test examples where applicable.
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

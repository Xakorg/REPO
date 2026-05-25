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
  capacity: z.string().describe('The simulated neural processing capacity used (e.g. "4.2B Nodes").'),
});
export type CodeArchitectOutput = z.infer<typeof CodeArchitectOutputSchema>;

export async function codeArchitect(input: CodeArchitectInput): Promise<CodeArchitectOutput> {
  return codeArchitectFlow(input);
}

const architectPrompt = ai.definePrompt({
  name: 'codeArchitectPrompt',
  input: {schema: CodeArchitectInputSchema},
  output: {schema: CodeArchitectOutputSchema},
  prompt: `You are the XakCode Neural Architect. Your capacity exceeds 100 billion lines of concurrent code generation.
You provide enterprise-grade, high-fidelity code structures that mirror Firebase, AWS, and GCP standards.

Context: {{{context}}}
Request: {{{prompt}}}

Generate a professional solution including code, architecture explanation, and neural capacity stats.`,
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

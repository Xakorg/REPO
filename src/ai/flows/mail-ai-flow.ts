'use server';
/**
 * @fileOverview AI Flow for Xakteir Mail Assist.
 * Handles summarizing, explaining, and refining email content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MailAssistInputSchema = z.object({
  content: z.string().describe('The email content to analyze or refine.'),
  action: z.enum(['explain', 'summarize', 'refine', 'risk_check', 'voice_clean']).describe('The assist action requested.'),
  tone: z.string().optional().describe('Optional tone for refinement (e.g., formal, friendly).'),
});

const MailAssistOutputSchema = z.object({
  result: z.string().describe('The processed text or analysis.'),
  explanation: z.string().optional().describe('Brief context for why the AI made certain changes.'),
  riskLevel: z.enum(['safe', 'low', 'suspicious', 'dangerous']).optional().describe('Risk assessment for the content.'),
});

export async function assistMail(input: z.infer<typeof MailAssistInputSchema>) {
  return mailAssistFlow(input);
}

const mailAssistPrompt = ai.definePrompt({
  name: 'mailAssistPrompt',
  input: {schema: MailAssistInputSchema},
  output: {schema: MailAssistOutputSchema},
  prompt: `You are the XakMail AI Assistant. Your goal is to help creators manage their transmissions with precision and friendliness.

ACTION: {{{action}}}
CONTENT: {{{content}}}
{{#if tone}}PREFERRED TONE: {{{tone}}}{{/if}}

GUIDELINES:
- If 'explain': Simplify the email, explain what it's about, and suggest a next step.
- If 'summarize': Provide exactly 3 bullet points of the most important info.
- If 'refine': Rewrite the text based on the PREFERRED TONE. Keep it professional and clear.
- If 'risk_check': Identify phishing, pressure tactics, or suspicious links. Explain why calmly.
- If 'voice_clean': Turn messy spoken notes into a clean, professional email draft.`,
});

const mailAssistFlow = ai.defineFlow(
  {
    name: 'mailAssistFlow',
    inputSchema: MailAssistInputSchema,
    outputSchema: MailAssistOutputSchema,
  },
  async input => {
    const {output} = await mailAssistPrompt(input);
    return output!;
  }
);

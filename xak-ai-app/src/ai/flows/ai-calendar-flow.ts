'use server';
/**
 * @fileOverview An AI agent for generating personalized daily schedules based on user moods or goals.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCalendarInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for how they want their day to look (e.g., "fun", "productive", "relaxing").'),
});
export type AiCalendarInput = z.infer<typeof AiCalendarInputSchema>;

const AiCalendarOutputSchema = z.object({
  schedule: z.array(z.object({
    time: z.string().describe('The start time of the activity (e.g., "09:00 AM").'),
    activity: z.string().describe('The name of the activity.'),
    duration: z.string().describe('How long the activity lasts.'),
    type: z.enum(['work', 'fun', 'health', 'social', 'focus']).describe('The category of activity.'),
  })).describe('A list of activities for the day.'),
  summary: z.string().describe('A brief, encouraging summary of the day plan.'),
});
export type AiCalendarOutput = z.infer<typeof AiCalendarOutputSchema>;

export async function generateAiSchedule(
  input: AiCalendarInput
): Promise<AiCalendarOutput> {
  return aiCalendarFlow(input);
}

const aiCalendarPrompt = ai.definePrompt({
  name: 'aiCalendarPrompt',
  input: {schema: AiCalendarInputSchema},
  output: {schema: AiCalendarOutputSchema},
  prompt: `You are the XakPlan AI Assistant. Your goal is to create a perfect daily schedule based on the user's mood or request.
If they want a "fun" day, include games and socializing. If they want "productive", focus on deep work and learning.

User Request: {{{prompt}}}`,
});

const aiCalendarFlow = ai.defineFlow(
  {
    name: 'aiCalendarFlow',
    inputSchema: AiCalendarInputSchema,
    outputSchema: AiCalendarOutputSchema,
  },
  async input => {
    const {output} = await aiCalendarPrompt(input);
    return output!;
  }
);

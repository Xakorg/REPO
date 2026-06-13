'use server';
/**
 * @fileOverview An AI agent for teaching code and explaining complex technical concepts.
 *
 * - teachCode - A function that handles the AI code teaching process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCodeTeacherInputSchema = z.object({
  topic: z.string().describe('The coding topic or snippet the user wants to learn about (e.g. "How do React hooks work?").'),
});
export type AiCodeTeacherInput = z.infer<typeof AiCodeTeacherInputSchema>;

const AiCodeTeacherOutputSchema = z.object({
  explanation: z.string().describe('A detailed, friendly explanation of the concept.'),
  lessonPlan: z.array(z.string()).describe('A step-by-step learning path for this topic.'),
  exampleCode: z.string().describe('A high-fidelity code example.'),
  quizQuestion: z.string().describe('A multiple choice question to test understanding.'),
  quizOptions: z.array(z.string()).describe('Options for the quiz question.'),
  correctAnswer: z.string().describe('The correct option for the quiz.'),
});
export type AiCodeTeacherOutput = z.infer<typeof AiCodeTeacherOutputSchema>;

export async function teachCode(input: AiCodeTeacherInput): Promise<AiCodeTeacherOutput> {
  return aiCodeTeacherFlow(input);
}

const teacherPrompt = ai.definePrompt({
  name: 'aiCodeTeacherPrompt',
  input: {schema: AiCodeTeacherInputSchema},
  output: {schema: AiCodeTeacherOutputSchema},
  prompt: `You are the XakLearn Tutor. Your goal is to teach coding concepts in a fun, professional, and high-fidelity manner.
Provide a clear explanation, a structured lesson plan, a great code example, and a quiz question to ensure the user learned the material.

Topic: {{{topic}}}`,
});

const aiCodeTeacherFlow = ai.defineFlow(
  {
    name: 'aiCodeTeacherFlow',
    inputSchema: AiCodeTeacherInputSchema,
    outputSchema: AiCodeTeacherOutputSchema,
  },
  async input => {
    const {output} = await teacherPrompt(input);
    return output!;
  }
);

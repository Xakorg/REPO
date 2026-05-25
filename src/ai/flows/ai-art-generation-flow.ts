'use server';
/**
 * @fileOverview An AI agent for generating high-fidelity images using Google's Imagen model.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiArtInputSchema = z.object({
  prompt: z.string().describe('The description of the image to generate.'),
});
export type AiArtInput = z.infer<typeof AiArtInputSchema>;

const AiArtOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type AiArtOutput = z.infer<typeof AiArtOutputSchema>;

export async function generateAiArt(input: AiArtInput): Promise<AiArtOutput> {
  return aiArtFlow(input);
}

const aiArtFlow = ai.defineFlow(
  {
    name: 'aiArtFlow',
    inputSchema: AiArtInputSchema,
    outputSchema: AiArtOutputSchema,
  },
  async input => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: input.prompt,
    });

    if (!media) {
      throw new Error('Failed to generate image shard.');
    }

    return {
      imageUrl: media.url,
    };
  }
);

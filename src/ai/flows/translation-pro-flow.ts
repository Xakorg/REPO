
'use server';
/**
 * @fileOverview A high-fidelity translation agent for Xakteir.
 * Handles multimodal translation including OCR and conversational context.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslationInputSchema = z.object({
  text: z.string().optional().describe('Text to translate.'),
  photoDataUri: z.string().optional().describe('Photo of text to translate as a data URI.'),
  fromLanguage: z.string().describe('Source language.'),
  toLanguage: z.string().describe('Target language.'),
  isConversation: z.boolean().optional().describe('Whether this is part of a dialogue.')
});

const TranslationOutputSchema = z.object({
  translatedText: z.string().describe('The translated result.'),
  pronunciation: z.string().optional().describe('Phonetic guide for the translation.'),
  detectedText: z.string().optional().describe('Text detected in image if OCR was used.')
});

export async function translatePro(input: z.infer<typeof TranslationInputSchema>) {
  return translationProFlow(input);
}

const translationPrompt = ai.definePrompt({
  name: 'translationProPrompt',
  input: {schema: TranslationInputSchema},
  output: {schema: TranslationOutputSchema},
  prompt: `You are the Xakteir Neural Translator. Your goal is to provide 100% accurate, high-fidelity translations.

{{#if photoDataUri}}
  ACT AS OCR: Analyze this image and extract the text written in it.
  IMAGE: {{media url=photoDataUri}}
  SOURCE_LANG: {{{fromLanguage}}}
  TARGET_LANG: {{{toLanguage}}}
  Detect the text, then translate it accurately.
{{else}}
  TRANSLATE: {{{text}}}
  FROM: {{{fromLanguage}}}
  TO: {{{toLanguage}}}
  {{#if isConversation}}CONTEXT: This is a back-and-forth conversation. Keep it natural and casual.{{/if}}
{{/if}}

Provide the translation and a phonetic pronunciation guide if applicable.`
});

const translationProFlow = ai.defineFlow(
  {
    name: 'translationProFlow',
    inputSchema: TranslationInputSchema,
    outputSchema: TranslationOutputSchema,
  },
  async input => {
    const {output} = await translationPrompt(input);
    return output!;
  }
);

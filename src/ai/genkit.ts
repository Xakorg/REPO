import 'server-only';
import {genkit, z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization using Google AI plugin.
 * Strictly isolated for server-side authority.
 */
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "AQ.Ab8RN6IVxzhB3GSydWvSgnLjZC4ptEF1Bzk5WD8oBaY-ICG1mQ" }),
  ],
  model: googleAI.model('gemini-2.5-flash'),
});

export {z};

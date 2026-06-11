import 'server-only';
import {genkit, z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization using Google AI plugin.
 * Strictly isolated for server-side authority.
 */
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY }),
  ],
  model: googleAI.model('gemini-2.5-flash'),
});

export {z};

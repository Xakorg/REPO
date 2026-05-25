import 'server-only';
import {genkit, z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization using Google AI plugin.
 * Strictly isolated for server-side authority.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-2.5-flash'), // High-fidelity model factory
});

export {z};

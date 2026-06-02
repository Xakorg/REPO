import 'server-only';
import {genkit, z} from 'genkit';
import {anthropic} from '@genkit-ai/anthropic';

/**
 * Genkit initialization using Anthropic plugin.
 * Strictly isolated for server-side authority.
 */
export const ai = genkit({
  plugins: [
    anthropic(),
  ],
  model: anthropic.model('claude-sonnet-4-5'),
});

export {z};

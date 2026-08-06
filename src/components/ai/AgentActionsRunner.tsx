'use client';
/**
 * AgentActionsRunner
 * 
 * A thin wrapper that runs the useAgentActions hook globally
 * so Xak AI can interact with the Xakteir UI from anywhere.
 * Wire into the root layout.
 */

import { useAgentActions } from '@/hooks/useAgentActions';

export function AgentActionsRunner() {
  useAgentActions();
  return null;
}

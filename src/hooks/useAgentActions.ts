'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, arrayRemove } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export type AgentAction = {
  id: string;
  action: 'navigate' | 'click' | 'fill' | 'open_modal' | 'create_doc' | 'send_notification' | 'scroll_to';
  target?: string; // element ID, URL, or document title
  value?: string;  // text to fill, notification body, etc.
};

/**
 * useAgentActions
 * 
 * Listens to Firestore `ai_agent_commands/{userId}` in real-time.
 * When the AI writes action commands there, this hook executes them
 * inside the Xakteir frontend (navigation, clicks, form fills, etc.)
 * 
 * Wire this into the root layout so it's always active.
 */
export function useAgentActions() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const isExecutingRef = useRef(false);

  useEffect(() => {
    if (!user || !firestore) return;

    const commandDocRef = doc(firestore, 'ai_agent_commands', user.uid);

    const unsubscribe = onSnapshot(commandDocRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const pending: AgentAction[] = data.pending || [];

      if (pending.length === 0 || isExecutingRef.current) return;

      isExecutingRef.current = true;

      for (const action of pending) {
        try {
          await executeAction(action, router, toast);
          // Remove executed action from the queue
          await updateDoc(commandDocRef, {
            pending: arrayRemove(action),
          });
          // Small delay between actions so user can see them
          await new Promise(r => setTimeout(r, 800));
        } catch (e) {
          console.error('Agent action failed:', action, e);
        }
      }

      isExecutingRef.current = false;
    });

    return () => unsubscribe();
  }, [user, firestore, router, toast]);
}

async function executeAction(
  action: AgentAction,
  router: ReturnType<typeof useRouter>,
  toast: ReturnType<typeof import('@/hooks/use-toast').useToast>['toast']
) {
  switch (action.action) {
    case 'navigate':
      if (action.target) {
        toast({ title: '🤖 Xak AI is navigating...', description: `Going to ${action.target}` });
        router.push(action.target);
      }
      break;

    case 'click': {
      if (action.target) {
        const el = document.getElementById(action.target) || document.querySelector(`[data-agent-id="${action.target}"]`) as HTMLElement | null;
        if (el) {
          toast({ title: '🤖 Xak AI clicked an element', description: action.target });
          el.click();
        } else {
          console.warn('Agent: element not found:', action.target);
        }
      }
      break;
    }

    case 'fill': {
      if (action.target && action.value !== undefined) {
        const el = document.getElementById(action.target) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el) {
          // Use React's synthetic event system to update state-controlled inputs
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          nativeInputValueSetter?.call(el, action.value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          toast({ title: '🤖 Xak AI filled a field', description: `"${action.value}"` });
        }
      }
      break;
    }

    case 'scroll_to': {
      if (action.target) {
        const el = document.getElementById(action.target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      break;
    }

    case 'send_notification': {
      toast({
        title: action.target || '🤖 Xak AI',
        description: action.value || 'Task complete.',
      });
      break;
    }

    default:
      console.warn('Unknown agent action:', action.action);
  }
}

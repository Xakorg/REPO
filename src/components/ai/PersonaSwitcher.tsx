'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Code2, Brain, GraduationCap, MessageCircle, BarChart, Palette,
  ChevronRight, Sparkles, Check,
} from 'lucide-react';

export type PersonaId = 'xak' | 'coder' | 'teacher' | 'friend' | 'analyst' | 'creative';

export type Persona = {
  id: PersonaId;
  name: string;
  tagline: string;
  icon: React.ElementType;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  systemPromptAddition: string;
};

export const PERSONAS: Persona[] = [
  {
    id: 'xak',
    name: 'Xak',
    tagline: 'Smart, friendly, all-around assistant',
    icon: Sparkles,
    accentColor: '#7C3AED',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-400',
    systemPromptAddition: 'You are Xak — friendly, knowledgeable, and helpful. Balanced in tone.',
  },
  {
    id: 'coder',
    name: 'Coder Xak',
    tagline: 'Technical, precise, code-first',
    icon: Code2,
    accentColor: '#06B6D4',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    systemPromptAddition: 'You are Coder Xak — extremely technical, concise, and code-first. Always wrap code in triple backticks. Skip unnecessary prose. Use correct syntax.',
  },
  {
    id: 'teacher',
    name: 'Teacher Xak',
    tagline: 'Patient, step-by-step, uses analogies',
    icon: GraduationCap,
    accentColor: '#F59E0B',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    systemPromptAddition: 'You are Teacher Xak — patient, encouraging, and educational. Break everything down step-by-step. Use real-world analogies. Assume the user is learning for the first time.',
  },
  {
    id: 'friend',
    name: 'Friend Xak',
    tagline: 'Casual, funny, talks like a real person',
    icon: MessageCircle,
    accentColor: '#10B981',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    systemPromptAddition: 'You are Friend Xak — casual, warm, and funny. Use everyday language, occasional humor, and talk like a knowledgeable friend. Keep it real, no corporate speak.',
  },
  {
    id: 'analyst',
    name: 'Analyst Xak',
    tagline: 'Data-driven, structured, bullet points',
    icon: BarChart,
    accentColor: '#3B82F6',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    systemPromptAddition: 'You are Analyst Xak — precise, data-driven, and structured. Always use bullet points, numbered lists, and tables. Give percentages and specifics when relevant. Be efficient.',
  },
  {
    id: 'creative',
    name: 'Creative Xak',
    tagline: 'Imaginative, artistic, thinks outside the box',
    icon: Palette,
    accentColor: '#EC4899',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-400',
    systemPromptAddition: 'You are Creative Xak — imaginative, artistic, and unconventional. Bring fresh perspectives, think metaphorically, explore the unexpected. Make responses vivid and inspiring.',
  },
];

interface PersonaSwitcherProps {
  activePersona: PersonaId;
  onChange: (id: PersonaId) => void;
}

export function PersonaSwitcher({ activePersona, onChange }: PersonaSwitcherProps) {
  const [open, setOpen] = useState(false);
  const current = PERSONAS.find(p => p.id === activePersona) || PERSONAS[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all',
          current.bgColor, current.borderColor, current.textColor
        )}
      >
        <Icon className={cn('w-3 h-3', current.textColor as string)} />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronRight className={cn('w-3 h-3 transition-transform', open && 'rotate-90')} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-72 bg-[#0a0814] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-3 border-b border-white/5">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest px-1">
                  Choose Persona
                </p>
              </div>

              <div className="p-2 space-y-1">
                {PERSONAS.map(p => {
                  const PIcon = p.icon;
                  const isActive = p.id === activePersona;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { onChange(p.id); setOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group',
                        isActive ? `${p.bgColor} ${p.borderColor} border` : 'hover:bg-white/5'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border',
                        p.bgColor, p.borderColor
                      )}>
                        <PIcon className={cn('w-4 h-4', p.textColor as string)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-bold', isActive ? p.textColor : 'text-white/80')}>
                          {p.name}
                        </p>
                        <p className="text-[10px] text-white/30 truncate">{p.tagline}</p>
                      </div>
                      {isActive && <Check className={cn('w-3.5 h-3.5 shrink-0', p.textColor)} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

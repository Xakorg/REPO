'use client';

import { useState } from 'react';
import { X, Brain, ChevronRight, ChevronDown, Cpu, Zap, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export type ThoughtStep = {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'action' | 'complete';
  label: string;
  detail?: string;
  timestamp: number;
};

const TYPE_CONFIG = {
  thinking: {
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    dot: 'bg-purple-400',
    label: 'Thinking',
  },
  tool_call: {
    icon: Cpu,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    dot: 'bg-blue-400',
    label: 'Tool Call',
  },
  tool_result: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-400',
    label: 'Result',
  },
  action: {
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-400',
    label: 'Action',
  },
  complete: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-400',
    label: 'Done',
  },
};

function ThoughtStepCard({ step, isLast }: { step: ThoughtStep; isLast: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const config = TYPE_CONFIG[step.type];
  const Icon = config.icon;

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-0 w-px bg-white/5" />
      )}

      <div className="flex gap-3 group">
        {/* Icon dot */}
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 border',
          config.bg
        )}>
          <div className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
        </div>

        <div className="flex-1 min-w-0 pb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 w-full text-left"
          >
            <span className={cn('text-[10px] font-black uppercase tracking-widest', config.color)}>
              {config.label}
            </span>
            <span className="text-[11px] text-white/70 font-medium truncate flex-1">
              {step.label}
            </span>
            {step.detail && (
              expanded
                ? <ChevronDown className="w-3 h-3 text-white/20 shrink-0" />
                : <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
            )}
          </button>

          {expanded && step.detail && (
            <div className={cn(
              'mt-2 rounded-lg border p-3 text-[11px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap break-all',
              config.bg
            )}>
              {step.detail}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AgentThoughtSidebarProps {
  steps: ThoughtStep[];
  isThinking: boolean;
  onClose: () => void;
}

export function AgentThoughtSidebar({ steps, isThinking, onClose }: AgentThoughtSidebarProps) {
  return (
    <div className="w-80 shrink-0 border-l border-white/10 bg-black/60 backdrop-blur-xl flex flex-col h-full">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            isThinking ? 'bg-purple-400 animate-pulse' : 'bg-white/20'
          )} />
          <span className="text-[11px] font-black uppercase tracking-widest text-white/80">
            Thought Process
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Steps */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-0">
          {steps.length === 0 && !isThinking && (
            <div className="py-16 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 text-white/10" />
              <p className="text-[11px] text-white/30 font-bold uppercase tracking-wider">
                No activity yet
              </p>
              <p className="text-[10px] text-white/20 mt-1">
                Send a message to see the AI's reasoning process
              </p>
            </div>
          )}

          {steps.map((step, i) => (
            <ThoughtStepCard
              key={step.id}
              step={step}
              isLast={i === steps.length - 1}
            />
          ))}

          {isThinking && (
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center shrink-0 mt-1">
                <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
              </div>
              <div className="flex-1 pb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                  Processing...
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <div className="h-10 border-t border-white/5 px-4 flex items-center gap-3 shrink-0">
        <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
          {steps.length} steps
        </span>
        {steps.filter(s => s.type === 'tool_call').length > 0 && (
          <span className="text-[9px] text-blue-400/60 font-bold uppercase tracking-widest">
            {steps.filter(s => s.type === 'tool_call').length} tool calls
          </span>
        )}
      </div>
    </div>
  );
}

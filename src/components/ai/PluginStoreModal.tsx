'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Puzzle, X, CheckCircle2, Plus, Sparkles, Github, Music, FileText,
  Calendar, CheckSquare, ExternalLink, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export type Plugin = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  connected: boolean;
};

const INITIAL_PLUGINS: Plugin[] = [
  {
    id: 'github',
    name: 'GitHub Copilot Sync',
    category: 'Developer',
    description: 'Summarize commits, inspect PRs, and read repositories in real time.',
    icon: Github,
    color: 'text-white',
    bgColor: 'bg-white/10',
    borderColor: 'border-white/20',
    connected: true,
  },
  {
    id: 'spotify',
    name: 'Spotify Music',
    category: 'Media',
    description: 'Control playback, generate lo-fi playlists, and play music inside Xakteir.',
    icon: Music,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    connected: false,
  },
  {
    id: 'notion',
    name: 'Notion Workspace',
    category: 'Productivity',
    description: 'Search Notion pages, pull database context, and export notes directly.',
    icon: FileText,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
    connected: true,
  },
  {
    id: 'trello',
    name: 'Trello / Jira Tasks',
    category: 'Work',
    description: 'Manage boards, create task cards, and assign deadlines via voice/chat.',
    icon: CheckSquare,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    connected: false,
  },
  {
    id: 'calendar',
    name: 'Google Calendar Sync',
    category: 'Schedule',
    description: 'Read upcoming events, schedule meetings, and send calendar invites.',
    icon: Calendar,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    connected: true,
  },
];

interface PluginStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PluginStoreModal({ isOpen, onClose }: PluginStoreModalProps) {
  const [plugins, setPlugins] = useState<Plugin[]>(INITIAL_PLUGINS);
  const [filter, setFilter] = useState<string>('All');
  const { toast } = useToast();

  const toggleConnect = (id: string) => {
    setPlugins(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextState = !p.connected;
          toast({
            title: nextState ? `Connected ${p.name}` : `Disconnected ${p.name}`,
            description: nextState ? "Xak AI can now use tools from this plugin." : "Plugin disabled.",
          });
          return { ...p, connected: nextState };
        }
        return p;
      })
    );
  };

  const categories = ['All', 'Developer', 'Productivity', 'Media', 'Work', 'Schedule'];

  const filtered = filter === 'All' ? plugins : plugins.filter(p => p.category === filter);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 lg:p-8"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-3xl max-h-[85vh] bg-[#070514] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-14 bg-white/5 border-b border-white/10 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                  <Puzzle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase italic tracking-tight text-white">Xak AI Plugin Store</h2>
                  <p className="text-[10px] text-white/40 font-medium">Extend Xak AI capabilities with external tools</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 py-3 border-b border-white/5 bg-black/20 flex gap-2 overflow-x-auto shrink-0">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0',
                    filter === c ? 'bg-primary text-white shadow-md' : 'text-white/40 hover:text-white hover:bg-white/5'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Plugin List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {filtered.map(p => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 transition-all hover:bg-white/8"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0', p.bgColor, p.borderColor)}>
                        <Icon className={cn('w-6 h-6', p.color as string)} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/30 px-2 py-0.5 rounded bg-white/5">
                            {p.category}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5 leading-relaxed truncate">{p.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleConnect(p.id)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0',
                        p.connected
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/10 hover:bg-primary text-white border border-white/10'
                      )}
                    >
                      {p.connected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Connect
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="h-11 bg-black/60 border-t border-white/5 px-6 flex items-center justify-between shrink-0 text-[10px] text-white/30">
              <span>{plugins.filter(p => p.connected).length} of {plugins.length} plugins enabled</span>
              <span className="flex items-center gap-1 text-primary">
                <Zap className="w-3 h-3" /> Real-time Tool Calling Enabled
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

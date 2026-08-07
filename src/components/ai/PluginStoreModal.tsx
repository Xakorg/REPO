'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Puzzle, X, CheckCircle2, Plus, Sparkles, Github, CloudSun, BookOpen,
  Mail, Search, Key, ShieldCheck, RefreshCw, Zap, Check, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

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
  requiresKey?: boolean;
  apiKey?: string;
  docsUrl?: string;
};

const AVAILABLE_PLUGINS: Plugin[] = [
  {
    id: 'github',
    name: 'GitHub REST API',
    category: 'Developer',
    description: 'Inspect repositories, read source files, commits, and pull requests via GitHub API.',
    icon: Github,
    color: 'text-white',
    bgColor: 'bg-white/10',
    borderColor: 'border-white/20',
    connected: false,
    requiresKey: true,
  },
  {
    id: 'weather',
    name: 'Open-Meteo Weather API',
    category: 'Environment',
    description: 'Fetch real live weather conditions, hourly forecasts, and wind data worldwide.',
    icon: CloudSun,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    connected: true,
    requiresKey: false,
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia Knowledge Base',
    category: 'Knowledge',
    description: 'Search and pull full encyclopedic summaries, history, and scientific facts.',
    icon: BookOpen,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
    connected: true,
    requiresKey: false,
  },
  {
    id: 'websearch',
    name: 'DuckDuckGo Web Search',
    category: 'Search',
    description: 'Perform real-time live search across the entire internet for up-to-date news and info.',
    icon: Search,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    connected: true,
    requiresKey: false,
  },
  {
    id: 'xakmail',
    name: 'Xak Mailer System',
    category: 'Productivity',
    description: 'Integrate directly with Xakteir Mail service to compose, draft, and dispatch real emails.',
    icon: Mail,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    connected: true,
    requiresKey: false,
  },
];

interface PluginStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PluginStoreModal({ isOpen, onClose }: PluginStoreModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [plugins, setPlugins] = useState<Plugin[]>(AVAILABLE_PLUGINS);
  const [filter, setFilter] = useState<string>('All');
  const [editingKeyPlugin, setEditingKeyPlugin] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState<string>('');
  const [savingKey, setSavingKey] = useState(false);

  // Sync real plugin states from Firestore `users/{uid}/ai_plugins`
  useEffect(() => {
    if (!user || !firestore) return;

    const unsubscribes = AVAILABLE_PLUGINS.map(p => {
      const pluginRef = doc(firestore, 'users', user.uid, 'ai_plugins', p.id);
      return onSnapshot(pluginRef, snap => {
        if (snap.exists()) {
          const data = snap.data();
          setPlugins(prev =>
            prev.map(item =>
              item.id === p.id
                ? { ...item, connected: data.connected ?? item.connected, apiKey: data.apiKey || '' }
                : item
            )
          );
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, firestore]);

  const toggleConnect = async (plugin: Plugin) => {
    if (!user || !firestore) {
      toast({ title: "Sign in required", description: "Log in to enable plugins on your account." });
      return;
    }

    const nextState = !plugin.connected;
    const pluginRef = doc(firestore, 'users', user.uid, 'ai_plugins', plugin.id);

    try {
      await setDoc(
        pluginRef,
        {
          id: plugin.id,
          name: plugin.name,
          connected: nextState,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({
        title: nextState ? `Activated ${plugin.name}` : `Deactivated ${plugin.name}`,
        description: nextState ? "Xak AI can now invoke real tools from this API." : "Plugin disabled.",
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to update plugin state", description: e.message });
    }
  };

  const handleSaveApiKey = async (pluginId: string) => {
    if (!user || !firestore) return;
    setSavingKey(true);
    try {
      const pluginRef = doc(firestore, 'users', user.uid, 'ai_plugins', pluginId);
      await setDoc(
        pluginRef,
        {
          apiKey: keyInput.trim(),
          connected: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast({ title: "API Token Saved!", description: "Plugin authenticated successfully." });
      setEditingKeyPlugin(null);
      setKeyInput('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to save API key" });
    } finally {
      setSavingKey(false);
    }
  };

  const categories = ['All', 'Developer', 'Environment', 'Knowledge', 'Search', 'Productivity'];
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
                  <h2 className="text-sm font-black uppercase italic tracking-tight text-white">Xak AI Live Plugin System</h2>
                  <p className="text-[10px] text-white/40 font-medium">Real-time REST API integrations powered by Genkit Tools</p>
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
                const isEditing = editingKeyPlugin === p.id;
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 transition-all hover:bg-white/8"
                  >
                    <div className="flex items-center justify-between gap-4">
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
                            {p.requiresKey && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/80 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                Requires Token
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/50 mt-0.5 leading-relaxed truncate">{p.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.requiresKey && (
                          <button
                            onClick={() => {
                              setEditingKeyPlugin(isEditing ? null : p.id);
                              setKeyInput(p.apiKey || '');
                            }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10 transition-all"
                            title="Configure API Token"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => toggleConnect(p)}
                          className={cn(
                            'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5',
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
                              <Plus className="w-3.5 h-3.5" /> Enable
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* API Token Input Drawer */}
                    {isEditing && (
                      <div className="mt-2 pt-3 border-t border-white/10 flex items-center gap-2 animate-in fade-in">
                        <input
                          type="password"
                          value={keyInput}
                          onChange={e => setKeyInput(e.target.value)}
                          placeholder="Paste API Token / Key..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                        />
                        <button
                          onClick={() => handleSaveApiKey(p.id)}
                          disabled={savingKey}
                          className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider transition-all"
                        >
                          {savingKey ? "Saving..." : "Save Key"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="h-11 bg-black/60 border-t border-white/5 px-6 flex items-center justify-between shrink-0 text-[10px] text-white/30">
              <span>{plugins.filter(p => p.connected).length} of {plugins.length} plugins active & synced to Firestore</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Real API Tools Powered by Genkit
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

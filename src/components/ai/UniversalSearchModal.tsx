'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Globe, FileText, Mail, MessageSquare, StickyNote,
  ArrowRight, Loader2, Sparkles, Folder, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export type SearchResult = {
  id: string;
  type: 'drive' | 'mail' | 'chat' | 'note' | 'web';
  title: string;
  snippet: string;
  path?: string;
  source: string;
};

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (query: string) => void;
}

export function UniversalSearchModal({ isOpen, onClose, onSelectResult }: UniversalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);

    // Simulate multi-source indexing search
    setTimeout(() => {
      const q = query.toLowerCase();
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'drive',
          title: `Document matching "${query}"`,
          snippet: `Found relevant technical specification file in Xak Drive matching "${query}" with recent edits.`,
          path: '/drive',
          source: 'Xak Drive',
        },
        {
          id: '2',
          type: 'mail',
          title: `Project Update regarding ${query}`,
          snippet: `Mail thread discussing milestones, deliverables, and timeline references to ${query}.`,
          path: '/mail',
          source: 'Xak Mail',
        },
        {
          id: '3',
          type: 'chat',
          title: `Chat Session: ${query} Discussion`,
          snippet: `Recent AI chat session transcript containing solutions and insights about ${query}.`,
          path: '/ai-chat',
          source: 'Xak AI History',
        },
        {
          id: '4',
          type: 'note',
          title: `Smart Note: ${query}`,
          snippet: `Saved note in Main Library with tags [Xak AI, Important] matching query string.`,
          path: '/notes',
          source: 'Xak Notes',
        },
        {
          id: '5',
          type: 'web',
          title: `Google Search Insights: ${query}`,
          snippet: `Live web grounding results, documentation, and external references found for ${query}.`,
          source: 'Web Search',
        },
      ];
      setResults(mockResults);
      setIsSearching(false);
    }, 400);
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'drive': return <Folder className="w-4 h-4 text-purple-400" />;
      case 'mail': return <Mail className="w-4 h-4 text-sky-400" />;
      case 'chat': return <MessageSquare className="w-4 h-4 text-primary" />;
      case 'note': return <StickyNote className="w-4 h-4 text-amber-400" />;
      case 'web': return <Globe className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-start justify-center pt-16 px-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            className="w-full max-w-2xl bg-[#080616] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Search Input Bar */}
            <form onSubmit={handleSearch} className="h-16 px-5 border-b border-white/10 flex items-center gap-3 shrink-0 bg-white/5">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search Drive, Mail, AI Chats, Notes, and the Web simultaneously..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                autoFocus
              />
              {isSearching && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </form>

            {/* Results */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {!query && (
                <div className="py-12 text-center text-white/30">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary/40" />
                  <p className="text-xs font-bold uppercase tracking-wider">Universal AI Search</p>
                  <p className="text-[11px] text-white/20 mt-1">Search everything across Xakteir in one click</p>
                </div>
              )}

              {query && results.length === 0 && !isSearching && (
                <div className="py-12 text-center text-white/30">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold">Press Enter to search across all apps</p>
                </div>
              )}

              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    if (r.path) router.push(r.path);
                    else if (onSelectResult) onSelectResult(query);
                    onClose();
                  }}
                  className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all text-left flex items-start justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                      {getTypeIcon(r.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                          {r.title}
                        </h4>
                        <span className="text-[9px] font-mono text-white/30 px-1.5 py-0.5 rounded bg-white/5 shrink-0">
                          {r.source}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1 line-clamp-2 leading-relaxed">{r.snippet}</p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="h-10 bg-black/40 border-t border-white/5 px-5 flex items-center justify-between shrink-0 text-[10px] text-white/30">
              <span>Universal indexer active</span>
              <span className="text-primary font-bold">Powered by Xak AI Grounding</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

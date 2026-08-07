'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, X, ArrowLeft, ArrowRight, RefreshCw, Search, Sparkles,
  ExternalLink, FileText, CheckCircle2, ShieldCheck, Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard';

interface BrowserAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (extractedContent: string, url: string) => void;
  initialUrl?: string;
}

export function BrowserAgentModal({
  isOpen,
  onClose,
  onSendToChat,
  initialUrl = 'https://wikipedia.org'
}: BrowserAgentModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [activeUrl, setActiveUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const handleNavigate = (e?: React.FormEvent) => {
    e?.preventDefault();
    let target = url.trim();
    if (!target) return;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
      }
    }
    setActiveUrl(target);
    setUrl(target);
    setIsLoading(true);
    setExtractedText(null);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(target);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setActiveUrl(prev);
      setUrl(prev);
      setIsLoading(true);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setActiveUrl(next);
      setUrl(next);
      setIsLoading(true);
    }
  };

  const handleExtractAndAsk = async () => {
    setIsExtracting(true);
    toast({ title: "🌐 Extracting page context...", description: activeUrl });

    try {
      // Fetch text content via CORS proxy or fallback summary
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(activeUrl)}`);
      const data = await res.json();
      if (data.contents) {
        // Strip HTML tags for clean text
        const tmp = document.createElement("DIV");
        tmp.innerHTML = data.contents;
        const text = (tmp.textContent || tmp.innerText || "").replace(/\s+/g, ' ').substring(0, 4000);
        
        setExtractedText(text);
        if (onSendToChat) {
          onSendToChat(`[Browser Agent Context from ${activeUrl}]\n${text}`, activeUrl);
          toast({ title: "Sent to Xak AI!", description: "Page content fed into chat." });
          onClose();
        }
      } else {
        throw new Error("Could not fetch page contents.");
      }
    } catch (err) {
      const fallbackPrompt = `Please search the web or provide insights on: ${activeUrl}`;
      if (onSendToChat) {
        onSendToChat(fallbackPrompt, activeUrl);
        toast({ title: "Sent URL to Xak AI", description: "Asking Xak AI about this address." });
        onClose();
      }
    } finally {
      setIsExtracting(false);
    }
  };

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
            className="w-full max-w-5xl h-[85vh] bg-[#080614] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Window Bar */}
            <div className="h-12 bg-white/5 border-b border-white/10 px-4 flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> Browser Agent
                </span>
              </div>

              {/* Navigation controls & URL input */}
              <form onSubmit={handleNavigate} className="flex-1 max-w-xl flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={historyIndex <= 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 disabled:opacity-20 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleForward}
                  disabled={historyIndex >= history.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 disabled:opacity-20 transition-all"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLoading(true); setActiveUrl(activeUrl + '?r=' + Date.now()); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 transition-all"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                </button>

                <div className="flex-1 relative flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="Enter URL or search..."
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-xl px-9 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none transition-all"
                  />
                </div>
              </form>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExtractAndAsk}
                  disabled={isExtracting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-primary/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isExtracting ? "Reading..." : "Ask Xak AI"}
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Browser frame */}
            <div className="flex-1 relative bg-zinc-950">
              <iframe
                key={activeUrl}
                src={activeUrl}
                onLoad={() => setIsLoading(false)}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                title="Browser Agent Frame"
              />

              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-widest text-white/60">Loading {activeUrl}...</p>
                </div>
              )}
            </div>

            {/* Status footer */}
            <div className="h-9 bg-black/40 border-t border-white/5 px-4 flex items-center justify-between shrink-0 text-[10px] text-white/40">
              <span className="truncate">URL: {activeUrl}</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Secure Xakteir Sandbox
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

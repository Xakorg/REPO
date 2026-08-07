'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronDown, Send, X, ExternalLink, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export type EmailDraft = {
  to?: string;
  subject?: string;
  body: string;
};

interface EmailDraftCardProps {
  draft: EmailDraft;
  onDismiss: () => void;
}

export function EmailDraftCard({ draft, onDismiss }: EmailDraftCardProps) {
  const [sendOpen, setSendOpen] = useState(false);
  const router = useRouter();

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1${
    draft.to ? `&to=${encodeURIComponent(draft.to)}` : ''
  }${
    draft.subject ? `&su=${encodeURIComponent(draft.subject)}` : ''
  }&body=${encodeURIComponent(draft.body)}`;

  const handleXakMail = () => {
    // Store draft in sessionStorage for Xak Mail to pick up
    sessionStorage.setItem('xak_mail_draft', JSON.stringify(draft));
    router.push('/mail?compose=1');
    setSendOpen(false);
  };

  const handleGmail = () => {
    window.open(gmailUrl, '_blank');
    setSendOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Email Draft</span>
        </div>
        <button onClick={onDismiss} className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Draft fields */}
      <div className="p-4 space-y-2 text-sm">
        {draft.to && (
          <div className="flex gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 w-12 pt-0.5">To</span>
            <span className="text-white/70">{draft.to}</span>
          </div>
        )}
        {draft.subject && (
          <div className="flex gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 w-12 pt-0.5">Sub</span>
            <span className="text-white/80 font-semibold">{draft.subject}</span>
          </div>
        )}
        <div className="pt-2 border-t border-white/5">
          <p className="text-white/60 text-xs leading-relaxed whitespace-pre-wrap">{draft.body}</p>
        </div>
      </div>

      {/* Send button */}
      <div className="px-4 pb-4">
        <div className="relative inline-block">
          <button
            onClick={() => setSendOpen(v => !v)}
            className="flex items-center gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            Send
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', sendOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {sendOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSendOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 bottom-full mb-2 z-50 w-64 bg-[#0c0a18] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <button
                    onClick={handleXakMail}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Inbox className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Xakteir Mail</p>
                      <p className="text-[10px] text-emerald-400 font-semibold">✦ Recommended</p>
                    </div>
                  </button>

                  <div className="h-px bg-white/5 mx-3" />

                  <button
                    onClick={handleGmail}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <ExternalLink className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/80">Open in Gmail</p>
                      <p className="text-[10px] text-white/30">Opens in new tab</p>
                    </div>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

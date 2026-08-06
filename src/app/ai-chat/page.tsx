"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Ghost, MessageSquare, History, Lock, Trash2,
  Bot, Sparkles, Globe, Users, Clock, Brain, Zap, FileText,
  ArrowRight, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import {
  collection, query, orderBy, limit, doc, setDoc,
  serverTimestamp, onSnapshot,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { motion } from "framer-motion";

type Session = {
  id: string;
  title: string;
  messages: { role: string; content: string }[];
  members: string[];
  ownerId: string;
  public: boolean;
  temporary: boolean;
  updatedAt: any;
};

const FEATURE_CARDS = [
  { icon: Brain, title: "Thought Process", desc: "Watch the AI reason step by step in real time", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { icon: Users, title: "Group AI Chats", desc: "Invite friends — everyone can talk to the AI together", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { icon: Zap, title: "Xakteir Agent", desc: "AI that can navigate and interact with your apps", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { icon: Globe, title: "Shareable Chats", desc: "Make any chat public and share a link with anyone", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { icon: Ghost, title: "Temp Chats", desc: "No memory, no history — completely private sessions", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { icon: FileText, title: "PDF Read & Export", desc: "Upload PDFs and export any chat as a stylish PDF", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
];

export default function XakAIHomePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [creating, setCreating] = useState(false);

  // Load sessions
  useEffect(() => {
    if (!user || !firestore) return;
    const q = query(collection(firestore, "ai_chats"), orderBy("updatedAt", "desc"), limit(20));
    const unsub = onSnapshot(q, snap => {
      setSessions(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Session))
          .filter(s => s.members?.includes(user.uid))
      );
    });
    return () => unsub();
  }, [user, firestore]);

  const createSession = async (temporary = false) => {
    if (!user || !firestore) { toast({ title: "Sign in to create a session" }); return; }
    setCreating(true);
    try {
      const docRef = doc(collection(firestore, "ai_chats"));
      await setDoc(docRef, {
        title: "New Chat",
        messages: [],
        members: [user.uid],
        ownerId: user.uid,
        public: false,
        temporary,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push(`/ai-chat/${docRef.id}`);
    } catch {
      toast({ variant: "destructive", title: "Failed to create chat" });
      setCreating(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore) return;
    await deleteDocumentNonBlocking(doc(firestore, "ai_chats", id));
    toast({ title: "Session deleted" });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#05030d] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,60,255,0.15),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20"
          >
            <Sparkles className="w-10 h-10 text-primary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-4"
          >
            Xak AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-lg mb-8 max-w-lg mx-auto"
          >
            Your personal AI agent — chat, code, create, and control Xakteir.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={() => createSession(false)}
              disabled={creating}
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/25 flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              New Chat
            </Button>
            <Button
              onClick={() => createSession(true)}
              variant="outline"
              className="h-12 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center gap-2"
            >
              <Ghost className="w-4 h-4" />
              Temporary Chat
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Features</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
          {FEATURE_CARDS.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className={cn("p-4 rounded-2xl border flex gap-3 items-start", f.color)}
            >
              <f.icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider mb-0.5">{f.title}</p>
                <p className="text-[11px] opacity-60 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent sessions */}
        {user && sessions.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 flex items-center gap-2">
              <History className="w-3 h-3" /> Recent Chats
            </p>
            <div className="space-y-2">
              {sessions.map(s => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => router.push(`/ai-chat/${s.id}`)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    {s.public ? <Globe className="w-4 h-4 text-emerald-400" /> :
                     s.temporary ? <Ghost className="w-4 h-4 text-purple-400" /> :
                     <MessageSquare className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{s.title || "Untitled"}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {s.messages?.length || 0} messages
                      {s.members?.length > 1 && ` · ${s.members.length} members`}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-all group-hover:translate-x-1" />
                  <button
                    onClick={e => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {!user && (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/5">
            <Lock className="w-8 h-8 mx-auto mb-3 text-white/10" />
            <p className="text-sm font-bold text-white/30">Sign in to save and revisit your chats</p>
          </div>
        )}
      </div>
    </div>
  );
}
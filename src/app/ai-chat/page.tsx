"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Plus, Ghost, MessageSquare, History, Lock, Trash2,
  Bot, Sparkles, Globe, Users, Zap, FileText, Send, Paperclip,
  Mic, MicOff, Search, ChevronRight, Puzzle, Compass, ArrowRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import {
  collection, query, orderBy, limit, doc, setDoc,
  serverTimestamp, onSnapshot,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { motion, AnimatePresence } from "framer-motion";
import { PluginStoreModal } from "@/components/ai/PluginStoreModal";
import { UniversalSearchModal } from "@/components/ai/UniversalSearchModal";

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

export default function XakAIChatHomePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);

  // Wave 3 Modals
  const [pluginStoreOpen, setPluginStoreOpen] = useState(false);
  const [universalSearchOpen, setUniversalSearchOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history for sidebar
  useEffect(() => {
    if (!user || !firestore) return;
    const q = query(collection(firestore, "ai_chats"), orderBy("updatedAt", "desc"), limit(40));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Session))
          .filter((s) => s.members?.includes(user.uid) || s.ownerId === user.uid);
        setSessions(loaded);
      },
      (err) => console.warn("Sessions snapshot error:", err)
    );
    return () => unsub();
  }, [user, firestore]);

  // Create session safely and redirect
  const handleStartChat = async (mode: "standard" | "temp" | "group" = "standard") => {
    setCreatingType(mode);
    if (!user || !firestore) {
      const guestId = `guest_${Date.now()}`;
      router.push(`/ai-chat/${guestId}`);
      return;
    }
    try {
      const docRef = doc(collection(firestore, "ai_chats"));
      const isTemp = mode === "temp";
      const defaultTitle = isTemp
        ? "Ghost Session"
        : mode === "group"
        ? "Group AI Workspace"
        : "New Chat Session";

      await setDoc(docRef, {
        title: defaultTitle,
        messages: [],
        members: [user.uid],
        ownerId: user.uid,
        public: false,
        temporary: isTemp,
        isGroup: mode === "group",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

      await setDoc(newDocRef, payload);
      router.push(`/ai-chat/${newDocRef.id}`);
    } catch (err: any) {
      console.error("Failed to create chat session:", err);
      toast({ variant: "destructive", title: "Could not create chat", description: err.message || "Firestore error" });
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore) return;
    await deleteDocumentNonBlocking(doc(firestore, "ai_chats", id));
    toast({ title: "Session deleted" });
  };

  const filteredSessions = sessions.filter(
    (s) => !searchQuery || s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-80px)] flex overflow-hidden text-white bg-[#05030d]">
      {/* Wave 3 Modals */}
      <PluginStoreModal isOpen={pluginStoreOpen} onClose={() => setPluginStoreOpen(false)} />
      <UniversalSearchModal isOpen={universalSearchOpen} onClose={() => setUniversalSearchOpen(false)} />

      {/* ── Left Sidebar (ChatGPT-style) ────────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-3xl transition-all duration-300 shrink-0",
          showSidebar ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-3 space-y-1.5 border-b border-white/10 shrink-0">
          <button
            onClick={() => handleStartChat("", false, false)}
            disabled={!user || loading}
            className="w-full h-9 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary border border-primary/25 font-bold text-xs flex items-center gap-2 px-3 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => handleStartChat("", true, false)}
              disabled={!user || loading}
              className="h-8 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              <Ghost className="w-3 h-3 text-purple-400" /> Temp
            </button>
            <button
              onClick={() => handleStartChat("", false, true)}
              disabled={!user || loading}
              className="h-8 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              <Users className="w-3 h-3 text-blue-400" /> Group
            </button>
          </div>
        </div>

        {/* Search bar inside sidebar */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>

        {/* Sessions list */}
        <ScrollArea className="flex-1 px-2 py-2">
          {!user ? (
            <div className="py-12 text-center">
              <Lock className="w-5 h-5 mx-auto mb-2 text-white/10" />
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Sign in to save chats</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-8 text-center text-white/20 text-xs">No chat history</div>
          ) : (
            <div className="space-y-0.5">
              <p className="px-2 py-1.5 text-[9px] font-black text-white/20 uppercase tracking-widest">History</p>
              {filteredSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/ai-chat/${s.id}`)}
                  className="w-full px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between group/item text-[11px] hover:bg-white/5 text-white/50 hover:text-white"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {s.temporary ? (
                      <Ghost className="w-3 h-3 shrink-0 text-purple-400/60" />
                    ) : s.public ? (
                      <Globe className="w-3 h-3 shrink-0 text-emerald-400/60" />
                    ) : (
                      <MessageSquare className="w-3 h-3 shrink-0 opacity-30" />
                    )}
                    <span className="truncate font-medium">{s.title || "Untitled"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover/item:opacity-40 hover:!opacity-100 p-1 rounded hover:bg-rose-500/20 text-rose-400 shrink-0 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Sidebar Footer Buttons: Plugins & Universal Search */}
        <div className="p-3 border-t border-white/10 space-y-1.5 shrink-0">
          <button
            onClick={() => setPluginStoreOpen(true)}
            className="w-full h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-2 px-3 transition-all"
          >
            <Puzzle className="w-3.5 h-3.5 text-primary" /> Plugin Store
          </button>
          <button
            onClick={() => setUniversalSearchOpen(true)}
            className="w-full h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-2 px-3 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" /> Universal Search
          </button>
        </div>
      </aside>

      {/* ── Main Chat Area (ChatGPT Style) ─────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header toolbar */}
        <header className="h-13 border-b border-white/10 bg-black/30 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar((v) => !v)}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showSidebar && "rotate-180")} />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="font-black uppercase italic tracking-tighter text-lg">Xak AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPluginStoreOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 transition-all"
            >
              <Puzzle className="w-3.5 h-3.5 text-primary" /> Plugins
            </button>
            <button
              onClick={() => setUniversalSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 transition-all"
            >
              <Search className="w-3.5 h-3.5 text-sky-400" /> Smart Search
            </button>
          </div>
        </header>

        {/* Center Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-2xl space-y-8 text-center my-auto">
            {/* Logo orb */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-2xl shadow-primary/20"
            >
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </motion.div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight mb-2 text-white">
                What can I help with today?
              </h1>
              <p className="text-white/40 text-sm">Ask anything, generate code, draft emails, or build playable games.</p>
            </div>

            {/* Central Input Bar (ChatGPT style) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartChat(input);
              }}
              className="relative flex flex-col rounded-2xl border border-white/15 bg-white/5 p-3 shadow-2xl focus-within:border-primary/50 transition-all text-left"
            >
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleStartChat(input);
                  }
                }}
                placeholder="Message Xak AI... (Shift+Enter for new line)"
                rows={2}
                className="w-full resize-none bg-transparent border-0 text-sm text-white placeholder:text-white/20 focus-visible:ring-0 p-2 min-h-[50px] leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUniversalSearchOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[11px] font-bold transition-all"
                  >
                    <Search className="w-3 h-3 text-sky-400" /> Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setPluginStoreOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[11px] font-bold transition-all"
                  >
                    <Puzzle className="w-3 h-3 text-primary" /> Plugins
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-30"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>

            {/* Quick Action Preset Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { title: "Draft an Email", desc: "Gmail & Xakteir Mail support", prompt: "Draft a professional project update email" },
                { title: "Build an HTML Game", desc: "Instant playable canvas prototype", prompt: "Build a neon space shooter game in HTML" },
                { title: "Control Xakteir UI", desc: "AI Agent navigation & actions", prompt: "Control Xakteir: navigate to Games app" },
                { title: "Analyze Document", desc: "Deep PDF & text parsing", prompt: "Help me analyze and summarize a document" },
              ].map((card, i) => (
                <button
                  key={i}
                  onClick={() => handleStartChat(card.prompt)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">{card.title}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{card.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Send, User, Sparkles, Loader2, Bot, Plus, MessageSquare, History,
  Lock, Trash2, Globe, Ghost, ChevronRight, Menu, Users, Search, Puzzle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import {
  collection, query, orderBy, limit, doc, setDoc,
  serverTimestamp, onSnapshot,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import XakAiAnimatedIcon from "@/components/ai/XakAiAnimatedIcon";
import { PluginStoreModal } from "@/components/ai/PluginStoreModal";
import { UniversalSearchModal } from "@/components/ai/UniversalSearchModal";
import { FloatingPiPAssistant } from "@/app/ai-chat/chat-widgets";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";


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
  const [creatingType, setCreatingType] = useState<"standard" | "temp" | "group" | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);

  // Modals
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
  const handleStartChat = async (promptText?: string, mode: "standard" | "temp" | "group" = "standard") => {
    setCreatingType(mode);
    setLoading(true);
    if (!user || !firestore) {
      const guestId = `guest_${Date.now()}`;
      router.push(`/ai-chat/${guestId}`);
      return;
    }
    try {
      const docRef = doc(collection(firestore, "ai_chats"));
      const isTemp = mode === "temp";
      const isGroup = mode === "group";
      const text = promptText?.trim() || input.trim();
      const defaultTitle = text
        ? text.substring(0, 40)
        : isTemp
        ? "Ghost Session"
        : isGroup
        ? "Group AI Workspace"
        : "New Chat Session";

      const initialMessages = text
        ? [
            {
              role: "user",
              content: text,
              senderUid: user.uid,
              senderName: user.displayName || "You",
              senderPhoto: user.photoURL || "",
              timestamp: Date.now(),
            },
          ]
        : [];

      await setDoc(docRef, {
        title: defaultTitle,
        messages: initialMessages,
        members: [user.uid],
        ownerId: user.uid,
        public: false,
        temporary: isTemp,
        isGroup,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push(`/ai-chat/${docRef.id}`);
    } catch (err: any) {
      const guestId = `guest_${Date.now()}`;
      router.push(`/ai-chat/${guestId}`);
    } finally {
      setCreatingType(null);
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
      {/* Modals */}
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
            onClick={() => handleStartChat("", "standard")}
            disabled={loading}
            className="w-full h-9 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary border border-primary/25 font-bold text-xs flex items-center gap-2 px-3 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => handleStartChat("", "temp")}
              disabled={loading}
              className="h-8 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              <Ghost className="w-3 h-3 text-purple-400" /> Temp
            </button>
            <button
              onClick={() => handleStartChat("", "group")}
              disabled={loading}
              className="h-8 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              <Users className="w-3 h-3 text-blue-400" /> Group
            </button>
          </div>
        </div>

        {/* Search bar inside sidebar */}
        <div className="p-2 border-b border-white/5">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="w-full h-7 pl-7 pr-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>

        {/* Sidebar Sessions List */}
        <ScrollArea className="flex-1 px-2 py-2">
          {!user ? (
            <div className="py-8 text-center px-3">
              <Lock className="w-4 h-4 mx-auto mb-2 text-white/20" />
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Guest Mode</p>
              <p className="text-[9px] text-white/20">Sign in to save chat history permanently.</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="px-2 py-1.5 text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center justify-between">
                <span>History</span>
                <span className="font-mono text-white/20">{filteredSessions.length}</span>
              </p>
              {filteredSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/ai-chat/${s.id}`)}
                  className="w-full px-3 py-2 rounded-xl text-left hover:bg-white/5 text-white/60 hover:text-white transition-all flex items-center justify-between group/item text-[11px]"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {s.temporary ? (
                      <Ghost className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                    ) : s.members?.length > 1 ? (
                      <Users className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                    ) : s.public ? (
                      <Globe className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-40" />
                    )}
                    <span className="truncate font-medium">{s.title || "Untitled Session"}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover/item:opacity-40 hover:!opacity-100 p-1 rounded hover:bg-rose-500/20 text-rose-400 shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* ── Main Hero Area ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        {/* Header */}
        <header className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden w-8 h-8 rounded-xl border border-white/10 bg-white/5">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#05030d] border-white/10 p-0 w-64 text-white">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                {/* Mobile sidebar content */}
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => handleStartChat("", "standard")}
                    className="w-full h-9 rounded-xl bg-primary text-white font-bold text-xs"
                  >
                    New Chat
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <button
              onClick={() => setShowSidebar((v) => !v)}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              <ChevronRight className={cn("w-4 h-4 transition-transform", showSidebar && "rotate-180")} />
            </button>

            <div className="flex items-center gap-2">
              <XakAiAnimatedIcon size={24} />
              <span className="font-black uppercase italic tracking-tight text-sm md:text-base">Xak AI</span>
            </div>
          </div>
        </header>

        {/* Center Hero View */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-xl w-full space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-2xl shadow-primary/20">
              <XakAiAnimatedIcon size={48} />
            </div>


            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-2">What can Xak AI build for you?</h1>
              <p className="text-white/40 text-sm">Ask anything, generate code, draft emails, or build playable games.</p>
            </div>

            {/* Central Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartChat(input, "standard");
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
                    handleStartChat(input, "standard");
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
                  onClick={() => handleStartChat(card.prompt, "standard")}
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

      <FloatingPiPAssistant />
    </div>
  );
}
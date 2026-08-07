"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Plus, Ghost, MessageSquare, History, Lock, Trash2,
  Bot, Sparkles, Globe, Users, Clock, Brain, Zap, FileText,
  ArrowRight, Loader2, Search, UserPlus, Shield, Star,
  Compass, Share2, CornerDownRight, RefreshCw, Layers
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
  { icon: Brain, title: "Step-by-Step Reasoning", desc: "Watch Xak AI analyze, plan, and execute actions with real-time thought logs", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { icon: Users, title: "Group AI Hub", desc: "Invite friends into any session — talk to the AI together with real-time sync", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { icon: Zap, title: "Xakteir System Agent", desc: "AI agent capable of controlling app views, executing tasks, and running local code", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { icon: Globe, title: "Shareable Unique Links", desc: "Make any chat session public and share a direct link with anyone on the web", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { icon: Ghost, title: "Ghost Temp Sessions", desc: "Zero-trace private sessions that self-destruct when closed with auto-cleanup", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { icon: FileText, title: "PDF Parser & Exporter", desc: "Upload PDFs for instant deep analysis and export transcripts into styled PDFs", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
];

export default function XakAIHomePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [creatingType, setCreatingType] = useState<"standard" | "temp" | "group" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "group" | "temp" | "public">("all");

  // Real-time Firestore query for user sessions
  useEffect(() => {
    if (!user || !firestore) {
      setLoadingSessions(false);
      return;
    }
    const q = query(collection(firestore, "ai_chats"), orderBy("updatedAt", "desc"), limit(40));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Session))
          .filter((s) => s.members?.includes(user.uid) || s.ownerId === user.uid);
        setSessions(loaded);
        setLoadingSessions(false);
      },
      (err) => {
        console.warn("Sessions snapshot error:", err);
        setLoadingSessions(false);
      }
    );
    return () => unsub();
  }, [user, firestore]);

  const createSession = async (mode: "standard" | "temp" | "group" = "standard") => {
    if (!user || !firestore) {
      toast({ title: "Sign in to launch Xak AI", description: "You need an account to create sessions." });
      return;
    }
    setCreatingType(mode);
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
      });

      router.push(`/ai-chat/${docRef.id}`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to create session", description: err.message });
      setCreatingType(null);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore) return;
    await deleteDocumentNonBlocking(doc(firestore, "ai_chats", id));
    toast({ title: "Session deleted" });
  };

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.messages?.some((m) => m.content?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeFilter === "group") return s.members?.length > 1;
    if (activeFilter === "temp") return s.temporary;
    if (activeFilter === "public") return s.public;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#05030d] text-white selection:bg-primary/30 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18),transparent_70%)]" />
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-black uppercase tracking-widest mb-6 shadow-xl shadow-primary/20 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-primary" />
            Next-Gen Autonomous AI Assistant
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-7xl font-black uppercase italic tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-white/60 drop-shadow-sm"
          >
            XAK AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-base leading-relaxed mb-8 font-normal"
          >
            Real multi-user group chats, temporary ghost sessions, deep PDF analysis, direct link sharing, and autonomous Xakteir system control.
          </motion.p>

          {/* Action Launcher Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              onClick={() => createSession("standard")}
              disabled={creatingType !== null}
              className="h-12 px-7 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 flex items-center gap-2 transition-all active:scale-95"
            >
              {creatingType === "standard" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              New Chat
            </Button>

            <Button
              onClick={() => createSession("group")}
              disabled={creatingType !== null}
              variant="outline"
              className="h-12 px-6 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 backdrop-blur-md transition-all active:scale-95"
            >
              {creatingType === "group" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4 text-blue-400" />}
              Group AI Chat
            </Button>

            <Button
              onClick={() => createSession("temp")}
              disabled={creatingType !== null}
              variant="outline"
              className="h-12 px-6 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 backdrop-blur-md transition-all active:scale-95"
            >
              {creatingType === "temp" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ghost className="w-4 h-4 text-purple-400" />}
              Temporary Chat
            </Button>
          </motion.div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-primary" /> Core Capabilities
            </h3>
            <span className="text-[10px] font-mono text-white/20">Xak AI v3.0</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURE_CARDS.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className={cn(
                  "p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between group",
                  f.color
                )}
              >
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 group-hover:scale-110 transition-transform">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-white mb-1">{f.title}</h4>
                    <p className="text-xs text-white/50 leading-relaxed font-normal">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Chat Sessions Section */}
        {user && (
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" /> Your Active Sessions
                </h2>
                <p className="text-xs text-white/40 mt-1">Real-time sync powered by Firebase Firestore</p>
              </div>

              {/* Filter tabs & Search input */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sessions..."
                    className="h-9 pl-9 bg-white/5 border-white/10 text-xs rounded-xl text-white placeholder:text-white/20 focus-visible:ring-primary/40"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "group", label: "Group" },
                      { id: "temp", label: "Temp" },
                      { id: "public", label: "Public" },
                    ] as const
                  ).map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                        activeFilter === filter.id
                          ? "bg-primary text-white shadow-md"
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loadingSessions ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-white/30">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-mono">Connecting to Firestore...</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 text-white/10" />
                <p className="text-xs font-bold uppercase tracking-wider text-white/30">No sessions found</p>
                <p className="text-[11px] text-white/20 mt-1">Start a new chat to begin exploring Xak AI</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence>
                  {filteredSessions.map((s) => (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => router.push(`/ai-chat/${s.id}`)}
                      className="group relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                            s.temporary
                              ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                              : s.members?.length > 1
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              : s.public
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-primary/10 border-primary/20 text-primary"
                          )}
                        >
                          {s.temporary ? (
                            <Ghost className="w-5 h-5" />
                          ) : s.members?.length > 1 ? (
                            <Users className="w-5 h-5" />
                          ) : s.public ? (
                            <Globe className="w-5 h-5" />
                          ) : (
                            <MessageSquare className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                              {s.title || "Untitled Session"}
                            </h4>
                            {s.temporary && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Temp
                              </span>
                            )}
                            {s.public && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Public
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/30 mt-0.5 font-mono truncate">
                            {s.messages?.length || 0} messages
                            {s.members?.length > 1 && ` · ${s.members.length} members`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-all"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
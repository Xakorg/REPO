"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Send, User, Sparkles, Loader2, Bot, Plus, MessageSquare, History,
  Lock, Trash2, Copy, CheckCircle2, Mic, MicOff, Volume2, VolumeX,
  Paperclip, ImagePlus, Download, Brain, Share2, Globe, Ghost,
  Users, Settings2, ChevronRight, X, FileText, Zap, Eye,
} from "lucide-react";
import { chatWithXakAI } from "@/ai/flows/xak-ai-chat-assistant-flow";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import {
  collection, query, orderBy, limit, serverTimestamp,
  doc, updateDoc, getDoc, setDoc, arrayUnion, onSnapshot,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { AgentThoughtSidebar, type ThoughtStep } from "@/components/ai/AgentThoughtSidebar";
import { LiveCodeEditor } from "@/components/ai/LiveCodeEditor";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  role: "user" | "model";
  content: string;
  senderUid?: string;
  senderName?: string;
  senderPhoto?: string;
  timestamp?: number;
  imageUrl?: string; // AI-generated image
};

type Session = {
  id: string;
  title: string;
  messages: Message[];
  members: string[];
  ownerId: string;
  public: boolean;
  temporary: boolean;
  createdAt: any;
  updatedAt: any;
};

// ─── FormattedContent ─────────────────────────────────────────────────────────
function FormattedContent({ content, onSelectChoice }: { content: string; onSelectChoice?: (c: string) => void }) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (text: string, id: number) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      toast({ title: "Copied" });
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm leading-7">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match?.[1] || "code";
          const code = match?.[2] || "";

          // Use LiveCodeEditor for code blocks
          if (["html", "js", "javascript", "jsx", "ts", "typescript", "tsx", "css"].includes(lang.toLowerCase())) {
            return <LiveCodeEditor key={i} code={code.trim()} language={lang} />;
          }

          return (
            <div key={i} className="my-3 rounded-xl overflow-hidden border border-white/10 bg-zinc-950 group/code">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{lang}</span>
                <button
                  onClick={() => handleCopy(code, i)}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                >
                  {copiedId === i ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedId === i ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-sky-400 leading-relaxed whitespace-pre">{code.trim()}</pre>
              </div>
            </div>
          );
        }

        // Inline formatting (bold, italic)
        const formatted = part
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="text-white/80">$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-white/10 text-emerald-400 rounded px-1 py-0.5 font-mono text-xs">$1</code>');

        return (
          <div
            key={i}
            className="whitespace-pre-wrap leading-7 text-white/80"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function XakAIChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // UI toggles
  const [showThoughts, setShowThoughts] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Sidebar sessions list
  const [allSessions, setAllSessions] = useState<Session[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Load session from Firestore ──────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !firestore) {
      setSessionLoading(false);
      return;
    }

    const docRef = doc(firestore, "ai_chats", sessionId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) {
        setSessionLoading(false);
        return;
      }
      const data = { id: snap.id, ...snap.data() } as Session;
      setSession(data);
      setMessages(data.messages || []);

      // Determine read-only: public session but not a member
      if (user) {
        setIsReadOnly(!data.members.includes(user.uid));
      } else {
        setIsReadOnly(!data.public);
      }

      setSessionLoading(false);
    });

    return () => unsub();
  }, [sessionId, firestore, user]);

  // ─── Load all user sessions for sidebar ───────────────────────────────────
  useEffect(() => {
    if (!user || !firestore) return;
    const q = query(
      collection(firestore, "ai_chats"),
      orderBy("updatedAt", "desc"),
      limit(30)
    );
    // Using onSnapshot to get real-time updates
    const unsub = onSnapshot(q, (snap) => {
      const sessions = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Session))
        .filter(s => s.members?.includes(user.uid));
      setAllSessions(sessions);
    });
    return () => unsub();
  }, [user, firestore]);

  // ─── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      const vp = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (vp) vp.scrollTop = vp.scrollHeight;
    }
  }, [messages, loading]);

  // ─── Speech recognition ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => {
      let final = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInput(prev => prev + (final || interim));
    };
    recognitionRef.current = rec;
  }, []);

  // ─── New session creator ───────────────────────────────────────────────────
  const createNewSession = useCallback(async (temporary = false) => {
    if (!user || !firestore) {
      toast({ title: "Sign in to create a session" });
      return;
    }

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
  }, [user, firestore, router, toast]);

  // ─── Submit message ────────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading || isReadOnly) return;

    const userMsg: Message = {
      role: "user",
      content: trimmed,
      senderUid: user?.uid,
      senderName: user?.displayName || "You",
      senderPhoto: user?.photoURL || "",
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setThoughtSteps([]);

    // Add a "thinking" step
    const addThought = (step: Omit<ThoughtStep, "id" | "timestamp">) => {
      setThoughtSteps(prev => [...prev, { ...step, id: Math.random().toString(36), timestamp: Date.now() }]);
    };

    addThought({ type: "thinking", label: "Processing your message..." });

    try {
      const history = messages.map(m => ({
        role: m.role as any,
        content: [{ text: m.content }],
      }));

      addThought({ type: "tool_call", label: "Calling Xak AI", detail: `Prompt: "${trimmed}"` });

      const response = await chatWithXakAI({
        message: trimmed,
        history,
        userId: user?.uid,
      });

      addThought({ type: "tool_result", label: "Got response", detail: `${response.response.length} chars` });
      addThought({ type: "complete", label: "Done!" });

      const aiMsg: Message = {
        role: "model",
        content: response.response,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      // Save to Firestore
      if (user && firestore && sessionId) {
        // Update existing session
        await updateDoc(doc(firestore, "ai_chats", sessionId), {
          messages: finalMessages,
          title: session?.title === "New Chat" ? trimmed.substring(0, 40) : session?.title,
          updatedAt: serverTimestamp(),
        });
      } else if (user && firestore) {
        // Create a new session and redirect
        const docRef = doc(collection(firestore, "ai_chats"));
        await setDoc(docRef, {
          title: trimmed.substring(0, 40),
          messages: finalMessages,
          members: [user.uid],
          ownerId: user.uid,
          public: false,
          temporary: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        router.push(`/ai-chat/${docRef.id}`);
      }
    } catch (err) {
      addThought({ type: "tool_result", label: "Error occurred", detail: String(err) });
      toast({ variant: "destructive", title: "Xak AI Error", description: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  // ─── PDF Export ────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (messages.length === 0) return;
    toast({ title: "Generating PDF..." });
    try {
      const res = await fetch("/api/ai-chat/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, title: session?.title || "Chat" }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "xak-ai-chat.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded!" });
    } catch {
      toast({ variant: "destructive", title: "PDF export failed" });
    }
  };

  // ─── PDF Upload ────────────────────────────────────────────────────────────
  const handlePDFUpload = async (file: File) => {
    toast({ title: "Reading PDF..." });
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      const res = await fetch("/api/ai-chat/parse-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const context = `[PDF Context - ${file.name}]\n${data.text.substring(0, 8000)}`;
      setInput(prev => context + "\n\n" + prev);
      toast({ title: `PDF loaded! (${data.numPages} pages)` });
    } catch {
      toast({ variant: "destructive", title: "Failed to read PDF" });
    }
  };

  // ─── Share ─────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!session || !sessionId || !firestore) return;
    await updateDoc(doc(firestore, "ai_chats", sessionId), { public: !session.public });
    if (!session.public) {
      await copyToClipboard(`${window.location.origin}/ai-chat/${sessionId}`);
      toast({ title: "🔗 Public link copied!", description: "Anyone with the link can view this chat." });
    } else {
      toast({ title: "Chat set to private" });
    }
  };

  // ─── Delete session ───────────────────────────────────────────────────────
  const handleDeleteSession = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!firestore) return;
    await deleteDocumentNonBlocking(doc(firestore, "ai_chats", id));
    if (sessionId === id) router.push("/ai-chat");
    toast({ title: "Session deleted" });
  };

  // ─── Sidebar content (shared between desktop + mobile) ────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* New chat buttons */}
      <div className="p-4 space-y-2 border-b border-white/10 shrink-0">
        <Button
          onClick={() => createNewSession(false)}
          disabled={!user}
          className="w-full h-10 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl font-bold text-xs flex items-center gap-2 justify-start px-4"
        >
          <Plus className="w-4 h-4" /> New Chat
        </Button>
        <Button
          onClick={() => createNewSession(true)}
          disabled={!user}
          variant="ghost"
          className="w-full h-10 text-white/40 hover:text-white hover:bg-white/5 rounded-xl font-bold text-xs flex items-center gap-2 justify-start px-4"
        >
          <Ghost className="w-4 h-4" /> Temporary Chat
        </Button>
      </div>

      {/* Session list */}
      <ScrollArea className="flex-1 px-3 py-3">
        {!user ? (
          <div className="py-12 text-center">
            <Lock className="w-6 h-6 mx-auto mb-3 text-white/10" />
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Sign in to save chats</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="px-2 py-2 text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
              <History className="w-3 h-3" /> History
            </p>
            {allSessions.map(s => (
              <button
                key={s.id}
                onClick={() => router.push(`/ai-chat/${s.id}`)}
                className={cn(
                  "w-full px-3 py-2.5 rounded-xl text-left transition-all flex items-center justify-between group/item",
                  sessionId === s.id
                    ? "bg-primary/15 text-white border border-primary/20"
                    : "hover:bg-white/5 text-white/50 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {s.public && <Globe className="w-3 h-3 shrink-0 text-emerald-400/60" />}
                  {s.temporary && <Ghost className="w-3 h-3 shrink-0 text-purple-400/60" />}
                  {!s.public && !s.temporary && <MessageSquare className="w-3 h-3 shrink-0 opacity-30" />}
                  <span className="text-[11px] font-semibold truncate">{s.title || "Untitled"}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="opacity-0 group-hover/item:opacity-40 hover:!opacity-100 p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-all shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (sessionLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex overflow-hidden text-white bg-[#05030d]">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-3xl transition-all duration-300 shrink-0",
        showSidebar ? "w-64" : "w-0 overflow-hidden"
      )}>
        <SidebarContent />
      </aside>

      {/* ── Main chat area ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-14 border-b border-white/10 bg-black/30 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden w-9 h-9 rounded-xl border border-white/10 bg-white/5">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#05030d] border-white/10 p-0 w-72 text-white">
                <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* Desktop sidebar toggle */}
            <button
              onClick={() => setShowSidebar(v => !v)}
              className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              <ChevronRight className={cn("w-4 h-4 transition-transform", showSidebar && "rotate-180")} />
            </button>

            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="font-black uppercase italic tracking-tighter text-lg">
                {session?.title || "Xak AI"}
              </span>
              {session?.public && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[8px] px-2">Public</Badge>
              )}
              {session?.temporary && (
                <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/20 text-[8px] px-2">Temp</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Thought process toggle */}
            <button
              onClick={() => setShowThoughts(v => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                showThoughts
                  ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              <Brain className="w-3 h-3" />
              <span className="hidden sm:inline">Thoughts</span>
            </button>

            {/* Share */}
            {session && (
              <button
                onClick={handleShare}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                  session.public
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                <Share2 className="w-3 h-3" />
                <span className="hidden sm:inline">{session.public ? "Shared" : "Share"}</span>
              </button>
            )}

            {/* Export PDF */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white transition-all"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {user ? (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px]">Active</Badge>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[8px]">Guest</Badge>
            )}
          </div>
        </header>

        {/* Read-only banner */}
        {isReadOnly && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center gap-3">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-amber-400 text-xs font-bold">
              You are viewing a shared chat in read-only mode.
            </p>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Messages area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 pb-4">

                {/* Welcome screen */}
                {messages.length === 0 && !loading && (
                  <div className="py-16 text-center space-y-8 animate-in fade-in duration-500">
                    <div className="relative mx-auto w-20 h-20">
                      <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/10">
                        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#05030d] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Xak AI</h1>
                      <p className="text-white/40 text-sm">Your personal AI agent. Ask anything.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                      {[
                        "Build a game in HTML",
                        "Explain quantum computing",
                        "Write a Python script",
                        "Generate an image idea",
                      ].map(p => (
                        <button
                          key={p}
                          onClick={() => { setInput(p); textareaRef.current?.focus(); }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-left text-white/60 hover:border-primary/30 hover:bg-primary/5 hover:text-white transition-all"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={i} className={cn("flex gap-3", isUser && "flex-row-reverse")}>
                      {/* Avatar */}
                      <div className={cn(
                        "w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 border text-xs font-black",
                        isUser ? "bg-white/5 border-white/10" : "bg-primary/20 border-primary/30"
                      )}>
                        {isUser
                          ? (msg.senderPhoto
                            ? <img src={msg.senderPhoto} alt="" className="w-full h-full rounded-2xl object-cover" />
                            : <User className="w-4 h-4 text-white/40" />)
                          : <Bot className="w-4 h-4 text-primary" />
                        }
                      </div>

                      {/* Bubble */}
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-5 py-4 border relative group/bubble",
                        isUser
                          ? "bg-primary/10 border-primary/20 rounded-tr-sm"
                          : "bg-white/5 border-white/10 rounded-tl-sm"
                      )}>
                        {/* Sender name for group */}
                        {msg.senderName && !isUser && (
                          <p className="text-[10px] font-black text-primary/70 uppercase tracking-wider mb-2">{msg.senderName}</p>
                        )}

                        {/* Image content */}
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="AI generated" className="rounded-xl mb-3 max-w-full" />
                        )}

                        <FormattedContent content={msg.content} />

                        {/* Message actions */}
                        {!isUser && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover/bubble:opacity-100 flex items-center gap-1 transition-all">
                            <button
                              onClick={() => {
                                if (speakingIndex === i) {
                                  window.speechSynthesis.cancel();
                                  setSpeakingIndex(null);
                                } else {
                                  window.speechSynthesis.cancel();
                                  const clean = msg.content.replace(/```[\s\S]*?```/g, "[code]").replace(/[*_#`|]/g, "");
                                  const utt = new SpeechSynthesisUtterance(clean.substring(0, 500));
                                  utt.onend = () => setSpeakingIndex(null);
                                  window.speechSynthesis.speak(utt);
                                  setSpeakingIndex(i);
                                }
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all"
                            >
                              {speakingIndex === i ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(msg.content)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading */}
                {loading && (
                  <div className="flex gap-3 animate-in fade-in">
                    <div className="w-8 h-8 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                    <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            {!isReadOnly && (
              <div className="border-t border-white/10 bg-black/30 backdrop-blur-xl p-4">
                {/* Quick tools */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                  {[
                    { icon: Paperclip, label: "PDF", onClick: () => { const f = document.getElementById("pdf-upload") as HTMLInputElement; f?.click(); } },
                    { icon: ImagePlus, label: "Image", onClick: () => setInput("Generate an image of: ") },
                    { icon: Zap, label: "Agent", onClick: () => setInput("Control Xakteir: navigate to ") },
                    { icon: Users, label: "Group", onClick: () => toast({ title: "Invite friends to this chat by sharing the link!" }) },
                    { icon: Download, label: "Export PDF", onClick: handleExportPDF },
                  ].map((t, i) => (
                    <button
                      key={i}
                      onClick={t.onClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-primary/20 hover:border-primary/30 hover:text-primary text-white/40 text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all"
                    >
                      <t.icon className="w-3 h-3" />
                      {t.label}
                    </button>
                  ))}
                </div>

                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePDFUpload(f); }}
                />

                <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      id="ai-chat-input"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="Ask Xak AI anything... (Shift+Enter for new line)"
                      rows={1}
                      className="w-full resize-none rounded-2xl border-2 border-white/10 focus-visible:border-primary/50 bg-white/5 px-5 py-4 pr-12 text-sm placeholder:text-white/20 text-white focus-visible:ring-0 min-h-[56px] max-h-40 leading-relaxed"
                      style={{ fieldSizing: "content" } as any}
                    />
                    <button
                      type="button"
                      onClick={() => recognitionRef.current && (isListening ? recognitionRef.current.stop() : recognitionRef.current.start())}
                      className={cn(
                        "absolute right-3 bottom-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                        isListening ? "bg-rose-500 text-white animate-pulse" : "bg-white/10 text-white/40 hover:text-white"
                      )}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="w-12 h-12 shrink-0 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-40"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ── Thought Process Sidebar ──────────────────────────────────── */}
          {showThoughts && (
            <AgentThoughtSidebar
              steps={thoughtSteps}
              isThinking={loading}
              onClose={() => setShowThoughts(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

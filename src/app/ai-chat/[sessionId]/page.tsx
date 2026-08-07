"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Send, User, Sparkles, Loader2, Bot, Plus, MessageSquare, History,
  Lock, Trash2, Copy, CheckCircle2, Mic, MicOff, Volume2, VolumeX,
  Paperclip, Download, Share2, Globe, Ghost, ChevronRight,
  X, FileText, Eye, Settings, Zap,
} from "lucide-react";
import { chatWithXakAI } from "@/ai/flows/xak-ai-chat-assistant-flow";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";
import { useUser, useFirestore } from "@/firebase";
import {
  collection, query, orderBy, limit, serverTimestamp,
  doc, updateDoc, setDoc, onSnapshot,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { AgentThoughtSidebar, type ThoughtStep } from "@/components/ai/AgentThoughtSidebar";
import { LiveCodeEditor } from "@/components/ai/LiveCodeEditor";
import { PersonaSwitcher, PERSONAS, type PersonaId } from "@/components/ai/PersonaSwitcher";
import { EmailDraftCard, type EmailDraft } from "@/components/ai/EmailDraftCard";
import { VoiceModeOverlay } from "@/components/ai/VoiceModeOverlay";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  role: "user" | "model";
  content: string;
  senderUid?: string;
  senderName?: string;
  senderPhoto?: string;
  timestamp?: number;
  imageUrl?: string;
  emailDraft?: EmailDraft;
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

// ─── Parse email draft from AI response ──────────────────────────────────────
function parseEmailDraft(text: string): EmailDraft | null {
  const emailBlock = text.match(/```email\n?([\s\S]*?)```/i);
  if (!emailBlock) return null;
  const raw = emailBlock[1];
  const to = raw.match(/^To:\s*(.+)$/im)?.[1]?.trim();
  const subject = raw.match(/^Subject:\s*(.+)$/im)?.[1]?.trim();
  const bodyMatch = raw.match(/^Body:\s*([\s\S]+)$/im);
  const body = bodyMatch ? bodyMatch[1].trim() : raw;
  return { to, subject, body };
}

// ─── Strip email blocks from display text ────────────────────────────────────
function stripEmailBlock(text: string): string {
  return text.replace(/```email[\s\S]*?```/gi, "").trim();
}

// ─── FormattedContent ─────────────────────────────────────────────────────────
function FormattedContent({ content }: { content: string }) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (text: string, id: number) => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopiedId(id); toast({ title: "Copied" }); setTimeout(() => setCopiedId(null), 2000); }
  };

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-sm leading-7">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match?.[1] || "code";
          const code = match?.[2] || "";

          if (["html", "js", "javascript", "jsx", "ts", "typescript", "tsx", "css"].includes(lang.toLowerCase())) {
            return <LiveCodeEditor key={i} code={code.trim()} language={lang} />;
          }

          return (
            <div key={i} className="my-2 rounded-xl overflow-hidden border border-white/10 bg-zinc-950">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{lang}</span>
                <button onClick={() => handleCopy(code, i)} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">
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

        const formatted = part
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="text-white/70">$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-white/10 text-emerald-400 rounded px-1 py-0.5 font-mono text-xs">$1</code>');

        return (
          <div key={i} className="whitespace-pre-wrap leading-7 text-white/75"
            dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      })}
    </div>
  );
}

// ─── Agent Banner ─────────────────────────────────────────────────────────────
function AgentControlBanner({ isActive, onViewThoughts }: { isActive: boolean; onViewThoughts: () => void }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 rounded-full bg-amber-400"
              />
              <span className="text-amber-400 text-xs font-black uppercase tracking-wider">
                Xak AI is controlling Xakteir
              </span>
            </div>
            <button
              onClick={onViewThoughts}
              className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              View Thoughts <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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

  // UI state
  const [showThoughts, setShowThoughts] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  const [agentActive, setAgentActive] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [persona, setPersona] = useState<PersonaId>('xak');

  // Voice mode
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  // Dismissed email drafts
  const [dismissedDrafts, setDismissedDrafts] = useState<Set<number>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Session loading ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !firestore) { setSessionLoading(false); return; }
    const docRef = doc(firestore, "ai_chats", sessionId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) { setSessionLoading(false); return; }
      const data = { id: snap.id, ...snap.data() } as Session;
      setSession(data);
      setMessages(data.messages || []);
      if (user) setIsReadOnly(!data.members.includes(user.uid));
      else setIsReadOnly(!data.public);
      setSessionLoading(false);
    });
    return () => unsub();
  }, [sessionId, firestore, user]);

  // ─── All sessions ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !firestore) return;
    const q = query(collection(firestore, "ai_chats"), orderBy("updatedAt", "desc"), limit(40));
    const unsub = onSnapshot(q, (snap) => {
      setAllSessions(
        snap.docs.map(d => ({ id: d.id, ...d.data() } as Session))
          .filter(s => s.members?.includes(user.uid))
      );
    });
    return () => unsub();
  }, [user, firestore]);

  // ─── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      const vp = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (vp) vp.scrollTop = vp.scrollHeight;
    }
  }, [messages, loading]);

  // ─── Speech recognition setup ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => { setVoiceState('listening'); };
    rec.onend = () => { setVoiceState('idle'); };
    rec.onresult = (e: any) => {
      let final = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      const text = final || interim;
      setVoiceTranscript(text);
      if (final) {
        setInput(final);
        // Auto-submit from voice mode
        setTimeout(() => { handleVoiceSubmit(final); }, 300);
      }
    };
    recognitionRef.current = rec;
  }, []);

  const handleVoiceSubmit = async (text: string) => {
    if (!text.trim()) return;
    setVoiceTranscript('');
    setVoiceState('idle');
    await sendMessage(text);
  };

  // ─── Create new session ────────────────────────────────────────────────────
  const createNewSession = useCallback(async (temporary = false) => {
    if (!user || !firestore) { toast({ title: "Sign in to create a session" }); return; }
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

  // ─── Core send message ─────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || isReadOnly) return;

    const personaObj = PERSONAS.find(p => p.id === persona) || PERSONAS[0];

    const userMsg: Message = {
      role: "user",
      content: text,
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
    setAgentActive(false);

    const addThought = (step: Omit<ThoughtStep, "id" | "timestamp">) => {
      setThoughtSteps(prev => [...prev, { ...step, id: Math.random().toString(36), timestamp: Date.now() }]);
    };

    addThought({ type: "thinking", label: "Processing your message..." });

    try {
      const history = messages.map(m => ({
        role: m.role as any,
        content: [{ text: m.content }],
      }));

      addThought({ type: "tool_call", label: `${personaObj.name} is thinking`, detail: `"${text}"` });

      const response = await chatWithXakAI({
        message: text,
        history,
        userId: user?.uid,
      });

      addThought({ type: "complete", label: "Response ready" });

      // Detect agent action
      if (response.response.includes("Navigating to") || response.response.includes("Clicking element")) {
        setAgentActive(true);
        addThought({ type: "action", label: "Executing Xakteir action", detail: response.response });
      }

      // Parse email draft if present
      const emailDraft = parseEmailDraft(response.response);
      const displayContent = emailDraft ? stripEmailBlock(response.response) : response.response;

      const aiMsg: Message = {
        role: "model",
        content: displayContent,
        timestamp: Date.now(),
        emailDraft: emailDraft || undefined,
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      // Auto-speak
      if (autoSpeak || voiceOpen) {
        const clean = displayContent.replace(/```[\s\S]*?```/g, "[code]").replace(/[*_#`|]/g, "");
        setVoiceState('speaking');
        const utt = new SpeechSynthesisUtterance(clean.substring(0, 600));
        utt.onend = () => { setVoiceState('idle'); setSpeakingIndex(null); };
        window.speechSynthesis.speak(utt);
        setSpeakingIndex(finalMessages.length - 1);
      }

      // Persist to Firestore
      if (user && firestore && sessionId) {
        await updateDoc(doc(firestore, "ai_chats", sessionId), {
          messages: finalMessages,
          title: session?.title === "New Chat" ? text.substring(0, 45) : session?.title,
          updatedAt: serverTimestamp(),
        });
      } else if (user && firestore) {
        const docRef = doc(collection(firestore, "ai_chats"));
        await setDoc(docRef, {
          title: text.substring(0, 45),
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
      addThought({ type: "tool_result", label: "Error", detail: String(err) });
      toast({ variant: "destructive", title: "Xak AI Error", description: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input.trim());
  };

  // ─── PDF Export ────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!messages.length) return;
    toast({ title: "Generating PDF..." });
    try {
      const res = await fetch("/api/ai-chat/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, title: session?.title }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "xak-ai-chat.pdf"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded!" });
    } catch { toast({ variant: "destructive", title: "PDF export failed" }); }
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
      setInput(`I've uploaded a PDF (${file.name}, ${data.numPages} pages). Here's the content:\n\n${data.text.substring(0, 6000)}\n\nPlease analyze this.`);
      toast({ title: `PDF loaded (${data.numPages} pages)` });
    } catch { toast({ variant: "destructive", title: "Failed to read PDF" }); }
  };

  // ─── Share ─────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!session || !sessionId || !firestore) return;
    await updateDoc(doc(firestore, "ai_chats", sessionId), { public: !session.public });
    if (!session.public) {
      await copyToClipboard(`${window.location.origin}/ai-chat/${sessionId}`);
      toast({ title: "🔗 Public link copied!" });
    } else {
      toast({ title: "Chat set to private" });
    }
  };

  // ─── Voice controls ────────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (voiceOpen) {
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
      setVoiceOpen(false);
      setVoiceState('idle');
    } else {
      setVoiceOpen(true);
      if (!voiceMuted) recognitionRef.current?.start();
    }
  };

  const handleMute = () => {
    if (voiceMuted) {
      setVoiceMuted(false);
      recognitionRef.current?.start();
    } else {
      setVoiceMuted(true);
      recognitionRef.current?.stop();
    }
  };

  // ─── Sidebar content ───────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-1.5 border-b border-white/10 shrink-0">
        <button onClick={() => createNewSession(false)} disabled={!user}
          className="w-full h-9 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-xs flex items-center gap-2 px-3 transition-all">
          <Plus className="w-3.5 h-3.5" /> New Chat
        </button>
        <button onClick={() => createNewSession(true)} disabled={!user}
          className="w-full h-9 rounded-xl hover:bg-white/5 text-white/30 hover:text-white font-bold text-xs flex items-center gap-2 px-3 transition-all">
          <Ghost className="w-3.5 h-3.5" /> Temporary Chat
        </button>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {!user ? (
          <div className="py-12 text-center">
            <Lock className="w-5 h-5 mx-auto mb-2 text-white/10" />
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Sign in to save chats</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="px-2 py-2 text-[9px] font-black text-white/20 uppercase tracking-widest">History</p>
            {allSessions.map(s => (
              <button key={s.id} onClick={() => router.push(`/ai-chat/${s.id}`)}
                className={cn(
                  "w-full px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between group/item text-[11px]",
                  sessionId === s.id
                    ? "bg-primary/10 text-white border border-primary/15"
                    : "hover:bg-white/5 text-white/40 hover:text-white"
                )}>
                <div className="flex items-center gap-2 truncate min-w-0">
                  {s.public ? <Globe className="w-3 h-3 shrink-0 text-emerald-400/60" /> :
                   s.temporary ? <Ghost className="w-3 h-3 shrink-0 text-purple-400/60" /> :
                   <MessageSquare className="w-3 h-3 shrink-0 opacity-20" />}
                  <span className="truncate font-medium">{s.title || "Untitled"}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); if (firestore) deleteDocumentNonBlocking(doc(firestore, "ai_chats", s.id)); if (sessionId === s.id) router.push("/ai-chat"); }}
                  className="opacity-0 group-hover/item:opacity-40 hover:!opacity-100 p-1 rounded hover:bg-rose-500/20 text-rose-400 shrink-0">
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
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-[#05030d]">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex overflow-hidden text-white bg-[#05030d]">

      {/* Voice Mode Overlay */}
      <VoiceModeOverlay
        isOpen={voiceOpen}
        onClose={toggleVoice}
        state={voiceState}
        transcript={voiceTranscript}
        onMute={handleMute}
        isMuted={voiceMuted}
      />

      {/* Agent Thought Sidebar — floating panel, only when agent active */}
      <AnimatePresence>
        {showThoughts && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 shadow-2xl"
          >
            <AgentThoughtSidebar
              steps={thoughtSteps}
              isThinking={loading}
              onClose={() => setShowThoughts(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-3xl transition-all duration-300 shrink-0",
        showSidebar ? "w-60" : "w-0 overflow-hidden"
      )}>
        <SidebarContent />
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="h-13 border-b border-white/10 bg-black/30 backdrop-blur-xl flex items-center gap-3 px-3 shrink-0">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden w-8 h-8 rounded-xl border border-white/10 bg-white/5 shrink-0">
                <Menu className="w-3.5 h-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#05030d] border-white/10 p-0 w-60 text-white">
              <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Sidebar toggle (desktop) */}
          <button onClick={() => setShowSidebar(v => !v)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all shrink-0">
            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showSidebar && "rotate-180")} />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Bot className="w-4 h-4 text-primary shrink-0" />
            <span className="font-black uppercase italic tracking-tighter text-base truncate">
              {session?.title || "Xak AI"}
            </span>
            {session?.public && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] shrink-0">Public</Badge>}
            {session?.temporary && <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px] shrink-0">Temp</Badge>}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Persona */}
            <PersonaSwitcher activePersona={persona} onChange={setPersona} />

            {/* Voice */}
            <button onClick={toggleVoice}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                voiceOpen
                  ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
              )}>
              <Mic className="w-3 h-3" />
              <span className="hidden sm:inline">Voice</span>
            </button>

            {/* Share */}
            {session && (
              <button onClick={handleShare}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                  session.public
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                    : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
                )}>
                <Share2 className="w-3 h-3" />
                <span className="hidden md:inline">{session.public ? "Shared" : "Share"}</span>
              </button>
            )}

            {/* PDF Export */}
            <button onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white transition-all">
              <Download className="w-3 h-3" />
              <span className="hidden md:inline">PDF</span>
            </button>

            {/* Auto-speak toggle */}
            <button onClick={() => setAutoSpeak(v => !v)} title="Auto-speak AI responses"
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center border transition-all",
                autoSpeak ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-white/30 border-white/10 hover:text-white hover:bg-white/10"
              )}>
              {autoSpeak ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </button>
          </div>
        </header>

        {/* Agent control banner */}
        <AgentControlBanner isActive={agentActive && !showThoughts} onViewThoughts={() => setShowThoughts(true)} />

        {/* Read-only banner */}
        {isReadOnly && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-amber-400 text-xs font-bold">Viewing shared chat — read only</p>
          </div>
        )}

        {/* ── Messages ─────────────────────────────────────────────────────── */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-2xl mx-auto py-8 px-4 space-y-5 pb-4">

            {/* Welcome */}
            {messages.length === 0 && !loading && (
              <div className="py-12 text-center space-y-6 animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-xl shadow-primary/10">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-1">Xak AI</h1>
                  <p className="text-white/30 text-sm">
                    {PERSONAS.find(p => p.id === persona)?.tagline || "Your personal AI agent"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                  {[
                    "Build me a game in HTML",
                    "Draft an email to my team",
                    "Explain how neural nets work",
                    "Write a Python web scraper",
                  ].map(p => (
                    <button key={p} onClick={() => { setInput(p); textareaRef.current?.focus(); }}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-left text-white/50 hover:border-primary/30 hover:bg-primary/5 hover:text-white transition-all">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex gap-3", isUser && "flex-row-reverse")}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border mt-1",
                    isUser ? "bg-white/5 border-white/10" : "bg-primary/15 border-primary/25"
                  )}>
                    {isUser
                      ? (msg.senderPhoto
                        ? <img src={msg.senderPhoto} alt="" className="w-full h-full rounded-xl object-cover" />
                        : <User className="w-3.5 h-3.5 text-white/40" />)
                      : <Bot className="w-3.5 h-3.5 text-primary" />}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    "max-w-[82%] rounded-2xl px-4 py-3 border relative group/bubble",
                    isUser
                      ? "bg-primary/8 border-primary/15 rounded-tr-sm"
                      : "bg-white/[0.04] border-white/8 rounded-tl-sm"
                  )}>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="AI generated" className="rounded-xl mb-3 max-w-full" />
                    )}

                    <FormattedContent content={msg.content} />

                    {/* Email draft card */}
                    {msg.emailDraft && !dismissedDrafts.has(i) && (
                      <EmailDraftCard
                        draft={msg.emailDraft}
                        onDismiss={() => setDismissedDrafts(prev => new Set([...prev, i]))}
                      />
                    )}

                    {/* Message actions (hover) */}
                    {!isUser && (
                      <div className="absolute -top-7 right-0 opacity-0 group-hover/bubble:opacity-100 flex items-center gap-1 transition-all bg-[#0a0814] border border-white/10 rounded-lg px-1.5 py-1">
                        <button onClick={() => {
                          const clean = msg.content.replace(/```[\s\S]*?```/g, "[code]").replace(/[*_#`|]/g, "");
                          if (speakingIndex === i) { window.speechSynthesis.cancel(); setSpeakingIndex(null); }
                          else { window.speechSynthesis.cancel(); const utt = new SpeechSynthesisUtterance(clean.substring(0, 600)); utt.onend = () => setSpeakingIndex(null); window.speechSynthesis.speak(utt); setSpeakingIndex(i); }
                        }} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white transition-colors">
                          {speakingIndex === i ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </button>
                        <button onClick={() => copyToClipboard(msg.content)}
                          className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3 animate-in fade-in">
                <div className="w-7 h-7 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/8 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── Input bar ────────────────────────────────────────────────────── */}
        {!isReadOnly && (
          <div className="border-t border-white/8 bg-[#05030d]/80 backdrop-blur-xl px-4 py-3">
            <input id="pdf-upload" type="file" accept=".pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePDFUpload(f); }} />

            <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-2xl mx-auto">
              {/* Attachment button */}
              <button type="button" onClick={() => (document.getElementById("pdf-upload") as HTMLInputElement)?.click()}
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all mb-0.5">
                <Paperclip className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  id="ai-chat-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder={`Message ${PERSONAS.find(p => p.id === persona)?.name || 'Xak AI'}…`}
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-white/10 focus-visible:border-primary/40 bg-white/5 px-4 py-3 text-sm placeholder:text-white/20 text-white focus-visible:ring-0 min-h-[44px] max-h-36 leading-relaxed transition-all"
                  style={{ fieldSizing: "content" } as any}
                />
                {/* Mic toggle inside input */}
                <button type="button" onClick={toggleVoice}
                  className={cn(
                    "absolute right-3 bottom-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                    voiceOpen ? "bg-violet-500 text-white" : "text-white/20 hover:text-white/60"
                  )}>
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>

              <button type="submit" disabled={loading || !input.trim()}
                className="w-9 h-9 shrink-0 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-30 mb-0.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-center text-[9px] text-white/15 mt-2 max-w-2xl mx-auto">
              Xak AI can make mistakes. Shift+Enter for new line.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

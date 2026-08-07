"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Send, User, Sparkles, Loader2, Bot, Plus, MessageSquare, History,
  Lock, Trash2, Copy, CheckCircle2, Mic, MicOff, Volume2, VolumeX,
  Paperclip, Download, Share2, Globe, Ghost, ChevronRight,
  X, FileText, Eye, Settings, Zap, Users, UserPlus, Save, Edit3, Search,
  MoreVertical, SlidersHorizontal, ArrowLeft
} from "lucide-react";
import { chatWithXakAI } from "@/ai/flows/xak-ai-chat-assistant-flow";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";
import { useUser, useFirestore } from "@/firebase";
import {
  collection, query, orderBy, limit, serverTimestamp,
  doc, updateDoc, setDoc, onSnapshot, arrayUnion
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Terminal, Brain, Puzzle, HardDrive, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  EcosystemIntegrationsModal,
  PluginBuilderModal,
  CustomPersonasStudioModal,
  GhostSessionVaultModal,
  PromptLibraryModal,
  ContextMemoryVaultModal,
  CommandPaletteModal,
  FloatingPiPAssistant,
  MultiFileCodeSandbox,
  DataChartWidget,
  ProceduralCanvasStudio,
  ThreeDShaderPlayground,
  RPGEngineWidget,
  MathFormulaSolver,
  CodeSnippetManager,
  UnitTestDocGenerator,
  AudioMemoTranscriber,
  WebSearchAgentWidget,
  KanbanBoardGenerator,
  CodeRefactoringWorkbench
} from "@/app/ai-chat/chat-widgets";


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
  isGroup?: boolean;
  createdAt: any;
  updatedAt: any;
};

interface AttachedPDF {
  name: string;
  numPages: number;
  text: string;
  sizeKb: string;
}

// ─── Parse Email Draft ────────────────────────────────────────────────────────
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

function stripEmailBlock(text: string): string {
  return text.replace(/```email[\s\S]*?```/gi, "").trim();
}

// ─── Formatted Content Component ──────────────────────────────────────────────
function FormattedContent({ content }: { content: string }) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (text: string, id: number) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      toast({ title: "Copied code block" });
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-sm leading-7">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match?.[1] || "code";
          const code = match?.[2] || "";

          const lowerLang = lang.toLowerCase();
          if (lowerLang === "sandbox") return <MultiFileCodeSandbox key={i} />;
          if (lowerLang === "chart") return <DataChartWidget key={i} />;
          if (lowerLang === "canvas") return <ProceduralCanvasStudio key={i} />;
          if (lowerLang === "shader") return <ThreeDShaderPlayground key={i} />;
          if (lowerLang === "rpg") return <RPGEngineWidget key={i} />;
          if (lowerLang === "math") return <MathFormulaSolver key={i} initialEquation={code.trim()} />;
          if (lowerLang === "snippets") return <CodeSnippetManager key={i} />;
          if (lowerLang === "unittest") return <UnitTestDocGenerator key={i} targetCode={code.trim()} />;
          if (lowerLang === "audio") return <AudioMemoTranscriber key={i} />;
          if (lowerLang === "websearch") return <WebSearchAgentWidget key={i} query={code.trim()} />;
          if (lowerLang === "kanban") return <KanbanBoardGenerator key={i} />;
          if (lowerLang === "refactor") return <CodeRefactoringWorkbench key={i} />;

          if (["html", "js", "javascript", "jsx", "ts", "typescript", "tsx", "css"].includes(lowerLang)) {
            return <LiveCodeEditor key={i} code={code.trim()} language={lang} />;
          }


          return (
            <div key={i} className="my-2 rounded-xl overflow-hidden border border-white/10 bg-zinc-950">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{lang}</span>
                <button
                  onClick={() => handleCopy(code, i)}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
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

        const formatted = part
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="text-white/70">$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-white/10 text-emerald-400 rounded px-1.5 py-0.5 font-mono text-xs">$1</code>');

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
                Xak AI is controlling Xakteir system
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

// ─── Main Chat Session Component ──────────────────────────────────────────────
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
  const [persona, setPersona] = useState<PersonaId>("xak");
  const [sidebarSearch, setSidebarSearch] = useState("");

  // Title Editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Group Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteUid, setInviteUid] = useState("");
  const [inviting, setInviting] = useState(false);

  // Attached PDF
  const [attachedPDF, setAttachedPDF] = useState<AttachedPDF | null>(null);
  const [parsingPDF, setParsingPDF] = useState(false);

  // Voice mode
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "speaking">("idle");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  // Dismissed email drafts
  const [dismissedDrafts, setDismissedDrafts] = useState<Set<number>>(new Set());

  // 30 Supercharged Suite Modals State
  const [ecoModalOpen, setEcoModalOpen] = useState(false);
  const [pluginModalOpen, setPluginModalOpen] = useState(false);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [ghostModalOpen, setGhostModalOpen] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ctrl+K Command Palette Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  // ─── Load session ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) {
      setSessionLoading(false);
      return;
    }

    // Handle local guest session
    if (sessionId.startsWith("guest_")) {
      setSession({
        id: sessionId,
        title: "Guest Session",
        messages: [],
        members: ["guest"],
        ownerId: "guest",
        public: false,
        temporary: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setSessionLoading(false);
      return;
    }

    if (!firestore) {
      setSessionLoading(false);
      return;
    }

    const docRef = doc(firestore, "ai_chats", sessionId);
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          setSessionLoading(false);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as Session;
        setSession(data);
        if (data.messages) {
          setMessages((prev) => {
            // Keep local optimistic messages if snapshot hasn't caught up yet
            if (prev.length > data.messages.length) return prev;
            return data.messages;
          });
        }
        setEditedTitle(data.title || "");

        if (user) {
          setIsReadOnly(!data.members?.includes(user.uid) && !data.public);
        } else {
          setIsReadOnly(!data.public);
        }
        setSessionLoading(false);
      },
      (err) => {
        console.warn("Session snapshot error:", err);
        setSessionLoading(false);
      }
    );
    return () => unsub();
  }, [sessionId, firestore, user]);

  // ─── All sessions list for sidebar ─────────────────────────────────────────
  useEffect(() => {
    if (!user || !firestore) return;
    const q = query(collection(firestore, "ai_chats"), orderBy("updatedAt", "desc"), limit(40));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAllSessions(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Session))
            .filter((s) => s.members?.includes(user.uid) || s.ownerId === user.uid)
        );
      },
      (err) => console.warn("All sessions snapshot error:", err)
    );
    return () => unsub();
  }, [user, firestore]);

  // ─── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      const vp = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (vp) vp.scrollTop = vp.scrollHeight;
    }
  }, [messages, loading]);

  // ─── Speech Recognition Setup ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => setVoiceState("listening");
    rec.onend = () => setVoiceState("idle");
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
        setTimeout(() => handleVoiceSubmit(final), 300);
      }
    };
    recognitionRef.current = rec;
  }, []);

  const handleVoiceSubmit = async (text: string) => {
    if (!text.trim()) return;
    setVoiceTranscript("");
    setVoiceState("idle");
    await sendMessage(text);
  };

  // ─── Create New Session ─────────────────────────────────────────────────────
  const createNewSession = useCallback(
    async (mode: "standard" | "temp" | "group" = "standard") => {
      if (!user) {
        // Fallback to guest ephemeral session
        const guestId = `guest_${Date.now()}`;
        router.push(`/ai-chat/${guestId}`);
        return;
      }
      if (!firestore) return;

      const docRef = doc(collection(firestore, "ai_chats"));
      const isTemp = mode === "temp";
      const title = isTemp ? "Ghost Session" : mode === "group" ? "Group AI Workspace" : "New Chat Session";

      try {
        await setDoc(docRef, {
          title,
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
        // Fallback to local guest route if Firestore fails
        const guestId = `guest_${Date.now()}`;
        router.push(`/ai-chat/${guestId}`);
      }
    },
    [user, firestore, router]
  );

  // ─── Save Title ────────────────────────────────────────────────────────────
  const handleSaveTitle = async () => {
    if (!sessionId || !editedTitle.trim()) return;
    if (firestore && !sessionId.startsWith("guest_")) {
      await updateDoc(doc(firestore, "ai_chats", sessionId), {
        title: editedTitle.trim(),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
    setSession((prev) => (prev ? { ...prev, title: editedTitle.trim() } : prev));
    setIsEditingTitle(false);
    toast({ title: "Session title updated" });
  };

  // ─── Convert Temp to Saved ──────────────────────────────────────────────────
  const handleConvertTempToSaved = async () => {
    if (!sessionId) return;
    if (firestore && !sessionId.startsWith("guest_")) {
      await updateDoc(doc(firestore, "ai_chats", sessionId), {
        temporary: false,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
    setSession((prev) => (prev ? { ...prev, temporary: false } : prev));
    toast({ title: "Chat saved permanently!" });
  };

  // ─── Invite Member to Group ────────────────────────────────────────────────
  const handleInviteMember = async () => {
    if (!sessionId || !inviteUid.trim()) return;
    setInviting(true);
    try {
      if (firestore && !sessionId.startsWith("guest_")) {
        await updateDoc(doc(firestore, "ai_chats", sessionId), {
          members: arrayUnion(inviteUid.trim()),
          isGroup: true,
          updatedAt: serverTimestamp(),
        });
      }
      toast({ title: "Member invited to session!" });
      setInviteUid("");
      setInviteModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to invite member", description: err.message });
    } finally {
      setInviting(false);
    }
  };

  // ─── PDF Upload Handling ───────────────────────────────────────────────────
  const handlePDFUpload = async (file: File) => {
    setParsingPDF(true);
    toast({ title: "Reading PDF document..." });
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      const res = await fetch("/api/ai-chat/parse-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAttachedPDF({
        name: file.name,
        numPages: data.numPages,
        text: data.text,
        sizeKb: (file.size / 1024).toFixed(1),
      });
      toast({ title: `Attached PDF: ${file.name} (${data.numPages} pages)` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to read PDF", description: err.message });
    } finally {
      setParsingPDF(false);
    }
  };

  // ─── Core Send Message ──────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if ((!text.trim() && !attachedPDF) || loading || isReadOnly) return;

    let fullPrompt = text.trim();
    if (attachedPDF) {
      fullPrompt = `[ATTACHED PDF: ${attachedPDF.name} (${attachedPDF.numPages} pages)]\nContent:\n${attachedPDF.text.substring(0, 7000)}\n\nUser Question:\n${fullPrompt || "Please analyze this PDF document."}`;
      setAttachedPDF(null);
    }

    const personaObj = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];

    const userMsg: Message = {
      role: "user",
      content: text || `Uploaded ${attachedPDF?.name || "PDF Document"}`,
      senderUid: user?.uid || "guest",
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

    // Save user message to Firestore immediately so refresh preserves history
    if (user && firestore && sessionId && !sessionId.startsWith("guest_")) {
      await updateDoc(doc(firestore, "ai_chats", sessionId), {
        messages: newMessages,
        title: session?.title === "New Chat Session" || session?.title === "New Chat" ? fullPrompt.substring(0, 40) : session?.title,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }

    const addThought = (step: Omit<ThoughtStep, "id" | "timestamp">) => {
      setThoughtSteps((prev) => [...prev, { ...step, id: Math.random().toString(36), timestamp: Date.now() }]);
    };

    addThought({ type: "thinking", label: "Processing message..." });

    try {
      const history = messages.map((m) => ({
        role: m.role as any,
        content: [{ text: m.content }],
      }));

      addThought({ type: "tool_call", label: `${personaObj.name} is thinking`, detail: `"${fullPrompt.substring(0, 80)}..."` });

      const response = await chatWithXakAI({
        message: fullPrompt,
        history,
        userId: user?.uid,
      });

      addThought({ type: "complete", label: "Response ready" });

      if (response.response.includes("Navigating to") || response.response.includes("Clicking element")) {
        setAgentActive(true);
        addThought({ type: "action", label: "Executing Xakteir action", detail: response.response });
      }

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

      if (autoSpeak || voiceOpen) {
        const clean = displayContent.replace(/```[\s\S]*?```/g, "[code]").replace(/[*_#`|]/g, "");
        setVoiceState("speaking");
        const utt = new SpeechSynthesisUtterance(clean.substring(0, 600));
        utt.onend = () => {
          setVoiceState("idle");
          setSpeakingIndex(null);
        };
        window.speechSynthesis.speak(utt);
        setSpeakingIndex(finalMessages.length - 1);
      }

      // Persist if authenticated session
      if (user && firestore && sessionId && !sessionId.startsWith("guest_")) {
        await updateDoc(doc(firestore, "ai_chats", sessionId), {
          messages: finalMessages,
          title: session?.title === "New Chat Session" || session?.title === "New Chat" ? fullPrompt.substring(0, 40) : session?.title,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    } catch (err: any) {
      addThought({ type: "tool_result", label: "Error", detail: String(err) });
      toast({ variant: "destructive", title: "Xak AI Error", description: err.message || "Failed to generate response." });
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
    toast({ title: "Generating styled PDF document..." });
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
      a.href = url;
      a.download = `xak-ai-${session?.title?.replace(/\s+/g, "-") || "transcript"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF export completed!" });
    } catch {
      toast({ variant: "destructive", title: "PDF export failed" });
    }
  };

  // ─── Share Link Toggle ─────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!session || !sessionId) return;
    const nextPublicState = !session.public;
    if (firestore && !sessionId.startsWith("guest_")) {
      await updateDoc(doc(firestore, "ai_chats", sessionId), { public: nextPublicState }).catch(() => {});
    }
    setSession((prev) => (prev ? { ...prev, public: nextPublicState } : prev));
    if (nextPublicState) {
      const shareUrl = `${window.location.origin}/ai-chat/${sessionId}`;
      await copyToClipboard(shareUrl);
      toast({ title: "🔗 Public link copied to clipboard!" });
    } else {
      toast({ title: "Chat session set to private" });
    }
  };

  // ─── Voice controls ────────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (voiceOpen) {
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
      setVoiceOpen(false);
      setVoiceState("idle");
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

  // ─── Sidebar Content ───────────────────────────────────────────────────────
  const filteredSessionsList = allSessions.filter(
    (s) => !sidebarSearch || s.title?.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#070514]/95 backdrop-blur-3xl">
      <div className="p-3 space-y-1.5 border-b border-white/10 shrink-0">
        <button
          onClick={() => createNewSession("standard")}
          className="w-full h-9 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary border border-primary/25 font-black uppercase text-xs tracking-wider flex items-center gap-2 px-3 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> New Chat
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => createNewSession("group")}
            className="h-8 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
          >
            <Users className="w-3 h-3" /> Group AI
          </button>
          <button
            onClick={() => createNewSession("temp")}
            className="h-8 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
          >
            <Ghost className="w-3 h-3" /> Temp Chat
          </button>
        </div>

        <div className="relative pt-1">
          <Search className="w-3 h-3 absolute left-2.5 top-3.5 text-white/30" />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full h-7 pl-7 pr-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {!user ? (
          <div className="py-8 text-center px-3">
            <Lock className="w-4 h-4 mx-auto mb-2 text-white/20" />
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Guest Mode</p>
            <p className="text-[9px] text-white/20">Sign in to save chat history permanently across devices.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="px-2 py-1.5 text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center justify-between">
              <span>History</span>
              <span className="font-mono text-white/20">{filteredSessionsList.length}</span>
            </p>
            {filteredSessionsList.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/ai-chat/${s.id}`)}
                className={cn(
                  "w-full px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between group/item text-[11px]",
                  sessionId === s.id
                    ? "bg-primary/15 text-white border border-primary/20 shadow-md shadow-primary/10"
                    : "hover:bg-white/5 text-white/50 hover:text-white"
                )}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (firestore) deleteDocumentNonBlocking(doc(firestore, "ai_chats", s.id));
                    if (sessionId === s.id) router.push("/ai-chat");
                  }}
                  className="opacity-0 group-hover/item:opacity-40 hover:!opacity-100 p-1 rounded hover:bg-rose-500/20 text-rose-400 shrink-0"
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
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#05030d] text-white/40 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-mono">Loading Xak AI session...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex overflow-hidden text-white bg-[#05030d] relative">
      {/* Voice Mode Overlay */}
      <VoiceModeOverlay
        isOpen={voiceOpen}
        onClose={toggleVoice}
        state={voiceState}
        transcript={voiceTranscript}
        onMute={handleMute}
        isMuted={voiceMuted}
      />

      {/* Invite Member Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="bg-[#0b081c] border-white/10 text-white rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-white">
              <UserPlus className="w-5 h-5 text-blue-400" /> Invite Friend to Group AI
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Add friends to this session so everyone can chat with Xak AI together in real time.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-xs font-bold text-white/60">User ID / Username</label>
            <Input
              value={inviteUid}
              onChange={(e) => setInviteUid(e.target.value)}
              placeholder="Paste Firebase User UID..."
              className="bg-white/5 border-white/10 text-xs rounded-xl text-white placeholder:text-white/20"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={inviting || !inviteUid.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Invite Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Thought Sidebar */}
      <AnimatePresence>
        {showThoughts && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 shadow-2xl"
          >
            <AgentThoughtSidebar steps={thoughtSteps} isThinking={loading} onClose={() => setShowThoughts(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-3xl transition-all duration-300 shrink-0",
          showSidebar ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        {/* ── STREAMLINED UNCROWDED HEADER ────────────────────────────────────── */}
        <header className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Mobile Navigation Drawer */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden w-8 h-8 rounded-xl border border-white/10 bg-white/5 shrink-0">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#05030d] border-white/10 p-0 w-64 text-white">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setShowSidebar((v) => !v)}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all shrink-0"
              title="Toggle Sidebar"
            >
              <ChevronRight className={cn("w-4 h-4 transition-transform", showSidebar && "rotate-180")} />
            </button>

            {/* Session Title & Badge */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Bot className="w-4 h-4 text-primary shrink-0" />
              {isEditingTitle ? (
                <div className="flex items-center gap-1 min-w-0">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                    className="h-7 text-xs bg-white/10 border-white/20 text-white rounded-lg px-2"
                    autoFocus
                  />
                  <button onClick={handleSaveTitle} className="p-1 text-emerald-400 hover:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0 group/title">
                  <span
                    onClick={() => setIsEditingTitle(true)}
                    className="font-black uppercase italic tracking-tight text-sm md:text-base truncate cursor-pointer hover:text-primary transition-colors"
                  >
                    {session?.title || "Xak AI Chat"}
                  </span>
                  <button onClick={() => setIsEditingTitle(true)} className="opacity-0 group-hover/title:opacity-60 hover:!opacity-100 p-0.5 text-white/40">
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Single Clean Badge */}
              {session?.temporary ? (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[9px] font-black uppercase tracking-widest shrink-0 flex items-center gap-1">
                  <Ghost className="w-3 h-3" /> Temp
                </Badge>
              ) : session?.public ? (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] font-black uppercase tracking-widest shrink-0 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Public
                </Badge>
              ) : session?.isGroup ? (
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[9px] font-black uppercase tracking-widest shrink-0 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Group ({session.members?.length || 1})
                </Badge>
              ) : null}
            </div>
          </div>

          {/* Clean Right Controls (Persona + Share + Tools Dropdown Menu) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Persona Switcher */}
            <PersonaSwitcher activePersona={persona} onChange={setPersona} />

            {/* Quick Share Link */}
            {session && (
              <button
                onClick={handleShare}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                  session.public
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{session.public ? "Shared" : "Share"}</span>
              </button>
            )}

            {/* ── UNCROWDED TOOLS DROPDOWN MENU ────────────────────────────────── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                  title="Tools & Actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0e0a24] border-white/10 text-white w-52 rounded-2xl p-1.5 shadow-2xl">
                <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-white/30 px-2 py-1">
                  Session Tools
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />

                <DropdownMenuItem
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-xl px-2 py-2 hover:bg-white/5 text-white/80 hover:text-white"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export to PDF</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setInviteModalOpen(true)}
                  className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-xl px-2 py-2 hover:bg-white/5 text-white/80 hover:text-white"
                >
                  <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Invite to Group AI</span>
                </DropdownMenuItem>

                {session?.temporary && (
                  <DropdownMenuItem
                    onClick={handleConvertTempToSaved}
                    className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-xl px-2 py-2 hover:bg-purple-500/10 text-purple-300"
                  >
                    <Save className="w-3.5 h-3.5 text-purple-400" />
                    <span>Save Chat Permanently</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-white/10" />

                <DropdownMenuItem
                  onClick={toggleVoice}
                  className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-xl px-2 py-2 hover:bg-white/5 text-white/80 hover:text-white"
                >
                  <Mic className="w-3.5 h-3.5 text-violet-400" />
                  <span>{voiceOpen ? "Close Voice Mode" : "Open Voice Assistant"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setAutoSpeak((v) => !v)}
                  className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-xl px-2 py-2 hover:bg-white/5 text-white/80 hover:text-white"
                >
                  {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-white/40" />}
                  <span>{autoSpeak ? "Auto-speak: On" : "Auto-speak: Off"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Agent control banner */}
        <AgentControlBanner isActive={agentActive && !showThoughts} onViewThoughts={() => setShowThoughts(true)} />

        {/* Read-only banner */}
        {isReadOnly && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <p className="text-amber-400 text-xs font-bold">Viewing shared public session (read only)</p>
            </div>
            {user && (
              <Button onClick={() => createNewSession("standard")} size="sm" className="h-7 text-[10px] bg-amber-500 text-black font-bold uppercase">
                Copy to My Sessions
              </Button>
            )}
          </div>
        )}

        {/* Messages Scroll Area */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 pb-6">
            {/* Welcome placeholder */}
            {messages.length === 0 && !loading && (
              <div className="py-16 text-center space-y-6 animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-2xl shadow-primary/20">
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Xak AI Workspace</h1>
                  <p className="text-white/40 text-sm max-w-md mx-auto">
                    {PERSONAS.find((p) => p.id === persona)?.tagline || "Your personal AI agent — chat, code, analyze PDFs, and control Xakteir."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
                  {[
                    "Build me an interactive web app",
                    "Analyze uploaded PDF document",
                    "Draft an email to my client",
                    "Explain quantum computing simply",
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setInput(p);
                        textareaRef.current?.focus();
                      }}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-left text-white/60 hover:border-primary/40 hover:bg-primary/10 hover:text-white transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages List */}
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex gap-3.5", isUser && "flex-row-reverse")}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-1 shadow-md",
                      isUser ? "bg-white/10 border-white/20" : "bg-primary/20 border-primary/30"
                    )}
                  >
                    {isUser ? (
                      msg.senderPhoto ? (
                        <img src={msg.senderPhoto} alt="" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-white/60" />
                      )
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-5 py-4 border relative group/bubble shadow-xl",
                      isUser
                        ? "bg-primary/10 border-primary/20 rounded-tr-sm"
                        : "bg-white/[0.04] border-white/10 rounded-tl-sm"
                    )}
                  >
                    {/* Sender Name tag in Group Chats */}
                    {isUser && msg.senderName && (
                      <div className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">
                        {msg.senderName}
                      </div>
                    )}

                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="AI generated" className="rounded-xl mb-3 max-w-full border border-white/10" />
                    )}

                    <FormattedContent content={msg.content} />

                    {/* Email Draft Card */}
                    {msg.emailDraft && !dismissedDrafts.has(i) && (
                      <EmailDraftCard draft={msg.emailDraft} onDismiss={() => setDismissedDrafts((prev) => new Set([...prev, i]))} />
                    )}

                    {/* Quick message hover actions */}
                    {!isUser && (
                      <div className="absolute -top-7 right-0 opacity-0 group-hover/bubble:opacity-100 flex items-center gap-1 transition-all bg-[#0a0814] border border-white/10 rounded-lg px-2 py-1 shadow-xl z-10">
                        <button
                          onClick={() => {
                            const clean = msg.content.replace(/```[\s\S]*?```/g, "[code]").replace(/[*_#`|]/g, "");
                            if (speakingIndex === i) {
                              window.speechSynthesis.cancel();
                              setSpeakingIndex(null);
                            } else {
                              window.speechSynthesis.cancel();
                              const utt = new SpeechSynthesisUtterance(clean.substring(0, 600));
                              utt.onend = () => setSpeakingIndex(null);
                              window.speechSynthesis.speak(utt);
                              setSpeakingIndex(i);
                            }
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-white transition-colors"
                          title="Read Aloud"
                        >
                          {speakingIndex === i ? <VolumeX className="w-3.5 h-3.5 text-primary" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => copyToClipboard(msg.content)}
                          className="w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-white transition-colors"
                          title="Copy text"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3.5 animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Bar */}
        {!isReadOnly && (
          <div className="border-t border-white/10 bg-[#05030d]/90 backdrop-blur-2xl px-4 py-3.5">
            <input
              id="pdf-upload-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePDFUpload(f);
              }}
            />

            {/* Attached PDF Preview Chip */}
            {attachedPDF && (
              <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-xs text-indigo-300 animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-bold truncate">{attachedPDF.name}</span>
                  <span className="text-[10px] opacity-60 font-mono">
                    ({attachedPDF.numPages} pages, {attachedPDF.sizeKb} KB)
                  </span>
                </div>
                <button onClick={() => setAttachedPDF(null)} className="p-1 text-white/40 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex items-end gap-2.5 max-w-3xl mx-auto">
              {/* PDF Attachment button */}
              {/* 30-Suite Feature Shortcut Buttons */}
              <button
                type="button"
                onClick={() => setEcoModalOpen(true)}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all mb-0.5"
                title="Deep Ecosystem Integrations (XakDrive, Notes, Mail, Calendar)"
              >
                <HardDrive className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setPromptModalOpen(true)}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all mb-0.5"
                title="100+ Smart AI Prompt Library"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setGhostModalOpen(true)}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all mb-0.5"
                title="Ghost Encrypted Session Vault"
              >
                <Ghost className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setMemoryModalOpen(true)}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all mb-0.5"
                title="Xak AI Context Memory Vault"
              >
                <Brain className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all mb-0.5"
                title="Command Palette (Ctrl+K)"
              >
                <Terminal className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => (document.getElementById("pdf-upload-input") as HTMLInputElement)?.click()}
                disabled={parsingPDF}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all mb-0.5"
                title="Attach PDF Document"
              >
                {parsingPDF ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Paperclip className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  id="ai-chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={`Message ${PERSONAS.find((p) => p.id === persona)?.name || "Xak AI"}… (Ctrl+K for Command Palette)`}
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-white/10 focus-visible:border-primary/40 bg-white/5 px-4 py-3.5 text-sm placeholder:text-white/20 text-white focus-visible:ring-0 min-h-[48px] max-h-40 leading-relaxed transition-all"
                  style={{ fieldSizing: "content" } as any}
                />

                {/* Mic inside input */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={cn(
                    "absolute right-3 bottom-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                    voiceOpen ? "bg-violet-500 text-white shadow-lg" : "text-white/30 hover:text-white"
                  )}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* Send button */}
              <button
                type="submit"
                disabled={loading || (!input.trim() && !attachedPDF)}
                className="w-10 h-10 shrink-0 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all active:scale-95 shadow-xl shadow-primary/30 flex items-center justify-center disabled:opacity-30 mb-0.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-center text-[10px] text-white/20 mt-2 max-w-3xl mx-auto">
              Xak AI 30-Feature Supercharged Suite active. Press Ctrl+K for Command Palette.
            </p>
          </div>
        )}
      </main>

      {/* Render 30-Suite Modals & Floating PiP Assistant */}
      <EcosystemIntegrationsModal open={ecoModalOpen} onOpenChange={setEcoModalOpen} />
      <PluginBuilderModal open={pluginModalOpen} onOpenChange={setPluginModalOpen} />
      <CustomPersonasStudioModal open={personaModalOpen} onOpenChange={setPersonaModalOpen} />
      <GhostSessionVaultModal open={ghostModalOpen} onOpenChange={setGhostModalOpen} />
      <PromptLibraryModal
        open={promptModalOpen}
        onOpenChange={setPromptModalOpen}
        onSelectPrompt={(pText) => setInput((prev) => (prev ? `${prev}\n${pText}` : pText))}
      />
      <ContextMemoryVaultModal open={memoryModalOpen} onOpenChange={setMemoryModalOpen} />
      <CommandPaletteModal
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onTriggerAction={(actionId) => {
          if (actionId === "voice_mode") setVoiceOpen(true);
          if (actionId === "sandbox") setInput((prev) => `${prev}\n\`\`\`sandbox\n\`\`\``);
          if (actionId === "ghost_vault") setGhostModalOpen(true);
          if (actionId === "ecosystem_sync") setEcoModalOpen(true);
          if (actionId === "prompt_library") setPromptModalOpen(true);
        }}
      />
      <FloatingPiPAssistant />
    </div>
  );
}


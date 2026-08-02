"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  User, 
  Sparkles, 
  Loader2, 
  Bot, 
  Plus, 
  MessageSquare,
  History,
  MoreVertical,
  Lock,
  Trash2,
  Copy,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Cpu,
  UserCircle,
  Paperclip,
  ImagePlus,
  Bug,
  Globe,
  Calculator,
  Network,
  PenTool,
  Languages,
  BarChart,
  Link2,
  GraduationCap,
  Briefcase,
  Smile,
  AlignLeft,
  CheckSquare,
  HelpCircle,
  Code2,
  Search,
  Mail,
  Calendar,
  Scan,
  PhoneCall,
  Brain,
  Library,
  Lightbulb,
  Sliders,
  Shield,
  Download,
  TerminalSquare,
  Settings
} from "lucide-react";
import { chatWithXakAI } from "@/ai/flows/xak-ai-chat-assistant-flow";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";
import { 
  IframeSandbox, 
  ProceduralVideoPlayer, 
  ThreeViewer, 
  MultiFileExplorer, 
  RpgConsole, 
  InteractiveSpreadsheet,
  IpcFileOpRunner,
  IpcTerminalRunner,
  ThreeDViewer
} from "./chat-widgets";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

function FormattedContent({ 
  content, 
  onSelectChoice 
}: { 
  content: string; 
  onSelectChoice?: (choice: string) => void;
}) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (text: string, id: number) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      toast({ title: "Copied" });
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Your browser may not support clipboard operations.' });
    }
  };

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match?.[1] || "code";
          const code = match?.[2] || "";

          // Render custom configurations if parsed successfully
          if (lang === "video-config") {
            try {
              const cfg = JSON.parse(code.trim());
              return <ProceduralVideoPlayer key={i} config={cfg} />;
            } catch (e) { console.error(e); }
          }
          if (lang === "3d-config") {
            try {
              const cfg = JSON.parse(code.trim());
              return <ThreeViewer key={i} config={cfg} />;
            } catch (e) { console.error(e); }
          }
          if (lang === "multi-file") {
            try {
              const cfg = JSON.parse(code.trim());
              return <MultiFileExplorer key={i} files={cfg.files} />;
            } catch (e) { console.error(e); }
          }
          if (lang === "rpg-config") {
            try {
              const cfg = JSON.parse(code.trim());
              return <RpgConsole key={i} config={cfg} onSelectChoice={onSelectChoice || (() => {})} />;
            } catch (e) { console.error(e); }
          }
          if (lang === "html") {
            return <IframeSandbox key={i} code={code} />;
          }
          if (lang === "ipc-file-op") {
            try {
              const cfg = JSON.parse(code.trim());
              return <IpcFileOpRunner key={i} config={cfg} />;
            } catch (e) { console.error(e); }
          }
          if (lang === "ipc-terminal-op") {
            try {
              const cfg = JSON.parse(code.trim());
              return <IpcTerminalRunner key={i} config={cfg} />;
            } catch (e) { console.error(e); }
          }
          if (lang === "3d-model") {
            try {
              const cfg = JSON.parse(code.trim());
              return <ThreeDViewer key={i} data={cfg} />;
            } catch (e) { console.error(e); }
          }

          return (
            <div key={i} className="my-6 rounded-2xl overflow-hidden border-2 border-white/10 bg-zinc-950 shadow-2xl group/code">
              <div className="flex items-center justify-between px-6 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{lang}</span>
                <button 
                  onClick={() => handleCopy(code, i)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  {copiedId === i ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedId === i ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="p-6 overflow-x-auto custom-scrollbar">
                <pre className="font-mono text-sm text-sky-400 leading-relaxed whitespace-pre">
                  {code.trim()}
                </pre>
              </div>
            </div>
          );
        }

        // Parse markdown table in normal text parts
        const lines = part.split("\n");
        const tableStartIndex = lines.findIndex(l => l.trim().startsWith("|"));
        if (tableStartIndex !== -1) {
          const tableLines: string[] = [];
          let idx = tableStartIndex;
          while (idx < lines.length && lines[idx].trim().startsWith("|")) {
            tableLines.push(lines[idx]);
            idx++;
          }
          if (tableLines.length >= 3) {
            const headers = tableLines[0].split("|").map(h => h.trim()).filter(Boolean);
            const rows = tableLines.slice(2).map(line => {
              return line.split("|").map(c => c.trim()).filter((_, colIdx) => colIdx > 0 && colIdx <= headers.length);
            });

            const beforeText = lines.slice(0, tableStartIndex).join("\n");
            const afterText = lines.slice(idx).join("\n");

            return (
              <div key={i} className="space-y-4">
                {beforeText.trim() && <div className="whitespace-pre-wrap leading-relaxed">{beforeText}</div>}
                <InteractiveSpreadsheet initialTable={{ headers, rows }} />
                {afterText.trim() && <div className="whitespace-pre-wrap leading-relaxed">{afterText}</div>}
              </div>
            );
          }
        }

        return <div key={i} className="whitespace-pre-wrap leading-relaxed">{part}</div>;
      })}
    </div>
  );
}

export default function XakAIPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [isGlowActive, setIsGlowActive] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Settings
  const [hotword, setHotword] = useState("hey xak");
  const [alwaysOn, setAlwaysOn] = useState(true); // Default to true so it works out of the box
  const alwaysOnRef = useRef(alwaysOn);
  alwaysOnRef.current = alwaysOn;
  const hotwordRef = useRef(hotword);
  hotwordRef.current = hotword;
  const isGlowActiveRef = useRef(isGlowActive);
  isGlowActiveRef.current = isGlowActive;

  useEffect(() => { 

    
    // Listen for Electron global shortcut
    if (typeof window !== 'undefined' && (window as any).electron) {
      (window as any).electron.onTriggerXakAI(() => {
        const inputEl = document.getElementById('ai-chat-input');
        if (inputEl) inputEl.focus();
        if (!recognitionRef.current) return;
        recognitionRef.current.start();
      });
      
      (window as any).electron.onTriggerXakAIWithCommand((command: string) => {
        if (command && command.trim().length > 0) {
          setInput(command);
          setTimeout(() => {
            const submitBtn = document.querySelector('form button[type="submit"]') as HTMLButtonElement | null;
            if (submitBtn) submitBtn.click();
          }, 300);
        }
      });
    }

    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      
      rec.onstart = () => setIsListening(true);
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setInput(prev => (prev && !prev.endsWith(' ') ? prev + " " : "") + (finalTranscript || interimTranscript));
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({ title: "Speech Recognition not supported in this browser" });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSpeak = (text: string, index: number) => {
    if (typeof window === "undefined") return;
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    } else {
      window.speechSynthesis.cancel();
      // clean markdown formatting for pronunciation
      const cleanText = text
        .replace(/```[\s\S]*?```/g, "[code block]")
        .replace(/[*_#`|]/g, " ")
        .substring(0, 400);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setSpeakingIndex(null);
      utterance.onerror = () => setSpeakingIndex(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingIndex(index);
    }
  };

  const handleSelectChoice = (choiceText: string) => {
    setInput(choiceText);
    setTimeout(() => {
      const submitBtn = document.querySelector('form button[type="submit"]') as HTMLButtonElement | null;
      if (submitBtn) submitBtn.click();
    }, 150);
  };

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "xak_ai_sessions"), orderBy("updatedAt", "desc"), limit(20));
  }, [firestore, user]);

  const { data: sessions } = useCollection(sessionsQuery);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (activeSessionId && sessions) {
      const session = sessions.find(s => s.id === activeSessionId);
      if (session) setMessages(session.messages || []);
    } else if (!activeSessionId) {
      setMessages([]);
    }
  }, [activeSessionId, sessions]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    if (typeof window !== "undefined" && (window as any).electron) {
      (window as any).electron.setListeningState(false);
    }

    const userMessage = input;
    const currentMessages = [...messages, { role: 'user' as const, content: userMessage }];
    
    // Format history for Genkit
    const history = messages.map(m => ({
      role: m.role as any,
      content: [{ text: m.content }]
    }));

    setInput("");
    setMessages(currentMessages);
    setLoading(true);

    try {
      const response = await chatWithXakAI({ 
        message: userMessage,
        history,
        userId: user?.uid 
      });
      const aiResponse = response.response;
      const finalMessages = [...currentMessages, { role: 'model' as const, content: aiResponse }];
      setMessages(finalMessages);

      if (user && firestore) {
        if (!activeSessionId) {
          addDocumentNonBlocking(collection(firestore, "users", user.uid, "xak_ai_sessions"), {
            title: userMessage.substring(0, 30),
            messages: finalMessages,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          }).then(docRef => {
            if (docRef) setActiveSessionId(docRef.id);
          });
        } else {
          updateDoc(doc(firestore, "users", user.uid, "xak_ai_sessions", activeSessionId), {
            messages: finalMessages,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) { 
      toast({ variant: "destructive", title: "Error", description: "Xak AI is having trouble right now." }); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!firestore || !user) return;
    deleteDocumentNonBlocking(doc(firestore, "users", user.uid, "xak_ai_sessions", id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
    toast({ title: "Session Deleted" });
  };



  return (
    <>
      {isGlowActive && (
        <div className="pointer-events-none fixed inset-0 z-50 border-[12px] border-blue-500 shadow-[inset_0_0_150px_rgba(59,130,246,0.8)] animate-pulse rounded-xl" />
      )}
      <div className="h-[calc(100vh-80px)] flex overflow-hidden animate-fade-in text-white relative">
        <aside className={cn(
        "hidden lg:flex w-72 border-r border-white/10 bg-black/40 backdrop-blur-3xl flex-col z-20",
        !user && "opacity-50 pointer-events-none grayscale"
      )}>
        <div className="p-6">
           <Button 
            onClick={() => setActiveSessionId(null)} 
            disabled={!user}
            className="w-full h-12 bg-white/5 hover:bg-white/10 text-white border-2 border-white/10 rounded-xl font-bold flex items-center justify-start px-5 gap-3 shadow-xl transition-all"
           >
              <Plus className="w-4 h-4" /> New Session
           </Button>
        </div>
        
        <ScrollArea className="flex-1 px-4 py-2">
           <div className="space-y-1">
              <h3 className="px-4 text-[9px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <History className="w-3 h-3" /> Chat History
              </h3>
              {!user ? (
                <div className="px-4 py-10 text-center space-y-4">
                  <Lock className="w-6 h-6 mx-auto opacity-20" />
                  <p className="text-[10px] font-bold text-white/30 uppercase leading-relaxed">Sign in to save your history.</p>
                </div>
              ) : (
                sessions?.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setActiveSessionId(s.id)} 
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-left transition-all flex items-center justify-between group",
                      activeSessionId === s.id ? "bg-primary/20 text-white border border-primary/20" : "hover:bg-white/5 text-white/60"
                    )}
                  >
                     <div className="flex items-center gap-3 truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-40" />
                        <span className="text-[10px] font-bold truncate block uppercase tracking-wider">{s.title || "Untitled"}</span>
                     </div>
                     <button 
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-1 rounded-md hover:bg-rose-500/20 text-rose-500 transition-all"
                     >
                        <Trash2 className="w-3 h-3" />
                     </button>
                  </button>
                ))
              )}
           </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col relative bg-transparent">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden w-10 h-10 bg-white/5 border border-white/10 rounded-xl">
                  <Menu className="w-4 h-4 text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#05030d] border-white/10 p-0 w-[300px] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] text-white">
                <SheetHeader className="sr-only">
                  <SheetTitle>Chat Sessions</SheetTitle>
                </SheetHeader>
                
                <div className="p-6 shrink-0">
                   <Button 
                    onClick={() => setActiveSessionId(null)} 
                    disabled={!user}
                    className="w-full h-12 bg-white/5 hover:bg-white/10 text-white border-2 border-white/10 rounded-xl font-bold flex items-center justify-start px-5 gap-3 shadow-xl transition-all"
                   >
                      <Plus className="w-4 h-4" /> New Session
                   </Button>
                </div>
                
                <ScrollArea className="flex-1 px-4 py-2">
                   <div className="space-y-1">
                      <h3 className="px-4 text-[9px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                        <History className="w-3 h-3" /> Chat History
                      </h3>
                      {!user ? (
                        <div className="px-4 py-10 text-center space-y-4">
                          <Lock className="w-6 h-6 mx-auto opacity-20" />
                          <p className="text-[10px] font-bold text-white/30 uppercase leading-relaxed">Sign in to save your history.</p>
                        </div>
                      ) : (
                        sessions?.map(s => (
                          <button 
                            key={s.id} 
                            onClick={() => setActiveSessionId(s.id)} 
                            className={cn(
                              "w-full px-4 py-3 rounded-xl text-left transition-all flex items-center justify-between group",
                              activeSessionId === s.id ? "bg-primary/20 text-white border border-primary/20" : "hover:bg-white/5 text-white/60"
                            )}
                          >
                             <div className="flex items-center gap-3 truncate">
                                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-40" />
                                <span className="text-[10px] font-bold truncate block uppercase tracking-wider">{s.title || "Untitled"}</span>
                             </div>
                          </button>
                        ))
                      )}
                   </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Bot className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-xl font-black uppercase italic tracking-tighter">Xak AI</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 mr-4">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                <Cpu className="w-3 h-3" /> GPT-4o
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                <UserCircle className="w-3 h-3" /> Coder Persona
              </button>
              <a href="/download-desktop" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/30 transition-all ml-2">
                <Download className="w-3 h-3" /> Get Desktop App
              </a>
            </div>
            {user ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-black uppercase px-3 py-1">Active</Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] font-black uppercase px-3 py-1">Guest</Badge>
            )}
            
            <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Always On</span>
              <button 
                onClick={() => setAlwaysOn(!alwaysOn)} 
                className={cn("w-10 h-5 rounded-full relative transition-colors", alwaysOn ? "bg-primary" : "bg-white/10")}
              >
                <div className={cn("w-3 h-3 bg-white rounded-full absolute top-1 transition-all", alwaysOn ? "left-6" : "left-1")} />
              </button>
              {alwaysOn && (
                <input 
                  type="text" 
                  value={hotword} 
                  onChange={(e) => setHotword(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-bold text-white w-24 outline-none focus:border-primary/50 placeholder:text-white/20 ml-2"
                  placeholder="Hotword..."
                />
              )}
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-5xl mx-auto py-12 px-6 space-y-10 pb-32">
            {messages.length === 0 && !loading && (
              <div className="py-20 text-center space-y-12 animate-in fade-in duration-700">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 border-4 border-white/10 flex items-center justify-center mx-auto shadow-2xl animate-float">
                  <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                </div>
                <h2 className="text-6xl font-black uppercase italic tracking-tighter drop-shadow-2xl">I'm Xak AI. <br/> How can I help?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                   {[
                     "Write a script for a game", 
                     "Explain how logic works", 
                     "Refactor my code", 
                     "Create a task for me"
                   ].map(p => (
                     <button key={p} onClick={() => handleSelectChoice(p)} className="p-8 rounded-[2.5rem] bg-black/40 border-2 border-white/5 text-xs font-black uppercase tracking-widest text-left hover:border-primary/40 hover:bg-primary/5 transition-all italic shadow-xl">
                       "{p}"
                     </button>
                   ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-6", msg.role === 'user' ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-2xl relative",
                  msg.role === 'user' ? "bg-white/5 border-white/10" : "bg-primary/20 border-primary/40"
                )}>
                  {msg.role === 'user' ? <User className="w-6 h-6 text-white/40" /> : <Bot className="w-6 h-6 text-primary" />}
                </div>
                <div className={cn(
                  "p-10 rounded-[3rem] text-lg font-medium leading-relaxed italic max-w-[90%] shadow-2xl border relative group/msg",
                  msg.role === 'user' ? "bg-white/5 border-white/10 rounded-tr-none" : "bg-black/60 border-white/10 rounded-tl-none"
                )}>
                   {msg.role === 'model' && (
                     <button 
                       onClick={() => handleSpeak(msg.content, i)} 
                       className="absolute top-4 right-4 opacity-0 group-hover/msg:opacity-40 hover:!opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white transition-all z-10"
                       title="Read aloud"
                     >
                       {speakingIndex === i ? <VolumeX className="w-4 h-4 text-primary" /> : <Volume2 className="w-4 h-4" />}
                     </button>
                   )}
                   <FormattedContent content={msg.content} onSelectChoice={handleSelectChoice} />
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-6 animate-in fade-in">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center shadow-2xl">
                  <Bot className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div className="p-10 rounded-[3rem] rounded-tl-none bg-black/60 border border-white/10 shadow-2xl flex items-center gap-2">
                   <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 bg-black/20 backdrop-blur-3xl border-t border-white/10 flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 px-2 max-w-5xl mx-auto w-full relative z-10">
            {[
              { icon: Paperclip, label: "Upload" },
              { icon: ImagePlus, label: "Gen Image" },
              { icon: Scan, label: "Analyze Image" },
              { icon: Bug, label: "Debug Code" },
              { icon: PhoneCall, label: "Voice Chat" },
              { icon: Brain, label: "Memory" },
              { icon: Library, label: "Prompts" },
              { icon: Lightbulb, label: "Suggestions" },
              { icon: Download, label: "Export PDF" },
              { icon: Globe, label: "Web Browse" },
              { icon: Calculator, label: "LaTeX Math" },
              { icon: Network, label: "Mermaid" },
              { icon: PenTool, label: "Creative" },
              { icon: Sliders, label: "Tone Adjust" },
              { icon: Languages, label: "Translate" },
              { icon: BarChart, label: "Data Viz" },
              { icon: Link2, label: "Agent Chain" },
              { icon: Shield, label: "Local Mode" },
              { icon: GraduationCap, label: "Learn Path" },
              { icon: Briefcase, label: "Mock Int." },
              { icon: Smile, label: "Sentiment" },
              { icon: AlignLeft, label: "Summarize" },
              { icon: CheckSquare, label: "Fact-Check" },
              { icon: HelpCircle, label: "Quiz Gen" },
              { icon: Code2, label: "Code Trans" },
              { icon: TerminalSquare, label: "Regex" },
              { icon: Search, label: "SEO Gen" },
              { icon: Mail, label: "Email Draft" },
              { icon: Calendar, label: "Daily Brief" },
            ].map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <button 
                  key={idx}
                  type="button"
                  title={tool.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all text-white/50 text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-lg"
                  onClick={() => {
                    setInput(prev => prev ? prev + ` [${tool.label}]` : `Help me with ${tool.label}: `);
                    document.getElementById('ai-chat-input')?.focus();
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tool.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group w-full">
            <Input 
              id="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={alwaysOn ? `Listening for "${hotword}"...` : "Ask Xak AI anything..."}
              className={cn(
                "h-20 w-full border-4 focus-visible:border-primary focus-visible:ring-0 rounded-full px-12 pr-40 font-bold italic text-base shadow-2xl transition-all text-white placeholder:text-white/20",
                alwaysOn ? "bg-primary/5 border-primary/20" : "bg-black/60 border-white/10"
              )}
            />
            <button 
              type="button"
              onClick={toggleListening}
              className={cn(
                "absolute right-20 top-3 h-14 w-14 rounded-full transition-all flex items-center justify-center shadow-xl active:scale-90",
                isListening ? "bg-rose-500 text-white animate-pulse" : "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white"
              )}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="absolute right-4 top-3 h-14 w-14 bg-primary hover:bg-primary/90 text-white rounded-full transition-all active:scale-90 shadow-xl flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          </form>
        </div>
      </main>
    </div>
    </>
  );
}
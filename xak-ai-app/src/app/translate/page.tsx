
"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Languages, 
  ArrowRightLeft, 
  Sparkles, 
  Loader2, 
  Copy, 
  Volume2, 
  History, 
  Mic, 
  MicOff, 
  Camera, 
  MessageSquare, 
  Heart, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  RefreshCw,
  X,
  ChevronRight,
  User,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, limit, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { translatePro } from "@/ai/flows/translation-pro-flow";

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Japanese", "Chinese", 
  "Korean", "Italian", "Portuguese", "Russian", "Arabic", "Hindi", 
  "Latin", "Pirate Speak", "Binary", "Smart Dialect"
];

type TranslateMode = 'standard' | 'camera' | 'conversation' | 'favorites';

export default function XakTranslatePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeMode, setActiveMode] = useState<TranslateMode>('standard');
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("English");
  const [to, setTo] = useState("Smart Dialect");
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Conversation State
  const [convLog, setConvLog] = useState<{ lang: string, text: string }[]>([]);

  // Favorites Query
  const favsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "favorite_translations"), orderBy("timestamp", "desc"), limit(20));
  }, [firestore, user]);
  const { data: favorites } = useCollection(favsQuery);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setText(transcript);
          setIsListening(false);
          toast({ title: "Voice Captured" });
        };
        recognitionRef.current.onend = () => setIsListening(false);
      }
    }
  }, []);

  const handleTranslate = async (overrideText?: string, targetTo?: string) => {
    const textToProc = overrideText || text;
    if (!textToProc.trim() || loading) return;
    setLoading(true);
    try {
      const response = await translatePro({ text: textToProc, fromLanguage: from, toLanguage: targetTo || to });
      if (overrideText) setConvLog(prev => [...prev, { lang: targetTo || to, text: response.translatedText }]);
      else setResult(response.translatedText);
    } catch (e) { toast({ variant: "destructive", title: "Sync Failed" }); }
    finally { setLoading(false); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch (e) { toast({ variant: "destructive", title: "Camera Denied" }); }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setIsCameraActive(false);
  };

  const captureAndTranslate = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUri = canvas.toDataURL('image/jpeg');
    setLoading(true);
    try {
      const response = await translatePro({ photoDataUri: dataUri, fromLanguage: from, toLanguage: to });
      setResult(response.translatedText);
    } catch (e) { toast({ variant: "destructive", title: "OCR Error" }); }
    finally { setLoading(false); }
  };

  const handleSpeak = (voiceText: string) => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(voiceText);
    synth.speak(utterance);
  };

  const saveToFavorites = async () => {
    if (!user || !firestore || !text || !result) return;
    try {
      await addDoc(collection(firestore, "users", user.uid, "favorite_translations"), {
        originalText: text,
        translatedText: result,
        fromLanguage: from,
        toLanguage: to,
        timestamp: serverTimestamp()
      });
      toast({ title: "Translation Favorited" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
  };

  return (
    <div className="max-w-[1600px] mx-auto py-10 animate-fade-in px-6 space-y-12 text-foreground">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 glass-card p-12 rounded-[4rem] border-white/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Languages className="w-80 h-80 -rotate-12 text-blue-400" /></div>
        <div className="relative z-10 flex items-center gap-10">
          <div className="w-20 h-20 rounded-[2.2rem] bg-blue-500/10 flex items-center justify-center border-4 border-blue-500/20 shadow-2xl">
            <Languages className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Bridge Pro</h1>
        </div>
        <nav className="flex bg-black/40 p-2 rounded-[2rem] border-4 border-white/10 relative z-10 shadow-xl overflow-x-auto max-w-full">
           {(['standard', 'camera', 'conversation', 'favorites'] as const).map(mode => (
             <button key={mode} onClick={() => { setActiveMode(mode); if(mode !== 'camera') stopCamera(); }} className={cn("px-8 h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all", activeMode === mode ? "bg-blue-600 text-white shadow-xl" : "text-muted-foreground hover:bg-white/5")}>
               {mode}
             </button>
           ))}
        </nav>
      </header>

      <div className="max-w-6xl mx-auto">
        {activeMode === 'standard' && (
          <Card className="glass-card rounded-[4rem] border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-black/20">
              <div className="p-12 space-y-10">
                <div className="flex items-center justify-between">
                  <select value={from} onChange={(e) => setFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-blue-400 outline-none">
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <Button onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()} variant="ghost" className={cn("h-12 w-12 rounded-full border-2 transition-all", isListening ? "bg-rose-500/20 border-rose-500 text-rose-500 animate-pulse" : "bg-white/5 border-white/10 text-muted-foreground")}>
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                </div>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter transmission logic..." className="w-full h-64 bg-transparent border-none text-3xl font-bold italic placeholder:text-muted-foreground/10 outline-none resize-none" />
                <Button onClick={() => handleTranslate()} disabled={loading || !text} className="w-full bg-blue-600 h-16 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-xl">
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Sparkles className="w-5 h-5 mr-3" /> Sync Bridge</>}
                </Button>
              </div>

              <div className="p-12 space-y-10 bg-blue-500/5">
                <div className="flex items-center justify-between">
                  <select value={to} onChange={(e) => setTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-blue-400 outline-none">
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <div className="flex gap-2">
                    {result && <Button onClick={saveToFavorites} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:text-rose-500"><Heart className="w-5 h-5" /></Button>}
                    <Button onClick={() => handleSpeak(result)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl"><Volume2 className="w-5 h-5" /></Button>
                  </div>
                </div>
                <div className="h-64">
                   {result ? <p className="text-3xl font-black text-white italic animate-in fade-in leading-tight">{result}</p> : <div className="h-full flex items-center justify-center opacity-10"><Zap className="w-32 h-32 text-blue-400" /></div>}
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeMode === 'camera' && (
          <div className="space-y-10 animate-in zoom-in-95">
             <Card className="glass-card rounded-[4rem] aspect-video relative overflow-hidden bg-black border-4 border-white/10 shadow-2xl">
                {isCameraActive ? (
                   <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 p-12 text-center">
                      <Camera className="w-16 h-16 text-blue-500 animate-pulse" />
                      <h3 className="text-4xl font-black uppercase italic">Smart Lens</h3>
                      <Button onClick={startCamera} className="bg-blue-600 h-20 px-16 rounded-[2rem] font-black uppercase shadow-2xl">Initialize Camera</Button>
                   </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
             </Card>
             {isCameraActive && (
                <div className="flex justify-center gap-6">
                   <Button onClick={captureAndTranslate} disabled={loading} className="h-20 px-20 bg-primary font-black text-xl shadow-2xl">
                      {loading ? <Loader2 className="animate-spin w-8 h-8" /> : "ANALYZE TEXT"}
                   </Button>
                   <Button onClick={stopCamera} variant="outline" className="h-20 w-20 rounded-[2rem] text-rose-500"><X className="w-8 h-8" /></Button>
                </div>
             )}
          </div>
        )}

        {activeMode === 'conversation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[600px] animate-in slide-in-from-bottom-8">
             <Card className="glass-card rounded-[3.5rem] p-10 border-blue-500/20 bg-blue-500/5 flex flex-col shadow-2xl">
                <ScrollArea className="flex-1 space-y-6">
                   {convLog.filter((_, i) => i % 2 === 0).map((msg, i) => (
                     <div key={i} className="p-6 bg-white/5 rounded-2xl italic font-bold">"{msg.text}"</div>
                   ))}
                </ScrollArea>
                <Button onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()} className={cn("mt-6 h-20 rounded-[2rem] font-black uppercase", isListening ? "bg-rose-600" : "bg-blue-600")}>
                   {isListening ? "Listening..." : `Speak ${from}`}
                </Button>
             </Card>
             <Card className="glass-card rounded-[3.5rem] p-10 border-primary/20 bg-primary/5 flex flex-col shadow-2xl">
                <ScrollArea className="flex-1 space-y-6">
                   {convLog.filter((_, i) => i % 2 !== 0).map((msg, i) => (
                     <div key={i} className="p-6 bg-white/5 rounded-2xl italic font-bold text-primary">"{msg.text}"</div>
                   ))}
                </ScrollArea>
                <Button onClick={() => handleTranslate(text, to)} className="mt-6 h-20 rounded-[2rem] bg-primary font-black uppercase">Translate for {to}</Button>
             </Card>
          </div>
        )}

        {activeMode === 'favorites' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in">
             {favorites?.map(fav => (
               <Card key={fav.id} className="glass-card rounded-[3rem] p-10 border-white/10 hover:border-blue-500/40 transition-all relative group">
                  <div className="space-y-6">
                     <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>{fav.fromLanguage} → {fav.toLanguage}</span>
                        <button onClick={() => deleteDoc(doc(firestore!, "users", user!.uid, "favorite_translations", fav.id))} className="text-muted-foreground hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                     </div>
                     <p className="text-2xl font-black italic text-white leading-tight">{fav.translatedText}</p>
                     <Button onClick={() => handleSpeak(fav.translatedText)} variant="ghost" className="h-10 px-4 rounded-xl border border-white/10 text-[9px] font-black uppercase">Play Audio</Button>
                  </div>
               </Card>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Video, 
  Monitor, 
  Scissors, 
  Music, 
  Type, 
  Layers, 
  ChevronLeft,
  Loader2,
  CheckCircle2, 
  Sparkles,
  Wand2,
  Save,
  Play,
  Pause,
  Plus,
  Upload,
  Radio,
  Gamepad2,
  TrendingUp,
  Activity,
  Eye,
  Clock,
  BarChart3,
  Users,
  Bot,
  Coins,
  Target,
  Trophy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage, addDocumentNonBlocking } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { serverTimestamp } from "firebase/firestore";
import { chatWithXakAI } from "@/ai/flows/xak-ai-chat-assistant-flow";
import { collection, query, where, orderBy, limit, doc, updateDoc, increment } from "firebase/firestore";

export default function XakViewStudio() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'analytics' | 'edit' | 'generate'>('analytics');
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const myVideosQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "videos"), where("authorId", "==", user.uid), orderBy("timestamp", "desc"));
  }, [firestore, user]);

  const { data: myVideos, isLoading } = useCollection(myVideosQuery);
  const storage = useStorage();

  const stats = useMemo(() => {
    if (!myVideos) return { views: 0, time: 0, reach: 0 };
    return {
      views: myVideos.reduce((acc, v) => acc + (v.views || 0), 0),
      time: myVideos.length * 4.2, // Simulated avg watch time
      reach: myVideos.reduce((acc, v) => acc + (v.likes || 0), 0) * 10
    };
  }, [myVideos]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => { stream.getTracks().forEach(track => track.stop()); };
      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "Recording Initialized" });
    } catch (err) { toast({ variant: "destructive", title: "Protocol Error" }); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !user || !firestore || !storage) return;
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const storageRef = ref(storage, `xakview/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          (err) => { setIsUploading(false); setUploadProgress(0); toast({ variant: 'destructive', title: 'Upload failed' }); reject(err); },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await addDocumentNonBlocking(collection(firestore, 'videos'), {
              title: file.name,
              authorId: user.uid,
              url,
              storagePath: uploadTask.snapshot.ref.fullPath,
              size: file.size,
              type: file.type || 'video/mp4',
              timestamp: serverTimestamp(),
            });
            resolve();
          }
        );
      });
    }
    setIsUploading(false);
    setUploadProgress(0);
    // Grant Creator Fund Reward!
    try {
      if (user && firestore) {
        await updateDoc(doc(firestore, "users", user.uid), {
          currencyBalance: increment(50)
        });
        toast({ 
          title: 'Upload Complete & Creator Fund Reward!', 
          description: '+50 XakCoins have been added to your balance. 💰',
          duration: 6000
        });
      }
    } catch (error) {
      toast({ title: 'Upload Complete' });
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim() || !user || !firestore) return;
    setIsGenerating(true);
    
    try {
      const response = await chatWithXakAI(`Generate metadata for a fictional short video based on this prompt: "${aiPrompt}". Return ONLY a raw JSON object (no markdown formatting, no backticks, just the JSON) with the following string fields: "title" (exciting title), "description" (detailed description), "category" (e.g., Tech, Education, Gaming).`);
      
      let parsed = { title: "AI Generated Video", description: "An amazing video generated by Xak AI.", category: "AI" };
      try {
        const cleanedStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanedStr);
      } catch (err) {
        console.error("AI parse error, using fallback", err);
      }

      await addDocumentNonBlocking(collection(firestore, 'videos'), {
        title: parsed.title,
        description: parsed.description,
        authorId: user.uid,
        author: user.displayName || 'AI Creator',
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        category: parsed.category,
        type: 'video/mp4',
        timestamp: serverTimestamp(),
      });

      // Grant Creator Fund Reward for AI content too
      await updateDoc(doc(firestore, "users", user.uid), {
        currencyBalance: increment(50)
      });
      
      toast({ 
        title: 'AI Generation Complete!', 
        description: 'Your AI video has been published and you earned +50 XakCoins! 💰',
      });
      setAiPrompt("");
      setActiveTab('analytics');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Generation Failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col text-foreground animate-in fade-in duration-500 overflow-hidden">
      <header className="h-20 border-b-4 border-white/10 bg-zinc-900/90 backdrop-blur-xl px-10 flex items-center justify-between z-50">
        <div className="flex items-center gap-8">
          <Link href="/xakview">
            <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-white hover:bg-white/10 border-2 border-white/5"><ChevronLeft className="w-6 h-6" /></Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1rem] bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/40"><Video className="w-7 h-7 text-white" /></div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">XakStudio</h2>
          </div>
        </div>

        <nav className="flex bg-black/40 p-1 rounded-xl border border-white/10">
           <button onClick={() => setActiveTab('analytics')} className={cn("px-8 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'analytics' ? "bg-rose-600 text-white" : "text-muted-foreground hover:bg-white/5")}>Analytics</button>
           <button onClick={() => setActiveTab('edit')} className={cn("px-8 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'edit' ? "bg-rose-600 text-white" : "text-muted-foreground hover:bg-white/5")}>Capture & Edit</button>
           <button onClick={() => setActiveTab('generate')} className={cn("px-8 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'generate' ? "bg-rose-600 text-white" : "text-muted-foreground hover:bg-white/5")}>AI Generate</button>
        </nav>

        <Badge variant="outline" className="border-rose-500/20 text-rose-400 bg-rose-500/5 text-[9px] font-black uppercase px-6 py-2">Verified Hub Creator</Badge>
      </header>

      {activeTab === 'analytics' ? (
        <ScrollArea className="flex-1 bg-zinc-950 p-12">
           <div className="max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700">
              
              {/* Weekly Challenge Banner */}
              <div className="bg-gradient-to-r from-rose-600 to-orange-500 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-4 border-white/20 gap-6 cursor-pointer hover:scale-[1.01] transition-transform" onClick={() => setActiveTab('edit')}>
                 <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                    <Trophy className="w-48 h-48 -rotate-12 text-white" />
                 </div>
                 <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border-2 border-white/30 shrink-0">
                       <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                       <h3 className="text-white text-2xl font-black uppercase italic tracking-tighter">Weekly Challenge</h3>
                       <p className="text-white/90 font-bold text-sm">Show us your coolest coding project! Upload your video to earn 100 bonus coins.</p>
                    </div>
                 </div>
                 <Button className="relative z-10 bg-white text-rose-600 hover:bg-zinc-100 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs shadow-xl">
                    Upload Entry
                 </Button>
              </div>

              <header className="space-y-4">
                 <h1 className="text-7xl font-black uppercase italic tracking-tighter text-white">Transmission Health</h1>
                 <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.6em]">Real-Time Telemetry</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 {[
                   { label: "Total Views", val: stats.views.toLocaleString(), icon: Eye, color: "text-blue-400" },
                   { label: "Watch Time (H)", val: stats.time.toFixed(1), icon: Activity, color: "text-emerald-400" },
                   { label: "Global Reach", val: stats.reach.toLocaleString(), icon: TrendingUp, color: "text-rose-500" },
                   { label: "Subscribers", val: "142", icon: Users, color: "text-amber-500" },
                 ].map(stat => (
                   <Card key={stat.label} className="glass-card rounded-[3rem] p-8 border-white/10 bg-white/5 shadow-2xl space-y-6">
                      <div className="flex items-center gap-4">
                         <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white/5", stat.color.replace('text', 'bg').concat('/10'))}>
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                         </div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                      </div>
                      <p className="text-5xl font-black italic text-white leading-none">{stat.val}</p>
                   </Card>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 <Card className="lg:col-span-8 glass-card rounded-[4rem] p-12 border-white/10 bg-black/40 space-y-10 shadow-2xl">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4"><BarChart3 className="w-8 h-8 text-rose-500" /> Retention Stats</h3>
                    <div className="h-64 w-full bg-zinc-900 rounded-[2.5rem] border-4 border-white/5 flex items-end px-12 gap-6 pb-6 relative overflow-hidden">
                       <div className="absolute inset-0 arcade-grid opacity-10" />
                       {[40, 70, 45, 90, 65, 80, 55, 95, 75, 100].map((h, i) => (
                         <div key={i} className="flex-1 bg-rose-600/20 border-t-4 border-rose-600 rounded-t-lg transition-all hover:bg-rose-600/40 cursor-pointer" style={{ height: `${h}%` }} />
                       ))}
                    </div>
                 </Card>

                 <Card className="lg:col-span-4 glass-card rounded-[4rem] border-white/10 overflow-hidden bg-rose-600/5 shadow-2xl">
                    <div className="p-10 space-y-8">
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">My Videos</h3>
                       <ScrollArea className="h-64">
                          <div className="space-y-4 pr-4">
                             {myVideos?.map(v => (
                               <div key={v.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-rose-500/40">
                                  <div className="overflow-hidden">
                                     <p className="text-xs font-black uppercase italic truncate pr-4">{v.title}</p>
                                     <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{v.views} Views</p>
                                  </div>
                                  <Badge className="bg-rose-600 text-[8px] px-2 font-black border-none">ACTIVE</Badge>
                               </div>
                             ))}
                          </div>
                       </ScrollArea>
                    </div>
                 </Card>
              </div>
           </div>
        </ScrollArea>
      ) : activeTab === 'generate' ? (
        <main className="flex-1 flex items-center justify-center bg-zinc-950 p-8">
          <div className="max-w-2xl w-full bg-black/40 p-12 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-5">
               <Bot className="w-64 h-64 -rotate-12 text-rose-500" />
             </div>
             <div className="relative z-10 space-y-8">
                <div>
                   <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                     <Wand2 className="w-8 h-8 text-rose-500" /> AI Video Generator
                   </h2>
                   <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">
                     Generate full video metadata and placeholders using Xak AI. Earn 50 Coins per creation.
                   </p>
                </div>
                <div className="space-y-4">
                   <textarea
                     value={aiPrompt}
                     onChange={(e) => setAiPrompt(e.target.value)}
                     placeholder="e.g. A thrilling podcast episode exploring the future of artificial intelligence..."
                     className="w-full h-40 bg-white/5 border-2 border-white/10 rounded-[2rem] p-6 text-sm text-white resize-none focus:outline-none focus:border-rose-500/50 transition-colors"
                   />
                   <Button 
                     onClick={handleGenerateAI}
                     disabled={isGenerating || !aiPrompt.trim()}
                     className="w-full h-16 rounded-[1.5rem] bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-lg"
                   >
                     {isGenerating ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Sparkles className="w-6 h-6 mr-2" />}
                     {isGenerating ? "Generating Concept..." : "Generate AI Video"}
                   </Button>
                </div>
             </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex bg-zinc-900 p-8 gap-8 overflow-hidden">
          <div className="flex-1 bg-black rounded-[4rem] border-8 border-zinc-800 shadow-[0_0_150px_rgba(0,0,0,0.8)] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
            <video ref={videoRef} className="w-full h-full object-contain transform scale-x-[-1]" autoPlay muted playsInline />
            
            {!isRecording && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xl z-20">
                <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-800 border-4 border-white/10 flex items-center justify-center mb-10 animate-float shadow-2xl">
                  <Monitor className="w-14 h-14 text-rose-500 opacity-40" />
                </div>
                <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">Studio Ready</h3>
                <p className="text-sm text-zinc-500 font-bold uppercase tracking-[0.5em] mb-12 italic">Hardware Acceleration: Active</p>
                <div className="flex gap-6">
                  <Button onClick={startRecording} size="lg" className="h-20 px-12 bg-rose-600 hover:bg-rose-500 text-white rounded-[1.8rem] font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 border-b-8 border-rose-800 active:border-b-0">
                     <Radio className="w-8 h-8 mr-4 animate-pulse" /> START CAPTURE
                   </Button>
                     <input ref={fileInputRef} type="file" className="hidden" multiple accept="video/*" onChange={(e) => handleFileUpload(e.target.files)} />
                     <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-20 px-12 rounded-[1.8rem] border-4 border-white/10 text-white font-black text-xl uppercase tracking-widest hover:bg-white/5 transition-all">
                       <Upload className="w-8 h-8 mr-4" /> Import Video
                     </Button>
                </div>
              </div>
            )}

              {isUploading && (
                <div className="absolute bottom-10 left-10 bg-black/60 p-4 rounded-lg z-40">
                  <div className="text-[12px] font-black uppercase">Uploading... {uploadProgress}%</div>
                </div>
              )}

            {isRecording && (
              <div className="absolute top-10 left-10 flex items-center gap-6 bg-red-600 px-8 py-4 rounded-[2rem] shadow-2xl animate-pulse z-30 border-4 border-white/20">
                <span className="w-4 h-4 bg-white rounded-full animate-ping" />
                <span className="text-xl font-black text-white uppercase italic tracking-tighter">BROADCASTING</span>
              </div>
            )}
          </div>
          
          <aside className="w-96 border-l-4 border-white/10 bg-zinc-950 p-10 flex flex-col gap-10">
             <div className="space-y-8">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] italic text-zinc-500">Edit Video</h3>
                <div className="space-y-4">
                   {['Trim Video', 'Color Balance', 'Master Audio', 'Add Segment'].map(tool => (
                     <Button key={tool} variant="outline" className="w-full h-16 rounded-3xl border-2 border-white/5 bg-zinc-800/50 hover:bg-rose-600 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all">
                        {tool}
                     </Button>
                   ))}
                </div>
             </div>
             
             <Card className="mt-auto p-10 bg-rose-600/10 border-4 border-rose-500/20 rounded-[3rem] space-y-6 shadow-2xl">
                <div className="flex items-center gap-4">
                   <Wand2 className="w-8 h-8 text-rose-500" />
                   <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Master</h4>
                </div>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">Let Xak AI synthesize your raw capture into a high-fidelity Hub broadcast.</p>
                <Button onClick={async () => {
                  if (!user) { toast({ variant: 'destructive', title: 'Sign in required' }); return; }
                  try {
                    const prompt = `Generate a short title, description, and 5 tags for a user video capture. Keep it punchy.`;
                    const res = await chatWithXakAI({ message: prompt, userId: user.uid });
                    const aiOutput = res.response;
                    toast({ title: 'AI Synthesis Complete', description: aiOutput });
                  } catch (err) {
                    toast({ variant: 'destructive', title: 'Xak AI failed' });
                  }
                }} className="w-full h-14 bg-rose-600 rounded-2xl font-black text-[10px] uppercase shadow-xl">Synthesize Transmission</Button>
             </Card>
          </aside>
        </main>
      )}
    </div>
  );
}

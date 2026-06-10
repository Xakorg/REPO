"use client";

import { useState, useEffect, useRef } from "react";
import { 
  PenTool, 
  StickyNote, 
  Type, 
  Square, 
  Plus, 
  MousePointer2, 
  X,
  Zap,
  Clock,
  CloudSun,
  Video,
  Layers,
  Sparkles,
  Loader2,
  Presentation,
  ArrowLeft,
  Copy,
  Hash,
  Users,
  ArrowRight,
  WifiOff,
  History,
  Download,
  Grid3X3,
  MessageSquare,
  Timer,
  Smile,
  Palette,
  Eraser,
  Link as LinkIcon,
  Ruler,
  Image as ImageIcon,
  MousePointerClick,
  MonitorPlay,
  Lock,
  Unlock,
  Eye,
  Map as MapIcon,
  Share2,
  Activity,
  Layout
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, onSnapshot, setDoc, collection, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type Tool = 'select' | 'draw' | 'sticky' | 'text' | 'shape' | 'widget' | 'laser' | 'connector' | 'eraser' | 'image' | 'vote' | 'measure' | 'wireframe';
type WidgetType = 'sheet' | 'video' | 'calendar' | 'weather' | 'kanban' | 'timer';

interface BoardElement {
  id: string;
  type: 'path' | 'sticky' | 'text' | 'shape' | 'widget' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  content?: string;
  points?: { x: number, y: number }[];
  widgetType?: WidgetType;
  locked?: boolean;
  layer?: number;
}

export default function WhiteboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isWidgetSheetOpen, setIsWidgetSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // New Feature States
  const [isOffline, setIsOffline] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [bgColor, setBgColor] = useState("#0a0a15");

  const canvasRef = useRef<HTMLDivElement>(null);
  const currentPathRef = useRef<BoardElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Offline detection mockup
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    }
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      toast({ title: "Timer Finished!", description: "Time is up." });
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Dashboard Query: Boards I own
  const myBoardsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "whiteboards"), where("ownerId", "==", user.uid), orderBy("lastUpdated", "desc"));
  }, [firestore, user]);

  const { data: myBoards, isLoading: loadingBoards } = useCollection(myBoardsQuery);

  // Active Board Real-time Sync
  const activeBoardRef = useMemoFirebase(() => {
    if (!firestore || !activeBoardId) return null;
    return doc(firestore, "whiteboards", activeBoardId);
  }, [firestore, activeBoardId]);

  const { data: boardData } = useDoc(activeBoardRef);

  useEffect(() => {
    if (boardData?.elements) {
      setElements(boardData.elements);
    }
  }, [boardData]);

  const handleCreateBoard = async () => {
    if (!user || !firestore || !newBoardName.trim()) return;
    setIsCreating(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newBoardRef = await addDoc(collection(firestore, "whiteboards"), {
        name: newBoardName,
        ownerId: user.uid,
        ownerName: user.displayName || "Member",
        code: code,
        elements: [],
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setActiveBoardId(newBoardRef.id);
      setNewBoardName("");
      toast({ title: "Whiteboard created", description: `Join Code: ${code}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create board." });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinBoard = async () => {
    if (!firestore || !joinCode.trim()) return;
    try {
      const q = query(collection(firestore, "whiteboards"), where("code", "==", joinCode.trim().toUpperCase()));
      const snap = await onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setActiveBoardId(snapshot.docs[0].id);
          setJoinCode("");
          toast({ title: "Joined board" });
        } else {
          toast({ variant: "destructive", title: "Board not found", description: "Invalid join code." });
        }
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not join board." });
    }
  };

  const saveBoardElements = async (newElements: BoardElement[]) => {
    if (!firestore || !activeBoardId || isOffline) return;
    const ref = doc(firestore, "whiteboards", activeBoardId);
    await setDoc(ref, { elements: newElements, lastUpdated: serverTimestamp() }, { merge: true });
  };

  // Panning
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      // Zoom
      setZoom(z => Math.max(0.1, Math.min(5, z - e.deltaY * 0.01)));
    } else {
      // Pan
      setOffset(o => ({ x: o.x - e.deltaX, y: o.y - e.deltaY }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === 'select' || !activeBoardId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    if (tool === 'draw') {
      setIsDrawing(true);
      const newPath: BoardElement = {
        id: Math.random().toString(36).substring(7),
        type: 'path',
        x, y,
        color: '#8433F3',
        points: [{ x, y }],
        layer: 1
      };
      currentPathRef.current = newPath;
      const nextElements = [...elements, newPath];
      setElements(nextElements);
    } else if (tool === 'sticky') {
      const newSticky: BoardElement = {
        id: Math.random().toString(36).substring(7),
        type: 'sticky',
        x: x - 50,
        y: y - 50,
        color: '#fef08a',
        content: '',
        layer: 2
      };
      const nextElements = [...elements, newSticky];
      setElements(nextElements);
      saveBoardElements(nextElements);
      setActiveNote(newSticky.id);
      setTool('select');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentPathRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    const updatedPath = {
      ...currentPathRef.current,
      points: [...(currentPathRef.current.points || []), { x, y }]
    };
    currentPathRef.current = updatedPath;
    setElements(prev => prev.map(el => el.id === updatedPath.id ? updatedPath : el));
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveBoardElements(elements);
    }
  };

  const addWidget = (type: WidgetType) => {
    if (!activeBoardId) return;
    const newWidget: BoardElement = {
      id: Math.random().toString(36).substring(7),
      type: 'widget',
      widgetType: type,
      x: 100 - offset.x,
      y: 100 - offset.y,
      width: 400,
      height: 300,
      layer: 3
    };
    const nextElements = [...elements, newWidget];
    setElements(nextElements);
    saveBoardElements(nextElements);
    setIsWidgetSheetOpen(false);
    toast({ title: "App added!", description: `Added ${type} to board.` });
  };

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground animate-fade-in flex flex-col items-center justify-center p-6 text-center">
         <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
         <div className="relative z-10 space-y-10 max-w-4xl">
            <Presentation className="w-24 h-24 text-primary mx-auto animate-float" />
            <h1 className="text-8xl font-black italic uppercase tracking-tighter text-white leading-none">Whiteboard</h1>
            <p className="text-xl text-muted-foreground font-bold uppercase tracking-widest max-w-2xl mx-auto italic opacity-60">Collaborative infinite canvas. Sign in to start building your ideas.</p>
            <Link href="/auth"><Button className="h-20 px-16 bg-primary text-black rounded-[2.5rem] font-black uppercase text-xl italic shadow-2xl">Get Started</Button></Link>
         </div>
      </div>
    );
  }

  // Dashboard Interface
  if (!activeBoardId) {
    return (
      <div className="max-w-7xl mx-auto py-12 animate-fade-in px-6 space-y-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 bg-card/40 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
           <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-2xl">
                 <Presentation className="w-10 h-10 text-primary" />
              </div>
              <div>
                 <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">My Boards</h1>
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-2 italic">Hub Collaboration Station</p>
              </div>
           </div>

           <div className="flex gap-4 relative z-10 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                 <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                 <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter Code..." className="h-14 bg-black/40 border-white/10 rounded-2xl pl-12 font-black uppercase text-xs" />
              </div>
              <Button onClick={handleJoinBoard} className="h-14 px-10 bg-secondary border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Join Board</Button>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <main className="lg:col-span-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="glass-card rounded-[3rem] border-4 border-dashed border-white/10 p-12 flex flex-col items-center justify-center text-center space-y-8 group hover:border-primary/40 transition-all cursor-pointer bg-black/20">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-all shadow-xl">
                       <Plus className="w-10 h-10 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="space-y-6 w-full">
                       <div><h3 className="text-2xl font-black uppercase italic text-white">Create New</h3><p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Initialize fresh canvas</p></div>
                       <Input value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Board Name..." className="bg-black/40 border-white/10 h-12 text-center font-bold italic" />
                       <Button onClick={handleCreateBoard} disabled={isCreating || !newBoardName} className="w-full bg-primary h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">
                          {isCreating ? <Loader2 className="animate-spin w-4 h-4" /> : "Deploy Board"}
                       </Button>
                    </div>
                 </Card>

                 {loadingBoards ? (
                   <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin w-10 h-10 text-primary opacity-20" /></div>
                 ) : myBoards?.map(board => (
                   <Card key={board.id} onClick={() => setActiveBoardId(board.id)} className="glass-card rounded-[3rem] border-white/10 overflow-hidden hover:border-primary/40 transition-all group cursor-pointer shadow-2xl flex flex-col bg-zinc-950/40">
                      <div className="h-40 bg-black/40 p-8 flex flex-col justify-end relative">
                         <div className="absolute inset-0 arcade-grid opacity-10" />
                         <Badge className="absolute top-6 right-6 bg-primary text-black border-none font-black text-[9px] px-3">{board.code}</Badge>
                         <h3 className="text-3xl font-black uppercase italic text-white leading-none truncate group-hover:text-primary transition-colors">{board.name}</h3>
                      </div>
                      <div className="p-8 flex justify-between items-center bg-black/20">
                         <span className="text-[9px] font-black uppercase text-muted-foreground italic">Last Edit: Just Now</span>
                         <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                      </div>
                   </Card>
                 ))}
              </div>
           </main>

           <aside className="lg:col-span-4 space-y-10">
              <Card className="glass-card rounded-[3rem] p-10 border-white/10 bg-black/40 shadow-xl space-y-8">
                 <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-primary"><Users className="w-6 h-6" /> Collaboration</h3>
                 <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">Invite friends to your boards using their unique access codes. Changes sync in real-time across the Hub.</p>
                 <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary transition-all">
                    <span className="text-[9px] font-black uppercase text-muted-foreground group-hover:text-white">Active Sessions</span>
                    <span className="text-xl font-black italic text-primary">0</span>
                 </div>
              </Card>
           </aside>
        </div>
      </div>
    );
  }

  // Editor Interface
  return (
    <div className={cn(
      "fixed inset-0 top-20 z-50 flex animate-fade-in text-foreground overflow-hidden",
      isPresentationMode && "top-0 z-[100]" // Fullscreen presentation mode
    )}
    style={{ backgroundColor: bgColor }}
    >
      {/* Top Header - Collaboration & Views */}
      <header className={cn(
        "absolute top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between z-[100] shadow-2xl transition-all",
        isPresentationMode && "translate-y-[-100%]"
      )}>
         <div className="flex items-center gap-6">
            <Button onClick={() => setActiveBoardId(null)} variant="ghost" size="icon" className="rounded-full h-10 w-10 border border-white/10 text-white"><ArrowLeft className="w-4 h-4" /></Button>
            <div className="flex flex-col">
               <h2 className="text-lg font-black uppercase italic text-white tracking-tighter leading-none">{boardData?.name || 'Untitled Board'}</h2>
               <div className="flex items-center gap-2 mt-1">
                 {isOffline ? (
                   <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.4em] flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline Mode</span>
                 ) : (
                   <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.4em] flex items-center gap-1"><Activity className="w-3 h-3" /> Real-time Sync</span>
                 )}
               </div>
            </div>
         </div>
         
         {/* Collaboration & Presentation Tools */}
         <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center bg-white/5 px-4 py-2 rounded-xl border border-white/10 gap-3">
              <Clock className={cn("w-4 h-4", timerActive ? "text-primary animate-pulse" : "text-muted-foreground")} />
              <span className="text-xs font-black font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              <button onClick={() => setTimerActive(!timerActive)} className="text-[9px] uppercase font-black text-primary hover:text-white">{timerActive ? "Pause" : "Start"}</button>
            </div>

            {/* Avatars Mock */}
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">ME</div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-emerald-500">JD</div>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/5 border-2 border-background border-dashed text-muted-foreground"><Plus className="w-3 h-3" /></Button>
            </div>

            <div className="w-px h-6 bg-white/10" />
            
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white" title="Version History"><History className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white" title="Export High-Res"><Download className="w-4 h-4" /></Button>
            <Button 
              onClick={() => setIsPresentationMode(true)} 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-white"
              title="Presentation Mode"
            ><MonitorPlay className="w-4 h-4" /></Button>

            <Button className="h-9 px-4 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-widest gap-2">
              <Share2 className="w-3 h-3" /> Share
            </Button>
         </div>
      </header>

      {/* Main Canvas Area */}
      <div 
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={cn(
          "flex-1 relative overflow-hidden",
          tool === 'draw' || tool === 'eraser' ? "cursor-crosshair" : 
          tool === 'select' ? "cursor-default" : "cursor-cell",
          gridEnabled ? "bg-[radial-gradient(#1e1e2e_2px,transparent_2px)] [background-size:40px_40px]" : ""
        )}
      >
        <div 
          className="absolute inset-0 transition-transform duration-75"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
        >
          {/* Elements */}
          {elements.map(el => (
            <div 
              key={el.id}
              className={cn("absolute", el.locked && "pointer-events-none opacity-80")}
              style={{ left: el.x, top: el.y, zIndex: el.layer || 1 }}
            >
              {el.type === 'path' && (
                <svg className="overflow-visible" style={{ position: 'absolute', left: -el.x, top: -el.y }}>
                  <polyline
                    points={el.points?.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={el.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))" }}
                  />
                </svg>
              )}

              {el.type === 'sticky' && (
                <Card 
                  className="w-48 h-48 p-4 rounded-xl shadow-2xl flex flex-col border-4 border-black/10 transition-all hover:scale-105 group relative"
                  style={{ backgroundColor: el.color }}
                >
                  <textarea 
                    autoFocus={activeNote === el.id}
                    value={el.content}
                    onBlur={() => saveBoardElements(elements)}
                    onChange={(e) => setElements(prev => prev.map(p => p.id === el.id ? { ...p, content: e.target.value } : p))}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-black/80 font-bold text-sm placeholder:text-black/30"
                    placeholder="Note..."
                  />
                  {/* Floating Action Menu for Stickies */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 rounded-xl p-1 gap-1 hidden group-hover:flex shadow-xl">
                     <button className="p-1.5 hover:bg-white/10 rounded-lg text-white"><Palette className="w-3 h-3" /></button>
                     <button className="p-1.5 hover:bg-white/10 rounded-lg text-white"><LinkIcon className="w-3 h-3" /></button>
                     <button className="p-1.5 hover:bg-white/10 rounded-lg text-rose-500"><X className="w-3 h-3" /></button>
                  </div>
                </Card>
              )}

              {el.type === 'widget' && (
                <Card 
                  className="rounded-3xl border-4 border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden bg-black/80 backdrop-blur-xl group"
                  style={{ width: el.width, height: el.height }}
                >
                  <div className="h-10 bg-white/5 border-b border-white/10 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                       <Zap className="w-3.5 h-3.5 text-primary" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{el.widgetType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white"><Lock className="w-3 h-3" /></button>
                      <button onClick={() => {
                          const next = elements.filter(i => i.id !== el.id);
                          setElements(next);
                          saveBoardElements(next);
                      }} className="opacity-0 group-hover:opacity-100 text-rose-500"><X className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
                     {el.widgetType === 'sheet' && <Layers className="w-12 h-12 mb-4" />}
                     {el.widgetType === 'video' && <Video className="w-12 h-12 mb-4" />}
                     {el.widgetType === 'calendar' && <Clock className="w-12 h-12 mb-4" />}
                     {el.widgetType === 'weather' && <CloudSun className="w-12 h-12 mb-4" />}
                     {el.widgetType === 'kanban' && <Grid3X3 className="w-12 h-12 mb-4" />}
                     <p className="text-[10px] font-black uppercase tracking-[0.4em]">Active Component</p>
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Presentation Mode Exit */}
      {isPresentationMode && (
        <Button 
          onClick={() => setIsPresentationMode(false)}
          className="absolute top-6 right-6 z-[200] bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white rounded-full px-6"
        >
          Exit Presentation
        </Button>
      )}

      {/* Minimap Mock */}
      {showMinimap && (
        <Card className="absolute bottom-32 right-6 w-48 h-32 bg-black/60 backdrop-blur-xl border-white/10 z-50 p-2 overflow-hidden shadow-2xl rounded-2xl">
           <div className="w-full h-full border border-white/5 rounded-xl relative">
              <div className="absolute inset-0 bg-primary/5" />
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-primary/50 bg-primary/10 rounded-md" />
           </div>
        </Card>
      )}

      {/* Bottom Left Toolbar - Properties & View */}
      <div className="absolute bottom-6 left-6 z-50 flex gap-2">
         <Card className="glass-card flex items-center gap-1 p-1 rounded-2xl bg-black/60 backdrop-blur-xl border-white/10">
            <Button variant="ghost" size="icon" onClick={() => setGridEnabled(!gridEnabled)} className={cn("w-10 h-10 rounded-xl", gridEnabled && "bg-white/10 text-primary")} title="Toggle Grid"><Grid3X3 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setShowMinimap(!showMinimap)} className={cn("w-10 h-10 rounded-xl", showMinimap && "bg-white/10 text-primary")} title="Minimap"><MapIcon className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:text-white" title="Layers"><Layers className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:text-white" title="Background Color"><Palette className="w-4 h-4" /></Button>
            <div className="px-3 flex items-center text-[10px] font-black text-muted-foreground">{Math.round(zoom * 100)}%</div>
         </Card>
      </div>

      {/* Main Bottom Toolbar - Tools */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Card className="glass-card rounded-[2rem] p-2 border-white/10 flex items-center gap-1 shadow-2xl px-3 bg-black/80 backdrop-blur-xl">
          {[
            { id: 'select', icon: MousePointer2, label: 'Select' },
            { id: 'draw', icon: PenTool, label: 'Pen' },
            { id: 'eraser', icon: Eraser, label: 'Eraser' },
            { id: 'sticky', icon: StickyNote, label: 'Sticky Note' },
            { id: 'text', icon: Type, label: 'Text' },
            { id: 'shape', icon: Square, label: 'Shape' },
            { id: 'connector', icon: Activity, label: 'Connector' },
            { id: 'laser', icon: MousePointerClick, label: 'Laser Pointer' },
            { id: 'image', icon: ImageIcon, label: 'Image/PDF' },
            { id: 'vote', icon: Smile, label: 'Voting Dots' },
          ].map(t => (
            <Button
              key={t.id}
              onClick={() => setTool(t.id as Tool)}
              variant="ghost"
              title={t.label}
              className={cn(
                "h-12 w-12 rounded-[1.5rem] transition-all",
                tool === t.id ? "bg-primary text-black shadow-xl scale-110" : "text-muted-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              <t.icon className={cn("w-5 h-5", tool === 'laser' && tool === t.id && "animate-pulse text-rose-500")} />
            </Button>
          ))}
          <div className="w-px h-8 bg-white/10 mx-2" />
          <Button 
            onClick={() => setIsWidgetSheetOpen(true)}
            className="h-12 px-6 rounded-[1.5rem] bg-white/5 hover:bg-white/10 border border-white/5 font-black uppercase text-[10px] tracking-widest text-white transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> More
          </Button>
        </Card>
      </div>

      {/* Cursor Chat Mockup (floating near center if active) */}
      {/* For real implementation, this tracks cursor position. We just put a mock. */}
      {false && (
         <div className="absolute top-1/2 left-1/2 translate-x-10 translate-y-10 bg-primary text-black px-4 py-2 rounded-2xl rounded-tl-none font-black text-xs shadow-xl z-50">
            Let's move this higher!
         </div>
      )}

      {/* Add App Modal */}
      {isWidgetSheetOpen && (
        <div className="absolute inset-0 z-[200] flex items-end justify-center p-10 animate-in slide-in-from-bottom-20 duration-500">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsWidgetSheetOpen(false)} />
           <Card className="w-full max-w-4xl glass-card rounded-[3.5rem] p-12 relative z-[210] border-4 border-white/10 shadow-2xl bg-zinc-950">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Whiteboard Apps & Templates</h2>
                 <Button onClick={() => setIsWidgetSheetOpen(false)} variant="ghost" size="icon" className="rounded-full"><X className="w-6 h-6" /></Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                 {[
                   { id: 'sheet', icon: Layers, label: 'Sheets' },
                   { id: 'video', icon: Video, label: 'Videos' },
                   { id: 'calendar', icon: Clock, label: 'Calendar' },
                   { id: 'weather', icon: CloudSun, label: 'Weather' },
                   { id: 'kanban', icon: Grid3X3, label: 'Kanban' },
                   { id: 'wireframe', icon: Layout, label: 'Wireframes' },
                 ].map(w => (
                   <button 
                    key={w.id} 
                    onClick={() => addWidget(w.id as WidgetType)}
                    className="p-8 rounded-[2rem] bg-white/5 border-2 border-white/5 hover:border-primary transition-all flex flex-col items-center justify-center gap-4 group"
                   >
                      <w.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-transform group-hover:scale-110" />
                      <span className="text-[9px] font-black uppercase italic tracking-widest text-white text-center">{w.label}</span>
                   </button>
                 ))}
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}


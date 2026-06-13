'use client';

import { useState, useRef, useEffect } from "react";
import { Palette, Sparkles, Send, Loader2, ImageIcon, Download, Share2, Heart, Trash2, Zap, Save, HardDrive, LayoutGrid, Globe, Layers, Maximize2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateAiArt } from "@/ai/flows/ai-art-generation-flow";
import { useUser, useFirestore, useStorage } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export default function XakArtPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'ai' | 'canvas'>('ai');

  // AI Generator States
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isSaving, setIsSaving] = useState(false);

  // Canvas Drawing States
  const [brushColor, setBrushColor] = useState('#a855f7'); // default Purple
  const [brushSize, setBrushSize] = useState(10);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Color presets
  const presets = [
    { name: 'Neon Cyan', color: '#00f0ff' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Purple', color: '#a855f7' },
    { name: 'Orange', color: '#f97316' },
    { name: 'White', color: '#ffffff' },
    { name: 'Black', color: '#000000' }
  ];

  // Initialize Canvas
  useEffect(() => {
    if (activeTab === 'canvas' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#09090b'; // zinc-950
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [activeTab]);

  // AI Generation Handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setGeneratedImage(null);
    try {
      const res = await generateAiArt({ prompt });
      setGeneratedImage(res.imageUrl);
      toast({ title: "AI Art Generated" });
    } catch (error) { toast({ variant: "destructive", title: "Generation Failed" }); }
    finally { setLoading(false); }
  };

  // Save AI Art to XakDrive
  const handleSaveToDrive = async () => {
    if (!user || !generatedImage || !firestore || !storage) return;
    setIsSaving(true);
    try {
      const path = `drive/${user.uid}/AI_Art_${Date.now()}.png`;
      const storageRef = ref(storage, path);
      await uploadString(storageRef, generatedImage, 'data_url');
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(firestore, "users", user.uid, "drive_files"), {
        name: `AI_Art_${Date.now()}.png`,
        url,
        type: 'image/png',
        timestamp: serverTimestamp(),
        size: "1.2 MB"
      });
      toast({ title: "Project Saved", description: "Image synced to your XakDrive." });
    } catch (e) { toast({ variant: "destructive", title: "Save Failed" }); }
    finally { setIsSaving(false); }
  };

  // Drawing Handlers for Canvas (Mouse)
  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((nativeEvent.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((nativeEvent.clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    contextRef.current = ctx;
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((nativeEvent.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((nativeEvent.clientY - rect.top) / rect.height) * canvas.height;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  // Drawing Handlers for Canvas (Touch)
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((touch.clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    contextRef.current = ctx;
    setIsDrawing(true);
    e.preventDefault();
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((touch.clientY - rect.top) / rect.height) * canvas.height;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    e.preventDefault();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#09090b'; // zinc-950
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    toast({ title: "Canvas Cleared" });
  };

  // Save Canvas Sketch to Drive
  const handleSaveCanvasToDrive = async () => {
    if (!user || !firestore || !storage || !canvasRef.current) return;
    setIsSaving(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const path = `drive/${user.uid}/Canvas_Sketch_${Date.now()}.png`;
      const storageRef = ref(storage, path);
      await uploadString(storageRef, dataUrl, 'data_url');
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(firestore, "users", user.uid, "drive_files"), {
        name: `Canvas_Sketch_${Date.now()}.png`,
        url,
        type: 'image/png',
        timestamp: serverTimestamp(),
        size: "512 KB"
      });
      toast({ title: "Sketch Saved", description: "Canvas synced to your XakDrive." });
    } catch (e) { 
      toast({ variant: "destructive", title: "Save Failed" }); 
    } finally { 
      setIsSaving(false); 
    }
  };

  // Download Canvas Sketch Locally
  const handleDownloadCanvas = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Canvas_Sketch_${Date.now()}.png`;
    a.click();
    toast({ title: "Sketch Downloaded" });
  };

  return (
    <div className="max-w-[1600px] mx-auto py-6 animate-fade-in px-6 space-y-12 text-foreground pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 bg-card/40 backdrop-blur-xl p-12 rounded-[4rem] border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Palette className="w-80 h-80 -rotate-12 text-rose-500" /></div>
        <div className="relative z-10 flex items-center gap-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-rose-500/10 flex items-center justify-center border-4 border-rose-500/20 shadow-2xl shadow-rose-900/40"><Palette className="w-12 h-12 text-rose-500" /></div>
          <div>
            <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">XakArt</h1>
            <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-[10px] mt-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rose]" /> Creativity Hub
            </p>
          </div>
        </div>

        {/* Studio Tabs */}
        <div className="flex bg-black/45 p-1 rounded-2xl border border-white/5 relative z-20">
          <button 
            onClick={() => setActiveTab("ai")}
            className={cn(
              "px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === "ai" ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            AI Generator
          </button>
          <button 
            onClick={() => setActiveTab("canvas")}
            className={cn(
              "px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === "canvas" ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            Interactive Canvas
          </button>
        </div>
      </header>

      {/* AI Art Tab */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-10">
            <Card className="glass-card rounded-[4rem] p-12 border-rose-500/20 shadow-2xl relative overflow-hidden bg-gradient-to-br from-rose-500/10 to-transparent">
              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-6"><Sparkles className="w-10 h-10 text-rose-500 animate-pulse" /><h2 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Create Art</h2></div>
                <form onSubmit={handleGenerate} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-4 tracking-widest">AI Prompt</label>
                    <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='e.g. "Cybernetic jungle at dawn"' className="bg-black/60 border-white/10 h-24 rounded-[2.5rem] text-xl px-10 font-bold italic focus:ring-rose-500 shadow-inner" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-4 tracking-widest">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['1:1', '16:9', '9:16'].map(ratio => (
                        <Button key={ratio} type="button" variant="outline" onClick={() => setAspectRatio(ratio)} className={cn("h-14 rounded-2xl border-white/10 font-black uppercase text-[10px] tracking-widest transition-all", aspectRatio === ratio ? "bg-rose-500/20 border-rose-500 text-rose-500 shadow-xl" : "bg-white/5 hover:bg-white/10")}>{ratio}</Button>
                      ))}
                    </div>
                  </div>
                  <Button disabled={loading} type="submit" className="w-full h-24 bg-rose-600 hover:bg-rose-500 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all active:scale-95 text-2xl italic border-b-8 border-rose-900 active:border-b-0">
                    {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : "GENERATE ART"}
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="glass-card rounded-[4rem] border-white/5 overflow-hidden aspect-square relative shadow-2xl group bg-zinc-950/50">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8">
                  <div className="w-32 h-32 rounded-full border-8 border-rose-500 border-t-transparent animate-spin shadow-[0_0_50px_rgba(244,63,94,0.3)]" />
                  <div className="text-center space-y-2"><p className="text-xl font-black uppercase italic tracking-tighter text-rose-500 animate-pulse">Generating Art...</p><p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em]">Imagen Pro 4.0 // AI Generator Active</p></div>
                </div>
              ) : generatedImage ? (
                <div className="relative w-full h-full animate-in zoom-in-95 duration-1000">
                  <img src={generatedImage} alt="AI Art" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all translate-y-12 group-hover:translate-y-0">
                     <div className="space-y-4">
                        <Badge className="bg-rose-600 text-white font-black uppercase tracking-widest px-6 py-2 text-[10px] shadow-2xl">AI_TRANSMISSION_STABLE</Badge>
                        <p className="text-white text-2xl font-bold italic line-clamp-2 max-w-lg drop-shadow-lg leading-relaxed">"{prompt}"</p>
                     </div>
                     <div className="flex gap-4">
                        <Button onClick={handleSaveToDrive} disabled={isSaving} variant="outline" className="h-16 px-8 rounded-2xl border-white/20 bg-black/60 hover:bg-rose-600 text-white shadow-2xl transition-all">
                          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><HardDrive className="w-6 h-6 mr-3" /> Save to Drive</>}
                        </Button>
                        <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl border-white/20 bg-black/60 hover:bg-rose-600 text-white shadow-2xl"><Download className="w-6 h-6" /></Button>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-10 opacity-10 group-hover:opacity-20 transition-all duration-700">
                  <ImageIcon className="w-48 h-48 animate-float" />
                  <div className="space-y-4"><h3 className="text-5xl font-black uppercase italic tracking-tighter">Art Studio</h3><p className="text-[10px] font-black uppercase tracking-[0.6em]">Awaiting AI Commands</p></div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Canvas Painting Tab */}
      {activeTab === 'canvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-10">
            <Card className="glass-card rounded-[4rem] p-12 border-rose-500/20 shadow-2xl relative overflow-hidden bg-gradient-to-br from-rose-500/10 to-transparent">
              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-6">
                  <Palette className="w-10 h-10 text-rose-500 animate-pulse" />
                  <h2 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Sketch Tools</h2>
                </div>
                
                {/* Brush size slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Brush Size</label>
                    <span className="text-[10px] font-black text-rose-500 uppercase">{brushSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                    className="w-full accent-rose-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>

                {/* Brush Size Preview */}
                <div className="flex items-center justify-center border border-white/10 rounded-3xl p-6 bg-black/40 w-full h-32 relative overflow-hidden">
                  <div className="absolute top-2 left-4 text-[8px] font-black uppercase text-muted-foreground tracking-widest">Brush Size Preview</div>
                  <div 
                    className="rounded-full shadow-lg border border-white/20 transition-all duration-100" 
                    style={{ 
                      width: `${brushSize}px`, 
                      height: `${brushSize}px`, 
                      backgroundColor: brushColor,
                      maxWidth: '80px',
                      maxHeight: '80px'
                    }} 
                  />
                </div>

                {/* Color Presets */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-4 tracking-widest">Color Presets</label>
                  <div className="grid grid-cols-3 gap-3">
                    {presets.map(p => (
                      <Button 
                        key={p.name} 
                        type="button"
                        onClick={() => setBrushColor(p.color)} 
                        className={cn(
                          "h-12 rounded-xl border border-white/10 font-bold uppercase text-[9px] tracking-wider transition-all flex items-center justify-center gap-2", 
                          brushColor === p.color ? "border-rose-500 bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30" : "bg-white/5 hover:bg-white/10 text-white"
                        )}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Color */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-4 tracking-widest">Custom Color</label>
                  <div className="flex gap-4 items-center">
                    <Input 
                      type="color" 
                      value={brushColor} 
                      onChange={(e) => setBrushColor(e.target.value)} 
                      className="w-16 h-12 rounded-xl bg-black/40 border-white/10 cursor-pointer p-1" 
                    />
                    <Input 
                      type="text" 
                      value={brushColor} 
                      onChange={(e) => setBrushColor(e.target.value)} 
                      placeholder="#ffffff" 
                      className="bg-black/60 border-white/10 h-12 rounded-xl px-4 font-bold text-xs uppercase text-white" 
                    />
                  </div>
                </div>

                {/* Clear Canvas */}
                <Button 
                  type="button"
                  onClick={clearCanvas} 
                  variant="outline" 
                  className="w-full h-16 rounded-2xl border-white/10 font-black uppercase text-[10px] tracking-widest transition-all bg-white/5 hover:bg-rose-600 hover:text-white"
                >
                  <Trash2 className="w-5 h-5 mr-3" /> Clear Canvas
                </Button>
              </div>
            </Card>
          </div>

          {/* Canvas Column */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="glass-card rounded-[4rem] border-white/5 overflow-hidden aspect-square relative shadow-2xl bg-zinc-950/50">
              <canvas 
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawingTouch}
                onTouchMove={drawTouch}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair block"
              />
            </Card>
            <div className="flex gap-4 justify-end">
              <Button onClick={handleSaveCanvasToDrive} disabled={isSaving} variant="outline" className="h-16 px-8 rounded-2xl border-white/20 bg-black/60 hover:bg-rose-600 text-white shadow-2xl transition-all">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><HardDrive className="w-6 h-6 mr-3" /> Save to Drive</>}
              </Button>
              <Button onClick={handleDownloadCanvas} variant="outline" className="h-16 px-8 rounded-2xl border-white/20 bg-black/60 hover:bg-rose-600 text-white shadow-2xl transition-all animate-fade-in">
                <Download className="w-6 h-6 mr-3" /> Download Sketch
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

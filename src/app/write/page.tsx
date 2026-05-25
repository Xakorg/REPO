"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, Sparkles, Loader2, Save, Wand2, Eraser, Layout, Share2, History } from "lucide-react";
import { chatWithXakAI } from "@/ai/flows/xak-ai-chat-assistant-flow";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function XakWritePage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEnhance = async (prompt: string) => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      const response = await chatWithXakAI({ 
        message: `${prompt}: "${content}". Return only the refined text.` 
      });
      setContent(response.response);
      toast({ title: "Neural Sync Complete", description: "Text refined by GPT-4o." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Neural link failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto py-10 space-y-8 animate-fade-in text-foreground px-6 h-[calc(100vh-140px)] flex flex-col">
      <header className="flex justify-between items-end">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-xl">
            <PenTool className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">XakWrite</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Gemini Pro AI Editor
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-xl border-white/10 h-12 px-8 font-black uppercase text-[10px] tracking-widest">
            <History className="w-4 h-4 mr-2" /> Versions
          </Button>
          <Button className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl">
            <Save className="w-4 h-4 mr-2" /> Sync to Drive
          </Button>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden">
        <Card className="flex-1 glass-card rounded-[3.5rem] border-white/10 p-12 relative overflow-hidden flex flex-col shadow-2xl">
          <div className="absolute inset-0 arcade-grid opacity-5 pointer-events-none" />
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start drafting your neural transmission..."
            className="flex-1 bg-transparent border-none text-2xl font-medium leading-relaxed italic placeholder:text-muted-foreground/10 outline-none resize-none z-10 custom-scrollbar"
          />
          {loading && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
              <p className="text-xs font-black uppercase tracking-[0.5em] text-amber-500 animate-pulse">Neural Processing...</p>
            </div>
          )}
        </Card>

        <div className="w-80 space-y-6">
          <Card className="glass-card rounded-[2.5rem] p-8 border-amber-500/20 bg-amber-500/5 space-y-8 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-500 italic flex items-center gap-2">
              <Wand2 className="w-4 h-4" /> Neural Tools
            </h3>
            <div className="space-y-3">
              {[
                { label: "Refine & Expand", prompt: "Expand and improve the professional quality of this text" },
                { label: "Make It Fun", prompt: "Rewrite this to be exciting and fun for a gaming community" },
                { label: "Summarize", prompt: "Summarize this into a single high-impact sentence" },
                { label: "Check Logic", prompt: "Verify the technical logic and flow of this writing" },
              ].map(tool => (
                <button 
                  key={tool.label}
                  onClick={() => handleEnhance(tool.prompt)}
                  disabled={loading || !content}
                  className="w-full text-left p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-500 transition-all group flex justify-between items-center"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white">{tool.label}</span>
                  <Sparkles className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </Card>

          <Card className="glass-card rounded-[2.5rem] p-8 border-white/5 space-y-6 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Document Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black">
                <span className="uppercase opacity-40">Words</span>
                <span className="text-amber-500">{content.split(/\s+/).filter(Boolean).length}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black">
                <span className="uppercase opacity-40">Reading Time</span>
                <span className="text-amber-500">~{Math.ceil(content.length / 500)}m</span>
              </div>
            </div>
          </Card>

          <Button variant="outline" className="w-full rounded-2xl h-16 border-white/10 hover:bg-white/5 font-black uppercase text-xs tracking-widest text-white shadow-lg">
            <Share2 className="w-4 h-4 mr-3" /> Broadcast Hub
          </Button>
        </div>
      </div>
    </div>
  );
}

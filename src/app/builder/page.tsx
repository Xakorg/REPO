"use client";

import { useState, useEffect } from "react";
import { 
  Code2, 
  Terminal, 
  Globe, 
  Database, 
  Activity, 
  Plus,
  Play,
  Loader2,
  Rocket,
  Settings,
  Layers,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useUser } from "@/firebase";
import { cn } from "@/lib/utils";

type BuilderTab = 'ide' | 'console' | 'database' | 'hosting';

export default function XakteirBuilder() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<BuilderTab>('ide');
  const [isArchitecting, setIsArchitecting] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'error' | 'success', timestamp: string}[]>([]);

  useEffect(() => { 
    setMounted(true); 
    setLogs([
      { msg: "Xakteir Build Engine v4.2 initialized.", type: 'info', timestamp: new Date().toLocaleTimeString() },
      { msg: "System Ready.", type: 'success', timestamp: new Date().toLocaleTimeString() }
    ]);
  }, []);

  const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, { msg, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleBuild = () => {
    setIsArchitecting(true);
    addLog("Analyzing application structure...", 'info');
    setTimeout(() => {
      addLog("Build Succeeded.", 'success');
      setIsArchitecting(false);
    }, 1500);
  };

  if (!user) return <div className="p-32 text-center font-black uppercase italic">Sign in for Builder access.</div>;
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 top-20 z-50 bg-background flex flex-col text-foreground overflow-hidden">
      <header className="h-16 border-b border-white/5 bg-card/80 backdrop-blur-xl px-8 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center"><Code2 className="w-6 h-6 text-white" /></div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Builder_Pro</h2>
          </div>
          <nav className="flex bg-black/40 p-1 rounded-xl border border-white/10">
            {(['ide', 'console', 'database', 'hosting'] as BuilderTab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-6 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", activeTab === tab ? "bg-sky-500 text-white shadow-xl" : "text-muted-foreground hover:bg-white/5")}>{tab}</button>
            ))}
          </nav>
        </div>
        <Button onClick={handleBuild} disabled={isArchitecting} className="bg-sky-600 hover:bg-sky-500 h-10 px-8 rounded-xl font-black uppercase text-xs shadow-xl">
          {isArchitecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Rocket className="w-4 h-4 mr-2" /> Publish Unit</>}
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-white/5 bg-zinc-950 flex flex-col">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-2"><Layers className="w-3.5 h-3.5" /><span className="text-[10px] font-black uppercase text-white">Modules</span></div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {['Dashboard', 'Accounts', 'System'].map(m => (
                <div key={m} className="p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer text-[10px] font-bold uppercase">{m}</div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 bg-zinc-900 flex flex-col">
          {activeTab === 'ide' && (
            <div className="flex-1 p-10 font-mono text-sm">
               <Card className="h-full bg-black/40 border-white/5 p-10 rounded-3xl overflow-hidden">
                  <pre className="text-sky-400">
{`export default function App() {
  return (
    <div className="os-shell">
      <header>Xakteir OS v4.2.8</header>
      <main>Ready for deployment.</main>
    </div>
  );
}`}
                  </pre>
               </Card>
            </div>
          )}

          {activeTab === 'console' && (
            <div className="flex-1 p-10">
              <Card className="h-full bg-zinc-950 border-white/10 rounded-3xl p-10 flex flex-col gap-6">
                <ScrollArea className="flex-1 font-mono text-xs">
                  <div className="space-y-2">
                    {logs.map((log, i) => (
                      <p key={i} className={cn(log.type === 'error' ? "text-red-400" : log.type === 'success' ? "text-green-400" : "text-sky-400")}>
                        [{log.timestamp}] {log.msg}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
                <Input placeholder="Execute protocol..." className="h-12 bg-black border-white/10 rounded-xl" />
              </Card>
            </div>
          )}

          <div className="h-32 border-t border-white/10 bg-zinc-950 flex p-6 gap-8">
            <div className="flex-1 flex flex-col gap-3 justify-center">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Memory Allocation</span>
                <span>42.8 GB / 64 GB</span>
              </div>
              <Progress value={65} className="h-1 bg-white/5" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

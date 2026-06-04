"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { 
  Code2, 
  Terminal, 
  Globe, 
  Database, 
  ShieldCheck, 
  Activity, 
  HardDrive, 
  Cpu,
  Plus,
  Play,
  Loader2,
  FileCode,
  FolderTree,
  Monitor,
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  ChevronDown,
  Layout,
  UserCheck,
  Rocket,
  X,
  Lock,
  Download,
  FolderOpen,
  MessageSquare,
  Wand2,
  RefreshCw,
  FileArchive,
  Upload,
  ExternalLink,
  Settings,
  ChevronRight,
  Info,
  ShieldPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { codeArchitect, type CodeArchitectOutput } from "@/ai/flows/code-architect-flow";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, orderBy, limit, addDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

type ProjectTab = 'ide' | 'hosting' | 'console' | 'settings';

export default function XakCodePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [activeProjectId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTab>('ide');
  const [isArchitecting, setIsArchitecting] = useState(false);
  const [aiPrompt, setPrompt] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  
  // Hosting State
  const [customDomain, setCustomDomain] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "code_projects"), orderBy("updatedAt", "desc"), limit(20));
  }, [firestore, user]);

  const { data: projects, isLoading } = useCollection(projectsQuery);
  const activeProject = projects?.find(p => p.id === activeProjectId) || projects?.[0];

  useEffect(() => {
    if (projects?.length && !activeProjectId) {
      setActiveId(projects[0].id);
    }
  }, [projects]);

  const handleArchitect = async (e: React.FormEvent, customInstruction?: string) => {
    if (e) e.preventDefault();
    const instruction = customInstruction || aiPrompt;
    if (!instruction.trim() || isArchitecting || !user || !firestore || !activeProject) return;
    
    setIsArchitecting(true);
    try {
      const res = await codeArchitect({ 
        prompt: instruction,
        context: activeProject.code 
      });
      
      await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
        code: res.code,
        explanation: res.explanation,
        updatedAt: serverTimestamp()
      });

      toast({ title: "Neural Logic Synced", description: "AI has refactored your shard logic." });
      setPrompt("");
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsArchitecting(false);
    }
  };

  const handleCreateProject = async () => {
    if (!user || !firestore || !newProjName.trim()) return;
    try {
      const docRef = await addDoc(collection(firestore, "users", user.uid, "code_projects"), {
        name: newProjName,
        code: "// Colorful Logic Core\nexport default function App() {\n  return (\n    <div className='p-20 flex flex-col items-center justify-center min-h-screen bg-black text-white'>\n      <h1 className='text-6xl font-black italic tracking-tighter uppercase mb-4'>Neural Unit</h1>\n      <p className='text-primary font-bold uppercase tracking-widest'>Status: Synchronized</p>\n    </div>\n  );\n}",
        explanation: "Initialized new neural shard.",
        deployment: {
          status: 'idle',
          domain: `${newProjName.toLowerCase().replace(/\s+/g, '-')}.xakteir.app`,
          isVerified: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveId(docRef.id);
      setIsNewModalOpen(false);
      setNewProjName("");
      toast({ title: "Shard Initialized" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleProjectImport = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploadingZip(true);
    setTimeout(() => {
      setUploadingZip(false);
      const hasDirectoryImport = files.some(file => file.webkitRelativePath);
      const sampleNames = files.slice(0, 5).map(file => file.webkitRelativePath || file.name).join(", ");
      toast({
        title: hasDirectoryImport ? "Folder Imported" : "Archive Imported",
        description: `Loaded ${files.length} file${files.length === 1 ? "" : "s"} into XakCode.`,
      });
      setPrompt(
        `I imported a project with ${files.length} files. Sample paths: ${sampleNames}. ` +
        `Help me review the structure, suggest improvements, and prepare it for hosting on a custom domain.`
      );
      event.target.value = "";
    }, 2000);
  };

  const handleDeploy = async () => {
    if (!activeProject || !user || !firestore) return;
    setIsDeploying(true);
    setTimeout(async () => {
      await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
        "deployment.status": 'published',
        "deployment.liveAt": serverTimestamp()
      });

      // Create a published_projects record for discovery and provenance
      try {
        await addDoc(collection(firestore, "published_projects"), {
          projectId: activeProject.id,
          ownerId: user.uid,
          name: activeProject.name,
          domain: activeProject.deployment?.domain || `${(activeProject.name || 'project').toLowerCase().replace(/\s+/g, '-')}.xakteir.app`,
          publishedAt: serverTimestamp(),
          status: 'published'
        });
      } catch (e) {
        // non-fatal
      }

      setIsDeploying(false);
      toast({ title: "Unit Published!", description: `Live at ${activeProject.deployment?.domain || 'the Hub'}` });
    }, 3000);
  };

  const handleCustomDomain = async () => {
    if (!activeProject || !customDomain.trim() || !firestore || !user) return;
    try {
      const verificationCode = `xak-verify-${Math.random().toString(36).substring(2, 15)}`;
      await updateDoc(doc(firestore, "users", user.uid, "code_projects", activeProject.id), {
        "deployment.customDomain": customDomain.toLowerCase().trim(),
        "deployment.verificationCode": verificationCode,
        "deployment.isVerified": false
      });
      toast({ title: "Domain Key Generated", description: "Add the TXT record to your DNS provider." });
      setCustomDomain("");
    } catch (e) {
      toast({ variant: "destructive", title: "Protocol Error" });
    }
  };

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center p-20 text-center space-y-10 animate-fade-in text-foreground">
      <div className="w-32 h-32 rounded-[3.5rem] bg-sky-500/10 flex items-center justify-center border-4 border-sky-500/20 shadow-2xl">
        <Code2 className="w-16 h-16 text-sky-500" />
      </div>
      <h2 className="text-6xl font-black uppercase italic tracking-tighter">Architect Entry</h2>
      <p className="text-muted-foreground font-bold uppercase tracking-widest max-w-sm">Sign in to initialize your neural code library and hosting suite.</p>
      <Link href="/auth"><Button className="bg-primary hover:bg-primary/90 h-16 px-16 rounded-[2rem] font-black uppercase text-xs">Sign In</Button></Link>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 top-20 z-[50] bg-background flex flex-col animate-fade-in text-foreground overflow-hidden">
      <header className="h-16 border-b border-white/5 bg-card/80 backdrop-blur-xl px-6 flex items-center justify-between shadow-lg relative z-[60]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-900/40">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-foreground uppercase italic tracking-tighter">XakCode Pro</h2>
          </div>
          
          <div className="flex gap-2">
             <Button onClick={() => setIsNewModalOpen(true)} variant="outline" className="h-10 px-4 rounded-xl border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5"><Plus className="w-4 h-4 mr-2" /> New Shard</Button>
             <label className="cursor-pointer">
                  <Button variant="outline" className="h-10 px-4 rounded-xl border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 pointer-events-none" disabled={uploadingZip}>
                   {uploadingZip ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Import Folder or Zip
                </Button>
                <input type="file" className="hidden" accept=".zip" multiple onChange={handleProjectImport} webkitdirectory="" />
             </label>
          </div>
        </div>

        <nav className="flex bg-black/40 p-1 rounded-xl border border-white/10">
           {(['ide', 'hosting', 'console'] as ProjectTab[]).map(tab => (
             <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-sky-500 text-white shadow-xl" : "text-muted-foreground hover:bg-white/5"
              )}
             >
               {tab}
             </button>
           ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-secondary/30 rounded-full border border-white/5">
            <span className={cn("w-2 h-2 rounded-full animate-pulse", activeProject?.deployment?.status === 'live' ? "bg-green-500" : "bg-amber-500")} />
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{activeProject?.name || "System Online"}</span>
          </div>
           <Button onClick={handleDeploy} disabled={isDeploying || !activeProject} className="bg-primary hover:bg-primary/90 h-10 rounded-xl px-8 font-black uppercase text-xs tracking-widest text-white shadow-xl border-b-4 border-primary/20 active:border-b-0 active:translate-y-1 transition-all">
             {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Rocket className="w-4 h-4 mr-2" /> PUBLISH</>}
           </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Project Explorer */}
        <aside className="w-64 border-r border-white/5 bg-zinc-950 flex flex-col">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-sky-400" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unit Registry</h3>
          </div>
          <ScrollArea className="flex-1">
             <div className="p-4 space-y-2">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /> : projects?.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setActiveId(p.id)}
                    className={cn(
                      "p-4 rounded-xl flex items-center justify-between group cursor-pointer transition-all border",
                      activeProjectId === p.id ? "bg-sky-500/10 border-sky-500/20 text-sky-400" : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileCode className={cn("w-3.5 h-3.5", activeProjectId === p.id ? "text-sky-400" : "text-muted-foreground")} />
                      <span className="text-[10px] font-bold uppercase truncate pr-4">{p.name}</span>
                    </div>
                    {p.deployment?.status === 'live' && <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />}
                  </div>
                ))}
             </div>
          </ScrollArea>
        </aside>

        {/* Workspace Stage */}
        <main className="flex-1 flex flex-col bg-zinc-900 overflow-hidden relative">
          <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
          
          {activeTab === 'ide' && (
             <div className="flex-1 grid grid-cols-12 overflow-hidden relative z-10">
                <div className="col-span-8 flex flex-col border-r border-white/5 bg-black/20">
                   <div className="h-10 bg-black/40 border-b border-white/5 flex items-center px-6">
                      <span className="text-[9px] font-black uppercase text-sky-500 tracking-widest italic">App_Logic.tsx // Colorful High-Fidelity</span>
                   </div>
                   <ScrollArea className="flex-1 p-10 font-mono text-sm leading-relaxed">
                      <pre className="text-foreground/90 whitespace-pre-wrap select-all">
                        {activeProject?.code || "// Select a shard to view logic..."}
                      </pre>
                   </ScrollArea>
                </div>

                {/* AI Assistant Sidebar */}
                <div className="col-span-4 flex flex-col bg-zinc-950/50">
                   <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Wand2 className="w-5 h-5 text-sky-400" />
                         <h3 className="text-[11px] font-black uppercase tracking-widest text-white italic">Neural Architect</h3>
                      </div>
                      <Badge className="bg-sky-500/20 text-sky-400 border-none text-[8px]">ACTIVE</Badge>
                   </div>
                   
                   <ScrollArea className="flex-1 p-8">
                      <div className="space-y-6">
                         <div className="p-6 bg-secondary/20 rounded-[2rem] border border-white/5 shadow-inner">
                            <p className="text-xs font-medium leading-relaxed italic text-muted-foreground">
                              "I can help you build your colourful Hub Unit. Ask me to refine logic, upgrade legacy code, or add new features."
                            </p>
                         </div>
                         
                         {activeProject?.explanation && (
                           <div className="p-6 bg-sky-500/5 rounded-[2rem] border border-sky-500/20 space-y-3 animate-in fade-in">
                              <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Logic Breakdown</p>
                              <p className="text-[11px] leading-relaxed text-foreground/80 italic">{activeProject.explanation}</p>
                           </div>
                         )}

                         <div className="pt-4 grid grid-cols-1 gap-3">
                            <Button onClick={() => handleArchitect(null as any, "Upgrade this project for high-fidelity performance and add colorful styling.")} variant="outline" className="h-12 justify-start px-6 rounded-xl border-white/10 bg-white/5 hover:bg-sky-500/10 text-[9px] font-black uppercase">
                               <Sparkles className="w-3.5 h-3.5 mr-3 text-sky-400" /> Upgrade All Logic
                            </Button>
                            <Button onClick={() => handleArchitect(null as any, "Convert this project to a fully responsive Next.js application.")} variant="outline" className="h-12 justify-start px-6 rounded-xl border-white/10 bg-white/5 hover:bg-sky-500/10 text-[9px] font-black uppercase">
                               <Monitor className="w-3.5 h-3.5 mr-3 text-sky-400" /> Optimize for Mobile
                            </Button>
                         </div>
                      </div>
                   </ScrollArea>

                   <div className="p-8 border-t border-white/5 bg-black/20">
                      <form onSubmit={handleArchitect} className="relative group">
                         <Input 
                          value={aiPrompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Ask the AI to build logic..." 
                          className="h-16 bg-zinc-900 border-white/10 rounded-2xl pr-16 text-xs font-bold italic"
                         />
                         <Button disabled={isArchitecting || !aiPrompt.trim()} type="submit" size="icon" className="absolute right-2 top-2 h-12 w-12 bg-sky-600 rounded-xl shadow-xl transition-all active:scale-95">
                            {isArchitecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                         </Button>
                      </form>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'hosting' && (
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar relative z-10">
               <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                  <header className="flex justify-between items-end">
                     <div>
                        <h2 className="text-5xl font-black uppercase italic tracking-tighter">Hosting Station</h2>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-2">Manage Shard Deployment & Domains</p>
                     </div>
                     <Badge className={cn(
                       "h-10 px-6 rounded-full font-black text-[10px] border-4",
                       activeProject?.deployment?.status === 'live' ? "bg-green-500/20 text-green-500 border-green-500/20" : "bg-amber-500/20 text-amber-500 border-amber-500/20"
                     )}>
                       {activeProject?.deployment?.status === 'live' ? 'UNIT_LIVE' : 'AWAITING_SYNC'}
                     </Badge>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <Card className="glass-card rounded-[3rem] p-10 border-white/10 space-y-8 bg-black/40">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center"><Globe className="w-6 h-6 text-white" /></div>
                           <h3 className="text-xl font-black uppercase italic">Custom Domain</h3>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium italic">Map your project to a real custom domain. Using a `www.` domain is recommended.</p>
                        <div className="space-y-4">
                           <div className="flex gap-2">
                              <Input 
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                placeholder="www.my-app.com" 
                                className="bg-secondary/30 h-12 rounded-xl border-white/10 font-bold" 
                              />
                              <Button onClick={handleCustomDomain} disabled={!customDomain.trim()} className="bg-sky-600 rounded-xl h-12 px-6 font-black uppercase text-[10px]">Verify</Button>
                           </div>
                           
                           {activeProject?.deployment?.customDomain && (
                              <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-4 animate-in zoom-in-95">
                                 <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase text-amber-500 italic">DNS TXT Record</span>
                                    <Badge className="bg-amber-500 text-black text-[7px] px-2 font-black">PENDING</Badge>
                                 </div>
                                 <div className="font-mono text-[10px] break-all p-3 bg-black/40 rounded-lg border border-white/5 select-all">
                                    {activeProject.deployment.verificationCode}
                                 </div>
                                 <p className="text-[8px] text-muted-foreground font-bold uppercase text-center">Add this value as a TXT record to verify ownership.</p>
                              </div>
                           )}
                        </div>
                     </Card>

                     <Card className="glass-card rounded-[3rem] p-10 border-white/10 space-y-8 bg-black/40">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center"><Layout className="w-6 h-6 text-white" /></div>
                           <h3 className="text-xl font-black uppercase italic">Hub Subdomain</h3>
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                           <div className="space-y-1">
                              <p className="text-[8px] font-black uppercase text-muted-foreground">Assigned Path</p>
                              <p className="text-sm font-black text-primary italic truncate w-40">{activeProject?.deployment?.domain}</p>
                           </div>
                           <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white"><ExternalLink className="w-4 h-4" /></Button>
                        </div>
                        <div className="space-y-4">
                           <p className="text-[10px] font-black uppercase text-muted-foreground">Redirect Logic</p>
                           <div className="flex items-center gap-4">
                              <Badge className="bg-sky-500/20 text-sky-400 border-none text-[8px] font-black">/home</Badge>
                              <ChevronRight className="w-3 h-3 opacity-20" />
                              <span className="text-[10px] font-bold text-white italic">Primary Subdomain</span>
                           </div>
                        </div>
                     </Card>
                  </div>

                  <Card className="glass-card rounded-[3.5rem] p-12 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-12 opacity-5"><Zap className="w-48 h-48" /></div>
                     <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="space-y-4">
                           <h3 className="text-3xl font-black uppercase italic tracking-tighter">Instant Host Protocol</h3>
                           <p className="text-sm text-muted-foreground font-medium italic leading-relaxed max-w-lg">Push your colourful logic directly to the Hub's anycast network. Global SSL and Edge caching enabled by default.</p>
                        </div>
                        <Button onClick={handleDeploy} disabled={isDeploying} className="h-20 px-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black text-lg uppercase italic shadow-2xl border-b-8 border-primary/20 active:border-b-0 active:translate-y-1 transition-all">
                            {isDeploying ? <Loader2 className="w-8 h-8 animate-spin" /> : "PUBLISH"}
                        </Button>
                     </div>
                  </Card>
               </div>
            </div>
          )}

          {activeTab === 'console' && (
            <div className="flex-1 p-10 relative z-10">
              <Card className="h-full bg-zinc-950 border-4 border-white/10 rounded-[3rem] p-10 flex flex-col gap-6 shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
                <div className="flex items-center justify-between border-b border-white/5 pb-6 relative z-10">
                  <div className="flex items-center gap-4 text-sky-400">
                    <Terminal className="w-6 h-6" />
                    <span className="text-sm font-black uppercase italic tracking-widest">Shard_Deployment_Log</span>
                  </div>
                  <Badge variant="outline" className="border-sky-500/20 text-sky-400 text-[8px] font-black">STABLE</Badge>
                </div>
                <ScrollArea className="flex-1 font-mono text-[11px] relative z-10">
                  <div className="space-y-2 text-sky-400/80">
                    <p>[{new Date().toLocaleTimeString()}] Initializing build protocol for {activeProject?.name}...</p>
                    <p>[{new Date().toLocaleTimeString()}] Fetching neural assets from Shard Vault...</p>
                    <p>[{new Date().toLocaleTimeString()}] Compiling Next.js application core...</p>
                    <p>[{new Date().toLocaleTimeString()}] Building colorful UI components...</p>
                    {activeProject?.deployment?.status === 'live' ? (
                       <>
                         <p className="text-green-500">[{new Date().toLocaleTimeString()}] SUCCESS: Deployment fully synchronized.</p>
                         <p className="text-green-500">[{new Date().toLocaleTimeString()}] Live Link: https://{activeProject.deployment.domain}</p>
                       </>
                    ) : (
                       <p className="animate-pulse">[{new Date().toLocaleTimeString()}] STANDBY: Awaiting host command...</p>
                    )}
                  </div>
                </ScrollArea>
                <div className="relative z-10">
                   <div className="h-12 bg-black rounded-xl border border-white/5 flex items-center px-6 gap-4">
                      <span className="text-sky-500 font-bold">$</span>
                      <Input disabled className="bg-transparent border-none focus-visible:ring-0 text-sky-400/60 font-mono text-[10px] h-full" placeholder="Execute console logic..." />
                   </div>
                </div>
              </Card>
            </div>
          )}

          {/* Live Metric Dock */}
          <div className="h-32 border-t border-white/10 bg-zinc-950/80 backdrop-blur-3xl flex p-6 gap-10 relative z-10">
            <div className="flex-1 flex flex-col gap-3 justify-center">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2">
                <span>Hub Logic Allocation</span>
                <span className="text-sky-400">12.4B Nodes</span>
              </div>
              <Progress value={72} className="h-1.5 bg-white/5 shadow-inner" />
              <div className="flex gap-8">
                 <div className="flex items-center gap-3"><Cpu className="w-3.5 h-3.5 text-sky-400" /><span className="text-[9px] font-bold text-muted-foreground uppercase">CPU: 12%</span></div>
                 <div className="flex items-center gap-3"><Activity className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[9px] font-bold text-muted-foreground uppercase">8ms Latency</span></div>
                 <div className="flex items-center gap-3"><HardDrive className="w-3.5 h-3.5 text-amber-500" /><span className="text-[9px] font-bold text-muted-foreground uppercase">Shard: Optimized</span></div>
              </div>
            </div>
            <div className="w-64 flex flex-col justify-center gap-3">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between group cursor-pointer hover:border-primary transition-all">
                  <span className="text-[9px] font-black uppercase text-muted-foreground group-hover:text-white">Registry Check</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
               </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
         <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-foreground p-10">
            <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic flex items-center gap-4"><ShieldPlus className="w-8 h-8 text-sky-500" /> Initialize Shard</DialogTitle></DialogHeader>
            <div className="space-y-8 py-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Project Name</label>
                  <Input value={newProjName} onChange={(e) => setNewProjName(e.target.value)} placeholder="my-colorful-app" className="h-16 bg-secondary/50 border-white/10 rounded-2xl font-bold text-lg px-8 shadow-inner" />
               </div>
               <Button onClick={handleCreateProject} disabled={!newProjName.trim()} className="w-full h-18 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase tracking-widest text-white shadow-2xl italic text-lg border-b-8 border-primary/20 active:border-b-0 active:translate-y-1 transition-all">CREATE PROJECT</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

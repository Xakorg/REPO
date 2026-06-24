"use client";

import React, { useState, useEffect, useRef } from "react";
import { XakCodeProvider, useXakCode } from "./context";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Code2, 
  Terminal, 
  Globe, 
  Settings, 
  Plus, 
  FolderTree, 
  FileCode, 
  FileText, 
  Trash2, 
  Edit3, 
  Copy, 
  FolderOpen, 
  Loader2,
  Tv, 
  Sparkles, 
  Rocket, 
  Play, 
  Activity, 
  Cpu, 
  HardDrive,
  UserCheck,
  ShieldPlus,
  RefreshCw,
  GitBranch,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function IDELayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    projects,
    isLoadingProjects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    projectFiles,
    activeFile,
    openTab,
    handleDeleteFile,
    handleCreateFile,
    handleRenameFile,
    handleDuplicateFile,
    handleCreateProject,
    handleDeleteProject,
    isDeploying,
    handleDeploy,
    multiplayerActive,
    multiplayerLogs,
    theme,
    fontSize,
    autoSaveInterval,
    isCompiling,
    setIsCompiling,
    setCompileDuration
  } = useXakCode();

  // Resource Monitor States
  const [cpuUsage, setCpuUsage] = useState(12);
  const [ramUsage, setRamUsage] = useState(44);
  const [dbLatency, setDbLatency] = useState(24);

  // Dialog States
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState("");
  const [renameNewName, setRenameNewName] = useState("");

  const folderInputRef = useRef<HTMLInputElement>(null);

  // Animate mock CPU and RAM
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuUsage(prev => {
        const delta = Math.floor(Math.random() * 11) - 5; // -5 to +5
        return Math.max(5, Math.min(95, prev + delta));
      });
      setRamUsage(prev => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(30, Math.min(85, prev + delta));
      });
      setDbLatency(prev => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(12, Math.min(90, prev + delta));
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateProjectSubmit = async () => {
    if (!newProjName.trim()) return;
    await handleCreateProject(newProjName);
    setNewProjName("");
    setIsNewProjectOpen(false);
  };

  const handleCreateFileSubmit = async () => {
    if (!newFileName.trim()) return;
    const success = await handleCreateFile(newFileName);
    if (success) {
      setNewFileName("");
      setIsNewFileOpen(false);
    }
  };

  const handleRenameSubmit = async () => {
    if (!renameNewName.trim() || !renameTarget) return;
    const success = await handleRenameFile(renameTarget, renameNewName);
    if (success) {
      setRenameNewName("");
      setIsRenameOpen(false);
    }
  };

  // Compile Trigger
  const triggerCompile = () => {
    setIsCompiling(true);
    const start = performance.now();
    setTimeout(() => {
      setIsCompiling(false);
      setCompileDuration(Math.round(performance.now() - start + 28));
    }, 1200);
  };

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-20 text-center space-y-10 bg-[#07070e] text-white">
        <div className="w-32 h-32 rounded-[3.5rem] bg-sky-500/10 flex items-center justify-center border-4 border-sky-500/20 shadow-2xl">
          <Code2 className="w-16 h-16 text-sky-500" />
        </div>
        <h2 className="text-6xl font-black uppercase italic tracking-tighter text-white">Developer Entry</h2>
        <p className="text-muted-foreground font-bold uppercase tracking-widest max-w-sm">Sign in to initialize your AI code library and hosting suite.</p>
        <Button onClick={() => router.push('/auth')} className="bg-sky-500 hover:bg-sky-400 text-black h-16 px-16 rounded-[2rem] font-black uppercase text-xs">Sign In</Button>
      </div>
    );
  }

  // Theme styling definitions
  const themeClasses: Record<string, string> = {
    dracula: "bg-[#07070e] text-[#f8f8f2]",
    cyberpunk: "bg-[#0c051a] text-[#00ffcc]",
    vscode: "bg-[#1e1e1e] text-[#d4d4d4]",
    monokai: "bg-[#272822] text-[#f8f8f2]",
    nord: "bg-[#2e3440] text-[#d8dee9]",
    "github-light": "bg-[#f6f8fa] text-[#24292f]"
  };

  return (
    <div className={cn("fixed inset-0 top-0 z-[200] flex flex-col overflow-hidden select-none font-sans transition-colors duration-300", themeClasses[theme] || themeClasses.dracula)}>
      
      {/* IDE Header Controls */}
      <header className="h-14 border-b border-white/5 bg-[#090915]/95 backdrop-blur-xl px-6 flex items-center justify-between shadow-lg relative z-[60] shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-900/40">
              <Code2 className="w-4.5 h-4.5 text-white" />
            </div>
            <h2 className="text-sm font-black uppercase italic tracking-tighter text-white">XakCode IDE</h2>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setIsNewProjectOpen(true)} variant="outline" className="h-8 px-3 rounded-lg border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 text-white">
              <Plus className="w-3 h-3 mr-1.5" /> New Project
            </Button>
          </div>
        </div>

        {/* Global IDE Navigation Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
            <span className={cn("w-1.5 h-1.5 rounded-full", activeProject?.deployment?.status === 'live' ? "bg-green-500 animate-pulse" : "bg-amber-500")} />
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{activeProject?.name || "No active project"}</span>
          </div>

          <Button onClick={triggerCompile} disabled={isCompiling} className="bg-sky-600 hover:bg-sky-500 h-8 rounded-lg px-4 font-black uppercase text-[9px] tracking-widest text-white shadow-xl transition-all">
            {isCompiling ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <><Play className="w-3 h-3 mr-1.5 text-white" /> RUN PREVIEW</>}
          </Button>

          <Button onClick={handleDeploy} disabled={isDeploying || !activeProject} className="bg-emerald-500 hover:bg-emerald-400 h-8 rounded-lg px-4 font-black uppercase text-[9px] tracking-widest text-black shadow-xl transition-all">
            {isDeploying ? <Loader2 className="w-3 h-3 animate-spin text-black" /> : <><Rocket className="w-3 h-3 mr-1.5" /> PUBLISH</>}
          </Button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDE BAR 1: Slim Sub-page Icon Toolbar */}
        <nav className="w-14 bg-[#05050e] border-r border-white/5 flex flex-col items-center py-4 justify-between shrink-0">
          <div className="space-y-4 w-full px-2">
            {[
              { path: "/xakcode", icon: Code2, label: "Editor" },
              { path: "/xakcode/hosting", icon: Globe, label: "Hosting" },
              { path: "/xakcode/console", icon: Terminal, label: "Console" },
              { path: "/xakcode/git", icon: GitBranch, label: "Git Control" },
              { path: "/xakcode/utilities", icon: Tv, label: "Utilities" }
            ].map(item => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  title={item.label}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative mx-auto",
                    isActive 
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {isActive && <span className="absolute left-0 top-3 bottom-3 w-1 bg-sky-400 rounded-r-md" />}
                </button>
              );
            })}
          </div>

          <div className="w-full px-2">
            <button
              onClick={() => router.push('/xakcode/settings')}
              title="Settings"
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto",
                pathname === "/xakcode/settings"
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>
        </nav>

        {/* SIDE BAR 2: Workspace Explorer and Health Monitors */}
        <aside className="w-56 border-r border-white/5 bg-[#06060c] flex flex-col shrink-0">
          
          {/* Project Dropdown / Switcher */}
          <div className="p-3.5 border-b border-white/5">
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Active Space</span>
            {isLoadingProjects ? (
              <div className="h-9 bg-white/5 rounded-lg flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-white/20" /></div>
            ) : (
              <select
                value={activeProjectId || ""}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg text-[10px] p-2 text-white font-bold outline-none cursor-pointer hover:border-sky-500 transition-colors"
              >
                {projects?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Directory Listings Header */}
          <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-3.5 h-3.5 text-sky-400" />
              <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Files</h3>
            </div>
            <Button onClick={() => setIsNewFileOpen(true)} size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/5 rounded-md">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Files List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {Object.keys(projectFiles).map(fileName => {
                const isActive = activeFile === fileName;
                const extension = fileName.split('.').pop() || '';
                return (
                  <div 
                    key={fileName}
                    onClick={() => openTab(fileName)}
                    className={cn(
                      "p-2 rounded-lg flex items-center justify-between group cursor-pointer transition-all border text-left",
                      isActive 
                        ? "bg-sky-500/15 border-sky-500/30 text-sky-400 font-black" 
                        : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden w-full">
                      {extension === 'css' ? (
                        <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      )}
                      <span className="text-[9px] truncate w-full font-bold">{fileName}</span>
                    </div>
                    
                    {fileName !== 'App.jsx' && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setRenameTarget(fileName);
                            setRenameNewName(fileName);
                            setIsRenameOpen(true);
                          }}
                          className="text-white hover:text-sky-400 p-0.5"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDuplicateFile(fileName);
                          }}
                          className="text-white hover:text-sky-400 p-0.5"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDeleteFile(fileName);
                          }}
                          className="text-rose-500 hover:text-rose-400 p-0.5"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* SYSTEM MONITOR WIDGET & MULTIPLAYER NOTIFICATIONS */}
          <div className="p-3 bg-black/60 border-t border-white/5 space-y-3 shrink-0">
            
            {/* System Health */}
            <div className="space-y-1.5 text-[8px] text-muted-foreground font-black uppercase tracking-widest text-left">
              <div className="flex items-center gap-1 text-sky-400 font-bold mb-1">
                <Activity className="w-3 h-3" /> Workspace Diagnostics
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Cpu className="w-2.5 h-2.5" /> CPU Load</span>
                  <span className={cn("font-bold", cpuUsage > 70 ? "text-rose-400" : "text-emerald-400")}>{cpuUsage}%</span>
                </div>
                <Progress value={cpuUsage} className="h-1 bg-white/5" />

                <div className="flex justify-between items-center mt-1">
                  <span className="flex items-center gap-1"><HardDrive className="w-2.5 h-2.5" /> RAM Allocation</span>
                  <span className="text-emerald-400 font-bold">{ramUsage}%</span>
                </div>
                <Progress value={ramUsage} className="h-1 bg-white/5" />

                <div className="flex justify-between items-center mt-1">
                  <span className="flex items-center gap-1"><RefreshCw className="w-2.5 h-2.5" /> Firestore Latency</span>
                  <span className="text-sky-400 font-bold">{dbLatency}ms</span>
                </div>
              </div>
            </div>

            {/* Multiplayer Session Simulation */}
            {multiplayerActive && (
              <div className="pt-2 border-t border-white/5 text-left">
                <div className="flex items-center gap-1 text-[8px] text-emerald-400 font-black uppercase tracking-widest mb-1.5">
                  <UserCheck className="w-3 h-3 animate-pulse" /> Live Collaborators
                </div>
                <div className="bg-black/80 rounded-lg p-2 h-14 overflow-y-auto text-[7px] font-mono leading-normal space-y-1 scrollbar-none">
                  {multiplayerLogs.length === 0 ? (
                    <p className="text-white/20 italic">Listening for activity...</p>
                  ) : (
                    multiplayerLogs.map((log, idx) => (
                      <p key={idx} className="text-white/60 truncate">{log}</p>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* View Workspace Panels */}
        <div className="flex-1 flex flex-col overflow-hidden relative" key={pathname}>
          {children}
        </div>
      </div>

      {/* Dialog: Create Project */}
      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] max-w-sm text-white p-6 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase italic flex items-center gap-2">
              <ShieldPlus className="w-5 h-5 text-sky-500" /> Create Project
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[9px] italic">Bootstrap a brand new React application context.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Project Name</label>
              <Input value={newProjName} onChange={(e) => setNewProjName(e.target.value)} placeholder="e.g. billing-dashboard" className="h-10 bg-black border-white/10 rounded-lg text-xs font-bold text-white" />
            </div>
            <Button onClick={handleCreateProjectSubmit} disabled={!newProjName.trim()} className="w-full h-11 bg-sky-600 hover:bg-sky-500 rounded-lg font-black uppercase tracking-widest text-white shadow-xl italic">Initialize space</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create File */}
      <Dialog open={isNewFileOpen} onOpenChange={setIsNewFileOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] max-w-sm text-white p-6 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase italic flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-500" /> Add Module
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[9px] italic">Specify filename extension (e.g. Button.jsx, styles.css).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">File Name</label>
              <Input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="components/Header.jsx" className="h-10 bg-black border-white/10 rounded-lg text-xs font-bold text-white" />
            </div>
            <Button onClick={handleCreateFileSubmit} disabled={!newFileName.trim()} className="w-full h-11 bg-sky-600 hover:bg-sky-500 rounded-lg font-black uppercase tracking-widest text-white shadow-xl italic">Create component</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Rename File */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] max-w-sm text-white p-6 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase italic flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-sky-500" /> Rename Module
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[9px] italic">Rename workspace file {renameTarget}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Filename</label>
              <Input value={renameNewName} onChange={(e) => setRenameNewName(e.target.value)} className="h-10 bg-black border-white/10 rounded-lg text-xs font-bold text-white" />
            </div>
            <Button onClick={handleRenameSubmit} disabled={!renameNewName.trim()} className="w-full h-11 bg-sky-600 hover:bg-sky-500 rounded-lg font-black uppercase tracking-widest text-white shadow-xl italic">Apply name</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function XakCodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <XakCodeProvider>
      <IDELayoutInner>{children}</IDELayoutInner>
    </XakCodeProvider>
  );
}

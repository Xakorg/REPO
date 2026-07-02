"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code2, ShieldAlert, Database, Users, Server, Activity, Plus, ArrowRight, LayoutGrid, Rocket, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDevCentreStore } from "@/lib/dev-centre-store";

export default function DevCentreOverview() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const { projects, activeProjectId, setActiveProject, createProject } = useDevCentreStore();
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const devAccountRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "dev_accounts", user.uid);
  }, [firestore, user]);
  const { data: devAccount } = useDoc(devAccountRef);

  const handleCreateDevAccount = async () => {
    if (!firestore || !user) return;
    try {
      await setDoc(doc(firestore, "dev_accounts", user.uid), {
        tier: "Standard Developer",
        joinedAt: new Date().toISOString(),
        customEmails: [],
        teams: []
      });
      toast({ title: "Welcome to Developer Centre!", description: "Your developer profile has been activated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Activation Failed", description: e.message });
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    createProject(newProjectName.trim());
    setNewProjectName("");
    setIsCreating(false);
    toast({ title: "Project Created", description: `Project ${newProjectName} initialized successfully.` });
  };

  const enterProject = (id: string) => {
    setActiveProject(id);
    toast({ title: "Environment Switched", description: "Loading project context..." });
    // In a real app we might push to /dev-centre/projects/[id]
    // Here we use global state and keep them on the dashboard or route them to auth
  };

  if (!devAccount) {
    return (
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex items-center gap-5 border-b border-white/5 pb-8">
          <div className="w-16 h-16 bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Profile Status Check</h1>
            <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest mt-2">Console Access Dashboard</p>
          </div>
        </div>

        <Card className="p-12 md:p-16 bg-black/60 backdrop-blur-xl border-4 border-rose-500/20 rounded-[4rem] relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
            <Code2 className="w-[40rem] h-[40rem] text-rose-500 -rotate-12 translate-x-20 -translate-y-20" />
          </div>
          <div className="relative z-10 space-y-10 max-w-2xl">
            <Badge className="bg-rose-500/20 border-rose-500/40 text-rose-400 font-black uppercase tracking-widest px-6 py-2 text-[10px]">
              Access Blocked // No Dev Token
            </Badge>
            <h2 className="text-6xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-[0.9]">
              Activate <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500">Xakteir Dev</span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed font-medium">
              You must promote your active profile to a Developer Account to gain access to the **Xakteir Dev Console**. Build databases, configure auth providers, spin up VMs, and deploy serverless functions.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <Button onClick={handleCreateDevAccount} className="h-20 px-12 bg-white hover:bg-zinc-200 text-black font-black uppercase text-sm tracking-widest rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
                Create Developer Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-32">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div className="space-y-4">
           <Badge className="bg-blue-500/10 border-blue-500/20 text-blue-400 font-black uppercase tracking-widest px-4 py-1.5 text-[10px]">
              Dashboard
           </Badge>
           <h1 className="text-6xl font-black uppercase italic tracking-tighter text-white leading-none">
             Your Projects
           </h1>
        </div>
        {!isCreating && (
           <Button onClick={() => setIsCreating(true)} className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-1">
             <Plus className="w-5 h-5 mr-2" /> New Project
           </Button>
        )}
      </div>

      {/* Create Project Form */}
      {isCreating && (
        <Card className="glass-card rounded-[3rem] p-10 border-blue-500/30 bg-blue-950/10 shadow-[0_0_50px_rgba(37,99,235,0.1)] relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 p-12 opacity-5"><Rocket className="w-48 h-48 text-blue-500 -rotate-12" /></div>
          <form onSubmit={handleCreateProject} className="relative z-10 space-y-6 max-w-2xl">
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Initialize New Workspace</h3>
              <p className="text-sm text-zinc-400 font-medium mt-2">Enter a project name to instantiate a secure sandbox environment.</p>
            </div>
            <div className="flex gap-4">
              <Input 
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="e.g. Project Apollo"
                className="h-14 bg-black/40 border-white/10 rounded-2xl text-lg font-bold text-white focus:border-blue-500/50"
                autoFocus
              />
              <Button type="submit" className="h-14 px-8 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest rounded-2xl">
                Create
              </Button>
              <Button type="button" onClick={() => setIsCreating(false)} variant="ghost" className="h-14 px-8 text-zinc-400 hover:text-white uppercase font-black text-xs">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Project List */}
      {projects.length === 0 && !isCreating ? (
        <div className="text-center py-20 space-y-6">
          <div className="w-24 h-24 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center border border-white/5">
            <LayoutGrid className="w-10 h-10 text-zinc-600" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-400">No Projects Found</h3>
          <p className="text-zinc-500 max-w-sm mx-auto">Create a project to start building databases, managing auth, and deploying code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(proj => {
            const isActive = activeProjectId === proj.id;
            return (
              <Card 
                key={proj.id} 
                className={cn(
                  "p-8 rounded-[3rem] border-2 relative overflow-hidden group transition-all duration-500 shadow-xl flex flex-col justify-between min-h-[280px]", 
                  isActive 
                    ? "bg-blue-950/20 border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.15)]" 
                    : "bg-black/40 border-white/5 hover:border-white/20 hover:-translate-y-1"
                )}
              >
                {isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px]"></div>}
                
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", isActive ? "bg-blue-500/20 border-blue-500/30" : "bg-white/5 border-white/10")}>
                      <LayoutGrid className={cn("w-6 h-6", isActive ? "text-blue-400" : "text-zinc-400")} />
                    </div>
                    {isActive && <Badge className="bg-blue-500 text-white border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">Active</Badge>}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic text-white tracking-tight">{proj.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Created {new Date(proj.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-8 mt-auto flex items-center gap-4">
                  {!isActive ? (
                    <Button onClick={() => enterProject(proj.id)} className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-xl border border-white/10">
                      Enter Environment
                    </Button>
                  ) : (
                    <Button onClick={() => router.push("/dev-centre/auth")} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl border-none shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                      Go to Auth <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}

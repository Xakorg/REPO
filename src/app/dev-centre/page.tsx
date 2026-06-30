"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code2, ShieldAlert, Rocket, Database, Users, Server, Mail, Activity, Sparkles, Plus, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DevCentreOverview() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

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
      
      {/* Massive Welcome Banner */}
      <Card className="relative overflow-hidden rounded-[4rem] border-0 bg-gradient-to-br from-blue-600 to-indigo-900 p-16 shadow-2xl min-h-[400px] flex flex-col justify-end group">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-30 group-hover:opacity-50 transition-opacity duration-1000 blur-[80px]">
          <div className="absolute right-10 top-10 w-96 h-96 bg-sky-400 rounded-full mix-blend-screen"></div>
          <div className="absolute right-40 bottom-10 w-80 h-80 bg-purple-500 rounded-full mix-blend-screen"></div>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-10">
          <div className="space-y-6">
            <Badge className="bg-white/10 border-white/20 text-white font-black uppercase tracking-widest px-6 py-2 backdrop-blur-md">
              Xakteir Dev Ecosystem
            </Badge>
            <h1 className="text-7xl md:text-[8rem] font-black uppercase italic tracking-tighter text-white leading-none drop-shadow-2xl">
              Project <br/> Alpha
            </h1>
            <p className="text-blue-200 text-xl font-bold uppercase tracking-widest flex items-center gap-3">
              <Sparkles className="w-6 h-6" /> Operating at peak efficiency
            </p>
          </div>
          
          <Button onClick={() => toast({ title: "SDK Initialized", description: "Deploying quickstart environment..." })} className="h-20 px-12 bg-white text-blue-900 hover:bg-blue-50 font-black uppercase text-sm tracking-widest rounded-3xl shadow-2xl hover:scale-105 transition-all">
            <PlayCircle className="w-6 h-6 mr-3" /> Quickstart Guide
          </Button>
        </div>
      </Card>

      {/* Giant Telemetry Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {[
          { title: "Xakteir Dev Auth", val: "1,402", sub: "Active Users", icon: Users, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", shadow: "hover:shadow-[0_0_50px_rgba(251,191,36,0.15)]", path: "/dev-centre/auth" },
          { title: "Xakteir Dev Database", val: "45K", sub: "Reads Today", icon: Database, color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20", shadow: "hover:shadow-[0_0_50px_rgba(56,189,248,0.15)]", path: "/dev-centre/database" },
          { title: "Xakteir Dev VMs", val: "2", sub: "Active Instances", icon: Server, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", shadow: "hover:shadow-[0_0_50px_rgba(192,132,252,0.15)]", path: "/dev-centre/compute/vms" },
          { title: "Network Requests", val: "1.2M", sub: "Last 30 Days", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", shadow: "hover:shadow-[0_0_50px_rgba(52,211,153,0.15)]", path: "/dev-centre/performance" },
        ].map((metric, idx) => (
          <Card 
            key={idx} 
            onClick={() => router.push(metric.path)}
            className={cn(
              "p-10 rounded-[3rem] border-2 bg-black/40 backdrop-blur-xl relative overflow-hidden group cursor-pointer transition-all duration-500 hover:-translate-y-2", 
              metric.border, metric.shadow
            )}
          >
            <div className={cn("absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500", metric.bg)}></div>
            <metric.icon className={cn("absolute bottom-6 right-6 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-500 -rotate-12", metric.color)} />
            
            <div className="relative z-10 space-y-6">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border", metric.bg, metric.border)}>
                <metric.icon className={cn("w-8 h-8", metric.color)} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{metric.title}</p>
                <p className="text-6xl font-black italic text-white tracking-tighter">{metric.val}</p>
                <p className={cn("text-xs font-bold uppercase tracking-widest mt-2", metric.color)}>{metric.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Interactive Quick Launch Zones */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-12 md:p-16 rounded-[4rem] border-2 border-white/5 bg-zinc-950/60 backdrop-blur-xl space-y-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity"><Rocket className="w-64 h-64 text-indigo-500" /></div>
          <div className="relative z-10 space-y-6">
            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Edge Functions</h3>
            <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-md">
              Write and deploy backend logic instantly on the Xakteir Edge Network. Zero server management required.
            </p>
            <Button onClick={() => router.push("/dev-centre/functions")} className="h-16 px-10 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              Deploy Function
            </Button>
          </div>
        </Card>

        <Card className="p-12 md:p-16 rounded-[4rem] border-2 border-white/5 bg-zinc-950/60 backdrop-blur-xl space-y-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity"><Mail className="w-64 h-64 text-teal-500" /></div>
          <div className="relative z-10 space-y-6">
            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Custom Domains</h3>
            <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-md">
              Link your proprietary domains, manage DNS records, and set up MX routing for XakMail instantly.
            </p>
            <Button onClick={() => router.push("/dev-centre/emails")} className="h-16 px-10 bg-teal-500 hover:bg-teal-600 text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_30px_rgba(20,184,166,0.3)]">
              Manage Domains
            </Button>
          </div>
        </Card>
      </div>

    </div>
  );
}

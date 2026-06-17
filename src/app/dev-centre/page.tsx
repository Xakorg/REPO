"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code2, ShieldAlert, LayoutGrid, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

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
          <div className="w-16 h-16 bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Profile Status Check</h1>
            <p className="text-sm text-zinc-400 font-medium">Developer console access dashboard.</p>
          </div>
        </div>

        <Card className="p-10 bg-zinc-950/40 border-4 border-rose-500/15 rounded-[3rem] relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Code2 className="w-96 h-96 text-white" />
          </div>
          <div className="relative z-10 space-y-8 max-w-2xl">
            <Badge className="bg-rose-500/10 border-rose-500/20 text-rose-400 font-black uppercase tracking-widest px-4 py-1">
              Access Blocked
            </Badge>
            <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">
              Your account doesn't have a dev account
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed font-medium">
              To start building plugins, integrating Captcha checks, managing custom email domains, and deploying secure microservices, you must promote your active profile to a Developer Account.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button onClick={handleCreateDevAccount} className="h-16 px-10 bg-primary hover:bg-primary/95 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20">
                Create Developer Account
              </Button>
              <Button onClick={() => router.push('/')} variant="outline" className="h-16 px-10 border-white/10 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-white/5">
                Go back home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <LayoutGrid className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Developer Resource</span>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Welcome to Dev Centre</h1>
        </div>
      </div>

      <div className="p-8 bg-zinc-950/40 border-2 border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Welcome, {user?.displayName || "Developer"}!</h3>
          <p className="text-sm text-zinc-400">All services are operating normally. Your account is on the Developer Tier.</p>
        </div>
        <Button onClick={() => toast({ title: "Quickstart Guide", description: "Loading SDK guides..." })} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider h-11 px-6">
          Developer SDK
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Active VMs</p>
          <p className="text-3xl font-black text-sky-400">0</p>
        </Card>
        <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Custom Domains</p>
          <p className="text-3xl font-black text-emerald-400">{devAccount.customEmails?.length || 0}</p>
        </Card>
        <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Dev Teams</p>
          <p className="text-3xl font-black text-indigo-400">{devAccount.teams?.length || 0}</p>
        </Card>
        <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Monthly Cost</p>
          <p className="text-3xl font-black text-purple-400">$0.00 <span className="text-xs text-zinc-500 font-bold">Free</span></p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl space-y-4">
          <h3 className="text-lg font-black uppercase tracking-tight text-white">Edge Compute</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">Launch serverless functions instantly on Xakteir Edge.</p>
          <Button onClick={() => router.push("/dev-centre/functions")} className="bg-sky-500 hover:bg-sky-600 text-black text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-lg">
            Manage Functions
          </Button>
        </Card>
        
        <Card className="p-6 bg-zinc-950/30 border border-white/5 rounded-2xl space-y-4">
          <h3 className="text-lg font-black uppercase tracking-tight text-white">Ecosystem API</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">Setup client IDs and secrets to use Xakteir Sign-In SSO.</p>
          <Button onClick={() => router.push("/dev-centre/credentials")} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-lg">
            Setup Credentials
          </Button>
        </Card>
      </div>
    </div>
  );
}

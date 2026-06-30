"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Server, Trash2, TerminalSquare, ShieldCheck, Power, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const WebContainerEngine = dynamic(() => import("@/components/compute/WebContainerEngine"), { ssr: false });

export default function VMsBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [vmName, setVmName] = useState("");
  const [osImage, setOsImage] = useState("Ubuntu 22.04 LTS");
  const [instanceType, setInstanceType] = useState("t3.micro (2 vCPU, 1GB RAM)");
  const [isProvisioning, setIsProvisioning] = useState(false);

  const [activeTerminalVm, setActiveTerminalVm] = useState<string | null>(null);

  const vmsRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/vms`);
  }, [user, firestore]);
  const { data: vms } = useCollection(vmsRef);

  const devAccountRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "dev_accounts", user.uid);
  }, [firestore, user]);
  const { data: devAccount } = useDoc(devAccountRef);

  const handleCreateVM = async () => {
    if (!user || !firestore || !vmName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "VM name is required." });
      return;
    }
    
    if (devAccount?.tier === "Standard Developer" && (vms?.length || 0) >= 1) {
      toast({ variant: "destructive", title: "Quota Exceeded", description: "Upgrade to Xakteir Dev Pro to provision more than 1 VM." });
      return;
    }
    
    setIsProvisioning(true);
    try {
      const vmId = vmName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = doc(firestore, `dev_accounts/${user.uid}/vms`, vmId);
      const mockIp = `13.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

      await setDoc(docRef, {
        id: vmId,
        name: vmName,
        os: osImage,
        type: instanceType,
        status: "Running",
        publicIp: mockIp,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Instance Booting", description: `Virtual Machine ${vmName} starting up.` });
      setVmName("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Provisioning Failed", description: e.message });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleDelete = async (vmId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/vms`, vmId));
      if (activeTerminalVm === vmId) setActiveTerminalVm(null);
      toast({ title: "Instance Terminated", description: "Virtual Machine has been destroyed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-12 pb-32">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border-2 border-orange-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            <Server className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev VMs</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mt-1">Scalable Edge Compute Infrastructure</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8 items-start">
        
        {/* Create VM Form */}
        <Card className="glass-card rounded-[2rem] p-10 border-2 border-white/5 bg-black/40 space-y-8 shadow-2xl sticky top-8">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Launch Instance</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Instance Name</label>
              <Input 
                value={vmName}
                onChange={e => setVmName(e.target.value)}
                placeholder="e.g., prod-web-server" 
                className="bg-black/50 border-white/10 h-14 rounded-2xl text-white font-bold italic px-5"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">OS Image</label>
              <select 
                value={osImage}
                onChange={e => setOsImage(e.target.value)}
                className="w-full bg-black/50 border border-white/10 h-14 rounded-2xl px-5 text-white font-bold outline-none hover:border-orange-500/50 transition-colors"
              >
                <option value="Ubuntu 22.04 LTS">Ubuntu 22.04 LTS</option>
                <option value="Debian 12">Debian 12</option>
                <option value="Amazon Linux 2023">Amazon Linux 2023</option>
                <option value="VoltraOS Core">VoltraOS Core (Optimized)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Hardware Type</label>
              <select 
                value={instanceType}
                onChange={e => setInstanceType(e.target.value)}
                className="w-full bg-black/50 border border-white/10 h-14 rounded-2xl px-5 text-white font-bold outline-none hover:border-orange-500/50 transition-colors"
              >
                <option value="t3.micro (2 vCPU, 1GB RAM)">Micro (2 vCPU, 1GB RAM)</option>
                <option value="c5.large (2 vCPU, 4GB RAM)" disabled={devAccount?.tier === "Standard Developer"}>Large Compute (Pro)</option>
                <option value="m5.xlarge (4 vCPU, 16GB RAM)" disabled={devAccount?.tier !== "Enterprise"}>Enterprise Cluster</option>
              </select>
            </div>
            
            <Button 
              onClick={handleCreateVM} 
              disabled={isProvisioning || (devAccount?.tier === "Standard Developer" && (vms?.length || 0) >= 1)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black uppercase text-xs tracking-widest h-14 rounded-2xl mt-4 shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:scale-[1.02]"
            >
              <Power className="w-5 h-5 mr-3" />
              {isProvisioning ? "Booting..." : "Launch Instance"}
            </Button>
          </div>
        </Card>

        {/* VMs List & Terminal Viewer */}
        <div className="space-y-8">
          <Card className="glass-card rounded-[2rem] p-10 border-2 border-white/5 bg-black/40 shadow-2xl">
            <div className="flex justify-between items-end mb-8">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Active Servers</h3>
              <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 font-black px-4 py-1">{vms?.length || 0} Instances</Badge>
            </div>
            
            <div className="space-y-4">
              {vms?.map((vm: any) => (
                <div key={vm.id} className="p-6 bg-zinc-950/60 border-2 border-white/5 rounded-2xl hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group flex flex-col gap-6 shadow-lg">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                        <TerminalSquare className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-xl uppercase tracking-tight">{vm.name}</h4>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-orange-400 mt-1">
                          {vm.type} • {vm.os}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1 font-black uppercase">
                        {vm.status}
                      </Badge>
                      <Button 
                        onClick={() => setActiveTerminalVm(activeTerminalVm === vm.id ? null : vm.id)}
                        className={`h-10 px-6 font-black uppercase tracking-widest text-xs rounded-xl ${
                          activeTerminalVm === vm.id ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        Web SSH
                      </Button>
                      <Button 
                        onClick={() => handleDelete(vm.id)}
                        size="icon" 
                        variant="ghost" 
                        className="w-10 h-10 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    <div className="flex-1 flex items-center gap-3 bg-black/80 px-4 py-3 rounded-xl border border-white/10">
                      <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="text-xs font-mono text-zinc-400 select-all">ssh root@{vm.publicIp}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!vms || vms.length === 0) && (
                <div className="h-64 flex flex-col items-center justify-center space-y-4 text-zinc-500 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
                  <Server className="w-16 h-16 opacity-50" />
                  <p className="text-sm font-bold uppercase tracking-widest">No virtual machines running.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Terminal UI */}
          {activeTerminalVm && (
            <Card className="bg-[#050505] border-2 border-orange-500/30 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)] animate-in slide-in-from-top-8 duration-500">
              <div className="h-12 bg-zinc-900 border-b border-white/10 flex items-center px-6 justify-between">
                <span className="text-[10px] font-mono font-bold text-zinc-400">root@{activeTerminalVm}:~</span>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
              <div className="p-6 h-[500px]">
                <WebContainerEngine vmId={activeTerminalVm} />
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}


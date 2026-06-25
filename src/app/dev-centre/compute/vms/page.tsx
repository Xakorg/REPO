"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Server, Plus, Trash2, TerminalSquare, ShieldCheck, Power } from "lucide-react";
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

  // Load existing VMs from Firestore
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
    
    // Limits
    if (devAccount?.tier === "Standard Developer" && (vms?.length || 0) >= 1) {
      toast({ variant: "destructive", title: "Quota Exceeded", description: "Upgrade to Xakteir Dev Pro to provision more than 1 VM." });
      return;
    }
    
    setIsProvisioning(true);
    
    try {
      const vmId = vmName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = doc(firestore, `dev_accounts/${user.uid}/vms`, vmId);
      
      // Generate mock IP
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

      toast({ title: "Instance Booting", description: `Your Virtual Machine ${vmName} is now starting up.` });
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Server className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Virtual Machines</h1>
          <p className="text-xs text-zinc-400">Scalable cloud compute instances powered by WebContainers.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Create VM Form */}
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Launch Instance</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Instance Name</label>
              <Input 
                value={vmName}
                onChange={e => setVmName(e.target.value)}
                placeholder="e.g., prod-web-server" 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">OS Image</label>
              <select 
                value={osImage}
                onChange={e => setOsImage(e.target.value)}
                className="w-full bg-black/50 border border-white/10 h-12 rounded-xl px-3 text-white font-bold outline-none"
              >
                <option value="Ubuntu 22.04 LTS">Ubuntu 22.04 LTS</option>
                <option value="Debian 12">Debian 12</option>
                <option value="Amazon Linux 2023">Amazon Linux 2023</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Hardware Type</label>
              <select 
                value={instanceType}
                onChange={e => setInstanceType(e.target.value)}
                className="w-full bg-black/50 border border-white/10 h-12 rounded-xl px-3 text-white font-bold outline-none"
              >
                <option value="t3.micro (2 vCPU, 1GB RAM)">Micro (2 vCPU, 1GB RAM)</option>
                <option value="c5.large (2 vCPU, 4GB RAM)" disabled={devAccount?.tier === "Standard Developer"}>Large Compute (Pro)</option>
                <option value="m5.xlarge (4 vCPU, 16GB RAM)" disabled={devAccount?.tier !== "Enterprise"}>Enterprise Cluster</option>
              </select>
            </div>
            
            <Button 
              onClick={handleCreateVM} 
              disabled={isProvisioning || (devAccount?.tier === "Standard Developer" && (vms?.length || 0) >= 1)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2 group"
            >
              <Power className="w-4 h-4 mr-2" />
              {isProvisioning ? "Booting..." : "Launch Instance"}
            </Button>
          </div>
        </Card>

        {/* VMs List & Terminal Viewer */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Active Servers</h3>
            
            <div className="space-y-4">
              {vms?.map((vm: any) => (
                <div key={vm.id} className="p-5 bg-black/40 border border-white/5 rounded-xl hover:border-orange-500/30 transition-colors group flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                        <TerminalSquare className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{vm.name}</h4>
                        <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          {vm.type} • {vm.os}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase hidden sm:flex">
                        {vm.status}
                      </Badge>
                      <Button 
                        onClick={() => setActiveTerminalVm(activeTerminalVm === vm.id ? null : vm.id)}
                        variant="outline" 
                        className="h-8 border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
                      >
                        Web SSH
                      </Button>
                      <Button 
                        onClick={() => handleDelete(vm.id)}
                        size="icon" 
                        variant="ghost" 
                        className="w-8 h-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    <div className="flex-1 flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-lg border border-white/5">
                      <ShieldCheck className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="text-[10px] font-mono text-zinc-400 select-all">ssh root@{vm.publicIp}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!vms || vms.length === 0) && (
                <div className="h-48 flex flex-col items-center justify-center space-y-3 text-zinc-500 opacity-50">
                  <Server className="w-12 h-12" />
                  <p className="text-xs font-bold">No virtual machines running.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Terminal UI */}
          {activeTerminalVm && (
            <Card className="bg-[#000000] border border-orange-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/5 animate-in slide-in-from-top-4">
              <div className="h-8 bg-zinc-900 border-b border-white/10 flex items-center px-4 justify-between">
                <span className="text-[10px] font-mono text-zinc-400">root@{activeTerminalVm}:~</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                </div>
              </div>
              <div className="p-4 h-96">
                <WebContainerEngine vmId={activeTerminalVm} />
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}

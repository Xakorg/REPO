"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Plus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmailsBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [customDomainName, setCustomDomainName] = useState("");
  const [customEmailName, setCustomEmailName] = useState("");
  const [customEmailRouting, setCustomEmailRouting] = useState("");

  const devAccountRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "dev_accounts", user.uid);
  }, [firestore, user]);
  
  const { data: devAccount } = useDoc(devAccountRef);

  const handleAddCustomEmail = async () => {
    if (!firestore || !user || !customDomainName.trim() || !customEmailName.trim() || !devAccountRef) return;
    try {
      const newEmail = {
        id: "email_" + Math.random().toString(36).substring(2, 7),
        domain: customDomainName,
        email: `${customEmailName}@${customDomainName}`,
        verified: true,
        routes: customEmailRouting || "Main Inbox"
      };
      await updateDoc(devAccountRef, {
        customEmails: arrayUnion(newEmail)
      });
      setCustomDomainName("");
      setCustomEmailName("");
      setCustomEmailRouting("");
      toast({ title: "Domain Bound Successfully", description: `Routed email ${newEmail.email} to ${newEmail.routes}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  if (!devAccount) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Mail className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Custom Email Routing</h1>
          <p className="text-xs text-zinc-400">Manage domain bounds and forward incoming emails to external inboxes.</p>
        </div>
      </div>

      <Card className="p-8 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-6 max-w-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Bind Custom Domain</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Domain Name</label>
            <Input 
              value={customDomainName}
              onChange={e => setCustomDomainName(e.target.value)}
              placeholder="example.com" 
              className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Alias</label>
            <Input 
              value={customEmailName}
              onChange={e => setCustomEmailName(e.target.value)}
              placeholder="hello" 
              className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Destination (Forward To)</label>
            <Input 
              value={customEmailRouting}
              onChange={e => setCustomEmailRouting(e.target.value)}
              placeholder="my.personal@gmail.com" 
              className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
            />
          </div>
        </div>
        <Button onClick={handleAddCustomEmail} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-xs tracking-widest h-12 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Bind Domain Route
        </Button>
      </Card>

      <Card className="p-8 bg-zinc-950/40 border border-white/5 rounded-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Active Routes</h3>
        <div className="space-y-3">
          {devAccount.customEmails?.map((email: any) => (
            <div key={email.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl hover:border-emerald-500/30 transition-colors gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{email.email}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Domain: {email.domain}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-lg border border-white/5">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Forwards To</span>
                <span className="text-xs font-bold text-emerald-400">{email.routes}</span>
              </div>
            </div>
          ))}
          {(!devAccount.customEmails || devAccount.customEmails.length === 0) && (
            <p className="text-xs text-zinc-500 italic text-center py-8">No domains bound yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

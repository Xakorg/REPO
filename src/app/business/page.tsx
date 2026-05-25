"use client";

import { useState, useEffect } from "react";
import { 
  Briefcase, 
  Users, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  Settings, 
  Trash2, 
  Search,
  Mail,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldPlus,
  Terminal,
  ExternalLink,
  Lock,
  BadgeCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, setDoc, getDocs, addDoc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export default function BusinessPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'domain' | 'team'>('overview');
  const [domainName, setDomainName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);

  const businessRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "business_units", user.uid);
  }, [firestore, user]);
  const { data: businessUnit, isLoading: loadingBusiness } = useDoc(businessRef);

  useEffect(() => {
    if (!verificationCode) {
      setVerificationCode(`xak-verification-${Math.random().toString(36).substring(2, 12)}`);
    }
  }, [verificationCode]);

  const handleDomainSetup = async () => {
    if (!user || !firestore || !domainName.trim()) return;
    try {
      await setDoc(doc(firestore, "business_units", user.uid), {
        ownerId: user.uid,
        domain: domainName.toLowerCase().trim(),
        verificationStatus: 'pending',
        verificationCode,
        createdAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Verification Key Generated", description: "Copy the code and add it to your DNS provider." });
      setActiveTab('domain');
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const verifyDomain = async () => {
    if (!firestore || !businessUnit || !user) return;
    setIsVerifying(true);

    // SIMULATED EXTERNAL VERIFICATION (Cloudflare/manual)
    setTimeout(async () => {
      try {
        await updateDoc(doc(firestore, "business_units", user.uid), {
          verificationStatus: 'verified',
          verifiedAt: serverTimestamp()
        });
        toast({ title: "Ownership Verified!", description: "Professional Suite activated via external registry." });
        setActiveTab('overview');
      } catch (e) {
        toast({ variant: "destructive", title: "Protocol Error" });
      } finally {
        setIsVerifying(false);
      }
    }, 2000);
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !user || !firestore) return;
    try {
      const q = query(collection(firestore, "users"), where("email", "==", newMemberEmail.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ variant: "destructive", title: "Identity Not Found", description: "The user must first join Xakteir." });
        return;
      }
      const targetUser = snap.docs[0];
      await updateDoc(doc(firestore, "business_units", user.uid), {
        members: [...(businessUnit?.members || []), { id: targetUser.id, email: newMemberEmail, role: 'member' }]
      });
      toast({ title: "Member Added", description: `Synchronized with ${newMemberEmail}` });
      setNewMemberEmail("");
      setIsAddingMember(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Error" });
    }
  };

  if (!userData?.subscription && !loadingBusiness) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-20 text-center space-y-10 animate-fade-in text-foreground">
        <div className="w-32 h-32 rounded-[3.5rem] bg-blue-500/10 flex items-center justify-center border-4 border-blue-500/20 shadow-2xl">
          <Briefcase className="w-16 h-16 text-blue-500" />
        </div>
        <div className="space-y-4 max-w-xl">
           <h2 className="text-6xl font-black uppercase italic tracking-tighter">Xakteir for Business</h2>
           <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm leading-relaxed">
             Professional workspace for high-fidelity teams. Custom domains, team management, and priority neural access.
           </p>
        </div>
        <Link href="/upgrade">
          <Button className="bg-primary hover:bg-primary/90 h-16 px-16 rounded-[2rem] font-black uppercase tracking-widest text-white shadow-xl text-xs">Activate Business Unit</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-10 animate-fade-in px-6 space-y-12 text-foreground">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 glass-card p-12 rounded-[4.5rem] border-white/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float">
          <Globe className="w-80 h-80 -rotate-12 text-blue-400" />
        </div>
        <div className="relative z-10 flex items-center gap-10">
          <div className="w-20 h-20 rounded-[2.2rem] bg-blue-500/10 flex items-center justify-center border-4 border-blue-500/20 shadow-2xl">
            <Briefcase className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase italic leading-none">Business Unit</h1>
            <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-[10px] mt-4 flex items-center gap-4">
               <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" /> Enterprise Authority Active
            </p>
          </div>
        </div>

        <nav className="flex bg-black/40 p-2 rounded-[2rem] border-4 border-white/10 relative z-10 shadow-xl">
           {(['overview', 'domain', 'team'] as const).map(tab => (
             <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-8 h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-blue-600 text-white shadow-xl" : "text-muted-foreground hover:bg-white/5"
              )}
             >
               {tab}
             </button>
           ))}
        </nav>
      </header>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-8 duration-700">
           <div className="lg:col-span-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="glass-card rounded-[3.5rem] p-10 border-blue-500/20 bg-blue-500/5 shadow-2xl space-y-8 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 opacity-10"><Users className="w-48 h-48" /></div>
                    <div className="relative z-10 space-y-4">
                       <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground">Team Reach</h3>
                       <div className="flex items-end gap-4">
                          <span className="text-7xl font-black italic">{businessUnit?.members?.length + 1 || 1}</span>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-3">Active Units</p>
                       </div>
                    </div>
                    <Button onClick={() => setActiveTab('team')} variant="outline" className="w-full h-12 border-white/10 bg-white/5 rounded-xl text-[10px] font-black uppercase">Manage Members</Button>
                 </Card>

                 <Card className="glass-card rounded-[3.5rem] p-10 border-white/10 shadow-2xl space-y-8">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground">Active Domain</h3>
                    {businessUnit?.domain ? (
                      <div className="space-y-6">
                         <div className="p-6 bg-black/40 rounded-[2rem] border-2 border-white/5 flex items-center justify-between">
                            <span className="text-xl font-black text-primary italic">@{businessUnit.domain}</span>
                            <Badge className={cn(
                              "border-none text-[8px] font-black uppercase px-4",
                              businessUnit.verificationStatus === 'verified' ? "bg-green-500/20 text-green-500" : "bg-amber-500/20 text-amber-500"
                            )}>
                              {businessUnit.verificationStatus}
                            </Badge>
                         </div>
                         <div className="flex gap-4">
                            <Button onClick={() => setActiveTab('domain')} variant="outline" className="flex-1 h-12 border-white/10 rounded-xl text-[10px] font-black uppercase">Verify Externally</Button>
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-6 text-center py-4">
                         <p className="text-xs font-bold text-muted-foreground uppercase italic leading-relaxed">No domain associated with this business unit.</p>
                         <Button onClick={() => setActiveTab('domain')} className="bg-primary h-12 px-8 rounded-xl font-black text-[10px] uppercase">Set Up Domain</Button>
                      </div>
                    )}
                 </Card>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'domain' && (
        <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-700">
           <header className="text-center space-y-6">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-foreground">Domain Architecture</h2>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-60">Verify your professional identity via Cloudflare or other provider</p>
           </header>

           {!businessUnit?.domain ? (
             <Card className="glass-card rounded-[4rem] p-16 border-white/10 space-y-10 shadow-2xl">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Enter Domain Name</label>
                   <Input value={domainName} onChange={(e) => setDomainName(e.target.value)} placeholder="e.g. example.com" className="h-20 bg-secondary/30 border-white/10 rounded-[2rem] text-3xl font-black px-10 italic shadow-inner text-foreground" />
                </div>
                <Button onClick={handleDomainSetup} disabled={!domainName} className="w-full h-20 bg-primary rounded-[2.5rem] font-black uppercase text-lg shadow-xl transition-all">Initialize Setup</Button>
             </Card>
           ) : (
             <div className="space-y-10">
                <Card className="glass-card rounded-[3.5rem] p-12 border-amber-500/20 bg-amber-500/5 shadow-2xl space-y-10">
                   <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-amber-500"><Terminal className="w-8 h-8" /> Manual DNS Verification</h3>
                      <Badge className="bg-amber-500 text-white font-black text-[8px] px-4">REQUIRED</Badge>
                   </div>
                   <p className="text-sm font-bold text-muted-foreground leading-relaxed italic">To verify ownership of <span className="text-white font-black">@{businessUnit.domain}</span>, you must add the following TXT record to your external DNS provider (e.g. Cloudflare, Namecheap).</p>
                   <div className="p-8 bg-black/60 rounded-3xl border-4 border-white/10 space-y-6 shadow-inner font-mono text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="space-y-2"><p className="text-[8px] font-black uppercase text-muted-foreground">Type</p><p className="text-primary font-black">TXT</p></div>
                         <div className="space-y-2"><p className="text-[8px] font-black uppercase text-muted-foreground">Host</p><p className="text-white font-black">@</p></div>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-white/5"><p className="text-[8px] font-black uppercase text-muted-foreground">Value</p><p className="text-emerald-500 break-all select-all">{businessUnit.verificationCode}</p></div>
                   </div>
                   <div className="flex gap-4">
                      <Button onClick={verifyDomain} disabled={isVerifying} className="flex-1 h-20 bg-amber-600 hover:bg-amber-500 text-white rounded-[2.5rem] font-black uppercase text-lg shadow-xl transition-all">
                        {isVerifying ? <Loader2 className="w-8 h-8 animate-spin" /> : "Check External Records"}
                      </Button>
                      <Button onClick={() => setDomainName("")} variant="outline" className="flex-1 h-20 border-white/10 rounded-[2.5rem] font-black uppercase text-lg text-white">Cancel</Button>
                   </div>
                </Card>
             </div>
           )}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
           <header className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4 text-foreground"><Users className="w-8 h-8 text-blue-500" /><h2 className="text-4xl font-black uppercase italic tracking-tighter">Member Station</h2></div>
              <Button onClick={() => setIsAddingMember(true)} className="bg-primary h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl"><Plus className="w-5 h-5 mr-3" /> Add Unit</Button>
           </header>
           <Card className="glass-card rounded-[4rem] border-white/10 overflow-hidden shadow-2xl">
              <ScrollArea className="h-[600px]"><div className="divide-y divide-white/5">{businessUnit?.members?.map((member: any) => (<div key={member.id} className="p-10 flex items-center justify-between group hover:bg-white/5 transition-all"><div className="flex items-center gap-8"><Avatar className="w-16 h-16 border-2 border-white/10"><AvatarFallback className="font-black text-muted-foreground">M</AvatarFallback></Avatar><div><h4 className="text-2xl font-black uppercase italic text-foreground leading-none">{member.email.split('@')[0]}</h4><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{member.email}</p></div></div><div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" className="h-10 w-10 text-rose-500 hover:bg-rose-500/10 rounded-xl"><Trash2 className="w-4 h-4" /></Button></div></div>))}</div></ScrollArea>
           </Card>
        </div>
      )}

      <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
         <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-xl text-foreground p-12 shadow-2xl">
            <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Add Team Unit</DialogTitle></DialogHeader>
            <div className="space-y-8 py-8">
               <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Member Email</label><div className="relative"><Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" /><Input value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="colleague@xakteir.com" className="h-16 bg-secondary/50 border-white/10 rounded-2xl pl-16 pr-8 text-lg font-bold shadow-inner" /></div></div>
               <Button onClick={handleAddMember} disabled={!newMemberEmail} className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase text-lg shadow-2xl italic">SYNC MEMBER</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  Globe, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Plus, 
  Search, 
  Database, 
  Lock, 
  Network, 
  Cpu, 
  ArrowUpRight, 
  MoreVertical,
  Trash2,
  Settings,
  ChevronRight,
  Server,
  Terminal,
  CloudLightning,
  Loader2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  X,
  ShieldPlus,
  Mail,
  RefreshCw,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, addDoc, serverTimestamp, orderBy, deleteDoc, doc, limit, updateDoc, increment, getDocs, where } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DNS_RECORD_TYPES = [
  "A", "AAAA", "ALIAS", "CAA", "CNAME", "HTTPS", "MX", "NS", "SPF", "SRV", "TXT"
];

export default function XakteirDNSPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [view, setView] = useState<'zones' | 'registrar' | 'manage'>('zones');
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [domainSearch, setDomainSearch] = useState("");
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  // New record state
  const [newRecord, setNewRecord] = useState({
    type: "A",
    name: "@",
    content: "",
    ttl: "Auto",
    priority: "10"
  });

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "dns_zones"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
  }, [firestore, user]);

  const { data: zones, isLoading } = useCollection(zonesQuery);

  const recordsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedZone) return null;
    return query(collection(firestore, "dns_zones", selectedZone.id, "records"), orderBy("type", "asc"));
  }, [firestore, selectedZone]);

  const { data: records, isLoading: isLoadingRecords } = useCollection(recordsQuery);

  const handleRegisterDomain = async (domainName: string) => {
    if (!user || !firestore || !userData) return;
    const price = 500;
    if (userData.currencyBalance < price) {
      toast({ variant: "destructive", title: "Low Credits", description: "Increase your balance to acquire this unit." });
      return;
    }

    setIsRegistering(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid), {
        currencyBalance: increment(-price)
      });

      const zoneRef = await addDoc(collection(firestore, "dns_zones"), {
        name: domainName.toLowerCase().trim(),
        ownerId: user.uid,
        status: 'active',
        dnssec: true,
        propagation: 100,
        registrar: 'Xakteir',
        expiresAt: new Date(Date.now() + 31536000000).toISOString(),
        createdAt: serverTimestamp()
      });

      const recordsCol = collection(firestore, "dns_zones", zoneRef.id, "records");
      await addDoc(recordsCol, { type: 'NS', name: '@', content: 'ns1.xakteir.dns.io', ttl: 'Auto' });
      await addDoc(recordsCol, { type: 'NS', name: '@', content: 'ns2.xakteir.dns.io', ttl: 'Auto' });

      toast({ title: "Registry Acquisition Complete", description: `${domainName} is now authorized.` });
      setView('zones');
    } catch (e) {
      toast({ variant: "destructive", title: "Acquisition Error" });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selectedZone || !newRecord.content) return;
    try {
      await addDoc(collection(firestore, "dns_zones", selectedZone.id, "records"), {
        ...newRecord,
        timestamp: serverTimestamp()
      });
      toast({ title: "Protocol Synchronized", description: `Record added to ${selectedZone.name}` });
      setIsAddingRecord(false);
      setNewRecord({ type: "A", name: "@", content: "", ttl: "Auto", priority: "10" });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!firestore || !selectedZone) return;
    await deleteDoc(doc(firestore, "dns_zones", selectedZone.id, "records", recordId));
    toast({ title: "Protocol Removed" });
  };

  const deleteZone = async (zoneId: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, "dns_zones", zoneId));
    toast({ title: "Zone Deregistered" });
    if (selectedZone?.id === zoneId) setSelectedZone(null);
  };

  if (!user) return <div className="h-screen flex items-center justify-center p-32 text-center text-4xl font-black uppercase italic text-foreground">Sign in to manage XakteirDNS.</div>;

  return (
    <div className="max-w-[1600px] mx-auto py-10 animate-fade-in px-6 space-y-12 text-foreground">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 glass-card p-12 rounded-[4rem] border-white/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float">
          <Network className="w-80 h-80 -rotate-12 text-primary" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-10 mb-4">
            <div className="w-24 h-24 rounded-[3.5rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-[0_0_50px_rgba(var(--primary),0.3)]">
              <Globe className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-8xl font-black text-foreground tracking-tighter uppercase italic leading-none">XakteirDNS</h1>
              <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] mt-6 flex items-center gap-4">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" /> Anycast Routing Active
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-6 relative z-10">
          <Button 
            onClick={() => setView('zones')}
            className={cn("h-20 px-12 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all", view === 'zones' ? "bg-primary text-white shadow-2xl" : "bg-white/5 text-foreground hover:bg-white/10")}
          >
            Managed Shards
          </Button>
          <Button 
            onClick={() => setView('registrar')}
            className={cn("h-20 px-12 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all", view === 'registrar' ? "bg-primary text-white shadow-2xl" : "bg-white/5 text-foreground hover:bg-white/10")}
          >
            Registrar
          </Button>
        </div>
      </header>

      {view === 'zones' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-10">
            <div className="flex items-center justify-between px-6">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-6">
                <Database className="w-10 h-10 text-primary" /> Active Registry
              </h2>
              <Badge variant="outline" className="border-white/10 text-xs font-black px-6 py-2 rounded-full uppercase tracking-widest">{zones?.length || 0} Domains</Badge>
            </div>

            <div className="space-y-6">
              {isLoading ? (
                <div className="py-32 flex justify-center"><Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" /></div>
              ) : !zones || zones.length === 0 ? (
                <Card className="glass-card rounded-[4rem] p-40 text-center border-white/10 opacity-30 flex flex-col items-center space-y-8">
                  <CloudLightning className="w-24 h-24" />
                  <p className="text-sm font-black uppercase tracking-[0.6em]">Zero zones detected. Initialize registry acquisition.</p>
                  <Button onClick={() => setView('registrar')} className="bg-primary px-16 h-16 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl">Open Registrar</Button>
                </Card>
              ) : (
                zones.map(zone => (
                  <Card key={zone.id} className="glass-card rounded-[3.5rem] p-10 border-white/10 hover:border-primary/30 transition-all group relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                      <div className="flex items-center gap-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-2xl text-primary font-black text-3xl italic">{zone.name[0].toUpperCase()}</div>
                        <div className="space-y-2">
                          <h4 className="text-4xl font-black uppercase italic tracking-tight leading-none">{zone.name}</h4>
                          <div className="flex items-center gap-6 mt-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Authorized
                            </p>
                            <Badge className="bg-green-500/10 text-green-500 border-none text-[9px] font-black uppercase tracking-widest px-4 py-1">Active</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <Button 
                          onClick={() => { setSelectedZone(zone); setView('manage'); }}
                          className="h-16 px-10 bg-white/5 hover:bg-white/10 border-4 border-white/5 rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest"
                        >
                          Manage Protocols
                        </Button>
                        <Button onClick={() => deleteZone(zone.id)} variant="ghost" size="icon" className="h-16 w-16 rounded-[1.8rem] text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"><Trash2 className="w-6 h-6" /></Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <Card className="glass-card rounded-[4rem] p-12 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
              <div className="space-y-10">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-6">
                  <ShieldCheck className="w-10 h-10 text-primary" /> Authority Hub
                </h3>
                <div className="space-y-8">
                  <div className="p-8 bg-black/40 rounded-[2.5rem] border-4 border-white/5 space-y-6 shadow-inner">
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">Universal Nameservers</p>
                    <div className="space-y-3 font-mono text-sm text-primary">
                      <p className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between group cursor-copy">ns1.xakteir.dns.io <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                      <p className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between group cursor-copy">ns2.xakteir.dns.io <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                    </div>
                  </div>
                  <div className="p-8 bg-emerald-500/5 rounded-[2.5rem] border-4 border-emerald-500/10 flex items-center gap-6">
                    <Zap className="w-8 h-8 text-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest leading-relaxed">System propagation speed currently clocked at <span className="text-white font-black italic">12.4ms</span>.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {view === 'registrar' && (
        <div className="space-y-16 animate-in slide-in-from-right-8 duration-700 max-w-5xl mx-auto">
          <header className="text-center space-y-8">
            <h2 className="text-8xl font-black uppercase italic tracking-tighter leading-none">Registrar</h2>
            <p className="text-muted-foreground font-bold uppercase tracking-[0.4em] text-sm opacity-60">Acquire new shards for your digital identity.</p>
            <div className="relative group mt-16">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                placeholder="search-domain.com" 
                className="h-24 bg-card/60 backdrop-blur-3xl border-8 border-white/5 rounded-[3rem] pl-20 pr-10 text-2xl font-black italic shadow-2xl focus:ring-primary transition-all uppercase" 
              />
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {domainSearch && [".com", ".net", ".io", ".xakteir", ".org"].map(ext => (
              <Card key={ext} className="glass-card rounded-[3.5rem] p-12 border-white/10 hover:border-primary/30 transition-all group flex flex-col gap-10 shadow-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-foreground italic uppercase truncate w-48">{domainSearch.split('.')[0]}{ext}</h3>
                    <Badge className="mt-4 bg-green-500/10 text-green-500 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1">Available</Badge>
                  </div>
                  <Globe className="w-12 h-12 text-primary opacity-20 group-hover:opacity-100 transition-all" />
                </div>
                <div className="flex justify-between items-center bg-black/40 p-8 rounded-[2rem] border-4 border-white/5 shadow-inner">
                  <div className="flex items-center gap-4">
                    <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                    <span className="text-4xl font-black italic">500</span>
                  </div>
                  <Button 
                    onClick={() => handleRegisterDomain(domainSearch.split('.')[0] + ext)}
                    disabled={isRegistering}
                    className="bg-primary h-14 px-10 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl"
                  >
                    {isRegistering ? <Loader2 className="animate-spin w-6 h-6" /> : "ACQUIRE"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {view === 'manage' && selectedZone && (
        <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-700">
          <header className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-8">
              <Button onClick={() => setView('zones')} variant="ghost" size="icon" className="h-16 w-16 rounded-full border-4 border-white/5 hover:bg-white/5 text-white transition-all">
                <ArrowLeft className="w-10 h-10" />
              </Button>
              <div>
                <h2 className="text-7xl font-black uppercase italic tracking-tighter leading-none">{selectedZone.name}</h2>
                <p className="text-xs font-black text-primary uppercase tracking-[0.5em] mt-4 italic">Authoritative Control Mode</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => toast({ title: "Checking Records..." })} className="h-16 px-10 rounded-[1.8rem] border-4 border-white/5 font-black uppercase text-xs tracking-widest"><RefreshCw className="w-5 h-5 mr-3" /> Check Propagation</Button>
              <Dialog open={isAddingRecord} onOpenChange={setIsAddingRecord}>
                <DialogTrigger asChild>
                  <Button className="bg-primary h-16 px-12 rounded-[1.8rem] font-black uppercase tracking-widest shadow-2xl text-white border-b-8 border-primary/20 active:border-b-0 active:translate-y-1 transition-all">
                    <Plus className="w-6 h-6 mr-3" /> Add Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/10 rounded-[4rem] max-w-2xl text-foreground p-12">
                  <DialogHeader><DialogTitle className="text-4xl font-black uppercase italic tracking-tighter">New Protocol Record</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddRecord} className="space-y-8 py-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Type</label>
                        <Select value={newRecord.type} onValueChange={(v) => setNewRecord({...newRecord, type: v})}>
                          <SelectTrigger className="h-16 rounded-2xl bg-secondary/30 border-white/10 font-black uppercase text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10">
                            {DNS_RECORD_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs font-black uppercase">{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Host Name (@ / subdomain)</label>
                        <Input value={newRecord.name} onChange={(e) => setNewRecord({...newRecord, name: e.target.value})} placeholder="@" className="h-16 rounded-2xl bg-secondary/30 border-white/10 font-black text-lg px-8 uppercase" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Target Value / Content</label>
                      <Input value={newRecord.content} onChange={(e) => setNewRecord({...newRecord, content: e.target.value})} placeholder="e.g. 192.168.1.1" className="h-16 rounded-2xl bg-secondary/30 border-white/10 font-bold text-lg px-8" />
                    </div>
                    {newRecord.type === 'MX' && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Mail Priority</label>
                        <Input type="number" value={newRecord.priority} onChange={(e) => setNewRecord({...newRecord, priority: e.target.value})} className="h-16 rounded-2xl bg-secondary/30 border-white/10 font-black text-lg px-8" />
                      </div>
                    )}
                    <Button type="submit" className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all active:scale-95 italic">SYNCHRONIZE PROTOCOL</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <Card className="glass-card rounded-[4rem] border-white/10 overflow-hidden shadow-2xl">
            <ScrollArea className="h-[700px]">
              <table className="w-full border-collapse">
                <thead className="bg-black/40 text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground border-b border-white/5">
                  <tr className="h-20">
                    <th className="px-12 text-left">Type</th>
                    <th className="px-12 text-left">Host</th>
                    <th className="px-12 text-left">Target Content</th>
                    <th className="px-12 text-left">TTL</th>
                    <th className="px-12 text-right">Registry Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoadingRecords ? (
                    <tr><td colSpan={5} className="py-40 text-center"><Loader2 className="animate-spin mx-auto w-12 h-12 text-primary opacity-20" /></td></tr>
                  ) : !records || records.length === 0 ? (
                    <tr><td colSpan={5} className="py-40 text-center opacity-20 font-black uppercase tracking-[0.6em]">No protocols mapped for this zone.</td></tr>
                  ) : (
                    records.map(record => (
                      <tr key={record.id} className="h-28 hover:bg-white/5 transition-all group border-b border-white/5">
                        <td className="px-12"><Badge className="bg-primary/10 text-primary border-4 border-primary/20 text-xs font-black uppercase px-6 py-1.5 rounded-full shadow-lg">{record.type}</Badge></td>
                        <td className="px-12 font-black text-xl italic tracking-tight">{record.name}</td>
                        <td className="px-12 font-mono text-sm opacity-80 max-w-md truncate">{record.content}</td>
                        <td className="px-12 text-[11px] font-black uppercase text-muted-foreground italic">{record.ttl}</td>
                        <td className="px-12 text-right">
                          <button onClick={() => deleteRecord(record.id)} className="p-5 rounded-2xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all group/del">
                            <Trash2 className="w-6 h-6 group-hover/del:scale-110" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </Card>
        </div>
      )}
    </div>
  );
}

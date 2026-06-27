"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Plus, Trash2, Server, Settings, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DNSDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isAdmin = user?.email === 'admin@xakteir.com' || user?.email === 'ridwan123456789100@gmail.com';

  // Domain states
  const [newDomainName, setNewDomainName] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<any>(null);

  // Record states
  const [newRecordType, setNewRecordType] = useState("A");
  const [newRecordName, setNewRecordName] = useState("@");
  const [newRecordValue, setNewRecordValue] = useState("");
  const [newRecordTTL, setNewRecordTTL] = useState("3600");
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  const domainsQuery = useMemoFirebase(() => {
    return firestore && user ? query(
      collection(firestore, "dns_domains"),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc")
    ) : null;
  }, [firestore, user]);
  
  const { data: domains, isLoading: domainsLoading } = useCollection(domainsQuery);

  const recordsQuery = useMemoFirebase(() => {
    return firestore && selectedDomain ? query(
      collection(firestore, "dns_records"),
      where("domainId", "==", selectedDomain.id),
      orderBy("createdAt", "desc")
    ) : null;
  }, [firestore, selectedDomain]);
  
  const { data: records, isLoading: recordsLoading } = useCollection(recordsQuery);

  if (!mounted) return null;
  
  // Strict admin lock
  if (!user || !isAdmin) {
    notFound();
  }

  const handleAddDomain = async () => {
    if (!firestore || !user || !newDomainName.trim()) return;
    setIsAddingDomain(true);
    try {
      await addDoc(collection(firestore, "dns_domains"), {
        name: newDomainName.toLowerCase().trim(),
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      setNewDomainName("");
      toast({ title: "Domain Registered", description: `Successfully added ${newDomainName} to XakteirDNS.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to add domain.", variant: "destructive" });
    }
    setIsAddingDomain(false);
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "dns_domains", domainId));
      if (selectedDomain?.id === domainId) setSelectedDomain(null);
      toast({ title: "Domain Deleted" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete domain.", variant: "destructive" });
    }
  };

  const handleAddRecord = async () => {
    if (!firestore || !selectedDomain || !newRecordValue.trim()) return;
    setIsAddingRecord(true);
    try {
      await addDoc(collection(firestore, "dns_records"), {
        domainId: selectedDomain.id,
        domainName: selectedDomain.name,
        type: newRecordType,
        name: newRecordName.toLowerCase().trim(),
        value: newRecordValue.trim(),
        ttl: parseInt(newRecordTTL) || 3600,
        createdAt: serverTimestamp()
      });
      setNewRecordName("@");
      setNewRecordValue("");
      toast({ title: "Record Added", description: `Added ${newRecordType} record to ${selectedDomain.name}.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to add record.", variant: "destructive" });
    }
    setIsAddingRecord(false);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "dns_records", recordId));
      toast({ title: "Record Deleted" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete record.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-12 relative z-10 pt-10">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase flex items-center gap-4">
              <Server className="w-12 h-12 text-primary" /> Xakteir<span className="text-primary">DNS</span>
            </h1>
            <p className="text-muted-foreground font-black uppercase tracking-widest text-xs mt-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
              Global Nameserver Network
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Domains Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card bg-black/40 border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-xl">
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="font-black uppercase tracking-widest">Managed Domains</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="example.com" 
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    className="bg-black/60 border-white/10 rounded-xl h-12 font-bold"
                  />
                  <Button onClick={handleAddDomain} disabled={isAddingDomain} className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-black">
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-2 mt-4 max-h-[500px] overflow-y-auto pr-2">
                  {domainsLoading ? (
                    <div className="text-center p-8 opacity-50 font-black tracking-widest text-xs uppercase">Loading...</div>
                  ) : domains?.length === 0 ? (
                    <div className="text-center p-8 opacity-50 font-black tracking-widest text-xs uppercase">No Domains</div>
                  ) : domains?.map(d => (
                    <div 
                      key={d.id}
                      onClick={() => setSelectedDomain(d)}
                      className={cn(
                        "p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                        selectedDomain?.id === d.id 
                          ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.2)]" 
                          : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <span className="font-black italic text-lg">{d.name}</span>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteDomain(d.id); }} className="h-8 w-8 text-rose-500 hover:bg-rose-500/20">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ad Placeholder */}
            <Card className="glass-card bg-black/40 border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-xl flex items-center justify-center h-64 border-dashed relative group">
                <div className="text-center opacity-30 group-hover:opacity-100 transition-opacity">
                    <p className="font-black uppercase tracking-widest text-[10px]">Advertisement Space</p>
                    <p className="text-xs italic font-medium mt-1">Google AdSense Integration</p>
                </div>
            </Card>
          </div>

          {/* Records Panel */}
          <div className="lg:col-span-2">
            {!selectedDomain ? (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-30 border-2 border-dashed border-white/10 rounded-[3rem]">
                <Settings className="w-16 h-16 mb-4 animate-spin-slow" />
                <h3 className="text-xl font-black uppercase tracking-widest">Select a Domain</h3>
                <p className="text-sm font-medium mt-2">Choose a domain from the left to configure DNS records.</p>
              </div>
            ) : (
              <Card className="glass-card bg-black/40 border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl h-full flex flex-col">
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black italic tracking-tighter uppercase">{selectedDomain.name}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Nameservers: ns1.xakteir.com, ns2.xakteir.com</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 px-4 py-1.5 border-none font-black tracking-widest uppercase">
                      Active
                    </Badge>
                  </div>
                </div>

                <div className="p-8 flex-1">
                  {/* Add Record Form */}
                  <div className="grid grid-cols-12 gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="col-span-2">
                      <Select value={newRecordType} onValueChange={setNewRecordType}>
                        <SelectTrigger className="bg-black/60 border-white/10 h-11 font-black">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-white/10 text-white font-black">
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="CNAME">CNAME</SelectItem>
                          <SelectItem value="TXT">TXT</SelectItem>
                          <SelectItem value="MX">MX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input placeholder="Name (@ for root)" value={newRecordName} onChange={(e) => setNewRecordName(e.target.value)} className="bg-black/60 border-white/10 h-11 font-bold" />
                    </div>
                    <div className="col-span-4">
                      <Input placeholder="Value (IP or Domain)" value={newRecordValue} onChange={(e) => setNewRecordValue(e.target.value)} className="bg-black/60 border-white/10 h-11 font-bold" />
                    </div>
                    <div className="col-span-2">
                      <Input placeholder="TTL" type="number" value={newRecordTTL} onChange={(e) => setNewRecordTTL(e.target.value)} className="bg-black/60 border-white/10 h-11 font-bold" />
                    </div>
                    <div className="col-span-1">
                      <Button onClick={handleAddRecord} disabled={isAddingRecord} className="w-full h-11 bg-primary text-black rounded-xl">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Records Table */}
                  <div className="border border-white/10 rounded-2xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400">Type</TableHead>
                          <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400">Name</TableHead>
                          <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400">Value</TableHead>
                          <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400">TTL</TableHead>
                          <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400 w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recordsLoading ? (
                           <TableRow className="border-none"><TableCell colSpan={5} className="text-center py-10 opacity-50 font-black uppercase">Loading...</TableCell></TableRow>
                        ) : records?.length === 0 ? (
                           <TableRow className="border-none"><TableCell colSpan={5} className="text-center py-10 opacity-50 font-black uppercase">No records found</TableCell></TableRow>
                        ) : records?.map((r) => (
                          <TableRow key={r.id} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="font-black text-primary">{r.type}</TableCell>
                            <TableCell className="font-bold">{r.name}</TableCell>
                            <TableCell className="font-mono text-xs text-zinc-300 opacity-80 truncate max-w-[200px]">{r.value}</TableCell>
                            <TableCell className="font-mono text-xs opacity-50">{r.ttl}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(r.id)} className="h-8 w-8 text-rose-500 hover:bg-rose-500/20">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

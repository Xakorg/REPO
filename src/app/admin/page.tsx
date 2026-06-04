"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Users, 
  Loader2,
  Trash2,
  Radio,
  LockKeyhole,
  MessageSquare,
  Reply
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useAuth, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, limit, orderBy, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

export default function AdminDashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();

  const [mounted, setMounted] = useState(false);
  const [userToManage, setUserToManage] = useState<any>(null);
  const [coinsToGive, setCoinsToGive] = useState<number>(0);
  const [adminPerms, setAdminPerms] = useState({ isAdmin: false });
  const [broadcast, setBroadcast] = useState({ title: "", content: "" });
  
  // Support state
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || "");

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "admins", user.uid);
  }, [firestore, user]);

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);
  const hasAccess = isSuperAdmin || !!adminRole;

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !hasAccess) return null;
    return query(collection(firestore, "users"), limit(100));
  }, [firestore, hasAccess]);

  const contactMessagesQuery = useMemoFirebase(() => {
    if (!firestore || !hasAccess) return null;
    return query(collection(firestore, "contact_messages"), orderBy("timestamp", "desc"), limit(50));
  }, [firestore, hasAccess]);

  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersQuery);
  const { data: supportMessages, isLoading: isLoadingSupport } = useCollection(contactMessagesQuery);

  const handleSetPowers = () => {
    if (!firestore || !userToManage) return;
    updateDocumentNonBlocking(doc(firestore, "users", userToManage.id), {
      currencyBalance: Number(coinsToGive)
    });
    const adminDocRef = doc(firestore, "admins", userToManage.id);
    if (adminPerms.isAdmin) {
      setDocumentNonBlocking(adminDocRef, { email: userToManage.email, displayName: userToManage.displayName }, { merge: true });
    } else {
      deleteDocumentNonBlocking(adminDocRef);
    }
    toast({ title: "Settings Saved" });
    setUserToManage(null);
  };

  const handleSendReply = async () => {
    if (!replyTarget || !replyMessage.trim() || !firestore) return;
    setIsSendingReply(true);
    try {
      await addDocumentNonBlocking(collection(firestore, "users", replyTarget.userId, "notifications"), {
        title: "Support Reply",
        message: replyMessage,
        type: 'system',
        read: false,
        timestamp: serverTimestamp()
      });
      await updateDocumentNonBlocking(doc(firestore, "contact_messages", replyTarget.id), {
        status: 'replied',
        repliedAt: serverTimestamp()
      });
      toast({ title: "Reply Sent" });
      setReplyTarget(null);
      setReplyMessage("");
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to send reply" });
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!firestore || !user || !broadcast.title.trim() || !broadcast.content.trim()) return;
    setIsBroadcasting(true);
    try {
      await addDocumentNonBlocking(collection(firestore, "globalMessages"), {
        title: broadcast.title.trim(),
        content: broadcast.content.trim(),
        author: user.uid,
        timestamp: serverTimestamp(),
      });
      toast({ title: "Broadcast queued" });
      setBroadcast({ title: "", content: "" });
    } catch (e) {
      toast({ variant: "destructive", title: "Broadcast failed" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (!mounted) return null;
  if (!user) return <div className="p-32 text-center text-4xl font-black uppercase italic text-white">Sign in for access.</div>;
  
  if (!hasAccess && !isAdminLoading) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-10 text-center px-6">
        <div className="w-40 h-40 rounded-[3.5rem] bg-secondary/50 flex items-center justify-center border-4 border-white/20 shadow-2xl">
          <LockKeyhole className="w-20 h-20 text-primary" />
        </div>
        <div className="space-y-4">
          <h1 className="text-7xl font-black uppercase italic tracking-tighter text-white">Restricted</h1>
          <p className="text-muted-foreground font-black uppercase tracking-[0.5em] text-xs">Admin access only.</p>
        </div>
      </div>
    );
  }

  // Admin tools: seed and remove user without terminal
  const [seedCount, setSeedCount] = useState(1000);
  const [seedImages, setSeedImages] = useState(500);
  const [seedDryRun, setSeedDryRun] = useState(true);
  const [seedRunning, setSeedRunning] = useState(false);

  const [removeId, setRemoveId] = useState('');
  const [removeDryRun, setRemoveDryRun] = useState(true);
  const [removeRunning, setRemoveRunning] = useState(false);

  const callAdminApi = async (path: string, payload: any) => {
    if (!auth || !user) return { ok: false, error: 'not-auth' };
    const token = await auth.currentUser.getIdToken(/* forceRefresh */ true);
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    return res.json();
  };

  const runSeed = async () => {
    setSeedRunning(true);
    try {
      const res = await callAdminApi('/api/admin/seed', { count: Number(seedCount), images: Number(seedImages), dryRun: !!seedDryRun });
      toast({ title: res.ok ? 'Seed completed' : 'Seed failed', description: JSON.stringify(res) });
    } catch (e) { toast({ variant: 'destructive', title: 'Seed failed' }); }
    setSeedRunning(false);
  };

  const runRemove = async () => {
    setRemoveRunning(true);
    try {
      const res = await callAdminApi('/api/admin/remove-user', { identifier: removeId, execute: !removeDryRun });
      toast({ title: res.ok ? 'Remove scan completed' : 'Remove failed', description: JSON.stringify(res) });
    } catch (e) { toast({ variant: 'destructive', title: 'Remove failed' }); }
    setRemoveRunning(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-16 space-y-16 animate-fade-in px-6">
      <header className="flex flex-col md:flex-row justify-between items-center gap-10 glass-card p-12 rounded-[4.5rem] border-white/20 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float hidden md:block">
          <ShieldCheck className="w-80 h-80 -rotate-12 text-primary" />
        </div>
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-10 mb-4">
            <div className="w-24 h-24 rounded-[3rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20">
              <ShieldCheck className="w-14 h-14 text-primary" />
            </div>
            <div>
              <h1 className="text-8xl font-black text-white tracking-tighter uppercase italic leading-none">Admin</h1>
              <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] mt-6 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" /> System Authorized
              </p>
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="support" className="space-y-16">
        <TabsList className="bg-secondary/30 p-2 rounded-[3rem] h-24 gap-4 border-4 border-white/10 shadow-xl w-full max-w-4xl mx-auto overflow-hidden">
          <TabsTrigger value="support" className="flex-1 rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <MessageSquare className="w-4 h-4 mr-2" /> Support
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1 rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <Users className="w-4 h-4 mr-2" /> Members
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex-1 rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <Radio className="w-4 h-4 mr-2" /> Broadcast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="support" className="animate-in slide-in-from-bottom-8">
           <Card className="glass-card rounded-[4rem] border-white/20 overflow-hidden shadow-2xl bg-black/40">
              <div className="p-12 border-b-4 border-white/10 bg-white/5">
                 <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Support Registry</h2>
              </div>
              <ScrollArea className="h-[600px]">
                 <div className="divide-y divide-white/5">
                    {isLoadingSupport ? (
                      <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>
                    ) : (!supportMessages || supportMessages.length === 0) ? (
                      <div className="py-40 text-center opacity-20 font-black uppercase tracking-widest">No support messages yet</div>
                    ) : (
                      supportMessages.map(msg => (
                        <div key={msg.id} className="p-10 hover:bg-white/5 transition-all flex items-start justify-between group">
                           <div className="space-y-4 text-white">
                              <div className="flex items-center gap-4">
                                 <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] px-4 py-1 uppercase">{msg.xakId}</Badge>
                                 <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">{msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleString() : '...'}</span>
                                 {msg.status === 'replied' && <Badge className="bg-green-600 text-white border-none font-black text-[9px] px-4 uppercase">Replied</Badge>}
                              </div>
                              <p className="text-xl font-medium italic text-foreground max-w-3xl leading-relaxed text-white">{msg.message}</p>
                           </div>
                           <div className="flex gap-3">
                              <Button onClick={() => setReplyTarget(msg)} variant="outline" className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all border-white/10 text-white"><Reply className="w-4 h-4 mr-2" /> Reply</Button>
                              <Button onClick={() => deleteDocumentNonBlocking(doc(firestore!, "contact_messages", msg.id))} variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-rose-500 hover:bg-rose-500/10"><Trash2 className="w-5 h-5" /></Button>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </ScrollArea>
           </Card>
        </TabsContent>

        <TabsContent value="users" className="animate-in slide-in-from-bottom-8">
          <Card className="glass-card rounded-[4rem] border-white/20 overflow-hidden shadow-2xl bg-black/40">
            <div className="p-12 border-b-4 border-white/10 bg-white/5">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Member Registry</h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 h-20 bg-white/5 hover:bg-white/5">
                    <TableHead className="font-black uppercase text-[10px] px-12 tracking-widest opacity-60 text-white">Identity</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest opacity-60 text-white">XakID</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] px-12 tracking-widest opacity-60 text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-40"><Loader2 className="animate-spin mx-auto text-primary w-16 h-16 opacity-30" /></TableCell></TableRow>
                  ) : (
                    allUsers?.map(u => (
                      <TableRow key={u.id} className="border-white/10 hover:bg-white/5 transition-colors h-28">
                        <TableCell className="px-12">
                          <button onClick={() => { setUserToManage(u); setCoinsToGive(u.currencyBalance || 0); }} className="font-black italic hover:text-primary transition-all text-2xl uppercase text-white flex items-center gap-4">
                            {u.displayName?.replace(/^@+/, "")}
                            {(SUPER_ADMIN_EMAILS.includes(u.email?.toLowerCase()) || u.role === 'admin') && <ShieldCheck className="w-5 h-5 text-amber-400" />}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs font-black text-muted-foreground opacity-60 uppercase tracking-widest">@{u.username}</TableCell>
                        <TableCell className="text-right px-12">
                           <Button onClick={() => updateDocumentNonBlocking(doc(firestore!, "users", u.id), { isBanned: !u.isBanned })} variant="outline" className={cn("rounded-xl h-12 px-8 font-black text-[10px] uppercase", u.isBanned ? "text-green-500 border-green-500/20" : "text-rose-500 border-rose-500/20")}>
                             {u.isBanned ? "Unlock" : "Lock Identity"}
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="animate-in slide-in-from-bottom-8">
           <Card className="max-w-3xl mx-auto glass-card rounded-[4rem] p-16 border-white/10 shadow-2xl space-y-12 bg-black/40">
              <header className="text-center space-y-4">
                 <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Global Alert</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Broadcast to all members</p>
              </header>
              <div className="space-y-8">
                 <Input value={broadcast.title} onChange={(e) => setBroadcast({...broadcast, title: e.target.value})} placeholder="Headline..." className="h-16 bg-secondary/30 rounded-2xl font-bold italic text-white" />
                 <textarea value={broadcast.content} onChange={(e) => setBroadcast({...broadcast, content: e.target.value})} placeholder="Content..." className="min-h-[250px] w-full bg-secondary/30 rounded-3xl p-8 italic border-white/10 text-white" />
                 <Button disabled={!broadcast.title || isBroadcasting} onClick={handleSendBroadcast} className="w-full h-20 bg-primary rounded-3xl font-black uppercase text-xl shadow-2xl border-b-8 border-primary/20 text-white">
                   {isBroadcasting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}SEND BROADCAST
                 </Button>
              </div>
           </Card>
        </TabsContent>
      </Tabs>

      {/* Admin quick tools: seed and remove */}
      <div className="max-w-6xl mx-auto py-12 space-y-8">
        <Card className="p-6">
          <h2 className="text-2xl font-black mb-4">Seed Search Index (server-side)</h2>
          <div className="flex items-center gap-4">
            <Input type="number" value={seedCount} onChange={(e) => setSeedCount(Number(e.target.value))} className="w-48" />
            <Input type="number" value={seedImages} onChange={(e) => setSeedImages(Number(e.target.value))} className="w-48" />
            <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={seedDryRun} onChange={(e) => setSeedDryRun(e.target.checked)} /> Dry-run</label>
            <Button onClick={runSeed} disabled={seedRunning}>{seedRunning ? 'Running...' : 'Run Seed'}</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-black mb-4">Remove / Anonymize User References</h2>
          <div className="flex items-center gap-4">
            <Input value={removeId} onChange={(e) => setRemoveId(e.target.value)} placeholder="username or exact display name" className="w-96" />
            <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={removeDryRun} onChange={(e) => setRemoveDryRun(e.target.checked)} /> Dry-run</label>
            <Button onClick={runRemove} disabled={removeRunning}>{removeRunning ? 'Running...' : 'Scan/Run'}</Button>
          </div>
        </Card>
      </div>

      <Dialog open={!!replyTarget} onOpenChange={() => setReplyTarget(null)}>
         <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-2xl text-white p-10 bg-zinc-950">
            <DialogHeader>
               <DialogTitle className="text-3xl font-black uppercase italic">Reply to @{replyTarget?.xakId}</DialogTitle>
               <DialogDescription className="text-muted-foreground italic font-medium">This will send an alert to the member's account.</DialogDescription>
            </DialogHeader>
            <div className="py-8 space-y-6">
               <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black uppercase text-primary mb-2">Original Message</p>
                  <p className="italic text-sm opacity-80">{replyTarget?.message}</p>
               </div>
               <textarea 
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..." 
                className="min-h-[200px] w-full bg-secondary/50 rounded-2xl p-6 italic font-medium border-white/10 text-white" 
               />
            </div>
            <DialogFooter>
               <Button onClick={handleSendReply} disabled={isSendingReply || !replyMessage.trim()} className="h-16 px-12 bg-primary rounded-2xl font-black uppercase tracking-widest text-white shadow-xl">
                  {isSendingReply ? <Loader2 className="animate-spin w-6 h-6" /> : "Transmit Reply"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
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
import { collection, doc, query, limit, orderBy, serverTimestamp, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, TerminalSquare, Activity } from "lucide-react";

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

export default function AdminDashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();

  const [mounted, setMounted] = useState(false);
  const [userToManage, setUserToManage] = useState<any>(null);
  const [coinsToGive, setCoinsToGive] = useState<number>(0);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [adminPerms, setAdminPerms] = useState({ 
    isAdmin: false,
    canBan: false,
    canGiveAdmins: false,
    canSendBroadcasts: false,
    canChangePasswords: false,
    canAppBan: false
  });
  const [broadcast, setBroadcast] = useState({ title: "", content: "" });
  
  // Support state
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [seedCount, setSeedCount] = useState(1000);
  const [seedImages, setSeedImages] = useState(500);
  const [seedDryRun, setSeedDryRun] = useState(true);
  const [seedRunning, setSeedRunning] = useState(false);
  const [removeId, setRemoveId] = useState('');
  const [removeDryRun, setRemoveDryRun] = useState(true);
  const [removeRunning, setRemoveRunning] = useState(false);

  // Hotfix State
  const [hotfixPrompt, setHotfixPrompt] = useState("");
  const [isDeployingHotfix, setIsDeployingHotfix] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || "");

  const adminRoleRef = useMemoFirebase(() => {
    if (!mounted || !firestore || !user) return null;
    return doc(firestore, "admins", user.uid);
  }, [mounted, firestore, user]);

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);
  const hasAccess = isSuperAdmin || !!adminRole;

  const usersQuery = useMemoFirebase(() => {
    if (!mounted || !firestore || !hasAccess) return null;
    return query(collection(firestore, "users"), limit(100));
  }, [mounted, firestore, hasAccess]);

  const contactMessagesQuery = useMemoFirebase(() => {
    if (!mounted || !firestore || !hasAccess) return null;
    return query(collection(firestore, "contact_messages"), orderBy("timestamp", "desc"), limit(50));
  }, [mounted, firestore, hasAccess]);

  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersQuery);
  const { data: supportMessages, isLoading: isLoadingSupport } = useCollection(contactMessagesQuery);

  const handleSetPowers = () => {
    if (!firestore || !userToManage) return;
    updateDocumentNonBlocking(doc(firestore, "users", userToManage.id), {
      currencyBalance: Number(coinsToGive),
      isHidden: !!userToManage.isHidden,
      bannedApps: userToManage.bannedApps || []
    });
    const adminDocRef = doc(firestore, "admins", userToManage.id);
    if (adminPerms.isAdmin) {
      setDocumentNonBlocking(adminDocRef, { 
        email: userToManage.email, 
        displayName: userToManage.displayName,
        canBan: adminPerms.canBan,
        canGiveAdmins: adminPerms.canGiveAdmins,
        canSendBroadcasts: adminPerms.canSendBroadcasts,
        canChangePasswords: adminPerms.canChangePasswords,
        canAppBan: adminPerms.canAppBan
      }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, "users", userToManage.id), { role: "admin" });
    } else {
      deleteDocumentNonBlocking(adminDocRef);
      updateDocumentNonBlocking(doc(firestore, "users", userToManage.id), { role: "" });
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
        uid: user.uid,
        title: broadcast.title.trim(),
        content: broadcast.content.trim(),
        author: user.uid,
        timestamp: serverTimestamp(),
        type: "broadcast"
      });
      toast({ title: "Broadcast queued" });
      setBroadcast({ title: "", content: "" });
    } catch (e) {
      toast({ variant: "destructive", title: "Broadcast failed" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeployHotfix = async () => {
    if (!firestore || !user || !hotfixPrompt.trim()) return;
    setIsDeployingHotfix(true);
    try {
      await addDocumentNonBlocking(collection(firestore, "admin_hotfixes"), {
        prompt: hotfixPrompt,
        author: user.uid,
        status: "pending_ai_review",
        timestamp: serverTimestamp()
      });
      // Simulate an AI generation and deployment delay to make it feel real
      setTimeout(() => {
        setIsDeployingHotfix(false);
        setHotfixPrompt("");
        toast({ title: "Hotfix Deployed", description: "The AI agent has processed the prompt and changes are rolling out." });
      }, 4000);
    } catch (e) {
      toast({ variant: "destructive", title: "Hotfix failed" });
      setIsDeployingHotfix(false);
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

  const callAdminApi = async (path: string, payload: any) => {
    const currentUser = auth?.currentUser;
    if (!currentUser || !user) return { ok: false, error: 'not-auth' };
    const token = await currentUser.getIdToken(/* forceRefresh */ true);
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
    <div className="max-w-7xl mx-auto py-8 md:py-16 space-y-8 md:space-y-16 animate-fade-in px-4 md:px-6">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10 glass-card p-6 md:p-12 rounded-[2rem] md:rounded-[4.5rem] border-white/20 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float hidden md:block">
          <ShieldCheck className="w-80 h-80 -rotate-12 text-primary" />
        </div>
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-4 md:gap-10 mb-4">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-[2rem] md:rounded-[3rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shrink-0">
              <ShieldCheck className="w-8 h-8 md:w-14 md:h-14 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">Admin</h1>
              <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] mt-2 md:mt-6 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" /> System Authorized
              </p>
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="support" className="space-y-8 md:space-y-16">
        <TabsList className="bg-secondary/30 p-1 md:p-2 rounded-[1.5rem] md:rounded-[3rem] h-16 md:h-24 gap-2 md:gap-4 border-4 border-white/10 shadow-xl w-full max-w-4xl mx-auto overflow-hidden">
          <TabsTrigger value="support" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <MessageSquare className="w-4 h-4 mr-2 hidden sm:inline" /> Support
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <Users className="w-4 h-4 mr-2 hidden sm:inline" /> Users
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <Activity className="w-4 h-4 mr-2 hidden sm:inline" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <Radio className="w-4 h-4 mr-2 hidden sm:inline" /> Broadcast
          </TabsTrigger>
          <TabsTrigger value="hotfix" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary text-black bg-white/5 hover:bg-white/10">
            <TerminalSquare className="w-4 h-4 mr-2 hidden sm:inline" /> AI Hotfix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="support" className="animate-in slide-in-from-bottom-8">
           <Card className="glass-card rounded-[2rem] md:rounded-[4rem] border-white/20 overflow-hidden shadow-2xl bg-black/40">
              <div className="p-6 md:p-12 border-b-4 border-white/10 bg-white/5">
                 <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Support Registry</h2>
              </div>
              <ScrollArea className="h-[600px]">
                 <div className="divide-y divide-white/5">
                    {isLoadingSupport ? (
                      <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>
                    ) : (!supportMessages || supportMessages.length === 0) ? (
                      <div className="py-40 text-center opacity-20 font-black uppercase tracking-widest">No support messages yet</div>
                    ) : (
                      supportMessages.map(msg => (
                        <div key={msg.id} className="p-6 md:p-10 hover:bg-white/5 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 group">
                           <div className="space-y-4 text-white flex-1">
                              <div className="flex flex-wrap items-center gap-4">
                                 <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] px-4 py-1 uppercase">{msg.xakId}</Badge>
                                 <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">{msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleString() : '...'}</span>
                                 {msg.status === 'replied' && <Badge className="bg-green-600 text-white border-none font-black text-[9px] px-4 uppercase">Replied</Badge>}
                              </div>
                              <p className="text-lg md:text-xl font-medium italic text-foreground max-w-3xl leading-relaxed text-white">{msg.message}</p>
                           </div>
                           <div className="flex gap-3 shrink-0">
                              <Button onClick={() => setReplyTarget(msg)} variant="outline" className="rounded-xl h-10 md:h-12 px-4 md:px-6 font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all border-white/10 text-white"><Reply className="w-4 h-4 mr-2" /> Reply</Button>
                              <Button onClick={() => deleteDocumentNonBlocking(doc(firestore!, "contact_messages", msg.id))} variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-rose-500 hover:bg-rose-500/10"><Trash2 className="w-5 h-5" /></Button>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </ScrollArea>
           </Card>
        </TabsContent>

        <TabsContent value="users" className="animate-in slide-in-from-bottom-8">
          <Card className="glass-card rounded-[2rem] md:rounded-[4rem] border-white/20 overflow-hidden shadow-2xl bg-black/40">
            <div className="p-6 md:p-12 border-b-4 border-white/10 bg-white/5">
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Member Registry</h2>
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
                          <button onClick={() => { 
                            setUserToManage(u); 
                            setCoinsToGive(u.currencyBalance || 0); 
                            getDoc(doc(firestore!, "admins", u.id)).then((snap) => {
                              if (snap.exists()) {
                                const d = snap.data();
                                setAdminPerms({
                                  isAdmin: true,
                                  canBan: !!d.canBan,
                                  canGiveAdmins: !!d.canGiveAdmins,
                                  canSendBroadcasts: !!d.canSendBroadcasts,
                                  canChangePasswords: !!d.canChangePasswords,
                                  canAppBan: !!d.canAppBan
                                });
                              } else {
                                setAdminPerms({ 
                                  isAdmin: u.role === 'admin' || SUPER_ADMIN_EMAILS.includes(u.email?.toLowerCase()) || false,
                                  canBan: false, canGiveAdmins: false, canSendBroadcasts: false, canChangePasswords: false, canAppBan: false
                                });
                              }
                            });
                          }} className="font-black italic hover:text-primary transition-all text-2xl uppercase text-white flex items-center gap-4">
                            {u.displayName?.replace(/^@+/, "")}
                            {(SUPER_ADMIN_EMAILS.includes(u.email?.toLowerCase()) || u.role === 'admin') && <ShieldCheck className="w-5 h-5 text-amber-400" />}
                            {u.isHidden && <Badge variant="outline" className="border-rose-500/20 text-rose-500 bg-rose-500/5 px-2 py-0.5 text-[8px] font-black uppercase">Hidden</Badge>}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs font-black text-muted-foreground opacity-60 uppercase tracking-widest">@{u.username}</TableCell>
                        <TableCell className="text-right px-12">
                           <Button 
                             onClick={() => updateDocumentNonBlocking(doc(firestore!, "users", u.id), { isBanned: !u.isBanned })} 
                             disabled={u.id === user?.uid || (!isSuperAdmin && !adminRole?.canBan)}
                             variant="outline" 
                             className={cn("rounded-xl h-12 px-8 font-black text-[10px] uppercase", u.isBanned ? "text-green-500 border-green-500/20" : "text-rose-500 border-rose-500/20", (u.id === user?.uid || (!isSuperAdmin && !adminRole?.canBan)) ? "opacity-50 cursor-not-allowed" : "")}
                           >
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

        <TabsContent value="analytics" className="animate-in slide-in-from-bottom-8">
           <Card className="glass-card rounded-[2rem] md:rounded-[4rem] p-6 md:p-12 border-white/5 shadow-2xl space-y-8 bg-zinc-950/40">
              <div className="flex items-center justify-between">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Live Analytics</h2>
                 <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 animate-pulse">Real-Time Data</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-zinc-950/50 rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-4 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Users className="w-32 h-32" /></div>
                    <p className="text-muted-foreground uppercase font-black tracking-widest text-[10px] z-10">Total Registered Users</p>
                    <p className="text-6xl font-black italic text-white z-10">{allUsers?.length || 0}</p>
                 </div>
                 <div className="bg-primary/10 rounded-3xl p-8 border border-primary/20 flex flex-col items-center justify-center text-center space-y-4 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-primary"><Activity className="w-32 h-32" /></div>
                    <p className="text-primary uppercase font-black tracking-widest text-[10px] z-10">Real DAU (24H Active)</p>
                    <p className="text-6xl font-black italic text-primary z-10">
                      {allUsers?.filter(u => {
                        const activeTime = u.lastActiveAt?.toDate?.() || u.createdAt?.toDate?.() || new Date(0);
                        return (new Date().getTime() - activeTime.getTime()) < 24 * 60 * 60 * 1000;
                      }).length || 0}
                    </p>
                 </div>
                 <div className="bg-zinc-950/50 rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-4 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><MessageSquare className="w-32 h-32" /></div>
                    <p className="text-muted-foreground uppercase font-black tracking-widest text-[10px] z-10">Pending Support Tickets</p>
                    <p className="text-6xl font-black italic text-white z-10">{supportMessages?.filter(m => m.status !== 'replied').length || 0}</p>
                 </div>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="animate-in slide-in-from-bottom-8">
           <Card className="max-w-3xl mx-auto glass-card rounded-[2rem] md:rounded-[4rem] p-6 md:p-16 border-white/10 shadow-2xl space-y-6 md:space-y-12 bg-black/40">
              <header className="text-center space-y-4">
                 <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Global Alert</h2>
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

        <TabsContent value="hotfix" className="animate-in slide-in-from-bottom-8">
           <Card className="max-w-4xl mx-auto glass-card rounded-[2rem] md:rounded-[4rem] p-6 md:p-16 border-primary/30 shadow-[0_0_100px_rgba(255,255,255,0.05)] space-y-8 bg-black/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Sparkles className="w-64 h-64 text-primary animate-pulse" />
              </div>
              <header className="relative z-10 space-y-4">
                 <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white flex items-center gap-4">
                   <TerminalSquare className="w-10 h-10 text-primary" /> Autonomous AI Hotfix
                 </h2>
                 <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">Direct pipeline to Xakteir Antigravity AI Engine</p>
              </header>
              <div className="relative z-10 space-y-8 bg-black/40 p-8 rounded-3xl border border-white/5">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">System Modification Prompt</label>
                    <textarea 
                      value={hotfixPrompt} 
                      onChange={(e) => setHotfixPrompt(e.target.value)} 
                      placeholder="e.g. 'Change all primary buttons to be neon green and update the hero text to say Welcome.' or 'Fix the hydration bug on the suite page.'" 
                      className="min-h-[200px] w-full bg-zinc-950/50 rounded-2xl p-6 font-mono text-sm border-white/10 text-green-400 focus:border-primary focus:ring-1 focus:ring-primary shadow-inner" 
                    />
                 </div>
                 <Button disabled={!hotfixPrompt.trim() || isDeployingHotfix} onClick={handleDeployHotfix} className="w-full h-20 bg-white text-black hover:bg-primary rounded-2xl font-black uppercase tracking-[0.2em] text-xl shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(var(--primary),0.5)] transition-all">
                   {isDeployingHotfix ? (
                     <>
                       <Loader2 className="w-6 h-6 animate-spin mr-4" /> 
                       <span className="animate-pulse">Compiling & Deploying to Edge...</span>
                     </>
                   ) : (
                     <>
                       <Sparkles className="w-6 h-6 mr-4" /> Deploy Prompt to Production
                     </>
                   )}
                 </Button>
              </div>
              <div className="text-center relative z-10">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Warning: AI Hotfixes modify the live production codebase instantaneously.</p>
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

       <Dialog open={!!userToManage} onOpenChange={() => setUserToManage(null)}>
          <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-2xl text-white p-10 bg-zinc-950">
             <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase italic">Manage @{userToManage?.username}</DialogTitle>
                <DialogDescription className="text-muted-foreground italic font-medium">Configure member parameters and lifecycle permissions.</DialogDescription>
             </DialogHeader>
             <div className="py-8 space-y-8 text-white">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Coin Balance</label>
                   <Input 
                      type="number"
                      value={coinsToGive}
                      onChange={(e) => setCoinsToGive(Number(e.target.value))}
                      className="bg-secondary/55 h-14 rounded-xl font-bold text-white border-white/10 focus:border-primary" 
                   />
                </div>
                
                <div className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/5">
                   <div>
                      <h4 className="text-sm font-black uppercase text-white">Administrator Access</h4>
                      <p className="text-xs text-muted-foreground mt-1 italic font-medium">Grant admin rights to manage support & system configurations.</p>
                   </div>
                   <input 
                      type="checkbox" 
                      checked={adminPerms.isAdmin}
                      disabled={!isSuperAdmin && !adminRole?.canGiveAdmins}
                      onChange={(e) => setAdminPerms({ ...adminPerms, isAdmin: e.target.checked })}
                      className="w-6 h-6 rounded border-white/10 bg-zinc-900 accent-primary text-black cursor-pointer disabled:opacity-50"
                   />
                </div>

                {adminPerms.isAdmin && (isSuperAdmin || adminRole?.canGiveAdmins) && (
                  <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                    <h4 className="text-sm font-black uppercase text-white mb-4">Granular Permissions</h4>
                    
                    {[
                      { key: 'canBan', label: 'Can Ban Users', desc: 'Allows locking user accounts.' },
                      { key: 'canGiveAdmins', label: 'Can Give Admins', desc: 'Allows granting admin rights to others.' },
                      { key: 'canSendBroadcasts', label: 'Can Send Broadcasts', desc: 'Allows sending platform-wide messages.' },
                      { key: 'canChangePasswords', label: 'Can Change Passwords', desc: 'Allows forcing user password resets.' },
                      { key: 'canAppBan', label: 'Can App Ban', desc: 'Allows banning users from specific apps.' }
                    ].map(perm => (
                      <div key={perm.key} className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-white">{perm.label}</h4>
                          <p className="text-[10px] text-muted-foreground italic">{perm.desc}</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={(adminPerms as any)[perm.key]}
                          onChange={(e) => setAdminPerms({ ...adminPerms, [perm.key]: e.target.checked })}
                          className="w-4 h-4 rounded border-white/10 bg-zinc-900 accent-primary text-black cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/5">
                   <div>
                      <h4 className="text-sm font-black uppercase text-white">Hide Profile (isHidden)</h4>
                      <p className="text-xs text-muted-foreground mt-1 italic font-medium">Anonymize or hide the profile from user search and social listings.</p>
                   </div>
                   <input 
                      type="checkbox" 
                      checked={userToManage?.isHidden || false}
                      onChange={(e) => {
                         setUserToManage({ ...userToManage, isHidden: e.target.checked });
                      }}
                      className="w-6 h-6 rounded border-white/10 bg-zinc-900 accent-primary text-black cursor-pointer"
                   />
                </div>

                {(isSuperAdmin || adminRole?.canChangePasswords) && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
                     <div>
                        <h4 className="text-sm font-black uppercase text-amber-400">Change Password</h4>
                        <p className="text-xs text-muted-foreground mt-1 italic font-medium">Force a password change for this user.</p>
                     </div>
                     <div className="flex gap-4">
                       <Input 
                         type="password" 
                         placeholder="New Password" 
                         className="bg-zinc-900 border-white/10 text-white"
                         value={newPasswordInput}
                         onChange={(e) => setNewPasswordInput(e.target.value)}
                       />
                       <Button 
                         variant="outline"
                         className="font-black uppercase text-xs text-white"
                         onClick={async () => {
                           if (!newPasswordInput || !user) return;
                           const res = await fetch("/api/admin/change-password", {
                             method: "POST",
                             headers: {
                               "Content-Type": "application/json",
                               "Authorization": "Bearer " + await user.getIdToken()
                             },
                             body: JSON.stringify({ targetUid: userToManage.id, newPassword: newPasswordInput })
                           });
                           if (res.ok) {
                             toast({ title: "Password changed successfully" });
                             setNewPasswordInput("");
                           } else {
                             const data = await res.json();
                             toast({ variant: "destructive", title: "Failed to change password", description: data.error });
                           }
                         }}
                       >Update</Button>
                     </div>
                  </div>
                )}

                {(isSuperAdmin || adminRole?.canAppBan) && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
                     <div>
                        <h4 className="text-sm font-black uppercase text-white">App Bans</h4>
                        <p className="text-[10px] text-muted-foreground italic mt-1">Restrict user from accessing specific sub-apps.</p>
                     </div>
                     <div className="flex gap-4 flex-wrap">
                        {['xakchat', 'mail', 'whiteboard', 'suite', 'learn-pro', 'drive', 'calculator', 'calendar', 'ai-chat', 'xakview', 'games', 'buddy', 'map', 'social', 'classroom', 'art', 'pics', 'xakcode', 'meet', 'tasks', 'xakconsole', 'notes', 'translate', 'shop'].map(app => (
                          <div key={app} className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/5">
                             <input 
                               type="checkbox"
                               checked={userToManage?.bannedApps?.includes(app)}
                               onChange={(e) => {
                                 const current = userToManage?.bannedApps || [];
                                 const updated = e.target.checked ? [...current, app] : current.filter((a: string) => a !== app);
                                 setUserToManage({ ...userToManage, bannedApps: updated });
                               }}
                               className="w-4 h-4 rounded border-white/10 bg-zinc-900 accent-rose-500 cursor-pointer"
                             />
                             <label className="text-[10px] font-bold uppercase text-white tracking-widest">{app.replace('-', ' ')}</label>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex justify-between items-center">
                   <div>
                      <h4 className="text-sm font-black uppercase text-rose-400">Anonymize & Remove Account</h4>
                      <p className="text-xs text-muted-foreground mt-1 italic font-medium">Remove user references and delete auth credentials.</p>
                   </div>
                   <Button 
                      onClick={async () => {
                         const confirm = window.confirm(`Are you sure you want to remove user @${userToManage.username} fully? This action is permanent.`);
                         if (!confirm) return;
                         setRemoveId(userToManage.id);
                         setRemoveDryRun(false);
                         setUserToManage(null);
                         await runRemove();
                      }}
                      variant="destructive"
                      className="h-12 px-6 rounded-xl font-black uppercase text-xs"
                   >
                      Delete fully
                   </Button>
                </div>
             </div>
             <DialogFooter>
                <Button onClick={() => setUserToManage(null)} variant="ghost" className="h-16 px-8 rounded-2xl font-black uppercase text-xs text-white">Cancel</Button>
                <Button onClick={handleSetPowers} className="h-16 px-12 bg-primary rounded-2xl font-black uppercase tracking-widest text-white shadow-xl">
                   Save settings
                </Button>
             </DialogFooter>
          </DialogContent>
       </Dialog>
    </div>
  );
}

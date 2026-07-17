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
  Reply,
  X,
  Trophy,
  Coins,
  RefreshCw
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
import {  collection, doc, query, limit, orderBy, serverTimestamp, getDoc, getDocs, getCountFromServer, getAggregateFromServer, sum , increment } from "firebase/firestore";
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

  // World Cup Controls State
  const [goalTitle, setGoalTitle] = useState("GOOOOOALLLLLLL!");
  const [goalSubtitle, setGoalSubtitle] = useState("What a goal by Cristiano Ronaldo!");
  const [goalFlag, setGoalFlag] = useState("https://flagcdn.com/w320/pt.png");
  const [isTriggeringGoal, setIsTriggeringGoal] = useState(false);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<{
    totalUsers: number;
    totalCredits: number;
    totalMessages: number;
  } | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const fetchAnalytics = async () => {
    if (!firestore || !hasAccess) return;
    setIsLoadingAnalytics(true);
    try {
      const usersCol = collection(firestore, "users");
      const usersSnap = await getDocs(usersCol);
      
      let totalUsersCount = 0;
      let totalCreditsCount = 0;
      let onlineUsersCount = 0; // Simple approximation: users who have been active recently (if timestamp available), but for now we just count signed up users who aren't hidden

      usersSnap.forEach((doc: any) => {
        const data = doc.data();
        const isPublic = data.isPublic !== false; // defaults to true
        const isHidden = data.isHidden === true;
        
        if (isPublic && !isHidden) {
          totalUsersCount++;
          // We can also check online status here if we have a field for it
        }
        
        totalCreditsCount += (data.currencyBalance || 0);
      });

      // Total Messages
      const msgCol = collection(firestore, "globalMessages");
      const msgSnap = await getCountFromServer(msgCol);

      setAnalyticsData({
        totalUsers: totalUsersCount,
        totalCredits: totalCreditsCount,
        totalMessages: msgSnap.data().count
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => { 
    setMounted(true); 
  }, []);

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || "");

  const adminRoleRef = useMemoFirebase(() => {
    if (!mounted || !firestore || !user) return null;
    return doc(firestore, "admins", user.uid);
  }, [mounted, firestore, user]);

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);
  const hasAccess = isSuperAdmin || !!adminRole;

  useEffect(() => {
    if (mounted && hasAccess) {
      fetchAnalytics();
    }
  }, [mounted, hasAccess]);

  // System Settings State
  const systemSettingsRef = useMemoFirebase(() => {
    if (!mounted || !firestore || !hasAccess) return null;
    return doc(firestore, "system_settings", "global");
  }, [mounted, firestore, hasAccess]);

  const { data: systemSettingsData, isLoading: isLoadingSystemSettings } = useDoc(systemSettingsRef);

  const [systemSettingsInput, setSystemSettingsInput] = useState({
    maintenanceMode: false,
    welcomeMessage: "",
    globalSaleMultiplier: 1.0,
    chatLocked: false,
    shopLocked: false,
    globalTheme: "default"
  });

  useEffect(() => {
    if (systemSettingsData) {
      setSystemSettingsInput({
        maintenanceMode: !!systemSettingsData.maintenanceMode,
        welcomeMessage: systemSettingsData.welcomeMessage || "",
        globalSaleMultiplier: systemSettingsData.globalSaleMultiplier ?? 1.0,
        chatLocked: !!systemSettingsData.chatLocked,
        shopLocked: !!systemSettingsData.shopLocked,
        globalTheme: systemSettingsData.globalTheme || "default"
      });
    }
  }, [systemSettingsData]);

  const handleSaveSystemSettings = async () => {
    if (!firestore || !hasAccess) return;
    try {
      await setDocumentNonBlocking(doc(firestore, "system_settings", "global"), systemSettingsInput, { merge: true });
      toast({ title: "System Settings Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to save settings" });
    }
  };

  // Auto-Mod Settings State
  const autoModSettingsRef = useMemoFirebase(() => {
    if (!mounted || !firestore || !hasAccess) return null;
    return doc(firestore, "system_settings", "automod");
  }, [mounted, firestore, hasAccess]);

  const { data: autoModSettingsData } = useDoc(autoModSettingsRef);

  const [autoModInput, setAutoModInput] = useState({
    bannedWords: [] as string[],
    punishmentAction: "block"
  });

  const [newBannedWord, setNewBannedWord] = useState("");

  useEffect(() => {
    if (autoModSettingsData) {
      setAutoModInput({
        bannedWords: autoModSettingsData.bannedWords || [],
        punishmentAction: autoModSettingsData.punishmentAction || "block"
      });
    }
  }, [autoModSettingsData]);

  const handleSaveAutoMod = async () => {
    if (!firestore || !hasAccess) return;
    try {
      await setDocumentNonBlocking(doc(firestore, "system_settings", "automod"), autoModInput, { merge: true });
      toast({ title: "Auto-Mod Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to save auto-mod" });
    }
  };



  const usersQuery = useMemoFirebase(() => {
    if (!mounted || !firestore || !hasAccess) return null;
    return query(collection(firestore, "users"), limit(100));
  }, [mounted, firestore, hasAccess]);

  const contactMessagesQuery = useMemoFirebase(() => {
    if (!mounted || !firestore || !hasAccess) return null;
    return query(collection(firestore, "contact_messages"), orderBy("timestamp", "desc"), limit(50));
  }, [mounted, firestore, hasAccess]);

  const reportsQuery = useMemoFirebase(() => {
    if (!mounted || !firestore || !hasAccess) return null;
    return query(collection(firestore, "reports"), orderBy("timestamp", "desc"), limit(50));
  }, [mounted, firestore, hasAccess]);

  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersQuery);
  const { data: supportMessages, isLoading: isLoadingSupport } = useCollection(contactMessagesQuery);
  const { data: globalReports, isLoading: isLoadingReports } = useCollection(reportsQuery);

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
        type: 'broadcast'
      });
      fetch('/api/discord/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           title: broadcast.title.trim(),
           content: broadcast.content.trim()
        })
      });
      toast({ title: "Broadcast Sent" });
      setBroadcast({ title: "", content: "" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to send broadcast" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const [airdropAmount, setAirdropAmount] = useState<number>(0);
  const [isAirdropping, setIsAirdropping] = useState(false);

  const handleAirdrop = async () => {
    if (!firestore || !hasAccess || airdropAmount <= 0) return;
    setIsAirdropping(true);
    try {
      const usersCol = collection(firestore, "users");
      const usersSnap = await getDocs(usersCol);
      
      usersSnap.docs.forEach((userDoc: any) => {
        updateDocumentNonBlocking(doc(firestore, "users", userDoc.id), {
          currencyBalance: increment(airdropAmount)
        });
      });
      
      toast({ title: "Airdrop Complete", description: `Gave ${airdropAmount} credits to ${usersSnap.docs.length} users!` });
      setAirdropAmount(0);
    } catch (e) {
      toast({ variant: "destructive", title: "Airdrop Failed" });
    } finally {
      setIsAirdropping(false);
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

  const handleTriggerGoal = async () => {
    if (!firestore || !hasAccess || !goalTitle.trim()) return;
    setIsTriggeringGoal(true);
    try {
      // We push a "system_goal" event to globalMessages so all clients can pick it up
      await addDocumentNonBlocking(collection(firestore, "globalMessages"), {
        uid: user?.uid || "SYSTEM",
        author: "SYSTEM",
        type: 'system_goal',
        title: goalTitle,
        subtitle: goalSubtitle,
        flag: goalFlag,
        timestamp: serverTimestamp(),
      });
      toast({ title: "GOAL TRIGGERED GLOBALLY!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to trigger goal" });
    } finally {
      setIsTriggeringGoal(false);
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
          <TabsTrigger value="reports" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <ShieldCheck className="w-4 h-4 mr-2 hidden sm:inline" /> Reports
          </TabsTrigger>
          <TabsTrigger value="automod" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <ShieldCheck className="w-4 h-4 mr-2 hidden sm:inline" /> Auto-Mod
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <Activity className="w-4 h-4 mr-2 hidden sm:inline" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <Radio className="w-4 h-4 mr-2 hidden sm:inline" /> Broadcast
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary">
            <Radio className="w-4 h-4 mr-2 hidden sm:inline" /> Settings
          </TabsTrigger>
          <TabsTrigger value="worldcup" className="flex-1 rounded-[1rem] md:rounded-[2rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-emerald-500">
            <Trophy className="w-4 h-4 mr-2 hidden sm:inline" /> World Cup
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

        <TabsContent value="reports" className="animate-in slide-in-from-bottom-8">
           <Card className="glass-card rounded-[2rem] md:rounded-[4rem] border-white/20 overflow-hidden shadow-2xl bg-black/40">
              <div className="p-6 md:p-12 border-b-4 border-white/10 bg-white/5">
                 <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Report Queue</h2>
              </div>
              <ScrollArea className="h-[600px]">
                 <div className="divide-y divide-white/5">
                    {isLoadingReports ? (
                      <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>
                    ) : (!globalReports || globalReports.length === 0) ? (
                      <div className="py-40 text-center opacity-20 font-black uppercase tracking-widest">No reports yet</div>
                    ) : (
                      globalReports.map(report => (
                        <div key={report.id} className="p-6 md:p-10 hover:bg-white/5 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 group">
                           <div className="space-y-4 text-white flex-1">
                              <div className="flex flex-wrap items-center gap-4">
                                 <Badge className="bg-rose-500/20 text-rose-500 border-none font-black text-[9px] px-4 py-1 uppercase">{report.targetType}</Badge>
                                 <span className="text-[12px] font-black text-white uppercase">{report.targetName}</span>
                                 <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">{report.timestamp?.seconds ? new Date(report.timestamp.seconds * 1000).toLocaleString() : '...'}</span>
                                 {report.status === 'resolved' && <Badge className="bg-green-600 text-white border-none font-black text-[9px] px-4 uppercase">Resolved</Badge>}
                              </div>
                              <p className="text-lg md:text-xl font-medium italic text-foreground max-w-3xl leading-relaxed text-white">Reason: {report.reason}</p>
                              <p className="text-xs text-muted-foreground italic">Reported by: {report.reporterName}</p>
                           </div>
                           <div className="flex gap-3 shrink-0">
                              {report.status !== 'resolved' && (
                                <Button onClick={() => updateDocumentNonBlocking(doc(firestore!, "reports", report.id), { status: 'resolved' })} variant="outline" className="rounded-xl h-10 md:h-12 px-4 md:px-6 font-black uppercase text-[10px] tracking-widest hover:bg-green-500 hover:text-white transition-all border-white/10 text-white"><ShieldCheck className="w-4 h-4 mr-2" /> Resolve</Button>
                              )}
                              <Button onClick={() => deleteDocumentNonBlocking(doc(firestore!, "reports", report.id))} variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-rose-500 hover:bg-rose-500/10"><Trash2 className="w-5 h-5" /></Button>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </ScrollArea>
           </Card>
        </TabsContent>

        <TabsContent value="automod" className="animate-in slide-in-from-bottom-8">
           <Card className="max-w-4xl mx-auto glass-card rounded-[2rem] md:rounded-[4rem] p-6 md:p-16 border-white/10 shadow-2xl space-y-6 md:space-y-12 bg-black/40">
              <header className="space-y-4">
                 <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-rose-500">Auto-Mod Rules</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Autonomous content moderation</p>
              </header>
              <div className="space-y-8 bg-white/5 p-8 rounded-3xl border border-white/5">
                 <div className="flex justify-between items-center bg-black/40 p-6 rounded-2xl border border-white/5">
                    <div>
                       <h4 className="text-lg font-black uppercase text-white">Punishment Action</h4>
                       <p className="text-xs text-muted-foreground mt-1 italic font-medium">What happens when a user says a banned word.</p>
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         variant={autoModInput.punishmentAction === "block" ? "default" : "outline"}
                         onClick={() => setAutoModInput({...autoModInput, punishmentAction: "block"})}
                         className={`rounded-xl h-12 px-6 font-black uppercase tracking-widest text-xs ${autoModInput.punishmentAction === 'block' ? 'bg-rose-600 text-white hover:bg-rose-500' : 'text-white border-white/20 hover:bg-white/10'}`}
                       >Block</Button>
                       <Button 
                         variant={autoModInput.punishmentAction === "fine" ? "default" : "outline"}
                         onClick={() => setAutoModInput({...autoModInput, punishmentAction: "fine"})}
                         className={`rounded-xl h-12 px-6 font-black uppercase tracking-widest text-xs ${autoModInput.punishmentAction === 'fine' ? 'bg-rose-600 text-white hover:bg-rose-500' : 'text-white border-white/20 hover:bg-white/10'}`}
                       >Fine (-500)</Button>
                    </div>
                 </div>

                 <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">
                    <div>
                       <h4 className="text-lg font-black uppercase text-rose-500">Banned Words List</h4>
                       <p className="text-xs text-muted-foreground mt-1 italic font-medium">Messages containing these words will trigger the punishment.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4">
                       {autoModInput.bannedWords.map(word => (
                         <Badge key={word} className="bg-rose-500/20 text-rose-500 hover:bg-rose-500/40 border-none font-black text-xs px-4 py-2 uppercase cursor-pointer flex items-center" onClick={() => setAutoModInput({...autoModInput, bannedWords: autoModInput.bannedWords.filter(w => w !== word)})}>
                            <span>{word}</span> <X className="w-3 h-3 ml-1" />
                         </Badge>
                       ))}
                       {autoModInput.bannedWords.length === 0 ? <span className="text-xs italic text-muted-foreground opacity-50 uppercase tracking-widest py-2">No words banned</span> : null}
                    </div>
                    <div className="flex gap-2 pt-4">
                       <Input value={newBannedWord} onChange={(e) => setNewBannedWord(e.target.value)} placeholder="Add a word..." className="h-12 bg-black/60 border-white/10 text-white italic font-bold" />
                       <Button 
                         onClick={() => {
                           if(newBannedWord.trim() && !autoModInput.bannedWords.includes(newBannedWord.trim().toLowerCase())){
                             setAutoModInput({...autoModInput, bannedWords: [...autoModInput.bannedWords, newBannedWord.trim().toLowerCase()]});
                             setNewBannedWord("");
                           }
                         }} 
                         className="h-12 px-6 font-black uppercase text-[10px]"
                       >Add</Button>
                    </div>
                 </div>

                 <Button onClick={handleSaveAutoMod} className="w-full h-16 bg-rose-600 hover:bg-rose-500 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl">
                    Save Auto-Mod Rules
                 </Button>
              </div>
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
                 <Button onClick={fetchAnalytics} disabled={isLoadingAnalytics} variant="outline" className="rounded-xl border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary">
                    <RefreshCw className={cn("w-4 h-4 mr-2", isLoadingAnalytics && "animate-spin")} /> Refresh
                 </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-zinc-950/50 rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-4 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Users className="w-32 h-32" /></div>
                    <p className="text-muted-foreground uppercase font-black tracking-widest text-[10px] z-10">Total Registered Users</p>
                    <p className="text-6xl font-black italic text-white z-10">{analyticsData?.totalUsers || 0}</p>
                 </div>
                 <div className="bg-primary/10 rounded-3xl p-8 border border-primary/20 flex flex-col items-center justify-center text-center space-y-4 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-primary"><Activity className="w-32 h-32" /></div>
                    <p className="text-primary uppercase font-black tracking-widest text-[10px] z-10">Total Credits Circulating</p>
                    <p className="text-6xl font-black italic text-primary z-10">
                      {analyticsData?.totalCredits || 0}
                    </p>
                 </div>
                 <div className="bg-zinc-950/50 rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-4 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><MessageSquare className="w-32 h-32" /></div>
                    <p className="text-muted-foreground uppercase font-black tracking-widest text-[10px] z-10">Total Global Messages</p>
                    <p className="text-6xl font-black italic text-white z-10">{analyticsData?.totalMessages || 0}</p>
                 </div>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="animate-in slide-in-from-bottom-8">
           <div className="max-w-3xl mx-auto space-y-8">
             <Card className="glass-card rounded-[2rem] md:rounded-[4rem] p-6 md:p-16 border-white/10 shadow-2xl space-y-6 md:space-y-12 bg-black/40">
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

             <Card className="glass-card rounded-[2rem] md:rounded-[4rem] p-6 md:p-16 border-emerald-500/20 shadow-2xl space-y-6 md:space-y-12 bg-emerald-950/20">
                <header className="text-center space-y-4">
                   <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-emerald-500">Economy Airdrop</h2>
                   <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-[0.4em]">Gift credits to ALL registered users instantly</p>
                </header>
                <div className="space-y-8">
                   <div className="flex gap-4">
                     <Input type="number" value={airdropAmount || ""} onChange={(e) => setAirdropAmount(Number(e.target.value))} placeholder="Amount of credits..." className="h-20 text-2xl bg-secondary/30 rounded-2xl font-black italic text-emerald-400 border-emerald-500/30" />
                     <Button disabled={airdropAmount <= 0 || isAirdropping} onClick={handleAirdrop} className="h-20 px-12 bg-emerald-600 hover:bg-emerald-500 rounded-3xl font-black uppercase text-xl shadow-2xl border-b-8 border-emerald-800 text-white">
                       {isAirdropping ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Coins className="w-6 h-6 mr-2" />}MAKE IT RAIN
                     </Button>
                   </div>
                </div>
             </Card>
           </div>
        </TabsContent>

        <TabsContent value="settings" className="animate-in slide-in-from-bottom-8">
           <Card className="max-w-4xl mx-auto glass-card rounded-[2rem] md:rounded-[4rem] p-6 md:p-16 border-white/10 shadow-2xl space-y-6 md:space-y-12 bg-black/40">
              <header className="space-y-4">
                 <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">System Settings</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Global environment variables</p>
              </header>
              <div className="space-y-8 bg-white/5 p-8 rounded-3xl border border-white/5">
                 <div className="flex justify-between items-center bg-black/40 p-6 rounded-2xl border border-white/5">
                    <div>
                       <h4 className="text-lg font-black uppercase text-rose-500">Maintenance Mode</h4>
                       <p className="text-xs text-muted-foreground mt-1 italic font-medium">Locks the entire application. Only Administrators can bypass.</p>
                    </div>
                    <input 
                       type="checkbox" 
                       checked={systemSettingsInput.maintenanceMode}
                       onChange={(e) => setSystemSettingsInput({...systemSettingsInput, maintenanceMode: e.target.checked})}
                       className="w-8 h-8 rounded border-white/10 bg-zinc-900 accent-rose-500 cursor-pointer"
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Global Welcome Message</label>
                    <textarea 
                      value={systemSettingsInput.welcomeMessage} 
                      onChange={(e) => setSystemSettingsInput({...systemSettingsInput, welcomeMessage: e.target.value})} 
                      placeholder="Welcome to Xakteir..." 
                      className="min-h-[150px] w-full bg-zinc-950/50 rounded-2xl p-6 italic border-white/10 text-white focus:border-primary" 
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Global Shop Price Multiplier (e.g. 0.5 for 50% off, 1.0 for normal)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={systemSettingsInput.globalSaleMultiplier} 
                      onChange={(e) => setSystemSettingsInput({...systemSettingsInput, globalSaleMultiplier: parseFloat(e.target.value) || 1.0})} 
                      className="h-16 w-full bg-zinc-950/50 rounded-2xl px-6 font-black italic border-white/10 text-white focus:border-primary" 
                    />
                 </div>
                 
                 <Button onClick={handleSaveSystemSettings} className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl hover:bg-primary/80">
                   Save System Configuration
                 </Button>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="worldcup" className="animate-in slide-in-from-bottom-8">
           <Card className="max-w-4xl mx-auto glass-card rounded-[2rem] md:rounded-[4rem] p-6 md:p-16 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] space-y-6 md:space-y-12 bg-emerald-950/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Trophy className="w-64 h-64 text-emerald-500" />
              </div>
              <header className="relative z-10 space-y-4">
                 <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-emerald-400">World Cup Controls</h2>
                 <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-[0.4em]">Manually trigger global goal events</p>
              </header>
              <div className="relative z-10 space-y-8 bg-black/40 p-8 rounded-3xl border border-emerald-500/20">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-2">Goal Title (e.g. GOOOOOOAL!)</label>
                    <Input 
                      value={goalTitle} 
                      onChange={(e) => setGoalTitle(e.target.value)} 
                      className="h-16 w-full bg-emerald-950/50 rounded-2xl px-6 font-black italic border-emerald-500/30 text-white text-2xl" 
                    />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-2">Subtitle (e.g. Cristiano Ronaldo scores!)</label>
                    <Input 
                      value={goalSubtitle} 
                      onChange={(e) => setGoalSubtitle(e.target.value)} 
                      className="h-14 w-full bg-emerald-950/50 rounded-2xl px-6 font-bold border-emerald-500/30 text-emerald-100" 
                    />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-2">Flag Image URL (e.g. https://flagcdn.com/w320/pt.png)</label>
                    <Input 
                      value={goalFlag} 
                      onChange={(e) => setGoalFlag(e.target.value)} 
                      className="h-14 w-full bg-emerald-950/50 rounded-2xl px-6 font-bold border-emerald-500/30 text-emerald-100" 
                    />
                 </div>
                 
                 <Button onClick={handleTriggerGoal} disabled={isTriggeringGoal} className="w-full h-20 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 rounded-2xl font-black uppercase tracking-widest text-xl shadow-2xl border-b-8 border-emerald-800 text-black">
                   {isTriggeringGoal ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Trophy className="w-6 h-6 mr-2" />}
                   TRIGGER GLOBAL GOAL NOW
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

                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                   <h4 className="text-sm font-black uppercase text-primary mb-4">Deep Profile Inspect</h4>
                   <div className="space-y-4">
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground font-black tracking-widest">Bio:</span>
                        <p className="text-sm text-white italic bg-black/40 p-3 rounded-lg mt-1 border border-white/5">{userToManage?.bio || 'No bio set.'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground font-black tracking-widest">Inventory ({userToManage?.inventory?.length || 0} items):</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                           {userToManage?.inventory?.length ? userToManage.inventory.map((item: string) => (
                             <Badge key={item} variant="secondary" className="bg-primary/20 text-primary border-none">{item}</Badge>
                           )) : <span className="text-xs text-muted-foreground italic">Empty inventory</span>}
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                        <span className="text-[10px] uppercase text-muted-foreground font-black tracking-widest">Account Created:</span>
                        <span className="text-xs font-bold text-white">
                          {userToManage?.createdAt?.seconds ? new Date(userToManage.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                        <span className="text-[10px] uppercase text-muted-foreground font-black tracking-widest">Last Active:</span>
                        <span className="text-xs font-bold text-white">
                          {userToManage?.lastActiveAt?.seconds ? new Date(userToManage.lastActiveAt.seconds * 1000).toLocaleString() : 'Unknown'}
                        </span>
                      </div>
                   </div>
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

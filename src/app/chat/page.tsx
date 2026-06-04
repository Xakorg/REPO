"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Hash, 
  Video, 
  Send, 
  Search, 
  X, 
  Smile, 
  Loader2, 
  Users, 
  LayoutGrid, 
  MoreVertical, 
  UserCircle, 
  UserPlus, 
  MessageCircle, 
  Home, 
  Image as ImageIcon,
  Plus,
  Monitor,
  Trash2,
  Mic,
  MicOff,
  Menu,
  CheckCircle2,
  Globe,
  Zap,
  Phone,
  ShieldCheck,
  Gamepad2,
  Brain,
  Lock,
  Coins,
  Palette,
  Sparkles,
  Layers,
  ArrowRight,
  FileText,
  Presentation,
  Terminal,
  Activity,
  UserCheck,
  Volume2,
  Pin,
  ChevronDown,
  ChevronRight,
  Flame,
  Star,
  Download,
  Share2,
  Heart,
  Settings,
  Bell,
  Radio,
  FileArchive,
  BarChart3,
  Code2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage, useDoc } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit, doc, where, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FEATURE_CATEGORIES = [
  {
    title: "Core Messaging",
    icon: MessageCircle,
    color: "text-emerald-500",
    features: [
      "1-to-1 & Group Messaging", "Threaded Replies", "Message Reactions", "@Mentions", "Voice & Video Messages", "Message Editing & Deletion", "Scheduled & Disappearing Messages", "Pinned Messages", "Smart AI Search"
    ]
  },
  {
    title: "Servers & Communities",
    icon: Users,
    color: "text-blue-500",
    features: [
      "Public & Private Servers", "Roles & Permissions System", "Channel Categories", "Announcement Channels", "Community Discovery", "QR-Code Joining", "Invite Links", "Verified Communities", "Server Templates", "Server Analytics", "AI Moderation Tools", "Manual Moderation Tools", "Auto Moderation Rules", "XP & Leveling System", "Server Achievements", "Server Boosts", "Community Events", "Community Announcements", "Temporary Event Channels", "Dynamic Roles", "Member Activity Tracking"
    ]
  },
  {
    title: "Voice & Video",
    icon: Video,
    color: "text-rose-500",
    features: [
      "HD Group Voice & Video Calls", "Drop-in Voice Spaces", "Screen & Window Sharing", "Noise Suppression", "Voice Filters", "Call Recording", "Live Captions & Translation", "Mute/Deafen Controls"
    ]
  },
  {
    title: "Gaming & Social",
    icon: Gamepad2,
    color: "text-purple-500",
    features: [
      "Instant Play Mini-Games", "Server Tournaments", "Seasonal Events", "User Profiles & Themes", "Friend Activity Presence", "Hangout Rooms", "RSVP System", "Animated Profiles", "Trust Score System"
    ]
  },
  {
    title: "AI Features",
    icon: Brain,
    color: "text-primary",
    features: [
      "Chat Summarization", "“Catch me up” button", "Smart Reply Suggestions", "AI Translations", "AI voice translation", "AI moderation", "Spam Detection", "Toxicity Filtering", "Smart Notification Filtering"
    ]
  },
  {
    title: "Privacy & Security",
    icon: ShieldCheck,
    color: "text-emerald-400",
    features: [
      "End-to-end encryption", "Invisible/Ghost Mode", "Block & Report System", "Login Alerts", "Privacy Level Slider", "Two-Factor Auth Support", "Hidden & Locked Chats"
    ]
  }
];

const SERVERS = [
  { id: 'home', name: 'Home', icon: Home, color: 'bg-primary' },
  { id: 'xakteir', name: 'Xakteir Hub', icon: Zap, color: 'bg-amber-500' },
  { id: 'gaming', name: 'Gaming Zone', icon: Gamepad2, color: 'bg-purple-500' },
  { id: 'dev', name: 'Dev Sector', icon: Code2, color: 'bg-blue-500' },
  { id: 'discover', name: 'Discovery', icon: Globe, color: 'bg-emerald-500' },
];

const EXTENSIONS = [
  { id: 'poll', name: "Poll Tool", icon: Activity, desc: "Run instant community votes.", href: "#" },
  { id: 'whiteboard', name: "Whiteboard", icon: Presentation, desc: "Draw together in real-time.", href: "/whiteboard" },
  { id: 'notes', name: "Shared Notes", icon: FileText, desc: "Collaborate on documents.", href: "/suite" },
  { id: 'qa', name: "Q&A Mode", icon: Zap, desc: "Organized question handling.", href: "#" },
  { id: 'games', name: "Mini Games", icon: Gamepad2, desc: "Drop-in social activities.", href: "/games" },
];

const PUBLIC_CHANNEL_IDS = new Set(["general", "announcements", "logic-lab", "design", "market"]);

export default function XakChatPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeServer, setActiveServer] = useState('home');
  const [activeTarget, setActiveTarget] = useState<any>({ id: 'general', name: 'General', type: 'channel' });
  const [chatInput, setChatInput] = useState("");
  const [rightPanel, setRightPanel] = useState<'members' | 'extensions' | 'files'>('members');
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // --- Permission-checked messages subscription ---
  const chatDocRef = useMemoFirebase(() => {
    if (!firestore || !activeTarget) return null;
    return doc(firestore, "chats", activeTarget.id);
  }, [firestore, activeTarget]);

  const { data: chatDoc } = useDoc(chatDocRef);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "admins", user.uid);
  }, [firestore, user]);

  const { data: adminRole } = useDoc(adminRoleRef);

  const allowedToReadMessages = !!(
    PUBLIC_CHANNEL_IDS.has(activeTarget?.id) ||
    chatDoc?.public === true ||
    (user && Array.isArray(chatDoc?.participants) && chatDoc.participants.includes(user.uid)) ||
    !!adminRole
  );

  const messagesQueryBelow = useMemoFirebase(() => {
    if (!firestore || !allowedToReadMessages || !activeTarget) return null;
    return query(
      collection(firestore, "chats", activeTarget.id, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );
  }, [firestore, allowedToReadMessages, activeTarget]);

  // Replace messages subscription with the permission-checked one
  const { data: messagesChecked, isLoading: isMessagesLoadingChecked } = useCollection(messagesQueryBelow);

  // Use the permission-checked results for rendering
  const effectiveMessages = messagesChecked;
  const effectiveIsMessagesLoading = isMessagesLoadingChecked;

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users"), limit(20));
  }, [firestore, user]);
  const { data: hubMembers } = useCollection(usersQuery);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [effectiveMessages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !user || !firestore || isSending) return;

    const content = chatInput.trim();
    setChatInput("");
    setIsSending(true);

    try {
      await addDocumentNonBlocking(collection(firestore, "chats", activeTarget.id, "messages"), {
        content,
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        channelId: activeTarget.id,
        channelName: activeTarget.name,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      setChatInput(content);
      toast({
        variant: "destructive",
        title: "Message failed",
        description: "Chat could not send your message right now."
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCatchUp = () => {
    toast({ 
      title: "AI Summarization", 
      description: "Xak AI is analyzing the recent messages." 
    });
  };

  if (!mounted) return null;
  if (isUserLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#05030d] text-foreground animate-fade-in overflow-y-auto pb-40">
        <section className="flex flex-col items-center justify-center text-center px-6 relative overflow-hidden pt-32 pb-40">
          <div className="absolute inset-0 arcade-grid opacity-10" />
          <div className="relative z-10 space-y-12 max-w-6xl">
            <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-8 py-3 rounded-full font-black uppercase tracking-[0.4em] text-[10px]">
              XAKCHAT — PRO COMMUNICATION
            </Badge>
            <div className="space-y-6">
              <h1 className="text-6xl md:text-[9rem] font-black tracking-tighter uppercase italic leading-[0.85] text-white">
                Everything <br />
                <span className="text-emerald-500 flex items-center justify-center gap-4">Connects</span>
              </h1>
              <p className="text-xl md:text-4xl text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-4xl mx-auto italic opacity-60">
                A hybrid social, gaming, and professional experience.
              </p>
            </div>
            <div className="pt-10">
              <Link href="/auth">
                <Button className="h-24 px-20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2.5rem] font-black text-2xl uppercase italic shadow-[0_30px_100px_rgba(16,185,129,0.3)] transition-all active:scale-95 border-b-[12px] border-emerald-800 active:border-b-0">
                  Join the Hub
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {FEATURE_CATEGORIES.map((cat) => (
            <Card key={cat.title} className="glass-card p-12 rounded-[4rem] border-white/5 space-y-8 group hover:border-emerald-500/40 transition-all bg-black/40 shadow-2xl">
              <div className={cn("w-20 h-20 rounded-[2.5rem] bg-zinc-900 flex items-center justify-center border-4 border-white/10 group-hover:scale-110 transition-transform shadow-xl", cat.color)}>
                <cat.icon className="w-10 h-10" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase italic text-white tracking-tight">{cat.title}</h3>
                <ul className="space-y-3">
                  {cat.features.slice(0, 5).map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80 italic">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {f}
                    </li>
                  ))}
                  <li className="text-[10px] font-black uppercase text-primary tracking-widest pt-2">...and much more</li>
                </ul>
              </div>
            </Card>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex overflow-hidden animate-fade-in text-white relative">
      {/* 1. SERVER RAIL */}
      <aside className="w-20 bg-[#05030d] border-r border-white/5 flex flex-col items-center py-6 gap-4 z-30">
        {SERVERS.map(s => (
          <button 
            key={s.id}
            onClick={() => setActiveServer(s.id)}
            className={cn(
              "w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all duration-300 relative group",
              activeServer === s.id ? "bg-primary text-black rounded-[0.8rem]" : "bg-white/5 text-white/40 hover:bg-primary hover:text-black hover:rounded-[0.8rem]"
            )}
          >
            <s.icon className="w-6 h-6" />
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/90 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
              {s.name}
            </div>
            {activeServer === s.id && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />}
          </button>
        ))}
        <div className="w-8 h-0.5 bg-white/5 mx-auto" />
        <button className="w-12 h-12 rounded-full bg-white/5 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all">
          <Plus className="w-6 h-6" />
        </button>
      </aside>

      {/* 2. CHANNEL SIDEBAR */}
      <aside className="w-64 bg-[#0a0a15] border-r border-white/5 flex flex-col z-20">
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between shadow-xl">
           <h2 className="text-sm font-black uppercase italic tracking-tighter text-white">Xakteir Hub</h2>
           <ChevronDown className="w-4 h-4 text-white/40" />
        </header>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-8">
             <div className="space-y-1">
                <p className="px-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3 flex items-center justify-between">
                  Broadcasts <Plus className="w-3 h-3" />
                </p>
                <button onClick={() => setActiveTarget({ id: 'announcements', name: 'Announcements', type: 'channel' })} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all", activeTarget.id === 'announcements' ? "bg-primary/20 text-white font-bold" : "text-white/40 hover:bg-white/5")}><Radio className="w-4 h-4 text-rose-500" /> announcements</button>
             </div>

             <div className="space-y-1">
                <p className="px-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3 flex items-center justify-between">
                  Text Channels <Plus className="w-3 h-3" />
                </p>
                {['general', 'logic-lab', 'design', 'market'].map(name => (
                  <button 
                    key={name} 
                    onClick={() => setActiveTarget({ id: name, name, type: 'channel' })} 
                    className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all", activeTarget.id === name ? "bg-primary/20 text-white font-bold" : "text-white/40 hover:bg-white/5")}
                  >
                    <Hash className="w-4 h-4 opacity-40" /> {name}
                  </button>
                ))}
             </div>

             <div className="space-y-1">
                <p className="px-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Voice Hub</p>
                {['General Lounge', 'Gaming Pod A', 'Music Sync'].map(name => (
                  <button key={name} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/40 hover:bg-white/5 transition-all"><Volume2 className="w-4 h-4" /> {name}</button>
                ))}
             </div>
          </div>
        </ScrollArea>
        <footer className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 border border-white/10"><AvatarImage src={user.photoURL || ""} /><AvatarFallback>{user.displayName?.[0]}</AvatarFallback></Avatar>
              <div className="overflow-hidden">
                 <p className="text-[10px] font-black uppercase italic truncate text-white">{user.displayName?.replace(/^@+/, "")}</p>
                 <p className="text-[8px] font-bold text-muted-foreground uppercase">Online</p>
              </div>
           </div>
           <div className="flex gap-1">
              <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"><Mic className="w-3.5 h-3.5" /></button>
              <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"><Settings className="w-3.5 h-3.5" /></button>
           </div>
        </footer>
      </aside>

      {/* 3. MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl z-20 shadow-lg">
           <div className="flex items-center gap-4">
              <Hash className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter truncate">{activeTarget.name}</h3>
           </div>
           <div className="flex items-center gap-6">
              <Button onClick={handleCatchUp} variant="ghost" className="h-9 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest gap-2">
                 <Brain className="w-3.5 h-3.5" /> Catch Me Up
              </Button>
              <div className="flex gap-4 border-l border-white/5 pl-6">
                 <button className="text-white/40 hover:text-white transition-colors"><Pin className="w-5 h-5" /></button>
                 <button className="text-white/40 hover:text-white transition-colors"><Users className="w-5 h-5" /></button>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                    <Input placeholder="Search messages..." className="h-9 bg-black/40 border-none rounded-xl pl-9 text-[10px] font-bold w-48" />
                 </div>
              </div>
           </div>
        </header>

        <ScrollArea className="flex-1 p-8" ref={scrollRef}>
           <div className="max-w-5xl mx-auto space-y-8 pb-20">
              {effectiveIsMessagesLoading ? (
                <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>
              ) : effectiveMessages?.length === 0 ? (
                <div className="py-40 text-center space-y-6 opacity-20 italic">
                   <MessageCircle className="w-16 h-16 mx-auto" />
                   <p className="text-sm font-black uppercase tracking-[0.4em]">Initialize Conversation</p>
                </div>
              ) : effectiveMessages?.map((msg) => (
                <div key={msg.id} className={cn("flex gap-5", msg.senderId === user.uid && "flex-row-reverse")}>
                   <Avatar className="w-11 h-11 rounded-[1.1rem] border-2 border-white/5 shrink-0"><AvatarFallback className="bg-primary/20 text-primary font-black text-xs">{msg.senderName?.[0]}</AvatarFallback></Avatar>
                   <div className={cn("flex flex-col space-y-1.5 max-w-[70%]", msg.senderId === user.uid && "items-end")}>
                      <span className="text-[9px] font-black uppercase italic tracking-widest px-2 text-white/60">{msg.senderName}</span>
                      <div className={cn("p-5 rounded-[1.8rem] shadow-2xl border transition-all italic text-sm font-medium leading-relaxed", msg.senderId === user.uid ? "bg-primary text-white border-primary/20 rounded-tr-none" : "bg-[#18181b] border-white/5 rounded-tl-none text-foreground/90")}>
                         {msg.content}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </ScrollArea>

        <div className="p-6 bg-zinc-950 border-t border-white/5 z-20">
           <form onSubmit={(e) => handleSend(e)} className="max-w-5xl mx-auto flex items-end gap-4">
              <div className="flex-1 bg-black/40 border-2 border-white/10 rounded-[1.8rem] p-3 flex items-center gap-4">
                 <button type="button" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"><Plus className="w-5 h-5" /></button>
                 <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="border-none bg-transparent focus-visible:ring-0 text-white text-sm italic" />
                 <button type="button" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"><Smile className="w-5 h-5" /></button>
              </div>
              <Button type="submit" size="icon" className="h-16 w-16 bg-primary rounded-[1.5rem] shadow-2xl active:scale-90 flex items-center justify-center"><Send className="w-6 h-6 text-white" /></Button>
           </form>
        </div>
      </main>

      {/* 4. RIGHT SIDEBAR (MEMBERS & EXTENSIONS) */}
      <aside className="w-72 bg-[#0a0a15] border-l border-white/5 flex flex-col z-20">
         <Tabs value={rightPanel} onValueChange={(v: any) => setRightPanel(v)} className="h-full flex flex-col">
            <TabsList className="h-14 bg-black/40 border-b border-white/5 rounded-none p-1 gap-1">
               <TabsTrigger value="members" className="flex-1 rounded-lg text-[9px] font-black uppercase tracking-widest"><Users className="w-3.5 h-3.5 mr-2" /> Members</TabsTrigger>
               <TabsTrigger value="extensions" className="flex-1 rounded-lg text-[9px] font-black uppercase tracking-widest"><Zap className="w-3.5 h-3.5 mr-2" /> Hub Apps</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="flex-1 overflow-hidden m-0">
               <ScrollArea className="h-full p-4">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <p className="px-3 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Architects — 1</p>
                        <div className="p-3 rounded-xl hover:bg-white/5 flex items-center gap-3 transition-all cursor-pointer group">
                           <div className="relative"><Avatar className="w-9 h-9 border-2 border-primary/40"><AvatarImage src="https://picsum.photos/seed/ridwan/100" /><AvatarFallback>R</AvatarFallback></Avatar><div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" /></div>
                           <div className="overflow-hidden"><p className="text-[11px] font-black uppercase text-primary italic truncate">Ridwan</p><p className="text-[8px] font-bold text-white/30 uppercase">Building...</p></div>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <p className="px-3 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Online — {hubMembers?.length || 0}</p>
                        {hubMembers?.map(m => (
                          <div key={m.id} className="p-3 rounded-xl hover:bg-white/5 flex items-center gap-3 transition-all cursor-pointer group">
                             <div className="relative"><Avatar className="w-9 h-9 border border-white/10"><AvatarImage src={m.photoURL} /><AvatarFallback>{m.displayName?.[0]}</AvatarFallback></Avatar><div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" /></div>
                             <div className="overflow-hidden"><p className="text-[11px] font-bold text-white/80 uppercase truncate">{m.displayName?.replace(/^@+/, "")}</p><p className="text-[8px] font-bold text-muted-foreground uppercase italic">Level {m.level || 1}</p></div>
                          </div>
                        ))}
                     </div>
                  </div>
               </ScrollArea>
            </TabsContent>

            <TabsContent value="extensions" className="flex-1 overflow-hidden m-0 flex flex-col">
               <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                     {EXTENSIONS.map(ext => (
                       <Link key={ext.id} href={ext.href}>
                        <Card className="glass-card p-5 rounded-2xl border-white/5 bg-black/40 hover:border-primary/40 transition-all group cursor-pointer shadow-xl mb-4">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:text-primary transition-colors"><ext.icon className="w-5 h-5" /></div>
                              <div className="overflow-hidden">
                                 <h4 className="text-[11px] font-black uppercase text-white italic">{ext.name}</h4>
                                 <p className="text-[9px] font-medium text-muted-foreground italic truncate">{ext.desc}</p>
                              </div>
                           </div>
                        </Card>
                       </Link>
                     ))}
                     
                     <div className="pt-8 border-t border-white/5">
                        <Card className="p-8 rounded-[2.5rem] bg-primary/5 border-4 border-dashed border-primary/20 text-center space-y-6 group hover:border-primary/40 transition-all">
                           <Sparkles className="w-10 h-10 text-primary mx-auto animate-float" />
                           <div>
                              <p className="text-xs font-black uppercase italic text-white/80">Cant find what you are looking for?</p>
                              <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary mt-2">Make your own extension today!</h3>
                           </div>
                           <Link href="/games/studio">
                              <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                                 TRY NOW
                              </Button>
                           </Link>
                        </Card>
                     </div>
                  </div>
               </ScrollArea>
            </TabsContent>
         </Tabs>
      </aside>
    </div>
  );
}

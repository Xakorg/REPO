"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Hash, 
  Home, 
  Globe, 
  Zap, 
  Gamepad2, 
  Code2, 
  Plus, 
  Radio, 
  Hash as HashIcon,
  Volume2, 
  Mic, 
  Settings, 
  Menu, 
  Users, 
  PlusCircle, 
  UserPlus, 
  MessageCircle,
  Inbox,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, addDoc, serverTimestamp, getDocs, limit, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { RenderHat } from "@/components/RenderHat";
import { Card } from "@/components/ui/card";

const SERVERS = [
  { id: 'home', name: 'Home', icon: Home, color: 'bg-primary', href: '/chat' },
  { id: 'xakteir', name: 'Xakteir Hub', icon: Zap, color: 'bg-amber-500', href: '/chat/s/xakteir' },
  { id: 'gaming', name: 'Gaming Zone', icon: Gamepad2, color: 'bg-purple-500', href: '/chat/s/gaming' },
  { id: 'dev', name: 'Dev Sector', icon: Code2, color: 'bg-blue-500', href: '/chat/s/dev' },
  { id: 'discover', name: 'Discovery', icon: Globe, color: 'bg-emerald-500', href: '/chat/s/discover' },
];

const EXTENSIONS = [
  { id: 'poll', name: "Poll Tool", icon: Zap, desc: "Run instant community votes.", href: "#" },
  { id: 'whiteboard', name: "Whiteboard", icon: Zap, desc: "Draw together in real-time.", href: "/whiteboard" },
  { id: 'notes', name: "Shared Notes", icon: Zap, desc: "Collaborate on documents.", href: "/suite" },
  { id: 'games', name: "Mini Games", icon: Gamepad2, desc: "Drop-in social activities.", href: "/games" },
];

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [rightPanel, setRightPanel] = useState<'members' | 'extensions'>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse pathname to see where we are
  const isServerRoute = pathname.startsWith("/chat/s/");
  const isDmRoute = pathname.startsWith("/chat/dm/");
  
  let activeServer = 'home';
  let serverName = '';
  if (isServerRoute) {
    const parts = pathname.split("/");
    serverName = parts[3] || 'xakteir';
    activeServer = serverName;
  }

  // Get active DM username if on DM route
  let activeDmUsername = '';
  if (isDmRoute) {
    const parts = pathname.split("/");
    activeDmUsername = parts[3] || '';
  }

  // Fetch current user details for the hat overlay
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);

  // Fetch other users to display in DM lobby list
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users"), limit(30));
  }, [firestore, user]);
  const { data: hubMembers } = useCollection(usersQuery);

  // Query DMs where user is a participant
  const dmsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "chats"),
      where("participants", "array-contains", user.uid),
      where("public", "==", false)
    );
  }, [firestore, user]);
  const { data: activeDms } = useCollection(dmsQuery);

  // Resolve active DM friend profile details
  const friendUserQuery = useMemoFirebase(() => {
    if (!firestore || !activeDmUsername) return null;
    return query(collection(firestore, "users"), where("username", "==", activeDmUsername), limit(1));
  }, [firestore, activeDmUsername]);
  const { data: friendUserDocs } = useCollection(friendUserQuery);
  const activeFriendData = friendUserDocs?.[0];

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !user || !firestore) return;
    setIsInviting(true);
    try {
      // Write invitation record
      await addDoc(collection(firestore, "invitations"), {
        fromUid: user.uid,
        fromName: user.displayName || "A user",
        toEmail: inviteEmail.trim().toLowerCase(),
        timestamp: serverTimestamp(),
        status: "pending"
      });

      // Notify if the email belongs to an existing user
      const q = query(collection(firestore, "users"), where("email", "==", inviteEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const recipientUid = snap.docs[0].id;
        await addDoc(collection(firestore, "users", recipientUid, "notifications"), {
          title: "Chat Invitation",
          message: `@${user.displayName?.replace(/^@+/, "") || "A user"} invited you to join their chat.`,
          type: 'social',
          read: false,
          timestamp: serverTimestamp()
        });
      }

      toast({ title: "Invitation Sent", description: `An invite was transmitted to ${inviteEmail}.` });
      setInviteEmail("");
      setShowInviteModal(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Invite Failed", description: "Failed to send invitation." });
    } finally {
      setIsInviting(false);
    }
  };

  const handleStartDM = (friendUsername: string) => {
    router.push(`/chat/dm/${friendUsername}`);
  };

  if (!mounted) return null;
  if (!user) return <>{children}</>; // let page.tsx render the landing page for unauth users

  return (
    <div className="h-[calc(100vh-80px)] flex overflow-hidden bg-zinc-950 text-white relative">
      <div className="absolute inset-0 arcade-grid opacity-[0.02] pointer-events-none" />

      {/* 1. LEFT SERVER RAIL */}
      <aside className="hidden md:flex w-20 bg-[#05030d] border-r border-white/5 flex-col items-center py-6 gap-4 z-30 shrink-0">
        {SERVERS.map(s => (
          <button 
            key={s.id}
            onClick={() => router.push(s.href)}
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
        <div className="w-8 h-px bg-white/5 mx-auto" />
        <button 
          onClick={() => setShowInviteModal(true)}
          className="w-12 h-12 rounded-full bg-white/5 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </aside>

      {/* 2. MIDDLE CHANNEL/DM SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#0a0a15] border-r border-white/5 flex-col z-20 shrink-0">
        {activeServer === 'home' ? (
          <>
            <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between shadow-xl">
               <h2 className="text-sm font-black uppercase italic tracking-tighter text-white">Direct Messages</h2>
               <button onClick={() => setShowInviteModal(true)} className="text-white/40 hover:text-white transition-colors">
                  <UserPlus className="w-4 h-4" />
               </button>
            </header>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-8">
                <div className="space-y-2">
                   <p className="px-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">
                     Conversations
                   </p>
                   {!activeDms?.length ? (
                     <p className="text-[10px] text-white/20 italic px-2">No active private chats. Select a member below to begin!</p>
                   ) : (
                     activeDms.map(chat => (
                       <DMContactItem 
                         key={chat.id} 
                         chatId={chat.id} 
                         participants={chat.participants} 
                         activeChatId={isDmRoute ? pathname : null} 
                         currentUserId={user.uid} 
                       />
                     ))
                   )}
                </div>

                <div className="space-y-2">
                   <p className="px-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">
                     Hub Members
                   </p>
                   <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                     {hubMembers?.filter(m => m.id !== user.uid && !m.isHidden).map(m => {
                       const displayName = m.displayName?.replace(/^@+/, "") || "Member";
                       return (
                         <button 
                           key={m.id}
                           onClick={() => handleStartDM(m.username || m.id)}
                           className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/40 hover:bg-white/5 hover:text-white transition-all text-left"
                         >
                           <div className="relative shrink-0">
                             <RenderHat hatKey={m.hat} />
                             <Avatar className="w-7 h-7 rounded-lg border border-white/10">
                               <AvatarImage src={m.photoURL} />
                               <AvatarFallback className="bg-zinc-800 text-[10px] font-black">{displayName[0]}</AvatarFallback>
                             </Avatar>
                           </div>
                           <span className="truncate font-bold">{displayName}</span>
                         </button>
                       );
                     })}
                   </div>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between shadow-xl">
               <h2 className="text-sm font-black uppercase italic tracking-tighter text-white">
                 {activeServer === 'xakteir' ? 'Xakteir Hub' : activeServer === 'gaming' ? 'Gaming Zone' : activeServer === 'dev' ? 'Dev Sector' : 'Discovery'}
               </h2>
            </header>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-8">
                 <div className="space-y-1">
                    <p className="px-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">
                      Broadcasts
                    </p>
                    <button 
                      onClick={() => router.push(`/chat/s/${activeServer}?c=announcements`)} 
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all", 
                        pathname.endsWith("/announcements") || (isServerRoute && pathname.includes(activeServer) && pathname.includes("announcements")) ? "bg-primary/20 text-white font-bold" : "text-white/40 hover:bg-white/5"
                      )}
                    >
                      <Radio className="w-4 h-4 text-rose-500" /> announcements
                    </button>
                 </div>

                 <div className="space-y-1">
                    <p className="px-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">
                      Text Channels
                    </p>
                    {['general', 'logic-lab', 'design', 'market'].map(name => {
                      const isSelected = pathname.endsWith(`/${activeServer}`) ? name === 'general' : pathname.includes(`?c=${name}`) || pathname.includes(`&c=${name}`) || (pathname.includes(activeServer) && pathname.endsWith(name));
                      return (
                        <button 
                          key={name} 
                          onClick={() => router.push(`/chat/s/${activeServer}?c=${name}`)} 
                          className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all text-left", isSelected ? "bg-primary/20 text-white font-bold" : "text-white/40 hover:bg-white/5")}
                        >
                          <HashIcon className="w-4 h-4 opacity-40" /> {name}
                        </button>
                      );
                    })}
                 </div>

                 <div className="space-y-1">
                    <p className="px-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Voice Hub</p>
                    {['General Lounge', 'Gaming Pod A', 'Music Sync'].map(name => (
                      <button key={name} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/40 hover:bg-white/5 transition-all text-left"><Volume2 className="w-4 h-4" /> {name}</button>
                    ))}
                 </div>
              </div>
            </ScrollArea>
          </>
        )}
        <footer className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative shrink-0">
                <RenderHat hatKey={userData?.hat} />
                <Avatar className="w-9 h-9 border border-white/10">
                  <AvatarImage src={user.photoURL || ""} className="object-cover" />
                  <AvatarFallback className="bg-zinc-800 text-white font-black text-sm">{user.displayName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <div className="overflow-hidden">
                 <p className="text-[10px] font-black uppercase italic truncate text-white">{user.displayName?.replace(/^@+/, "") || "User"}</p>
                 <p className="text-[8px] font-bold text-muted-foreground uppercase">Online</p>
              </div>
           </div>
           <div className="flex gap-1 shrink-0">
              <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"><Mic className="w-3.5 h-3.5" /></button>
              <button onClick={() => router.push('/profile/security')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"><Settings className="w-3.5 h-3.5" /></button>
           </div>
        </footer>
      </aside>

      {/* 3. MAIN CONTENT SLOT */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>

      {/* 4. RIGHT SIDEBAR */}
      <aside className="hidden xl:flex w-72 bg-[#0a0a15] border-l border-white/5 flex-col z-20 shrink-0">
        <Tabs value={rightPanel} onValueChange={(v: any) => setRightPanel(v)} className="h-full flex flex-col">
          <TabsList className="h-14 bg-black/40 border-b border-white/5 rounded-none p-1 gap-1">
             <TabsTrigger value="members" className="flex-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
               {isDmRoute ? <Inbox className="w-3.5 h-3.5 mr-2" /> : <Users className="w-3.5 h-3.5 mr-2" />} 
               {isDmRoute ? "Friend Info" : "Members"}
             </TabsTrigger>
             <TabsTrigger value="extensions" className="flex-1 rounded-lg text-[9px] font-black uppercase tracking-widest"><Zap className="w-3.5 h-3.5 mr-2" /> Hub Apps</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="flex-1 overflow-hidden m-0">
             <ScrollArea className="h-full p-6 text-white">
                {isDmRoute ? (
                  activeFriendData ? (
                    <div className="space-y-8 text-center animate-in fade-in duration-300">
                      <div className="relative w-28 h-28 mx-auto">
                        <RenderHat hatKey={activeFriendData.hat} />
                        <Avatar className="w-full h-full border-4 border-white/10 rounded-[2rem] bg-zinc-900">
                          <AvatarImage src={activeFriendData.photoURL} className="object-cover" />
                          <AvatarFallback className="bg-primary text-4xl font-black">{activeFriendData.displayName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                          {activeFriendData.displayName?.replace(/^@+/, "")}
                        </h4>
                        <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                          {activeFriendData.status === 'offline' ? 'Offline' : 'Online'}
                        </Badge>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-left space-y-3">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">About</p>
                        <p className="text-xs italic font-medium leading-relaxed opacity-80">{activeFriendData.description || "No bio description set."}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Credits</p>
                          <p className="text-lg font-black italic mt-1 text-amber-500">{(activeFriendData.currencyBalance || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Level</p>
                          <p className="text-lg font-black italic mt-1 text-primary">{activeFriendData.level || 1}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center opacity-30 italic text-xs">Resolving identity details...</div>
                  )
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <p className="px-3 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Architects — 1</p>
                       <div className="p-3 rounded-xl hover:bg-white/5 flex items-center gap-3 transition-all cursor-pointer group">
                          <div className="relative">
                            <Avatar className="w-9 h-9 border-2 border-primary/40"><AvatarImage src="https://picsum.photos/seed/ridwan/100" /><AvatarFallback>R</AvatarFallback></Avatar>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                          </div>
                          <div className="overflow-hidden"><p className="text-[11px] font-black uppercase text-primary italic truncate">Ridwan</p><p className="text-[8px] font-bold text-white/30 uppercase">Building...</p></div>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="px-3 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Online — {hubMembers?.length || 0}</p>
                       {hubMembers?.filter(m => !m.isHidden).map(m => {
                         const name = m.displayName?.replace(/^@+/, "") || "Member";
                         return (
                           <div 
                             key={m.id} 
                             onClick={() => handleStartDM(m.username || m.id)}
                             className="p-3 rounded-xl hover:bg-white/5 flex items-center gap-3 transition-all cursor-pointer group"
                           >
                              <div className="relative shrink-0">
                                 <RenderHat hatKey={m.hat} />
                                 <Avatar className="w-9 h-9 border border-white/10">
                                   <AvatarImage src={m.photoURL} />
                                   <AvatarFallback>{name[0]}</AvatarFallback>
                                 </Avatar>
                                 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                              </div>
                              <div className="overflow-hidden">
                                 <p className="text-[11px] font-bold text-white/80 uppercase truncate">{name}</p>
                                 <p className="text-[8px] font-bold text-muted-foreground uppercase italic">Level {m.level || 1}</p>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                )}
             </ScrollArea>
          </TabsContent>

          <TabsContent value="extensions" className="flex-1 overflow-hidden m-0 flex flex-col">
             <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                   {EXTENSIONS.map(ext => (
                     <Link key={ext.id} href={ext.href}>
                       <Card className="glass-card p-5 rounded-2xl border-white/5 bg-black/40 hover:border-primary/40 transition-all group cursor-pointer shadow-xl mb-4">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:text-primary transition-colors">
                               <ext.icon className="w-5 h-5" />
                             </div>
                             <div className="overflow-hidden">
                                <h4 className="text-[11px] font-black uppercase text-white italic">{ext.name}</h4>
                                <p className="text-[9px] font-medium text-muted-foreground italic truncate">{ext.desc}</p>
                             </div>
                          </div>
                       </Card>
                     </Link>
                   ))}
                </div>
             </ScrollArea>
          </TabsContent>
        </Tabs>
      </aside>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-foreground p-10 bg-zinc-950 text-white">
          <DialogHeader>
             <DialogTitle className="text-2xl font-black uppercase italic text-white flex items-center gap-3">
               <UserPlus className="w-6 h-6 text-emerald-500 animate-pulse" /> Invite a Friend
             </DialogTitle>
             <DialogDescription className="text-muted-foreground italic font-medium">Transmit an invite link to start collaborating.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 text-white">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Friend's Email Address</label>
              <Input 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)} 
                type="email"
                placeholder="name@email.com" 
                className="bg-secondary/50 h-14 rounded-xl font-bold border-white/10 text-white focus:border-primary" 
              />
            </div>
            <Button 
              onClick={handleSendInvite} 
              disabled={isInviting || !inviteEmail.includes("@")} 
              className="w-full h-16 bg-primary rounded-2xl font-black uppercase shadow-xl text-white transition-all"
            >
              {isInviting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null} Transmit invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DMContactItem({ chatId, participants, activeChatId, currentUserId }: { chatId: string, participants: string[], activeChatId: string | null, currentUserId: string }) {
  const firestore = useFirestore();
  const router = useRouter();
  const friendId = participants.find(id => id !== currentUserId);

  const friendRef = useMemoFirebase(() => {
    if (!firestore || !friendId) return null;
    return doc(firestore, "users", friendId);
  }, [firestore, friendId]);

  const { data: friendData } = useDoc(friendRef);

  if (!friendData) return null;

  const displayName = friendData.displayName?.replace(/^@+/, "") || "Member";
  const username = friendData.username || friendId;
  const isSelected = activeChatId?.endsWith(`/chat/dm/${username}`);

  return (
    <button
      onClick={() => router.push(`/chat/dm/${username}`)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all text-left group",
        isSelected ? "bg-primary/20 text-white font-bold" : "text-white/40 hover:bg-white/5"
      )}
    >
      <div className="relative shrink-0">
        <RenderHat hatKey={friendData.hat} />
        <Avatar className="w-8 h-8 rounded-lg border border-white/10">
          <AvatarImage src={friendData.photoURL} />
          <AvatarFallback className="bg-zinc-800 text-[10px] font-black text-white">{displayName[0]}</AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black",
          friendData.status === 'offline' ? "bg-zinc-500" : "bg-green-500"
        )} />
      </div>
      <div className="overflow-hidden">
        <p className={cn("font-bold truncate", isSelected ? "text-white" : "text-white/60 group-hover:text-white")}>{displayName}</p>
        <p className="text-[9px] text-muted-foreground truncate font-medium">@{username}</p>
      </div>
    </button>
  );
}

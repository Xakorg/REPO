"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Search, 
  TrendingUp, 
  UserPlus, 
  Sparkles,
  Globe,
  Loader2,
  UserMinus,
  MessageSquare,
  LayoutGrid,
  Send,
  Plus,
  X,
  Mail,
  Flame,
  Info,
  ChevronRight,
  ShieldCheck,
  Heart,
  Zap,
  BadgeCheck,
  Smile,
  RefreshCw,
  Flag
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, setDoc, deleteDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { RenderHat, RenderBanner, RenderDecor, RenderAura, RenderPet, getNameplateClass } from "@/components/RenderHat";
import { Award, Star, Sparkles as SparklesIcon, Flame as FlameIcon } from "lucide-react";

export default function XakSocialPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const chatQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "globalMessages"), orderBy("timestamp", "asc"), limit(50));
  }, [firestore]);

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "groups"), limit(50));
  }, [firestore]);

  const { data: chatMessages, isLoading: isChatLoading } = useCollection(chatQuery);
  const { data: groups } = useCollection(groupsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users"), limit(100));
  }, [firestore, user]);

  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersQuery);

  const visibleUsers = useMemo(() => {
    return allUsers?.filter(u => !u.isHidden) || [];
  }, [allUsers]);

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "following");
  }, [firestore, user]);

  const { data: followingList } = useCollection(followingQuery);
  const followingIds = new Set(followingList?.map(f => f.id) || []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !firestore) return;

    const content = chatInput;
    setChatInput("");

    try {
      const cleanName = user.displayName?.replace(/^@+/, "") || "Member";
      const userDataDoc = allUsers?.find(u => u.id === user.uid);
      await addDoc(collection(firestore, "globalMessages"), {
        content,
        uid: user.uid,
        senderId: user.uid,
        senderName: cleanName,
        senderPhoto: user.photoURL || "",
        timestamp: serverTimestamp(),
        aura: userDataDoc?.aura || null,
        nameplate: userDataDoc?.nameplate || null
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Chat Offline" });
    }
  };

  const handleFollow = async (member: any) => {
    if (!user || !firestore) return;
    const ref = doc(firestore, "users", user.uid, "following", member.id);
    const isFollowing = followingIds.has(member.id);
    
    try {
      if (isFollowing) {
        await deleteDoc(ref);
        toast({ title: "Unfollowed" });
      } else {
        await setDoc(ref, { 
          id: member.id, 
          displayName: member.displayName, 
          photoURL: member.photoURL || "", 
          timestamp: serverTimestamp() 
        });
        toast({ title: "Followed!" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleReport = async (member: any) => {
    if (!user || !firestore || !member) return;
    setIsReporting(true);
    try {
      const reason = prompt("Reason for report (Harassment, Spam, inappropriate Content):");
      if (!reason) {
        setIsReporting(false);
        return;
      }
      
      await addDoc(collection(firestore, "reports"), {
        targetId: member.id,
        targetName: member.displayName,
        targetType: 'user',
        reason: reason,
        reporterId: user.uid,
        reporterName: user.displayName || "Member",
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      
      toast({ title: "Report Transmitted", description: "Creators will review this profile." });
      setSelectedMember(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Transmission Failed" });
    } finally {
      setIsReporting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user || !firestore) return;
    try {
      await addDoc(collection(firestore, "groups"), {
        name: newGroupName,
        description: newGroupDesc,
        category: "GENERAL",
        ownerId: user.uid,
        memberCount: 1,
        timestamp: serverTimestamp()
      });
      setIsCreatingGroup(false);
      setNewGroupName("");
      setNewGroupDesc("");
      toast({ title: "Group Created!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error Creating Group" });
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-[1600px] mx-auto py-6 animate-fade-in px-6 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 glass-card p-10 rounded-[3rem] border-white/20 shadow-2xl relative overflow-hidden mb-8 text-foreground">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float">
          <Users className="w-80 h-80 -rotate-12 text-primary" />
        </div>
        <div className="relative z-10 flex items-center gap-8">
            <div className="w-16 h-16 rounded-[1.8rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-2xl">
              <Globe className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Social Space</h1>
              <p className="text-primary font-black uppercase tracking-[0.5em] text-[8px] mt-2 flex items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" /> Hub Community Active
              </p>
            </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-secondary/30 p-2 rounded-[2.5rem] h-18 gap-4 border-4 border-white/10 shadow-xl w-full max-w-4xl mx-auto">
          <TabsTrigger value="feed" className="flex-1 rounded-[1.5rem] h-full font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-primary transition-all"><MessageSquare className="w-4 h-4 mr-2" /> Global Feed</TabsTrigger>
          <TabsTrigger value="groups" className="flex-1 rounded-[1.5rem] h-full font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-primary transition-all"><LayoutGrid className="w-4 h-4 mr-2" /> Groups</TabsTrigger>
          <TabsTrigger value="members" className="flex-1 rounded-[1.5rem] h-full font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-primary transition-all"><Users className="w-4 h-4 mr-2" /> Members ({visibleUsers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="animate-in slide-in-from-bottom-4 duration-700">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 flex flex-col gap-8">
                 <Card className="glass-card rounded-[3rem] h-[650px] border-white/10 shadow-2xl flex flex-col overflow-hidden bg-black/40">
                    <ScrollArea className="flex-1 p-8" ref={scrollRef}>
                      <div className="space-y-6">
                        {isChatLoading ? (
                          <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>
                        ) : chatMessages?.map((msg) => (
                          <div key={msg.id} className={cn("flex gap-4 items-start animate-in slide-in-from-left-2 duration-300", msg.senderId === user?.uid && "flex-row-reverse")}>
                            <div 
                              className={cn("relative rounded-full p-1 cursor-pointer transition-transform hover:scale-110", msg.aura && `aura-${msg.aura}`)}
                              onClick={() => setSelectedMember(allUsers?.find(u => u.id === msg.senderId))}
                            >
                              <Avatar className="w-10 h-10 border-2 border-white/10"><AvatarImage src={msg.senderPhoto} /><AvatarFallback>{msg.senderName?.[0]}</AvatarFallback></Avatar>
                            </div>
                            <div className={cn("flex flex-col space-y-1", msg.senderId === user?.uid && "items-end")}>
                              <span className={cn("text-[9px] font-black uppercase italic tracking-widest px-2", msg.nameplate && `nameplate-${msg.nameplate}`)}>{msg.senderName}</span>
                              <div className={cn("p-5 rounded-[1.8rem] text-sm font-medium shadow-xl border italic", msg.senderId === user?.uid ? "bg-primary text-white border-primary/20 rounded-tr-none" : "bg-card/80 text-foreground border-white/10 rounded-tl-none")}>
                                {msg.content}
                              </div>
                              <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40 px-2">
                                {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString() : '...'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-6 bg-zinc-900/50 border-t border-white/10">
                      <form onSubmit={handleSendChat} className="flex gap-4">
                        <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Send a message..." className="bg-black/60 border-white/5 h-14 rounded-2xl px-6 font-bold text-xs shadow-inner italic text-white" />
                        <Button type="submit" size="icon" className="h-14 w-14 bg-primary rounded-2xl shadow-xl"><Send className="w-6 h-6 text-white" /></Button>
                      </form>
                    </div>
                 </Card>
              </div>

              <div className="lg:col-span-4 space-y-8">
                 <Card className="glass-card rounded-[3rem] p-10 border-white/10 bg-gradient-to-br from-primary/10 to-transparent shadow-xl">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-4 text-primary"><Flame className="w-6 h-6 animate-pulse" /> Trending Groups</h3>
                    <div className="space-y-4">
                       {groups?.slice(0, 4).map(g => (
                         <div key={g.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 transition-all flex items-center justify-between group cursor-pointer">
                            <div>
                               <h4 className="text-sm font-black uppercase italic text-foreground leading-none">{g.name}</h4>
                               <p className="text-[8px] font-bold text-muted-foreground uppercase mt-2">{g.memberCount} Members</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                         </div>
                       ))}
                    </div>
                 </Card>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="groups" className="animate-in fade-in duration-700">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
              <Card onClick={() => setIsCreatingGroup(true)} className="glass-card rounded-[3rem] border-4 border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center space-y-6 group hover:border-primary/40 transition-all cursor-pointer">
                 <div className="w-20 h-20 rounded-[2.5rem] bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-all shadow-xl">
                    <Plus className="w-10 h-10 text-muted-foreground group-hover:text-primary" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Create Group</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Build a new Hub community</p>
                 </div>
              </Card>

              {groups?.map(group => (
                <Card key={group.id} className="glass-card rounded-[3rem] border-white/10 overflow-hidden hover:border-primary/40 transition-all group cursor-pointer shadow-2xl flex flex-col">
                   <div className="h-32 bg-gradient-to-br from-primary/30 to-accent/30 p-8 flex justify-between items-start relative">
                      <div className="absolute inset-0 arcade-grid opacity-20" />
                      <Badge className="bg-black/60 border-none text-[8px] px-3 font-black z-10">{group.category?.toUpperCase() || 'GENERAL'}</Badge>
                      <Users className="w-10 h-10 text-white/40 group-hover:text-white transition-colors z-10" />
                   </div>
                   <CardContent className="p-8 flex-1 space-y-6">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors text-white">{group.name}</h3>
                      <p className="text-sm font-medium italic text-muted-foreground line-clamp-3 leading-relaxed">{group.description}</p>
                      <div className="pt-4 flex justify-between items-center border-t border-white/5">
                         <span className="text-[9px] font-black uppercase text-muted-foreground">{group.memberCount || 1} Connections</span>
                         <Button variant="ghost" className="h-9 px-6 rounded-xl font-black uppercase text-[9px] text-primary hover:bg-primary/10">Join Zone</Button>
                      </div>
                   </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="members" className="animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoadingUsers ? (
              <div className="col-span-full py-32 flex justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>
            ) : visibleUsers.length === 0 ? (
                <div className="col-span-full py-32 text-center opacity-20 italic font-black uppercase tracking-[0.4em]">No members in registry</div>
            ) : visibleUsers.map(u => (
                <Card key={u.id} className="glass-card rounded-[2.5rem] p-8 border-white/5 flex flex-col items-center text-center gap-6 group hover:border-primary/20 transition-all text-foreground bg-black/20">
                  <div className={cn("relative rounded-full p-1.5 transition-all duration-500", u.aura && `aura-${u.aura}`)}>
                    <Avatar className="w-24 h-24 rounded-full border-4 border-primary/20 shadow-xl group-hover:scale-105 transition-transform cursor-pointer" onClick={() => setSelectedMember(u)}>
                      <AvatarImage src={u.photoURL} />
                      <AvatarFallback className="bg-secondary text-2xl font-black">{u.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h4 className={cn("text-xl font-black uppercase italic tracking-tight truncate w-48 px-2 py-1", u.nameplate && `nameplate-${u.nameplate}`)}>
                      {u.displayName?.replace(/^@+/, "")}
                    </h4>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">@{u.username}</p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button onClick={() => setSelectedMember(u)} variant="outline" className="flex-1 rounded-xl h-10 text-[9px] font-black uppercase border-white/10 text-white">Identity</Button>
                    {u.id !== user?.uid && (
                      <Button onClick={() => handleFollow(u)} className={cn("flex-1 rounded-xl h-10 font-black uppercase text-[9px] shadow-xl", followingIds.has(u.id) ? "bg-secondary text-white" : "bg-primary text-white")}>
                        {followingIds.has(u.id) ? "Unfollow" : "Follow"}
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            }
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="w-full max-w-2xl p-0 overflow-hidden bg-[#0c0c16]/95 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl text-foreground">
          <DialogHeader className="sr-only">
             <DialogTitle>Member Profile: {selectedMember?.displayName || 'Profile'}</DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            {/* Banner Area */}
            <div className="h-32 w-full relative overflow-hidden z-10">
              <RenderBanner bannerKey={selectedMember?.banner} className="absolute inset-0 w-full h-full object-cover" />
              {!selectedMember?.banner && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900" />
              )}
              {/* Banner overlay gradient for premium feel */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-rose-600 transition-all z-50">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* User Avatar + Decoration + Badges section */}
            <div className="px-6 relative z-20 flex justify-between items-end -mt-16 mb-4">
              <div className="relative p-1 rounded-[3rem] bg-[#0c0c16] z-20">
                <RenderDecor decorKey={selectedMember?.decor} />
                <RenderAura auraKey={selectedMember?.aura} />
                <RenderHat hatKey={selectedMember?.hat} />
                <RenderPet petKey={selectedMember?.pet} />
                
                <Avatar className="w-28 h-28 border-[6px] border-[#0c0c16] rounded-[2.2rem] shadow-2xl overflow-hidden bg-secondary relative z-20">
                  <AvatarImage src={selectedMember?.photoURL || ""} className="object-cover" />
                  <AvatarFallback className="bg-primary text-3xl font-black text-white">{selectedMember?.displayName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                
                {/* Discord-style Online Indicator dot */}
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-[#0c0c16] rounded-full z-30" />
              </div>

              {/* Discord-style Profile Badges */}
              <div className="flex gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/5 shadow-md mb-2">
                {/* Early Supporter Badge */}
                <div className="w-5 h-5 flex items-center justify-center text-yellow-400 hover:scale-110 transition-transform cursor-pointer" title="Early Supporter">
                  <Star className="w-4 h-4 fill-yellow-400" />
                </div>
                {/* HypeSquad Bravery Badge */}
                <div className="w-5 h-5 flex items-center justify-center text-purple-400 hover:scale-110 transition-transform cursor-pointer" title="HypeSquad Bravery">
                  <FlameIcon className="w-4 h-4 fill-purple-400" />
                </div>
                {/* Active Developer Badge */}
                <div className="w-5 h-5 flex items-center justify-center text-emerald-400 hover:scale-110 transition-transform cursor-pointer" title="Active Developer">
                  <SparklesIcon className="w-4 h-4" />
                </div>
                {/* Nitro / Premium Member Badge */}
                <div className="w-5 h-5 flex items-center justify-center text-pink-400 hover:scale-110 transition-transform cursor-pointer" title="Xakteir Premium">
                  <Award className="w-4 h-4 fill-pink-400" />
                </div>
              </div>
            </div>

            {/* Username + Tag */}
            <div className="px-8 pb-4">
              <h4 className={cn(
                "text-3xl font-black tracking-tighter italic uppercase leading-none break-words relative z-20",
                getNameplateClass(selectedMember?.nameplate)
              )}>
                {selectedMember?.displayName?.replace(/^@+/, "") || "Member"}
              </h4>
              <p className="text-[10px] text-muted-foreground font-black tracking-widest mt-1">@{(selectedMember?.displayName || "member").replace(/^@+/, "").toLowerCase()}</p>
            </div>

            <div className="px-8 py-2"><hr className="border-white/5" /></div>

            {/* About Me / Bio Section */}
            <div className="px-8 py-4 space-y-4">
              <div>
                <h5 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">About Me</h5>
                <p className="text-xs text-white/80 font-bold leading-relaxed italic">
                  {selectedMember?.aboutMe || "Multiverse voyager & code explorer. Exploring the outer edges of the Xakteir ecosystem."}
                </p>
              </div>

              <div>
                <h5 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Xakteir Member Since</h5>
                <p className="text-xs text-white/60 font-bold">Jun 2024</p>
              </div>
            </div>

            <div className="p-8 pt-2 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1e1f22] p-4 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase">XP Rank</span>
                  </div>
                  <p className="text-xl font-black italic text-white">{selectedMember?.level || 1}</p>
                </div>
                <div className="bg-[#1e1f22] p-4 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-rose-500">
                    <Heart className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase">Followers</span>
                  </div>
                  <p className="text-xl font-black italic text-white">{selectedMember?.followerCount || 0}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-white/5 mt-2">
                <Button onClick={() => handleFollow(selectedMember)} className="w-full h-12 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md font-bold text-sm shadow-xl">
                  {followingIds.has(selectedMember?.id) ? "Unfollow Identity" : "Follow Identity"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" className="h-12 text-[#dbdee1] hover:bg-[#35373c] rounded-md font-bold text-sm flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" /> Message
                  </Button>
                  <Button 
                    onClick={() => handleReport(selectedMember)}
                    disabled={isReporting}
                    variant="ghost" 
                    className="h-12 text-rose-500 hover:bg-rose-500/10 rounded-md font-bold text-sm flex items-center justify-center gap-2"
                  >
                    {isReporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Flag className="w-4 h-4" /> Report</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
        <DialogContent className="sm:max-w-[425px] bg-[#111214] border-white/10 text-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter">Create New Group</DialogTitle>
            <DialogDescription className="text-zinc-400">Build a community in the Xakteir Hub.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Group Name</label>
              <Input 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)} 
                placeholder="E.g., Logic Lab" 
                className="bg-black/40 border-white/10 text-white h-12" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Description</label>
              <Input 
                value={newGroupDesc} 
                onChange={(e) => setNewGroupDesc(e.target.value)} 
                placeholder="What is this group about?" 
                className="bg-black/40 border-white/10 text-white h-12" 
              />
            </div>
          </div>
          <Button onClick={handleCreateGroup} className="w-full h-12 font-black uppercase tracking-widest bg-primary text-black">
            Deploy Group
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
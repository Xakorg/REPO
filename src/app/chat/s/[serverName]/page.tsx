"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  Hash, 
  Send, 
  Smile, 
  Loader2, 
  Plus, 
  Brain, 
  MessageCircle,
  Radio,
  X,
  Compass,
  Search,
  Globe,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit, doc, addDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { RenderHat } from "@/components/RenderHat";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

export default function ServerChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const serverName = (params.serverName as string) || "xakteir";
  const channelName = searchParams.get("c") || "general";
  const router = useRouter();

  // Discover state
  const [discoverSearch, setDiscoverSearch] = useState("");

  // Fetch custom servers list from database for discovery
  const discoverServersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "servers"), limit(100));
  }, [firestore]);
  const { data: dbDiscoverServers, isLoading: isDiscoverLoading } = useCollection(discoverServersQuery);

  const publicServers = useMemo(() => {
    if (!dbDiscoverServers) return [];
    return dbDiscoverServers.filter((s: any) => s.isPrivate !== true);
  }, [dbDiscoverServers]);

  const filteredDiscoverServers = useMemo(() => {
    if (!discoverSearch.trim()) return publicServers;
    const q = discoverSearch.toLowerCase();
    return publicServers.filter((s: any) => 
      s.name?.toLowerCase().includes(q) || 
      s.description?.toLowerCase().includes(q)
    );
  }, [publicServers, discoverSearch]);

  const handleJoinServer = async (serverId: string, currentMembers: string[]) => {
    if (!user || !firestore) return;
    try {
      const serverRef = doc(firestore, "servers", serverId);
      const updatedMembers = [...(currentMembers || [])];
      if (!updatedMembers.includes(user.uid)) {
        updatedMembers.push(user.uid);
      }
      await updateDoc(serverRef, { members: updatedMembers });
      toast({ title: "Joined Server!", description: "You are now a member of this community." });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to join server" });
    }
  };

  const handleLeaveServer = async (serverId: string, currentMembers: string[]) => {
    if (!user || !firestore) return;
    try {
      const serverRef = doc(firestore, "servers", serverId);
      const updatedMembers = (currentMembers || []).filter(uid => uid !== user.uid);
      await updateDoc(serverRef, { members: updatedMembers });
      toast({ title: "Left Server", description: "You have left this community." });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to leave server" });
    }
  };

  // Helper to check user permissions on the custom server
  const hasPermission = (permission: string) => {
    if (!user || !serverDoc) return true; 
    if (serverDoc.ownerId === user.uid) return true; // Owner bypass
    
    const roles = serverDoc.roles || [];
    const userRoleIds = serverDoc.memberRoles?.[user.uid] || [];
    
    if (roles.length === 0 || userRoleIds.length === 0) {
      return permission === "sendMessages"; // default fallback
    }
    
    return roles.some((role: any) => 
      userRoleIds.includes(role.id) && 
      role.permissions?.includes(permission)
    );
  };

  // Helper to resolve the sender's text color using serverDoc.roles and serverDoc.memberRoles
  const getSenderColor = (senderId: string) => {
    if (!serverDoc) return "text-white/60";
    const roles = serverDoc.roles || [];
    const assignedIds = serverDoc.memberRoles?.[senderId] || [];
    if (assignedIds.length === 0) {
      if (serverDoc.ownerId === senderId) {
        return "text-yellow-400";
      }
      return "text-white/60";
    }
    const activeRoles = roles.filter((r: any) => assignedIds.includes(r.id));
    if (activeRoles.length === 0) {
      if (serverDoc.ownerId === senderId) {
        return "text-yellow-400";
      }
      return "text-white/60";
    }
    return activeRoles[0].color || "text-zinc-300";
  };

  // Derive legacy public channels or scoped server channels
  const channelId = serverName === "xakteir" ? channelName : `${serverName}-${channelName}`;

  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // GIF Picker states
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifs, setGifs] = useState<string[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  // Fetch Server details for member check
  const serverDocRef = useMemoFirebase(() => {
    if (!firestore || !serverName || serverName === "xakteir") return null;
    return doc(firestore, "servers", serverName);
  }, [firestore, serverName]);
  const { data: serverDoc } = useDoc(serverDocRef);

  // Check if admin
  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "admins", user.uid);
  }, [firestore, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || "");
  const isAdmin = isSuperAdmin || !!adminRole;

  // Retrieve current user details to attach equipped hat on sent messages
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);

  // Subscribe to messages in channel
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "chats", channelId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );
  }, [firestore, channelId]);
  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  // Fetch Gifs from public beta GIPHY API key
  const fetchGifs = async (queryStr: string) => {
    setLoadingGifs(true);
    try {
      const endpoint = queryStr.trim() 
        ? `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(queryStr)}&limit=12`
        : `https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=12`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.data) {
        setGifs(data.data.map((g: any) => g.images.fixed_height.url));
      }
    } catch(e) {
      console.error("Giphy API error", e);
    } finally {
      setLoadingGifs(false);
    }
  };

  useEffect(() => {
    if (showGifPicker) {
      fetchGifs(gifSearch);
    }
  }, [showGifPicker, gifSearch]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !user || !firestore || isSending) return;

    if (channelName === "announcements" && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Only administrators can send messages in announcements."
      });
      return;
    }

    if (serverName !== "xakteir" && !hasPermission("sendMessages")) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You do not have permission to send messages in this server."
      });
      return;
    }

    const content = chatInput.trim();
    setChatInput("");
    setIsSending(true);

    try {
      await addDocumentNonBlocking(collection(firestore, "chats", channelId, "messages"), {
        content,
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        senderHat: userData?.hat || null,
        channelId,
        channelName,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      setChatInput(content);
      toast({
        variant: "destructive",
        title: "Message failed",
        description: "Failed to send message."
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    if (!user || !firestore) return;
    try {
      await addDocumentNonBlocking(collection(firestore, "chats", channelId, "messages"), {
        content: gifUrl,
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        senderHat: userData?.hat || null,
        channelId,
        channelName,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      toast({ variant: "destructive", title: "GIF transmission failed" });
    }
  };

  const isImageUrl = (url: string) => {
    return typeof url === 'string' && (
      url.startsWith('http') && (
        url.match(/\.(jpeg|jpg|gif|png|webp)/i) != null || 
        url.includes('giphy.com/media/') || 
        url.includes('media.giphy.com/') || 
        url.includes('tenor.com/')
      )
    );
  };

  const handleCatchUp = () => {
    toast({ 
      title: "AI Summarization", 
      description: "Xak AI is summarizing recent channel discussions." 
    });
  };

  if (!user) return null;

  if (serverDoc && serverDoc.isPrivate && serverDoc.ownerId !== user.uid && (!serverDoc.members || !serverDoc.members.includes(user.uid))) {
    const isInvited = searchParams.get("invite") === "true";
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#080811] text-white">
        <div className="max-w-md w-full p-8 rounded-[2.5rem] border-4 border-white/10 bg-zinc-950/40 text-center space-y-6 shadow-2xl">
          <MessageCircle className="w-16 h-16 text-emerald-500 animate-pulse mx-auto" />
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
            {isInvited ? "You've Been Invited" : "Private Server"}
          </h2>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
            {isInvited 
              ? `You have been invited to join the private server ${serverDoc.name}.`
              : `This server is private. You need a valid invite link to join ${serverDoc.name}.`
            }
          </p>
          {isInvited && (
            <Button 
              onClick={async () => {
                try {
                  const currentMembers = serverDoc.members || [];
                  if (!currentMembers.includes(user.uid)) {
                    await updateDoc(serverDocRef, {
                      members: [...currentMembers, user.uid]
                    });
                    toast({ title: "Welcome!", description: `Joined ${serverDoc.name} successfully.` });
                  }
                } catch (e) {
                  toast({ variant: "destructive", title: "Join Failed", description: "Could not join this server." });
                }
              }}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-xl shadow-xl transition-all border-none"
            >
              Join Server
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Intercept for discover panel
  if (serverName === "discover") {
    return (
      <main className="flex-1 flex flex-col bg-[#05030d] text-white relative overflow-hidden h-full">
        <div className="absolute inset-0 arcade-grid opacity-[0.02] pointer-events-none" />
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/45 backdrop-blur-2xl z-20 shadow-xl shrink-0">
          <div className="flex items-center gap-4">
            <Compass className="w-6 h-6 text-emerald-400 animate-pulse" />
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Discovery</h2>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mt-1">Explore Public Communities</p>
            </div>
          </div>
          
          <div className="relative group shrink-0 w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-400 transition-colors" />
            <Input
              value={discoverSearch}
              onChange={(e) => setDiscoverSearch(e.target.value)}
              placeholder="Search public servers..."
              className="bg-black/60 border-white/10 h-11 rounded-xl pl-10 pr-4 text-xs font-bold focus:border-emerald-400/50 focus:ring-emerald-400 uppercase text-white placeholder:text-zinc-600"
            />
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-muted-foreground italic">Public Hub Directory</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider leading-relaxed">
                Browse and join community servers hosted on Xakteir. Discover clans, development sectors, or create your own server using the sidebar button!
              </p>
            </div>

            {isDiscoverLoading ? (
              <div className="py-40 flex flex-col items-center justify-center space-y-6">
                <Loader2 className="animate-spin w-12 h-12 text-emerald-400 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400/40">Syncing communities...</p>
              </div>
            ) : filteredDiscoverServers.length === 0 ? (
              <div className="py-40 text-center border-4 border-dashed border-white/5 rounded-[3rem] opacity-25 space-y-6">
                <Compass className="w-20 h-20 mx-auto text-emerald-400 animate-bounce" />
                <p className="text-lg font-black uppercase tracking-widest">No public servers found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredDiscoverServers.map((server: any) => {
                  const memberList = server.members || [];
                  const isMember = memberList.includes(user.uid);
                  const isOwner = server.ownerId === user.uid;
                  
                  return (
                    <Card key={server.id} className="glass-card border-2 border-white/10 hover:border-emerald-500/40 rounded-[2.2rem] p-6 bg-zinc-950/40 flex flex-col justify-between shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform overflow-hidden", !server.iconUrl && (server.iconColor || "bg-zinc-700"))}>
                            {server.iconUrl ? (
                              <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover" />
                            ) : (
                              <MessageCircle className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                            {memberList.length} {memberList.length === 1 ? 'member' : 'members'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-lg font-black uppercase italic tracking-tighter text-white truncate group-hover:text-emerald-400 transition-colors">{server.name}</h4>
                          {server.description && (
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide line-clamp-2 leading-relaxed text-left">
                              {server.description}
                            </p>
                          )}
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-left">
                            Created by: {isOwner ? 'You (Owner)' : `User ${server.ownerId?.slice(0, 6)}`}
                          </p>
                        </div>
                      </div>

                      <div className="pt-6 flex gap-3">
                        {isMember ? (
                          <>
                            <Button
                              onClick={() => router.push(`/chat/s/${server.id}?c=general`)}
                              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border-none"
                            >
                              Open Chat
                            </Button>
                            {!isOwner && (
                              <Button
                                onClick={() => handleLeaveServer(server.id, memberList)}
                                variant="ghost"
                                className="h-11 px-4 hover:bg-red-500/10 text-red-500 hover:text-red-400 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border border-red-500/20"
                              >
                                Leave
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            onClick={() => handleJoinServer(server.id, memberList)}
                            className="w-full h-11 bg-white hover:bg-emerald-500 hover:text-black text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border-none"
                          >
                            Join Server
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    );
  }

  const isAnnouncements = channelName === "announcements";
  const isReadOnly = (isAnnouncements && !isAdmin) || (serverName !== "xakteir" && !hasPermission("sendMessages"));

  return (
    <main className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden h-full">
      {/* CHANNEL HEADER */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-xl z-20 shadow-lg shrink-0">
         <div className="flex items-center gap-4">
            {isAnnouncements ? (
              <Radio className="w-5 h-5 text-rose-500" />
            ) : (
              <Hash className="w-5 h-5 text-primary" />
            )}
            <h3 className="text-xl font-black italic uppercase tracking-tighter truncate text-white">{channelName}</h3>
         </div>
         <div className="flex items-center gap-4 md:gap-6">
            <Button onClick={handleCatchUp} variant="ghost" className="h-9 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 hidden sm:flex">
               <Brain className="w-3.5 h-3.5" /> Catch Me Up
            </Button>
         </div>
      </header>

      {/* MESSAGES SCROLL AREA */}
      <ScrollArea className="flex-1 p-8" ref={scrollRef}>
         <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {isMessagesLoading ? (
              <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>
            ) : !messages?.length ? (
              <div className="py-40 text-center space-y-6 opacity-20 italic">
                 <MessageCircle className="w-16 h-16 mx-auto text-primary" />
                 <p className="text-sm font-black uppercase tracking-[0.4em]">Initialize Conversation</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-5", msg.senderId === user.uid && "flex-row-reverse")}>
                   <div className="relative shrink-0 text-left">
                     <RenderHat hatKey={msg.senderHat} />
                     <Avatar className="w-11 h-11 rounded-[1.1rem] border-2 border-white/5 bg-zinc-900">
                        <AvatarImage src={msg.senderPhoto} className="object-cover" />
                        <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">{msg.senderName?.[0]}</AvatarFallback>
                     </Avatar>
                   </div>
                   <div className={cn("flex flex-col space-y-1.5 max-w-[70%]", msg.senderId === user.uid && "items-end")}>
                      <span className={cn("text-[9px] font-black uppercase italic tracking-widest px-2", getSenderColor(msg.senderId))}>{msg.senderName}</span>
                      <div className={cn("p-5 rounded-[1.8rem] shadow-2xl border transition-all italic text-sm font-medium leading-relaxed text-left", msg.senderId === user.uid ? "bg-primary text-white border-primary/20 rounded-tr-none" : "bg-[#18181b] border-white/5 rounded-tl-none text-foreground/90")}>
                         {isImageUrl(msg.content) ? (
                           <img src={msg.content} alt="gif" className="rounded-2xl max-w-full max-h-60 object-contain border border-white/10" />
                         ) : (
                           msg.content
                         )}
                      </div>
                   </div>
                </div>
              ))
            )}
         </div>
      </ScrollArea>

      {/* Giphy search popover */}
      {showGifPicker && (
        <div className="absolute bottom-24 left-6 right-6 md:left-auto md:right-8 max-w-sm w-full bg-[#0a0a15] border-2 border-white/10 rounded-[2rem] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-50 flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary">GIF Search Tool</span>
            <button onClick={() => setShowGifPicker(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <Input 
            value={gifSearch}
            onChange={(e) => setGifSearch(e.target.value)}
            placeholder="Search Giphy..." 
            className="bg-black border-white/10 text-xs text-white" 
          />
          <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {loadingGifs ? (
              <div className="col-span-3 py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto opacity-35" /></div>
            ) : gifs.length === 0 ? (
              <p className="col-span-3 py-10 text-center text-white/20 italic text-[10px]">No GIFs resolved</p>
            ) : gifs.map((gUrl, idx) => (
              <img 
                key={idx} 
                src={gUrl} 
                alt="gif result"
                onClick={() => {
                  handleSendGif(gUrl);
                  setShowGifPicker(false);
                }}
                className="rounded-xl h-14 w-full object-cover cursor-pointer hover:scale-105 border border-white/5 hover:border-primary transition-all" 
              />
            ))}
          </div>
        </div>
      )}

      {/* INPUT PORTAL */}
      <div className="p-4 md:p-6 bg-zinc-950 border-t border-white/5 shrink-0 z-20">
         {isReadOnly ? (
           <div className="max-w-5xl mx-auto p-5 rounded-[1.8rem] bg-white/5 border border-dashed border-white/10 text-center italic text-xs text-muted-foreground uppercase tracking-wider font-bold">
              {isAnnouncements && !isAdmin 
                ? "Announcements are read-only." 
                : "You do not have permission to send messages in this server."}
           </div>
         ) : (
           <form onSubmit={(e) => handleSend(e)} className="max-w-5xl mx-auto flex items-end gap-3 md:gap-4">
              <div className="flex-1 bg-black/40 border-2 border-white/10 rounded-[1.8rem] p-2 md:p-3 flex items-center gap-3 md:gap-4 relative">
                 <button 
                    type="button" 
                    onClick={() => setShowGifPicker(!showGifPicker)} 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-black text-white/40 hover:text-white transition-all shrink-0"
                 >
                   GIF
                 </button>
                 <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={`Message #${channelName}...`} className="border-none bg-transparent focus-visible:ring-0 text-white text-sm italic placeholder:text-white/20" />
                 <button type="button" className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"><Smile className="w-4 h-4 md:w-5 md:h-5" /></button>
              </div>
              <Button type="submit" size="icon" className="h-12 w-12 md:h-16 md:w-16 bg-primary rounded-[1rem] md:rounded-[1.5rem] shadow-2xl active:scale-90 flex items-center justify-center shrink-0"><Send className="w-5 h-5 md:w-6 md:h-6 text-white" /></Button>
           </form>
         )}
      </div>
    </main>
  );
}

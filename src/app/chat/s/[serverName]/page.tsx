"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  Hash, 
  Send, 
  Smile, 
  Loader2, 
  Plus, 
  Brain, 
  MessageCircle,
  Radio
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit, doc, addDoc } from "firebase/firestore";
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

  // Derive legacy public channels or scoped server channels
  const channelId = serverName === "xakteir" ? channelName : `${serverName}-${channelName}`;

  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !user || !firestore || isSending) return;

    // Prevent non-admins from posting in announcements
    if (channelName === "announcements" && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Only administrators can send messages in announcements."
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
        senderHat: userData?.hat || null, // Attach equipped hat key
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

  const handleCatchUp = () => {
    toast({ 
      title: "AI Summarization", 
      description: "Xak AI is summarizing recent channel discussions." 
    });
  };

  if (!user) return null;

  const isAnnouncements = channelName === "announcements";
  const isReadOnly = isAnnouncements && !isAdmin;

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
            <h3 className="text-xl font-black italic uppercase tracking-tighter truncate">{channelName}</h3>
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
                   <div className="relative shrink-0">
                     <RenderHat hatKey={msg.senderHat} />
                     <Avatar className="w-11 h-11 rounded-[1.1rem] border-2 border-white/5 bg-zinc-900">
                        <AvatarImage src={msg.senderPhoto} className="object-cover" />
                        <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">{msg.senderName?.[0]}</AvatarFallback>
                     </Avatar>
                   </div>
                   <div className={cn("flex flex-col space-y-1.5 max-w-[70%]", msg.senderId === user.uid && "items-end")}>
                      <span className="text-[9px] font-black uppercase italic tracking-widest px-2 text-white/60">{msg.senderName}</span>
                      <div className={cn("p-5 rounded-[1.8rem] shadow-2xl border transition-all italic text-sm font-medium leading-relaxed", msg.senderId === user.uid ? "bg-primary text-white border-primary/20 rounded-tr-none" : "bg-[#18181b] border-white/5 rounded-tl-none text-foreground/90")}>
                         {msg.content}
                      </div>
                   </div>
                </div>
              ))
            )}
         </div>
      </ScrollArea>

      {/* INPUT PORTAL */}
      <div className="p-4 md:p-6 bg-zinc-950 border-t border-white/5 shrink-0 z-20">
         {isReadOnly ? (
           <div className="max-w-5xl mx-auto p-5 rounded-[1.8rem] bg-white/5 border border-dashed border-white/10 text-center italic text-xs text-muted-foreground uppercase tracking-wider font-bold">
              Announcements are read-only.
           </div>
         ) : (
           <form onSubmit={(e) => handleSend(e)} className="max-w-5xl mx-auto flex items-end gap-3 md:gap-4">
              <div className="flex-1 bg-black/40 border-2 border-white/10 rounded-[1.8rem] p-2 md:p-3 flex items-center gap-3 md:gap-4">
                 <button type="button" className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"><Plus className="w-4 h-4 md:w-5 md:h-5" /></button>
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

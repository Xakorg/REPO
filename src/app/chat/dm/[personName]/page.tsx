"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  MessageCircle, 
  Send, 
  Smile, 
  Loader2, 
  Plus, 
  Brain,
  ShieldAlert
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit, doc, getDoc, setDoc, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { RenderHat } from "@/components/RenderHat";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function DirectMessagePage() {
  const params = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const personName = (params.personName as string) || "";

  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dmChatId, setDmChatId] = useState<string | null>(null);

  // 1. Query the users collection to find the user matching personName (username)
  const recipientQuery = useMemoFirebase(() => {
    if (!firestore || !personName) return null;
    return query(collection(firestore, "users"), where("username", "==", personName), limit(1));
  }, [firestore, personName]);

  const { data: recipientDocs, isLoading: isUserLoading } = useCollection(recipientQuery);
  const friendUser = recipientDocs?.[0];

  // 2. Fetch current user details to attach hat key on messages
  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: currentUserData } = useDoc(currentUserRef);

  // 3. Setup DM Chat document in Firestore once recipient is resolved
  useEffect(() => {
    if (!firestore || !user || !friendUser) return;
    
    // Sort UIDs to ensure uniqueness for this conversation pair
    const sortedIds = [user.uid, friendUser.id].sort();
    const chatId = `dm_${sortedIds.join("_")}`;
    setDmChatId(chatId);

    const checkAndInitChat = async () => {
      try {
        const dmRef = doc(firestore, "chats", chatId);
        const snap = await getDoc(dmRef);
        if (!snap.exists()) {
          await setDoc(dmRef, {
            id: chatId,
            participants: sortedIds,
            public: false,
            createdAt: serverTimestamp(),
            type: "dm"
          });
        }
      } catch (e) {
        console.error("Error creating/checking DM document:", e);
      }
    };
    checkAndInitChat();
  }, [firestore, user, friendUser]);

  // 4. Subscribe to messages inside the private DM chat
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !dmChatId) return null;
    return query(
      collection(firestore, "chats", dmChatId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );
  }, [firestore, dmChatId]);
  
  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !user || !firestore || !dmChatId || isSending) return;

    const content = chatInput.trim();
    setChatInput("");
    setIsSending(true);

    try {
      await addDocumentNonBlocking(collection(firestore, "chats", dmChatId, "messages"), {
        content,
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        senderHat: currentUserData?.hat || null, // Attach equipped hat
        channelId: dmChatId,
        channelName: `DM with ${friendUser?.displayName || personName}`,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      setChatInput(content);
      toast({
        variant: "destructive",
        title: "Transmission failed",
        description: "DM message could not be sent."
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!user) return null;

  if (isUserLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!friendUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-10 text-center p-8 bg-zinc-950">
        <div className="w-24 h-24 rounded-[2.5rem] bg-rose-500/10 border-4 border-rose-500/20 flex items-center justify-center mx-auto shadow-2xl animate-float">
          <ShieldAlert className="w-12 h-12 text-rose-500" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black uppercase italic text-white">Member Not Found</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
            Could not resolve the username @{personName} in the Xakteir Registry.
          </p>
        </div>
      </div>
    );
  }

  const friendDisplayName = friendUser.displayName?.replace(/^@+/, "") || "Member";

  return (
    <main className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden h-full">
      {/* DM HEADER */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-xl z-20 shadow-lg shrink-0">
         <div className="flex items-center gap-4">
            <div className="relative shrink-0">
               <RenderHat hatKey={friendUser.hat} />
               <Avatar className="w-8 h-8 rounded-lg border border-white/10">
                  <AvatarImage src={friendUser.photoURL} className="object-cover" />
                  <AvatarFallback className="bg-primary text-xs font-black">{friendDisplayName[0]}</AvatarFallback>
               </Avatar>
            </div>
            <div>
               <h3 className="text-sm font-black italic uppercase tracking-tighter truncate leading-none text-white">{friendDisplayName}</h3>
               <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Direct Message</span>
            </div>
         </div>
      </header>

      {/* MESSAGES */}
      <ScrollArea className="flex-1 p-8" ref={scrollRef}>
         <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {isMessagesLoading ? (
              <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>
            ) : !messages?.length ? (
              <div className="py-40 text-center space-y-6 opacity-20 italic">
                 <MessageCircle className="w-16 h-16 mx-auto text-primary animate-bounce" />
                 <p className="text-sm font-black uppercase tracking-[0.3em]">Start of direct message history</p>
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

      {/* INPUT BAR */}
      <div className="p-4 md:p-6 bg-zinc-950 border-t border-white/5 shrink-0 z-20">
         <form onSubmit={(e) => handleSend(e)} className="max-w-5xl mx-auto flex items-end gap-3 md:gap-4">
            <div className="flex-1 bg-black/40 border-2 border-white/10 rounded-[1.8rem] p-2 md:p-3 flex items-center gap-3 md:gap-4">
               <button type="button" className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"><Plus className="w-4 h-4 md:w-5 md:h-5" /></button>
               <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={`Message @${friendDisplayName}...`} className="border-none bg-transparent focus-visible:ring-0 text-white text-sm italic placeholder:text-white/20" />
               <button type="button" className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"><Smile className="w-4 h-4 md:w-5 md:h-5" /></button>
            </div>
            <Button type="submit" size="icon" className="h-12 w-12 md:h-16 md:w-16 bg-primary rounded-[1rem] md:rounded-[1.5rem] shadow-2xl active:scale-90 flex items-center justify-center shrink-0"><Send className="w-5 h-5 md:w-6 md:h-6 text-white" /></Button>
         </form>
      </div>
    </main>
  );
}


"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Inbox, 
  Send, 
  Star, 
  Trash2, 
  Plus, 
  Loader2, 
  Mail as MailIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, serverTimestamp, limit, getDocs } from "firebase/firestore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function MailPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [folder, setFolder] = useState("Inbox");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const primaryEmail = user?.email?.toLowerCase() || "";

  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !primaryEmail) return null;
    const baseCol = collection(firestore, "emails");
    if (folder === "Sent") return query(baseCol, where("senderEmail", "==", primaryEmail), limit(50));
    return query(baseCol, where("recipientList", "array-contains", primaryEmail), where("isDeleted", "==", false), limit(50));
  }, [firestore, user, folder, primaryEmail]);

  const { data: emails, isLoading } = useCollection(emailsQuery);
  const selectedEmail = useMemo(() => emails?.find(e => e.id === selectedId), [emails, selectedId]);

  const handleSend = async () => {
    if (!firestore || !user || !recipient || isSending) return;
    setIsSending(true);
    try {
      const target = recipient.toLowerCase().trim();
      
      // Save the email
      await addDoc(collection(firestore, "emails"), {
        senderUserId: user.uid,
        senderEmail: primaryEmail,
        senderName: user.displayName || "User",
        recipientEmail: target,
        recipientList: [target],
        subject,
        body,
        sentDateTime: new Date().toISOString(),
        isDeleted: false,
        isSpam: false,
        isStarred: false,
        status: 'unread',
        timestamp: serverTimestamp()
      });

      // Notify the recipient
      const usersQuery = query(collection(firestore, "users"), where("email", "==", target), limit(1));
      const userSnap = await getDocs(usersQuery);
      
      if (!userSnap.empty) {
        const recipientDoc = userSnap.docs[0];
        await addDoc(collection(firestore, "users", recipientDoc.id, "notifications"), {
          title: "New Email",
          message: `From ${user.displayName || user.email}: ${subject || "(No Subject)"}`,
          type: 'message',
          read: false,
          timestamp: serverTimestamp()
        });
      }

      toast({ title: "Email Sent" });
      setIsComposeOpen(false);
      setRecipient(""); setSubject(""); setBody("");
    } catch (e) { 
      toast({ variant: "destructive", title: "Error sending email" }); 
    } finally { 
      setIsSending(false); 
    }
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex-1 flex p-6 gap-6 overflow-hidden">
        <div className="w-80 flex flex-col space-y-6">
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-primary h-16 rounded-3xl font-black uppercase text-xs italic shadow-xl">
                <Plus className="w-5 h-5 mr-3" /> New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-2xl text-foreground p-10 bg-zinc-950">
              <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic">Compose</DialogTitle></DialogHeader>
              <div className="space-y-6 py-4">
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="To: name@email.com" className="bg-secondary/30 h-12 rounded-xl" />
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="bg-secondary/30 h-12 rounded-xl" />
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type message..." className="bg-secondary/30 rounded-2xl min-h-[250px] p-6 text-lg italic" />
              </div>
              <DialogFooter>
                <Button disabled={isSending} onClick={handleSend} className="h-14 px-12 bg-primary rounded-xl font-black uppercase text-xs">
                  {isSending ? <Loader2 className="animate-spin" /> : "Send"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ScrollArea className="flex-1">
             <div className="space-y-1">
                {['Inbox', 'Sent', 'Starred'].map(f => (
                  <button key={f} onClick={() => { setFolder(f); setSelectedId(null); }} className={cn("w-full flex items-center px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", folder === f ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5")}>
                    {f}
                  </button>
                ))}
             </div>
          </ScrollArea>
        </div>

        <div className="flex-1 glass-card rounded-[3.5rem] overflow-hidden flex divide-x divide-white/5 bg-black/20 shadow-2xl">
          <div className="w-[400px] flex flex-col h-full bg-zinc-950/30">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {isLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary opacity-20" /></div> : emails?.map(email => (
                  <div key={email.id} onClick={() => setSelectedId(email.id)} className={cn("p-6 rounded-[2rem] cursor-pointer transition-all border-2 border-transparent", selectedId === email.id ? "bg-primary/5 border-primary/20 shadow-xl" : "bg-card/40")}>
                    <h4 className="font-black truncate uppercase italic text-sm">{email.subject || "No Subject"}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">{email.senderEmail}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex-1 flex flex-col bg-background/40">
             {selectedEmail ? (
               <div className="p-12 space-y-10 animate-in fade-in">
                  <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-tight">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                     <Avatar className="w-12 h-12"><AvatarFallback className="bg-primary text-white">U</AvatarFallback></Avatar>
                     <div><p className="text-sm font-black italic">{selectedEmail.senderName}</p><p className="text-[10px] text-primary font-black uppercase">{selectedEmail.senderEmail}</p></div>
                  </div>
                  <div className="text-xl leading-relaxed italic opacity-90">{selectedEmail.body}</div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                  <MailIcon className="w-24 h-24" />
                  <p className="text-xl font-black uppercase italic mt-6">Select a message</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

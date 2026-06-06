"use client";

import { useState, useMemo, useEffect } from "react";
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
  Mail as MailIcon,
  Globe,
  RefreshCw,
  LogOut,
  MailCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, where, addDoc, serverTimestamp, limit, getDocs, doc } from "firebase/firestore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Firebase Auth imports for Gmail OAuth
import { GoogleAuthProvider, linkWithPopup, signInWithPopup } from "firebase/auth";

export default function MailPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [folder, setFolder] = useState("Inbox");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Gmail states
  const [mailMode, setMailMode] = useState<'xakteir' | 'gmail'>('xakteir');
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [gmailEmails, setGmailEmails] = useState<any[]>([]);
  const [loadingGmail, setLoadingGmail] = useState(false);

  const primaryEmail = user?.email?.toLowerCase() || "";

  // Load saved Gmail OAuth token from local storage
  useEffect(() => {
    const savedToken = localStorage.getItem("gmail_oauth_token");
    if (savedToken) {
      setGmailToken(savedToken);
    }
  }, []);

  // Fetch Gmail inbox whenever mailMode switches to gmail
  useEffect(() => {
    if (mailMode === 'gmail' && gmailToken) {
      fetchGmailInbox(gmailToken);
    }
  }, [mailMode, gmailToken]);

  // Firestore query optimized to avoid compound index error by filtering isDeleted client-side
  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !primaryEmail) return null;
    const baseCol = collection(firestore, "emails");
    if (folder === "Sent") {
      return query(baseCol, where("senderEmail", "==", primaryEmail), limit(100));
    }
    return query(baseCol, where("recipientList", "array-contains", primaryEmail), limit(100));
  }, [firestore, user, folder, primaryEmail]);

  const { data: rawEmails, isLoading } = useCollection(emailsQuery);

  // Client-side filtering to resolve compound query indexes
  const emails = useMemo(() => {
    if (!rawEmails) return [];
    if (folder === "Starred") {
      return rawEmails.filter(e => e.isStarred && !e.isDeleted);
    }
    if (folder === "Sent") {
      return rawEmails.filter(e => !e.isDeleted);
    }
    return rawEmails.filter(e => !e.isDeleted);
  }, [rawEmails, folder]);

  const selectedEmail = useMemo(() => {
    if (mailMode === 'gmail') {
      return gmailEmails.find(e => e.id === selectedId);
    }
    return emails.find(e => e.id === selectedId);
  }, [emails, gmailEmails, selectedId, mailMode]);

  // Gmail OAuth Setup
  const handleConnectGmail = async () => {
    if (!auth || !auth.currentUser) {
      toast({ variant: "destructive", title: "Authentication missing" });
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
    provider.addScope("https://www.googleapis.com/auth/gmail.send");

    try {
      const result = await linkWithPopup(auth.currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        localStorage.setItem("gmail_oauth_token", token);
        setGmailToken(token);
        setMailMode('gmail');
        toast({ title: "Gmail Synchronized", description: "Linked Google credentials for active Gmail sync." });
      }
    } catch (e: any) {
      // Re-authenticate if user credentials already linked
      if (e.code === 'auth/credential-already-in-use' || e.code === 'auth/provider-already-linked') {
        try {
          const result = await signInWithPopup(auth, provider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential?.accessToken;
          if (token) {
            localStorage.setItem("gmail_oauth_token", token);
            setGmailToken(token);
            setMailMode('gmail');
            toast({ title: "Gmail Connected", description: "Established Google Gmail session token." });
          }
        } catch (err) {
          toast({ variant: "destructive", title: "Connection rejected" });
        }
      } else {
        toast({ variant: "destructive", title: "OAuth sync failed", description: e.message });
      }
    }
  };

  const disconnectGmail = () => {
    localStorage.removeItem("gmail_oauth_token");
    setGmailToken(null);
    setMailMode('xakteir');
    setGmailEmails([]);
    toast({ title: "Gmail Disconnected" });
  };

  const fetchGmailInbox = async (token: string) => {
    setLoadingGmail(true);
    try {
      const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!listRes.ok) throw new Error("Auth token expired");
      const listData = await listRes.json();

      if (listData.messages && listData.messages.length > 0) {
        const details = await Promise.all(
          listData.messages.map(async (m: any) => {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const detail = await detailRes.json();
            const headers = detail.payload?.headers || [];
            
            const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || "(No Subject)";
            const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || "Unknown Sender";
            const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || "";
            
            return {
              id: detail.id,
              subject,
              senderEmail: from,
              senderName: from.split("<")[0]?.trim() || from,
              body: detail.snippet || "(No content snippet)",
              sentDateTime: date,
              isGmail: true
            };
          })
        );
        setGmailEmails(details);
      } else {
        setGmailEmails([]);
      }
    } catch (err) {
      console.error(err);
      toast({ 
        variant: "destructive", 
        title: "Gmail Sync Error", 
        description: "Google Gmail token has expired. Please link account again." 
      });
      localStorage.removeItem("gmail_oauth_token");
      setGmailToken(null);
      setMailMode('xakteir');
    } finally {
      setLoadingGmail(false);
    }
  };

  const sendGmail = async () => {
    if (!gmailToken) return;
    setIsSending(true);
    try {
      const emailLines = [
        `To: ${recipient}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ];
      
      const raw = window.btoa(unescape(encodeURIComponent(emailLines.join('\r\n'))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });

      if (!res.ok) throw new Error("Google API rejected message dispatch");

      toast({ title: "Gmail Message Transmitted!" });
      setIsComposeOpen(false);
      setRecipient(""); setSubject(""); setBody("");
      fetchGmailInbox(gmailToken);
    } catch (e) {
      toast({ variant: "destructive", title: "Gmail Transmission Failed" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if (mailMode === 'gmail') {
      await sendGmail();
      return;
    }

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

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-zinc-950"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex-1 flex p-6 gap-6 overflow-hidden">
        
        {/* Sidebar Nav */}
        <div className="w-80 flex flex-col space-y-6 shrink-0">
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-primary hover:bg-primary/95 text-black h-16 rounded-3xl font-black uppercase text-xs italic shadow-xl">
                <Plus className="w-5 h-5 mr-3" /> New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-2xl text-white p-10 bg-zinc-950">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase italic">
                  {mailMode === 'gmail' ? 'Compose via Gmail' : 'New Internal Message'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="To: name@email.com" className="bg-[#0b0b14]/60 h-12 rounded-xl text-white" />
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="bg-[#0b0b14]/60 h-12 rounded-xl text-white" />
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type message body..." className="bg-[#0b0b14]/60 rounded-2xl min-h-[200px] p-6 text-sm italic text-white" />
              </div>
              <DialogFooter>
                <Button disabled={isSending} onClick={handleSend} className="h-14 px-12 bg-primary rounded-xl font-black uppercase text-xs text-black hover:bg-primary/95">
                  {isSending ? <Loader2 className="animate-spin text-black" /> : "Transmit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="flex-1 glass-card border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col bg-black/40 p-4 space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2.5 ml-2">Email Channels</p>
              <div className="space-y-1.5">
                <button 
                  onClick={() => {
                    setMailMode('xakteir');
                    setSelectedId(null);
                  }}
                  className={cn(
                    "w-full flex items-center px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left border",
                    mailMode === 'xakteir' ? "bg-primary/10 border-primary/20 text-primary font-black" : "text-muted-foreground hover:bg-white/5 border-transparent"
                  )}
                >
                  Xakteir Mail
                </button>

                <button 
                  onClick={() => {
                    if (gmailToken) {
                      setMailMode('gmail');
                      setSelectedId(null);
                    } else {
                      handleConnectGmail();
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left border",
                    mailMode === 'gmail' ? "bg-amber-500/10 border-amber-500/25 text-amber-500 font-black" : "text-muted-foreground hover:bg-white/5 border-transparent"
                  )}
                >
                  <span>{gmailToken ? "Gmail connected" : "Link Gmail OAuth"}</span>
                  {gmailToken && <MailCheck className="w-3.5 h-3.5 text-amber-500" />}
                </button>
              </div>
            </div>

            {mailMode === 'xakteir' && (
              <div className="flex-1 flex flex-col justify-end">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2.5 ml-2">Folders</p>
                <div className="space-y-1.5">
                  {['Inbox', 'Sent', 'Starred'].map(f => (
                    <button key={f} onClick={() => { setFolder(f); setSelectedId(null); }} className={cn("w-full flex items-center px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left", folder === f ? "bg-white/5 text-white" : "text-muted-foreground hover:bg-white/5")}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {gmailToken && (
              <Button 
                onClick={disconnectGmail}
                variant="ghost" 
                className="w-full h-11 text-red-500 hover:bg-red-500/10 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect Gmail
              </Button>
            )}
          </Card>
        </div>

        {/* Mail Viewer & Detail Area */}
        <div className="flex-1 glass-card rounded-[3.5rem] overflow-hidden flex divide-x divide-white/5 bg-black/25 shadow-2xl">
          
          {/* Messages List Rail */}
          <div className="w-[380px] flex flex-col h-full bg-[#090912]/30 shrink-0">
            <header className="h-14 border-b border-white/5 px-6 flex items-center justify-between bg-black/20 shrink-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">
                {mailMode === 'gmail' ? 'Gmail Inbox' : `Xakteir ${folder}`}
              </h3>
              {mailMode === 'gmail' && gmailToken && (
                <Button onClick={() => fetchGmailInbox(gmailToken)} size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-white rounded-md">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              )}
            </header>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {isLoading || loadingGmail ? (
                  <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8 opacity-25" /></div>
                ) : mailMode === 'gmail' && gmailEmails.length === 0 ? (
                  <div className="py-20 text-center text-white/20 italic font-black uppercase text-xs tracking-widest">No Gmail messages found</div>
                ) : mailMode === 'xakteir' && emails.length === 0 ? (
                  <div className="py-20 text-center text-white/20 italic font-black uppercase text-xs tracking-widest">No internal emails found</div>
                ) : (
                  (mailMode === 'gmail' ? gmailEmails : emails).map(email => (
                    <div 
                      key={email.id} 
                      onClick={() => setSelectedId(email.id)} 
                      className={cn(
                        "p-5 rounded-[1.8rem] cursor-pointer transition-all border-2 text-left", 
                        selectedId === email.id ? "bg-primary/10 border-primary/20 shadow-xl" : "bg-zinc-950/40 border-transparent hover:border-white/5"
                      )}
                    >
                      <h4 className="font-black truncate uppercase italic text-xs text-white">{email.subject || "(No Subject)"}</h4>
                      <p className="text-[9px] text-muted-foreground mt-1 truncate">{email.senderEmail || email.senderName}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Email Content Details */}
          <div className="flex-1 flex flex-col bg-[#0b0b14]/15">
             {selectedEmail ? (
               <div className="p-12 space-y-10 animate-in fade-in h-full overflow-y-auto">
                  <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight text-white">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                       <Avatar className="w-10 h-10 border border-white/10"><AvatarFallback className="bg-zinc-800 text-white font-black text-xs">M</AvatarFallback></Avatar>
                       <div className="text-left">
                         <p className="text-xs font-black text-white italic">{selectedEmail.senderName}</p>
                         <p className="text-[9px] text-primary font-black uppercase tracking-wide">{selectedEmail.senderEmail}</p>
                       </div>
                    </div>
                  </div>
                  <div className="text-sm md:text-base leading-relaxed italic text-white/90 whitespace-pre-wrap">{selectedEmail.body}</div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center opacity-10 text-white">
                  <MailIcon className="w-24 h-24 text-white" />
                  <p className="text-base font-black uppercase italic mt-6 tracking-widest">Select an Email</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

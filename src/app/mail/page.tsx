"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Send, Inbox, PenSquare, Sparkles, X, ChevronRight, User as UserIcon, RefreshCw, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function MailPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  
  // Data
  const [userData, setUserData] = useState<any>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);

  // UI State
  const [view, setView] = useState<"inbox" | "sent">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [isComposing, setIsComposing] = useState(false);
  
  // Compose State
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Onboarding State
  const [customUsername, setCustomUsername] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch User Data
  useEffect(() => {
    if (!firestore || !user) return;
    const unsub = onSnapshot(doc(firestore, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    });
    return () => unsub();
  }, [firestore, user]);

  // Fetch Emails
  useEffect(() => {
    if (!firestore || !user || !userData?.xakteirEmail) {
      setIsLoadingEmails(false);
      return;
    }
    const q = query(
      collection(firestore, "users", user.uid, "emails"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEmails(fetched);
      setIsLoadingEmails(false);
    });
    return () => unsub();
  }, [firestore, user, userData?.xakteirEmail]);

  const handleClaimEmail = () => {
    if (!firestore || !user) return;
    const prefix = customUsername || userData?.username || user.displayName?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
    const newEmail = `${prefix}@mail.xakteir.com`;
    
    updateDocumentNonBlocking(doc(firestore, "users", user.uid), {
      xakteirEmail: newEmail,
      username: prefix
    });
    
    toast({
      title: "Email Claimed! 🎉",
      description: `Your new address is ${newEmail}`,
    });
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast({ variant: "destructive", title: "Fill out all fields" });
      return;
    }
    setIsSending(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send");
      
      toast({ title: "Email Sent! 🚀" });
      setIsComposing(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error sending", description: e.message });
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted || isUserLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>;
  }

  if (!user) {
    return <div className="p-32 text-center text-4xl font-black uppercase italic text-foreground">Sign in to access your mail.</div>;
  }

  // --- ONBOARDING VIEW ---
  if (userData && !userData.xakteirEmail) {
    const suggestedUsername = userData.username || user.displayName?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
    
    return (
      <div className="max-w-[1000px] mx-auto py-20 px-8 min-h-screen flex items-center justify-center">
        <div className="relative w-full">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-500/30 blur-[100px] -z-10 rounded-full" />
          
          <Card className="glass-card border-white/10 bg-zinc-950/80 p-16 rounded-[3rem] text-center space-y-10 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 p-10 opacity-20 pointer-events-none">
              <Mail className="w-64 h-64 text-primary transform rotate-12" />
            </div>
            
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-purple-600 shadow-[0_0_50px_rgba(var(--primary),0.5)] mb-4">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            
            <div className="space-y-4 relative z-10">
              <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                Real <span className="text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.5)]">@mail.xakteir.com</span> Emails Are Here!
              </h1>
              <p className="text-xl text-white/60 font-medium max-w-2xl mx-auto">
                Your existing email is still connected for login, but now you can claim your very own Xakteir email address to send and receive real emails.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-6 relative z-10 pt-8">
              <div className="space-y-2 text-left">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4">Choose your username</label>
                <div className="relative group">
                  <Input 
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder={suggestedUsername}
                    className="h-20 rounded-3xl bg-black/50 border-white/10 text-2xl font-black text-white pl-8 pr-48 transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/20"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 font-bold italic text-xl pointer-events-none">
                    @mail.xakteir.com
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleClaimEmail}
                className="w-full h-20 text-xl font-black uppercase italic tracking-widest rounded-3xl bg-primary hover:bg-primary/90 hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(var(--primary),0.3)]"
              >
                Claim Address <ChevronRight className="ml-2 w-6 h-6" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- MAIL CLIENT VIEW ---
  const displayEmails = emails.filter(e => view === "inbox" ? e.folder === "inbox" : e.folder === "sent");

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 h-[calc(100vh-80px)] flex gap-6 text-foreground animate-fade-in">
      
      {/* SIDEBAR */}
      <div className="w-72 flex flex-col gap-6">
        <Card className="glass-card border-white/5 bg-zinc-950/60 p-6 rounded-[2.5rem] flex items-center gap-4 shadow-xl backdrop-blur-xl">
          <Avatar className="w-14 h-14 border-2 border-primary/20">
            <AvatarImage src={userData?.photoURL || user.photoURL || ""} />
            <AvatarFallback className="bg-primary/20 text-primary font-black">{userData?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <h2 className="font-black truncate text-white">{userData?.displayName || userData?.username}</h2>
            <p className="text-xs font-bold text-white/40 truncate">{userData?.xakteirEmail}</p>
          </div>
        </Card>

        <Button 
          onClick={() => setIsComposing(true)}
          className="h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all active:scale-95"
        >
          <PenSquare className="mr-3 w-5 h-5" /> Compose
        </Button>

        <div className="flex-1 space-y-2 mt-4">
          <button 
            onClick={() => setView("inbox")}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-5 rounded-[2rem] transition-all font-bold",
              view === "inbox" 
                ? "bg-zinc-900 text-white shadow-inner" 
                : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            <Inbox className={cn("w-5 h-5", view === "inbox" && "text-primary")} /> Inbox
            {emails.filter(e => e.folder === "inbox" && !e.read).length > 0 && (
              <span className="ml-auto bg-primary text-black text-[10px] px-2 py-1 rounded-full font-black">
                {emails.filter(e => e.folder === "inbox" && !e.read).length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setView("sent")}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-5 rounded-[2rem] transition-all font-bold",
              view === "sent" 
                ? "bg-zinc-900 text-white shadow-inner" 
                : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            <Send className={cn("w-5 h-5", view === "sent" && "text-primary")} /> Sent
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <Card className="flex-1 glass-card border-white/5 bg-zinc-950/40 rounded-[3rem] overflow-hidden flex shadow-2xl backdrop-blur-2xl">
        
        {/* EMAIL LIST */}
        <div className={cn(
          "w-full md:w-[400px] border-r border-white/5 flex flex-col bg-zinc-900/20",
          selectedEmail && "hidden md:flex"
        )}>
          <div className="p-8 border-b border-white/5 flex items-center justify-between backdrop-blur-md sticky top-0 z-10">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
              {view === "inbox" ? "Inbox" : "Sent"}
            </h1>
            <Button variant="ghost" size="icon" className="rounded-full text-white/40 hover:text-white">
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
            {isLoadingEmails ? (
              <div className="p-8 text-center text-white/30 font-bold flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                Loading signals...
              </div>
            ) : displayEmails.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-white/20" />
                </div>
                <p className="text-white/40 font-bold text-lg">No messages here.</p>
              </div>
            ) : (
              displayEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={cn(
                    "w-full text-left p-6 rounded-[2rem] transition-all group relative",
                    selectedEmail?.id === email.id 
                      ? "bg-zinc-800 shadow-xl border border-white/10" 
                      : "bg-transparent hover:bg-white/5 border border-transparent",
                    !email.read && view === "inbox" && "bg-primary/5 border-primary/20"
                  )}
                >
                  {!email.read && view === "inbox" && (
                    <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),1)]" />
                  )}
                  <h3 className="font-black text-white text-lg truncate pr-6">{view === "inbox" ? email.from : email.to}</h3>
                  <p className="text-sm font-bold text-white/70 truncate mt-1">{email.subject}</p>
                  <p className="text-xs font-medium text-white/40 truncate mt-3">{email.text}</p>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-4">
                    {email.date ? new Date(email.date.seconds * 1000 || email.date).toLocaleDateString() : 'Just now'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* EMAIL READER */}
        <div className={cn(
          "flex-1 flex flex-col relative",
          !selectedEmail && "hidden md:flex"
        )}>
          {selectedEmail ? (
            <div className="h-full flex flex-col animate-fade-in">
              {/* Header */}
              <div className="p-10 border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-8">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedEmail(null)} 
                    className="md:hidden text-white/50 hover:text-white"
                  >
                    <ChevronRight className="w-6 h-6 rotate-180" />
                  </Button>
                  <h2 className="text-3xl font-black text-white">{selectedEmail.subject}</h2>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 bg-zinc-800 border border-white/10">
                      <AvatarFallback className="text-white/50 font-bold">
                        {(view === "inbox" ? selectedEmail.from : selectedEmail.to).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-white text-lg">{view === "inbox" ? selectedEmail.from : "To: " + selectedEmail.to}</div>
                      <div className="text-xs font-medium text-white/40">
                        {selectedEmail.date ? new Date(selectedEmail.date.seconds * 1000 || selectedEmail.date).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="rounded-full text-white/30 hover:text-amber-400 hover:bg-amber-400/10 transition-colors">
                    <Star className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-10">
                <div className="prose prose-invert max-w-none">
                  {selectedEmail.html ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} className="text-white/80 leading-relaxed bg-transparent" />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-white/80 leading-relaxed bg-transparent text-base">
                      {selectedEmail.text}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/20 p-8 text-center">
              <Mail className="w-24 h-24 mb-8 opacity-20" />
              <p className="text-2xl font-black uppercase italic tracking-widest">Select a message</p>
              <p className="text-sm font-bold opacity-50 mt-2">to read its contents</p>
            </div>
          )}
        </div>
      </Card>

      {/* COMPOSE MODAL */}
      {isComposing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-zinc-950 border border-white/10 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
              <h3 className="text-xl font-black uppercase italic tracking-wide text-white">New Message</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsComposing(false)} className="rounded-full text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4 flex-1">
              <Input 
                placeholder="To" 
                value={composeTo}
                onChange={e => setComposeTo(e.target.value)}
                className="h-14 rounded-2xl bg-zinc-900/50 border-white/5 text-white placeholder:text-white/30 font-medium"
              />
              <Input 
                placeholder="Subject" 
                value={composeSubject}
                onChange={e => setComposeSubject(e.target.value)}
                className="h-14 rounded-2xl bg-zinc-900/50 border-white/5 text-white placeholder:text-white/30 font-medium"
              />
              <Textarea 
                placeholder="Write your message..." 
                value={composeBody}
                onChange={e => setComposeBody(e.target.value)}
                className="min-h-[300px] rounded-2xl bg-zinc-900/50 border-white/5 text-white placeholder:text-white/30 font-medium resize-none p-4"
              />
            </div>
            
            <div className="p-6 border-t border-white/5 flex justify-end gap-4 bg-zinc-900/50">
              <Button variant="ghost" onClick={() => setIsComposing(false)} className="rounded-2xl h-12 px-6 font-bold text-white/60 hover:text-white">
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail} 
                disabled={isSending}
                className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send</>}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

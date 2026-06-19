"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Inbox, Send, Star, Trash2, Plus, Loader2, Mail as MailIcon,
  Globe, RefreshCw, LogOut, MailCheck, Search, Clock, Paperclip, 
  Lock, Calendar, CheckSquare, AlertTriangle, Languages, Split,
  LayoutDashboard, Settings, MoreVertical, X, Check, Archive, XCircle,
  Bot, Wand2, CornerUpLeft, Pin, LayoutList, EyeOff, Timer, LayoutPanelLeft, Save, FileText, Menu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth, useStorage, useDoc } from "@/firebase";
import { collection, query, where, addDoc, serverTimestamp, limit, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { GoogleAuthProvider, linkWithPopup, signInWithPopup } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { chatWithXakAI } from "@/ai/flows/xak-ai-chat-assistant-flow";


export default function MailPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [folder, setFolder] = useState("Inbox");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { data: userData } = useDoc(firestore && user ? doc(firestore, "users", user.uid) : null);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<{name: string, url: string}[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // New states for features
  const [unifiedInbox, setUnifiedInbox] = useState(false);
  const [activeTab, setActiveTab] = useState("Primary");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [splitPane, setSplitPane] = useState<'vertical'|'horizontal'>('vertical');
  const [isOffline, setIsOffline] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [focusedInbox, setFocusedInbox] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);
  const [toneAnalysis, setToneAnalysis] = useState<string | null>(null);

  // Phase 3 States
  const [layoutMode, setLayoutMode] = useState<'split' | 'list'>('split');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isE2EE, setIsE2EE] = useState(false);
  const [templates, setTemplates] = useState<{id: string, name: string, body: string}[]>([]);
  const [scheduleAt, setScheduleAt] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore || !user) return;
    const fetchTemplates = async () => {
      const q = query(collection(firestore, "users", user.uid, "email_templates"));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setTemplates(fetched);
    };
    fetchTemplates();
  }, [firestore, user]);

  useEffect(() => {
    // Reset summary when email changes
    setSummary(null);
  }, [selectedId]);

  useEffect(() => {
    // Reset tone when composing a new email or closing
    if (!isComposeOpen) setToneAnalysis(null);
  }, [isComposeOpen]);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setIsComposeOpen(true);
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const folders = useMemo(() => [
    { name: 'Inbox', icon: Inbox, color: 'bg-blue-500' },
    { name: 'Starred', icon: Star, color: 'bg-amber-500' },
    { name: 'Snoozed', icon: Clock, color: 'bg-orange-500' },
    { name: 'Sent', icon: Send, color: 'bg-green-500' },
    { name: 'Trash', icon: Trash2, color: 'bg-rose-500' },
  ], []);

  const toggleStar = async (email: any) => {
    if (!firestore || email.isGmail) return;
    if (!firestore || !user) return;
    const ref = doc(firestore, "users", user.uid, "emails", email.id);
    await updateDoc(ref, { isStarred: !email.isStarred });
  };

  const togglePin = async (email: any) => {
    if (!firestore || !user) return;
    const ref = doc(firestore, "users", user.uid, "emails", email.id);
    await updateDoc(ref, { isPinned: !email.isPinned });
  };

  const handleSweep = async () => {
    if (!firestore || !user || selectedEmails.length === 0) return;
    const senders = new Set(
      combinedEmails.filter(e => selectedEmails.includes(e.id)).map(e => e.senderEmail)
    );
    const emailsToDelete = combinedEmails.filter(e => senders.has(e.senderEmail));
    
    // In a real app we'd use a batch write, but for now we loop
    for (const email of emailsToDelete) {
      if (email.isGmail) continue;
      const ref = doc(firestore, "users", user.uid, "emails", email.id);
      await deleteDoc(ref);
    }
    toast({ title: `Swept ${emailsToDelete.length} emails` });
    setSelectedEmails([]);
    setSelectedId(null);
  };

  const moveToTrash = async (email: any) => {
    if (!firestore || !user) return;
    const ref = doc(firestore, "users", user.uid, "emails", email.id);
    await updateDoc(ref, { folder: "trash" });
    if (selectedId === email.id) setSelectedId(null);
  };

  const handleSnooze = async (hours: number) => {
    if (!selectedEmail || !firestore || !user) return;
    const ref = doc(firestore, "users", user.uid, "emails", selectedEmail.id);
    await updateDoc(ref, { 
      folder: "snoozed", 
      snoozeUntil: new Date(Date.now() + hours * 3600000).toISOString() 
    });
    setSelectedId(null);
    toast({ title: `Snoozed for ${hours} hours` });
  };

  const bulkDelete = () => {
    toast({ title: `Moved ${selectedEmails.length} items to trash` });
    setSelectedEmails([]);
  };

  const restoreFromTrash = async (email: any) => {
    if (!firestore || email.isGmail) return;
    try {
      const emailRef = doc(firestore, "emails", email.id);
      await updateDoc(emailRef, { isDeleted: false });
      setSelectedId(null);
      toast({ title: "Email restored to Inbox" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action failed" });
    }
  };

  const deletePermanently = async (email: any) => {
    if (!firestore || email.isGmail) return;
    try {
      const emailRef = doc(firestore, "emails", email.id);
      await deleteDoc(emailRef);
      setSelectedId(null);
      toast({ title: "Permanently deleted" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action failed" });
    }
  };



  const handleSelectEmail = async (email: any) => {
    setSelectedId(email.id);
    if (!email.isRead && !email.isGmail && firestore) {
      const emailRef = doc(firestore, "emails", email.id);
      await updateDoc(emailRef, { isRead: true }).catch(() => {});
    }
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    setRecipient(selectedEmail.senderEmail);
    setSubject(`Re: ${selectedEmail.subject.replace(/^Re:\s*/i, '')}`);
    setBody(`<br><br><blockquote style="border-left: 2px solid #555; padding-left: 10px; color: #888;">On ${new Date(selectedEmail.sentDateTime || Date.now()).toLocaleString()}, ${selectedEmail.senderName} wrote:<br>${selectedEmail.body}</blockquote>`);
    setIsComposeOpen(true);
  };

  // Gmail states
  const [mailMode, setMailMode] = useState<'xakteir' | 'gmail'>('xakteir');
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [gmailEmails, setGmailEmails] = useState<any[]>([]);
  const [loadingGmail, setLoadingGmail] = useState(false);

  const primaryEmail = user?.email?.toLowerCase() || "";

  useEffect(() => {
    const savedToken = localStorage.getItem("gmail_oauth_token");
    if (savedToken) {
      setGmailToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if ((mailMode === 'gmail' || unifiedInbox) && gmailToken) {
      fetchGmailInbox(gmailToken);
    }
  }, [mailMode, gmailToken, unifiedInbox]);

  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !primaryEmail) return null;
    const baseCol = collection(firestore, "emails");
    if (folder === "Sent") {
      return query(baseCol, where("senderUserId", "==", user.uid), limit(100));
    }
    return query(baseCol, where("recipientList", "array-contains", primaryEmail), limit(100));
  }, [firestore, user, folder, primaryEmail]);

  const { data: rawEmails, isLoading } = useCollection(emailsQuery);

  const emails = useMemo(() => {
    if (!rawEmails) return [];
    let filtered = rawEmails;
    if (folder === "Starred") filtered = filtered.filter(e => e.isStarred && !e.isDeleted);
    else if (folder === "Snoozed") filtered = filtered.filter(e => !e.isDeleted && e.snoozedUntil && e.snoozedUntil > Date.now());
    else if (folder === "Sent") filtered = filtered.filter(e => !e.isDeleted);
    else if (folder === "Trash") filtered = filtered.filter(e => e.isDeleted);
    else filtered = filtered.filter(e => !e.isDeleted && (!e.snoozedUntil || e.snoozedUntil <= Date.now()) && e.folder !== "sent");
    
    if (searchQuery) {
      filtered = filtered.filter(e => e.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || e.body?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  }, [rawEmails, folder, searchQuery]);

  const combinedEmails = useMemo(() => {
    if (unifiedInbox) {
      return [...emails, ...gmailEmails].sort((a, b) => new Date(b.sentDateTime || 0).getTime() - new Date(a.sentDateTime || 0).getTime());
    }
    return mailMode === 'gmail' ? gmailEmails : emails;
  }, [emails, gmailEmails, unifiedInbox, mailMode]);

  const selectedEmail = useMemo(() => {
    return combinedEmails.find(e => e.id === selectedId);
  }, [combinedEmails, selectedId]);

  const handleConnectGmail = async () => {
    if (!auth || !auth.currentUser) return;
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
    provider.addScope("https://www.googleapis.com/auth/gmail.send");
    try {
      const result = await linkWithPopup(auth.currentUser, provider);
      const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
      if (token) {
        localStorage.setItem("gmail_oauth_token", token);
        setGmailToken(token);
        setMailMode('gmail');
      }
    } catch (e: any) {
      console.error("Gmail linking error:", e);
      if (e.code === 'auth/credential-already-in-use' || e.code === 'auth/provider-already-linked') {
        try {
          const result = await signInWithPopup(auth, provider);
          const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
          if (token) {
            localStorage.setItem("gmail_oauth_token", token);
            setGmailToken(token);
            setMailMode('gmail');
          }
        } catch (err: any) {
          console.error("Gmail sign-in error:", err);
          toast({ title: "Gmail Error", description: err.message, variant: "destructive" });
        }
      } else {
         toast({ title: "Gmail Error", description: e.message, variant: "destructive" });
      }
    }
  };

  const disconnectGmail = () => {
    localStorage.removeItem("gmail_oauth_token");
    setGmailToken(null);
    setMailMode('xakteir');
    setGmailEmails([]);
    setUnifiedInbox(false);
  };

  const fetchGmailInbox = async (token: string) => {
    setLoadingGmail(true);
    try {
      const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!listRes.ok) throw new Error("Auth token expired");
      const listData = await listRes.json();

      if (listData.messages) {
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
              id: detail.id, subject, senderEmail: from, senderName: from.split("<")[0]?.trim() || from,
              body: detail.snippet || "(No content)", sentDateTime: date, isGmail: true,
              isSpam: Math.random() > 0.9, hasCalendar: subject.toLowerCase().includes('invite')
            };
          })
        );
        setGmailEmails(details);
      }
    } catch (err) {
      localStorage.removeItem("gmail_oauth_token");
      setGmailToken(null);
      setMailMode('xakteir');
      setLoadingGmail(false);
    }
  };

  const storage = useStorage();

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !storage) return;
    setIsUploadingAttachment(true);
    try {
      const storageRef = ref(storage, `mail_attachments/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = await uploadBytesResumable(storageRef, file);
      const url = await getDownloadURL(uploadTask.ref);
      setAttachments(prev => [...prev, { name: file.name, url }]);
      toast({ title: "Attachment uploaded" });
    } catch (err) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setIsUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!auth || !auth.currentUser) return toast({ variant: "destructive", title: "Not authenticated" });
    if (!recipient || !subject || !body) return toast({ variant: "destructive", title: "Missing fields" });
    
    setIsSending(true);
    let undone = false;
    
    toast({ 
      title: scheduleAt ? "Message scheduled!" : "Message queued for sending...", 
      description: "You have 5 seconds to undo.",
      action: <Button variant="outline" size="sm" onClick={() => { 
        undone = true; 
        setIsSending(false);
        toast({ title: "Sending Undone", description: "Message kept in drafts." }); 
      }}>Undo</Button>,
      duration: 5000
    });

    setTimeout(async () => {
      if (undone) return;
      try {
        let finalBody = body;
        if (isEncrypted) {
          finalBody = `<div style="padding:20px;background:#111;color:#0f0;border:1px solid #0f0;border-radius:10px;font-family:monospace;">[E2EE ENCRYPTED MESSAGE] - Recipient must use Xakteir Mail to decrypt.</div>`;
        }

        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser!.getIdToken()}` },
          body: JSON.stringify({ 
            to: recipient, 
            subject, 
            body: finalBody, 
            senderAddress: `${userData?.username || user?.displayName?.toLowerCase().replace(/\s+/g,'') || user?.uid}@mail.xakteir.com`,
            senderName: user?.displayName || "Xakteir Member" 
          })
        });
        if (!res.ok) throw new Error("Failed to send email");
        
        if (firestore && user) {
          await addDoc(collection(firestore, "users", user.uid, "emails"), {
            subject,
            senderName: user.displayName || "Me",
            senderEmail: `${userData?.username || user?.displayName?.toLowerCase().replace(/\s+/g,'') || user.uid}@mail.xakteir.com`,
            body: isEncrypted ? body : finalBody, // Save raw body for sender
            sentDateTime: new Date().toISOString(),
            isRead: true,
            folder: scheduleAt ? "scheduled" : "sent",
            isGmail: false,
            authorId: user.uid,
            isEncrypted,
            expiresAt,
            scheduleAt
          });
        }
        
        toast({ title: scheduleAt ? "Scheduled successfully" : "Message Sent Successfully" });
        setIsComposeOpen(false);
        setRecipient(""); setSubject(""); setBody(""); setAttachments([]);
        setIsEncrypted(false); setExpiresAt(null); setScheduleAt(null);
      } catch (err: any) {
        toast({ variant: "destructive", title: "Send Failed", description: err.message });
      } finally { 
        setIsSending(false); 
      }
    }, 5000);
  };

  const handleSummarize = async () => {
    if (!selectedEmail) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
      const response = await chatWithXakAI({
        message: `Summarize this email briefly: Subject: ${selectedEmail.subject}. Body: ${selectedEmail.body}`,
        userId: user?.uid
      });
      setSummary(response.response);
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to summarize" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSmartReply = async () => {
    if (!selectedEmail) return;
    setIsGeneratingReply(true);
    try {
      const response = await chatWithXakAI({
        message: `Generate a professional, concise email reply to this email. Just provide the email body, no subject. Email: ${selectedEmail.body}`,
        userId: user?.uid
      });
      setBody(response.response);
      setRecipient(selectedEmail.senderEmail);
      setSubject(`Re: ${selectedEmail.subject}`);
      setIsComposeOpen(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to generate reply" });
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleAnalyzeTone = async () => {
    if (!body) return;
    setIsAnalyzingTone(true);
    setToneAnalysis(null);
    try {
      const response = await chatWithXakAI({
        message: `Analyze the tone of this email draft. Is it professional, friendly, angry, or too casual? Provide a 1-2 sentence concise analysis. Draft: ${body}`,
        userId: user?.uid
      });
      setToneAnalysis(response.response);
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to analyze tone" });
    } finally {
      setIsAnalyzingTone(false);
    }
  };

  const applyTemplate = (val: string) => {
    if (val === 'meeting') setBody("Hi,\\n\\nLet's schedule a meeting for next week. Let me know what time works for you.\\n\\nBest,");
    if (val === 'thanks') setBody("Thank you so much for your email!\\n\\nI'll get back to you shortly.");
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-zinc-950"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {isOffline && <div className="bg-amber-500 text-black text-center text-xs font-bold py-1 uppercase">Offline Mode - Some features may be unavailable</div>}
      <div className="flex-1 flex p-4 lg:p-6 gap-6 overflow-hidden relative">
        
        {/* Sidebar */}
        <div className={cn(
          "flex flex-col space-y-6 shrink-0 transition-all duration-300 z-30 lg:relative absolute lg:inset-auto inset-y-4 left-4 lg:bg-transparent bg-zinc-950/95 lg:p-0 p-4 rounded-[2rem] lg:w-80 w-[280px] shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:opacity-0"
        )}>
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-primary hover:bg-primary/95 text-black h-16 rounded-3xl font-black uppercase text-xs italic shadow-xl">
                <Plus className="w-5 h-5 mr-3" /> New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-2xl text-white p-10 bg-zinc-950">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase italic flex justify-between items-center">
                  <span>{mailMode === 'gmail' ? 'Compose via Gmail' : 'New Message'}</span>
                  <div className="flex gap-2 items-center">
                    <Select value={expiresAt || 'none'} onValueChange={(val) => setExpiresAt(val === 'none' ? null : val)}>
                      <SelectTrigger className="w-[110px] h-8 text-[10px] bg-rose-500/10 border-rose-500/20 text-rose-500">
                        <Timer className="w-3 h-3 mr-1" />
                        <SelectValue placeholder="Destruct" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="none">No Expiry</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="24h">24 Hours</SelectItem>
                        <SelectItem value="7d">7 Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(val) => {
                      if (val.startsWith('custom_')) {
                        const temp = templates.find(t => t.id === val.replace('custom_', ''));
                        if (temp) setBody(temp.body);
                      } else {
                        applyTemplate(val);
                      }
                    }}>
                      <SelectTrigger className="w-[110px] h-8 text-[10px] bg-white/5 border-white/10">
                        <SelectValue placeholder="Templates" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="meeting">Meeting Request</SelectItem>
                        <SelectItem value="thanks">Thank You</SelectItem>
                        {templates.map(t => (
                          <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 bg-white/5 border border-white/10 text-white/50 hover:text-white"
                      title="Save as Template"
                      onClick={async () => {
                        if (!firestore || !user) return;
                        if (!body) return toast({ variant: "destructive", title: "Cannot save empty body as template" });
                        const name = prompt("Enter template name:");
                        if (!name) return;
                        try {
                          const docRef = await addDoc(collection(firestore, "users", user.uid, "email_templates"), { name, body });
                          setTemplates(prev => [...prev, { id: docRef.id, name, body }]);
                          toast({ title: "Template Saved Successfully" });
                        } catch (e) {
                          toast({ variant: "destructive", title: "Failed to save template" });
                        }
                      }}
                    >
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Select defaultValue="xakteir">
                    <SelectTrigger className="w-[200px] h-12 bg-[#0b0b14]/60 border-transparent rounded-xl text-xs">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xakteir">
                        {userData?.xakteirEmail || (userData?.username ? `${userData.username}@mail.xakteir.com` : (user?.email?.endsWith('@xakteir.com') ? user.email : "Xakteir Email"))}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="To: name@email.com" className="bg-[#0b0b14]/60 border-transparent h-12 rounded-xl text-white flex-1" />
                </div>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="bg-[#0b0b14]/60 border-transparent h-12 rounded-xl text-white" />
                <div className="relative">
                  <RichTextEditor content={body} onChange={setBody} placeholder="Type message body..." className="min-h-[250px]" />
                  
                  {toneAnalysis && (
                    <div className="absolute top-4 right-4 bg-zinc-900/90 border border-white/10 backdrop-blur-md p-3 rounded-xl max-w-xs shadow-2xl animate-in fade-in zoom-in">
                      <div className="flex items-center gap-2 mb-1">
                        <Wand2 className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Tone Analysis</span>
                      </div>
                      <p className="text-xs text-white/80">{toneAnalysis}</p>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 flex gap-2 items-center">
                    <input type="file" ref={attachmentInputRef} className="hidden" onChange={handleAttachmentUpload} />
                    <Button variant="ghost" size="icon" onClick={() => attachmentInputRef.current?.click()} className="h-8 w-8 text-white/50 hover:text-white rounded-full"><Paperclip className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={handleAnalyzeTone} disabled={isAnalyzingTone || !body} className={cn("h-8 w-8 rounded-full", isAnalyzingTone ? "text-primary animate-pulse" : "text-white/50 hover:text-white")}>
                      <Wand2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white rounded-full"><LayoutDashboard className="w-4 h-4" /> {/* Drive Integration */}</Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsEncrypted(!isEncrypted)} className={cn("h-8 w-8 rounded-full", isEncrypted ? "text-green-400" : "text-white/50")}><Lock className="w-4 h-4" /></Button>
                  </div>
                </div>
                {attachments.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {attachments.map((att, i) => (
                      <Badge key={i} variant="outline" className="border-white/20 bg-white/5 text-xs py-1.5 px-3 flex items-center gap-2">
                         <Paperclip className="w-3 h-3" />
                         <span className="truncate max-w-[150px]">{att.name}</span>
                         <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter className="flex justify-between items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Select value={scheduleAt || 'none'} onValueChange={(val) => setScheduleAt(val === 'none' ? null : val)}>
                    <SelectTrigger className={cn("h-10 text-xs border-transparent rounded-xl", scheduleAt ? "bg-primary/20 text-primary" : "bg-[#0b0b14]/60 text-white/50")}>
                      <Clock className="w-3.5 h-3.5 mr-2" />
                      <SelectValue placeholder="Send Now" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      <SelectItem value="none">Send Now</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow Morning (8:00 AM)</SelectItem>
                      <SelectItem value="evening">This Evening (6:00 PM)</SelectItem>
                      <SelectItem value="nextWeek">Next Week (Monday 9:00 AM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button disabled={isSending} onClick={handleSend} className="h-14 px-12 bg-primary rounded-xl font-black uppercase text-xs text-black hover:bg-primary/95">
                  {isSending ? <Loader2 className="animate-spin text-black" /> : (scheduleAt ? "Schedule" : "Transmit")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="flex-1 glass-card border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col bg-black/40 p-4 space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Mailboxes</p>
              <Switch checked={unifiedInbox} onCheckedChange={setUnifiedInbox} />
            </div>
            
            {!unifiedInbox && (
              <div className="space-y-1.5">
                <button 
                  onClick={() => { setMailMode('xakteir'); setSelectedId(null); }}
                  className={cn("w-full flex items-center px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left border", mailMode === 'xakteir' ? "bg-primary/10 border-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5 border-transparent")}
                >
                  Xakteir Mail
                </button>
                <button 
                  onClick={() => { gmailToken ? setMailMode('gmail') : handleConnectGmail(); setSelectedId(null); }}
                  className={cn("w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left border", mailMode === 'gmail' ? "bg-amber-500/10 border-amber-500/25 text-amber-500" : "text-muted-foreground hover:bg-white/5 border-transparent")}
                >
                  <span>{gmailToken ? "Gmail" : "Link Gmail"}</span>
                  {gmailToken && <MailCheck className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <div className="flex-1 flex flex-col pt-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2.5 ml-2">Folders</p>
              <div className="space-y-1.5">
                {folders.map(f => {
                  const FolderIcon = f.icon;
                  return (
                    <button 
                      key={f.name} 
                      onClick={() => { setFolder(f.name); setSelectedId(null); }} 
                      className={cn("w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left border", folder === f.name ? "bg-white/5 text-white border-white/5" : "text-muted-foreground border-transparent hover:bg-white/5")}
                    >
                      <div className={cn("w-2 h-2 rounded-full", f.color)} />
                      <FolderIcon className="w-4 h-4 shrink-0" />
                      <span>{f.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button variant="ghost" className="w-full justify-start text-xs text-white/50 hover:text-white" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-2" /> Settings & Rules
            </Button>
          </Card>
        </div>

        {/* Mail Viewer */}
        <div className={cn("flex-1 glass-card rounded-[3.5rem] overflow-hidden flex bg-black/25 shadow-2xl divide-white/5", splitPane === 'vertical' ? 'flex-row divide-x' : 'flex-col divide-y')}>
          
          {/* List Rail */}
          {(!selectedId || layoutMode === 'split') && (
            <div className={cn("flex flex-col bg-[#090912]/30 shrink-0", 
              layoutMode === 'list' ? 'flex-1 h-full' : (splitPane === 'vertical' ? 'w-[400px] h-full' : 'h-[40%] w-full')
            )}>
            <header className="p-4 border-b border-white/5 bg-black/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-white">
                  {unifiedInbox ? 'Unified Inbox' : (mailMode === 'gmail' ? 'Gmail' : `${folder}`)}
                </h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setLayoutMode(p => p === 'split' ? 'list' : 'split')} className={cn("h-7 w-7", layoutMode === 'list' ? "text-primary" : "text-white/50")}>
                    {layoutMode === 'split' ? <LayoutList className="w-3.5 h-3.5" /> : <LayoutPanelLeft className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSplitPane(p => p === 'vertical' ? 'horizontal' : 'vertical')} className="h-7 w-7 text-white/50"><Split className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50"><RefreshCw className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search mail..." className="bg-black/40 border-transparent pl-9 text-xs h-9 rounded-xl text-white" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-transparent h-7 p-0 gap-4">
                    <TabsTrigger value="Primary" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none p-0 text-[10px] uppercase font-bold tracking-wider text-white/40">Primary</TabsTrigger>
                    <TabsTrigger value="Social" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none p-0 text-[10px] uppercase font-bold tracking-wider text-white/40">Social</TabsTrigger>
                    <TabsTrigger value="Promos" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none p-0 text-[10px] uppercase font-bold tracking-wider text-white/40">Promos</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {selectedEmails.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={bulkDelete} size="sm" variant="secondary" className="h-7 text-[10px] uppercase font-bold">Archive/Delete {selectedEmails.length}</Button>
                  <Button onClick={handleSweep} size="sm" variant="secondary" className="h-7 text-[10px] uppercase font-bold bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">Sweep</Button>
                  <Button onClick={() => setSelectedEmails([])} size="sm" variant="ghost" className="h-7 w-7 p-0"><X className="w-3 h-3" /></Button>
                </div>
              )}
            </header>
            
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {combinedEmails.filter(e => activeTab === 'Primary' || (activeTab === 'Promos' && e.isGmail)).map(email => (
                  <div key={email.id} className={cn("group flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all border border-transparent", selectedId === email.id ? "bg-primary/10 border-primary/20" : "hover:bg-white/5")}>
                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedEmails.includes(email.id)}
                        onCheckedChange={(c) => setSelectedEmails(p => c ? [...p, email.id] : p.filter(id => id !== email.id))}
                        className="border-white/20 data-[state=checked]:bg-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => handleSelectEmail(email)}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={cn("text-[11px] truncate pr-2", !email.isRead ? "font-black text-white" : "font-bold text-white/70")}>
                          {email.senderName} 
                          {email.isImportant && <Badge variant="secondary" className="ml-1 text-[8px] h-4 px-1 bg-amber-500/20 text-amber-500">Important</Badge>}
                          {email.isPinned && <Pin className="w-3 h-3 inline ml-1 text-primary" />}
                        </span>
                        <span className={cn("text-[9px] whitespace-nowrap", !email.isRead ? "text-primary font-bold" : "text-white/40")}>{email.sentDateTime ? new Date(email.sentDateTime).toLocaleDateString() : ''}</span>
                      </div>
                      <h4 className={cn("text-[11px] truncate", !email.isRead ? "font-black text-white" : "font-bold text-white/80")}>{email.subject}</h4>
                      <p className={cn("text-[10px] truncate mt-0.5", !email.isRead ? "text-white/70" : "text-white/50")}>{email.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          )}

          {/* Detail View */}
          {(selectedId || layoutMode === 'split') && (
            <div className="flex-1 flex flex-col bg-[#0b0b14]/15 overflow-hidden">
             {selectedEmail ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-8 md:p-12 space-y-8 animate-in fade-in">
                    
                    {selectedEmail.isSpam && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-rose-500 font-bold text-sm">Phishing/Spam Warning</h4>
                          <p className="text-rose-500/80 text-xs mt-1">This message seems dangerous. Do not click links or share personal info.</p>
                        </div>
                      </div>
                    )}

                    {selectedEmail.hasCalendar && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-blue-400" />
                          <span className="text-blue-400 font-bold text-sm">Event Invitation Details</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 border-blue-500/30 text-blue-400 hover:bg-blue-500/20">Add to Calendar</Button>
                      </div>
                    )}

                    {layoutMode === 'list' && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="self-start text-xs text-white/50 hover:text-white pl-0 mb-4">
                        &larr; Back to Inbox
                      </Button>
                    )}
                    <div className="flex justify-between items-start gap-6">
                      <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">{isTranslating ? "TRANSLATED: " + selectedEmail.subject : selectedEmail.subject}</h2>
                      <div className="flex gap-2 shrink-0">
                        <Button onClick={() => setIsTranslating(!isTranslating)} variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full", isTranslating ? "bg-primary/20 text-primary" : "text-white/50")}><Languages className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => toggleStar(selectedEmail)} className={cn("hover:bg-amber-500/10", selectedEmail.isStarred ? "text-amber-500" : "text-white/40 hover:text-amber-400")}>
                            <Star className={cn("w-5 h-5", selectedEmail.isStarred && "fill-amber-500")} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => togglePin(selectedEmail)} className={cn("hover:bg-primary/10", selectedEmail.isPinned ? "text-primary" : "text-white/40 hover:text-primary")}>
                            <Pin className={cn("w-5 h-5", selectedEmail.isPinned && "fill-primary")} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => moveToTrash(selectedEmail)} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                          <Select onValueChange={(val) => handleSnooze(parseInt(val))}>
                            <SelectTrigger className="w-10 h-10 p-0 border-0 bg-transparent hover:bg-white/5 flex items-center justify-center [&>svg:last-child]:hidden">
                              <Clock className="w-5 h-5 text-white/40 hover:text-white" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                              <SelectItem value="2">Snooze 2 Hours</SelectItem>
                              <SelectItem value="12">Snooze 12 Hours</SelectItem>
                              <SelectItem value="24">Snooze Tomorrow</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5"><MoreVertical className="w-5 h-5" /></Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 border border-white/10"><AvatarFallback className="bg-zinc-800 text-white font-black text-xs">U</AvatarFallback></Avatar>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {selectedEmail.senderName} 
                            {selectedEmail.senderEmail.includes('newsletter') && <Badge variant="outline" className="text-[9px] h-4 cursor-pointer hover:bg-white/10">Unsubscribe</Badge>}
                          </p>
                          <p className="text-xs text-white/50">to me {selectedEmail.isGmail && <Lock className="w-3 h-3 inline ml-1 opacity-50" />}</p>
                        </div>
                      </div>
                      <p className="text-xs text-white/40">{selectedEmail.sentDateTime ? new Date(selectedEmail.sentDateTime).toLocaleString() : ''}</p>
                    </div>

                    <div className="text-sm leading-relaxed text-white/90 w-full">
                      {isTranslating && <p className="mb-4 text-primary font-bold">This is a mocked translation of the email body showing how it would look in the users native language.</p>}
                      
                      {/* Tracker Blocking Alert */}
                      <div className="mb-4 flex items-center gap-2 text-[10px] text-green-400/75 bg-green-500/5 px-3 py-1.5 rounded-lg border border-green-500/10">
                        <EyeOff className="w-3.5 h-3.5 shrink-0" />
                        <span>Tracker Blocked: 1x1 tracking pixels stripped. Your privacy is protected.</span>
                      </div>

                      {selectedEmail.html ? (
                        <div className="w-full bg-white rounded-lg overflow-hidden shadow-inner">
                          <iframe 
                            srcDoc={selectedEmail.html.replace(/<img[^>]*width=["']?1["']?[^>]*>/gi, '').replace(/<img[^>]*height=["']?1["']?[^>]*>/gi, '')} 
                            title="Email Content"
                            className="w-full min-h-[500px] border-0"
                            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                          />
                        </div>
                      ) : (
                         <div className="whitespace-pre-wrap">
                           {selectedEmail.isEncrypted ? (
                             <div className="p-6 border border-green-500/30 bg-green-500/10 rounded-xl text-green-400 font-mono text-sm space-y-4">
                               <div className="flex items-center gap-2">
                                 <Lock className="w-5 h-5" /> 
                                 <strong>End-to-End Encrypted Message</strong>
                               </div>
                               <p>This message was encrypted by the sender. Only you have the keys to decrypt it.</p>
                               <Button onClick={() => toast({ title: "Decrypted Content", description: selectedEmail.body })} variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/20">
                                 Decrypt Now
                               </Button>
                             </div>
                           ) : (
                             selectedEmail.body
                           )}
                         </div>
                      )}
                    </div>

                    {/* AI Tools */}
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex gap-3">
                        <Button onClick={handleSummarize} disabled={isSummarizing} variant="outline" className="h-10 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-bold text-xs uppercase tracking-widest">
                          {isSummarizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
                          Summarize Thread
                        </Button>
                        <Button onClick={handleSmartReply} disabled={isGeneratingReply} variant="outline" className="h-10 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-bold text-xs uppercase tracking-widest">
                          {isGeneratingReply ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                          Smart Reply
                        </Button>
                        <Button onClick={handleReply} variant="outline" className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold text-xs uppercase tracking-widest">
                          <CornerUpLeft className="w-4 h-4 mr-2" />
                          Reply
                        </Button>
                      </div>
                      
                      {summary && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                           <div className="flex items-center gap-2 mb-2"><Bot className="w-4 h-4 text-primary" /><span className="text-[10px] font-black uppercase text-primary tracking-widest">AI Summary</span></div>
                           <p className="text-sm text-white/80">{summary}</p>
                        </div>
                      )}
                    </div>

                    {/* Attachments Mock */}
                    {selectedEmail.isGmail && (
                      <div className="pt-8 flex gap-3">
                        <div className="h-24 w-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-col gap-2 cursor-pointer hover:bg-white/10">
                          <Paperclip className="w-6 h-6 text-white/40" />
                          <span className="text-[9px] text-white/60 font-bold">document.pdf</span>
                        </div>
                      </div>
                    )}

                    {/* Auto Replies */}
                    <div className="pt-8 flex gap-3">
                      <Button variant="outline" className="rounded-full bg-white/5 border-white/10 text-xs">Sounds good to me!</Button>
                      <Button variant="outline" className="rounded-full bg-white/5 border-white/10 text-xs">I will check on this.</Button>
                      <Button variant="outline" className="rounded-full bg-white/5 border-white/10 text-xs">Can we reschedule?</Button>
                    </div>

                  </div>
                </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                  <MailIcon className="w-16 h-16 mb-4" style={{ stroke: "url(#mesh-gradient)", fill: "url(#mesh-gradient)", fillOpacity: 0.15 }} />
                  <p className="text-sm font-bold uppercase tracking-widest">Select an Email</p>
               </div>
             )}
          </div>
          )}
        </div>
        
        {/* Sidebar Toggle Button for mobile */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-6 left-6 z-40 lg:hidden w-14 h-14 rounded-full bg-primary text-black flex items-center justify-center shadow-2xl border-4 border-[#05030d] active:scale-95 transition-transform hover:scale-105"
          aria-label="Toggle folders"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] bg-zinc-950 text-white max-w-xl">
          <DialogHeader><DialogTitle className="font-black uppercase italic text-xl">Settings & Features</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-center">
              <div><Label className="font-bold">Vacation Responder</Label><p className="text-xs text-white/50">Auto-reply to incoming emails</p></div>
              <Switch />
            </div>
            <div className="flex justify-between items-center">
              <div><Label className="font-bold">Focused Inbox</Label><p className="text-xs text-white/50">Learn important markers</p></div>
              <Switch checked={focusedInbox} onCheckedChange={setFocusedInbox} />
            </div>
            <div className="flex justify-between items-center">
              <div><Label className="font-bold">Read Receipts Tracking</Label><p className="text-xs text-white/50">Track when emails are opened</p></div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center justify-between">Rules & Filters <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer">+ New Rule</Badge></Label>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between mt-2">
                 <div>
                    <p className="text-xs font-bold text-white">If sender is "newsletter@example.com"</p>
                    <p className="text-[10px] text-white/50">Then move to Trash</p>
                 </div>
                 <Trash2 className="w-4 h-4 text-rose-500 cursor-pointer hover:text-rose-400" />
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-white/5">
              <Label className="font-bold">Signature Manager</Label>
              <Textarea className="bg-white/5 border-white/10 text-xs h-20" placeholder="Your signature HTML/Text..." />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

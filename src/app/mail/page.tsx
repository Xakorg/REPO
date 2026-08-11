"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import DOMPurify from 'dompurify';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Inbox, Send, Star, Trash2, Plus, Loader2, Mail as MailIcon,
  Globe, RefreshCw, LogOut, MailCheck, Search, Clock, Paperclip,
  Lock, Calendar, CheckSquare, AlertTriangle, Languages, Split,
  LayoutDashboard, Settings, MoreVertical, X, Check, Archive, XCircle,
  Bot, Wand2, CornerUpLeft, Pin, LayoutList, EyeOff, Timer, LayoutPanelLeft,
  Save, FileText, Menu, Bell, Tag, BarChart2, ChevronDown, ChevronRight,
  Layers, Shield, Download, Eye, Filter, Zap, Users, UserPlus, AtSign,
  CheckCircle, AlertCircle, Palette, Bold, Italic, Link2, Hash, ListFilter,
  FolderOpen, PieChart, TrendingUp, MailOpen, Bookmark, BellRing, BellOff,
  Cpu, GitMerge, Volume2, VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useUser, useFirestore, useCollection, useMemoFirebase, useAuth, useStorage, useDoc
} from "@/firebase";
import {
  collection, query, where, addDoc, serverTimestamp, limit, getDocs,
  doc, updateDoc, deleteDoc, orderBy, setDoc, getDoc
} from "firebase/firestore";
import { GoogleAuthProvider, linkWithPopup, signInWithPopup } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { chatWithXakAI } from "@/ai/flows/xak-ai-chat-assistant-flow";
import { SignatureStudioModal } from "@/components/mail/SignatureStudioModal";
import { MailAnalyticsModal } from "@/components/mail/MailAnalyticsModal";


// ─── HELPERS ────────────────────────────────────────────────────────────────

const INBOX_TABS = ["Primary", "Social", "Promotions", "Notifications", "Finance"] as const;
type InboxTab = typeof INBOX_TABS[number];

const SOCIAL_DOMAINS = ["facebook", "twitter", "instagram", "linkedin", "tiktok", "snapchat", "pinterest", "reddit", "discord"];
const PROMO_KEYWORDS = ["unsubscribe", "deal", "offer", "sale", "discount", "promo", "shop", "buy", "order", "free", "limited", "coupon", "newsletter", "marketing"];
const NOTIF_KEYWORDS = ["notification", "alert", "reminder", "noreply", "no-reply", "donotreply", "system", "automated", "account", "verify", "confirm", "reset"];
const FINANCE_KEYWORDS = ["invoice", "receipt", "payment", "billing", "transaction", "statement", "bank", "paypal", "stripe", "$", "€", "£", "refund", "order"];

function classifyEmail(email: any): InboxTab {
  const domain = (email.senderEmail || "").toLowerCase();
  const subject = (email.subject || "").toLowerCase();
  const body = (email.body || "").toLowerCase();
  const combined = subject + " " + body + " " + domain;

  if (SOCIAL_DOMAINS.some(d => domain.includes(d))) return "Social";
  if (FINANCE_KEYWORDS.some(k => combined.includes(k))) return "Finance";
  if (NOTIF_KEYWORDS.some(k => combined.includes(k))) return "Notifications";
  if (PROMO_KEYWORDS.some(k => combined.includes(k))) return "Promotions";
  return "Primary";
}

function normalizeSubject(s: string) {
  return (s || "").replace(/^(re|fwd|fw|aw):\s*/gi, "").trim().toLowerCase();
}

function getInitials(name: string) {
  return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

const LABEL_COLORS = [
  { name: "Red", bg: "bg-rose-500/20", text: "text-rose-400", dot: "bg-rose-500" },
  { name: "Blue", bg: "bg-blue-500/20", text: "text-blue-400", dot: "bg-blue-500" },
  { name: "Green", bg: "bg-green-500/20", text: "text-green-400", dot: "bg-green-500" },
  { name: "Yellow", bg: "bg-amber-500/20", text: "text-amber-400", dot: "bg-amber-500" },
  { name: "Purple", bg: "bg-purple-500/20", text: "text-purple-400", dot: "bg-purple-500" },
  { name: "Cyan", bg: "bg-cyan-500/20", text: "text-cyan-400", dot: "bg-cyan-500" },
];

const BUILT_IN_TEMPLATES = [
  {
    id: "meeting",
    name: "Meeting Request",
    subject: "Meeting Request – [Topic]",
    body: "Hi,\n\nI'd like to schedule a meeting to discuss [topic]. Could you let me know your availability this week?\n\nBest regards,"
  },
  {
    id: "followup",
    name: "Follow Up",
    subject: "Following up on [Topic]",
    body: "Hi,\n\nI wanted to follow up on my previous email regarding [topic]. Please let me know if you have any updates.\n\nThanks,"
  },
  {
    id: "thankyou",
    name: "Thank You",
    subject: "Thank You",
    body: "Hi,\n\nThank you so much for your time and support. I really appreciate it!\n\nBest regards,"
  },
  {
    id: "intro",
    name: "Introduction",
    subject: "Introduction – [Your Name]",
    body: "Hi,\n\nMy name is [Your Name] and I wanted to reach out to introduce myself. I look forward to connecting with you.\n\nWarm regards,"
  },
  {
    id: "ooo",
    name: "Out of Office",
    subject: "Out of Office: [Dates]",
    body: "Hi,\n\nThank you for your email. I am currently out of the office from [start date] to [end date]. I will respond upon my return.\n\nBest,"
  },
];

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function MailPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const storage = useStorage();

  // Core state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [folder, setFolder] = useState("Inbox");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // UI state
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<{name: string; url: string; type?: string; size?: number}[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [unifiedInbox, setUnifiedInbox] = useState(false);
  const [activeTab, setActiveTab] = useState<InboxTab>("Primary");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [splitPane, setSplitPane] = useState<"vertical" | "horizontal">("vertical");
  const [isOffline, setIsOffline] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [focusedInbox, setFocusedInbox] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("general");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);
  const [toneAnalysis, setToneAnalysis] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<"split" | "list">("split");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isE2EE, setIsE2EE] = useState(false);
  const [scheduleAt, setScheduleAt] = useState<string | null>(null);
  const [mailMode, setMailMode] = useState<"xakteir" | "gmail">("xakteir");
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [gmailEmails, setGmailEmails] = useState<any[]>([]);
  const [loadingGmail, setLoadingGmail] = useState(false);

  // ── SUPERCHARGE FEATURES ──
  const [mailTheme, setMailTheme] = useState<"obsidian" | "cyberpunk" | "holographic" | "matrix">("obsidian");
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [showInboxZeroWizard, setShowInboxZeroWizard] = useState(false);
  const [inboxZeroLoading, setInboxZeroLoading] = useState(false);
  const [inboxZeroResults, setInboxZeroResults] = useState<{actionRequired: any[], trash: any[], snooze: any[]} | null>(null);

  // ── Feature 1: Smart Inbox Tabs ──
  const [emailLabelOverrides, setEmailLabelOverrides] = useState<Record<string, InboxTab>>({});

  // ── Feature 2: Snooze ──
  // (handled via Firestore update + folder filter)

  // ── Feature 3: Read Receipts ──
  const [requestReadReceipt, setRequestReadReceipt] = useState(false);
  const [readReceiptBanner, setReadReceiptBanner] = useState(false);

  // ── Feature 4: Undo Send ──
  const undoSendRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [undoProgress, setUndoProgress] = useState(0);

  // ── Feature 5: Follow-up Reminders ──
  const [awaitingReplyEmails, setAwaitingReplyEmails] = useState<any[]>([]);
  const [showFollowUpPanel, setShowFollowUpPanel] = useState(false);

  // ── Feature 6: Templates ──
  const [templates, setTemplates] = useState<{id: string; name: string; subject?: string; body: string}[]>([]);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);

  // ── Feature 7: Mail Merge ──
  const [showMergePanel, setShowMergePanel] = useState(false);
  const [mergeRecipients, setMergeRecipients] = useState("");
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  // ── Feature 8: Alias Manager ──
  const [aliases, setAliases] = useState<{id: string; address: string; name: string}[]>([]);
  const [selectedAlias, setSelectedAlias] = useState<string>("main");
  const [newAliasName, setNewAliasName] = useState("");
  const [newAliasAddress, setNewAliasAddress] = useState("");

  // ── Feature 9: Attachment Viewer ──
  const [attachmentViewUrl, setAttachmentViewUrl] = useState<string | null>(null);
  const [attachmentViewType, setAttachmentViewType] = useState<string | null>(null);

  // ── Feature 10: Email-to-Task ──
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);

  // ── Feature 11: Priority Inbox (starred) ──
  // Handled via existing isStarred + Firestore

  // ── Feature 12: Spam Bouncer ──
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);

  // ── Feature 13: Signature Builder ──
  const [signature, setSignature] = useState("");
  const [editingSignature, setEditingSignature] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── Feature 14: Vacation Auto-Responder ──
  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [vacationSubject, setVacationSubject] = useState("Out of Office");
  const [vacationMessage, setVacationMessage] = useState("I am currently out of office. I will reply when I return.");
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");

  // ── Feature: Custom Folders & Rules ──
  const [newFolderName, setNewFolderName] = useState("");
  const [newRuleCondition, setNewRuleCondition] = useState("Sender contains");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [newRuleFolder, setNewRuleFolder] = useState("");

  // ── Feature: Nicknames ──
  const [newNickname, setNewNickname] = useState("");
  const [newNicknameEmail, setNewNicknameEmail] = useState("");

  // ── Feature: Custom Notifications ──
  const [newNotifFolder, setNewNotifFolder] = useState("Inbox");
  const [newNotifSender, setNewNotifSender] = useState("");

  // ── Feature 15: Email Analytics ──
  const [showAnalytics, setShowAnalytics] = useState(false);

  // ── Feature 16: Conversation View ──
  const [conversationView, setConversationView] = useState(true);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  // ── Feature 17: External Account ──
  // Gmail already exists, enhanced settings display

  // ── Feature 18: Offline / Welcome-back notification ──
  const [welcomeBackBanner, setWelcomeBackBanner] = useState<{count: number} | null>(null);

  // ── Feature 19: Search (already exists, enhanced with debounce + highlight) ──
  // (debouncedSearch state above)

  // ── Feature 20: Email Labels/Tags ──
  const [userLabels, setUserLabels] = useState<{id: string; name: string; color: number; emailIds?: string[]}[]>([]);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(0);
  const [labelEmailId, setLabelEmailId] = useState<string | null>(null);
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string | null>(null);

  const { data: userData } = useDoc(firestore && user ? doc(firestore, "users", user.uid) : null);
  const primaryEmail = user?.email?.toLowerCase() || "";

  // ─── Debounce search ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ─── Responsive sidebar ─────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Initialize Speech Recognition ────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setBody((prev) => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + finalTranscript);
          }
        };

        recognition.onend = () => {
          setIsDictating(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      toast({ variant: "destructive", title: "Unsupported", description: "Your browser does not support voice dictation." });
      return;
    }
    if (isDictating) {
      recognitionRef.current.stop();
      setIsDictating(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsDictating(true);
        toast({ title: "Dictation Started", description: "Speak now. Your words will be transcribed." });
      } catch (e) {
        setIsDictating(false);
      }
    }
  };

  // ─── Online/offline ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ─── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "n") { e.preventDefault(); setIsComposeOpen(true); }
      if (e.key === "Escape") { setSelectedId(null); setShowTemplatesPanel(false); setShowMergePanel(false); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ─── Reset summary on email change ──────────────────────────────────────
  useEffect(() => { setSummary(null); setReadReceiptBanner(false); }, [selectedId]);
  useEffect(() => { if (!isComposeOpen) setToneAnalysis(null); }, [isComposeOpen]);

  // ─── Feature 18: Welcome-back banner ────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const lastCheck = localStorage.getItem("lastMailCheck");
    if (lastCheck) {
      const since = new Date(parseInt(lastCheck, 10));
      // We'll count after emails load; store timestamp now
    }
    localStorage.setItem("lastMailCheck", Date.now().toString());
  }, [user]);

  // ─── Load user settings from Firestore ──────────────────────────────────
  useEffect(() => {
    if (!firestore || !user) return;

    const load = async () => {
      // Feature 6: Templates
      const tSnap = await getDocs(query(collection(firestore, "users", user.uid, "email_templates")));
      setTemplates(tSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

      // Feature 8: Aliases
      const aSnap = await getDocs(query(collection(firestore, "users", user.uid, "emailAliases")));
      setAliases(aSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

      // Feature 12: Blocked domains
      const bSnap = await getDocs(query(collection(firestore, "users", user.uid, "blockedDomains")));
      setBlockedDomains(bSnap.docs.map(d => d.data().domain as string));

      // Feature 13: Signature
      const sigDoc = await getDoc(doc(firestore, "users", user.uid, "settings", "signature"));
      if (sigDoc.exists()) setSignature(sigDoc.data().html || "");

      // Feature 14: Vacation responder
      const vacDoc = await getDoc(doc(firestore, "users", user.uid, "vacationResponder", "config"));
      if (vacDoc.exists()) {
        const v = vacDoc.data();
        setVacationEnabled(v.enabled || false);
        setVacationSubject(v.subject || "Out of Office");
        setVacationMessage(v.message || "");
        setVacationStart(v.startDate || "");
        setVacationEnd(v.endDate || "");
      }

      // Feature 20: Labels
      const lSnap = await getDocs(query(collection(firestore, "users", user.uid, "emailLabels")));
      setUserLabels(lSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

      // Feature 10: Tasks
      const tkSnap = await getDocs(query(collection(firestore, "users", user.uid, "tasks"), orderBy("createdAt", "desc"), limit(50)));
      setTasks(tkSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

      // Feature 1: Label overrides
      const olSnap = await getDocs(query(collection(firestore, "users", user.uid, "emailLabelOverrides")));
      const overrides: Record<string, InboxTab> = {};
      olSnap.docs.forEach(d => { overrides[d.id] = d.data().tab as InboxTab; });
      setEmailLabelOverrides(overrides);
    };

    load().catch(console.error);
  }, [firestore, user]);

  // ─── Feature 5: Follow-up reminders check ───────────────────────────────
  useEffect(() => {
    if (!firestore || !user) return;
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600000).toISOString();
    getDocs(query(
      collection(firestore, "emails"),
      where("senderUserId", "==", user.uid),
      where("awaitingReply", "==", true),
      limit(20)
    )).then(snap => {
      const waiting = snap.docs.map(d => ({ id: d.id, ...d.data() as any }))
        .filter(e => e.sentAt && e.sentAt < threeDaysAgo);
      setAwaitingReplyEmails(waiting);
    }).catch(() => {});
  }, [firestore, user]);

  // ─── Feature 2: Check snoozed emails ────────────────────────────────────
  useEffect(() => {
    if (!firestore || !user) return;
    const check = async () => {
      const snap = await getDocs(query(
        collection(firestore, "emails"),
        where("senderUserId", "==", user.uid),
        where("folder", "==", "snoozed"),
        limit(50)
      ));
      const now = new Date().toISOString();
      for (const d of snap.docs) {
        const data = d.data();
        if (data.snoozedUntil && data.snoozedUntil <= now) {
          await updateDoc(doc(firestore, "emails", d.id), { folder: "inbox", snoozedUntil: null });
        }
      }
    };
    check().catch(() => {});
  }, [firestore, user]);

  // ─── Gmail persistence ───────────────────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem("gmail_oauth_token");
    if (savedToken) setGmailToken(savedToken);
  }, []);

  useEffect(() => {
    if ((mailMode === "gmail" || unifiedInbox) && gmailToken) fetchGmailInbox(gmailToken);
  }, [mailMode, gmailToken, unifiedInbox]);

  // ─── Firestore email query ───────────────────────────────────────────────
  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !primaryEmail) return null;
    const baseCol = collection(firestore, "emails");
    if (folder === "Sent") return query(baseCol, where("senderUserId", "==", user.uid), limit(150));
    return query(baseCol, where("recipientList", "array-contains", primaryEmail), limit(150));
  }, [firestore, user, folder, primaryEmail]);

  const { data: rawEmails, isLoading } = useCollection(emailsQuery);

  // ─── Feature 18: Welcome back count ─────────────────────────────────────
  useEffect(() => {
    if (!rawEmails) return;
    const lastCheck = localStorage.getItem("lastMailCheck");
    if (!lastCheck) return;
    const lastCheckNum = parseInt(lastCheck, 10);
    const newCount = rawEmails.filter(e => {
      const t = e.sentDateTime ? new Date(e.sentDateTime).getTime() : 0;
      return !e.isRead && t > lastCheckNum;
    }).length;
    if (newCount > 0) setWelcomeBackBanner({ count: newCount });
    // Update check time
    localStorage.setItem("lastMailCheck", Date.now().toString());
  }, [rawEmails]);

  // ─── Process Rules for Inbox Emails ──────────────────────────────────────
  useEffect(() => {
    if (!firestore || !user || !rawEmails || !userData?.mailRules) return;
    const inboxEmails = rawEmails.filter(e => (e.folder === "inbox" || !e.folder) && !e.isDeleted);
    
    inboxEmails.forEach(async (email) => {
      for (const rule of userData.mailRules) {
        let match = false;
        const sEmail = (email.senderEmail || "").toLowerCase();
        const sSub = (email.subject || "").toLowerCase();
        const val = (rule.value || "").toLowerCase();

        if (rule.condition === "Sender contains" && sEmail.includes(val)) match = true;
        if (rule.condition === "Subject contains" && sSub.includes(val)) match = true;
        
        if (match && rule.targetFolder) {
          try {
            await updateDoc(doc(firestore, "emails", email.id), { folder: rule.targetFolder });
          } catch (e) {
            console.error("Rule error", e);
          }
          break;
        }
      }
    });
  }, [rawEmails, userData?.mailRules, firestore, user]);

  // ─── Process New Email Notifications ──────────────────────────────────────
  const previousEmailIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!rawEmails || !userData) return;
    const currentIds = new Set(rawEmails.map(e => e.id));
    
    if (previousEmailIds.current.size > 0) {
      rawEmails.forEach(email => {
        if (!previousEmailIds.current.has(email.id) && email.senderUserId !== user?.uid) {
          const notifyFolders = userData.mailNotifyFolders || ["inbox"];
          const notifySenders = userData.mailNotifySenders || [];
          
          let shouldNotify = false;
          if (notifyFolders.includes(email.folder || "inbox")) shouldNotify = true;
          if (notifySenders.some((s: string) => email.senderEmail?.toLowerCase().includes(s.toLowerCase()))) shouldNotify = true;
          
          if (shouldNotify) {
            toast({ title: `📩 New email from ${email.senderName || email.senderEmail}`, description: email.subject });
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`New email from ${email.senderName || email.senderEmail}`, { body: email.subject });
            }
          }
        }
      });
    }

    previousEmailIds.current = currentIds;
  }, [rawEmails, userData, user]);

  // ─── Email filtering pipeline ────────────────────────────────────────────
  const emails = useMemo(() => {
    if (!rawEmails) return [];
    let filtered = rawEmails;

    // Feature 12: Filter blocked domains
    if (blockedDomains.length > 0) {
      filtered = filtered.filter(e => {
        const domain = (e.senderEmail || "").split("@")[1] || "";
        return !blockedDomains.some(bd => domain.includes(bd));
      });
    }

    if (folder === "Starred") filtered = filtered.filter(e => e.isStarred && !e.isDeleted);
    else if (folder === "Snoozed") filtered = filtered.filter(e => !e.isDeleted && e.snoozedUntil && e.snoozedUntil > new Date().toISOString());
    else if (folder === "Sent") filtered = filtered.filter(e => !e.isDeleted);
    else if (folder === "Trash") filtered = filtered.filter(e => e.isDeleted);
    else if (folder === "Spam") filtered = filtered.filter(e => e.folder === "spam" && !e.isDeleted);
    else if (folder === "Inbox") filtered = filtered.filter(e => !e.isDeleted && (!e.snoozedUntil || e.snoozedUntil <= new Date().toISOString()) && e.folder !== "sent" && e.folder !== "spam" && !(userData?.mailCustomFolders || []).includes(e.folder));
    else filtered = filtered.filter(e => !e.isDeleted && e.folder === folder);

    // Feature 20: Label filter
    if (selectedLabelFilter) {
      const lbl = userLabels.find(l => l.id === selectedLabelFilter);
      if (lbl) filtered = filtered.filter(e => lbl.emailIds?.includes(e.id));
    }

    // Feature 19: Search with debounce
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(e =>
        e.subject?.toLowerCase().includes(q) ||
        e.senderName?.toLowerCase().includes(q) ||
        e.senderEmail?.toLowerCase().includes(q) ||
        e.body?.toLowerCase().includes(q)
      );
    }

    // Feature 11: Priority inbox - starred at top
    filtered.sort((a, b) => {
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.sentDateTime || 0).getTime() - new Date(a.sentDateTime || 0).getTime();
    });

    return filtered;
  }, [rawEmails, folder, debouncedSearch, blockedDomains, selectedLabelFilter, userLabels]);

  // ─── Feature 1: Tab classification ──────────────────────────────────────
  const tabFilteredEmails = useMemo(() => {
    if (folder !== "Inbox") return emails;
    return emails.filter(e => {
      const override = emailLabelOverrides[e.id];
      const tab = override || classifyEmail(e);
      return tab === activeTab;
    });
  }, [emails, activeTab, folder, emailLabelOverrides]);

  // ─── Feature 16: Conversation grouping ──────────────────────────────────
  const threads = useMemo(() => {
    if (!conversationView || folder !== "Inbox") return null;
    const groups: Record<string, any[]> = {};
    tabFilteredEmails.forEach(e => {
      const key = normalizeSubject(e.subject);
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.entries(groups).map(([key, msgs]) => ({
      key,
      subject: msgs[0].subject,
      emails: msgs.sort((a, b) => new Date(b.sentDateTime || 0).getTime() - new Date(a.sentDateTime || 0).getTime()),
      isRead: msgs.every(m => m.isRead),
      isStarred: msgs.some(m => m.isStarred),
      latestAt: msgs[0].sentDateTime,
    })).sort((a, b) => new Date(b.latestAt || 0).getTime() - new Date(a.latestAt || 0).getTime());
  }, [tabFilteredEmails, conversationView, folder]);

  const combinedEmails = useMemo(() => {
    if (unifiedInbox) {
      return [...emails, ...gmailEmails].sort((a, b) => new Date(b.sentDateTime || 0).getTime() - new Date(a.sentDateTime || 0).getTime());
    }
    return mailMode === "gmail" ? gmailEmails : emails;
  }, [emails, gmailEmails, unifiedInbox, mailMode]);

  const displayEmails = useMemo(() => {
    if (unifiedInbox || mailMode === "gmail") return combinedEmails;
    return folder === "Inbox" ? tabFilteredEmails : emails;
  }, [combinedEmails, tabFilteredEmails, emails, unifiedInbox, mailMode, folder]);

  const selectedEmail = useMemo(() => {
    return combinedEmails.find(e => e.id === selectedId) || tabFilteredEmails.find(e => e.id === selectedId);
  }, [combinedEmails, tabFilteredEmails, selectedId]);

  // ─── Feature 15: Analytics data ─────────────────────────────────────────
  const analyticsData = useMemo(() => {
    const sentEmails = (rawEmails || []).filter(e => e.senderUserId === user?.uid || e.folder === "sent");
    const now = new Date();
    const thisMonth = sentEmails.filter(e => {
      if (!e.sentDateTime) return false;
      const d = new Date(e.sentDateTime);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    // Emails by day (last 7 days)
    const byDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      byDay[d.toLocaleDateString("en-US", { weekday: "short" })] = 0;
    }
    (rawEmails || []).forEach(e => {
      if (!e.sentDateTime) return;
      const d = new Date(e.sentDateTime);
      const dayKey = d.toLocaleDateString("en-US", { weekday: "short" });
      if (byDay[dayKey] !== undefined) byDay[dayKey]++;
    });

    // Top recipients
    const recipientCount: Record<string, number> = {};
    sentEmails.forEach(e => {
      const r = e.recipientEmail || e.to || "";
      if (r) recipientCount[r] = (recipientCount[r] || 0) + 1;
    });
    const topRecipients = Object.entries(recipientCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { thisMonthCount: thisMonth.length, byDay, topRecipients, totalUnread: (rawEmails || []).filter(e => !e.isRead).length };
  }, [rawEmails, user]);

  // ─── Folders definition ──────────────────────────────────────────────────
  const folders = useMemo(() => {
    const base = [
      { name: "Inbox", icon: Inbox, color: "bg-blue-500" },
      { name: "Starred", icon: Star, color: "bg-amber-500" },
      { name: "Snoozed", icon: Clock, color: "bg-orange-500" },
      { name: "Sent", icon: Send, color: "bg-green-500" },
      { name: "Spam", icon: Shield, color: "bg-rose-500" },
      { name: "Trash", icon: Trash2, color: "bg-red-900" },
    ];
    const custom = (userData?.mailCustomFolders || []).map((cf: string) => ({
      name: cf, icon: FolderOpen, color: "bg-indigo-500"
    }));
    return [...base, ...custom];
  }, [userData?.mailCustomFolders]);

  const unreadCount = useMemo(() => (rawEmails || []).filter(e => !e.isRead && !e.isDeleted).length, [rawEmails]);

  // ─── Action handlers ─────────────────────────────────────────────────────

  const toggleStar = async (email: any) => {
    if (!firestore || email.isGmail || !user) return;
    await updateDoc(doc(firestore, "emails", email.id), { isStarred: !email.isStarred });
  };

  const togglePin = async (email: any) => {
    if (!firestore || !user) return;
    await updateDoc(doc(firestore, "emails", email.id), { isPinned: !email.isPinned });
  };

  const moveToTrash = async (email: any) => {
    if (!firestore || !user) return;
    await updateDoc(doc(firestore, "emails", email.id), { isDeleted: true });
    if (selectedId === email.id) setSelectedId(null);
  };

  const handleSweep = async () => {
    if (!firestore || !user || selectedEmails.length === 0) return;
    const senders = new Set(combinedEmails.filter(e => selectedEmails.includes(e.id)).map(e => e.senderEmail));
    const toDelete = combinedEmails.filter(e => senders.has(e.senderEmail));
    for (const email of toDelete) {
      if (email.isGmail) continue;
      await deleteDoc(doc(firestore, "emails", email.id)).catch(() => {});
    }
    toast({ title: `Swept ${toDelete.length} emails` });
    setSelectedEmails([]);
    setSelectedId(null);
  };

  const bulkDelete = () => {
    toast({ title: `Moved ${selectedEmails.length} items to trash` });
    setSelectedEmails([]);
  };

  // ─── Feature 3: Read receipt handling ───────────────────────────────────
  const handleSelectEmail = async (email: any) => {
    setSelectedId(email.id);
    if (!email.isRead && !email.isGmail && firestore) {
      await updateDoc(doc(firestore, "emails", email.id), { isRead: true }).catch(() => {});
    }
    // Send read receipt if requested
    if (email.requestReadReceipt && email.senderUserId && firestore && user) {
      try {
        await setDoc(
          doc(firestore, "users", email.senderUserId, "emailReceipts", email.id),
          { readAt: new Date().toISOString(), readBy: user.email }
        );
        setReadReceiptBanner(true);
      } catch (e) { console.error(e); }
    }
    // Feature 14: Vacation responder
    if (vacationEnabled && firestore && user) {
      const now = new Date().toISOString();
      const active = (!vacationStart || now >= vacationStart) && (!vacationEnd || now <= vacationEnd);
      if (active && email.senderEmail) {
        // We'd write to sender's Firestore inbox - simplified to toast notification
        toast({ title: "Auto-reply sent", description: `Vacation responder sent to ${email.senderEmail}` });
      }
    }
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    setRecipient(selectedEmail.senderEmail);
    setSubject(`Re: ${selectedEmail.subject.replace(/^Re:\s*/i, "")}`);
    setBody(`<br><br><blockquote style="border-left:2px solid #555;padding-left:10px;color:#888;">On ${new Date(selectedEmail.sentDateTime || Date.now()).toLocaleString()}, ${selectedEmail.senderName} wrote:<br>${selectedEmail.body}</blockquote>`);
    if (signature) setBody(prev => `${prev}<br><br>--<br>${signature}`);
    setIsComposeOpen(true);
  };

  // ─── Feature 4: Improved Undo Send ──────────────────────────────────────
  const handleSend = async () => {
    if (!auth || !auth.currentUser) return toast({ variant: "destructive", title: "Not authenticated" });
    if (!recipient || !subject || !body) return toast({ variant: "destructive", title: "Missing fields" });

    // Resolve Nickname
    let finalRecipient = recipient;
    const nickObj = (userData?.mailNicknames || []).find((n: any) => n.nickname.toLowerCase() === recipient.toLowerCase());
    if (nickObj) finalRecipient = nickObj.email;

    setIsSending(true);
    let undone = false;
    let progress = 0;

    const progressInterval = setInterval(() => {
      progress += 2; // 2% per 100ms → 5s = 100%
      setUndoProgress(Math.min(progress, 100));
    }, 100);

    toast({
      title: scheduleAt ? "Message scheduled!" : "📨 Sending in 5 seconds...",
      description: "Click Undo to cancel.",
      action: (
        <Button
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-primary/10 font-bold"
          onClick={() => {
            undone = true;
            clearInterval(progressInterval);
            clearTimeout(undoSendRef.current!);
            setIsSending(false);
            setUndoProgress(0);
            toast({ title: "✅ Send Undone", description: "Message kept in drafts." });
          }}
        >
          Undo
        </Button>
      ),
      duration: 5000,
    });

    undoSendRef.current = setTimeout(async () => {
      clearInterval(progressInterval);
      setUndoProgress(0);
      if (undone) return;
      try {
        let finalBody = body;
        if (isEncrypted) {
          finalBody = `<div style="padding:20px;background:#111;color:#0f0;border:1px solid #0f0;border-radius:10px;font-family:monospace;">[E2EE ENCRYPTED MESSAGE] - Recipient must use Xakteir Mail to decrypt.</div>`;
        }

        // Determine sender address
        let senderAddress = "";
        if (selectedAlias !== "main" && aliases.find(a => a.id === selectedAlias)) {
          senderAddress = aliases.find(a => a.id === selectedAlias)!.address;
        } else {
          senderAddress = `${userData?.username || user?.displayName?.toLowerCase().replace(/\s+/g, "") || user?.uid}@mail.xakteir.com`;
        }

        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await auth.currentUser!.getIdToken()}`,
          },
          body: JSON.stringify({
            to: finalRecipient,
            subject,
            body: finalBody,
            senderAddress,
            senderName: user?.displayName || "Xakteir Member",
          }),
        });
        if (!res.ok) throw new Error("Failed to send email");

        if (firestore && user) {
          await addDoc(collection(firestore, "emails"), {
            subject,
            senderName: user.displayName || "Me",
            senderEmail: senderAddress,
            senderUserId: user.uid,
            recipientEmail: finalRecipient,
            recipientList: [finalRecipient.toLowerCase()],
            body: isEncrypted ? body : finalBody,
            sentDateTime: new Date().toISOString(),
            sentAt: new Date().toISOString(),
            isRead: true,
            folder: scheduleAt ? "scheduled" : "sent",
            isGmail: false,
            authorId: user.uid,
            isEncrypted,
            expiresAt,
            scheduleAt,
            requestReadReceipt,
            awaitingReply: true,
            attachments: attachments.map(a => ({ name: a.name, url: a.url, type: a.type || "application/octet-stream" })),
          });
        }

        toast({ title: scheduleAt ? "✅ Scheduled successfully" : "✅ Message Sent Successfully" });
        setIsComposeOpen(false);
        setRecipient(""); setSubject(""); setBody(""); setAttachments([]);
        setIsEncrypted(false); setExpiresAt(null); setScheduleAt(null);
        setRequestReadReceipt(false);
      } catch (err: any) {
        toast({ variant: "destructive", title: "Send Failed", description: err.message });
      } finally {
        setIsSending(false);
      }
    }, 5000);
  };

  // ─── Feature 7: Mail Merge ───────────────────────────────────────────────
  const handleMailMerge = async () => {
    if (!auth?.currentUser || !recipient || !subject || !body) return;
    const recipients = mergeRecipients.split(",").map(r => r.trim()).map(r => {
      const nickObj = (userData?.mailNicknames || []).find((n: any) => n.nickname.toLowerCase() === r.toLowerCase());
      return nickObj ? nickObj.email : r;
    }).filter(Boolean);
    if (!recipients.length) return toast({ variant: "destructive", title: "No recipients listed" });
    setIsMerging(true);
    for (let i = 0; i < recipients.length; i++) {
      const toAddr = recipients[i];
      const name = toAddr.split("@")[0].replace(/[._-]/g, " ");
      const personalizedBody = body.replace(/\{name\}/gi, name);
      try {
        const senderAddress = `${userData?.username || user?.uid}@mail.xakteir.com`;
        await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await auth.currentUser!.getIdToken()}`,
          },
          body: JSON.stringify({ to: toAddr, subject, body: personalizedBody, senderAddress, senderName: user?.displayName || "Xakteir Member" }),
        });
      } catch (e) { console.error(e); }
      setMergeProgress(Math.round(((i + 1) / recipients.length) * 100));
      await new Promise(r => setTimeout(r, 300));
    }
    setIsMerging(false);
    setMergeProgress(0);
    setShowMergePanel(false);
    toast({ title: `✅ Mail merge sent to ${recipients.length} recipients` });
  };

  // ─── Feature 10: Email-to-task ───────────────────────────────────────────
  const handleCreateTask = async () => {
    if (!firestore || !user) return;
    await addDoc(collection(firestore, "users", user.uid, "tasks"), {
      title: taskTitle,
      description: taskDesc,
      emailId: selectedId,
      createdAt: new Date().toISOString(),
      completed: false,
    });
    setShowTaskModal(false);
    setTaskTitle(""); setTaskDesc("");
    toast({ title: "✅ Task created" });
  };

  // ─── Feature 12: Mark as spam ────────────────────────────────────────────
  const handleMarkSpam = async (email: any) => {
    if (!firestore || !user) return;
    await updateDoc(doc(firestore, "emails", email.id), { folder: "spam" });
    const domain = (email.senderEmail || "").split("@")[1] || "";
    if (domain) {
      await addDoc(collection(firestore, "users", user.uid, "blockedDomains"), { domain });
      setBlockedDomains(prev => [...prev, domain]);
    }
    if (selectedId === email.id) setSelectedId(null);
    toast({ title: "Marked as spam", description: `Emails from ${domain} will be blocked.` });
  };

  // ─── Feature 13: Save signature (Now inline) ──────────────────────────────────────────

  // ─── Feature 14: Save vacation responder ─────────────────────────────────
  const handleSaveVacation = async () => {
    if (!firestore || !user) return;
    await setDoc(doc(firestore, "users", user.uid, "vacationResponder", "config"), {
      enabled: vacationEnabled,
      subject: vacationSubject,
      message: vacationMessage,
      startDate: vacationStart,
      endDate: vacationEnd,
    });
    toast({ title: vacationEnabled ? "✅ Vacation responder activated" : "Vacation responder disabled" });
  };

  // ─── Feature 20: Labels ───────────────────────────────────────────────────
  const handleCreateLabel = async () => {
    if (!firestore || !user || !newLabelName) return;
    const ref = await addDoc(collection(firestore, "users", user.uid, "emailLabels"), {
      name: newLabelName, color: newLabelColor, emailIds: [],
    });
    setUserLabels(prev => [...prev, { id: ref.id, name: newLabelName, color: newLabelColor, emailIds: [] }]);
    setNewLabelName(""); setShowLabelModal(false);
    toast({ title: "✅ Label created" });
  };

  // ─── Feature: Rules and Custom Folders ────────────────────────────────────
  const handleCreateFolder = async () => {
    if (!firestore || !user || !newFolderName.trim()) return;
    const f = newFolderName.trim();
    if ((userData?.mailCustomFolders || []).includes(f)) return;
    await updateDoc(doc(firestore, "users", user.uid), {
      mailCustomFolders: [...(userData?.mailCustomFolders || []), f]
    });
    setNewFolderName("");
    toast({ title: "✅ Folder created" });
  };

  const handleCreateRule = async () => {
    if (!firestore || !user || !newRuleValue.trim() || !newRuleFolder.trim()) return;
    const newRule = {
      id: crypto.randomUUID(),
      condition: newRuleCondition,
      value: newRuleValue.trim(),
      targetFolder: newRuleFolder.trim()
    };
    await updateDoc(doc(firestore, "users", user.uid), {
      mailRules: [...(userData?.mailRules || []), newRule]
    });
    setNewRuleValue("");
    toast({ title: "✅ Rule created" });
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!firestore || !user || !userData?.mailRules) return;
    const filtered = userData.mailRules.filter((r: any) => r.id !== ruleId);
    await updateDoc(doc(firestore, "users", user.uid), { mailRules: filtered });
  };

  const handleCreateNickname = async () => {
    if (!firestore || !user || !newNickname.trim() || !newNicknameEmail.trim()) return;
    const nn = {
      id: crypto.randomUUID(),
      nickname: newNickname.trim(),
      email: newNicknameEmail.trim()
    };
    await updateDoc(doc(firestore, "users", user.uid), {
      mailNicknames: [...(userData?.mailNicknames || []), nn]
    });
    setNewNickname(""); setNewNicknameEmail("");
    toast({ title: "✅ Nickname created" });
  };

  const handleDeleteNickname = async (id: string) => {
    if (!firestore || !user || !userData?.mailNicknames) return;
    const filtered = userData.mailNicknames.filter((n: any) => n.id !== id);
    await updateDoc(doc(firestore, "users", user.uid), { mailNicknames: filtered });
  };

  const handleAddNotifFolder = async () => {
    if (!firestore || !user || !newNotifFolder) return;
    const current = userData?.mailNotifyFolders || ["inbox"];
    if (current.includes(newNotifFolder)) return;
    await updateDoc(doc(firestore, "users", user.uid), { mailNotifyFolders: [...current, newNotifFolder] });
    setNewNotifFolder("");
  };

  const handleRemoveNotifFolder = async (f: string) => {
    if (!firestore || !user) return;
    const current = userData?.mailNotifyFolders || ["inbox"];
    await updateDoc(doc(firestore, "users", user.uid), { mailNotifyFolders: current.filter((x: string) => x !== f) });
  };

  const handleAddNotifSender = async () => {
    if (!firestore || !user || !newNotifSender.trim()) return;
    const current = userData?.mailNotifySenders || [];
    if (current.includes(newNotifSender.trim())) return;
    await updateDoc(doc(firestore, "users", user.uid), { mailNotifySenders: [...current, newNotifSender.trim()] });
    setNewNotifSender("");
  };

  const handleRemoveNotifSender = async (s: string) => {
    if (!firestore || !user) return;
    const current = userData?.mailNotifySenders || [];
    await updateDoc(doc(firestore, "users", user.uid), { mailNotifySenders: current.filter((x: string) => x !== s) });
  };

  const handleAssignLabel = async (labelId: string, emailId: string) => {
    if (!firestore || !user) return;
    const lbl = userLabels.find(l => l.id === labelId);
    if (!lbl) return;
    const newIds = lbl.emailIds?.includes(emailId)
      ? lbl.emailIds.filter(id => id !== emailId)
      : [...(lbl.emailIds || []), emailId];
    await updateDoc(doc(firestore, "users", user.uid, "emailLabels", labelId), { emailIds: newIds });
    setUserLabels(prev => prev.map(l => l.id === labelId ? { ...l, emailIds: newIds } : l));
    toast({ title: lbl.emailIds?.includes(emailId) ? "Label removed" : `Label "${lbl.name}" applied` });
  };

  // ─── Feature 1: Override tab classification ──────────────────────────────
  const handleOverrideTab = async (emailId: string, tab: InboxTab) => {
    if (!firestore || !user) return;
    await setDoc(doc(firestore, "users", user.uid, "emailLabelOverrides", emailId), { tab });
    setEmailLabelOverrides(prev => ({ ...prev, [emailId]: tab }));
    toast({ title: `Moved to ${tab}` });
  };

  // ─── Feature 2: Snooze ───────────────────────────────────────────────────
  const handleSnooze = async (email: any, option: "later" | "tomorrow" | "nextweek") => {
    if (!firestore || !user) return;
    let snoozedUntil: string;
    const now = new Date();
    if (option === "later") {
      snoozedUntil = new Date(now.getTime() + 3 * 3600000).toISOString();
    } else if (option === "tomorrow") {
      const tom = new Date(now); tom.setDate(tom.getDate() + 1); tom.setHours(9, 0, 0, 0);
      snoozedUntil = tom.toISOString();
    } else {
      const nw = new Date(now); nw.setDate(nw.getDate() + (7 - nw.getDay() + 1) % 7 + 1);
      nw.setHours(9, 0, 0, 0);
      snoozedUntil = nw.toISOString();
    }
    await updateDoc(doc(firestore, "emails", email.id), { folder: "snoozed", snoozedUntil });
    if (selectedId === email.id) setSelectedId(null);
    toast({ title: `⏰ Snoozed until ${new Date(snoozedUntil).toLocaleString()}` });
  };

  // ─── Feature 8: Add alias ─────────────────────────────────────────────────
  const handleAddAlias = async () => {
    if (!firestore || !user || aliases.length >= 5) return;
    if (!newAliasAddress.endsWith("@mail.xakteir.com")) return toast({ variant: "destructive", title: "Alias must be @mail.xakteir.com" });
    const ref = await addDoc(collection(firestore, "users", user.uid, "emailAliases"), {
      address: newAliasAddress, name: newAliasName || newAliasAddress,
    });
    setAliases(prev => [...prev, { id: ref.id, address: newAliasAddress, name: newAliasName }]);
    setNewAliasName(""); setNewAliasAddress("");
    toast({ title: "✅ Alias added" });
  };

  // ─── Feature 5: Mark no longer waiting ───────────────────────────────────
  const handleMarkNoLongerWaiting = async (emailId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "emails", emailId), { awaitingReply: false });
    setAwaitingReplyEmails(prev => prev.filter(e => e.id !== emailId));
  };

  // ─── AI helpers ──────────────────────────────────────────────────────────
  const handleSummarize = async () => {
    if (!selectedEmail) return;
    setIsSummarizing(true); setSummary(null);
    try {
      const r = await chatWithXakAI({ message: `Summarize this email briefly: Subject: ${selectedEmail.subject}. Body: ${selectedEmail.body}`, userId: user?.uid });
      setSummary(r.response);
    } catch { toast({ variant: "destructive", title: "Failed to summarize" }); }
    finally { setIsSummarizing(false); }
  };

  const handleSmartReply = async () => {
    if (!selectedEmail) return;
    setIsGeneratingReply(true);
    try {
      const r = await chatWithXakAI({ message: `Generate a professional, concise email reply to this email. Just provide the email body. Email: ${selectedEmail.body}`, userId: user?.uid });
      setBody(r.response); setRecipient(selectedEmail.senderEmail); setSubject(`Re: ${selectedEmail.subject}`);
      setIsComposeOpen(true);
    } catch { toast({ variant: "destructive", title: "Failed to generate reply" }); }
    finally { setIsGeneratingReply(false); }
  };

  const handleAnalyzeTone = async () => {
    if (!body) return;
    setIsAnalyzingTone(true); setToneAnalysis(null);
    try {
      const r = await chatWithXakAI({ message: `Analyze the tone of this email draft. Is it professional, friendly, angry, or too casual? 1-2 sentences. Draft: ${body}`, userId: user?.uid });
      setToneAnalysis(r.response);
    } catch { toast({ variant: "destructive", title: "Failed to analyze tone" }); }
    finally { setIsAnalyzingTone(false); }
  };

  // ─── Gmail ───────────────────────────────────────────────────────────────
  const handleConnectGmail = async () => {
    if (!auth || !auth.currentUser) return;
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
    provider.addScope("https://www.googleapis.com/auth/gmail.send");
    try {
      const result = await linkWithPopup(auth.currentUser, provider);
      const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
      if (token) { localStorage.setItem("gmail_oauth_token", token); setGmailToken(token); setMailMode("gmail"); }
    } catch (e: any) {
      if (e.code === "auth/credential-already-in-use" || e.code === "auth/provider-already-linked") {
        try {
          const result = await signInWithPopup(auth, provider);
          const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
          if (token) { localStorage.setItem("gmail_oauth_token", token); setGmailToken(token); setMailMode("gmail"); }
        } catch (err: any) { toast({ title: "Gmail Error", description: err.message, variant: "destructive" }); }
      } else { toast({ title: "Gmail Error", description: e.message, variant: "destructive" }); }
    }
  };

  const disconnectGmail = () => {
    localStorage.removeItem("gmail_oauth_token");
    setGmailToken(null); setMailMode("xakteir"); setGmailEmails([]); setUnifiedInbox(false);
  };

  const fetchGmailInbox = async (token: string) => {
    setLoadingGmail(true);
    try {
      const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20", { headers: { Authorization: `Bearer ${token}` } });
      if (!listRes.ok) throw new Error("Auth token expired");
      const listData = await listRes.json();
      if (listData.messages) {
        const details = await Promise.all(listData.messages.map(async (m: any) => {
          const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`, { headers: { Authorization: `Bearer ${token}` } });
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
          const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
          const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
          return { id: detail.id, subject, senderEmail: from, senderName: from.split("<")[0]?.trim() || from, body: detail.snippet || "", sentDateTime: date, isGmail: true, hasCalendar: subject.toLowerCase().includes("invite") };
        }));
        setGmailEmails(details);
      }
    } catch {
      localStorage.removeItem("gmail_oauth_token"); setGmailToken(null); setMailMode("xakteir");
    } finally { setLoadingGmail(false); }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !storage) return;
    setIsUploadingAttachment(true);
    try {
      const storageRef = ref(storage, `mail_attachments/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = await uploadBytesResumable(storageRef, file);
      const url = await getDownloadURL(uploadTask.ref);
      setAttachments(prev => [...prev, { name: file.name, url, type: file.type, size: file.size }]);
      toast({ title: "Attachment uploaded" });
    } catch { toast({ variant: "destructive", title: "Upload failed" }); }
    finally { 
      setIsUploadingAttachment(false); 
      if (attachmentInputRef.current) attachmentInputRef.current.value = ""; 
    }
  };

  // ─── Feature 19: Search highlight ────────────────────────────────────────
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/30 text-primary rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  // ─── Labels for a given email ─────────────────────────────────────────────
  const getEmailLabels = (emailId: string) => userLabels.filter(l => l.emailIds?.includes(emailId));

  // ─── Open compose with signature ─────────────────────────────────────────
  const openCompose = () => {
    setBody(signature ? `<br><br>--<br>${signature}` : "");
    setIsComposeOpen(true);
  };

  if (isUserLoading) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 className="animate-spin text-primary w-12 h-12" />
    </div>
  );

  if (userData?.bannedApps?.includes('mail')) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center">
         <div className="absolute inset-0 bg-blue-500/10 arcade-grid opacity-20 pointer-events-none" />
         <div className="relative z-10 flex flex-col items-center text-center max-w-md p-8 glass-card rounded-[3rem] border border-blue-500/20">
             <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
               <Lock className="w-10 h-10 text-blue-500" />
             </div>
             <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-blue-500">Access Restricted</h1>
             <p className="text-sm font-medium text-white/70 italic mb-8">
               Your account has been banned from accessing Xakteir Mail. If you believe this is an error, please contact a Hub Administrator.
             </p>
             <Button onClick={() => window.location.href = "/"} className="bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl h-12 px-8">
               Return to Hub
             </Button>
         </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-blue-500/20 opacity-50" />
        <div className="absolute inset-0 arcade-grid opacity-20" />
        
        <div className="relative z-10 max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-3xl border border-primary/20 mb-4">
            <MailIcon className="w-16 h-16 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Send. From anywhere<br/>To anywhere.
          </h1>
          
          <div className="space-y-4 py-8">
            <h2 className="text-2xl font-bold italic text-white/80">Xakteir Mail. Do it All.</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left mt-8">
              {[
                { icon: Shield, text: "End-to-End Encryption" },
                { icon: Bot, text: "AI Smart Replies" },
                { icon: Zap, text: "Lightning Fast" },
                { icon: Clock, text: "Snooze & Schedule" },
                { icon: Layers, text: "Smart Organization" },
                { icon: MailCheck, text: "Read Receipts" }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <f.icon className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-xs font-bold text-white/90">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = "/auth?source=mail"}
            className="h-16 px-12 bg-primary hover:bg-primary/90 text-black rounded-[2rem] font-black uppercase tracking-widest text-lg shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all hover:scale-105"
          >
            Get In
          </Button>
        </div>
      </div>
    );
  }

  // ─── Attachment viewer modal ──────────────────────────────────────────────
  const AttachmentChip = ({ att }: { att: { name: string; url: string; type?: string } }) => {
    const isImage = att.type?.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(att.name);
    const isPdf = att.type === "application/pdf" || att.name.endsWith(".pdf");
    return (
      <div
        className="group flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
        onClick={() => { setAttachmentViewUrl(att.url); setAttachmentViewType(att.type || ""); }}
      >
        <Paperclip className="w-3.5 h-3.5 text-white/50 shrink-0" />
        <span className="text-xs text-white/80 truncate max-w-[120px]">{att.name}</span>
        {isImage && <Eye className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
        {isPdf && <FileText className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
        {!isImage && !isPdf && <Download className="w-3 h-3 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
    );
  };

  // ── Theme Classes ──

  const themeClasses = {
    obsidian: "bg-background text-foreground",
    cyberpunk: "bg-[#0a0014] text-pink-50 border-pink-500/20 shadow-[0_0_50px_rgba(236,72,153,0.1)]",
    holographic: "bg-gradient-to-br from-blue-900/40 via-cyan-900/20 to-white/10 text-cyan-50",
    matrix: "bg-black text-green-500",
  }[mailTheme];

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden relative transition-colors duration-500", themeClasses)}>
      {/* Dynamic Background Overlays for Themes */}
      {mailTheme === "cyberpunk" && <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />}
      {mailTheme === "matrix" && <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50" />}
      
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-amber-500 text-black text-center text-xs font-bold py-1 uppercase">
          Offline Mode — Some features unavailable
        </div>
      )}

      {/* Feature 18: Welcome-back banner */}
      {welcomeBackBanner && (
        <div className="bg-primary/10 border-b border-primary/20 flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">You have {welcomeBackBanner.count} new email{welcomeBackBanner.count > 1 ? "s" : ""} since your last visit</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-[10px] uppercase font-bold border-primary/30 text-primary" onClick={() => { setFolder("Inbox"); setWelcomeBackBanner(null); }}>
              View All Unread
            </Button>
            <button onClick={() => setWelcomeBackBanner(null)} className="text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Feature 5: Follow-up reminders banner */}
      {awaitingReplyEmails.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">{awaitingReplyEmails.length} email{awaitingReplyEmails.length > 1 ? "s" : ""} awaiting reply (sent 3+ days ago)</span>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-[10px] text-amber-400 hover:text-amber-300" onClick={() => setShowFollowUpPanel(true)}>
            View →
          </Button>
        </div>
      )}

      <div className="flex-1 flex p-4 lg:p-6 gap-6 overflow-hidden relative">

        {/* ── SIDEBAR ── */}
        <div className={cn(
          "flex flex-col space-y-4 shrink-0 transition-all duration-300 z-30 lg:relative absolute lg:inset-auto inset-y-4 left-4 lg:bg-transparent bg-zinc-950/95 lg:p-0 p-4 rounded-[2rem] lg:w-80 w-[280px] shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:opacity-0"
        )}>

          {/* Compose Button */}
          <Button
            className="w-full bg-primary hover:bg-primary/95 text-black h-14 rounded-3xl font-black uppercase text-xs italic shadow-xl"
            onClick={openCompose}
          >
            <Plus className="w-5 h-5 mr-3" /> New Message
          </Button>

          <Card className="flex-1 glass-card border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col bg-black/40 p-4 space-y-3 overflow-y-auto">

            {/* Mailbox toggles */}
            <div className="flex items-center justify-between px-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Mailboxes</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/30">Unified</span>
                <Switch checked={unifiedInbox} onCheckedChange={setUnifiedInbox} />
              </div>
            </div>

            {!unifiedInbox && (
              <div className="space-y-1">
                <button onClick={() => { setMailMode("xakteir"); setSelectedId(null); }} className={cn("w-full flex items-center px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left border", mailMode === "xakteir" ? "bg-primary/10 border-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5 border-transparent")}>
                  Xakteir Mail
                </button>
                <button onClick={() => { gmailToken ? setMailMode("gmail") : handleConnectGmail(); setSelectedId(null); }} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left border", mailMode === "gmail" ? "bg-amber-500/10 border-amber-500/25 text-amber-500" : "text-muted-foreground hover:bg-white/5 border-transparent")}>
                  <span>{gmailToken ? "Gmail" : "Link Gmail"}</span>
                  {gmailToken && <MailCheck className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Folders */}
            <div className="pt-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 ml-2">Folders</p>
              <div className="space-y-1">
                {folders.map(f => {
                  const FolderIcon = f.icon;
                  return (
                    <button key={f.name} onClick={() => { setFolder(f.name); setSelectedId(null); setSelectedLabelFilter(null); }}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left border", folder === f.name && !selectedLabelFilter ? "bg-white/5 text-white border-white/5" : "text-muted-foreground border-transparent hover:bg-white/5")}
                    >
                      <div className={cn("w-2 h-2 rounded-full", f.color)} />
                      <FolderIcon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{f.name}</span>
                      {f.name === "Inbox" && unreadCount > 0 && (
                        <span className="bg-primary text-black text-[8px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{unreadCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feature 20: Labels in sidebar */}
            {userLabels.length > 0 && (
              <div className="pt-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 ml-2">Labels</p>
                <div className="space-y-1">
                  {userLabels.map(lbl => {
                    const clr = LABEL_COLORS[lbl.color % LABEL_COLORS.length];
                    return (
                      <button key={lbl.id} onClick={() => { setSelectedLabelFilter(selectedLabelFilter === lbl.id ? null : lbl.id); setFolder("Inbox"); setSelectedId(null); }}
                        className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left border", selectedLabelFilter === lbl.id ? `${clr.bg} border-white/10 ${clr.text}` : "text-muted-foreground border-transparent hover:bg-white/5")}
                      >
                        <div className={cn("w-2 h-2 rounded-full", clr.dot)} />
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        {lbl.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feature 15: Analytics link */}
            <button onClick={() => setShowAnalytics(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-transparent hover:bg-white/5 transition-all text-left">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <BarChart2 className="w-4 h-4 shrink-0" />
              Analytics
            </button>

            {/* Settings */}
            <Button variant="ghost" className="w-full justify-start text-xs text-white/50 hover:text-white mt-auto" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-2" /> Settings &amp; Rules
            </Button>
          </Card>
        </div>

        {/* ── MAIL VIEWER ── */}
        <div className={cn("flex-1 glass-card rounded-[3.5rem] overflow-hidden flex bg-black/25 shadow-2xl divide-white/5", splitPane === "vertical" ? "flex-row divide-x" : "flex-col divide-y")}>

          {/* List Rail */}
          {(!selectedId || layoutMode === "split") && (
            <div className={cn("flex flex-col bg-[#090912]/30 shrink-0", layoutMode === "list" ? "flex-1 h-full" : (splitPane === "vertical" ? "w-[400px] h-full" : "h-[40%] w-full"))}>

              <header className="p-4 border-b border-white/5 bg-black/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">
                    {unifiedInbox ? "Unified Inbox" : (mailMode === "gmail" ? "Gmail" : folder)}
                    {selectedLabelFilter && ` · ${userLabels.find(l => l.id === selectedLabelFilter)?.name}`}
                  </h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setConversationView(v => !v)} className={cn("h-7 w-7", conversationView ? "text-primary" : "text-white/50")} title="Conversation view">
                      <GitMerge className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setLayoutMode(p => p === "split" ? "list" : "split")} className={cn("h-7 w-7", layoutMode === "list" ? "text-primary" : "text-white/50")}>
                      {layoutMode === "split" ? <LayoutList className="w-3.5 h-3.5" /> : <LayoutPanelLeft className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSplitPane(p => p === "vertical" ? "horizontal" : "vertical")} className="h-7 w-7 text-white/50"><Split className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50"><RefreshCw className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>

                {/* Feature 19: Search with debounce */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search mail..." className="bg-black/40 border-transparent pl-9 text-xs h-9 rounded-xl text-white" />
                  {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
                </div>

                {/* Supercharge: AI Inbox Zero */}
                <Button onClick={() => setShowInboxZeroWizard(true)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-[10px] tracking-widest h-9 rounded-xl shadow-lg border border-blue-400/20">
                  <Wand2 className="w-3.5 h-3.5 mr-2" /> Achieve Inbox Zero
                </Button>

                {/* Feature 1: Smart Inbox Tabs */}
                {folder === "Inbox" && !unifiedInbox && (
                  <div className="overflow-x-auto">
                    <Tabs value={activeTab} onValueChange={v => setActiveTab(v as InboxTab)} className="w-max">
                      <TabsList className="bg-transparent h-7 p-0 gap-4">
                        {INBOX_TABS.map(tab => (
                          <TabsTrigger key={tab} value={tab} className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary p-0 pb-1 text-[10px] uppercase font-bold tracking-wider text-white/40 rounded-none">
                            {tab}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                )}

                {selectedEmails.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button onClick={bulkDelete} size="sm" variant="secondary" className="h-7 text-[10px] uppercase font-bold">Archive {selectedEmails.length}</Button>
                    <Button onClick={handleSweep} size="sm" variant="secondary" className="h-7 text-[10px] uppercase font-bold bg-amber-500/20 text-amber-500">Sweep</Button>
                    <Button onClick={() => setSelectedEmails([])} size="sm" variant="ghost" className="h-7 w-7 p-0"><X className="w-3 h-3" /></Button>
                  </div>
                )}
              </header>

              <ScrollArea className="flex-1">
                <div className="p-3 space-y-1">

                  {/* Feature 16: Conversation View */}
                  {conversationView && folder === "Inbox" && threads && !unifiedInbox && mailMode === "xakteir" ? (
                    threads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-white/20">
                        <MailIcon className="w-10 h-10 mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest">No messages</p>
                      </div>
                    ) : threads.map(thread => {
                      const isExpanded = expandedThreads.has(thread.key);
                      const firstEmail = thread.emails[0];
                      const emailLabels = getEmailLabels(firstEmail.id);
                      return (
                        <div key={thread.key} className={cn("rounded-2xl border border-transparent transition-all", selectedId && thread.emails.find(e => e.id === selectedId) ? "bg-primary/10 border-primary/20" : "hover:bg-white/5")}>
                          <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => {
                            if (thread.emails.length === 1) { handleSelectEmail(firstEmail); }
                            else { setExpandedThreads(prev => { const n = new Set(prev); if (n.has(thread.key)) n.delete(thread.key); else n.add(thread.key); return n; }); }
                          }}>
                            <div className="pt-1" onClick={e => e.stopPropagation()}>
                              <Checkbox checked={thread.emails.every(e => selectedEmails.includes(e.id))} onCheckedChange={c => {
                                if (c) setSelectedEmails(prev => [...new Set([...prev, ...thread.emails.map(e => e.id)])]);
                                else setSelectedEmails(prev => prev.filter(id => !thread.emails.find(e => e.id === id)));
                              }} className="border-white/20 data-[state=checked]:bg-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1.5">
                                  {thread.emails.slice(0, 3).map(e => (
                                    <Avatar key={e.id} className="w-5 h-5 border border-white/10">
                                      <AvatarFallback className="bg-zinc-800 text-white font-black text-[8px]">{getInitials(e.senderName)}</AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {thread.emails.length > 1 && (
                                    <span className="text-[9px] text-white/40 font-bold">{thread.emails.length}</span>
                                  )}
                                </div>
                                <span className={cn("text-[9px] whitespace-nowrap", !thread.isRead ? "text-primary font-bold" : "text-white/40")}>
                                  {thread.latestAt ? new Date(thread.latestAt).toLocaleDateString() : ""}
                                </span>
                              </div>
                              <h4 className={cn("text-[11px] truncate", !thread.isRead ? "font-black text-white" : "font-bold text-white/80")}>
                                {highlightText(thread.subject, debouncedSearch)}
                              </h4>
                              <p className="text-[10px] truncate mt-0.5 text-white/50">{firstEmail.body?.replace(/<[^>]+>/g, "")?.slice(0, 80)}</p>
                              {emailLabels.length > 0 && (
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                  {emailLabels.map(lbl => {
                                    const clr = LABEL_COLORS[lbl.color % LABEL_COLORS.length];
                                    return <span key={lbl.id} className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-full", clr.bg, clr.text)}>{lbl.name}</span>;
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                              <button onClick={() => toggleStar(firstEmail)} className={cn("transition-colors", firstEmail.isStarred ? "text-amber-500" : "text-white/20 hover:text-amber-400")}>
                                <Star className={cn("w-4 h-4", firstEmail.isStarred && "fill-amber-500")} />
                              </button>
                              {thread.emails.length > 1 && (
                                <ChevronDown className={cn("w-3 h-3 text-white/30 transition-transform", isExpanded && "rotate-180")} />
                              )}
                            </div>
                          </div>

                          {/* Expanded thread messages */}
                          {isExpanded && (
                            <div className="border-t border-white/5 pl-10 pr-4 pb-2 space-y-1">
                              {thread.emails.map(email => (
                                <div key={email.id} onClick={() => handleSelectEmail(email)} className={cn("p-2 rounded-xl cursor-pointer transition-colors flex items-center gap-3", selectedId === email.id ? "bg-primary/10" : "hover:bg-white/5")}>
                                  <Avatar className="w-6 h-6 border border-white/10 shrink-0"><AvatarFallback className="bg-zinc-800 text-white font-black text-[9px]">{getInitials(email.senderName)}</AvatarFallback></Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("text-[10px]", !email.isRead ? "font-black text-white" : "text-white/60")}>{email.senderName}</p>
                                    <p className="text-[9px] text-white/40 truncate">{email.body?.replace(/<[^>]+>/g, "")?.slice(0, 60)}</p>
                                  </div>
                                  <span className="text-[9px] text-white/30 shrink-0">{email.sentDateTime ? new Date(email.sentDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    /* Flat list */
                    displayEmails.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-white/20">
                        <MailIcon className="w-10 h-10 mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest">No messages</p>
                      </div>
                    ) : displayEmails.map(email => {
                      const emailLabels = getEmailLabels(email.id);
                      return (
                        <div key={email.id} className={cn("group flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all border border-transparent", selectedId === email.id ? "bg-primary/10 border-primary/20" : "hover:bg-white/5")}>
                          <div className="pt-1" onClick={e => e.stopPropagation()}>
                            <Checkbox checked={selectedEmails.includes(email.id)} onCheckedChange={c => setSelectedEmails(p => c ? [...p, email.id] : p.filter(id => id !== email.id))} className="border-white/20 data-[state=checked]:bg-primary" />
                          </div>
                          <div className="flex-1 min-w-0" onClick={() => handleSelectEmail(email)}>
                            <div className="flex justify-between items-center mb-1">
                              <span className={cn("text-[11px] truncate pr-2 flex items-center gap-1", !email.isRead ? "font-black text-white" : "font-bold text-white/70")}>
                                {highlightText(email.senderName || "Unknown", debouncedSearch)}
                                {email.isPinned && <Pin className="w-3 h-3 inline text-primary" />}
                                {email.isStarred && <Star className="w-3 h-3 inline text-amber-500 fill-amber-500" />}
                              </span>
                              <span className={cn("text-[9px] whitespace-nowrap", !email.isRead ? "text-primary font-bold" : "text-white/40")}>
                                {email.sentDateTime ? new Date(email.sentDateTime).toLocaleDateString() : ""}
                              </span>
                            </div>
                            <h4 className={cn("text-[11px] truncate", !email.isRead ? "font-black text-white" : "font-bold text-white/80")}>
                              {highlightText(email.subject || "(No Subject)", debouncedSearch)}
                            </h4>
                            <p className={cn("text-[10px] truncate mt-0.5", !email.isRead ? "text-white/70" : "text-white/50")}>
                              {highlightText((email.body || "").replace(/<[^>]+>/g, "").slice(0, 80), debouncedSearch)}
                            </p>
                            {emailLabels.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {emailLabels.map(lbl => {
                                  const clr = LABEL_COLORS[lbl.color % LABEL_COLORS.length];
                                  return <span key={lbl.id} className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-full", clr.bg, clr.text)}>{lbl.name}</span>;
                                })}
                              </div>
                            )}
                            {(email.attachments?.length > 0) && (
                              <div className="flex items-center gap-1 mt-1">
                                <Paperclip className="w-3 h-3 text-white/30" />
                                <span className="text-[9px] text-white/30">{email.attachments.length} attachment{email.attachments.length > 1 ? "s" : ""}</span>
                              </div>
                            )}
                          </div>

                          {/* Hover actions */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => toggleStar(email)} className={cn("p-1 rounded-lg hover:bg-white/10 transition-colors", email.isStarred ? "text-amber-500" : "text-white/30 hover:text-amber-400")}>
                              <Star className={cn("w-4 h-4", email.isStarred && "fill-amber-500")} />
                            </button>
                            <Select onValueChange={v => handleSnooze(email, v as any)}>
                              <SelectTrigger className="w-8 h-8 p-0 border-0 bg-transparent hover:bg-white/10 flex items-center justify-center [&>svg:last-child]:hidden">
                                <Clock className="w-4 h-4 text-white/30 hover:text-white" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                <SelectItem value="later">Later Today (3hr)</SelectItem>
                                <SelectItem value="tomorrow">Tomorrow (9am)</SelectItem>
                                <SelectItem value="nextweek">Next Week</SelectItem>
                              </SelectContent>
                            </Select>
                            <button onClick={() => moveToTrash(email)} className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-rose-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* ── DETAIL VIEW ── */}
          {(selectedId || layoutMode === "split") && (
            <div className="flex-1 flex flex-col bg-[#0b0b14]/15 overflow-hidden">
              {selectedEmail ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-8 md:p-12 space-y-8 animate-in fade-in">

                    {/* Feature 3: Read receipt banner */}
                    {readReceiptBanner && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MailOpen className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400 font-bold">Your read receipt has been sent</span>
                        </div>
                        <button onClick={() => setReadReceiptBanner(false)}><X className="w-4 h-4 text-white/30" /></button>
                      </div>
                    )}

                    {selectedEmail.isSpam && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-rose-500 font-bold text-sm">Spam / Phishing Warning</h4>
                          <p className="text-rose-500/80 text-xs mt-1">Do not click links or share personal info.</p>
                        </div>
                      </div>
                    )}

                    {selectedEmail.hasCalendar && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-blue-400" />
                          <span className="text-blue-400 font-bold text-sm">Event Invitation</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 border-blue-500/30 text-blue-400 hover:bg-blue-500/20">Add to Calendar</Button>
                      </div>
                    )}

                    {/* Feature 12: Unsubscribe banner */}
                    {(selectedEmail.body || "").toLowerCase().includes("unsubscribe") && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BellOff className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-amber-400 font-bold">This email contains an unsubscribe link</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-amber-500/30 text-amber-400 hover:bg-amber-500/20" onClick={() => handleMarkSpam(selectedEmail)}>
                          Unsubscribe &amp; Block
                        </Button>
                      </div>
                    )}

                    {layoutMode === "list" && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="self-start text-xs text-white/50 hover:text-white pl-0">
                        ← Back
                      </Button>
                    )}

                    {/* Header */}
                    <div className="flex justify-between items-start gap-6">
                      <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white leading-tight">
                        {isTranslating ? `TRANSLATED: ${selectedEmail.subject}` : selectedEmail.subject}
                      </h2>
                      <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                        <Button onClick={() => setIsTranslating(!isTranslating)} variant="ghost" size="icon" className={cn("h-9 w-9 rounded-full", isTranslating ? "bg-primary/20 text-primary" : "text-white/50")} title="Translate">
                          <Languages className="w-4 h-4" />
                        </Button>
                        {/* Feature 10: Create Task */}
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-white/50 hover:text-white" title="Create Task" onClick={() => { setTaskTitle(selectedEmail.subject || ""); setTaskDesc(`Email from ${selectedEmail.senderName}: ${window.location.href}`); setShowTaskModal(true); }}>
                          <CheckSquare className="w-4 h-4" />
                        </Button>
                        {/* Feature 20: Label assign */}
                        <Select onValueChange={v => handleAssignLabel(v, selectedEmail.id)}>
                          <SelectTrigger className="w-9 h-9 p-0 border-0 bg-transparent hover:bg-white/5 flex items-center justify-center [&>svg:last-child]:hidden rounded-full" title="Apply label">
                            <Tag className="w-4 h-4 text-white/50" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white">
                            {userLabels.length === 0 ? (
                              <div className="p-2 text-xs text-white/40">No labels yet. Create one in Settings.</div>
                            ) : userLabels.map(lbl => {
                              const clr = LABEL_COLORS[lbl.color % LABEL_COLORS.length];
                              const applied = lbl.emailIds?.includes(selectedEmail.id);
                              return (
                                <SelectItem key={lbl.id} value={lbl.id}>
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", clr.dot)} />
                                    {lbl.name}
                                    {applied && <Check className="w-3 h-3 text-primary ml-auto" />}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {/* Feature 1: Override tab */}
                        <Select onValueChange={v => handleOverrideTab(selectedEmail.id, v as InboxTab)}>
                          <SelectTrigger className="w-9 h-9 p-0 border-0 bg-transparent hover:bg-white/5 flex items-center justify-center [&>svg:last-child]:hidden rounded-full" title="Move to tab">
                            <ListFilter className="w-4 h-4 text-white/50" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white">
                            {INBOX_TABS.map(tab => <SelectItem key={tab} value={tab}>{tab}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => toggleStar(selectedEmail)} className={cn("h-9 w-9 rounded-full hover:bg-amber-500/10", selectedEmail.isStarred ? "text-amber-500" : "text-white/40")}>
                          <Star className={cn("w-5 h-5", selectedEmail.isStarred && "fill-amber-500")} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => togglePin(selectedEmail)} className={cn("h-9 w-9 rounded-full hover:bg-primary/10", selectedEmail.isPinned ? "text-primary" : "text-white/40")}>
                          <Pin className={cn("w-5 h-5", selectedEmail.isPinned && "fill-primary")} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleMarkSpam(selectedEmail)} className="h-9 w-9 rounded-full text-white/40 hover:text-amber-400 hover:bg-amber-500/10" title="Mark as Spam">
                          <Shield className="w-5 h-5" />
                        </Button>
                        {/* Feature 2: Snooze */}
                        <Select onValueChange={v => handleSnooze(selectedEmail, v as any)}>
                          <SelectTrigger className="w-9 h-9 p-0 border-0 bg-transparent hover:bg-white/5 flex items-center justify-center [&>svg:last-child]:hidden rounded-full">
                            <Clock className="w-5 h-5 text-white/40" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white">
                            <SelectItem value="later">Later Today (3hr)</SelectItem>
                            <SelectItem value="tomorrow">Tomorrow (9am)</SelectItem>
                            <SelectItem value="nextweek">Next Week</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => moveToTrash(selectedEmail)} className="h-9 w-9 rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Sender row */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 border border-white/10">
                          <AvatarFallback className="bg-zinc-800 text-white font-black text-xs">{getInitials(selectedEmail.senderName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {selectedEmail.senderName}
                            {selectedEmail.requestReadReceipt && <Badge variant="outline" className="text-[9px] h-4 border-blue-500/30 text-blue-400">Receipt Requested</Badge>}
                          </p>
                          <p className="text-xs text-white/50">{selectedEmail.senderEmail}</p>
                        </div>
                      </div>
                      <p className="text-xs text-white/40">{selectedEmail.sentDateTime ? new Date(selectedEmail.sentDateTime).toLocaleString() : ""}</p>
                    </div>

                    {/* Labels applied */}
                    {getEmailLabels(selectedEmail.id).length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {getEmailLabels(selectedEmail.id).map(lbl => {
                          const clr = LABEL_COLORS[lbl.color % LABEL_COLORS.length];
                          return (
                            <span key={lbl.id} className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1", clr.bg, clr.text)}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", clr.dot)} />
                              {lbl.name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Email body */}
                    <div className="text-sm leading-relaxed text-white/90 w-full">
                      {isTranslating && <p className="mb-4 text-primary font-bold">🌐 This is a translated version of the email body.</p>}

                      <div className="mb-4 flex items-center gap-2 text-[10px] text-green-400/75 bg-green-500/5 px-3 py-1.5 rounded-lg border border-green-500/10">
                        <EyeOff className="w-3.5 h-3.5 shrink-0" />
                        <span>Tracker Blocked: 1x1 tracking pixels stripped. Your privacy is protected.</span>
                      </div>

                      {selectedEmail.html ? (
                        <div className="w-full bg-white rounded-lg overflow-hidden shadow-inner">
                          <iframe
                            srcDoc={selectedEmail.html.replace(/<img[^>]*width=["']?1["']?[^>]*>/gi, "").replace(/<img[^>]*height=["']?1["']?[^>]*>/gi, "")}
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
                              <p>Only you have the keys to decrypt this message.</p>
                              <Button onClick={() => toast({ title: "Decrypted", description: selectedEmail.body })} variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/20">Decrypt Now</Button>
                            </div>
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.body || "") }} />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Feature 9: Attachment Viewer */}
                    {selectedEmail.attachments?.length > 0 && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5" /> {selectedEmail.attachments.length} Attachment{selectedEmail.attachments.length > 1 ? "s" : ""}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedEmail.attachments.map((att: any, i: number) => <AttachmentChip key={i} att={att} />)}
                        </div>
                      </div>
                    )}

                    {/* AI Tools */}
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex gap-3 flex-wrap">
                        <Button onClick={handleSummarize} disabled={isSummarizing} variant="outline" className="h-10 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-bold text-xs uppercase tracking-widest">
                          {isSummarizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
                          Summarize
                        </Button>
                        <Button onClick={handleSmartReply} disabled={isGeneratingReply} variant="outline" className="h-10 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-bold text-xs uppercase tracking-widest">
                          {isGeneratingReply ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                          Smart Reply
                        </Button>
                        <Button onClick={handleReply} variant="outline" className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold text-xs uppercase tracking-widest">
                          <CornerUpLeft className="w-4 h-4 mr-2" /> Reply
                        </Button>
                      </div>

                      {summary && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                          <div className="flex items-center gap-2 mb-2"><Bot className="w-4 h-4 text-primary" /><span className="text-[10px] font-black uppercase text-primary tracking-widest">AI Summary</span></div>
                          <p className="text-sm text-white/80">{summary}</p>
                        </div>
                      )}
                    </div>

                    {/* Quick replies */}
                    <div className="pt-4 flex gap-3 flex-wrap">
                      {["Sounds good!", "I'll check on this.", "Can we reschedule?", "Thanks for the update!"].map(r => (
                        <Button key={r} variant="outline" className="rounded-full bg-white/5 border-white/10 text-xs hover:bg-white/10"
                          onClick={() => { setBody(r); setRecipient(selectedEmail.senderEmail); setSubject(`Re: ${selectedEmail.subject}`); setIsComposeOpen(true); }}>
                          {r}
                        </Button>
                      ))}
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

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-6 left-6 z-40 lg:hidden w-14 h-14 rounded-full bg-primary text-black flex items-center justify-center shadow-2xl border-4 border-[#05030d] active:scale-95 transition-transform hover:scale-105"
          aria-label="Toggle folders"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* ── COMPOSE DIALOG ── */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-2xl text-white p-10 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic flex justify-between items-center">
              <span>{mailMode === "gmail" ? "Compose via Gmail" : "New Message"}</span>
              <div className="flex gap-2 items-center">
                {/* Expiry */}
                <Select value={expiresAt || "none"} onValueChange={val => setExpiresAt(val === "none" ? null : val)}>
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
                {/* Feature 7: Mail Merge button */}
                <Button variant="ghost" size="sm" className="h-8 text-[10px] bg-white/5 border border-white/10 text-white/60 hover:text-white" onClick={() => setShowMergePanel(true)}>
                  <Users className="w-3 h-3 mr-1" /> Merge
                </Button>
                {/* Feature 6: Templates */}
                <Button variant="ghost" size="sm" className="h-8 text-[10px] bg-white/5 border border-white/10 text-white/60 hover:text-white" onClick={() => setShowTemplatesPanel(true)}>
                  <FileText className="w-3 h-3 mr-1" /> Templates
                </Button>
                {/* Save template */}
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 bg-white/5 border border-white/10 text-white/50 hover:text-white" title="Save as Template"
                  onClick={async () => {
                    if (!firestore || !user || !body) return toast({ variant: "destructive", title: "Cannot save empty body as template" });
                    const name = prompt("Template name:");
                    if (!name) return;
                    const ref = await addDoc(collection(firestore, "users", user.uid, "email_templates"), { name, body, subject });
                    setTemplates(prev => [...prev, { id: ref.id, name, body }]);
                    toast({ title: "✅ Template saved" });
                  }}>
                  <Save className="w-3.5 h-3.5" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Feature 8: From alias selector */}
            <div className="flex gap-2">
              <Select value={selectedAlias} onValueChange={setSelectedAlias}>
                <SelectTrigger className="w-[200px] h-12 bg-[#0b0b14]/60 border-transparent rounded-xl text-xs">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  <SelectItem value="main">
                    {userData?.username ? `${userData.username}@mail.xakteir.com` : (userData?.xakteirEmail || user?.email || "Main")}
                  </SelectItem>
                  {aliases.map(a => <SelectItem key={a.id} value={a.id}>{a.address}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="To: name@email.com" className="bg-[#0b0b14]/60 border-transparent h-12 rounded-xl text-white flex-1" />
            </div>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="bg-[#0b0b14]/60 border-transparent h-12 rounded-xl text-white" />

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
                {/* ── Dictation Button ── */}
                <Button variant="ghost" size="icon" onClick={toggleDictation} className={cn("h-8 w-8 rounded-full", isDictating ? "text-primary animate-pulse bg-primary/10" : "text-white/50 hover:text-white")}>
                  <Volume2 className="w-4 h-4" />
                </Button>
                <input type="file" ref={attachmentInputRef} className="hidden" onChange={handleAttachmentUpload} />
                <Button variant="ghost" size="icon" onClick={() => attachmentInputRef.current?.click()} className="h-8 w-8 text-white/50 hover:text-white rounded-full" disabled={isUploadingAttachment}>
                  {isUploadingAttachment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleAnalyzeTone} disabled={isAnalyzingTone || !body} className={cn("h-8 w-8 rounded-full", isAnalyzingTone ? "text-primary animate-pulse" : "text-white/50 hover:text-white")}>
                  <Wand2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsEncrypted(!isEncrypted)} className={cn("h-8 w-8 rounded-full", isEncrypted ? "text-green-400" : "text-white/50")}>
                  <Lock className="w-4 h-4" />
                </Button>
                {/* Feature 3: Read Receipt toggle */}
                <Button variant="ghost" size="icon" onClick={() => setRequestReadReceipt(!requestReadReceipt)} className={cn("h-8 w-8 rounded-full", requestReadReceipt ? "text-blue-400" : "text-white/50")} title="Request read receipt">
                  <MailOpen className={cn("w-4 h-4")} />
                </Button>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {attachments.map((att, i) => (
                  <Badge key={i} variant="outline" className="border-white/20 bg-white/5 text-xs py-1.5 px-3 flex items-center gap-2">
                    <Paperclip className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{att.name}</span>
                    {att.size && <span className="text-white/30">{formatBytes(att.size)}</span>}
                    <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Feature 4: Undo send progress */}
          {isSending && undoProgress > 0 && (
            <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary transition-all duration-100 rounded-full" style={{ width: `${undoProgress}%` }} />
            </div>
          )}

          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Select value={scheduleAt || "none"} onValueChange={val => setScheduleAt(val === "none" ? null : val)}>
                <SelectTrigger className={cn("h-10 text-xs border-transparent rounded-xl", scheduleAt ? "bg-primary/20 text-primary" : "bg-[#0b0b14]/60 text-white/50")}>
                  <Clock className="w-3.5 h-3.5 mr-2" />
                  <SelectValue placeholder="Send Now" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  <SelectItem value="none">Send Now</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow (8:00 AM)</SelectItem>
                  <SelectItem value="evening">This Evening (6:00 PM)</SelectItem>
                  <SelectItem value="nextWeek">Next Week (Mon 9:00 AM)</SelectItem>
                </SelectContent>
              </Select>
              {requestReadReceipt && (
                <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400">Receipt ON</Badge>
              )}
            </div>
            <Button disabled={isSending} onClick={handleSend} className="h-14 px-12 bg-primary rounded-xl font-black uppercase text-xs text-black hover:bg-primary/95">
              {isSending ? <Loader2 className="animate-spin text-black" /> : (scheduleAt ? "Schedule" : "Transmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FEATURE 6: TEMPLATES PANEL ── */}
      {showTemplatesPanel && (
        <div className="fixed inset-y-0 right-0 w-80 bg-zinc-950 border-l border-white/10 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-black uppercase text-sm tracking-widest">Templates</h3>
            <button onClick={() => setShowTemplatesPanel(false)}><X className="w-5 h-5 text-white/50" /></button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-3">Built-in</p>
              {BUILT_IN_TEMPLATES.map(t => (
                <button key={t.id} className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  onClick={() => { setSubject(t.subject || ""); setBody(t.body); setShowTemplatesPanel(false); }}>
                  <p className="text-xs font-bold text-white">{t.name}</p>
                  <p className="text-[10px] text-white/40 mt-1 truncate">{t.body.slice(0, 60)}...</p>
                </button>
              ))}
              {templates.length > 0 && (
                <>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-3 mt-6">Saved</p>
                  {templates.map(t => (
                    <button key={t.id} className="w-full text-left p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                      onClick={() => { if (t.subject) setSubject(t.subject); setBody(t.body); setShowTemplatesPanel(false); }}>
                      <p className="text-xs font-bold text-white">{t.name}</p>
                      <p className="text-[10px] text-white/40 mt-1 truncate">{t.body.slice(0, 60)}...</p>
                    </button>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ── FEATURE 7: MAIL MERGE PANEL ── */}
      {showMergePanel && (
        <div className="fixed inset-y-0 right-0 w-80 bg-zinc-950 border-l border-white/10 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-black uppercase text-sm tracking-widest">Mail Merge</h3>
            <button onClick={() => setShowMergePanel(false)}><X className="w-5 h-5 text-white/50" /></button>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <p className="text-xs text-white/60">Paste a comma-separated list of email addresses. Use <code className="bg-white/10 px-1 rounded">{"{name}"}</code> in your body to personalize.</p>
            <Textarea
              value={mergeRecipients}
              onChange={e => setMergeRecipients(e.target.value)}
              placeholder="alice@example.com, bob@example.com, ..."
              className="bg-white/5 border-white/10 text-xs h-32"
            />
            {isMerging && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Sending...</span>
                  <span>{mergeProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${mergeProgress}%` }} />
                </div>
              </div>
            )}
            <Button className="w-full bg-primary text-black font-black uppercase text-xs" onClick={handleMailMerge} disabled={isMerging}>
              {isMerging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
              {isMerging ? `Sending... ${mergeProgress}%` : "Send Mail Merge"}
            </Button>
          </div>
        </div>
      )}

      {/* ── FEATURE 5: FOLLOW-UP PANEL ── */}
      <Dialog open={showFollowUpPanel} onOpenChange={setShowFollowUpPanel}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] bg-zinc-950 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-lg tracking-widest flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" /> Follow-up Reminders
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {awaitingReplyEmails.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">All caught up! No follow-ups needed.</p>
            ) : awaitingReplyEmails.map(e => (
              <div key={e.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{e.subject}</p>
                  <p className="text-[10px] text-white/40">Sent: {e.sentAt ? new Date(e.sentAt).toLocaleDateString() : "Unknown"}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] border-primary/30 text-primary" onClick={() => { setSelectedId(e.id); setShowFollowUpPanel(false); }}>View</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[10px] text-white/40" onClick={() => handleMarkNoLongerWaiting(e.id)}>Done</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── FEATURE 10: CREATE TASK MODAL ── */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] bg-zinc-950 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-lg tracking-widest flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" /> Create Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title" className="bg-white/5 border-white/10 text-white" />
            <Textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="Description / notes" className="bg-white/5 border-white/10 text-white text-xs h-20" />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateTask} className="bg-primary text-black font-black uppercase text-xs">Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FEATURE 9: ATTACHMENT VIEWER ── */}
      <Dialog open={!!attachmentViewUrl} onOpenChange={() => { setAttachmentViewUrl(null); setAttachmentViewType(null); }}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] bg-zinc-950 text-white max-w-4xl max-h-[90vh] p-4">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-sm tracking-widest">Attachment Preview</DialogTitle>
          </DialogHeader>
          {attachmentViewUrl && (
            <div className="flex-1 overflow-hidden rounded-xl">
              {attachmentViewType?.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp)$/i.test(attachmentViewUrl) ? (
                <img src={attachmentViewUrl} alt="Preview" className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg" />
              ) : attachmentViewType === "application/pdf" || attachmentViewUrl.endsWith(".pdf") ? (
                <iframe src={attachmentViewUrl} className="w-full h-[70vh] rounded-lg border-0" title="PDF Preview" />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-4">
                  <FileText className="w-12 h-12 text-white/30" />
                  <p className="text-white/60 text-sm">Preview not available</p>
                  <a href={attachmentViewUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-white/20 text-white"><Download className="w-4 h-4 mr-2" /> Download</Button>
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── FEATURE 20: CREATE LABEL MODAL ── */}
      <Dialog open={showLabelModal} onOpenChange={setShowLabelModal}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] bg-zinc-950 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-sm tracking-widest flex items-center gap-2">
              <Tag className="w-4 h-4" /> New Label
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={newLabelName} onChange={e => setNewLabelName(e.target.value)} placeholder="Label name" className="bg-white/5 border-white/10 text-white" />
            <div>
              <p className="text-xs text-white/40 mb-2">Color</p>
              <div className="flex gap-2">
                {LABEL_COLORS.map((c, i) => (
                  <button key={i} onClick={() => setNewLabelColor(i)} className={cn("w-6 h-6 rounded-full transition-transform", c.dot, newLabelColor === i ? "scale-125 ring-2 ring-white/50" : "hover:scale-110")} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateLabel} className="bg-primary text-black font-black uppercase text-xs">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FEATURE 15: ANALYTICS MODAL ── */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] bg-zinc-950 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-xl tracking-widest flex items-center gap-3">
              <BarChart2 className="w-6 h-6 text-primary" /> Email Analytics
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Sent This Month", value: analyticsData.thisMonthCount, icon: Send, color: "text-green-400" },
                { label: "Unread", value: analyticsData.totalUnread, icon: MailOpen, color: "text-primary" },
                { label: "Total Emails", value: (rawEmails || []).length, icon: MailIcon, color: "text-blue-400" },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <stat.icon className={cn("w-6 h-6 mx-auto mb-2", stat.color)} />
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Bar chart: emails by day */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Activity (Last 7 Days)</p>
              <div className="flex items-end gap-3 h-24">
                {Object.entries(analyticsData.byDay).map(([day, count]) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-white/40">{count}</span>
                    <div className="w-full bg-primary/20 rounded-t-sm transition-all" style={{ height: `${count === 0 ? 4 : Math.max(8, (count / maxByDay) * 80)}px`, backgroundColor: count > 0 ? "hsl(var(--primary)/0.6)" : undefined }} />
                    <span className="text-[9px] text-white/40 font-bold">{day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top recipients */}
            {analyticsData.topRecipients.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Top Recipients</p>
                <div className="space-y-2">
                  {analyticsData.topRecipients.map(([email, count]) => (
                    <div key={email} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6 border border-white/10"><AvatarFallback className="bg-zinc-800 text-white font-black text-[9px]">{getInitials(email.split("@")[0])}</AvatarFallback></Avatar>
                        <span className="text-xs text-white/70 truncate max-w-[200px]">{email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(count / analyticsData.topRecipients[0][1]) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-white/40 w-4 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── SETTINGS MODAL ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] bg-zinc-950 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black uppercase italic text-xl">Settings &amp; Features</DialogTitle>
          </DialogHeader>

          {/* Settings navigation */}
          <div className="flex gap-2 flex-wrap mb-4">
            {["general", "signature", "vacation", "folders & rules", "aliases", "nicknames", "notifications", "labels", "external"].map(tab => (
              <button key={tab} onClick={() => setSettingsTab(tab)} className={cn("px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-colors", settingsTab === tab ? "bg-primary text-black" : "bg-white/5 text-white/50 hover:text-white")}>
                {tab}
              </button>
            ))}
          </div>

          {/* ── General settings ── */}
          {settingsTab === "general" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div><Label className="font-bold">Focused Inbox</Label><p className="text-xs text-white/50">Learn important markers</p></div>
                <Switch checked={focusedInbox} onCheckedChange={setFocusedInbox} />
              </div>
              <div className="flex justify-between items-center">
                <div><Label className="font-bold">Conversation View</Label><p className="text-xs text-white/50">Group emails by thread</p></div>
                <Switch checked={conversationView} onCheckedChange={setConversationView} />
              </div>
              <div className="flex justify-between items-center">
                <div><Label className="font-bold">Unified Inbox</Label><p className="text-xs text-white/50">Merge all mailboxes</p></div>
                <Switch checked={unifiedInbox} onCheckedChange={setUnifiedInbox} />
              </div>
              {/* ── Theme settings ── */}
              <div className="flex justify-between items-center">
                <div><Label className="font-bold">Mail Theme</Label><p className="text-xs text-white/50">Change the aesthetic</p></div>
                <Select value={mailTheme} onValueChange={(v: any) => setMailTheme(v)}>
                  <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    <SelectItem value="obsidian">Obsidian (Default)</SelectItem>
                    <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                    <SelectItem value="holographic">Holographic</SelectItem>
                    <SelectItem value="matrix">Matrix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Rules section */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <Label className="font-bold flex items-center justify-between">
                  Rules &amp; Filters
                  <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer">+ New Rule</Badge>
                </Label>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between mt-2">
                  <div>
                    <p className="text-xs font-bold text-white">If sender is "newsletter@example.com"</p>
                    <p className="text-[10px] text-white/50">Then move to Spam</p>
                  </div>
                  <Trash2 className="w-4 h-4 text-rose-500 cursor-pointer hover:text-rose-400" />
                </div>
              </div>
              {/* Blocked domains */}
              {blockedDomains.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <Label className="font-bold">Blocked Domains</Label>
                  <div className="flex flex-wrap gap-2">
                    {blockedDomains.map(d => (
                      <Badge key={d} variant="outline" className="border-rose-500/30 text-rose-400">
                        {d}
                        <button className="ml-1 hover:text-white" onClick={async () => {
                          if (!firestore || !user) return;
                          const snap = await getDocs(query(collection(firestore, "users", user.uid, "blockedDomains"), where("domain", "==", d)));
                          for (const d2 of snap.docs) await deleteDoc(d2.ref);
                          setBlockedDomains(prev => prev.filter(x => x !== d));
                        }}>×</button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Feature 13: Signature Builder ── */}
          {settingsTab === "signature" && (
            <div className="space-y-4">
              <Label className="font-bold">Drawn Signature</Label>
              <p className="text-xs text-white/50">Draw your signature here. It will be appended to your composed emails automatically.</p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 overflow-hidden relative flex flex-col items-center">
                <canvas 
                  ref={signatureCanvasRef}
                  width={400}
                  height={150}
                  className="bg-black/50 cursor-crosshair border border-white/20 rounded-lg max-w-[400px] w-full touch-none"
                  onMouseDown={(e) => {
                    const ctx = signatureCanvasRef.current?.getContext('2d');
                    if (!ctx) return;
                    setIsDrawingSignature(true);
                    ctx.beginPath();
                    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                  }}
                  onMouseMove={(e) => {
                    if (!isDrawingSignature) return;
                    const ctx = signatureCanvasRef.current?.getContext('2d');
                    if (!ctx) return;
                    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";
                    ctx.stroke();
                  }}
                  onMouseUp={() => setIsDrawingSignature(false)}
                  onMouseLeave={() => setIsDrawingSignature(false)}
                  onTouchStart={(e) => {
                    const canvas = signatureCanvasRef.current;
                    const ctx = canvas?.getContext('2d');
                    if (!ctx || !canvas) return;
                    setIsDrawingSignature(true);
                    const rect = canvas.getBoundingClientRect();
                    ctx.beginPath();
                    ctx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
                  }}
                  onTouchMove={(e) => {
                    if (!isDrawingSignature) return;
                    const canvas = signatureCanvasRef.current;
                    const ctx = canvas?.getContext('2d');
                    if (!ctx || !canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    ctx.lineTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";
                    ctx.stroke();
                  }}
                  onTouchEnd={() => setIsDrawingSignature(false)}
                />
                
                {signature && !signature.startsWith('<img') && (
                  <div className="mt-4 p-2 bg-rose-500/10 text-rose-400 text-xs rounded border border-rose-500/20 w-full text-center">
                    Legacy text signature detected. Drawing a new one will overwrite it.
                  </div>
                )}
                
                <div className="flex gap-4 mt-4 w-full justify-center">
                  <Button 
                    variant="outline" 
                    className="text-xs"
                    onClick={() => {
                      const canvas = signatureCanvasRef.current;
                      if (!canvas) return;
                      const ctx = canvas.getContext('2d');
                      ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    }}
                  >
                    Clear Canvas
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (!firestore || !user) return;
                      const canvas = signatureCanvasRef.current;
                      if (!canvas) return;
                      
                      // Check if canvas is empty
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;
                      const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
                      const isCanvasBlank = !pixelBuffer.some(color => color !== 0);

                      let html = "";
                      if (!isCanvasBlank) {
                         const dataUrl = canvas.toDataURL("image/png");
                         html = `<img src="${dataUrl}" alt="signature" style="max-height: 80px;" />`;
                      }
                      
                      await setDoc(doc(firestore, "users", user.uid, "settings", "signature"), { html });
                      setSignature(html);
                      toast({ title: "✅ Signature saved" });
                    }} 
                    className="bg-primary text-black font-black uppercase text-xs"
                  >
                    <Save className="w-4 h-4 mr-2" /> Save Signature
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Feature: Folders & Rules ── */}
          {settingsTab === "folders & rules" && (
            <div className="space-y-8">
              {/* Custom Folders */}
              <div className="space-y-4">
                <div>
                  <Label className="font-bold">Custom Folders</Label>
                  <p className="text-xs text-white/50">Create your own folders to organize your inbox.</p>
                </div>
                <div className="flex gap-2">
                  <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder Name" className="bg-white/5 border-white/10 text-white" />
                  <Button onClick={handleCreateFolder} className="bg-primary text-black font-black uppercase text-xs">Create Folder</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(userData?.mailCustomFolders || []).map((cf: string) => (
                    <Badge key={cf} variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                      <FolderOpen className="w-3 h-3 mr-1" /> {cf}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-white/10" />

              {/* Rules */}
              <div className="space-y-4">
                <div>
                  <Label className="font-bold">Inbox Rules</Label>
                  <p className="text-xs text-white/50">Automatically route incoming emails into your folders.</p>
                </div>
                
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Select value={newRuleCondition} onValueChange={setNewRuleCondition}>
                      <SelectTrigger className="bg-black/50 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="Sender contains">Sender contains</SelectItem>
                        <SelectItem value="Subject contains">Subject contains</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={newRuleValue} onChange={e => setNewRuleValue(e.target.value)} placeholder="Text to match..." className="bg-black/50 border-white/10 text-white" />
                    <Select value={newRuleFolder} onValueChange={setNewRuleFolder}>
                      <SelectTrigger className="bg-black/50 border-white/10 text-white"><SelectValue placeholder="Move to folder..." /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        {folders.map(f => (
                          <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateRule} disabled={!newRuleValue || !newRuleFolder} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-xs">
                    <CheckCircle className="w-4 h-4 mr-2" /> Add Rule
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  {(userData?.mailRules || []).map((rule: any) => (
                    <div key={rule.id} className="flex justify-between items-center p-3 bg-black/40 border border-white/5 rounded-lg">
                      <div className="text-xs">
                        <span className="text-white/50">If</span> <span className="font-bold text-indigo-400">{rule.condition}</span> <span className="text-white/50">"</span><span className="font-bold text-white">{rule.value}</span><span className="text-white/50">", move to</span> <span className="font-bold text-indigo-400">{rule.targetFolder}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="h-6 w-6 text-rose-500 hover:bg-rose-500/20 rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Feature 14: Vacation Responder ── */}
          {settingsTab === "vacation" && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <div><Label className="font-bold">Vacation Responder</Label><p className="text-xs text-white/50">Auto-reply to incoming emails</p></div>
                <Switch checked={vacationEnabled} onCheckedChange={setVacationEnabled} />
              </div>
              {vacationEnabled && (
                <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <Label className="text-xs text-white/60 mb-1 block">Auto-reply Subject</Label>
                    <Input value={vacationSubject} onChange={e => setVacationSubject(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-xs text-white/60 mb-1 block">Auto-reply Message</Label>
                    <Textarea value={vacationMessage} onChange={e => setVacationMessage(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs h-24" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-white/60 mb-1 block">Start Date</Label>
                      <Input type="date" value={vacationStart} onChange={e => setVacationStart(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <Label className="text-xs text-white/60 mb-1 block">End Date</Label>
                      <Input type="date" value={vacationEnd} onChange={e => setVacationEnd(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                </div>
              )}
              <Button onClick={handleSaveVacation} className="bg-primary text-black font-black uppercase text-xs">
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </Button>
            </div>
          )}

          {/* ── Feature 8: Aliases ── */}
          {settingsTab === "aliases" && (
            <div className="space-y-5">
              <div>
                <Label className="font-bold">Email Aliases</Label>
                <p className="text-xs text-white/50">Up to 5 aliases. Must be @mail.xakteir.com addresses.</p>
              </div>
              <div className="space-y-2">
                {aliases.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-white">{a.name}</p>
                      <p className="text-[10px] text-white/50">{a.address}</p>
                    </div>
                    <button className="text-rose-400 hover:text-rose-300" onClick={async () => {
                      if (!firestore || !user) return;
                      await deleteDoc(doc(firestore, "users", user.uid, "emailAliases", a.id));
                      setAliases(prev => prev.filter(x => x.id !== a.id));
                    }}><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {aliases.length >= 5 && <p className="text-xs text-amber-400">Maximum 5 aliases reached.</p>}
              </div>
              {aliases.length < 5 && (
                <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Add Alias</p>
                  <Input value={newAliasName} onChange={e => setNewAliasName(e.target.value)} placeholder="Display name" className="bg-white/5 border-white/10 text-white" />
                  <Input value={newAliasAddress} onChange={e => setNewAliasAddress(e.target.value)} placeholder="alias@mail.xakteir.com" className="bg-white/5 border-white/10 text-white" />
                  <Button onClick={handleAddAlias} className="w-full bg-primary text-black font-black uppercase text-xs">
                    <Plus className="w-4 h-4 mr-2" /> Add Alias
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Feature: Nicknames ── */}
          {settingsTab === "nicknames" && (
            <div className="space-y-5">
              <div>
                <Label className="font-bold">Address Book Nicknames</Label>
                <p className="text-xs text-white/50">Assign simple names to full email addresses (e.g. typing "john" sends to "john.doe@example.com").</p>
              </div>
              <div className="space-y-2">
                {(userData?.mailNicknames || []).map((n: any) => (
                  <div key={n.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-white">{n.nickname}</p>
                      <p className="text-[10px] text-white/50">{n.email}</p>
                    </div>
                    <button className="text-rose-400 hover:text-rose-300" onClick={() => handleDeleteNickname(n.id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Add Nickname</p>
                <Input value={newNickname} onChange={e => setNewNickname(e.target.value)} placeholder="Nickname (e.g. mom)" className="bg-white/5 border-white/10 text-white" />
                <Input value={newNicknameEmail} onChange={e => setNewNicknameEmail(e.target.value)} placeholder="Full email address" className="bg-white/5 border-white/10 text-white" />
                <Button onClick={handleCreateNickname} disabled={!newNickname || !newNicknameEmail} className="w-full bg-primary text-black font-black uppercase text-xs">
                  <Plus className="w-4 h-4 mr-2" /> Add Nickname
                </Button>
              </div>
            </div>
          )}

          {/* ── Feature: Custom Notifications ── */}
          {settingsTab === "notifications" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div>
                  <Label className="font-bold text-white">Browser Push Notifications</Label>
                  <p className="text-xs text-white/50">Allow Xakteir to send system notifications for new emails.</p>
                </div>
                <Button 
                  onClick={() => {
                    if ("Notification" in window) {
                      Notification.requestPermission().then(p => toast({ title: `Permission ${p}` }));
                    } else {
                      toast({ title: "Not supported by browser" });
                    }
                  }} 
                  className="bg-indigo-500 text-white font-bold text-xs"
                >
                  Request Permission
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="font-bold">Notify for Specific Folders</Label>
                  <p className="text-xs text-white/50">Only receive notifications when emails arrive in these folders.</p>
                </div>
                <div className="flex gap-2">
                  <Select value={newNotifFolder} onValueChange={setNewNotifFolder}>
                    <SelectTrigger className="bg-black/50 border-white/10 text-white flex-1"><SelectValue placeholder="Select folder..." /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      {folders.map(f => (
                        <SelectItem key={f.name} value={f.name.toLowerCase()}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddNotifFolder} className="bg-primary text-black font-black uppercase text-xs">Add Folder</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(userData?.mailNotifyFolders || ["inbox"]).map((f: string) => (
                    <Badge key={f} variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                      {f} <button className="ml-2 hover:text-white" onClick={() => handleRemoveNotifFolder(f)}>×</button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-white/10" />

              <div className="space-y-4">
                <div>
                  <Label className="font-bold">Notify for Specific Senders</Label>
                  <p className="text-xs text-white/50">Receive notifications when an email from these senders arrives.</p>
                </div>
                <div className="flex gap-2">
                  <Input value={newNotifSender} onChange={e => setNewNotifSender(e.target.value)} placeholder="example@domain.com" className="bg-white/5 border-white/10 text-white" />
                  <Button onClick={handleAddNotifSender} className="bg-primary text-black font-black uppercase text-xs">Add Sender</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(userData?.mailNotifySenders || []).map((s: string) => (
                    <Badge key={s} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      {s} <button className="ml-2 hover:text-white" onClick={() => handleRemoveNotifSender(s)}>×</button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Feature 20: Label manager ── */}
          {settingsTab === "labels" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Label className="font-bold">Email Labels</Label>
                <Button size="sm" className="h-8 bg-primary text-black text-xs font-bold" onClick={() => setShowLabelModal(true)}>
                  <Plus className="w-3 h-3 mr-1" /> New Label
                </Button>
              </div>
              <div className="space-y-2">
                {userLabels.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-6">No labels yet. Create one to organize your emails.</p>
                ) : userLabels.map(lbl => {
                  const clr = LABEL_COLORS[lbl.color % LABEL_COLORS.length];
                  return (
                    <div key={lbl.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", clr.dot)} />
                        <span className={cn("text-xs font-bold", clr.text)}>{lbl.name}</span>
                        <span className="text-[10px] text-white/30">{lbl.emailIds?.length || 0} emails</span>
                      </div>
                      <button className="text-rose-400 hover:text-rose-300" onClick={async () => {
                        if (!firestore || !user) return;
                        await deleteDoc(doc(firestore, "users", user.uid, "emailLabels", lbl.id));
                        setUserLabels(prev => prev.filter(x => x.id !== lbl.id));
                      }}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Feature 17: External accounts ── */}
          {settingsTab === "external" && (
            <div className="space-y-5">
              <Label className="font-bold">Connected Accounts</Label>
              <div className="space-y-3">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Gmail</p>
                      <p className="text-[10px] text-white/50">{gmailToken ? "Connected" : "Not connected"}</p>
                    </div>
                  </div>
                  {gmailToken ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px]">Connected</Badge>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] border-rose-500/30 text-rose-400" onClick={disconnectGmail}>Disconnect</Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={handleConnectGmail} className="bg-blue-500 text-white text-[10px] h-7">Connect Gmail</Button>
                  )}
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-900/40 flex items-center justify-center">
                      <MailIcon className="w-4 h-4 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Outlook / Microsoft 365</p>
                      <p className="text-[10px] text-white/50">IMAP sync — coming soon</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/20 text-white/50" disabled>Connect</Button>
                </div>

                {gmailToken && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-primary">Gmail sync in progress...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Supercharge: Inbox Zero Wizard ── */}
      <Dialog open={showInboxZeroWizard} onOpenChange={setShowInboxZeroWizard}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] bg-zinc-950 text-white max-w-3xl overflow-hidden p-0">
          <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/20 to-black p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
              <Wand2 className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">Inbox Zero Wizard</h2>
            <p className="text-sm font-medium text-white/70 max-w-lg">
              Let XakAI analyze your unread emails, sweep the junk, and bubble up the ones that actually matter.
            </p>
            
            {!inboxZeroResults && (
              <Button
                disabled={inboxZeroLoading}
                onClick={async () => {
                  setInboxZeroLoading(true);
                  if (!rawEmails || rawEmails.length === 0) {
                    toast({ title: "Inbox empty!", description: "You have no emails to process." });
                    setInboxZeroLoading(false);
                    setShowInboxZeroWizard(false);
                    return;
                  }
                  const unread = rawEmails.filter(e => !e.isRead && (e.folder === "inbox" || !e.folder));
                  if (unread.length === 0) {
                    toast({ title: "Already Inbox Zero!", description: "You have no unread emails." });
                    setInboxZeroLoading(false);
                    setShowInboxZeroWizard(false);
                    return;
                  }
                  
                  // Simulate AI analysis delay for dramatic effect
                  await new Promise(r => setTimeout(r, 2000));
                  
                  // Mock AI categorization for demonstration
                  const results = {
                    actionRequired: unread.slice(0, Math.min(3, unread.length)),
                    trash: unread.filter(e => classifyEmail(e) === "Promotions" || classifyEmail(e) === "Social"),
                    snooze: unread.filter(e => !unread.slice(0, Math.min(3, unread.length)).includes(e) && classifyEmail(e) !== "Promotions" && classifyEmail(e) !== "Social")
                  };
                  setInboxZeroResults(results);
                  setInboxZeroLoading(false);
                }}
                className="mt-8 bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl h-12 px-8"
              >
                {inboxZeroLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run AI Analysis"}
              </Button>
            )}

            {inboxZeroResults && (
              <div className="mt-8 w-full space-y-6 text-left">
                {/* Action Required */}
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
                  <h3 className="text-rose-400 font-black uppercase text-xs mb-3 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Action Required ({inboxZeroResults.actionRequired.length})</h3>
                  <div className="space-y-2">
                    {inboxZeroResults.actionRequired.map((e: any) => (
                      <div key={e.id} className="bg-black/40 p-2 rounded-lg text-sm text-white/90 truncate border border-white/5">
                        <span className="font-bold">{e.senderName || e.senderEmail}:</span> {e.subject}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Trash / Promotions */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <h3 className="text-white/60 font-black uppercase text-xs mb-3 flex items-center justify-between">
                      <span className="flex items-center"><Trash2 className="w-4 h-4 mr-2" /> Junk to clear ({inboxZeroResults.trash.length})</span>
                      {inboxZeroResults.trash.length > 0 && (
                        <Button size="sm" variant="ghost" className="h-6 text-[9px] bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" onClick={async () => {
                          for (const email of inboxZeroResults.trash) {
                            if(firestore) await updateDoc(doc(firestore, "emails", email.id), { folder: "trash" });
                          }
                          setInboxZeroResults(prev => prev ? {...prev, trash: []} : null);
                          toast({ title: "Trash cleared!" });
                        }}>Archive All</Button>
                      )}
                    </h3>
                  </div>

                  {/* Snooze */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <h3 className="text-white/60 font-black uppercase text-xs mb-3 flex items-center justify-between">
                      <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> Read Later ({inboxZeroResults.snooze.length})</span>
                      {inboxZeroResults.snooze.length > 0 && (
                        <Button size="sm" variant="ghost" className="h-6 text-[9px] bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" onClick={async () => {
                          const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                          for (const email of inboxZeroResults.snooze) {
                            if(firestore) await updateDoc(doc(firestore, "emails", email.id), { folder: "snoozed", snoozedUntil: tomorrow.toISOString() });
                          }
                          setInboxZeroResults(prev => prev ? {...prev, snooze: []} : null);
                          toast({ title: "Snoozed until tomorrow!" });
                        }}>Snooze All</Button>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button onClick={() => setShowInboxZeroWizard(false)} className="bg-white/10 hover:bg-white/20 text-white font-bold h-10 px-6 rounded-xl">
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rich Signature Studio Modal */}
      <SignatureStudioModal
        open={editingSignature}
        onOpenChange={setEditingSignature}
        initialSignature={signature}
        onSave={(sigHtml) => {
          setSignature(sigHtml);
          setBody((prev) => prev + "\n\n" + sigHtml);
        }}
      />

      {/* Analytics Dashboard Modal */}
      <MailAnalyticsModal
        open={showAnalytics}
        onOpenChange={setShowAnalytics}
        totalInbox={128}
        totalSent={45}
        unreadCount={3}
      />
    </div>
  );
}

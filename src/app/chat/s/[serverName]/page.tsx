"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  Users,
  Edit,
  Trash2,
  CornerUpLeft,
  Paperclip,
  Pin,
  ArrowDown,
  Settings,
  Sparkles,
  Volume2,
  Copy,
  Bookmark,
  Share2,
  MessageSquare,
  Mic,
  MicOff,
  Clock,
  ChevronRight,
  BookMarked,
  BarChart2,
  Video,
  MonitorUp,
  Flame
} from "lucide-react";
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { ThreadPanel } from "@/components/chat/ThreadPanel";
import { ReactionPicker } from "@/components/chat/ReactionPicker";
import { BookmarksPanel } from "@/components/chat/BookmarksPanel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Lock, FileText, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit, doc, addDoc, updateDoc, deleteDoc, where, getDocs, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { RenderHat } from "@/components/RenderHat";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { isOffensive } from "@/lib/username";
import Link from "next/link";
import Room3D from "./Room3D";

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

// Sticker set
const STICKERS = ["😂", "🔥", "💀", "👀", "🚀", "🎉", "💯", "❤️"];

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

  // Derive legacy public channels or scoped server channels
  const channelId = serverName === "xakteir" ? channelName : `${serverName}-${channelName}`;
  const isBuiltInServer = ['home', 'xakteir', 'gaming', 'dev', 'discover'].includes(serverName);

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

  // Upgrade state variables
  const [explosions, setExplosions] = useState<{ id: number, emoji: string, left: number }[]>([]);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // AI summary states
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // AI Translation states
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});

  // Pinned Drawer state
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);

  // Toxicity warning
  const [toxicityWarning, setToxicityWarning] = useState("");

  // Spam prevention
  const [lastMessageSentAt, setLastMessageSentAt] = useState(0);
  const [customContextMenu, setCustomContextMenu] = useState<{msg: any, x: number, y: number} | null>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setCustomContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);
  const [spamMuteUntil, setSpamMuteUntil] = useState(0);

  // Scroll to bottom btn state
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Typing indicators
  const [lastTypedAt, setLastTypedAt] = useState(0);

  // @mention autocomplete states
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionCandidates, setMentionCandidates] = useState<any[]>([]);
  const [activeThreadMessage, setActiveThreadMessage] = useState<any>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Poll state
  const [showChannelSettingsModal, setShowChannelSettingsModal] = useState(false);
  const [editChannelName, setEditChannelName] = useState("");
  const [editChannelTopic, setEditChannelTopic] = useState("");
  const [isSavingChannel, setIsSavingChannel] = useState(false);
  const [isDeletingChannel, setIsDeletingChannel] = useState(false);

  // ── NEW FEATURE STATES ────────────────────────────────────────────────────

  // Feature 2: Image Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Feature 4: Profile Card
  const [profileCard, setProfileCard] = useState<any | null>(null);

  // Feature 6: Poll state (handled via message type)

  // Feature 7: Message Forwarding
  const [forwardMsg, setForwardMsg] = useState<any | null>(null);
  const [forwardDest, setForwardDest] = useState("");

  // Feature 8: Call, Docs, Streaks
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [docContent, setDocContent] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Feature 8: Sticker Picker
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // Feature 10: Voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Feature 11: Message scheduling
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");

  // Feature 12: Thread side panel
  const [activeThread, setActiveThread] = useState<any | null>(null);
  const [threadInput, setThreadInput] = useState("");

  // Thread replies query
  const threadRepliesQuery = useMemoFirebase(() => {
    if (!firestore || !activeThread) return null;
    return query(
      collection(firestore, "chats", channelId, "threads", activeThread.id, "replies"),
      orderBy("timestamp", "asc"),
      limit(50)
    );
  }, [firestore, channelId, activeThread]);
  const { data: threadReplies } = useCollection(threadRepliesQuery);

  // Feature 13: Slow mode
  const [slowModeUntil, setSlowModeUntil] = useState(0);
  const [slowModeCountdown, setSlowModeCountdown] = useState(0);

  // Feature 1 + 2: E2E Encryption and Disappearing messages
  const [e2eEnabled, setE2eEnabled] = useState(false);
  const [disappearingMessages, setDisappearingMessages] = useState(false);

  useEffect(() => {
    if (slowModeUntil <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((slowModeUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setSlowModeCountdown(0);
        setSlowModeUntil(0);
        clearInterval(interval);
      } else {
        setSlowModeCountdown(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [slowModeUntil]);

  // Feature 14: Server rules / welcome screen
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Feature 15: Reaction analytics tooltip
  const [reactionTooltip, setReactionTooltip] = useState<{ msgId: string, emoji: string, x: number, y: number } | null>(null);

  // Member List Panel
  const [showMemberPanel, setShowMemberPanel] = useState(false);

  // If room3d is active, render Room3D instead of Chat
  if (searchParams.get("room3d") === "true") {
    return <Room3D serverName={serverName} />;
  }

  // ── LISTEN TO VIEWPORT SCROLLING ─────────────────────────────────────────
  useEffect(() => {
    if (!scrollRef.current) return;
    const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    
    const handleScroll = () => {
      const isScrolledUp = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight > 300;
      setShowScrollBottomBtn(isScrolledUp);
    };
    
    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [messages]);

  const handleScrollToBottom = () => {
    if (!scrollRef.current) return;
    const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if (!firestore || !user || !messages) return;
    try {
      const msg = messages.find(m => m.id === msgId);
      if (!msg) return;
      const currentReactions = msg.reactions || [];
      
      let updatedReactions = [...currentReactions];
      const existingReactionIndex = updatedReactions.findIndex((r: any) => r.emoji === emoji);
      
      if (existingReactionIndex > -1) {
        const uids = updatedReactions[existingReactionIndex].uids || [];
        if (uids.includes(user.uid)) {
          updatedReactions[existingReactionIndex].uids = uids.filter((uid: string) => uid !== user.uid);
        } else {
          updatedReactions[existingReactionIndex].uids = [...uids, user.uid];
        }
      } else {
        updatedReactions.push({ emoji, uids: [user.uid] });
      }
      
      updatedReactions = updatedReactions.filter((r: any) => r.uids && r.uids.length > 0);
      
      await updateDoc(doc(firestore, "chats", channelId, "messages", msgId), {
        reactions: updatedReactions
      });
      
      triggerExplosion(emoji);
    } catch(e) {
      console.error(e);
    }
  };

  const triggerExplosion = (emoji: string) => {
    const newExplosionList = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      emoji,
      left: Math.random() * 100
    }));
    setExplosions(prev => [...prev, ...newExplosionList]);
    setTimeout(() => {
      setExplosions(prev => prev.filter(x => !newExplosionList.find(n => n.id === x.id)));
    }, 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!firestore || !editInput.trim()) return;
    try {
      await updateDoc(doc(firestore, "chats", channelId, "messages", msgId), {
        content: editInput.trim(),
        edited: true
      });
      setEditingMessageId(null);
      toast({ title: "Message updated!" });
    } catch(e) {
      toast({ variant: "destructive", title: "Edit failed" });
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "chats", channelId, "messages", msgId));
      toast({ title: "Message deleted" });
    } catch(e) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  const handleTogglePin = async (msgId: string, currentPinned: boolean) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "chats", channelId, "messages", msgId), {
        pinned: !currentPinned
      });
      toast({ title: !currentPinned ? "Message pinned!" : "Message unpinned!" });
    } catch(e) {
      toast({ variant: "destructive", title: "Failed to toggle pin state" });
    }
  };

  const handleTranslate = async (msgId: string, text: string, lang: string) => {
    setTranslatingMessageId(msgId);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      let trans = text;
      const lower = text.toLowerCase();
      if (lang === 'Spanish') {
        trans = lower.includes("hello") ? "Hola" : lower.includes("how are you") ? "¿Cómo estás?" : lower.includes("good") ? "Bueno" : `[Spanish] ${text}`;
      } else if (lang === 'French') {
        trans = lower.includes("hello") ? "Bonjour" : lower.includes("how are you") ? "Comment ça va?" : lower.includes("good") ? "Bien" : `[French] ${text}`;
      } else if (lang === 'Japanese') {
        trans = lower.includes("hello") ? "こんにちは (Konnichiwa)" : lower.includes("how are you") ? "お元気ですか (Ogenki desu ka)" : lower.includes("good") ? "良い (Yoi)" : `[Japanese] ${text}`;
      } else if (lang === 'Arabic') {
        trans = lower.includes("hello") ? "مرحباً (Marhaban)" : lower.includes("how are you") ? "كيف حالك؟" : lower.includes("good") ? "جيد" : `[Arabic] ${text}`;
      } else {
        trans = `[${lang}] ${text}`;
      }
      setTranslatedTexts(prev => ({ ...prev, [msgId]: trans }));
    } catch(e) {
      toast({ variant: "destructive", title: "Translation failed" });
    } finally {
      setTranslatingMessageId(null);
    }
  };

  const handleTyping = async () => {
    if (!firestore || !user || !channelId) return;
    const now = Date.now();
    if (now - lastTypedAt > 3500) {
      setLastTypedAt(now);
      try {
        await addDoc(collection(firestore, "typing"), {
          uid: user.uid,
          username: user.displayName?.replace(/^@+/, "") || "Member",
          channelId,
          timestamp: serverTimestamp()
        });
      } catch(e) {}
    }
  };

  // Handle @mention autocomplete: fires when user types @
  const handleInputChange = (value: string) => {
    setChatInput(value);
    handleTyping();

    // Detect trailing @word pattern
    const match = value.match(/@([\w]*)$/);
    if (match) {
      const q = match[1].toLowerCase();
      setMentionQuery(q);
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
      setMentionQuery("");
    }
  };

  // Insert selected username into input
  const handleSelectMention = (username: string) => {
    const updated = chatInput.replace(/@[\w]*$/, `@${username} `);
    setChatInput(updated);
    setShowMentionList(false);
    setMentionQuery("");
  };

  // Send a notification to a user by UID
  const sendNotification = async (toUid: string, title: string, message: string) => {
    if (!firestore || toUid === user?.uid) return;
    try {
      await addDoc(collection(firestore, "users", toUid, "notifications"), {
        title,
        message,
        type: "xakchat",
        read: false,
        timestamp: serverTimestamp()
      });
    } catch(e) {}
  };

  // Resolve @mentions in a message text and dispatch notifications
  const dispatchMentionNotifications = async (content: string, senderName: string) => {
    if (!firestore) return;
    const mentionRegex = /@([\w]+)/g;
    let m;
    const found: string[] = [];
    while ((m = mentionRegex.exec(content)) !== null) {
      const uname = m[1].toLowerCase();
      if (!found.includes(uname)) found.push(uname);
    }
    for (const uname of found) {
      try {
        const q = query(collection(firestore, "users"), where("username", "==", uname), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const targetUid = snap.docs[0].id;
          await sendNotification(
            targetUid,
            `📣 You were mentioned in #${channelName}`,
            `@${senderName}: ${content.slice(0, 80)}${content.length > 80 ? "…" : ""}`
          );
        }
      } catch(e) {}
    }
  };

  // Feature 9: @everyone / @here notifications
  const dispatchEveryoneNotifications = async (content: string) => {
    if (!firestore || !serverDoc?.members || !user) return;
    const memberUids: string[] = serverDoc.members || [];
    for (const uid of memberUids) {
      if (uid === user.uid) continue;
      try {
        await addDoc(collection(firestore, "users", uid, "notifications"), {
          title: `📣 @everyone in #${channelName}`,
          message: content.slice(0, 100),
          type: "mention_everyone",
          read: false,
          timestamp: serverTimestamp()
        });
      } catch(e) {}
    }
  };

  // Feature 1: Wrap selected text in formatting syntax
  const chatInputRef = useRef<HTMLInputElement>(null);
  const wrapSelection = (wrapper: string) => {
    const el = chatInputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = chatInput.slice(start, end);
    const before = chatInput.slice(0, start);
    const after = chatInput.slice(end);
    const newVal = selected
      ? `${before}${wrapper}${selected}${wrapper}${after}`
      : `${before}${wrapper}${wrapper}${after}`;
    setChatInput(newVal);
    setTimeout(() => {
      el.focus();
      const newPos = selected ? end + wrapper.length * 2 : start + wrapper.length;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    if (!text) return "";
    let escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    escaped = escaped.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/_([^_]+)_/g, "<em>$1</em>");
    escaped = escaped.replace(/~([^~]+)~/g, "<del>$1</del>");
    escaped = escaped.replace(/`([^`]+)`/g, "<code class='bg-black/50 px-1 py-0.5 rounded text-pink-400 font-mono text-xs'>$1</code>");
    // Feature 9: Highlight @everyone / @here
    escaped = escaped.replace(/@(everyone|here)/g, "<span class='inline-flex items-center bg-yellow-500/20 text-yellow-300 font-black px-1.5 py-0.5 rounded-md text-xs'>@$1</span>");
    // Highlight @mentions as styled pills
    escaped = escaped.replace(/@([\w]+)/g, "<span class='inline-flex items-center bg-primary/20 text-primary font-black px-1.5 py-0.5 rounded-md text-xs cursor-pointer hover:bg-primary/30 transition-colors'>@$1</span>");
    escaped = escaped.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      return `<a href="#" onclick="if(window.openXakChatWebview){window.openXakChatWebview('${url}');return false;}else{window.open('${url}','_blank');return false;}" class="text-primary hover:underline font-bold">${url}</a>`;
    });
    return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
  };

  // Fetch topic details from active channel document in subcollection
  const channelDocQuery = useMemoFirebase(() => {
    if (!firestore || serverName === "xakteir") return null;
    return query(collection(firestore, "servers", serverName, "channels"), where("name", "==", channelName), limit(1));
  }, [firestore, serverName, channelName]);
  const { data: channelDocs } = useCollection(channelDocQuery);
  const activeChannelDoc = channelDocs?.[0];
  const channelTopic = activeChannelDoc?.topic || (channelName === 'general' ? 'General community discussion sector.' : `Welcome to the #${channelName} sector!`);

  useEffect(() => {
    if (activeChannelDoc) {
      setEditChannelName(activeChannelDoc.name || "");
      setEditChannelTopic(activeChannelDoc.topic || "");
    } else {
      setEditChannelName(channelName);
      setEditChannelTopic("");
    }
  }, [activeChannelDoc, channelName, showChannelSettingsModal]);

  const handleUpdateChannel = async () => {
    if (!firestore || !activeChannelDoc || !editChannelName.trim()) return;
    setIsSavingChannel(true);
    try {
      const updatedName = editChannelName.toLowerCase().trim().replace(/\s+/g, '-');
      await updateDoc(doc(firestore, "servers", serverName, "channels", activeChannelDoc.id), {
        name: updatedName,
        topic: editChannelTopic.trim()
      });
      toast({ title: "Channel updated!" });
      setShowChannelSettingsModal(false);
      router.push(`/chat/s/${serverName}?c=${updatedName}`);
    } catch(e) {
      toast({ variant: "destructive", title: "Update failed" });
    } finally {
      setIsSavingChannel(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!firestore || !activeChannelDoc) return;
    if (channelName === 'general') {
      toast({ variant: "destructive", title: "Cannot delete general channel" });
      return;
    }
    setIsDeletingChannel(true);
    try {
      await deleteDoc(doc(firestore, "servers", serverName, "channels", activeChannelDoc.id));
      toast({ title: "Channel deleted" });
      setShowChannelSettingsModal(false);
      router.push(`/chat/s/${serverName}?c=general`);
    } catch (e) {
      toast({ variant: "destructive", title: "Delete failed" });
    } finally {
      setIsDeletingChannel(false);
    }
  };

  // Real-time typing indicators
  const typingQuery = useMemoFirebase(() => {
    if (!firestore || !channelId) return null;
    return query(collection(firestore, "typing"), where("channelId", "==", channelId));
  }, [firestore, channelId]);
  const { data: typingDocs } = useCollection(typingQuery);

  const activeTypingUsers = useMemo(() => {
    if (!typingDocs || !user) return [];
    return typingDocs.filter((d: any) => {
      if (d.uid === user.uid) return false;
      const seconds = d.timestamp?.seconds || (d.timestamp?.toDate ? d.timestamp.toDate().getTime() / 1000 : Date.now() / 1000);
      const nowSeconds = Date.now() / 1000;
      return nowSeconds - seconds < 5;
    });
  }, [typingDocs, user]);

  // Filters messages inside the scroll window using messageSearchQuery state
  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    let msgs = messages;
    
    // Feature 1: Filter out expired ephemeral messages (1h)
    const now = Date.now();
    msgs = msgs.filter(m => {
      if (m.ephemeral) {
        const msgTime = m.timestamp?.toMillis ? m.timestamp.toMillis() : (m.timestamp || now);
        if (now - msgTime > 3600000) return false;
      }
      return true;
    });

    if (!messageSearchQuery.trim()) return msgs;
    const qStr = messageSearchQuery.toLowerCase();
    return msgs.filter(m => m.content?.toLowerCase().includes(qStr));
  }, [messages, messageSearchQuery]);


  // Derived list of pinned messages
  const pinnedMessagesList = useMemo(() => {
    if (!messages) return [];
    return messages.filter(m => m.pinned === true);
  }, [messages]);

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

  // All users list for @mention autocomplete
  const allUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), limit(50));
  }, [firestore]);
  const { data: allUsers } = useCollection(allUsersQuery);

  // Hub members (online status) — declared after serverDoc & userData
  const hubMembersQuery = useMemoFirebase(() => {
    if (!firestore || !serverDoc?.members?.length) return null;
    return query(collection(firestore, "users"), limit(100));
  }, [firestore, serverDoc]);
  const { data: hubMembers } = useCollection(hubMembersQuery);

  // ── SERVER RULES CHECK ───────────────────────────────────────────────────
  useEffect(() => {
    if (!serverDoc?.rules || !userData || rulesAccepted) return;
    const accepted = userData?.acceptedRules?.[serverName];
    if (!accepted) {
      setShowRulesModal(true);
    }
  }, [serverDoc, userData, serverName, rulesAccepted]);

  const handleAcceptRules = async () => {
    if (!firestore || !user) return;
    try {
      await updateDoc(doc(firestore, "users", user.uid), {
        [`acceptedRules.${serverName}`]: true
      });
      setShowRulesModal(false);
      setRulesAccepted(true);
      toast({ title: "Rules accepted! Welcome 🎉" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to accept rules" });
    }
  };


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

  // Feature 3: Copy message content
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: "Copied!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Copy failed" });
    }
  };

  // Feature 5: Bookmark message
  const handleBookmarkMessage = async (msg: any) => {
    if (!firestore || !user) return;
    try {
      await addDoc(collection(firestore, "users", user.uid, "bookmarks"), {
        messageId: msg.id,
        channelId,
        channelName,
        serverName,
        content: msg.content,
        senderName: msg.senderName,
        senderPhoto: msg.senderPhoto,
        timestamp: serverTimestamp()
      });
      toast({ title: "Bookmarked!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Bookmark failed" });
    }
  };

  // Feature 7: Forward message
  const handleForwardMessage = async () => {
    if (!firestore || !user || !forwardMsg || !forwardDest.trim()) return;
    try {
      const destChannelId = forwardDest.trim();
      await addDoc(collection(firestore, "chats", destChannelId, "messages"), {
        content: forwardMsg.content,
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        senderHat: userData?.hat || null,
        channelId: destChannelId,
        channelName: destChannelId,
        timestamp: serverTimestamp(),
        forwardedFrom: {
          senderName: forwardMsg.senderName,
          channelName,
          serverName
        }
      });
      toast({ title: "Message forwarded!" });
      setForwardMsg(null);
      setForwardDest("");
    } catch (e) {
      toast({ variant: "destructive", title: "Forward failed" });
    }
  };

  // Feature 8: Send sticker
  const handleSendSticker = async (sticker: string) => {
    if (!user || !firestore) return;
    setShowStickerPicker(false);
    try {
      await addDocumentNonBlocking(collection(firestore, "chats", channelId, "messages"), {
        content: sticker,
        type: "sticker",
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        senderHat: userData?.hat || null,
        channelId,
        channelName,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Sticker send failed" });
    }
  };

  // Feature 10: Voice recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          if (!user || !firestore) return;
          try {
            await addDocumentNonBlocking(collection(firestore, "chats", channelId, "messages"), {
              content: base64,
              type: "audio",
              senderId: user.uid,
              senderName: user.displayName?.replace(/^@+/, "") || "Member",
              senderPhoto: user.photoURL || "",
              senderHat: userData?.hat || null,
              channelId,
              channelName,
              timestamp: serverTimestamp()
            });
            toast({ title: "Voice message sent!" });
          } catch (err) {
            toast({ variant: "destructive", title: "Voice send failed" });
          }
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setIsRecording(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Microphone access denied" });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Feature 12: Send thread reply
  const handleSendThreadReply = async () => {
    if (!firestore || !user || !activeThread || !threadInput.trim()) return;
    try {
      await addDoc(collection(firestore, "chats", channelId, "threads", activeThread.id, "replies"), {
        content: threadInput.trim(),
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        timestamp: serverTimestamp()
      });
      setThreadInput("");
    } catch (e) {
      toast({ variant: "destructive", title: "Thread reply failed" });
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!chatInput.trim() && !imagePreview) || !user || !firestore || isSending) return;

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

    // Toxicity warning
    if (isOffensive(chatInput)) {
      const newLevel = (userData?.banLevel || 0) + 1;
      let banDuration = 3600000; // 1 hr default
      if (newLevel === 2) banDuration = 86400000; // 24 hours
      else if (newLevel === 3) banDuration = 2592000000; // 1 month
      else if (newLevel === 4) banDuration = 315360000000; // 10 years
      else if (newLevel >= 5) banDuration = 3153600000000; // Permanent

      updateDocumentNonBlocking(doc(firestore, "users", user.uid), {
        isBanned: true,
        bannedUntil: Date.now() + banDuration,
        banLevel: newLevel,
        banReason: `Auto-ban: Offensive language (Level ${newLevel})`
      });

      toast({ variant: "destructive", title: "Identity Locked", description: "Your account has been locked due to a protocol violation." });
      return;
    }

    // Spam check
    const now = Date.now();
    if (now < spamMuteUntil) {
      const remainingSecs = Math.ceil((spamMuteUntil - now) / 1000);
      toast({ variant: "destructive", title: "Spam Blocked", description: `Please wait ${remainingSecs}s.` });
      return;
    }
    if (now - lastMessageSentAt < 800) {
      setSpamMuteUntil(now + 5000);
      toast({ variant: "destructive", title: "Spam Detected", description: "You are sending messages too fast. Muted for 5s." });
      return;
    }

    // Feature 13: Slow mode check
    if (activeChannelDoc?.slowMode > 0 && now < slowModeUntil) {
      const remaining = Math.ceil((slowModeUntil - now) / 1000);
      toast({ variant: "destructive", title: "Slow Mode", description: `⏳ Wait ${remaining}s` });
      return;
    }

    setLastMessageSentAt(now);

    // Apply slow mode after sending
    if (activeChannelDoc?.slowMode > 0) {
      setSlowModeUntil(now + activeChannelDoc.slowMode * 1000);
    }

    let content = chatInput.trim();

    // Feature 2: /remind slash command
    if (content.startsWith("/remind ")) {
      const parts = content.split(" ");
      const timeStr = parts[1];
      const reminderText = parts.slice(2).join(" ");
      const timeMatch = timeStr.match(/^(\d+)(s|m|h)$/);
      if (timeMatch && reminderText) {
        const val = parseInt(timeMatch[1]);
        const unit = timeMatch[2];
        let ms = 0;
        if (unit === 's') ms = val * 1000;
        else if (unit === 'm') ms = val * 60000;
        else if (unit === 'h') ms = val * 3600000;
        
        setTimeout(() => {
          toast({ title: "Reminder", description: reminderText, duration: 10000 });
        }, ms);
        toast({ title: "Reminder Set", description: `I will remind you in ${timeStr}.` });
        setChatInput("");
        return;
      }
    }

    // Feature 11: Scheduled message
    if (scheduleDateTime && showSchedulePicker) {
      if (!content) {
        toast({ variant: "destructive", title: "Type a message to schedule" });
        return;
      }
      try {
        await addDoc(collection(firestore, "chats", channelId, "messages"), {
          content,
          senderId: user.uid,
          senderName: user.displayName?.replace(/^@+/, "") || "Member",
          senderPhoto: user.photoURL || "",
          senderHat: userData?.hat || null,
          channelId,
          channelName,
          timestamp: serverTimestamp(),
          scheduledFor: scheduleDateTime,
          status: "scheduled"
        });
        toast({ title: `Message scheduled for ${new Date(scheduleDateTime).toLocaleString()}` });
        setChatInput("");
        setScheduleDateTime("");
        setShowSchedulePicker(false);
        return;
      } catch (e) {
        toast({ variant: "destructive", title: "Schedule failed" });
        return;
      }
    }

    if (imagePreview) {
      content = imagePreview;
      setImagePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    } else {
      setChatInput("");
    }

    setIsSending(true);

    try {
      // Feature 6: Poll syntax parsing
      if (content.startsWith("/poll ")) {
        const pollRaw = content.slice(6);
        const parts = pollRaw.split("|").map(p => p.trim());
        if (parts.length >= 3) {
          const [pollQuestion, ...optionTexts] = parts;
          const pollOptions = optionTexts.map(text => ({ text, votes: 0, voters: [] }));
          await addDocumentNonBlocking(collection(firestore, "chats", channelId, "messages"), {
            content: pollQuestion,
            type: "poll",
            pollQuestion,
            pollOptions,
            senderId: user.uid,
            senderName: user.displayName?.replace(/^@+/, "") || "Member",
            senderPhoto: user.photoURL || "",
            senderHat: userData?.hat || null,
            channelId,
            channelName,
            timestamp: serverTimestamp()
          });
          setIsSending(false);
          return;
        }
      }

      const payload: any = {
        content,
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        senderHat: userData?.hat || null,
        channelId,
        channelName,
        timestamp: serverTimestamp(),
        ephemeral: disappearingMessages,
        e2e: e2eEnabled
      };

      if (replyingToMessage) {
        payload.replyTo = {
          id: replyingToMessage.id,
          senderName: replyingToMessage.senderName,
          content: replyingToMessage.content
        };
        setReplyingToMessage(null);
      }

      await addDocumentNonBlocking(collection(firestore, "chats", channelId, "messages"), payload);

      // Dispatch @mention notifications after message is saved
      if (content.includes("@")) {
        dispatchMentionNotifications(content, user.displayName?.replace(/^@+/, "") || "Member");
      }

      // Feature 9: @everyone / @here notifications
      if (content.includes("@everyone") || content.includes("@here")) {
        dispatchEveryoneNotifications(content);
      }
    } catch (error) {
      if (!imagePreview) setChatInput(content);
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

  // Feature 6: Poll vote
  const handlePollVote = async (msgId: string, optionIndex: number, currentOptions: any[]) => {
    if (!firestore || !user) return;
    try {
      const updated = currentOptions.map((opt, i) => {
        if (i !== optionIndex) return opt;
        const alreadyVoted = (opt.voters || []).includes(user.uid);
        if (alreadyVoted) return opt;
        return { ...opt, votes: (opt.votes || 0) + 1, voters: [...(opt.voters || []), user.uid] };
      });
      await updateDoc(doc(firestore, "chats", channelId, "messages", msgId), {
        pollOptions: updated
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Vote failed" });
    }
  };

  const handleCatchUp = async () => {
    if (!messages || messages.length === 0) {
      toast({ description: "No messages to recap yet." });
      return;
    }
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const recent = messages.slice(-20).map(m => `${m.senderName}: ${m.content}`).join("\n");
      await new Promise(resolve => setTimeout(resolve, 1500));
      const topics: string[] = [];
      const chatText = recent.toLowerCase();
      if (chatText.includes("bug") || chatText.includes("error") || chatText.includes("fix")) {
        topics.push("🔍 Troubleshooting software bugs and type errors in layout components.");
      }
      if (chatText.includes("game") || chatText.includes("play") || chatText.includes("pong")) {
        topics.push("🎮 Scheduling gaming pods, gaming tournaments, and Pong gameplay checks.");
      }
      if (chatText.includes("meet") || chatText.includes("zoom") || chatText.includes("call")) {
        topics.push("📹 Coordinating video meetings and camera feed integrations.");
      }
      if (chatText.includes("deploy") || chatText.includes("build") || chatText.includes("npm")) {
        topics.push("🚀 Managing deployment scripts and compiling production builds.");
      }
      if (topics.length === 0) {
        topics.push("💬 Exchanging greetings, social feedback, and general chats.");
      }
      
      const summaryText = `Recap of recent channel items:\n\n` + 
        topics.map(t => `- ${t}`).join("\n") + 
        `\n\nParticipants: ${Array.from(new Set(messages.slice(-20).map(m => m.senderName))).join(", ")}`;
      setAiSummary(summaryText);
    } catch(e) {
      toast({ variant: "destructive", title: "Summarization failed" });
    } finally {
      setIsSummarizing(false);
    }
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
                  if (!currentMembers.includes(user.uid) && serverDocRef) {
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

  // Check if base64 or custom preview image starting with data:image or normal image url
  const isImageUrl = (url: string) => {
    if (typeof url !== 'string') return false;
    if (url.startsWith('data:image/')) return true;
    return url.startsWith('http') && (
      url.match(/\.(jpeg|jpg|gif|png|webp)/i) != null || 
      url.includes('giphy.com/media/') || 
      url.includes('media.giphy.com/') || 
      url.includes('tenor.com/')
    );
  };

  // Feature 15: get reactor names
  const getReactorNames = (uids: string[]) => {
    if (!hubMembers && !allUsers) return uids.map(u => u.slice(0, 6));
    const members = hubMembers || allUsers || [];
    return uids.map(uid => {
      const m = members.find((u: any) => u.id === uid);
      return m?.displayName || m?.username || uid.slice(0, 6);
    });
  };

  return (
    <main className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden h-full">
      <style>{`
        @keyframes emojiRain {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-emoji-rain {
          animation-name: emojiRain;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>

      {/* Emoji Explosion Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
        {explosions.map(exp => (
          <span 
            key={exp.id} 
            className="absolute text-2xl animate-emoji-rain"
            style={{ 
              left: `${exp.left}%`, 
              top: '-5%',
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${1 + Math.random() * 1}s`
            }}
          >
            {exp.emoji}
          </span>
        ))}
      </div>

      {/* Feature 14: Server Rules Modal */}
      <Dialog open={showRulesModal} onOpenChange={() => {}}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-lg text-white p-8 bg-zinc-950/95 backdrop-blur-2xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic text-white flex items-center gap-2">
              📋 Server Rules
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              You must accept these rules to continue.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-60 mt-4">
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line p-4 bg-white/5 rounded-2xl border border-white/5">
              {serverDoc?.rules || "No rules provided."}
            </div>
          </ScrollArea>
          <Button
            onClick={handleAcceptRules}
            className="w-full mt-4 h-12 bg-primary hover:bg-primary/90 text-black font-black uppercase text-xs tracking-widest rounded-xl border-none"
          >
            Accept & Continue
          </Button>
        </DialogContent>
      </Dialog>

      {/* Feature 2 & 10: Image Lightbox / Media Viewer */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white z-10"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          {lightboxImage.endsWith('.pdf') ? (
            <div className="w-[80vw] h-[80vh] bg-white rounded-2xl flex items-center justify-center flex-col text-black">
               <FileText className="w-16 h-16 mb-4 text-red-500" />
               <p className="font-bold">PDF Viewer (Mock)</p>
            </div>
          ) : lightboxImage.endsWith('.obj') || lightboxImage.endsWith('.gltf') ? (
            <div className="w-[80vw] h-[80vh] bg-zinc-900 rounded-2xl flex items-center justify-center flex-col text-white border border-white/10">
               <Box className="w-16 h-16 mb-4 text-emerald-500" />
               <p className="font-bold">3D Model Viewer (Mock)</p>
            </div>
          ) : (
            <img
              src={lightboxImage}
              alt="lightbox"
              className="max-w-[90vw] max-h-[90vh] rounded-2xl border border-white/10 shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Feature 4: Profile Card Modal */}
      <Dialog open={!!profileCard} onOpenChange={() => setProfileCard(null)}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-sm text-white p-8 bg-zinc-950/95 backdrop-blur-2xl text-center">
          <Avatar className="w-20 h-20 rounded-[2rem] border-4 border-white/10 mx-auto">
            <AvatarImage src={profileCard?.senderPhoto} className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-primary font-black text-2xl">{profileCard?.senderName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="mt-4 space-y-1">
            <p className="text-lg font-black uppercase italic tracking-tight text-white">{profileCard?.senderName}</p>
            {profileCard?.username && (
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">@{profileCard.username}</p>
            )}
            {profileCard?.statusEmoji && (
              <p className="text-2xl">{profileCard.statusEmoji}</p>
            )}
            {profileCard?.bio && (
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed italic">"{profileCard.bio}"</p>
            )}
          </div>
          <Button
            onClick={() => {
              router.push(`/chat/dm/${profileCard?.username || profileCard?.senderId}`);
              setProfileCard(null);
            }}
            className="w-full mt-6 h-11 bg-primary hover:bg-primary/90 text-black font-black uppercase text-xs tracking-widest rounded-xl border-none"
          >
            Start DM
          </Button>
        </DialogContent>
      </Dialog>

      {/* Feature 7: Forward Message Modal */}
      <Dialog open={!!forwardMsg} onOpenChange={() => { setForwardMsg(null); setForwardDest(""); }}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-white p-8 bg-zinc-950/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase italic text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" /> Forward Message
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-zinc-300 italic">
            "{forwardMsg?.content?.slice(0, 120)}"
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500">Destination Channel ID</label>
            <Input
              value={forwardDest}
              onChange={e => setForwardDest(e.target.value)}
              placeholder="e.g. myserver-general or dm-userId"
              className="bg-black/60 border-white/5 text-xs text-white animate-none"
            />
            <p className="text-[9px] text-zinc-600 font-bold">Enter the channelId of the destination channel or DM.</p>
          </div>
          <Button
            onClick={handleForwardMessage}
            className="w-full mt-4 h-11 bg-primary hover:bg-primary/90 text-black font-black uppercase text-xs tracking-widest rounded-xl border-none"
          >
            Forward
          </Button>
        </DialogContent>
      </Dialog>

      {/* Feature 15: Reaction tooltip */}
      {reactionTooltip && (
        <div
          className="fixed z-[998] pointer-events-none"
          style={{ left: reactionTooltip.x, top: reactionTooltip.y - 8 }}
        >
          <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-zinc-300 shadow-2xl -translate-y-full">
            {reactionTooltip.emoji} reacted by:{" "}
            {getReactorNames(
              (messages?.find(m => m.id === reactionTooltip.msgId)?.reactions?.find((r: any) => r.emoji === reactionTooltip.emoji)?.uids) || []
            ).join(", ")}
          </div>
        </div>
      )}

      {/* CHANNEL HEADER */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-xl z-20 shadow-lg shrink-0">
         <div className="flex items-center gap-4">
            {isAnnouncements ? (
              <Radio className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <Hash className="w-5 h-5 text-primary shrink-0" />
            )}
            <div className="text-left">
              <h3 className="text-sm font-black italic uppercase tracking-tighter truncate text-white leading-none">{channelName}</h3>
              <p className="text-[9px] font-bold text-zinc-500 mt-1 uppercase tracking-widest truncate max-w-[150px] sm:max-w-md">
                {channelTopic}
              </p>
            </div>
         </div>
         <div className="flex items-center gap-4 md:gap-6">
            <div className="relative group max-w-[140px] sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="bg-black/40 border-white/5 h-9 rounded-xl pl-9 pr-3 text-xs font-bold text-white focus:border-primary uppercase placeholder:text-zinc-600 animate-none"
              />
            </div>
            
            <Button 
              onClick={() => setShowPinnedDrawer(true)} 
              variant="ghost" 
              className={cn("h-9 w-9 p-0 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl relative", pinnedMessagesList.length > 0 && "text-amber-500")}
              title="Pinned Messages"
            >
              <Pin className="w-4 h-4" />
              {pinnedMessagesList.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {pinnedMessagesList.length}
                </span>
              )}
            </Button>
            
            <Button 
              onClick={() => setShowBookmarks(!showBookmarks)} 
              variant="ghost" 
              className={cn("h-9 w-9 p-0 hover:bg-white/5 text-zinc-400 hover:text-amber-400 rounded-xl relative", showBookmarks && "text-amber-500")}
              title="Bookmarks"
            >
              <Bookmark className="w-4 h-4" />
            </Button>

            <Button 
              onClick={() => setShowDocsModal(true)} 
              variant="ghost" 
              className={cn("h-9 w-9 p-0 hover:bg-white/5 text-zinc-400 hover:text-emerald-400 rounded-xl relative", showDocsModal && "text-emerald-500")}
              title="Co-edit Document"
            >
              <FileText className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={() => { setCallType("video"); setShowCallModal(true); }} 
              variant="ghost" 
              className="h-9 w-9 p-0 hover:bg-white/5 text-zinc-400 hover:text-blue-400 rounded-xl relative"
              title="Start Call"
            >
              <Video className="w-4 h-4" />
            </Button>

            <Button 
              onClick={() => setShowLeaderboard(true)} 
              variant="ghost" 
              className={cn("h-9 w-9 p-0 hover:bg-white/5 text-zinc-400 hover:text-orange-400 rounded-xl relative", showLeaderboard && "text-orange-500")}
              title="Streaks Leaderboard"
            >
              <Flame className="w-4 h-4" />
            </Button>

            {serverName !== "xakteir" && hasPermission("manageChannels") && (
              <Button 
                onClick={() => setShowChannelSettingsModal(true)} 
                variant="ghost" 
                className="h-9 w-9 p-0 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl"
                title="Channel Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}

            {/* Member List Toggle */}
            <Button
              onClick={() => setShowMemberPanel(p => !p)}
              variant="ghost"
              className={cn("h-9 w-9 p-0 hover:bg-white/5 rounded-xl transition-colors", showMemberPanel ? "text-primary" : "text-zinc-400 hover:text-white")}
              title="Member List"
            >
              <Users className="w-4 h-4" />
            </Button>

            <Button onClick={handleCatchUp} variant="ghost" className="h-9 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 hidden sm:flex">
               <Brain className="w-3.5 h-3.5" /> Catch Me Up
            </Button>
         </div>
      </header>

      {/* AI Summary Box */}
      {aiSummary && (
        <div className="mx-8 mt-4 p-5 bg-primary/10 border-2 border-primary/20 rounded-2xl relative text-left animate-in slide-in-from-top duration-300">
          <button onClick={() => setAiSummary(null)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          <h4 className="text-xs font-black uppercase italic tracking-wider text-primary flex items-center gap-1.5 mb-2">
            <Brain className="w-4 h-4 animate-pulse" /> Xak AI Summary recap
          </h4>
          <p className="text-xs leading-relaxed text-zinc-300 font-medium whitespace-pre-line">{aiSummary}</p>
        </div>
      )}

      {/* Main layout: messages + optional side panels */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* MESSAGES SCROLL AREA */}
        <ScrollArea className="flex-1 p-8" ref={scrollRef}>
          {serverDoc?.announcements && (
            <div className="mx-auto max-w-5xl mb-4 p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-500 text-xs font-bold text-center">
              📢 {serverDoc.announcements}
            </div>
          )}
           <div className="max-w-5xl mx-auto space-y-8 pb-20 relative">
              {isMessagesLoading ? (
                <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>
              ) : filteredMessages.length === 0 ? (
                <div className="py-40 text-center space-y-6 opacity-20 italic">
                   <MessageCircle className="w-16 h-16 mx-auto text-primary" />
                   <p className="text-sm font-black uppercase tracking-[0.4em]">{messageSearchQuery.trim() ? "No results found" : "Initialize Conversation"}</p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isOwn = msg.senderId === user.uid;
                  const translated = translatedTexts[msg.id];
                  
                  return (
                    <div 
                      key={msg.id} 
                      id={`msg-${msg.id}`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setCustomContextMenu({ msg, x: e.clientX, y: e.clientY });
                      }}
                      className={cn("flex gap-5 group relative transition-all duration-500", isOwn && "flex-row-reverse")}
                    >
                       <div className="relative shrink-0 text-left">
                         <RenderHat hatKey={msg.senderHat} />
                         <button
                           type="button"
                           onClick={() => setProfileCard(msg)}
                           className="block focus:outline-none"
                           title="View Profile"
                         >
                           <Avatar className="w-11 h-11 rounded-[1.1rem] border-2 border-white/5 bg-zinc-900 hover:border-primary/40 transition-colors">
                              <AvatarImage src={msg.senderPhoto} className="object-cover" />
                              <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">{msg.senderName?.[0]}</AvatarFallback>
                           </Avatar>
                         </button>
                       </div>
                       <div className={cn("flex flex-col space-y-1.5 max-w-[70%]", isOwn && "items-end")}>
                          <button
                            type="button"
                            onClick={() => setProfileCard(msg)}
                            className={cn("text-[9px] font-black uppercase italic tracking-widest px-2 focus:outline-none hover:underline", getSenderColor(msg.senderId))}
                          >
                            {msg.senderName}
                          </button>
                          
                          {/* Reply reference block */}
                          {msg.replyTo && (
                            <div 
                              onClick={() => {
                                const originEl = document.getElementById(`msg-${msg.replyTo.id}`);
                                if (originEl) {
                                  originEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  originEl.classList.add('bg-white/10');
                                  setTimeout(() => originEl.classList.remove('bg-white/10'), 1500);
                                } else {
                                  toast({ description: "Original message not found." });
                                }
                              }}
                              className="text-[10px] text-zinc-400 bg-white/5 border-l-2 border-primary/45 px-3 py-1 rounded-r-lg max-w-md cursor-pointer hover:bg-white/10 transition-colors italic mb-0.5 flex items-center gap-1.5"
                              title="Jump to reply origin"
                            >
                              <span className="font-black text-primary">@{msg.replyTo.senderName}</span>
                              <span className="truncate font-medium">"{msg.replyTo.content}"</span>
                            </div>
                          )}

                          {/* Feature 7: Forwarded header */}
                          {msg.forwardedFrom && (
                            <div className="text-[9px] text-zinc-500 font-black uppercase italic px-2 flex items-center gap-1">
                              <Share2 className="w-2.5 h-2.5" /> ↩ Forwarded from #{msg.forwardedFrom.channelName} · {msg.forwardedFrom.serverName}
                            </div>
                          )}

                          {/* Feature 11: Scheduled label */}
                          {msg.status === "scheduled" && msg.scheduledFor && (
                            <div className="text-[9px] text-amber-400 font-black uppercase italic px-2 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> [Scheduled for {new Date(msg.scheduledFor).toLocaleString()}]
                            </div>
                          )}

                          <div className="relative">
                            {editingMessageId === msg.id ? (
                              <div className="p-3 bg-zinc-900 border border-primary/30 rounded-[1.5rem] space-y-2 text-left">
                                <Input 
                                  value={editInput} 
                                  onChange={(e) => setEditInput(e.target.value)} 
                                  className="bg-black text-xs text-white border-white/10 h-8"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveEdit(msg.id)} className="h-7 text-[9px] uppercase font-black bg-emerald-600 hover:bg-emerald-500">Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)} className="h-7 text-[9px] uppercase font-black text-zinc-400 border border-white/5">Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Feature 6: Poll render */}
                                {msg.type === "poll" ? (
                                  <div className="p-4 bg-[#18181b] border border-white/5 rounded-[1.8rem] space-y-3 min-w-[220px] max-w-[320px] text-left">
                                    <div className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-1">
                                      <BarChart2 className="w-3 h-3" /> POLL
                                    </div>
                                    <p className="text-sm font-black text-white">{msg.pollQuestion}</p>
                                    <div className="space-y-2">
                                      {(msg.pollOptions || []).map((opt: any, idx: number) => {
                                        const totalVotes = (msg.pollOptions || []).reduce((acc: number, o: any) => acc + (o.votes || 0), 0);
                                        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                                        const voted = (opt.voters || []).includes(user.uid);
                                        return (
                                          <button
                                            key={idx}
                                            onClick={() => handlePollVote(msg.id, idx, msg.pollOptions)}
                                            disabled={voted}
                                            className={cn(
                                              "w-full relative text-left px-3 py-2 rounded-xl text-xs font-bold border transition-all overflow-hidden",
                                              voted ? "border-primary/40 text-white" : "border-white/10 text-zinc-400 hover:border-primary/30 hover:text-white"
                                            )}
                                          >
                                            <div className="absolute inset-0 rounded-xl bg-primary/10 transition-all" style={{ width: `${pct}%` }} />
                                            <span className="relative z-10 flex justify-between">
                                              <span>{opt.text}</span>
                                              <span className="text-[9px] font-black text-primary">{pct}% ({opt.votes})</span>
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : msg.type === "audio" ? (
                                  /* Feature 10: Audio message */
                                  <div className="p-3 bg-[#18181b] border border-white/5 rounded-[1.8rem]">
                                    <div className="text-[9px] font-black uppercase text-primary mb-2 flex items-center gap-1">
                                      <Mic className="w-3 h-3" /> VOICE MESSAGE
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <audio id={`audio-${msg.id}`} controls src={msg.content} className="max-w-[260px] h-8" style={{ filter: 'invert(1) hue-rotate(180deg)' }} />
                                      <button onClick={() => {
                                        const aud = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                                        if (aud) {
                                          if (aud.playbackRate === 1) aud.playbackRate = 1.5;
                                          else if (aud.playbackRate === 1.5) aud.playbackRate = 2;
                                          else aud.playbackRate = 1;
                                        }
                                      }} className="px-2 py-1 bg-white/10 text-[10px] font-bold rounded">Speed</button>
                                    </div>
                                    <button onClick={(e) => {
                                      const btn = e.target as HTMLButtonElement;
                                      const div = btn.nextElementSibling as HTMLDivElement;
                                      div.classList.toggle('hidden');
                                    }} className="mt-2 text-[10px] text-zinc-400 hover:text-white underline">Transcribe</button>
                                    <div className="hidden mt-2 p-2 bg-white/5 rounded text-xs text-zinc-300 italic">
                                      [AI Transcription]: "Mocked audio transcription text."
                                    </div>
                                  </div>
                                ) : msg.type === "sticker" ? (
                                  /* Feature 8: Sticker */
                                  <div className="text-6xl select-none p-2">{msg.content}</div>
                                ) : (
                                  <div className={cn(
                                    "p-5 rounded-[1.8rem] shadow-2xl border transition-all text-sm font-medium leading-relaxed text-left",
                                    isOwn ? "bg-primary text-white border-primary/20 rounded-tr-none" : "bg-[#18181b] border-white/5 rounded-tl-none text-foreground/90"
                                  )}>
                                     {isImageUrl(msg.content) ? (
                                       <img
                                         src={msg.content}
                                         alt="media"
                                         className="rounded-2xl max-w-full max-h-60 object-contain border border-white/10 cursor-zoom-in hover:opacity-90 transition-opacity"
                                         onClick={() => setLightboxImage(msg.content)}
                                       />
                                     ) : (
                                       renderMarkdown(msg.content)
                                     )}

                                     {msg.e2e && <Lock className="w-3 h-3 text-emerald-400 inline mr-1" />}

                                     {/* Edited Tag */}
                                     {msg.edited && <span className="text-[7px] opacity-40 ml-2 font-black uppercase italic">(edited)</span>}
                                     
                                     {/* Pinned Icon Tag */}
                                     {msg.pinned && <Pin className="w-3 h-3 text-amber-500 absolute top-2 right-2 rotate-45" />}

                                     {/* Translated text overlay */}
                                     {translated && (
                                       <div className="mt-3 pt-2 border-t border-white/10 text-xs text-emerald-400 font-bold">
                                         <Globe className="w-3 h-3 inline mr-1.5 animate-pulse" /> {translated}
                                       </div>
                                     )}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Action Hover Tool Bar */}
                            {!editingMessageId && (
                              <div className={cn(
                                "absolute -top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-[#0a0a15] border border-white/10 rounded-full px-2.5 py-1.5 shadow-2xl gap-2 z-30",
                                isOwn ? "left-0" : "right-0"
                              )}>
                                {/* Reaction Emoji Picker */}
                                <ReactionPicker onSelect={(emoji) => handleReact(msg.id, emoji)} />
                                
                                <div className="w-px h-3 bg-white/10 mx-1" />
                                <button onClick={() => setActiveThreadMessage(msg)} className="text-zinc-400 hover:text-white hover:scale-110 transition-all" title="Threaded Reply"><CornerUpLeft className="w-3 h-3" /></button>
                                <button onClick={() => handleTogglePin(msg.id, msg.pinned)} className={cn("text-zinc-400 hover:text-white hover:scale-110 transition-all", msg.pinned && "text-amber-500")} title="Pin Message"><Pin className="w-3 h-3" /></button>
                                
                                {/* Feature 3: Copy */}
                                <button onClick={() => handleCopyMessage(msg.content)} className="text-zinc-400 hover:text-white hover:scale-110 transition-all" title="Copy Message"><Copy className="w-3 h-3" /></button>

                                {/* Feature 5: Bookmark */}
                                <button onClick={() => handleBookmarkMessage(msg)} className="text-zinc-400 hover:text-amber-400 hover:scale-110 transition-all" title="Bookmark"><Bookmark className="w-3 h-3" /></button>

                                {/* Feature 7: Forward */}
                                <button onClick={() => setForwardMsg(msg)} className="text-zinc-400 hover:text-primary hover:scale-110 transition-all" title="Forward"><Share2 className="w-3 h-3" /></button>

                                {/* Feature 12: Thread */}
                                <button onClick={() => setActiveThread(msg)} className="text-zinc-400 hover:text-emerald-400 hover:scale-110 transition-all" title="Open Thread"><MessageSquare className="w-3 h-3" /></button>
                                
                                {/* Translation menu dropdown */}
                                <div className="relative group/lang">
                                  <button className="text-zinc-400 hover:text-white hover:scale-110 transition-all" title="AI Translate"><Globe className="w-3 h-3" /></button>
                                  <div className="absolute bottom-full mb-2 hidden group-hover/lang:flex flex-col bg-zinc-950 border border-white/10 rounded-xl p-1 shadow-2xl text-[8px] font-black uppercase text-left whitespace-nowrap z-50">
                                    {['Spanish', 'French', 'Japanese', 'Arabic'].map(l => (
                                      <button key={l} onClick={() => handleTranslate(msg.id, msg.content, l)} className="px-2 py-1 rounded hover:bg-white/5 text-zinc-300 hover:text-white">{l}</button>
                                    ))}
                                  </div>
                                </div>

                                {isOwn && (
                                  <>
                                    <button onClick={() => { setEditingMessageId(msg.id); setEditInput(msg.content); }} className="text-zinc-400 hover:text-emerald-400 hover:scale-110 transition-all" title="Edit message"><Edit className="w-3 h-3" /></button>
                                    <button onClick={() => handleDeleteMessage(msg.id)} className="text-zinc-400 hover:text-red-500 hover:scale-110 transition-all" title="Delete message"><Trash2 className="w-3 h-3" /></button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Render Reactions display badges */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {msg.reactions.map((r: any) => {
                                const reacted = r.uids?.includes(user.uid);
                                return (
                                  <button
                                    key={r.emoji}
                                    onClick={() => handleReact(msg.id, r.emoji)}
                                    onDoubleClick={() => {
                                      triggerExplosion(r.emoji);
                                    }}
                                    onMouseEnter={(e) => {
                                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                                      setReactionTooltip({ msgId: msg.id, emoji: r.emoji, x: rect.left, y: rect.top });
                                    }}
                                    onMouseLeave={() => setReactionTooltip(null)}
                                    className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all",
                                      reacted 
                                        ? "bg-primary/20 border-primary text-white scale-105" 
                                        : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                                    )}
                                  >
                                    <span>{r.emoji}</span>
                                    <span className="text-[8px] font-black">{r.uids?.length || 0}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                       </div>
                    </div>
                  );
                })
              )}
           </div>
        </ScrollArea>

        {/* Custom Right-Click Context Menu */}
        {customContextMenu && (
          <div 
            className="fixed z-[1000] bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 min-w-[160px]"
            style={{ top: customContextMenu.y, left: customContextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-white/5 bg-white/5">
              <p className="text-[9px] font-black uppercase text-primary tracking-widest truncate">
                {customContextMenu.msg.senderName}
              </p>
            </div>
            
            <button 
              className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-primary/20 text-white flex items-center gap-2"
              onClick={() => { setReplyingToMessage(customContextMenu.msg); setCustomContextMenu(null); }}
            >
              <CornerUpLeft className="w-3.5 h-3.5" /> Reply
            </button>

            <button 
              className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-primary/20 text-white flex items-center gap-2"
              onClick={() => { setActiveThread(customContextMenu.msg); setCustomContextMenu(null); }}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Open Thread
            </button>
            
            <button 
              className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-primary/20 text-white flex items-center gap-2"
              onClick={() => { handleCopyMessage(customContextMenu.msg.content); setCustomContextMenu(null); }}
            >
              <Copy className="w-3.5 h-3.5" /> Copy Text
            </button>

            <button 
              className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-amber-500/20 text-white flex items-center gap-2"
              onClick={() => { handleTogglePin(customContextMenu.msg.id, customContextMenu.msg.pinned); setCustomContextMenu(null); }}
            >
              <Pin className="w-3.5 h-3.5" /> {customContextMenu.msg.pinned ? "Unpin" : "Pin Message"}
            </button>

            {customContextMenu.msg.senderId === user.uid && (
              <>
                <div className="h-px bg-white/5 my-1" />
                <button 
                  className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-emerald-500/20 text-white flex items-center gap-2"
                  onClick={() => { setEditingMessageId(customContextMenu.msg.id); setEditInput(customContextMenu.msg.content); setCustomContextMenu(null); }}
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Message
                </button>
                <button 
                  className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-red-500/20 text-red-400 flex items-center gap-2"
                  onClick={() => { handleDeleteMessage(customContextMenu.msg.id); setCustomContextMenu(null); }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Message
                </button>
              </>
            )}
          </div>
        )}

        {/* Feature 12: Thread Side Panel */}
        {activeThread && (
          <div className="absolute right-0 top-0 h-full w-80 bg-zinc-950 border-l border-white/5 z-40 flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-primary">Thread</p>
                <p className="text-xs font-bold text-zinc-400 truncate max-w-[200px]">
                  {activeThread.senderName}: {activeThread.content?.slice(0, 40)}
                </p>
              </div>
              <button onClick={() => setActiveThread(null)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Root message */}
                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-xs text-zinc-300 italic">
                  <span className="text-[8px] font-black text-primary uppercase">{activeThread.senderName}</span>
                  <br />
                  {activeThread.content}
                </div>
                {/* Thread replies */}
                {threadReplies && threadReplies.length > 0 ? (
                  threadReplies.map((r: any) => (
                    <div key={r.id} className="flex gap-2">
                      <Avatar className="w-7 h-7 rounded-xl shrink-0">
                        <AvatarImage src={r.senderPhoto} />
                        <AvatarFallback className="bg-primary/20 text-primary font-black text-[8px]">{r.senderName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[8px] font-black uppercase text-zinc-400">{r.senderName}</p>
                        <p className="text-xs text-zinc-300">{r.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-zinc-600 italic text-center py-4">No replies yet. Be first!</p>
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-white/5 flex gap-2">
              <Input
                value={threadInput}
                onChange={e => setThreadInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendThreadReply(); }}
                placeholder="Reply in thread..."
                className="flex-1 bg-black/40 border-white/5 text-xs text-white animate-none h-9"
              />
              <Button size="icon" onClick={handleSendThreadReply} className="h-9 w-9 bg-primary rounded-xl shrink-0 border-none">
                <Send className="w-3.5 h-3.5 text-white" />
              </Button>
            </div>
          </div>
        )}

        {/* Member List Panel */}
        {showMemberPanel && (
          <div className="w-60 border-l border-white/5 bg-zinc-950/80 backdrop-blur-xl flex flex-col shrink-0">
            <div className="p-4 border-b border-white/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary">Members</p>
              <p className="text-[8px] text-zinc-600 font-bold">{(serverDoc?.members || []).length} total</p>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-1">
                {(hubMembers || allUsers || [])
                  .filter((u: any) => !serverDoc?.members || serverDoc.members.includes(u.id))
                  .map((member: any) => {
                    const isOnline = member.lastSeen
                      ? (Date.now() / 1000 - (member.lastSeen?.seconds || 0)) < 300
                      : false;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setProfileCard({ ...member, senderName: member.displayName || member.username, senderPhoto: member.photoURL })}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="relative shrink-0">
                          <Avatar className="w-7 h-7 rounded-xl">
                            <AvatarImage src={member.photoURL} />
                            <AvatarFallback className="bg-primary/20 text-primary font-black text-[8px]">
                              {(member.displayName || member.username || "?")?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-950",
                            isOnline ? "bg-emerald-500" : "bg-zinc-600"
                          )} />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-300 truncate">
                          {member.displayName || member.username || "Member"}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom button */}
      {showScrollBottomBtn && (
        <button 
          onClick={handleScrollToBottom}
          className="absolute bottom-24 right-8 w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 border-none animate-bounce"
          title="Scroll to Bottom"
        >
          <ArrowDown className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Pinned Messages Drawer Modal */}
      <Dialog open={showPinnedDrawer} onOpenChange={setShowPinnedDrawer}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-lg text-white p-8 bg-zinc-950/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic text-white flex items-center gap-2">
              <Pin className="w-5 h-5 text-amber-500 animate-bounce" /> Pinned Channel Items
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[350px] mt-4 p-2">
            {pinnedMessagesList.length === 0 ? (
              <p className="text-xs text-white/35 italic text-center py-10">No items pinned in this channel.</p>
            ) : (
              pinnedMessagesList.map(m => (
                <div key={m.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl mb-3 flex items-start justify-between gap-3 text-left">
                  <div>
                    <span className="text-[9px] font-black uppercase text-zinc-400">@{m.senderName}</span>
                    <p className="text-xs mt-1 text-zinc-300 font-medium italic">"{m.content}"</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleTogglePin(m.id, true)} 
                    className="h-8 px-2 text-[8px] font-black uppercase text-red-500 hover:bg-red-500/10 rounded-lg shrink-0 border-none"
                  >
                    Unpin
                  </Button>
                </div>
              ))
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Channel Settings / Deletion Modal */}
      <Dialog open={showChannelSettingsModal} onOpenChange={setShowChannelSettingsModal}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-white p-8 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Channel Configuration
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-500">Channel Name</label>
              <Input 
                value={editChannelName} 
                onChange={(e) => setEditChannelName(e.target.value)} 
                disabled={channelName === 'general'}
                className="bg-black/60 border-white/5 text-xs animate-none text-white" 
              />
              {channelName === 'general' && <p className="text-[8px] text-zinc-600 font-bold">The general channel name is locked.</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-500">Topic / Description</label>
              <textarea
                value={editChannelTopic}
                onChange={(e) => setEditChannelTopic(e.target.value)}
                placeholder="Describe this channel's purpose..."
                className="w-full h-20 bg-black/60 border border-white/5 rounded-lg text-xs p-2 text-white focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button 
                onClick={handleUpdateChannel} 
                disabled={isSavingChannel}
                className="w-full h-11 bg-primary hover:bg-primary/95 text-black font-black uppercase text-[10px] rounded-xl shadow-lg border-none"
              >
                {isSavingChannel ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null} Save Configuration
              </Button>
              
              {channelName !== 'general' && (
                <Button 
                  onClick={handleDeleteChannel} 
                  disabled={isDeletingChannel}
                  variant="ghost"
                  className="w-full h-11 bg-rose-600/10 hover:bg-rose-600 hover:text-white text-rose-500 font-black uppercase text-[10px] rounded-xl border border-rose-500/20"
                >
                  {isDeletingChannel ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null} Delete Channel
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            className="bg-black border-white/10 text-xs text-white animate-none" 
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

      {/* Feature 8: Sticker Picker */}
      {showStickerPicker && (
        <div className="absolute bottom-24 right-20 bg-[#0a0a15] border-2 border-white/10 rounded-[2rem] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Stickers</span>
            <button onClick={() => setShowStickerPicker(false)} className="text-white/40 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {STICKERS.map(s => (
              <button
                key={s}
                onClick={() => handleSendSticker(s)}
                className="text-4xl hover:scale-110 transition-transform w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/5"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature 11: Schedule picker overlay */}
      {showSchedulePicker && (
        <div className="absolute bottom-24 right-36 bg-[#0a0a15] border-2 border-white/10 rounded-[2rem] p-4 shadow-2xl z-50 w-72">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Schedule Message</span>
            <button onClick={() => setShowSchedulePicker(false)} className="text-white/40 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>
          <input
            type="datetime-local"
            value={scheduleDateTime}
            onChange={e => setScheduleDateTime(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            style={{ colorScheme: 'dark' }}
          />
          <p className="text-[8px] text-zinc-600 font-bold mt-2">Message will be marked as scheduled. Send as normal to save.</p>
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
           <div className="max-w-5xl mx-auto space-y-3">
             {/* Feature 13: Slow mode countdown */}
             {slowModeCountdown > 0 && (
               <div className="text-[10px] text-amber-400 font-black uppercase tracking-widest pl-2 flex items-center gap-1 animate-pulse">
                 <Clock className="w-3 h-3" /> ⏳ Wait {slowModeCountdown}s (Slow Mode)
               </div>
             )}

             {/* Replying indicator */}
             {replyingToMessage && (
               <div className="px-5 py-2.5 bg-black/40 border border-white/5 border-b-0 rounded-t-[1.8rem] flex items-center justify-between text-xs text-zinc-400">
                 <div className="flex items-center gap-2">
                   <span>Replying to <strong>@{replyingToMessage.senderName}</strong></span>
                   <span className="truncate max-w-[200px] italic opacity-60">"{replyingToMessage.content}"</span>
                 </div>
                 <button onClick={() => setReplyingToMessage(null)} className="text-white/40 hover:text-white"><X className="w-3.5 h-3.5" /></button>
               </div>
             )}

             {/* Image file select preview */}
             {imagePreview && (
               <div className="p-4 bg-black/45 border border-white/5 rounded-t-[1.8rem] flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <img src={imagePreview} alt="upload preview" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                   <span className="text-[10px] font-black uppercase text-emerald-400">Image Ready to Send</span>
                 </div>
                 <button 
                   type="button" 
                   onClick={() => {
                     setImagePreview(null);
                     if (imageInputRef.current) imageInputRef.current.value = "";
                   }} 
                   className="text-red-500 hover:text-red-400 text-xs font-black uppercase border-none"
                 >
                   Remove
                 </button>
               </div>
             )}


             {/* Typing indicator message */}
             {activeTypingUsers && activeTypingUsers.length > 0 && (
               <div className="flex items-center gap-2 pl-2 animate-pulse">
                 <div className="flex -space-x-2">
                   {activeTypingUsers.map((u: any, i: number) => (
                      <Avatar key={i} className="w-5 h-5 border border-zinc-950">
                        <AvatarFallback className="bg-primary/20 text-[8px]">{u.username?.[0]}</AvatarFallback>
                      </Avatar>
                   ))}
                 </div>
                 <span className="text-[10px] text-zinc-400 italic">typing...</span>
               </div>
             )}

             {/* Toxicity warnings banner */}
             {toxicityWarning && (
               <div className="text-[10px] text-rose-500 font-bold pl-2 text-left animate-bounce">
                 {toxicityWarning}
               </div>
             )}

             {/* Feature 1: Formatting toolbar */}
             <div className="flex gap-1.5 px-2">
               {[
                 { label: "B", wrapper: "*", title: "Bold" },
                 { label: "I", wrapper: "_", title: "Italic" },
                 { label: "S", wrapper: "~", title: "Strikethrough" },
                 { label: "</>", wrapper: "`", title: "Code" }
               ].map(({ label, wrapper, title }) => (
                 <button
                   key={label}
                   type="button"
                   onClick={() => wrapSelection(wrapper)}
                   title={title}
                   className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-zinc-400 hover:text-white transition-all"
                 >
                   {label}
                 </button>
               ))}
               <div className="flex-1" />
               
               {/* Privacy Toggles */}
               <div className="flex gap-2 mr-2">
                 <button
                   type="button"
                   onClick={() => setE2eEnabled(!e2eEnabled)}
                   className={cn("px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded-lg transition-all flex items-center gap-1", e2eEnabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-white/5 text-zinc-500 border-white/5 hover:text-white")}
                   title="End-to-End Encryption"
                 >
                   E2E
                 </button>
                 <button
                   type="button"
                   onClick={() => setDisappearingMessages(!disappearingMessages)}
                   className={cn("px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded-lg transition-all flex items-center gap-1", disappearingMessages ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-white/5 text-zinc-500 border-white/5 hover:text-white")}
                   title="Disappearing Messages (24h)"
                 >
                   <Clock className="w-2.5 h-2.5" /> 24H
                 </button>
               </div>

               <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest self-center">Formatting & Privacy</span>
             </div>

             <form onSubmit={(e) => handleSend(e)} className="flex items-end gap-3 md:gap-4">
                <div className="flex-1 bg-black/40 border-2 border-white/10 rounded-[1.8rem] p-2 md:p-3 flex items-center gap-3 md:gap-4 relative">
                   <input 
                     type="file" 
                     accept="image/*" 
                     ref={imageInputRef} 
                     onChange={handleImageSelect} 
                     className="hidden" 
                   />
                   
                   <button 
                      type="button" 
                      onClick={() => imageInputRef.current?.click()} 
                      className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"
                      title="Upload Image"
                   >
                     <Paperclip className="w-4 h-4" />
                   </button>

                   <button 
                      type="button" 
                      onClick={() => setShowGifPicker(!showGifPicker)} 
                      className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-black text-white/40 hover:text-white transition-all shrink-0"
                      title="GIF Picker"
                   >
                     GIF
                   </button>

                   {/* Feature 8: Sticker button */}
                   <button
                     type="button"
                     onClick={() => setShowStickerPicker(!showStickerPicker)}
                     className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0 text-base"
                     title="Stickers"
                   >
                     😄
                   </button>

                   {/* Feature 10: Voice recording button */}
                   <button
                     type="button"
                     onClick={isRecording ? handleStopRecording : handleStartRecording}
                     className={cn(
                       "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                       isRecording
                         ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse"
                         : "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white"
                     )}
                     title={isRecording ? "Stop Recording" : "Record Voice Message"}
                   >
                     {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                   </button>

                   {/* Feature 11: Schedule button */}
                   <button
                     type="button"
                     onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                     className={cn(
                       "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                       showSchedulePicker || scheduleDateTime
                         ? "bg-amber-500/20 text-amber-400"
                         : "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white"
                     )}
                     title="Schedule Message"
                   >
                     <Clock className="w-4 h-4" />
                   </button>

                   <div className="relative flex-1">
                     {/* @mention autocomplete dropdown */}
                     {showMentionList && mentionCandidates.length > 0 && (
                       <div className="absolute bottom-full mb-2 left-0 w-64 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                         <div className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-primary border-b border-white/5">Mention a member</div>
                         {mentionCandidates.map((u: any) => (
                           <button
                             key={u.id}
                             type="button"
                             onClick={() => handleSelectMention(u.username)}
                             className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 text-left transition-colors"
                           >
                             <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-black text-primary shrink-0">
                               {(u.displayName || u.username || "?")[0].toUpperCase()}
                             </div>
                             <span className="text-xs font-bold text-white">@{u.username}</span>
                           </button>
                         ))}
                       </div>
                     )}
                     <Input
                       id="server-chat-input"
                       ref={chatInputRef}
                       value={chatInput} 
                       onChange={(e) => {
                         handleInputChange(e.target.value);
                         // Update mention candidates from already-loaded users list
                         const m = e.target.value.match(/@([\w]*)$/);
                         if (m) {
                           const q = m[1].toLowerCase();
                           setMentionCandidates(
                             (allUsers || []).filter((u: any) => 
                               u.username?.toLowerCase().startsWith(q) ||
                               u.displayName?.toLowerCase().startsWith(q)
                             ).slice(0, 6)
                           );
                         } else {
                           setMentionCandidates([]);
                         }
                       }} 
                       placeholder={`Message #${channelName}... (type @ to mention, /poll Q|A|B for polls)`} 
                       className="border-none bg-transparent focus-visible:ring-0 text-white text-sm italic placeholder:text-white/20 animate-none" 
                     />
                   </div>

                   <button type="button" className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"><Smile className="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>
                <Button type="submit" size="icon" className="h-12 w-12 md:h-16 md:w-16 bg-primary rounded-[1rem] md:rounded-[1.5rem] shadow-2xl active:scale-90 flex items-center justify-center shrink-0 border-none"><Send className="w-5 h-5 md:w-6 md:h-6 text-white" /></Button>
             </form>
            </div>
          )}
       </div>

      {/* Thread Panel */}
      {activeThreadMessage && (
        <ThreadPanel 
          message={activeThreadMessage} 
          onClose={() => setActiveThreadMessage(null)} 
          channelId={channel?.id} 
        />
      )}

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <BookmarksPanel 
          onClose={() => setShowBookmarks(false)} 
        />
      )}
    </main>
  );
}

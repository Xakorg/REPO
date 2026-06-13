"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { 
  MessageCircle, 
  Send, 
  Smile, 
  Loader2, 
  Brain,
  ShieldAlert,
  X,
  Phone,
  Video,
  Globe,
  Search,
  Pin,
  Edit,
  Trash2,
  CornerUpLeft,
  Paperclip,
  ArrowDown,
  Lock,
  Copy,
  Bookmark,
  Forward,
  Clock,
  Mic
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, limit, doc, getDoc, setDoc, updateDoc, deleteDoc, where, addDoc, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { RenderHat } from "@/components/RenderHat";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function DirectMessagePage() {
  const params = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const personName = (params.personName as string) || "";

  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dmChatId, setDmChatId] = useState<string | null>(null);

  // Upgrade state variables
  const [explosions, setExplosions] = useState<{ id: number; emoji: string; left: number }[]>([]);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
  const [spamMuteUntil, setSpamMuteUntil] = useState(0);

  // Scroll to bottom btn state
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Typing indicators
  const [lastTypedAt, setLastTypedAt] = useState(0);

  // GIF Picker states
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifs, setGifs] = useState<string[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  // @mention autocomplete states
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionCandidates, setMentionCandidates] = useState<any[]>([]);

  // ── Feature 1: Read Receipts ──
  const [chatDocData, setChatDocData] = useState<any>(null);

  // ── Feature 3: Image Lightbox ──
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // ── Feature 5: Profile Card Popup ──
  const [profileCard, setProfileCard] = useState<any | null>(null);

  // ── Feature 7: Poll creation ──
  // (no extra state needed beyond messages)

  // ── Feature 8: Sticker Picker ──
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const STICKERS = ["🎉", "🔥", "💯", "👋", "😂", "🤯", "🎮", "❤️"];

  // ── Feature 9: Voice Recording ──
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ── Feature 10: Message Scheduling ──
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");

  // ── Feature 11: Message Forwarding ──
  const [forwardMessage, setForwardMessage] = useState<any | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  // ── Feature 12: Reaction Analytics Tooltip ──
  const [reactionTooltip, setReactionTooltip] = useState<{ msgId: string; emoji: string; names: string[] } | null>(null);

  // Users list for @mention autocomplete (loaded lazily)
  const allUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), limit(50));
  }, [firestore]);
  const { data: allUsers } = useCollection(allUsersQuery);

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

  // ── Feature 1: Subscribe to chat doc for read receipts ──
  useEffect(() => {
    if (!firestore || !dmChatId) return;
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { onSnapshot } = await import("firebase/firestore");
        const dmRef = doc(firestore, "chats", dmChatId);
        unsub = onSnapshot(dmRef, (snap) => {
          if (snap.exists()) setChatDocData(snap.data());
        });
      } catch (e) {
        console.error("Read receipt listener error:", e);
      }
    })();
    return () => { if (unsub) unsub(); };
  }, [firestore, dmChatId]);

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

  // 5. Query friendships to see if they are accepted friends
  const friendshipQuery1 = useMemoFirebase(() => {
    if (!firestore || !user || !friendUser) return null;
    return query(
      collection(firestore, "friendships"),
      where("status", "==", "accepted"),
      where("requesterId", "==", user.uid),
      where("recipientId", "==", friendUser.id)
    );
  }, [firestore, user, friendUser]);

  const friendshipQuery2 = useMemoFirebase(() => {
    if (!firestore || !user || !friendUser) return null;
    return query(
      collection(firestore, "friendships"),
      where("status", "==", "accepted"),
      where("requesterId", "==", friendUser.id),
      where("recipientId", "==", user.uid)
    );
  }, [firestore, user, friendUser]);

  const { data: friendship1 } = useCollection(friendshipQuery1);
  const { data: friendship2 } = useCollection(friendshipQuery2);

  const isFriends = useMemo(() => {
    return (friendship1 && friendship1.length > 0) || (friendship2 && friendship2.length > 0);
  }, [friendship1, friendship2]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  // Listen to viewport scrolling for scroll-to-bottom anchor visibility
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

  // Fetch Gifs from GIPHY
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

  // ── Feature 10: Scheduled messages check every 30s ──
  useEffect(() => {
    if (!firestore || !dmChatId || !messages) return;
    const interval = setInterval(async () => {
      const now = Date.now();
      const scheduled = messages.filter((m: any) => m.status === "scheduled" && m.scheduledFor && m.scheduledFor.toMillis && m.scheduledFor.toMillis() <= now);
      for (const m of scheduled) {
        try {
          await updateDoc(doc(firestore, "chats", dmChatId, "messages", m.id), { status: "sent" });
        } catch(e) { console.error("Schedule send error", e); }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [firestore, dmChatId, messages]);

  const handleReact = async (msgId: string, emoji: string) => {
    if (!firestore || !user || !messages || !dmChatId) return;
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
      
      await updateDoc(doc(firestore, "chats", dmChatId, "messages", msgId), {
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
    if (!firestore || !dmChatId || !editInput.trim()) return;
    try {
      await updateDoc(doc(firestore, "chats", dmChatId, "messages", msgId), {
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
    if (!firestore || !dmChatId) return;
    try {
      await deleteDoc(doc(firestore, "chats", dmChatId, "messages", msgId));
      toast({ title: "Message deleted" });
    } catch(e) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  const handleTogglePin = async (msgId: string, currentPinned: boolean) => {
    if (!firestore || !dmChatId) return;
    try {
      await updateDoc(doc(firestore, "chats", dmChatId, "messages", msgId), {
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
    if (!firestore || !user || !dmChatId) return;
    const now = Date.now();
    if (now - lastTypedAt > 3500) {
      setLastTypedAt(now);
      try {
        await addDoc(collection(firestore, "typing"), {
          uid: user.uid,
          username: user.displayName?.replace(/^@+/, "") || "Member",
          channelId: dmChatId,
          timestamp: serverTimestamp()
        });
      } catch(e) {}
    }
  };

  // Handle @mention autocomplete
  const handleInputChange = (value: string) => {
    setChatInput(value);
    handleTyping();
    const match = value.match(/@([\w]*)$/);
    if (match) {
      setShowMentionList(true);
      const q = match[1].toLowerCase();
      setMentionCandidates(
        (allUsers || []).filter((u: any) =>
          u.username?.toLowerCase().startsWith(q) ||
          u.displayName?.toLowerCase().startsWith(q)
        ).slice(0, 6)
      );
    } else {
      setShowMentionList(false);
      setMentionCandidates([]);
    }
  };

  const handleSelectMention = (username: string) => {
    const updated = chatInput.replace(/@[\w]*$/, `@${username} `);
    setChatInput(updated);
    setShowMentionList(false);
    setMentionCandidates([]);
  };

  // Send a Firestore notification to any user by UID
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

  // Resolve @mentions and dispatch notifications
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
            `📣 You were mentioned`,
            `@${senderName}: ${content.slice(0, 80)}${content.length > 80 ? "…" : ""}`
          );
        }
      } catch(e) {}
    }
  };

  // ── Feature 2: Formatting toolbar wrap selection ──
  const wrapSelection = (wrapper: string) => {
    const input = document.getElementById('dm-chat-input') as HTMLInputElement | null;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const val = chatInput;
    const selected = val.slice(start, end);
    const newVal = val.slice(0, start) + wrapper + (selected || "text") + wrapper + val.slice(end);
    setChatInput(newVal);
    setTimeout(() => {
      input.focus();
      const newCursor = start + wrapper.length + (selected || "text").length + wrapper.length;
      input.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  // ── Feature 4: Copy message ──
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: "Copied!" });
    } catch(e) {
      toast({ variant: "destructive", title: "Copy failed" });
    }
  };

  // ── Feature 5: Open profile card ──
  const handleOpenProfile = async (senderId: string) => {
    if (!firestore) return;
    try {
      const snap = await getDoc(doc(firestore, "users", senderId));
      if (snap.exists()) setProfileCard({ id: snap.id, ...snap.data() });
    } catch(e) {
      toast({ variant: "destructive", title: "Could not load profile" });
    }
  };

  // ── Feature 6: Bookmark message ──
  const handleBookmark = async (msg: any) => {
    if (!firestore || !user || !dmChatId) return;
    try {
      await addDoc(collection(firestore, "users", user.uid, "bookmarks"), {
        messageId: msg.id,
        content: msg.content,
        senderName: msg.senderName,
        channelId: dmChatId,
        timestamp: serverTimestamp()
      });
      toast({ title: "Bookmarked!" });
    } catch(e) {
      toast({ variant: "destructive", title: "Bookmark failed" });
    }
  };

  // ── Feature 7: Poll vote ──
  const handlePollVote = async (msgId: string, optionIndex: number, currentOptions: any[], voters: string[]) => {
    if (!firestore || !user || !dmChatId) return;
    if (voters.includes(user.uid)) {
      toast({ description: "You already voted!" });
      return;
    }
    try {
      const newOptions = currentOptions.map((opt: any, i: number) =>
        i === optionIndex ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
      );
      await updateDoc(doc(firestore, "chats", dmChatId, "messages", msgId), {
        pollOptions: newOptions,
        voters: [...voters, user.uid]
      });
    } catch(e) {
      toast({ variant: "destructive", title: "Vote failed" });
    }
  };

  // ── Feature 9: Voice recording ──
  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach(t => t.stop());
          try {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            if (!firestore || !user || !dmChatId) return;
            await addDocumentNonBlocking(collection(firestore, "chats", dmChatId, "messages"), {
              content: base64,
              type: "audio",
              senderId: user.uid,
              senderName: user.displayName?.replace(/^@+/, "") || "Member",
              senderPhoto: user.photoURL || "",
              senderHat: currentUserData?.hat || null,
              channelId: dmChatId,
              channelName: `DM with ${friendUser?.displayName || personName}`,
              timestamp: serverTimestamp()
            });
            toast({ title: "Voice message sent!" });
          } catch(e) {
            toast({ variant: "destructive", title: "Voice send failed" });
          }
        };
        recorder.start();
        setIsRecording(true);
      } catch(e) {
        toast({ variant: "destructive", title: "Microphone access denied" });
      }
    }
  };

  // ── Feature 10: Schedule message send ──
  const handleScheduleSend = async () => {
    if (!chatInput.trim() || !scheduleDateTime || !firestore || !user || !dmChatId) return;
    try {
      const scheduledFor = new Date(scheduleDateTime);
      const { Timestamp } = await import("firebase/firestore");
      await addDocumentNonBlocking(collection(firestore, "chats", dmChatId, "messages"), {
        content: chatInput.trim(),
        type: "text",
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        senderHat: currentUserData?.hat || null,
        channelId: dmChatId,
        channelName: `DM with ${friendUser?.displayName || personName}`,
        timestamp: serverTimestamp(),
        scheduledFor: Timestamp.fromDate(scheduledFor),
        status: "scheduled"
      });
      setChatInput("");
      setShowSchedulePicker(false);
      setScheduleDateTime("");
      toast({ title: "Message scheduled!" });
    } catch(e) {
      toast({ variant: "destructive", title: "Scheduling failed" });
    }
  };

  // ── Feature 11: Forward message ──
  const handleForwardMessage = async (destination: { id: string; name: string; type: "dm" | "channel" }) => {
    if (!forwardMessage || !firestore || !user) return;
    try {
      let collRef;
      if (destination.type === "dm") {
        const sortedIds = [user.uid, destination.id].sort();
        const chatId = `dm_${sortedIds.join("_")}`;
        collRef = collection(firestore, "chats", chatId, "messages");
      } else {
        collRef = collection(firestore, "chats", destination.id, "messages");
      }
      await addDoc(collRef, {
        content: forwardMessage.content,
        type: forwardMessage.type || "text",
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        senderHat: currentUserData?.hat || null,
        channelId: destination.id,
        channelName: destination.name,
        timestamp: serverTimestamp(),
        forwardedFrom: forwardMessage.senderName
      });
      setShowForwardModal(false);
      setForwardMessage(null);
      toast({ title: "Message forwarded!" });
    } catch(e) {
      toast({ variant: "destructive", title: "Forward failed" });
    }
  };

  // ── Feature 12: Resolve UIDs to display names for reaction tooltip ──
  const handleReactionHover = async (msgId: string, emoji: string, uids: string[]) => {
    if (!firestore || !uids.length) return;
    try {
      const names: string[] = [];
      for (const uid of uids.slice(0, 10)) {
        const knownUser = (allUsers || []).find((u: any) => u.id === uid);
        if (knownUser) {
          names.push(knownUser.displayName || knownUser.username || uid);
        } else {
          try {
            const snap = await getDoc(doc(firestore, "users", uid));
            if (snap.exists()) {
              const d = snap.data();
              names.push(d.displayName || d.username || uid);
            }
          } catch { names.push(uid); }
        }
      }
      setReactionTooltip({ msgId, emoji, names });
    } catch(e) {}
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!chatInput.trim() && !imagePreview) || !user || !firestore || !dmChatId || isSending) return;

    // Toxicity warning
    const offensiveWords = ["toxic", "noob", "spam", "abuse", "swear"];
    const hasOffensive = offensiveWords.some(w => chatInput.toLowerCase().includes(w));
    if (hasOffensive) {
      toast({ variant: "destructive", title: "Toxicity Flagged", description: "Your message contains offensive language. Action blocked." });
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
    setLastMessageSentAt(now);

    let content = chatInput.trim();

    // ── Feature 7: Poll interception ──
    if (content.startsWith("/poll ")) {
      const pollBody = content.slice(6).trim();
      const parts = pollBody.split("|").map(s => s.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const [pollQuestion, ...optTexts] = parts;
        const pollOptions = optTexts.map(t => ({ text: t, votes: 0 }));
        setIsSending(true);
        try {
          await addDocumentNonBlocking(collection(firestore, "chats", dmChatId, "messages"), {
            content: pollQuestion,
            type: "poll",
            pollQuestion,
            pollOptions,
            voters: [],
            senderId: user.uid,
            senderName: user.displayName?.replace(/^@+/, "") || "Member",
            senderPhoto: user.photoURL || "",
            senderHat: currentUserData?.hat || null,
            channelId: dmChatId,
            channelName: `DM with ${friendUser?.displayName || personName}`,
            timestamp: serverTimestamp()
          });
          setChatInput("");
        } catch(e) {
          toast({ variant: "destructive", title: "Poll creation failed" });
        } finally { setIsSending(false); }
        return;
      } else {
        toast({ description: "Poll format: /poll Question | Option A | Option B" });
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
      const payload: any = {
        content,
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        senderHat: currentUserData?.hat || null,
        channelId: dmChatId,
        channelName: `DM with ${friendUser?.displayName || personName}`,
        timestamp: serverTimestamp()
      };

      if (replyingToMessage) {
        payload.replyTo = {
          id: replyingToMessage.id,
          senderName: replyingToMessage.senderName,
          content: replyingToMessage.content
        };
        setReplyingToMessage(null);
      }

      await addDocumentNonBlocking(collection(firestore, "chats", dmChatId, "messages"), payload);

      // ── Feature 1: Write read receipt ──
      try {
        await updateDoc(doc(firestore, "chats", dmChatId), {
          lastReadAt: serverTimestamp(),
          lastReadBy: user.uid
        });
      } catch(e) {}

      // Notify the recipient that a friend sent them a DM
      if (friendUser?.id) {
        const senderDisplay = user.displayName?.replace(/^@+/, "") || "Someone";
        sendNotification(
          friendUser.id,
          `💬 ${senderDisplay} sent you a message`,
          content.startsWith("data:image") ? "📎 Sent an image" : content.slice(0, 80) + (content.length > 80 ? "…" : "")
        );
      }

      // Dispatch @mention notifications for anyone tagged
      if (content.includes("@")) {
        dispatchMentionNotifications(content, user.displayName?.replace(/^@+/, "") || "Member");
      }
    } catch (error) {
      if (!imagePreview) setChatInput(content);
      toast({
        variant: "destructive",
        title: "Transmission failed",
        description: "DM message could not be sent."
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    if (!user || !firestore || !dmChatId) return;
    try {
      await addDocumentNonBlocking(collection(firestore, "chats", dmChatId, "messages"), {
        content: gifUrl,
        senderId: user.uid,
        senderName: user.displayName?.replace(/^@+/, "") || "Member",
        senderPhoto: user.photoURL || "",
        senderHat: currentUserData?.hat || null,
        channelId: dmChatId,
        channelName: `DM with ${friendUser?.displayName || personName}`,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      toast({ variant: "destructive", title: "GIF transmission failed" });
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
        topics.push("🔍 Coordinating bug fixes and typing validation parameters.");
      }
      if (chatText.includes("meet") || chatText.includes("call") || chatText.includes("webrtc")) {
        topics.push("📹 Reviewing WebRTC mesh connection status and calling options.");
      }
      if (topics.length === 0) {
        topics.push("💬 Discussing general topics, greetings, and collaborative planning.");
      }
      
      const summaryText = `Recap of recent private chat items:\n\n` + 
        topics.map(t => `- ${t}`).join("\n") + 
        `\n\nParticipants: ${Array.from(new Set(messages.slice(-20).map(m => m.senderName))).join(", ")}`;
      setAiSummary(summaryText);
    } catch(e) {
      toast({ variant: "destructive", title: "Summarization failed" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleStartCallClick = (type: "audio" | "video") => {
    if (!friendUser) return;
    const globalCallFn = (window as any).handleStartDirectCall;
    if (globalCallFn) {
      const friendDisplayName = friendUser.displayName?.replace(/^@+/, "") || "Member";
      globalCallFn(friendUser.id, friendDisplayName, friendUser.photoURL || "", type);
    } else {
      toast({ variant: "destructive", title: "Call System Offline", description: "The calling driver has not fully initialized." });
    }
  };

  // Typing indicators database listener
  const typingQuery = useMemoFirebase(() => {
    if (!firestore || !dmChatId) return null;
    return query(collection(firestore, "typing"), where("channelId", "==", dmChatId));
  }, [firestore, dmChatId]);
  const { data: typingDocs } = useCollection(typingQuery);

  const typingDisplay = useMemo(() => {
    if (!typingDocs || !user) return "";
    const activeTyping = typingDocs.filter((d: any) => {
      if (d.uid === user.uid) return false;
      const seconds = d.timestamp?.seconds || (d.timestamp?.toDate ? d.timestamp.toDate().getTime() / 1000 : Date.now() / 1000);
      const nowSeconds = Date.now() / 1000;
      return nowSeconds - seconds < 5;
    });
    if (activeTyping.length === 0) return "";
    return `${activeTyping[0].username} is typing...`;
  }, [typingDocs, user]);

  // Derived list of pinned messages
  const pinnedMessagesList = useMemo(() => {
    if (!messages) return [];
    return messages.filter(m => m.pinned === true);
  }, [messages]);

  // Search filtered messages
  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    if (!messageSearchQuery.trim()) return messages;
    const qStr = messageSearchQuery.toLowerCase();
    return messages.filter(m => m.content?.toLowerCase().includes(qStr));
  }, [messages, messageSearchQuery]);

  // Derived smart replies chips
  const smartReplies = useMemo(() => {
    if (!messages || messages.length === 0) return ["Hello!", "Hey there!", "What's up?"];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderId === user?.uid) return ["Let me add...", "Actually, wait.", "Brb!"];
    const content = lastMsg.content || "";
    if (content.includes("?")) return ["Definitely!", "I don't think so.", "Let me investigate."];
    return ["Sounds good!", "Awesome!", "Understood!"];
  }, [messages, user?.uid]);

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

  const renderMarkdown = (text: string) => {
    if (!text) return "";
    let escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    escaped = escaped.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/_([^_]+)_/g, "<em>$1</em>");
    escaped = escaped.replace(/~([^~]+)~/g, "<del>$1</del>");
    escaped = escaped.replace(/`([^`]+)`/g, "<code class='bg-black/50 px-1 py-0.5 rounded text-pink-400 font-mono text-xs'>$1</code>");
    // Highlight @mentions as styled pills
    escaped = escaped.replace(/@([\w]+)/g, "<span class='inline-flex items-center bg-primary/20 text-primary font-black px-1.5 py-0.5 rounded-md text-xs cursor-pointer hover:bg-primary/30 transition-colors'>@$1</span>");
    escaped = escaped.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      return `<a href="#" onclick="if(window.openXakChatWebview){window.openXakChatWebview('${url}');return false;}else{window.open('${url}','_blank');return false;}" class="text-primary hover:underline font-bold">${url}</a>`;
    });
    return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
  };

  // ── Feature 1: Determine if friend has seen last own message ──
  const lastOwnMessage = useMemo(() => {
    if (!messages || !user) return null;
    const ownMsgs = messages.filter((m: any) => m.senderId === user.uid);
    return ownMsgs.length > 0 ? ownMsgs[ownMsgs.length - 1] : null;
  }, [messages, user]);

  const friendSeenLastMessage = useMemo(() => {
    if (!chatDocData || !user || !lastOwnMessage) return false;
    return chatDocData.lastReadBy && chatDocData.lastReadBy !== user.uid;
  }, [chatDocData, user, lastOwnMessage]);

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
        <div className="space-y-3 text-left">
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

      {/* ── Feature 3: Image Lightbox ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt="lightbox"
            className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Feature 5: Profile Card Modal ── */}
      {profileCard && (
        <div
          className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4"
          onClick={() => setProfileCard(null)}
        >
          <div
            className="bg-[#0a0a15] border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setProfileCard(null)} className="self-end text-white/40 hover:text-white mb-2">
              <X className="w-4 h-4" />
            </button>
            <Avatar className="w-20 h-20 rounded-[1.5rem] border-2 border-white/10">
              <AvatarImage src={profileCard.photoURL} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary font-black text-2xl">
                {(profileCard.displayName || profileCard.username || "?")[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">
                {profileCard.displayName?.replace(/^@+/, "") || "Member"}
              </h3>
              <p className="text-xs text-primary font-bold">@{profileCard.username}</p>
              {(profileCard.statusEmoji || profileCard.status) && (
                <p className="text-xs text-zinc-400 italic">
                  {profileCard.statusEmoji} {profileCard.status}
                </p>
              )}
              {profileCard.bio && (
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed max-w-xs">{profileCard.bio}</p>
              )}
            </div>
            <button
              onClick={() => { handleStartCallClick("audio"); setProfileCard(null); }}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4" /> Start Call
            </button>
          </div>
        </div>
      )}

      {/* ── Feature 11: Forward Modal ── */}
      {showForwardModal && forwardMessage && (
        <div
          className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4"
          onClick={() => { setShowForwardModal(false); setForwardMessage(null); }}
        >
          <div
            className="bg-[#0a0a15] border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase italic tracking-wider text-white">Forward Message</h3>
              <button onClick={() => { setShowForwardModal(false); setForwardMessage(null); }} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-3">Select destination</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(allUsers || []).filter((u: any) => u.id !== user?.uid).slice(0, 10).map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => handleForwardMessage({ id: u.id, name: `DM with ${u.displayName || u.username}`, type: "dm" })}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-primary/10 rounded-xl text-left transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xs shrink-0">
                    {(u.displayName || u.username || "?")[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-white">{u.displayName?.replace(/^@+/, "") || u.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DM HEADER */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-xl z-20 shadow-lg shrink-0">
         <div className="flex items-center gap-4">
            <div className="relative shrink-0">
               <RenderHat hatKey={friendUser.hat} />
               <Avatar
                 className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                 onClick={() => handleOpenProfile(friendUser.id)}
               >
                 <AvatarImage src={friendUser.photoURL} className="object-cover" />
                 <AvatarFallback className="bg-primary text-xs font-black">{friendDisplayName[0]}</AvatarFallback>
               </Avatar>
            </div>
            <div className="text-left cursor-pointer" onClick={() => handleOpenProfile(friendUser.id)}>
               <h3 className="text-sm font-black italic uppercase tracking-tighter truncate leading-none text-white hover:text-primary transition-colors">{friendDisplayName}</h3>
               <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Direct Message</span>
            </div>
         </div>

         <div className="flex items-center gap-4 md:gap-6">
            {/* Direct Calling Integration (Audio & Video) */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <Button
                onClick={() => handleStartCallClick("audio")}
                disabled={!isFriends}
                variant="ghost"
                className="h-8 px-2.5 text-zinc-400 hover:text-white rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                title={isFriends ? "Voice Call" : "Call (Friends Only)"}
              >
                {isFriends ? <Phone className="w-4 h-4 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-zinc-600" />}
                <span className="hidden sm:inline">Audio</span>
              </Button>
              <Button
                onClick={() => handleStartCallClick("video")}
                disabled={!isFriends}
                variant="ghost"
                className="h-8 px-2.5 text-zinc-400 hover:text-white rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                title={isFriends ? "Video Call" : "Call (Friends Only)"}
              >
                {isFriends ? <Video className="w-4 h-4 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-zinc-600" />}
                <span className="hidden sm:inline">Video</span>
              </Button>
            </div>

            {/* In-chat Search Input */}
            <div className="relative group max-w-[120px] sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                placeholder="Search..."
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

      {/* MESSAGES */}
      <ScrollArea className="flex-1 p-8" ref={scrollRef}>
         <div className="max-w-5xl mx-auto space-y-8 pb-20 relative">
            {isMessagesLoading ? (
              <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>
            ) : filteredMessages.length === 0 ? (
              <div className="py-40 text-center space-y-6 opacity-20 italic">
                 <MessageCircle className="w-16 h-16 mx-auto text-primary animate-bounce" />
                 <p className="text-sm font-black uppercase tracking-[0.3em]">{messageSearchQuery.trim() ? "No results found" : "Start of direct message history"}</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isOwn = msg.senderId === user.uid;
                const translated = translatedTexts[msg.id];
                const isLastOwn = lastOwnMessage?.id === msg.id;

                return (
                  <div 
                    key={msg.id} 
                    id={`msg-${msg.id}`}
                    className={cn("flex gap-5 group relative transition-all duration-500", isOwn && "flex-row-reverse")}
                  >
                     <div className="relative shrink-0 text-left">
                       <RenderHat hatKey={msg.senderHat} />
                       <Avatar
                         className="w-11 h-11 rounded-[1.1rem] border-2 border-white/5 bg-zinc-900 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                         onClick={() => handleOpenProfile(msg.senderId)}
                       >
                          <AvatarImage src={msg.senderPhoto} className="object-cover" />
                          <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">{msg.senderName?.[0]}</AvatarFallback>
                       </Avatar>
                     </div>
                     <div className={cn("flex flex-col space-y-1.5 max-w-[70%]", isOwn && "items-end")}>
                        <span
                          className="text-[9px] font-black uppercase italic tracking-widest px-2 text-white/60 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleOpenProfile(msg.senderId)}
                        >{msg.senderName}</span>
                        
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

                        {/* ── Feature 11: Forwarded header ── */}
                        {msg.forwardedFrom && (
                          <div className="text-[9px] text-zinc-500 italic flex items-center gap-1 px-1">
                            <Forward className="w-2.5 h-2.5" />
                            Forwarded from @{msg.forwardedFrom}
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
                                <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)} className="h-7 text--[9px] uppercase font-black text-zinc-400 border border-white/5">Cancel</Button>
                              </div>
                            </div>
                          ) : msg.type === "audio" ? (
                            /* ── Feature 9: Audio message rendering ── */
                            <div className={cn(
                              "p-4 rounded-[1.8rem] shadow-2xl border transition-all text-left",
                              isOwn ? "bg-primary/20 border-primary/20 rounded-tr-none" : "bg-[#18181b] border-white/5 rounded-tl-none"
                            )}>
                              <audio controls className="max-w-xs" src={msg.content} />
                            </div>
                          ) : msg.type === "poll" ? (
                            /* ── Feature 7: Poll rendering ── */
                            <div className={cn(
                              "p-5 rounded-[1.8rem] shadow-2xl border transition-all text-left min-w-[220px]",
                              isOwn ? "bg-primary/10 border-primary/20 rounded-tr-none" : "bg-[#18181b] border-white/5 rounded-tl-none"
                            )}>
                              <p className="text-xs font-black uppercase text-primary mb-3">📊 Poll</p>
                              <p className="text-sm font-bold text-white mb-3">{msg.pollQuestion}</p>
                              <div className="space-y-2">
                                {(msg.pollOptions || []).map((opt: any, idx: number) => {
                                  const totalVotes = (msg.pollOptions || []).reduce((acc: number, o: any) => acc + (o.votes || 0), 0);
                                  const pct = totalVotes > 0 ? Math.round((opt.votes || 0) / totalVotes * 100) : 0;
                                  const hasVoted = (msg.voters || []).includes(user.uid);
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => handlePollVote(msg.id, idx, msg.pollOptions, msg.voters || [])}
                                      disabled={hasVoted}
                                      className="w-full text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/5 transition-all relative overflow-hidden"
                                    >
                                      <div
                                        className="absolute inset-y-0 left-0 bg-primary/20 transition-all"
                                        style={{ width: `${pct}%` }}
                                      />
                                      <span className="relative text-xs font-bold text-white z-10">{opt.text}</span>
                                      <span className="relative text-[9px] text-zinc-400 ml-2 z-10">{opt.votes || 0} {pct > 0 ? `(${pct}%)` : ""}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-[9px] text-zinc-500 mt-2">{(msg.voters || []).length} votes</p>
                            </div>
                          ) : (
                            <div className={cn(
                              "p-5 rounded-[1.8rem] shadow-2xl border transition-all text-sm font-medium leading-relaxed text-left relative",
                              isOwn ? "bg-primary text-white border-primary/20 rounded-tr-none" : "bg-[#18181b] border-white/5 rounded-tl-none text-foreground/90"
                            )}>
                               {/* ── Feature 10: Scheduled label ── */}
                               {msg.status === "scheduled" && msg.scheduledFor && (
                                 <div className="text-[9px] text-amber-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                   <Clock className="w-2.5 h-2.5" />
                                   Scheduled for {msg.scheduledFor?.toDate ? msg.scheduledFor.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
                                 </div>
                               )}

                               {isImageUrl(msg.content) ? (
                                 <img
                                   src={msg.content}
                                   alt="media"
                                   className="rounded-2xl max-w-full max-h-60 object-contain border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                   onClick={() => setLightboxImage(msg.content)}
                                 />
                               ) : (
                                 renderMarkdown(msg.content)
                               )}

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

                          {/* ── Feature 1: Read receipt ── */}
                          {isOwn && isLastOwn && friendSeenLastMessage && (
                            <div className="text-primary text-[9px] font-black mt-0.5 text-right pr-1">
                              ✓✓ Seen
                            </div>
                          )}

                          {/* Action Hover Tool Bar */}
                          {!editingMessageId && (
                            <div className={cn(
                              "absolute -top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-[#0a0a15] border border-white/10 rounded-full px-2.5 py-1.5 shadow-2xl gap-2 z-30",
                              isOwn ? "left-0" : "right-0"
                            )}>
                              {/* Quick reaction emojis */}
                              {['👍', '❤️', '🔥', '😂'].map(emoji => (
                                <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="hover:scale-125 transition-transform text-xs">{emoji}</button>
                              ))}
                              <div className="w-px h-3 bg-white/10 mx-1" />
                              <button onClick={() => setReplyingToMessage(msg)} className="text-zinc-400 hover:text-white hover:scale-110 transition-all" title="Reply"><CornerUpLeft className="w-3 h-3" /></button>
                              <button onClick={() => handleTogglePin(msg.id, msg.pinned)} className={cn("text-zinc-400 hover:text-white hover:scale-110 transition-all", msg.pinned && "text-amber-500")} title="Pin Message"><Pin className="w-3 h-3" /></button>
                              
                              {/* ── Feature 4: Copy button ── */}
                              <button onClick={() => handleCopyMessage(msg.content)} className="text-zinc-400 hover:text-white hover:scale-110 transition-all" title="Copy message"><Copy className="w-3 h-3" /></button>

                              {/* ── Feature 6: Bookmark button ── */}
                              <button onClick={() => handleBookmark(msg)} className="text-zinc-400 hover:text-amber-400 hover:scale-110 transition-all" title="Bookmark"><Bookmark className="w-3 h-3" /></button>

                              {/* ── Feature 11: Forward button ── */}
                              <button onClick={() => { setForwardMessage(msg); setShowForwardModal(true); }} className="text-zinc-400 hover:text-primary hover:scale-110 transition-all" title="Forward"><Forward className="w-3 h-3" /></button>
                              
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
                                  <button onClick={() => { setEditingMessageId(msg.id); setEditInput(msg.content); }} className="text-zinc-400 hover:text-emerald-400 hover:scale-110 transition-all" title="Edit"><Edit className="w-3 h-3" /></button>
                                  <button onClick={() => handleDeleteMessage(msg.id)} className="text-zinc-400 hover:text-red-500 hover:scale-110 transition-all" title="Delete"><Trash2 className="w-3 h-3" /></button>
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
                              const isTooltipActive = reactionTooltip?.msgId === msg.id && reactionTooltip?.emoji === r.emoji;
                              return (
                                <div key={r.emoji} className="relative">
                                  {/* ── Feature 12: Reaction tooltip ── */}
                                  {isTooltipActive && reactionTooltip && reactionTooltip.names.length > 0 && (
                                    <div className="absolute bottom-full left-0 bg-zinc-800 rounded-lg p-2 text-[9px] text-white/70 z-50 min-w-[80px] shadow-xl mb-1 whitespace-nowrap">
                                      {reactionTooltip.names.join(", ")}
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleReact(msg.id, r.emoji)}
                                    onMouseEnter={() => handleReactionHover(msg.id, r.emoji, r.uids || [])}
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
                                </div>
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

      {/* Floating Scroll to Bottom button */}
      {showScrollBottomBtn && (
        <button 
          onClick={handleScrollToBottom}
          className="absolute bottom-24 right-8 w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-110 active:scale-95 transition-all z-40 border-none animate-bounce"
          title="Scroll to Bottom"
        >
          <ArrowDown className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Pinned Messages Drawer Modal */}
      <Dialog open={showPinnedDrawer} onOpenChange={setShowPinnedDrawer}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-lg text-white p-8 bg-[#0a0a15]/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic text-white flex items-center gap-2">
              <Pin className="w-5 h-5 text-amber-500 animate-bounce" /> Pinned Conversation Items
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[350px] mt-4 p-2">
            {pinnedMessagesList.length === 0 ? (
              <p className="text-xs text-white/35 italic text-center py-10">No items pinned in this conversation.</p>
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

      {/* ── Feature 8: Sticker Picker ── */}
      {showStickerPicker && (
        <div className="absolute bottom-24 left-6 right-6 md:left-auto md:right-8 max-w-xs w-full bg-[#0a0a15] border-2 border-white/10 rounded-[2rem] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Stickers</span>
            <button onClick={() => setShowStickerPicker(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {STICKERS.map((sticker) => (
              <button
                key={sticker}
                onClick={async () => {
                  if (!user || !firestore || !dmChatId) return;
                  try {
                    await addDocumentNonBlocking(collection(firestore, "chats", dmChatId, "messages"), {
                      content: sticker,
                      type: "sticker",
                      senderId: user.uid,
                      senderName: user.displayName?.replace(/^@+/, "") || "Member",
                      senderPhoto: user.photoURL || "",
                      senderHat: currentUserData?.hat || null,
                      channelId: dmChatId,
                      channelName: `DM with ${friendUser?.displayName || personName}`,
                      timestamp: serverTimestamp()
                    });
                    setShowStickerPicker(false);
                  } catch(e) {
                    toast({ variant: "destructive", title: "Sticker send failed" });
                  }
                }}
                className="w-full aspect-square rounded-xl bg-white/5 hover:bg-primary/20 flex items-center justify-center text-3xl hover:scale-110 transition-all"
              >
                {sticker}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Feature 10: Schedule picker overlay ── */}
      {showSchedulePicker && (
        <div className="absolute bottom-24 left-6 right-6 md:left-auto md:right-8 max-w-xs w-full bg-[#0a0a15] border-2 border-white/10 rounded-[2rem] p-5 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Schedule Message</span>
            <button onClick={() => setShowSchedulePicker(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <input
            type="datetime-local"
            value={scheduleDateTime}
            onChange={e => setScheduleDateTime(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white mb-3 focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleScheduleSend}
            disabled={!scheduleDateTime || !chatInput.trim()}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-white text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40"
          >
            Schedule
          </button>
        </div>
      )}

      {/* INPUT BAR */}
      <div className="p-4 md:p-6 bg-zinc-950 border-t border-white/5 shrink-0 z-20">
         <div className="max-w-5xl mx-auto space-y-3">
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

            {/* Image preview */}
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
                  className="text-red-500 hover:text-red-400 text-xs font-black uppercase border-none bg-transparent"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Smart replies chips */}
            <div className="flex gap-2 pb-1 overflow-x-auto">
              {smartReplies.map((rText, index) => (
                <button 
                  key={index} 
                  type="button"
                  onClick={() => {
                    setChatInput(rText);
                    handleTyping();
                  }}
                  className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-primary hover:text-black border border-white/5 hover:border-transparent rounded-full text-zinc-400 transition-all shrink-0"
                >
                  {rText}
                </button>
              ))}
            </div>

            {/* ── Feature 2: Formatting toolbar ── */}
            <div className="flex gap-1 px-2 pb-1">
              <button
                type="button"
                onClick={() => wrapSelection("*")}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-primary/20 text-white/50 hover:text-primary text-xs font-black transition-all flex items-center justify-center"
                title="Bold (*text*)"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => wrapSelection("_")}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-primary/20 text-white/50 hover:text-primary text-xs font-black transition-all flex items-center justify-center italic"
                title="Italic (_text_)"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => wrapSelection("~")}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-primary/20 text-white/50 hover:text-primary text-xs font-black transition-all flex items-center justify-center line-through"
                title="Strikethrough (~text~)"
              >
                S
              </button>
              <button
                type="button"
                onClick={() => wrapSelection("`")}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-primary/20 text-white/50 hover:text-primary text-xs font-black transition-all flex items-center justify-center font-mono"
                title="Code (`text`)"
              >
                {"</>"}
              </button>
            </div>

            {/* Typing status display */}
            {typingDisplay && (
              <div className="text-[10px] text-zinc-400 italic pl-2 text-left animate-pulse">
                {typingDisplay}
              </div>
            )}

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
                    onClick={() => { setShowGifPicker(!showGifPicker); setShowStickerPicker(false); setShowSchedulePicker(false); }} 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-black text-white/40 hover:text-white transition-all shrink-0"
                 >
                   GIF
                 </button>

                 {/* ── Feature 8: Sticker button ── */}
                 <button
                   type="button"
                   onClick={() => { setShowStickerPicker(!showStickerPicker); setShowGifPicker(false); setShowSchedulePicker(false); }}
                   className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"
                   title="Stickers"
                 >
                   <Smile className="w-4 h-4 md:w-5 md:h-5" />
                 </button>

                 {/* ── Feature 9: Voice recording button ── */}
                 <button
                   type="button"
                   onClick={handleToggleRecording}
                   className={cn(
                     "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                     isRecording
                       ? "bg-red-500 text-white animate-pulse"
                       : "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white"
                   )}
                   title={isRecording ? "Stop recording" : "Record voice message"}
                 >
                   <Mic className="w-4 h-4" />
                 </button>

                 {/* ── Feature 10: Schedule button ── */}
                 <button
                   type="button"
                   onClick={() => { setShowSchedulePicker(!showSchedulePicker); setShowGifPicker(false); setShowStickerPicker(false); }}
                   className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"
                   title="Schedule message"
                 >
                   <Clock className="w-4 h-4" />
                 </button>

                 <div className="relative flex-1">
                    {/* @mention autocomplete dropdown */}
                    {showMentionList && mentionCandidates.length > 0 && (
                      <div className="absolute bottom-full mb-2 left-0 w-64 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                        <div className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-primary border-b border-white/5">Mention someone</div>
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
                      id="dm-chat-input"
                      value={chatInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={`Message @${friendDisplayName}... (type @ to mention)`}
                      className="border-none bg-transparent focus-visible:ring-0 text-white text-sm italic placeholder:text-white/20"
                    />
                 </div>
              </div>
              <Button type="submit" size="icon" className="h-12 w-12 md:h-16 md:w-16 bg-primary rounded-[1rem] md:rounded-[1.5rem] shadow-2xl active:scale-90 flex items-center justify-center shrink-0 border-none"><Send className="w-5 h-5 md:w-6 md:h-6 text-white" /></Button>
            </form>
         </div>
      </div>
    </main>
  );
}

"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { navigateTo } from "@/lib/navigation";
import Link from "next/link";
import { 
  Hash, 
  Home, 
  Globe, 
  Zap, 
  Gamepad2, 
  Code2, 
  Plus, 
  Radio, 
  Hash as HashIcon,
  Volume2, 
  Mic, 
  MicOff,
  Headphones,
  HeadphoneOff,
  Settings, 
  Menu, 
  Users, 
  PlusCircle, 
  UserPlus, 
  MessageCircle,
  Inbox,
  Loader2,
  ChevronRight,
  Search,
  Phone,
  PhoneOff,
  Video,
  Monitor,
  Sparkles,
  Minimize2,
  Maximize2,
  Star,
  Award,
  Heart,
  Flame,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, addDoc, serverTimestamp, getDocs, limit, orderBy, updateDoc, deleteDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { RenderHat, RenderAura, RenderDecor, RenderPet, RenderBanner, getNameplateClass } from "@/components/RenderHat";
import { Card } from "@/components/ui/card";
import { getIceServers } from "@/lib/webrtc/config";
import { IceCandidateBuffer } from "@/lib/webrtc/ice-buffer";
// Removed DynamicFavicon import

const SERVERS = [
  { id: 'home', name: 'Home', icon: Home, color: 'bg-primary', href: '/chat' },
  { id: 'discover', name: 'Discovery', icon: Globe, color: 'bg-emerald-500', href: '/chat/s/discover' },
];

const BUILT_IN_CHANNELS: Record<string, Array<{ id: string, name: string, type: "text" | "voice", category: string }>> = {
  xakteir: [
    { id: "general", name: "general", type: "text", category: "WELCOME" },
    { id: "logic-lab", name: "logic-lab", type: "text", category: "LOBBY" },
    { id: "design", name: "design", type: "text", category: "LOBBY" },
    { id: "market", name: "market", type: "text", category: "LOBBY" },
    { id: "general-lounge", name: "General Lounge", type: "voice", category: "VOICE CHANNELS" },
    { id: "gaming-pod-a", name: "Gaming Pod A", type: "voice", category: "VOICE CHANNELS" },
  ],
  gaming: [
    { id: "general", name: "general", type: "text", category: "WELCOME" },
    { id: "game-chat", name: "game-chat", type: "text", category: "LOBBY" },
    { id: "tournaments", name: "tournaments", type: "text", category: "LOBBY" },
    { id: "general-lounge", name: "General Lounge", type: "voice", category: "VOICE CHANNELS" },
    { id: "gaming-pod-a", name: "Gaming Pod A", type: "voice", category: "VOICE CHANNELS" },
  ],
  dev: [
    { id: "general", name: "general", type: "text", category: "WELCOME" },
    { id: "code-lab", name: "code-lab", type: "text", category: "LOBBY" },
    { id: "review", name: "review", type: "text", category: "LOBBY" },
    { id: "general-lounge", name: "General Lounge", type: "voice", category: "VOICE CHANNELS" },
    { id: "gaming-pod-a", name: "Gaming Pod A", type: "voice", category: "VOICE CHANNELS" },
  ],
};

const EXTENSIONS = [
  { id: 'poll', name: "Poll Tool", icon: Zap, desc: "Run instant community votes.", href: "#" },
  { id: 'whiteboard', name: "Shared whiteboard", icon: Zap, desc: "Draw together in real-time.", href: "/whiteboard" },
  { id: 'notes', name: "Shared Notes", icon: Zap, desc: "Collaborate on documents.", href: "/suite" },
  { id: 'games', name: "Mini Games", icon: Gamepad2, desc: "Drop-in social activities.", href: "/games" },
];

const GRADIENTS = [
  "bg-rose-500",
  "bg-purple-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-zinc-700"
];

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [rightPanel, setRightPanel] = useState<'members' | 'extensions'>('members');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userDocRef);
  
  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  
  const [showCreateServerModal, setShowCreateServerModal] = useState(false);
  const [serverNameInput, setServerNameInput] = useState("");
  const [serverColorInput, setServerColorInput] = useState("bg-rose-500");
  const [serverIsPrivate, setServerIsPrivate] = useState(false);
  const [isCreatingServer, setIsCreatingServer] = useState(false);

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [channelNameInput, setChannelNameInput] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  // Server settings & Roles states
  const [showServerSettingsModal, setShowServerSettingsModal] = useState(false);
  const [roleNameInput, setRoleNameInput] = useState("");
  const [roleColorInput, setRoleColorInput] = useState("text-zinc-300");
  const [rolePermissions, setRolePermissions] = useState<string[]>(["sendMessages"]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // PIP Mode state
  const [isPipMode, setIsPipMode] = useState(false);

  // Global Settings states
  const [showGlobalSettingsModal, setShowGlobalSettingsModal] = useState(false);
  const [notificationPref, setNotificationPref] = useState("all");
  const [selectedNotificationServers, setSelectedNotificationServers] = useState<string[]>([]);
  const [customCssInput, setCustomCssInput] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Profile modal and search states
  const [selectedProfileUser, setSelectedProfileUser] = useState<any>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [statusText, setStatusText] = useState("");
  const [statusEmoji, setStatusEmoji] = useState("💬");
  const [bioText, setBioText] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Collapsible sidebar
  const [textCollapsed, setTextCollapsed] = useState(false);
  const [voiceCollapsed, setVoiceCollapsed] = useState(false);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<string | null>(null);
  const [voiceConnectedMsg, setVoiceConnectedMsg] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Real voice channel WebRTC stream state
  const voicePcMap = useRef<Record<string, RTCPeerConnection>>({});
  const voiceStream = useRef<MediaStream | null>(null);
  const voiceRemoteStreams = useRef<Record<string, MediaStream>>({});
  const [voiceRemoteStreamsVersion, setVoiceRemoteStreamsVersion] = useState(0);
  const voiceUnsubscribers = useRef<any[]>([]);
  const [voiceUsers, setVoiceUsers] = useState<Record<string, any[]>>({});

  // Calling & Outgoing/Incoming calls states
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCallSession, setActiveCallSession] = useState<any>(null);
  const [isCallingOutgoing, setIsCallingOutgoing] = useState(false);
  const [outgoingCallData, setOutgoingCallData] = useState<any>(null);

  // WebRTC local/remote stream refs for direct calls
  const [callStream, setCallStream] = useState<MediaStream | null>(null);
  const [remoteCallStream, setRemoteCallStream] = useState<MediaStream | null>(null);
  const callPc = useRef<RTCPeerConnection | null>(null);
  const [callMicMuted, setCallMicMuted] = useState(false);
  const [callCamVideoOff, setCallCamVideoOff] = useState(false);
  const [callScreenSharing, setCallScreenSharing] = useState(false);
  const callScreenStream = useRef<MediaStream | null>(null);
  // Use a ref for the signal unsub to avoid stale closure
  const callSignalUnsubRef = useRef<(() => void) | null>(null);
  const [callSignalUnsub, setCallSignalUnsub] = useState<any>(null);
  // ICE candidate buffers per peer
  const voiceIceBuffers = useRef<Record<string, RTCIceCandidate[]>>({});
  const voiceRemoteDescSet = useRef<Record<string, boolean>>({});
  const directCallIceBuffer = useRef<RTCIceCandidate[]>([]);
  const directCallRemoteDescSet = useRef(false);

  // Global search state
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Group DM state
  const [showGroupDmModal, setShowGroupDmModal] = useState(false);
  const [groupDmName, setGroupDmName] = useState("");
  const [groupDmMembers, setGroupDmMembers] = useState<string[]>([]);
  const [isCreatingGroupDm, setIsCreatingGroupDm] = useState(false);

  // Start DM States
  const [showStartDmDialog, setShowStartDmDialog] = useState(false);
  const [startDmSearchQuery, setStartDmSearchQuery] = useState("");

  // Create Channel states
  const [channelTypeInput, setChannelTypeInput] = useState<"text" | "voice">("text");
  const [channelCategoryInput, setChannelCategoryInput] = useState("TEXT CHANNELS");

  const [webviewUrl, setWebviewUrl] = useState<string | null>(null);

  // Server Customization states & helper
  const [serverIconUrl, setServerIconUrl] = useState("");
  const [serverDescription, setServerDescription] = useState("");

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setServerIconUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Online presence: write online status on mount, clear on unmount
    if (firestore && user) {
      updateDoc(doc(firestore, "users", user.uid), { onlineAt: Date.now(), online: true }).catch(() => {});
      const cleanup = () => {
        updateDoc(doc(firestore, "users", user.uid), { online: false }).catch(() => {});
      };
      window.addEventListener("beforeunload", cleanup);
      return () => {
        cleanup();
        window.removeEventListener("beforeunload", cleanup);
      };
    }
  }, [firestore, user]);

  // Global search keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(v => !v);
      }
      if (e.key === 'Escape') setShowGlobalSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const openXakChatWebview = (url: string) => {
      let targetUrl = url;
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl;
      }
      setWebviewUrl(targetUrl);
    };

    if (typeof window !== "undefined") {
      (window as any).openXakChatWebview = openXakChatWebview;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).openXakChatWebview;
      }
    };
  }, []);




  const playPing = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio Context blocked", e);
    }
  };

  const isServerRoute = pathname.startsWith("/chat/s/");
  const isDmRoute = pathname.startsWith("/chat/dm/");
  
  let activeServer = 'home';
  let serverName = '';
  if (isServerRoute) {
    const parts = pathname.split("/");
    serverName = parts[3] || 'xakteir';
    activeServer = serverName;
  }

  const inviteLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/chat/s/${activeServer}?invite=true`;
  }, [activeServer]);

  let activeDmUsername = '';
  if (isDmRoute) {
    const parts = pathname.split("/");
    activeDmUsername = parts[3] || '';
  }

  const isBuiltInServer = ['home', 'xakteir', 'gaming', 'dev', 'discover'].includes(serverName);

  useEffect(() => {
    if (showGlobalSettingsModal && userData) {
      setNotificationPref(userData.notificationPref || "all");
      setSelectedNotificationServers(userData.selectedNotificationServers || []);
      setCustomCssInput(userData.customCss || "");
    }
  }, [showGlobalSettingsModal, userData]);

  const serversQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "servers"), limit(30));
  }, [firestore]);
  const { data: dbServers } = useCollection(serversQuery);

  const allServers = useMemo(() => {
    const list: Array<{ id: string, name: string, icon: any, color: string, iconUrl?: string | null, href: string }> = SERVERS.map(s => ({ ...s, iconUrl: null }));
    if (dbServers) {
      dbServers.forEach(s => {
        const isOwner = s.ownerId === user?.uid;
        const isMember = s.members && s.members.includes(user?.uid);
        if (isOwner || isMember) {
          list.push({
            id: s.id,
            name: s.name,
            icon: Zap,
            color: s.iconColor || 'bg-zinc-700',
            iconUrl: s.iconUrl || null,
            href: `/chat/s/${s.id}`
          });
        }
      });
    }
    return list;
  }, [dbServers, user?.uid]);

  const channelsQuery = useMemoFirebase(() => {
    if (!firestore || isBuiltInServer || !isServerRoute) return null;
    return query(collection(firestore, "servers", serverName, "channels"), orderBy("createdAt", "asc"));
  }, [firestore, isBuiltInServer, isServerRoute, serverName]);
  const { data: customChannels } = useCollection(channelsQuery);

  const serverChannelsList = useMemo(() => {
    if (isBuiltInServer) {
      return BUILT_IN_CHANNELS[serverName] || [
        { id: "general", name: "general", type: "text" as const, category: "WELCOME" },
        { id: "general-lounge", name: "General Lounge", type: "voice" as const, category: "VOICE CHANNELS" }
      ];
    }
    if (customChannels && customChannels.length > 0) {
      return customChannels.map(c => ({
        id: c.id,
        name: c.name || "general",
        type: (c.type || "text") as "text" | "voice",
        category: c.category || (c.type === "voice" ? "VOICE CHANNELS" : "TEXT CHANNELS")
      }));
    }
    return [
      { id: "general", name: "general", type: "text" as const, category: "TEXT CHANNELS" }
    ];
  }, [isBuiltInServer, customChannels, serverName]);

  const channelCategories = useMemo(() => {
    const categories: string[] = [];
    serverChannelsList.forEach(c => {
      if (!categories.includes(c.category)) {
        categories.push(c.category);
      }
    });
    return categories.sort((a, b) => {
      if (a === "WELCOME" || a === "INFORMATION") return -1;
      if (b === "WELCOME" || b === "INFORMATION") return 1;
      return a.localeCompare(b);
    });
  }, [serverChannelsList]);

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const serverDocRef = useMemoFirebase(() => {
    if (!firestore || !isServerRoute || isBuiltInServer) return null;
    return doc(firestore, "servers", serverName);
  }, [firestore, isServerRoute, isBuiltInServer, serverName]);
  const { data: serverDocData } = useDoc(serverDocRef);

  const serverHeaderTitle = useMemo(() => {
    if (isBuiltInServer) {
      return serverName === 'xakteir' ? 'Xakteir Hub' : serverName === 'gaming' ? 'Gaming Zone' : serverName === 'dev' ? 'Dev Sector' : 'Discovery';
    }
    return serverDocData?.name || 'Loading Server...';
  }, [isBuiltInServer, serverName, serverDocData]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users"), limit(30));
  }, [firestore, user]);
  const { data: hubMembers } = useCollection(usersQuery);

  const dmsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "chats"),
      where("participants", "array-contains", user.uid),
      where("public", "==", false)
    );
  }, [firestore, user]);
  const { data: activeDms } = useCollection(dmsQuery);

  const friendUserQuery = useMemoFirebase(() => {
    if (!firestore || !activeDmUsername) return null;
    return query(collection(firestore, "users"), where("username", "==", activeDmUsername), limit(1));
  }, [firestore, activeDmUsername]);
  const { data: friendUserDocs } = useCollection(friendUserQuery);
  const activeFriendData = friendUserDocs?.[0];

  useEffect(() => {
    if (serverDocData) {
      setServerNameInput(serverDocData.name || "");
      setServerColorInput(serverDocData.iconColor || "bg-zinc-700");
      setServerIsPrivate(serverDocData.isPrivate || false);
      setServerIconUrl(serverDocData.iconUrl || "");
      setServerDescription(serverDocData.description || "");
    }
  }, [serverDocData]);

  const hasLayoutPermission = (permission: string) => {
    if (!user || !serverDocData) return true;
    if (serverDocData.ownerId === user.uid) return true;
    const roles = serverDocData.roles || [];
    const userRoleIds = serverDocData.memberRoles?.[user.uid] || [];
    if (roles.length === 0 || userRoleIds.length === 0) return permission === "sendMessages";
    return roles.some((role: any) => userRoleIds.includes(role.id) && role.permissions?.includes(permission));
  };

  const handleToggleMemberRole = async (memberId: string, roleId: string) => {
    if (!firestore || !activeServer || !serverDocData) return;
    try {
      const currentMemberRoles = { ...(serverDocData.memberRoles || {}) };
      const userRoles = [...(currentMemberRoles[memberId] || [])];
      let updatedRoles;
      if (userRoles.includes(roleId)) {
        updatedRoles = userRoles.filter(r => r !== roleId);
      } else {
        updatedRoles = [...userRoles, roleId];
      }
      currentMemberRoles[memberId] = updatedRoles;
      await updateDoc(doc(firestore, "servers", activeServer), { memberRoles: currentMemberRoles });
      toast({ title: "Roles Updated!" });
    } catch(e) { toast({ variant: "destructive", title: "Error updating roles" }); }
  };

  const customServerMembers = useMemo(() => {
    if (!hubMembers || !serverDocData || isBuiltInServer) return [];
    const memberUids = serverDocData.members || [];
    return hubMembers.filter(m => memberUids.includes(m.id));
  }, [hubMembers, serverDocData, isBuiltInServer]);

  const [speakingUsers, setSpeakingUsers] = useState<string[]>([]);
  useEffect(() => {
    if (!activeVoiceChannel) {
      setSpeakingUsers([]);
      return;
    }
    const timer = setInterval(() => {
      if (hubMembers && hubMembers.length > 0) {
        const randMember = hubMembers[Math.floor(Math.random() * hubMembers.length)];
        setSpeakingUsers([randMember.id]);
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [activeVoiceChannel, hubMembers]);

  const filteredCustomMembers = useMemo(() => {
    const queryStr = memberSearch.trim().toLowerCase();
    if (!queryStr) return customServerMembers;
    return customServerMembers.filter(m => m.displayName?.toLowerCase().includes(queryStr) || m.username?.toLowerCase().includes(queryStr));
  }, [customServerMembers, memberSearch]);

  const filteredHubMembers = useMemo(() => {
    const queryStr = memberSearch.trim().toLowerCase();
    const members = hubMembers?.filter(m => !m.isHidden) || [];
    if (!queryStr) return members;
    return members.filter(m => m.displayName?.toLowerCase().includes(queryStr) || m.username?.toLowerCase().includes(queryStr));
  }, [hubMembers, memberSearch]);

  const getMemberRoleDetails = (memberId: string) => {
    if (!serverDocData) return { name: "Member", color: "text-zinc-400" };
    const roles = serverDocData.roles || [];
    const assignedIds = serverDocData.memberRoles?.[memberId] || [];
    if (assignedIds.length === 0) {
      if (serverDocData.ownerId === memberId) return { name: "Owner", color: "text-yellow-400" };
      return { name: "Member", color: "text-zinc-400" };
    }
    const activeRoles = roles.filter((r: any) => assignedIds.includes(r.id));
    if (activeRoles.length === 0) {
      if (serverDocData.ownerId === memberId) return { name: "Owner", color: "text-yellow-400" };
      return { name: "Member", color: "text-zinc-400" };
    }
    return { name: activeRoles[0].name, color: activeRoles[0].color || "text-zinc-300" };
  };

  useEffect(() => {
    if (selectedProfileUser && selectedProfileUser.id === user?.uid && userData) {
      setStatusText(userData.statusText || "");
      setStatusEmoji(userData.statusEmoji || "💬");
      setBioText(userData.description || "");
    }
  }, [selectedProfileUser, userData, user?.uid]);

  const handleSaveProfile = async () => {
    if (!firestore || !user) return;
    setIsSavingProfile(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid), { statusText: statusText.trim(), statusEmoji: statusEmoji.trim(), description: bioText.trim() });
      toast({ title: "Profile updated successfully!" });
      setSelectedProfileUser(null);
    } catch (e) { toast({ variant: "destructive", title: "Failed to update profile" }); } finally { setIsSavingProfile(false); }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !user || !firestore) return;
    setIsInviting(true);
    try {
      await addDoc(collection(firestore, "invitations"), { fromUid: user.uid, fromName: user.displayName || "A user", toEmail: inviteEmail.trim().toLowerCase(), timestamp: serverTimestamp(), status: "pending" });
      toast({ title: "Invitation Sent", description: `An invite was transmitted to ${inviteEmail}.` });
      setInviteEmail("");
      setShowInviteModal(false);
    } catch (e) { toast({ variant: "destructive", title: "Invite Failed" }); } finally { setIsInviting(false); }
  };

  const handleCreateServer = async () => {
    if (!serverNameInput.trim() || !user || !firestore) return;
    setIsCreatingServer(true);
    try {
      const serverRef = await addDoc(collection(firestore, "servers"), { name: serverNameInput.trim(), iconColor: serverColorInput, iconUrl: serverIconUrl, description: serverDescription, ownerId: user.uid, isPrivate: serverIsPrivate, members: [user.uid], createdAt: serverTimestamp() });
      await addDoc(collection(firestore, "servers", serverRef.id, "channels"), { name: "general", createdAt: serverTimestamp() });
      setShowCreateServerModal(false);
      navigateTo(`/chat/s/${serverRef.id}?c=general`, router);
    } catch(e) { toast({ variant: "destructive", title: "Creation Failed" }); } finally { setIsCreatingServer(false); }
  };

  const handleCreateChannel = async () => {
    if (!channelNameInput.trim() || !user || !firestore || !isServerRoute) return;
    setIsCreatingChannel(true);
    try {
      const formattedChannelName = channelNameInput.toLowerCase().trim().replace(/\s+/g, '-');
      await addDoc(collection(firestore, "servers", serverName, "channels"), {
        name: formattedChannelName,
        type: channelTypeInput,
        category: channelCategoryInput.trim() || (channelTypeInput === "text" ? "TEXT CHANNELS" : "VOICE CHANNELS"),
        createdAt: serverTimestamp()
      });
      setShowCreateChannelModal(false);
      setChannelNameInput("");
      if (channelTypeInput === "text") {
        navigateTo(`/chat/s/${serverName}?c=${formattedChannelName}`, router);
      } else {
        toast({ title: "Voice channel created!" });
      }
    } catch(e) { toast({ variant: "destructive", title: "Channel Creation Failed" }); } finally { setIsCreatingChannel(false); }
  };

  const handleStartDM = (friendUsername: string) => {
    navigateTo(`/chat/dm/${friendUsername}`, router);
  };

  // Group status listener for active voice users in current server

  useEffect(() => {
    if (!firestore || !activeServer || activeServer === "home" || !user) {
      setVoiceUsers({});
      return;
    }
    const q = query(
      collection(firestore, "voice_status"),
      where("serverId", "==", activeServer)
    );
    const unsub = onSnapshot(q, (snapshot: any) => {
      const grouped: Record<string, any[]> = {};
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        const ch = data.channelId;
        if (!grouped[ch]) grouped[ch] = [];
        grouped[ch].push({ id: docSnap.id, ...data });
      });
      setVoiceUsers(grouped);
    }, (err: any) => console.warn(err));
    return () => unsub();
  }, [firestore, activeServer, user]);

  // WebRTC Voice Channel connection loop
  const setupVoiceWebRTC = async (channelName: string) => {
    cleanupVoiceWebRTC();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStream.current = stream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    } catch(err) {
      toast({ variant: "destructive", title: "Microphone blocked", description: "Audio sharing requires microphone permissions." });
      return;
    }
    const roomId = `VOICE_${activeServer}_${channelName}`;
    const signalsRef = collection(firestore!, "meetings", roomId, "signals");
    
    // Subscribe to participants in this channel
    const participantsQuery = query(
      collection(firestore!, "voice_status"),
      where("serverId", "==", activeServer),
      where("channelId", "==", channelName)
    );
    
    const unsubParticipants = onSnapshot(participantsQuery, (snapshot: any) => {
      snapshot.forEach((docSnap: any) => {
        const otherUser = docSnap.data();
        if (otherUser.uid === user?.uid) return;
        
        if (!voicePcMap.current[otherUser.uid]) {
          const peer = new RTCPeerConnection(getIceServers());
          voicePcMap.current[otherUser.uid] = peer;
          
          voiceStream.current?.getTracks().forEach((track) => {
            peer.addTrack(track, voiceStream.current!);
          });
          
          const remoteMs = new MediaStream();
          voiceRemoteStreams.current[otherUser.uid] = remoteMs;
          
          peer.ontrack = (event) => {
            const track = event.track;
            if (track) remoteMs.addTrack(track);
            if (event.streams && event.streams[0]) {
              event.streams[0].getTracks().forEach((t) => remoteMs.addTrack(t));
            }
            setVoiceRemoteStreamsVersion(v => v + 1);
            
            const audioEl = document.createElement("audio");
            audioEl.srcObject = remoteMs;
            audioEl.autoplay = true;
            audioEl.volume = isDeafened ? 0 : 1;
            audioEl.className = "voice-remote-audio";
            audioEl.id = `remote-audio-${event.track.id}`;
            document.body.appendChild(audioEl);
            audioEl.play().catch(e => console.warn(e));
          };
          
          peer.onicecandidate = (event) => {
            if (event.candidate) {
              addDoc(signalsRef, {
                from: user!.uid,
                to: otherUser.uid,
                type: "ice",
                candidate: event.candidate.toJSON(),
                ts: Date.now()
              });
            }
          };
          
          if (user!.uid < otherUser.uid) {
            (async () => {
              const offer = await peer.createOffer();
              await peer.setLocalDescription(offer);
              await addDoc(signalsRef, {
                from: user!.uid,
                to: otherUser.uid,
                type: "offer",
                sdp: offer.sdp,
                sdpType: offer.type,
                ts: Date.now()
              });
            })();
          }
        }
      });
    });
    
    const signalsQuery = query(signalsRef);
    const unsubSignals = onSnapshot(signalsQuery, (snapshot: any) => {
      snapshot.docChanges().forEach((change: any) => {
        if (change.type !== "added") return;
        const sig = change.doc.data();
        if (sig.to !== user?.uid) return;
        
        const fromId = sig.from;
        let peer = voicePcMap.current[fromId];

        // Lazily create peer if not yet in map (handles late joiners)
        if (!peer && sig.type === "offer") {
          peer = new RTCPeerConnection(getIceServers());
          voicePcMap.current[fromId] = peer;
          voiceIceBuffers.current[fromId] = [];
          voiceRemoteDescSet.current[fromId] = false;

          voiceStream.current?.getTracks().forEach((track) => {
            peer!.addTrack(track, voiceStream.current!);
          });

          const remoteMs = new MediaStream();
          voiceRemoteStreams.current[fromId] = remoteMs;

          peer.ontrack = (event) => {
            const track = event.track;
            if (track) remoteMs.addTrack(track);
            if (event.streams && event.streams[0]) {
              event.streams[0].getTracks().forEach((t) => remoteMs.addTrack(t));
            }
            setVoiceRemoteStreamsVersion(v => v + 1);
            const audioEl = document.createElement("audio");
            audioEl.srcObject = remoteMs;
            audioEl.autoplay = true;
            audioEl.volume = isDeafened ? 0 : 1;
            audioEl.className = "voice-remote-audio";
            audioEl.play().catch(e => console.warn(e));
          };

          peer.onicecandidate = (event) => {
            if (event.candidate) {
              addDoc(signalsRef, {
                from: user!.uid,
                to: fromId,
                type: "ice",
                candidate: event.candidate.toJSON(),
                ts: Date.now()
              });
            }
          };
        }
        
        if (sig.type === "offer" && peer) {
          (async () => {
            await peer!.setRemoteDescription(new RTCSessionDescription({ type: sig.sdpType, sdp: sig.sdp }));
            voiceRemoteDescSet.current[fromId] = true;
            // Flush buffered ICE candidates
            const buffered = voiceIceBuffers.current[fromId] || [];
            for (const c of buffered) {
              peer!.addIceCandidate(c).catch(() => {});
            }
            voiceIceBuffers.current[fromId] = [];

            const answer = await peer!.createAnswer();
            await peer!.setLocalDescription(answer);
            await addDoc(signalsRef, {
              from: user!.uid,
              to: fromId,
              type: "answer",
              sdp: answer.sdp,
              sdpType: answer.type,
              ts: Date.now()
            });
          })();
        } else if (sig.type === "answer" && peer) {
          (async () => {
            await peer!.setRemoteDescription(new RTCSessionDescription({ type: sig.sdpType, sdp: sig.sdp }));
            voiceRemoteDescSet.current[fromId] = true;
            // Flush buffered ICE candidates
            const buffered = voiceIceBuffers.current[fromId] || [];
            for (const c of buffered) {
              peer!.addIceCandidate(c).catch(() => {});
            }
            voiceIceBuffers.current[fromId] = [];
          })();
        } else if (sig.type === "ice" && peer) {
          if (voiceRemoteDescSet.current[fromId]) {
            peer.addIceCandidate(new RTCIceCandidate(sig.candidate)).catch(() => {});
          } else {
            if (!voiceIceBuffers.current[fromId]) voiceIceBuffers.current[fromId] = [];
            voiceIceBuffers.current[fromId].push(new RTCIceCandidate(sig.candidate));
          }
        }
      });
    });
    
    voiceUnsubscribers.current.push(unsubParticipants, unsubSignals);
  };

  const cleanupVoiceWebRTC = () => {
    voiceUnsubscribers.current.forEach((u) => u());
    voiceUnsubscribers.current = [];
    Object.values(voicePcMap.current).forEach((pc) => pc.close());
    voicePcMap.current = {};
    voiceIceBuffers.current = {};
    voiceRemoteDescSet.current = {};
    voiceStream.current?.getTracks().forEach((track) => track.stop());
    voiceStream.current = null;
    voiceRemoteStreams.current = {};
    document.querySelectorAll(".voice-remote-audio").forEach((el) => el.remove());
  };

  const handleJoinVoice = async (channelName: string) => {
    if (!firestore || !user) return;
    playPing();
    if (activeVoiceChannel) {
      await handleLeaveVoice();
    }
    setActiveVoiceChannel(channelName);
    setVoiceConnectedMsg(true);
    const statusRef = doc(firestore, "voice_status", `${activeServer}_${channelName}_${user.uid}`);
    await setDoc(statusRef, {
      serverId: activeServer,
      channelId: channelName,
      uid: user.uid,
      displayName: user.displayName || "Member",
      photoURL: user.photoURL || "",
      joinedAt: Date.now()
    });
    setupVoiceWebRTC(channelName);
  };

  const handleLeaveVoice = async () => {
    if (!firestore || !user || !activeVoiceChannel) return;
    playPing();
    try {
      await deleteDoc(doc(firestore, "voice_status", `${activeServer}_${activeVoiceChannel}_${user.uid}`));
    } catch(e){}
    cleanupVoiceWebRTC();
    setActiveVoiceChannel(null);
    setVoiceConnectedMsg(false);
  };

  // Sync mute state with microphone track
  useEffect(() => {
    voiceStream.current?.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  }, [isMuted]);

  // Sync deafen state with remote audio volumes
  useEffect(() => {
    document.querySelectorAll(".voice-remote-audio").forEach((el: any) => {
      el.volume = isDeafened ? 0 : 1;
    });
  }, [isDeafened]);

  // Cleanup voice stream on unmount
  useEffect(() => {
    return () => {
      cleanupVoiceWebRTC();
    };
  }, []);

  // Global Direct Call Signaling and Listeners
  useEffect(() => {
    if (!firestore || !user) return;
    
    const q = query(
      collection(firestore, "calls"),
      where("recipientId", "==", user.uid),
      where("status", "==", "ringing")
    );
    
    const unsub = onSnapshot(q, (snapshot: any) => {
      if (!snapshot.empty) {
        const callDoc = snapshot.docs[0];
        setIncomingCall({ id: callDoc.id, ...callDoc.data() });
      } else {
        setIncomingCall(null);
      }
    });
    
    return () => unsub();
  }, [firestore, user]);

  // Handle active call session updates
  useEffect(() => {
    if (!firestore || !user) return;
    
    const sessionChatId = activeCallSession?.id || outgoingCallData?.id;
    if (!sessionChatId) return;
    
    const unsub = onSnapshot(doc(firestore, "calls", sessionChatId), (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === "declined" || data.status === "disconnected") {
          toast({ title: "Call ended" });
          handleEndDirectCall();
        } else if (data.status === "accepted" && (!activeCallSession || activeCallSession.status !== "accepted")) {
          setActiveCallSession({ id: docSnap.id, ...data });
          setIsCallingOutgoing(false);
          startDirectCallWebRTC(docSnap.id, data.callerId === user.uid);
        }
      } else {
        handleEndDirectCall();
      }
    });
    
    return () => unsub();
  }, [firestore, user, activeCallSession, outgoingCallData]);

  const handleStartDirectCall = async (friendId: string, friendName: string, friendPhoto: string, type: "audio" | "video") => {
    if (!firestore || !user) return;
    if (activeCallSession || outgoingCallData) {
      toast({ variant: "destructive", title: "Call in progress", description: "You are already in a call." });
      return;
    }
    
    const sortedIds = [user.uid, friendId].sort();
    const dmChatId = `dm_${sortedIds.join("_")}`;
    
    setIsCallingOutgoing(true);
    const callData = {
      id: dmChatId,
      status: "ringing",
      callerId: user.uid,
      callerName: user.displayName || "Member",
      callerPhoto: user.photoURL || "",
      recipientId: friendId,
      recipientName: friendName,
      callType: type,
      roomId: `CALL_${dmChatId}`,
      timestamp: Date.now()
    };
    setOutgoingCallData(callData);
    
    try {
      await setDoc(doc(firestore, "calls", dmChatId), callData);
    } catch(e) {
      toast({ variant: "destructive", title: "Call failed to connect" });
      setIsCallingOutgoing(false);
    }
  };

  const handleAcceptDirectCall = async () => {
    if (!firestore || !incomingCall) return;
    playPing();
    
    try {
      await updateDoc(doc(firestore, "calls", incomingCall.id), {
        status: "accepted"
      });
      setActiveCallSession(incomingCall);
      setIncomingCall(null);
    } catch(e) {
      toast({ variant: "destructive", title: "Could not accept call" });
    }
  };

  const handleDeclineDirectCall = async () => {
    if (!firestore || !incomingCall) return;
    playPing();
    
    try {
      await updateDoc(doc(firestore, "calls", incomingCall.id), {
        status: "declined"
      });
      setIncomingCall(null);
    } catch(e){}
  };

  const handleEndDirectCall = async () => {
    const sessionChatId = activeCallSession?.id || outgoingCallData?.id || incomingCall?.id;
    if (firestore && sessionChatId) {
      try {
        await updateDoc(doc(firestore, "calls", sessionChatId), {
          status: "disconnected"
        });
        setTimeout(async () => {
          try {
            await deleteDoc(doc(firestore!, "calls", sessionChatId));
          } catch(e){}
        }, 1500);
      } catch(e){}
    }
    cleanupDirectCallWebRTC();
    setActiveCallSession(null);
    setIsCallingOutgoing(false);
    setOutgoingCallData(null);
    setIncomingCall(null);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).handleStartDirectCall = handleStartDirectCall;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).handleStartDirectCall;
      }
    };
  }, [handleStartDirectCall]);


  const startDirectCallWebRTC = async (dmChatId: string, isInitiator: boolean) => {
    cleanupDirectCallWebRTC();
    let stream: MediaStream;
    try {
      const callType = activeCallSession?.callType || outgoingCallData?.callType || "audio";
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video"
      });
      setCallStream(stream);
    } catch(err) {
      toast({ variant: "destructive", title: "Media blocked", description: "Sharing microphone/camera is required to call." });
      handleEndDirectCall();
      return;
    }

    const roomId = `CALL_${dmChatId}`;
    const peer = new RTCPeerConnection(getIceServers());
    callPc.current = peer;

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    const remoteMs = new MediaStream();
    setRemoteCallStream(remoteMs);

    peer.ontrack = (event) => {
      const track = event.track;
      if (track) remoteMs.addTrack(track);
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => remoteMs.addTrack(t));
      }
      const remoteVideo = document.getElementById("direct-call-remote-video") as HTMLVideoElement | null;
      if (remoteVideo) {
        remoteVideo.srcObject = remoteMs;
        remoteVideo.play().catch(e => console.warn(e));
      }
      const remoteAudio = document.getElementById("direct-call-remote-audio") as HTMLAudioElement | null;
      if (remoteAudio) {
        remoteAudio.srcObject = remoteMs;
        remoteAudio.play().catch(e => console.warn(e));
      }
    };

    const signalsRef = collection(firestore!, "meetings", roomId, "signals");

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(signalsRef, {
          from: user!.uid,
          to: isInitiator ? activeCallSession?.recipientId || outgoingCallData?.recipientId : activeCallSession?.callerId,
          type: "ice",
          candidate: event.candidate.toJSON(),
          ts: Date.now()
        });
      }
    };

    if (isInitiator) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await addDoc(signalsRef, {
        from: user!.uid,
        to: activeCallSession?.recipientId || outgoingCallData?.recipientId,
        type: "offer",
        sdp: offer.sdp,
        sdpType: offer.type,
        ts: Date.now()
      });
    }

    const unsub = onSnapshot(query(signalsRef), (snapshot: any) => {
      snapshot.docChanges().forEach((change: any) => {
        if (change.type !== "added") return;
        const sig = change.doc.data();
        if (sig.to !== user!.uid) return;

        if (sig.type === "offer") {
          (async () => {
            await peer.setRemoteDescription(new RTCSessionDescription({ type: sig.sdpType, sdp: sig.sdp }));
            directCallRemoteDescSet.current = true;
            // Flush buffered ICE candidates
            for (const c of directCallIceBuffer.current) {
              peer.addIceCandidate(c).catch(() => {});
            }
            directCallIceBuffer.current = [];

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await addDoc(signalsRef, {
              from: user!.uid,
              to: sig.from,
              type: "answer",
              sdp: answer.sdp,
              sdpType: answer.type,
              ts: Date.now()
            });
          })();
        } else if (sig.type === "answer") {
          (async () => {
            await peer.setRemoteDescription(new RTCSessionDescription({ type: sig.sdpType, sdp: sig.sdp }));
            directCallRemoteDescSet.current = true;
            for (const c of directCallIceBuffer.current) {
              peer.addIceCandidate(c).catch(() => {});
            }
            directCallIceBuffer.current = [];
          })();
        } else if (sig.type === "ice") {
          if (directCallRemoteDescSet.current) {
            peer.addIceCandidate(new RTCIceCandidate(sig.candidate)).catch(() => {});
          } else {
            directCallIceBuffer.current.push(new RTCIceCandidate(sig.candidate));
          }
        }
      });
    });

    // Store unsub in both ref and state
    callSignalUnsubRef.current = unsub;
    setCallSignalUnsub(() => unsub);
  };

  const cleanupDirectCallWebRTC = () => {
    // Use the ref to avoid stale closure issues
    if (callSignalUnsubRef.current) {
      callSignalUnsubRef.current();
      callSignalUnsubRef.current = null;
    }
    if (callPc.current) {
      callPc.current.close();
      callPc.current = null;
    }
    if (callStream) {
      callStream.getTracks().forEach((track) => track.stop());
    }
    directCallIceBuffer.current = [];
    directCallRemoteDescSet.current = false;
    setCallStream(null);
    setRemoteCallStream(null);
    setCallMicMuted(false);
    setCallCamVideoOff(false);
    setCallScreenSharing(false);
    callScreenStream.current?.getTracks().forEach((track) => track.stop());
    callScreenStream.current = null;
  };

  const toggleCallMic = () => {
    const next = !callMicMuted;
    callStream?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    setCallMicMuted(next);
  };

  const toggleCallCam = () => {
    const next = !callCamVideoOff;
    callStream?.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
    setCallCamVideoOff(next);
  };

  const toggleCallScreenShare = async () => {
    if (!callPc.current) return;
    
    if (!callScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        callScreenStream.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        const senders = callPc.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          void toggleCallScreenShare();
        };

        setCallScreenSharing(true);
      } catch (err) {
        toast({ variant: "destructive", title: "Screen share error" });
      }
    } else {
      callScreenStream.current?.getTracks().forEach((track) => track.stop());
      callScreenStream.current = null;

      const cameraTrack = callStream?.getVideoTracks()[0];
      if (cameraTrack) {
        const senders = callPc.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(cameraTrack);
        }
      }
      setCallScreenSharing(false);
    }
  };

  if (!mounted) return null;
  if (!user) return <>{children}</>;

  return (
    <div className="h-[calc(100vh-80px)] flex overflow-hidden bg-zinc-950 text-white relative">
      {userData?.customCss && <style dangerouslySetInnerHTML={{ __html: userData.customCss }} />}
      <div className="absolute inset-0 arcade-grid opacity-[0.02] pointer-events-none" />

      {/* Mobile Drawer Trigger */}
      <div className="md:hidden absolute bottom-6 left-6 z-40">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl border-4 border-[#05030d] active:scale-95 transition-all">
              <Menu className="w-6 h-6 text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#05030d] border-white/5 p-0 w-[300px] flex shadow-[0_0_100px_rgba(0,0,0,0.8)] text-white">
            <SheetHeader className="sr-only">
              <SheetTitle>Chat Channels</SheetTitle>
            </SheetHeader>
            
            {/* Mobile Server Rail */}
            <div className="w-16 bg-black flex flex-col items-center py-6 gap-4 z-30 shrink-0 border-r border-white/5">
              <ScrollArea className="w-full flex-1" style={{ height: "100%" }}>
                <div className="flex flex-col items-center gap-4 py-4 w-full">
                  {allServers.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => navigateTo(s.href, router)}
                      className={cn(
                        "w-10 h-10 rounded-[1.2rem] flex items-center justify-center transition-all duration-300 relative overflow-hidden shrink-0",
                        activeServer === s.id ? "bg-primary text-black rounded-[0.8rem]" : "bg-white/5 text-white/40 hover:bg-primary hover:text-black hover:rounded-[0.8rem]"
                      )}
                    >
                      {s.iconUrl ? (
                        <img src={s.iconUrl} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <s.icon className="w-5 h-5" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Mobile Channels List */}
            <div className="flex-1 bg-[#0a0a15] flex flex-col z-20 overflow-hidden">
              {activeServer === 'home' ? (
                <>
                  <header className="h-16 border-b border-white/5 px-4 flex items-center justify-between shadow-xl shrink-0">
                     <h2 className="text-xs font-black uppercase italic tracking-tighter text-white">DMs</h2>
                  </header>
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="p-2 space-y-4">
                      <div className="space-y-1">
                         {activeDms?.map(chat => (
                           <DMContactItem key={chat.id} chatId={chat.id} participants={chat.participants} activeChatId={pathname} currentUserId={user.uid} />
                         ))}
                      </div>
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <>
                  <header className="h-16 border-b border-white/5 px-4 flex items-center justify-between shadow-xl shrink-0">
                     <h2 className="text-xs font-black uppercase italic tracking-tighter text-white truncate">{serverHeaderTitle}</h2>
                  </header>
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="p-2 space-y-4">
                        {channelCategories.map(cat => {
                          const catChannels = serverChannelsList.filter(c => c.category === cat);
                          return (
                            <div key={cat} className="space-y-1">
                              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest px-2">{cat}</p>
                              {catChannels.map(ch => {
                                const isSel = pathname?.endsWith(`/chat/s/${activeServer}/${ch.id}`) || (ch.id === 'general' && pathname === `/chat/s/${activeServer}`);
                                return (
                                  <button 
                                    key={ch.id}
                                    onClick={() => navigateTo(`/chat/s/${activeServer}/${ch.id}`, router)}
                                    className={cn(
                                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] transition-all text-left font-bold",
                                      isSel ? "bg-primary/20 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
                                    )}
                                  >
                                    <Hash className="w-3.5 h-3.5 shrink-0 text-white/30" />
                                    <span className="truncate">{ch.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden md:flex w-80 bg-[#0a0a15] border-r border-white/5 flex-col z-30 shrink-0">
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between shadow-xl shrink-0">
          <h2 className="text-sm font-black uppercase italic tracking-tighter text-white truncate">
            {activeServer === 'home' ? 'Direct Messages' : serverHeaderTitle}
          </h2>
          {activeServer === 'home' && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setShowGlobalSearch(true)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"><Search className="w-4 h-4" /></button>
              <button onClick={() => setShowGroupDmModal(true)} className="p-1.5 rounded-lg text-white/40 hover:text-emerald-400 hover:bg-white/5 transition-all"><Users className="w-4 h-4" /></button>
              <button onClick={() => setShowStartDmDialog(true)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"><PlusCircle className="w-4 h-4" /></button>
            </div>
          )}
        </header>

        {/* Horizontal Server Rail */}
        <div className="py-3 px-2 border-b border-white/5 bg-black/40 shrink-0">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2.5 w-max px-2">
              {allServers.map(s => (
                <button 
                  key={s.id}
                  onClick={() => navigateTo(s.href, router)}
                  className={cn(
                    "w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-300 relative group overflow-hidden shrink-0 border-2",
                    activeServer === s.id ? "border-primary bg-primary text-black shadow-[0_0_20px_rgba(var(--primary),0.3)] rounded-[0.8rem]" : "border-transparent bg-white/5 text-white/40 hover:bg-white/10 hover:text-white hover:rounded-[0.8rem]",
                    s.id !== 'home' && s.id !== 'xakteir' && s.id !== 'gaming' && s.id !== 'dev' && s.id !== 'discover' && !s.iconUrl ? `${s.color} hover:text-white` : ""
                  )}
                >
                  {s.iconUrl ? <img src={s.iconUrl} alt={s.name} className="w-full h-full object-cover transition-all" /> : <s.icon className="w-5 h-5" />}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[9px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {s.name}
                  </div>
                </button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-2" />
              <button onClick={() => setShowCreateServerModal(true)} className="w-12 h-12 rounded-[1rem] bg-white/5 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-black hover:rounded-[0.8rem] transition-all shrink-0 border-2 border-transparent border-dashed hover:border-emerald-500">
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        {/* Channels / DMs */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {activeServer === 'home' ? (
              <div className="space-y-2">
                 <p className="px-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Conversations</p>
                 {!activeDms?.length ? (
                   <p className="text-[10px] text-white/20 italic px-2">No active private chats.</p>
                 ) : (
                   activeDms.map(chat => (
                     <DMContactItem key={chat.id} chatId={chat.id} participants={chat.participants} activeChatId={pathname} currentUserId={user.uid} />
                   ))
                 )}
              </div>
            ) : (
              <>
                <div className="space-y-1 mb-4">
                  <button onClick={() => navigateTo(`/chat/s/${activeServer}?room3d=true`, router)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white font-bold hover:from-indigo-500/40 hover:to-purple-500/40 border border-white/5", searchParams.get("room3d") === "true" ? "ring-2 ring-purple-500" : "")}>
                    <Sparkles className="w-4 h-4 shrink-0 text-purple-400" />
                    <span className="truncate uppercase italic">{serverHeaderTitle} 3D ROOM</span>
                  </button>
                </div>
                {channelCategories.map(cat => {
                  const catChannels = serverChannelsList.filter(c => c.category === cat);
                  const isCollapsed = collapsedCategories[cat];
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between px-2 py-1.5 cursor-pointer group" onClick={() => toggleCategory(cat)}>
                        <div className="flex items-center gap-1.5">
                          <ChevronRight className={cn("w-3 h-3 text-white/40 group-hover:text-white transition-transform", !isCollapsed && "rotate-90")} />
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{cat}</p>
                        </div>
                        {!isBuiltInServer && (
                          <button onClick={(e) => { e.stopPropagation(); setChannelCategoryInput(cat); setShowCreateChannelModal(true); }} className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {!isCollapsed && catChannels.map(ch => {
                        const isVoice = ch.type === "voice";
                        const isActive = isVoice ? activeVoiceChannel === ch.name : pathname.includes(`/chat/s/${activeServer}`) && searchParams.get("c") === ch.name;
                        if (isVoice) {
                          return (
                            <div key={ch.id} className="space-y-1">
                              <button onClick={() => handleJoinVoice(ch.name)} className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all", isActive ? "bg-emerald-500/10 text-emerald-400 font-bold" : "text-white/40 hover:bg-white/5 hover:text-white")}>
                                <div className="flex items-center gap-3"><Volume2 className="w-4 h-4 shrink-0" /><span className="truncate">{ch.name}</span></div>
                              </button>
                              {voiceUsers[ch.name] && voiceUsers[ch.name].length > 0 && (
                                <div className="pl-6 space-y-1">
                                  {voiceUsers[ch.name].map((vu: any) => {
                                    const isSpeaking = speakingUsers.includes(vu.uid);
                                    return (
                                      <div key={vu.uid} className="flex items-center gap-2 py-1">
                                        <Avatar className={cn("w-5 h-5 border transition-all", isSpeaking ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-white/5")}><AvatarImage src={vu.photoURL} /><AvatarFallback className="text-[8px]">{vu.displayName?.[0]}</AvatarFallback></Avatar>
                                        <span className="text-[10px] text-zinc-400 truncate">{vu.displayName}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <button key={ch.id} onClick={() => navigateTo(`/chat/s/${activeServer}?c=${ch.name}`, router)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all", isActive ? "bg-primary/20 text-white font-bold" : "text-white/40 hover:bg-white/5 hover:text-white")}>
                              <HashIcon className="w-4 h-4 shrink-0" />
                              <span className="truncate">{ch.name}</span>
                            </button>
                          );
                        }
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </ScrollArea>

        {voiceConnectedMsg && activeVoiceChannel && (
          <div className="p-4 bg-emerald-950/40 border-t border-b border-emerald-500/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Voice Connected</p>
                <p className="text-xs text-zinc-400 truncate max-w-[120px] font-medium">{activeVoiceChannel}</p>
              </div>
            </div>
            <button onClick={handleLeaveVoice} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">Disconnect</button>
          </div>
        )}

        {/* Unified Footer */}
        <footer className="p-5 bg-[#05030d] border-t border-white/5 flex flex-col gap-4 shrink-0">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setShowGlobalSettingsModal(true)}>
                <div className="relative hover:scale-105 transition-transform">
                  <Avatar className="w-10 h-10 border-2 border-white/10"><AvatarImage src={user.photoURL || ""} /><AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback></Avatar>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#05030d] rounded-full" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black italic tracking-tighter text-white group-hover:text-primary transition-colors">{user.displayName}</p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{userData?.statusEmoji || '💬'} {userData?.statusText || 'Online'}</p>
                </div>
             </div>
             <div className="flex gap-1.5 items-center">
                <button onClick={() => setIsMuted(!isMuted)} className={cn("p-2 rounded-xl transition-all", isMuted ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white")}><MicOff className="w-4 h-4" /></button>
                <button onClick={() => setIsDeafened(!isDeafened)} className={cn("p-2 rounded-xl transition-all", isDeafened ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white")}><HeadphoneOff className="w-4 h-4" /></button>
                <button onClick={() => setShowGlobalSettingsModal(true)} className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"><Settings className="w-4 h-4" /></button>
             </div>
           </div>
        </footer>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>


      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-foreground p-10 bg-zinc-950 text-white">
          <DialogHeader>
             <DialogTitle className="text-2xl font-black uppercase italic text-white flex items-center gap-3">
               <UserPlus className="w-6 h-6 text-emerald-500 animate-pulse" /> Invite a Friend
             </DialogTitle>
             <DialogDescription className="text-muted-foreground italic font-medium">Transmit an invite link to start collaborating.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 text-white text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Friend's Email Address</label>
              <Input 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)} 
                type="email"
                placeholder="name@email.com" 
                className="bg-[#0b0b14]/60 h-14 rounded-xl font-bold border-white/10 text-white focus:border-primary" 
              />
            </div>
            <Button 
              onClick={handleSendInvite} 
              disabled={isInviting || !inviteEmail.includes("@")} 
              className="w-full h-16 bg-primary hover:bg-primary/95 text-black rounded-2xl font-black uppercase shadow-xl transition-all"
            >
              {isInviting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Transmit Invite"}
            </Button>
            <div className="space-y-2 pt-4 border-t border-white/10">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Or share this link</label>
              <div className="flex items-center gap-2">
                <Input 
                  readOnly
                  value={inviteLink}
                  className="bg-[#0b0b14]/60 h-10 rounded-xl font-bold border-white/10 text-white/60 focus:border-primary text-xs" 
                />
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    toast({ title: "Invite link copied!" });
                  }}
                  className="h-10 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase text-[10px]"
                >
                  Copy
                </Button>
              </div>
            </div>
            
            {inviteLink && (
              <div className="flex flex-col items-center justify-center p-4 bg-[#0a0a15] border border-white/5 rounded-2xl gap-3">
                <p className="text-[9px] font-black uppercase text-zinc-500">Or Scan Invitation QR Code</p>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}`} 
                  alt="Invite QR Code" 
                  className="w-32 h-32 border border-white/10 rounded-lg bg-white p-2"
                />
                <a 
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteLink)}`}
                  download="xakchat-invite-qr.png"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:underline"
                >
                  Download QR Code
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Server Modal */}
      <Dialog open={showCreateServerModal} onOpenChange={setShowCreateServerModal}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-white p-10 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic text-white flex items-center gap-3">
              <Plus className="w-6 h-6 text-emerald-500 animate-pulse" /> Create Server
            </DialogTitle>
            <DialogDescription className="text-muted-foreground italic font-medium">Create a new chat server inside XakChat.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 ml-2">Server Name</label>
              <Input 
                value={serverNameInput} 
                onChange={(e) => setServerNameInput(e.target.value)} 
                placeholder="My Awesome Clan" 
                className="bg-[#0b0b14]/60 h-14 rounded-xl font-bold border-white/10 text-white focus:border-primary" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 ml-2">Server Description</label>
              <Input 
                value={serverDescription} 
                onChange={(e) => setServerDescription(e.target.value)} 
                placeholder="A community for coding and games" 
                className="bg-[#0b0b14]/60 h-14 rounded-xl font-bold border-white/10 text-white focus:border-primary" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 ml-2">Server Icon (Link or File Upload)</label>
              <div className="flex gap-2">
                <Input 
                  value={serverIconUrl} 
                  onChange={(e) => setServerIconUrl(e.target.value)} 
                  placeholder="https://example.com/icon.png" 
                  className="bg-[#0b0b14]/60 h-12 rounded-xl font-bold border-white/10 text-white focus:border-primary flex-1 text-xs" 
                />
                <div className="relative shrink-0">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleIconUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <Button type="button" size="sm" className="h-12 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-4 text-[10px] uppercase font-black">
                    Upload
                  </Button>
                </div>
              </div>
              {serverIconUrl && (
                <div className="flex items-center gap-3 mt-2 p-2 bg-white/5 border border-white/10 rounded-xl">
                  <img src={serverIconUrl} alt="preview" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Icon Preview Loaded</span>
                  <button type="button" onClick={() => setServerIconUrl("")} className="text-red-500 hover:text-red-400 text-[10px] font-bold uppercase ml-auto">Clear</button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 ml-2">Server Access Privacy</label>
              <div className="flex bg-[#0b0b14]/60 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setServerIsPrivate(false)}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    !serverIsPrivate ? "bg-emerald-500 text-black shadow-lg" : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setServerIsPrivate(true)}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    serverIsPrivate ? "bg-emerald-500 text-black shadow-lg" : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  Private
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 ml-2">Theme Gutter Color</label>
              <div className="flex gap-2">
                {GRADIENTS.map(col => (
                  <button 
                    key={col} 
                    onClick={() => setServerColorInput(col)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      col,
                      serverColorInput === col ? "border-white scale-110" : "border-transparent"
                    )}
                  />
                ))}
              </div>
            </div>

            <Button 
              onClick={handleCreateServer} 
              disabled={isCreatingServer || !serverNameInput.trim()} 
              className="w-full h-16 bg-primary hover:bg-primary/95 text-black rounded-2xl font-black uppercase shadow-xl transition-all"
            >
              {isCreatingServer ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null} Create Server
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Channel Modal */}
      <Dialog open={showCreateChannelModal} onOpenChange={setShowCreateChannelModal}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-white p-10 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic text-white flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary animate-pulse" /> Create Channel
            </DialogTitle>
            <DialogDescription className="text-muted-foreground italic font-medium">Create a new text or voice channel inside this server.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 ml-2">Channel Name</label>
              <Input 
                value={channelNameInput} 
                onChange={(e) => setChannelNameInput(e.target.value)} 
                placeholder="memes" 
                className="bg-[#0b0b14]/60 h-14 rounded-xl font-bold border-white/10 text-white focus:border-primary" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 ml-2">Channel Type</label>
              <div className="flex bg-[#0b0b14]/60 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setChannelTypeInput("text")}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    channelTypeInput === "text" ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setChannelTypeInput("voice")}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    channelTypeInput === "voice" ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  Voice
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 ml-2">Folder / Category Name</label>
              <Input 
                value={channelCategoryInput} 
                onChange={(e) => setChannelCategoryInput(e.target.value)} 
                placeholder="TEXT CHANNELS" 
                className="bg-[#0b0b14]/60 h-14 rounded-xl font-bold border-white/10 text-white focus:border-primary" 
              />
            </div>
            
            <Button 
              onClick={handleCreateChannel} 
              disabled={isCreatingChannel || !channelNameInput.trim()} 
              className="w-full h-16 bg-primary hover:bg-primary/95 text-black rounded-2xl font-black uppercase shadow-xl transition-all border-none"
            >
              {isCreatingChannel ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null} Create Channel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Server Settings Dialog */}
      <Dialog open={showServerSettingsModal} onOpenChange={setShowServerSettingsModal}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-2xl text-white p-10 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary animate-spin-slow" /> Server Settings
            </DialogTitle>
            <DialogDescription className="text-muted-foreground italic font-medium">Manage server general properties, custom roles, and members permissions.</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="mt-6 flex flex-col h-[450px]">
            <TabsList className="bg-[#0b0b14]/60 border border-white/10 p-1 rounded-xl w-full flex gap-1 mb-6">
              <TabsTrigger value="general" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest">General</TabsTrigger>
              <TabsTrigger value="roles" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Roles</TabsTrigger>
              <TabsTrigger value="members" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Members</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="flex-1 space-y-6 overflow-y-auto pr-1">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Server Name</label>
                <Input 
                  value={serverNameInput} 
                  onChange={(e) => setServerNameInput(e.target.value)} 
                  placeholder="Server Name" 
                  className="bg-[#0b0b14]/60 h-14 rounded-xl font-bold border-white/10 text-white focus:border-primary" 
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Server Description</label>
                <Input 
                  value={serverDescription} 
                  onChange={(e) => setServerDescription(e.target.value)} 
                  placeholder="Server Description" 
                  className="bg-[#0b0b14]/60 h-14 rounded-xl font-bold border-white/10 text-white focus:border-primary" 
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Server Icon (Link or File Upload)</label>
                <div className="flex gap-2">
                  <Input 
                    value={serverIconUrl} 
                    onChange={(e) => setServerIconUrl(e.target.value)} 
                    placeholder="https://example.com/icon.png" 
                    className="bg-[#0b0b14]/60 h-12 rounded-xl font-bold border-white/10 text-white focus:border-primary flex-1 text-xs" 
                  />
                  <div className="relative shrink-0">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleIconUpload} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <Button type="button" size="sm" className="h-12 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-4 text-[10px] uppercase font-black">
                      Upload
                    </Button>
                  </div>
                </div>
                {serverIconUrl && (
                  <div className="flex items-center gap-3 mt-2 p-2 bg-white/5 border border-white/10 rounded-xl">
                    <img src={serverIconUrl} alt="preview" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Icon Preview Loaded</span>
                    <button type="button" onClick={() => setServerIconUrl("")} className="text-red-500 hover:text-red-400 text-[10px] font-bold uppercase ml-auto">Clear</button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Server Access Privacy</label>
                <div className="flex bg-[#0b0b14]/60 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setServerIsPrivate(false)}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      !serverIsPrivate ? "bg-emerald-500 text-black shadow-lg" : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setServerIsPrivate(true)}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      serverIsPrivate ? "bg-emerald-500 text-black shadow-lg" : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    Private
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Theme Gutter Color</label>
                <div className="flex gap-2">
                  {GRADIENTS.map(col => (
                    <button 
                      key={col} 
                      onClick={() => setServerColorInput(col)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        col,
                        serverColorInput === col ? "border-white scale-110" : "border-transparent"
                      )}
                    />
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={async () => {
                  if (!activeServer || !serverNameInput.trim()) return;
                  try {
                    await updateDoc(doc(firestore!, "servers", activeServer), {
                      name: serverNameInput.trim(),
                      isPrivate: serverIsPrivate,
                      iconColor: serverColorInput,
                      iconUrl: serverIconUrl,
                      description: serverDescription
                    });
                    toast({ title: "Server Settings Saved!" });
                  } catch (e) {
                    toast({ variant: "destructive", title: "Failed to save settings" });
                  }
                }}
                className="w-full h-14 bg-primary hover:bg-primary/95 text-black rounded-2xl font-black uppercase tracking-wider"
              >
                Save General Settings
              </Button>
            </TabsContent>

            <TabsContent value="roles" className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 min-h-0 pr-2">
                <div className="space-y-6 text-left">
                  {/* Create / Edit Role form */}
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase text-primary italic">
                      {editingRoleId ? "Edit Role" : "Create New Role"}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-zinc-500">Role Name</label>
                        <Input 
                          value={roleNameInput} 
                          onChange={(e) => setRoleNameInput(e.target.value)} 
                          placeholder="e.g. Moderator" 
                          className="bg-[#0b0b14]/60 h-10 border-white/5 rounded-lg text-xs" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-zinc-500">Text Color Class</label>
                        <select
                          value={roleColorInput}
                          onChange={(e) => setRoleColorInput(e.target.value)}
                          className="w-full h-10 bg-[#0b0b14]/60 border border-white/5 rounded-lg text-xs px-2 text-white"
                        >
                          <option value="text-zinc-300">Default Zinc</option>
                          <option value="text-red-400">Red</option>
                          <option value="text-blue-400">Blue</option>
                          <option value="text-emerald-400">Emerald</option>
                          <option value="text-pink-400">Pink</option>
                          <option value="text-amber-400">Amber</option>
                          <option value="text-purple-400">Purple</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-zinc-500 block mb-2">Permissions Checklist</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: "sendMessages", label: "Send Messages" },
                          { key: "manageChannels", label: "Manage Channels" },
                          { key: "manageSettings", label: "Manage Settings" },
                          { key: "manageRoles", label: "Manage Roles" }
                        ].map(perm => (
                          <label key={perm.key} className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={rolePermissions.includes(perm.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRolePermissions(prev => [...prev, perm.key]);
                                } else {
                                  setRolePermissions(prev => prev.filter(p => p !== perm.key));
                                }
                              }}
                              className="rounded border-white/10 bg-black text-primary"
                            />
                            {perm.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={async () => {
                          if (!roleNameInput.trim() || !activeServer || !serverDocData) return;
                          try {
                            const currentRoles = [...(serverDocData.roles || [])];
                            const newRoleId = editingRoleId || `role_${Date.now()}`;
                            const newRoleObj = {
                              id: newRoleId,
                              name: roleNameInput.trim(),
                              color: roleColorInput,
                              permissions: rolePermissions
                            };
                            
                            let updatedRoles;
                            if (editingRoleId) {
                              updatedRoles = currentRoles.map(r => r.id === editingRoleId ? newRoleObj : r);
                            } else {
                              updatedRoles = [...currentRoles, newRoleObj];
                            }
                            
                            await updateDoc(doc(firestore!, "servers", activeServer), {
                              roles: updatedRoles
                            });
                            
                            // Reset state
                            setRoleNameInput("");
                            setRoleColorInput("text-zinc-300");
                            setRolePermissions(["sendMessages"]);
                            setEditingRoleId(null);
                            toast({ title: editingRoleId ? "Role Updated!" : "Role Created!" });
                          } catch (e) {
                            toast({ variant: "destructive", title: "Role Operation Failed" });
                          }
                        }}
                        className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase border-none"
                      >
                        {editingRoleId ? "Update Role" : "Add Role"}
                      </Button>
                      {editingRoleId && (
                        <Button
                          onClick={() => {
                            setRoleNameInput("");
                            setRoleColorInput("text-zinc-300");
                            setRolePermissions(["sendMessages"]);
                            setEditingRoleId(null);
                          }}
                          variant="ghost"
                          className="h-10 text-[10px] font-black uppercase text-zinc-400 border border-white/5 rounded-xl"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* List of Roles */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Roles</h4>
                    {!(serverDocData?.roles || []).length ? (
                      <p className="text-xs italic text-white/30">No custom roles created.</p>
                    ) : (
                      (serverDocData.roles || []).map((r: any) => (
                        <div key={r.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <span className={cn("text-sm font-black uppercase italic", r.color)}>{r.name}</span>
                            <div className="flex gap-1.5 mt-1">
                              {r.permissions?.map((p: string) => (
                                <Badge key={p} className="bg-white/5 text-zinc-400 border border-white/10 text-[6px] uppercase px-1.5 py-0.5 rounded">{p}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                setEditingRoleId(r.id);
                                setRoleNameInput(r.name);
                                setRoleColorInput(r.color);
                                setRolePermissions(r.permissions || []);
                              }}
                              className="h-8 px-3 text-[8px] font-black bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg border-none"
                            >
                              Edit
                            </Button>
                            <Button 
                              onClick={async () => {
                                if (!activeServer || !serverDocData) return;
                                try {
                                  const updatedRoles = (serverDocData.roles || []).filter((x: any) => x.id !== r.id);
                                  // Clean role from member assignments
                                  const updatedMemberRoles = { ...(serverDocData.memberRoles || {}) };
                                  Object.keys(updatedMemberRoles).forEach(memberId => {
                                    updatedMemberRoles[memberId] = (updatedMemberRoles[memberId] || []).filter((rid: string) => rid !== r.id);
                                  });
                                  
                                  await updateDoc(doc(firestore!, "servers", activeServer), {
                                    roles: updatedRoles,
                                    memberRoles: updatedMemberRoles
                                  });
                                  toast({ title: "Role Deleted" });
                                } catch(e) {
                                  toast({ variant: "destructive", title: "Deletion Failed" });
                                }
                              }}
                              className="h-8 px-3 text-[8px] font-black bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg border-none"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="members" className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-4 text-left">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Assign Server Roles</h4>
                  {customServerMembers.map(member => {
                    const name = member.displayName?.replace(/^@+/, "") || "Member";
                    const userRoleIds = serverDocData?.memberRoles?.[member.id] || [];
                    const isOwner = serverDocData?.ownerId === member.id;
                    
                    return (
                      <div key={member.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Avatar className="w-8 h-8 rounded-lg shrink-0">
                            <AvatarImage src={member.photoURL} />
                            <AvatarFallback>{name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-white truncate">{name}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 max-w-[60%] justify-end">
                          {isOwner ? (
                            <Badge className="bg-yellow-400 text-black text-[8px] font-black uppercase border-none px-3">Server Owner</Badge>
                          ) : !(serverDocData?.roles || []).length ? (
                            <span className="text-[9px] text-white/30 italic">No roles created</span>
                          ) : (
                            (serverDocData.roles || []).map((r: any) => {
                              const assigned = userRoleIds.includes(r.id);
                              return (
                                <button
                                  key={r.id}
                                  onClick={() => handleToggleMemberRole(member.id, r.id)}
                                  className={cn(
                                    "px-2.5 py-1 rounded text-[7px] font-black uppercase border transition-all",
                                    assigned 
                                      ? `${r.color} bg-white/5 border-primary` 
                                      : "text-zinc-500 border-white/5 hover:border-white/10 bg-transparent"
                                  )}
                                >
                                  {r.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Interactive User Profile Card Dialog */}
      <Dialog open={selectedProfileUser !== null} onOpenChange={() => setSelectedProfileUser(null)}>
        {selectedProfileUser && (() => {
          const isCurrentUser = selectedProfileUser.id === user?.uid;
          const name = selectedProfileUser.displayName?.replace(/^@+/, "") || "Member";
          const username = selectedProfileUser.username || selectedProfileUser.id;
          
          return (
            <DialogContent className="w-full max-w-2xl p-0 overflow-hidden bg-[#0c0c16]/95 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl text-foreground">
              <DialogHeader className="sr-only">
                 <DialogTitle>Member Profile: {name}</DialogTitle>
              </DialogHeader>

              <div className="relative">
                {/* Banner Area */}
                <div className="h-32 w-full relative overflow-hidden z-10">
                  <RenderBanner bannerKey={selectedProfileUser.banner} className="absolute inset-0 w-full h-full object-cover" />
                  {!selectedProfileUser.banner && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900" />
                  )}
                  {/* Banner overlay gradient for premium feel */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <Button variant="ghost" size="icon" onClick={() => setSelectedProfileUser(null)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-rose-600 transition-all z-50">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* User Avatar + Decoration + Badges section */}
                <div className="px-6 relative z-20 flex justify-between items-end -mt-16 mb-4">
                  <div className="relative p-1 rounded-[3rem] bg-[#0c0c16] z-20">
                    <RenderDecor decorKey={selectedProfileUser.decor} />
                    <RenderAura auraKey={selectedProfileUser.aura} />
                    <RenderHat hatKey={selectedProfileUser.hat} />
                    <RenderPet petKey={selectedProfileUser.pet} />
                    
                    <Avatar className="w-28 h-28 border-[6px] border-[#0c0c16] rounded-[2.2rem] shadow-2xl overflow-hidden bg-secondary relative z-20">
                      <AvatarImage src={selectedProfileUser.photoURL || ""} className="object-cover" />
                      <AvatarFallback className="bg-primary text-3xl font-black text-white">{selectedProfileUser.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    
                    {/* Discord-style Online Indicator dot */}
                    <div className={cn(
                      "absolute bottom-1 right-1 w-6 h-6 border-4 border-[#0c0c16] rounded-full z-30",
                      selectedProfileUser.status === 'offline' ? "bg-zinc-500" : "bg-emerald-500"
                    )} />
                  </div>

                  {/* Discord-style Profile Badges */}
                  <div className="flex gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/5 shadow-md mb-2">
                    <div className="w-5 h-5 flex items-center justify-center text-yellow-400 hover:scale-110 transition-transform cursor-pointer" title="Early Supporter">
                      <Star className="w-4 h-4 fill-yellow-400" />
                    </div>
                    <div className="w-5 h-5 flex items-center justify-center text-purple-400 hover:scale-110 transition-transform cursor-pointer" title="HypeSquad Bravery">
                      <Flame className="w-4 h-4 fill-purple-400" />
                    </div>
                    <div className="w-5 h-5 flex items-center justify-center text-emerald-400 hover:scale-110 transition-transform cursor-pointer" title="Active Developer">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="w-5 h-5 flex items-center justify-center text-pink-400 hover:scale-110 transition-transform cursor-pointer" title="Xakteir Premium">
                      <Award className="w-4 h-4 fill-pink-400" />
                    </div>
                  </div>
                </div>

                {/* Username + Tag */}
                <div className="px-8 pb-4">
                  <h4 className={cn(
                    "text-3xl font-black tracking-tighter italic uppercase leading-none break-words relative z-20",
                    getNameplateClass(selectedProfileUser.nameplate)
                  )}>
                    {name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-black tracking-widest mt-1 flex items-center gap-2">
                    @{username.toLowerCase()}
                    {selectedProfileUser.statusText && (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
                        {selectedProfileUser.statusEmoji} {selectedProfileUser.statusText}
                      </span>
                    )}
                  </p>
                </div>

                <div className="px-8 py-2"><hr className="border-white/5" /></div>

                {/* Level and Credits Grid */}
                <div className="px-8 py-4 grid grid-cols-2 gap-4">
                  <div className="bg-[#1e1f22] p-4 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase">Xak Credits</span>
                    </div>
                    <p className="text-xl font-black italic text-white">{(selectedProfileUser.currencyBalance || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-[#1e1f22] p-4 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase">User Level</span>
                    </div>
                    <p className="text-xl font-black italic text-white">LVL {selectedProfileUser.level || 1}</p>
                  </div>
                </div>

                <div className="px-8 pb-6 text-left">
                  {isCurrentUser ? (
                  /* Edit Section for Current User */
                  <div className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
                    <h5 className="text-[9px] font-black uppercase text-primary tracking-widest">Update Your Status & Bio</h5>
                    
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-zinc-500">Status Emoji & Message</label>
                      <div className="flex gap-2">
                        <Input 
                          value={statusEmoji} 
                          onChange={(e) => setStatusEmoji(e.target.value)} 
                          placeholder="💬" 
                          className="bg-black/45 border-white/5 w-12 text-center text-sm text-white animate-none"
                        />
                        <Input 
                          value={statusText} 
                          onChange={(e) => setStatusText(e.target.value)} 
                          placeholder="What is your status?" 
                          className="bg-black/45 border-white/5 text-xs flex-1 text-white animate-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-zinc-500">Bio Description</label>
                      <textarea
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        placeholder="Tell others about yourself..."
                        className="w-full h-16 bg-black/45 border border-white/5 rounded-lg text-xs p-2 text-white focus:outline-none focus:border-primary resize-none"
                      />
                    </div>

                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isSavingProfile}
                      className="w-full h-10 bg-primary hover:bg-primary/90 text-black font-black uppercase text-[10px] rounded-xl"
                    >
                      {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null} Save Details
                    </Button>
                  </div>
                ) : (
                  /* Display Section for Other Users */
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">About Me</h5>
                      <p className="text-xs text-white/80 font-bold leading-relaxed italic">
                        {selectedProfileUser.aboutMe || "Multiverse voyager & code explorer. Exploring the outer edges of the Xakteir ecosystem."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                      <Button 
                        onClick={() => {
                          setSelectedProfileUser(null);
                          handleStartDM(username);
                        }}
                        className="w-full h-11 bg-primary hover:bg-primary/95 text-black font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-1.5 shadow-lg border-none"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Send Private Message
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => {
                            toast({ title: "Friend Request Transmitted!", description: `A buddy request has been sent to @${username}.` });
                          }}
                          variant="ghost" 
                          className="h-10 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[8px] rounded-xl border border-white/5"
                        >
                          Add Buddy
                        </Button>
                        <Button 
                          onClick={() => {
                            toast({ title: "User Blocked", description: `You will no longer see messages from @${username}.` });
                            setSelectedProfileUser(null);
                          }}
                          variant="ghost" 
                          className="h-10 bg-rose-600/10 hover:bg-rose-600 hover:text-white text-rose-500 font-black uppercase text-[8px] rounded-xl border border-rose-500/20"
                        >
                          Block User
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => {
                            setSelectedProfileUser(null);
                            handleStartDirectCall(selectedProfileUser.id, name, selectedProfileUser.photoURL, "audio");
                          }}
                          variant="ghost" 
                          className="h-10 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 font-black uppercase text-[8px] rounded-xl border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Phone className="w-3 h-3" /> Voice Call
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedProfileUser(null);
                            handleStartDirectCall(selectedProfileUser.id, name, selectedProfileUser.photoURL, "video");
                          }}
                          variant="ghost" 
                          className="h-10 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 font-black uppercase text-[8px] rounded-xl border border-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Video className="w-3 h-3" /> Video Call
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
          );
        })()}
      </Dialog>

      {/* Start DM Search Dialog */}
      <Dialog open={showStartDmDialog} onOpenChange={setShowStartDmDialog}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-white p-10 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic text-white flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-primary animate-pulse" /> Start Direct Message
            </DialogTitle>
            <DialogDescription className="text-muted-foreground italic font-medium">Type any user's username or select them below to start messaging instantly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 ml-2">Username</label>
              <Input 
                value={startDmSearchQuery} 
                onChange={(e) => setStartDmSearchQuery(e.target.value)} 
                placeholder="ridwan" 
                className="bg-[#0b0b14]/60 h-14 rounded-xl font-bold border-white/10 text-white focus:border-primary" 
              />
            </div>
            
            <Button 
              onClick={() => {
                if (startDmSearchQuery.trim()) {
                  setShowStartDmDialog(false);
                  navigateTo(`/chat/dm/${startDmSearchQuery.trim().toLowerCase()}`, router);
                  setStartDmSearchQuery("");
                }
              }}
              disabled={!startDmSearchQuery.trim()} 
              className="w-full h-16 bg-primary hover:bg-primary/95 text-black rounded-2xl font-black uppercase shadow-xl transition-all border-none"
            >
              Start Chat Session
            </Button>

            {/* Quick list of registry users */}
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest pl-2">Select From Registry</p>
              <ScrollArea className="h-40 border border-white/5 rounded-2xl p-2 bg-black/40">
                {filteredHubMembers.map(m => {
                  if (m.id === user.uid) return null;
                  const uName = m.username || m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setShowStartDmDialog(false);
                        navigateTo(`/chat/dm/${uName}`, router);
                        setStartDmSearchQuery("");
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-xl text-xs hover:bg-white/5 text-left transition-all"
                    >
                      <Avatar className="w-6 h-6 rounded-lg">
                        <AvatarImage src={m.photoURL} />
                        <AvatarFallback>{m.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-white">{m.displayName?.replace(/^@+/, "")}</p>
                        <p className="text-[8px] text-zinc-500">@{uName}</p>
                      </div>
                    </button>
                  );
                })}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Call Overlays */}
      {/* 1. Incoming Call Dialog */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <Card className="glass-card p-10 rounded-[3rem] border-2 border-white/10 bg-zinc-950 text-white text-center max-w-sm w-full space-y-6 shadow-2xl">
            <div className="relative w-24 h-24 mx-auto">
              <Avatar className="w-full h-full border-4 border-emerald-500/30 rounded-full animate-pulse">
                <AvatarImage src={incomingCall.callerPhoto} className="object-cover" />
                <AvatarFallback className="bg-zinc-800 text-3xl font-black">{incomingCall.callerName[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{incomingCall.callerName}</h3>
              <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest animate-pulse">Incoming {incomingCall.callType} Call...</p>
            </div>
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={handleAcceptDirectCall} 
                className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-2xl border-none"
              >
                Accept
              </Button>
              <Button 
                onClick={handleDeclineDirectCall} 
                className="flex-1 h-14 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase rounded-2xl border-none"
              >
                Decline
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Outgoing Call Overlay */}
      {isCallingOutgoing && outgoingCallData && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <Card className="glass-card p-10 rounded-[3rem] border-2 border-white/10 bg-zinc-950 text-white text-center max-w-sm w-full space-y-6 shadow-2xl">
            <div className="relative w-24 h-24 mx-auto">
              <Avatar className="w-full h-full border-4 border-primary/30 rounded-full animate-bounce">
                <AvatarFallback className="bg-zinc-800 text-3xl font-black">{outgoingCallData.recipientName[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{outgoingCallData.recipientName}</h3>
              <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest animate-pulse">Calling Friend via WebRTC...</p>
            </div>
            <Button 
              onClick={handleEndDirectCall} 
              className="w-full h-14 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase rounded-2xl border-none mt-4"
            >
              Cancel Call
            </Button>
          </Card>
        </div>
      )}

      {/* 3. In-Call Active Calling Overlay UI */}
      {activeCallSession && (
        <div className={cn(
          "fixed bg-zinc-950/95 border-2 border-white/10 flex flex-col z-[100] overflow-hidden shadow-2xl transition-all duration-300",
          isPipMode ? "bottom-6 right-6 w-72 h-48 rounded-2xl" : "inset-4 md:inset-10 rounded-[3.5rem] animate-in zoom-in-95"
        )}>
          <header className={cn("border-b border-white/5 flex items-center justify-between bg-black/30 shrink-0", isPipMode ? "h-10 px-4" : "h-16 px-8")}>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className={cn("font-black uppercase tracking-widest text-zinc-400", isPipMode ? "text-[8px] truncate max-w-[100px]" : "text-xs")}>
                Direct call: {activeCallSession.callerName} & {activeCallSession.recipientName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isPipMode && <Badge className="hidden sm:inline-flex bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">WebRTC Link Active</Badge>}
              <Button onClick={() => setIsPipMode(!isPipMode)} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                {isPipMode ? <Maximize2 className="w-4 h-4 text-white" /> : <Minimize2 className="w-4 h-4 text-white" />}
              </Button>
              {isPipMode && (
                <Button onClick={handleEndDirectCall} variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-500/20 text-rose-500">
                  <PhoneOff className="w-4 h-4" />
                </Button>
              )}
            </div>
          </header>

          <div className="flex-1 min-h-0 relative p-4 md:p-8 flex items-center justify-center bg-black/40">
            {activeCallSession.callType === "video" ? (
              <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Remote Video element */}
                <div className="relative rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden flex items-center justify-center">
                  <video 
                    id="direct-call-remote-video" 
                    ref={(el) => { 
                      if (el && remoteCallStream) {
                        el.srcObject = remoteCallStream;
                        el.play().catch(e => console.warn(e));
                      }
                    }} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    playsInline 
                  />
                  <p className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Remote Feed</p>
                </div>
                
                {/* Local Video element */}
                <div className="relative rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden flex items-center justify-center">
                  {callStream && (
                    <video 
                      ref={(el) => {
                        if (el) el.srcObject = callStream;
                      }} 
                      className="w-full h-full object-cover" 
                      autoPlay 
                      playsInline 
                      muted 
                    />
                  )}
                  <p className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Your Feed</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <audio 
                  id="direct-call-remote-audio"
                  ref={(el) => { 
                    if (el && remoteCallStream) {
                      el.srcObject = remoteCallStream;
                      el.play().catch(e => console.warn(e));
                    }
                  }} 
                  autoPlay 
                  playsInline 
                />
                <div className="flex justify-center gap-6">
                  <Avatar className="w-24 h-24 border-4 border-white/10 rounded-[2rem]">
                    <AvatarImage src={activeCallSession.callerPhoto} />
                    <AvatarFallback className="text-2xl font-black">{activeCallSession.callerName[0]}</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-24 h-24 border-4 border-white/10 rounded-[2rem]">
                    <AvatarFallback className="text-2xl font-black">{activeCallSession.recipientName[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <h4 className="text-xl font-black uppercase italic tracking-tighter text-zinc-300">Voice Link Connected</h4>
              </div>
            )}
          </div>

          {!isPipMode && (
            <footer className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-center gap-4 shrink-0">
              <Button 
              onClick={toggleCallMic} 
              variant="ghost" 
              className={cn("h-12 w-12 rounded-xl border border-white/5", callMicMuted ? "bg-rose-500/20 text-rose-500" : "bg-white/5 text-white")}
            >
              {callMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {activeCallSession.callType === "video" && (
              <>
                <Button 
                  onClick={toggleCallCam} 
                  variant="ghost" 
                  className={cn("h-12 w-12 rounded-xl border border-white/5", callCamVideoOff ? "bg-rose-500/20 text-rose-500" : "bg-white/5 text-white")}
                >
                  <Video className="w-5 h-5" />
                </Button>

                <Button 
                  onClick={toggleCallScreenShare} 
                  variant="ghost" 
                  className={cn("h-12 w-12 rounded-xl border border-white/5", callScreenSharing ? "bg-emerald-500/20 text-emerald-500 animate-pulse" : "bg-white/5 text-white")}
                >
                  <Monitor className="w-5 h-5" />
                </Button>
              </>
            )}

            <Button 
              onClick={handleEndDirectCall} 
              className="h-12 px-6 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase rounded-xl border-none flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" /> Hang Up
            </Button>
          </footer>
          )}
        </div>
      )}

      {/* Link Webview Dialog */}
      <Dialog open={webviewUrl !== null} onOpenChange={(open) => { if (!open) setWebviewUrl(null); }}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-5xl w-[90vw] h-[85vh] text-white p-6 bg-[#0a0a15] backdrop-blur-2xl flex flex-col overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-3 shrink-0">
            <div className="flex items-center gap-3 w-full mr-8">
              <Globe className="w-5 h-5 text-primary animate-pulse" />
              <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 text-xs text-zinc-400 font-bold uppercase truncate flex items-center justify-between gap-4">
                <span className="truncate text-left">{webviewUrl}</span>
                <span className="text-[9px] text-zinc-500 shrink-0">XAKWEB SECURE PREVIEW</span>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 relative bg-white rounded-2xl overflow-hidden mt-4">
            {webviewUrl && (
              <iframe
                src={webviewUrl}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Search Overlay (Ctrl+K) */}
      {showGlobalSearch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-start justify-center pt-24 px-4" onClick={() => setShowGlobalSearch(false)}>
          <div className="w-full max-w-xl bg-[#0d0d1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input
                autoFocus
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
                placeholder="Search messages, channels, members..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
              />
              <kbd className="text-[9px] bg-white/5 px-2 py-1 rounded text-white/30 font-mono">ESC</kbd>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto">
              {!globalSearchQuery.trim() ? (
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-white/20 px-3 pb-2">Quick Navigation</p>
                  {activeDms?.slice(0, 5).map(chat => (
                    <button key={chat.id} onClick={() => { setShowGlobalSearch(false); navigateTo(`/chat/dm/${chat.participants.find((p: string) => p !== user.uid)}`, router); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-left transition-colors">
                      <MessageCircle className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-white/70">DM conversation</span>
                    </button>
                  ))}
                  {allServers.map(s => (
                    <button key={s.id} onClick={() => { setShowGlobalSearch(false); navigateTo(s.href, router); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-left transition-colors">
                      <Hash className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-white/70">{s.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {hubMembers?.filter((m: any) => m.displayName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) || m.username?.toLowerCase().includes(globalSearchQuery.toLowerCase())).slice(0, 6).map((m: any) => (
                    <button key={m.id} onClick={() => { setShowGlobalSearch(false); navigateTo(`/chat/dm/${m.username}`, router); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-left transition-colors">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">{(m.displayName || '?')[0]}</div>
                      <div>
                        <p className="text-sm text-white font-bold">{m.displayName}</p>
                        <p className="text-[9px] text-white/40">@{m.username}</p>
                      </div>
                    </button>
                  ))}
                  {hubMembers?.filter((m: any) => m.displayName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) || m.username?.toLowerCase().includes(globalSearchQuery.toLowerCase())).length === 0 && (
                    <p className="text-center text-white/20 text-xs italic py-6">No results for "{globalSearchQuery}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group DM Creation Modal */}
      <Dialog open={showGroupDmModal} onOpenChange={setShowGroupDmModal}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-white p-8 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> New Group DM
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-500">Group Name</label>
              <Input value={groupDmName} onChange={e => setGroupDmName(e.target.value)} placeholder="e.g. Squad Chat" className="bg-black/60 border-white/5 text-xs text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-500">Add Members (click to toggle)</label>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {hubMembers?.filter((m: any) => m.id !== user.uid).map((m: any) => (
                  <button key={m.id} onClick={() => setGroupDmMembers(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all text-xs", groupDmMembers.includes(m.id) ? "bg-primary/20 text-primary" : "bg-white/5 text-white/60 hover:bg-white/10")}>
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-black text-primary shrink-0">{(m.displayName || '?')[0]}</div>
                    <span className="font-bold truncate">{m.displayName}</span>
                    {groupDmMembers.includes(m.id) && <span className="ml-auto text-primary text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <Button
              disabled={isCreatingGroupDm || groupDmMembers.length < 2 || !groupDmName.trim()}
              onClick={async () => {
                if (!firestore || !user || groupDmMembers.length < 2 || !groupDmName.trim()) return;
                setIsCreatingGroupDm(true);
                try {
                  const allParticipants = [user.uid, ...groupDmMembers];
                  const docRef = await addDoc(collection(firestore, "chats"), { participants: allParticipants, public: false, isGroup: true, groupName: groupDmName.trim(), createdBy: user.uid, createdAt: serverTimestamp() });
                  setShowGroupDmModal(false);
                  setGroupDmName("");
                  setGroupDmMembers([]);
                  toast({ title: `Group '${groupDmName}' created!` });
                  navigateTo(`/chat/dm/${docRef.id}`, router);
                } catch(e) { toast({ variant: "destructive", title: "Failed to create group" }); } finally { setIsCreatingGroupDm(false); }
              }}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-black font-black uppercase text-[10px] rounded-xl shadow-lg border-none"
            >
              {isCreatingGroupDm ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null} Create Group ({groupDmMembers.length} members)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Settings Modal */}
      <Dialog open={showGlobalSettingsModal} onOpenChange={setShowGlobalSettingsModal}>
        <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-white p-8 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" /> Global Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Manage your XakChat preferences across all servers.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="notifications" className="w-full pt-4">
            <TabsList className="w-full grid grid-cols-2 mb-4 bg-black/40 border border-white/5">
              <TabsTrigger value="notifications" className="text-[10px] font-black uppercase">Notifications</TabsTrigger>
              <TabsTrigger value="appearance" className="text-[10px] font-black uppercase">Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-6 mt-0">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Notification Preferences</h4>
                <div className="space-y-2">
                  {['all', 'pings', 'specific', 'none'].map((pref) => (
                    <button 
                      key={pref}
                      onClick={() => setNotificationPref(pref)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
                        notificationPref === pref ? "border-emerald-500 bg-emerald-500/10" : "border-white/5 bg-black/40 hover:border-white/20"
                      )}
                    >
                      <div>
                        <p className={cn("text-sm font-bold uppercase", notificationPref === pref ? "text-emerald-400" : "text-white")}>
                          {pref === 'all' ? 'All Messages' : pref === 'pings' ? 'Pings Everywhere' : pref === 'specific' ? 'Pings in Specific Servers' : 'Mute All'}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {pref === 'all' ? 'Receive push notifications for every new message.' : pref === 'pings' ? 'Only notify me when I am explicitly @mentioned.' : pref === 'specific' ? 'Only receive pings from selected servers.' : 'Disable all notifications completely.'}
                        </p>
                      </div>
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0", notificationPref === pref ? "border-emerald-500" : "border-zinc-600")}>
                        {notificationPref === pref && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {notificationPref === 'specific' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Select Servers</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1 bg-black/40 p-2 rounded-xl border border-white/5">
                     {allServers.map((hub) => (
                       <button 
                         key={hub.id} 
                         onClick={() => setSelectedNotificationServers(prev => prev.includes(hub.id) ? prev.filter(id => id !== hub.id) : [...prev, hub.id])}
                         className={cn("w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors", selectedNotificationServers.includes(hub.id) ? "bg-emerald-500/20" : "hover:bg-white/5")}
                       >
                         <span className={cn("text-xs font-bold", selectedNotificationServers.includes(hub.id) ? "text-emerald-400" : "text-white")}>{hub.name}</span>
                         {selectedNotificationServers.includes(hub.id) && <span className="text-emerald-400 text-[10px]">✓</span>}
                       </button>
                     ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6 mt-0">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Custom CSS</h4>
                <p className="text-[10px] text-muted-foreground">Inject your own custom styling to personalize the chat interface.</p>
                <textarea 
                  value={customCssInput}
                  onChange={(e) => setCustomCssInput(e.target.value)}
                  className="w-full h-32 bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none transition-colors"
                  placeholder="/* Enter your custom CSS here */&#10;body {&#10;  --primary: #10b981;&#10;}"
                />
              </div>
            </TabsContent>

            <div className="mt-6">
              <Button 
                disabled={isSavingSettings}
                onClick={async () => {
                  if (!firestore || !user) return;
                  setIsSavingSettings(true);
                  try {
                    const userRef = doc(firestore, "users", user.uid);
                    await updateDoc(userRef, {
                      notificationPref,
                      selectedNotificationServers: notificationPref === 'specific' ? selectedNotificationServers : [],
                      customCss: customCssInput.trim()
                    });
                    toast({ title: "Settings Saved", description: "Your global preferences have been updated." });
                    setShowGlobalSettingsModal(false);
                  } catch(e) { toast({ variant: "destructive", title: "Error saving settings" }); } finally { setIsSavingSettings(false); }
                }}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg border-none"
              >
                {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null} Save Preferences
              </Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DMContactItem({ chatId, participants, activeChatId, currentUserId }: { chatId: string, participants: string[], activeChatId: string | null, currentUserId: string }) {
  const firestore = useFirestore();
  const router = useRouter();
  const friendId = participants.find(id => id !== currentUserId);

  const friendRef = useMemoFirebase(() => {
    if (!firestore || !friendId) return null;
    return doc(firestore, "users", friendId);
  }, [firestore, friendId]);

  const { data: friendData } = useDoc(friendRef);

  if (!friendData) return null;

  const displayName = friendData.displayName?.replace(/^@+/, "") || "Member";
  const username = friendData.username || friendId;
  const isSelected = activeChatId?.endsWith(`/chat/dm/${username}`);

  return (
    <button
      onClick={() => navigateTo(`/chat/dm/${username}`, router)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all text-left group",
        isSelected ? "bg-primary/20 text-white font-bold" : "text-white/40 hover:bg-white/5"
      )}
    >
      <div className="relative shrink-0">
        <RenderAura auraKey={friendData.aura} />
        <RenderDecor decorKey={friendData.decor} />
        <RenderHat hatKey={friendData.hat} />
        <Avatar className="w-8 h-8 rounded-lg border border-white/10">
          <AvatarImage src={friendData.photoURL} />
          <AvatarFallback className="bg-zinc-800 text-[10px] font-black text-white">{displayName[0]}</AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black",
          friendData.online === true ? "bg-emerald-500" : "bg-zinc-500"
        )} />
      </div>
      <div className="overflow-hidden">
        <p className={cn("font-bold truncate", isSelected ? "text-white" : "text-white/60 group-hover:text-white")}>{displayName}</p>
        <p className="text-[9px] text-muted-foreground truncate font-medium">@{username}</p>
      </div>
    </button>
  );
}

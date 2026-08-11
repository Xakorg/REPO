"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, Search, TrendingUp, UserPlus, Sparkles, Globe, Loader2,
  UserMinus, MessageSquare, LayoutGrid, Send, Plus, X, Mail, Flame,
  Info, ChevronRight, ShieldCheck, Heart, Zap, BadgeCheck, Smile,
  RefreshCw, Flag, Image as ImageIcon, BarChart2, Bookmark, Share2,
  Lock, Eye, EyeOff, Volume2, Wand2, Languages, Pin, ThumbsUp,
  Star, Award, Flame as FlameIcon, Check, MoreVertical, Bell, CheckCircle2, Shield
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { 
  collection, query, orderBy, limit, doc, setDoc, deleteDoc, 
  serverTimestamp, addDoc, updateDoc, increment, getDocs, where 
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { RenderHat, RenderBanner, RenderDecor, RenderAura, RenderPet, getNameplateClass } from "@/components/RenderHat";
import { SocialAnalyticsModal } from "@/components/social/SocialAnalyticsModal";
import { GroupCreateModal } from "@/components/social/GroupCreateModal";
import { chatWithXakAI } from "@/ai/flows/xak-ai-chat-assistant-flow";

export default function XakSocialPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const [feedFilter, setFeedFilter] = useState<"all" | "following" | "trending">("all");
  const [layoutMode, setLayoutMode] = useState<"single" | "grid">("single");

  // Post composer state
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["Option 1", "Option 2"]);
  const [showPollComposer, setShowPollComposer] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingAICaption, setIsGeneratingAICaption] = useState(false);

  // Stories state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [newStoryText, setNewStoryText] = useState("");

  // Modals state
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [translatedPosts, setTranslatedPosts] = useState<Record<string, string>>({});
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  // Active Comment Input
  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // ─── FIRESTORE QUERIES ────────────────────────────────────────────────────
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "posts"), orderBy("timestamp", "desc"), limit(100));
  }, [firestore]);

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "groups"), limit(50));
  }, [firestore]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users"), limit(100));
  }, [firestore, user]);

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "following");
  }, [firestore, user]);

  const storiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "stories"), orderBy("timestamp", "desc"), limit(20));
  }, [firestore]);

  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery);
  const { data: groups } = useCollection(groupsQuery);
  const { data: allUsers } = useCollection(usersQuery);
  const { data: followingList } = useCollection(followingQuery);
  const { data: stories } = useCollection(storiesQuery);

  const followingIds = useMemo(() => new Set(followingList?.map(f => f.id) || []), [followingList]);
  const visibleUsers = useMemo(() => allUsers?.filter(u => !u.isHidden) || [], [allUsers]);

  // ─── SOUND FX HELPER ──────────────────────────────────────────────────────
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  // ─── AI CAPTION GENERATOR ─────────────────────────────────────────────────
  const handleAICaption = async () => {
    setIsGeneratingAICaption(true);
    try {
      const res = await chatWithXakAI({
        message: "Write a short, viral, engaging social media post caption (1-2 sentences) about tech, coding, or modern lifestyle. Use 1 emoji."
      });
      setPostText(res.text.replace(/["']/g, "").trim());
      toast({ title: "AI Caption Generated! ✨" });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Offline" });
    } finally {
      setIsGeneratingAICaption(false);
    }
  };

  // ─── AI POST TRANSLATOR ───────────────────────────────────────────────────
  const handleTranslatePost = async (postId: string, text: string) => {
    toast({ title: "Translating Post...", description: "Xak AI is converting to English." });
    try {
      const res = await chatWithXakAI({
        message: `Translate the following text to English clearly: "${text}"`
      });
      setTranslatedPosts(prev => ({ ...prev, [postId]: res.text }));
      toast({ title: "Translated! 🌐" });
    } catch (e) {
      toast({ variant: "destructive", title: "Translation Failed" });
    }
  };

  // ─── POST CREATION WITH SAFETY SCAN ──────────────────────────────────────
  const handleCreatePost = async () => {
    if (!postText.trim() && !postImage) {
      toast({ variant: "destructive", title: "Empty Post", description: "Write something or attach an image." });
      return;
    }
    if (!user || !firestore) return;
    setIsPublishing(true);

    // AI Safety scan
    const BANNED_TERMS = ["hate", "abuse", "scam", "spam"];
    if (BANNED_TERMS.some(term => postText.toLowerCase().includes(term))) {
      toast({ variant: "destructive", title: "Safety Shield Intercepted", description: "Post contained restricted terms." });
      setIsPublishing(false);
      return;
    }

    try {
      const cleanName = user.displayName?.replace(/^@+/, "") || "Member";
      const userDataDoc = allUsers?.find(u => u.id === user.uid);
      
      const hashtags = (postText.match(/#[a-zA-Z0-9_]+/g) || []).map(h => h.toLowerCase());

      await addDoc(collection(firestore, "posts"), {
        authorId: user.uid,
        authorName: cleanName,
        authorPhoto: user.photoURL || "",
        content: postText,
        imageUrl: postImage || null,
        isSpoiler: isSpoiler,
        hashtags: hashtags,
        groupId: selectedGroupFilter || null,
        poll: showPollComposer && pollQuestion.trim() ? {
          question: pollQuestion.trim(),
          options: pollOptions.filter(o => o.trim()).map(o => ({ text: o.trim(), votes: 0, voters: [] }))
        } : null,
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        timestamp: serverTimestamp(),
        aura: userDataDoc?.aura || null,
        nameplate: userDataDoc?.nameplate || null,
        hat: userDataDoc?.hat || null,
        pet: userDataDoc?.pet || null
      });

      playChime();
      toast({ title: "Post Published! 🚀" });
      setPostText("");
      setPostImage("");
      setIsSpoiler(false);
      setShowPollComposer(false);
      setPollQuestion("");
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to publish" });
    } finally {
      setIsPublishing(false);
    }
  };

  // ─── LIKE / REACTION TOGGLE ───────────────────────────────────────────────
  const handleLikePost = async (post: any) => {
    if (!user || !firestore) return;
    const postRef = doc(firestore, "posts", post.id);
    const likedBy: string[] = post.likedBy || [];
    const isLiked = likedBy.includes(user.uid);

    try {
      playChime();
      if (isLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: likedBy.filter(id => id !== user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...likedBy, user.uid]
        });
      }
    } catch (e) {}
  };

  // ─── POLL VOTING ─────────────────────────────────────────────────────────
  const handleVotePoll = async (post: any, optIndex: number) => {
    if (!user || !firestore || !post.poll) return;
    const postRef = doc(firestore, "posts", post.id);
    const poll = post.poll;
    
    // Check if user already voted in any option
    const alreadyVoted = poll.options.some((o: any) => o.voters?.includes(user.uid));
    if (alreadyVoted) {
      toast({ title: "Already Voted", description: "You have already cast your vote in this poll." });
      return;
    }

    const updatedOptions = poll.options.map((opt: any, idx: number) => {
      if (idx === optIndex) {
        return {
          ...opt,
          votes: (opt.votes || 0) + 1,
          voters: [...(opt.voters || []), user.uid]
        };
      }
      return opt;
    });

    try {
      await updateDoc(postRef, { "poll.options": updatedOptions });
      playChime();
      toast({ title: "Vote Recorded! 📊" });
    } catch (e) {}
  };

  // ─── ADD COMMENT ─────────────────────────────────────────────────────────
  const handleAddComment = async (postId: string) => {
    const text = commentTextMap[postId];
    if (!text || !text.trim() || !user || !firestore) return;

    try {
      await addDoc(collection(firestore, "posts", postId, "comments"), {
        authorId: user.uid,
        authorName: user.displayName?.replace(/^@+/, "") || "Member",
        authorPhoto: user.photoURL || "",
        content: text.trim(),
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(firestore, "posts", postId), { commentsCount: increment(1) });
      setCommentTextMap(prev => ({ ...prev, [postId]: "" }));
      playChime();
      toast({ title: "Comment Added! 💬" });
    } catch (e) {}
  };

  // ─── CREATE STORY ────────────────────────────────────────────────────────
  const handleCreateStory = async () => {
    if (!newStoryText.trim() || !user || !firestore) return;
    try {
      await addDoc(collection(firestore, "stories"), {
        authorId: user.uid,
        authorName: user.displayName?.replace(/^@+/, "") || "Member",
        authorPhoto: user.photoURL || "",
        content: newStoryText.trim(),
        timestamp: serverTimestamp()
      });
      setShowStoryModal(false);
      setNewStoryText("");
      playChime();
      toast({ title: "24h Story Live! 🌟" });
    } catch (e) {}
  };

  // ─── REPOST / QUOTE ──────────────────────────────────────────────────────
  const handleRepost = async (post: any) => {
    if (!user || !firestore) return;
    try {
      await addDoc(collection(firestore, "posts"), {
        authorId: user.uid,
        authorName: user.displayName?.replace(/^@+/, "") || "Member",
        authorPhoto: user.photoURL || "",
        content: `🔄 Reposted @${post.authorName}: "${post.content.slice(0, 100)}..."`,
        timestamp: serverTimestamp(),
        likes: 0,
        likedBy: []
      });
      playChime();
      toast({ title: "Reposted to your feed! 🔄" });
    } catch (e) {}
  };

  // ─── BOOKMARK TOGGLE ─────────────────────────────────────────────────────
  const toggleBookmark = (postId: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    toast({ title: bookmarks.has(postId) ? "Removed from Bookmarks" : "Saved to Bookmarks! 🔖" });
  };

  // ─── FOLLOW / UNFOLLOW ────────────────────────────────────────────────────
  const handleFollow = async (member: any) => {
    if (!user || !firestore) return;
    const followRef = doc(firestore, "users", user.uid, "following", member.id);
    const isFollowing = followingIds.has(member.id);

    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        toast({ title: `Unfollowed @${member.displayName}` });
      } else {
        await setDoc(followRef, {
          id: member.id,
          displayName: member.displayName,
          photoURL: member.photoURL || "",
          timestamp: serverTimestamp()
        });
        toast({ title: `Followed @${member.displayName}! 🎉` });
      }
    } catch (e) {}
  };

  // ─── TRENDING HASHTAGS COMPUTATION ────────────────────────────────────────
  const trendingHashtags = useMemo(() => {
    const counts: Record<string, number> = {};
    posts?.forEach(p => {
      p.hashtags?.forEach((tag: string) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [posts]);

  // ─── FILTERED POSTS ───────────────────────────────────────────────────────
  const filteredPosts = useMemo(() => {
    let list = posts || [];
    if (selectedGroupFilter) list = list.filter(p => p.groupId === selectedGroupFilter);
    if (feedFilter === "following") list = list.filter(p => followingIds.has(p.authorId) || p.authorId === user?.uid);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => (p.content || "").toLowerCase().includes(q) || (p.authorName || "").toLowerCase().includes(q));
    }
    return list;
  }, [posts, selectedGroupFilter, feedFilter, searchQuery, followingIds, user]);

  if (!mounted) return null;

  return (
    <div className="max-w-[1600px] mx-auto py-6 animate-fade-in px-6 pb-20 text-foreground">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-8 rounded-[3rem] border-white/20 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-5 animate-float pointer-events-none">
          <Globe className="w-80 h-80 -rotate-12 text-pink-500" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.8rem] bg-pink-500/10 flex items-center justify-center border-4 border-pink-500/20 shadow-2xl">
            <Globe className="w-8 h-8 text-pink-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Xakteir Social</h1>
            <p className="text-pink-400 font-black uppercase tracking-[0.4em] text-[9px] mt-2 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" /> Global Community Feed Active
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Button onClick={() => setShowAnalytics(true)} variant="outline" className="rounded-2xl border-white/10 text-white font-bold text-xs h-11 px-4 bg-white/5 hover:bg-white/10">
            <BarChart2 className="w-4 h-4 mr-2 text-pink-400" /> Analytics
          </Button>
          <Button onClick={() => setIsCreatingGroup(true)} className="rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs h-11 px-5 shadow-xl">
            <Plus className="w-4 h-4 mr-2" /> New Group
          </Button>
        </div>
      </header>

      {/* ── 24h Expiring Stories Bar ── */}
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setShowStoryModal(true)}
            className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-pink-500/50 flex items-center justify-center bg-pink-500/10 group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6 text-pink-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-400">Add Story</span>
          </div>

          {stories?.map((st) => (
            <div key={st.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 group-hover:scale-105 transition-transform">
                <Avatar className="w-full h-full border-2 border-black rounded-full">
                  <AvatarImage src={st.authorPhoto} />
                  <AvatarFallback className="bg-secondary text-xs font-bold">{st.authorName?.[0]}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] font-bold text-white/70 truncate max-w-[70px]">{st.authorName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Navigation Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-secondary/30 p-2 rounded-[2.5rem] h-18 gap-4 border-4 border-white/10 shadow-xl w-full max-w-4xl mx-auto flex">
          <TabsTrigger value="feed" className="flex-1 rounded-[1.5rem] h-full font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-pink-600 data-[state=active]:text-white transition-all"><MessageSquare className="w-4 h-4 mr-2" /> Timeline Feed</TabsTrigger>
          <TabsTrigger value="groups" className="flex-1 rounded-[1.5rem] h-full font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-pink-600 data-[state=active]:text-white transition-all"><LayoutGrid className="w-4 h-4 mr-2" /> Groups ({groups?.length || 0})</TabsTrigger>
          <TabsTrigger value="members" className="flex-1 rounded-[1.5rem] h-full font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-pink-600 data-[state=active]:text-white transition-all"><Users className="w-4 h-4 mr-2" /> Registry ({visibleUsers.length})</TabsTrigger>
        </TabsList>

        {/* ── TIMELINE FEED TAB ── */}
        <TabsContent value="feed" className="animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Feed Column */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Rich Post Composer Card */}
              <Card className="glass-card rounded-[2.5rem] p-6 border-white/15 shadow-2xl bg-black/40 space-y-4">
                <div className="flex gap-4">
                  <Avatar className="w-12 h-12 border-2 border-pink-500/30">
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback className="bg-pink-500 text-white font-bold">{user?.displayName?.[0] || "U"}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <Textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="What's happening across Xakteir? Share thoughts, code, or updates..."
                      className="bg-white/5 border-white/10 rounded-2xl p-4 text-xs font-medium text-white resize-none min-h-[90px] focus:border-pink-500/50"
                    />

                    {/* Image URL Input Preview */}
                    {postImage && (
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-48">
                        <img src={postImage} alt="Attachment" className="w-full h-full object-cover" />
                        <Button size="icon" variant="ghost" onClick={() => setPostImage("")} className="absolute top-2 right-2 bg-black/60 rounded-full h-7 w-7 text-white">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Poll Creator Inputs */}
                    {showPollComposer && (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <Input
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          placeholder="Ask a community question..."
                          className="bg-black/40 border-white/10 text-xs text-white"
                        />
                        {pollOptions.map((opt, i) => (
                          <Input
                            key={i}
                            value={opt}
                            onChange={(e) => {
                              const copy = [...pollOptions];
                              copy[i] = e.target.value;
                              setPollOptions(copy);
                            }}
                            placeholder={`Option ${i + 1}`}
                            className="bg-black/40 border-white/10 text-xs text-white h-9"
                          />
                        ))}
                      </div>
                    )}

                    {/* Composer Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            const url = prompt("Enter image/GIF URL:");
                            if (url) setPostImage(url);
                          }}
                          className="h-9 px-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs"
                        >
                          <ImageIcon className="w-4 h-4 text-pink-400 mr-1.5" /> Media
                        </Button>

                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowPollComposer(!showPollComposer)}
                          className="h-9 px-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs"
                        >
                          <BarChart2 className="w-4 h-4 text-indigo-400 mr-1.5" /> Poll
                        </Button>

                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsSpoiler(!isSpoiler)}
                          className={cn("h-9 px-3 rounded-xl text-xs", isSpoiler ? "bg-amber-500/20 text-amber-400" : "text-white/70 hover:text-white hover:bg-white/10")}
                        >
                          <EyeOff className="w-4 h-4 mr-1.5" /> Spoiler
                        </Button>

                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={handleAICaption}
                          disabled={isGeneratingAICaption}
                          className="h-9 px-3 rounded-xl text-xs text-emerald-400 hover:bg-emerald-500/10"
                        >
                          {isGeneratingAICaption ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Wand2 className="w-4 h-4 mr-1.5" />} AI Draft
                        </Button>
                      </div>

                      <Button onClick={handleCreatePost} disabled={isPublishing} className="bg-pink-600 hover:bg-pink-500 text-white font-black uppercase text-xs rounded-xl px-6 h-10 shadow-lg">
                        {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Feed Filter Bar */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                  <Button onClick={() => setFeedFilter("all")} variant="ghost" className={cn("h-8 rounded-xl text-[10px] font-bold uppercase px-3", feedFilter === "all" ? "bg-pink-600 text-white" : "text-white/60")}>All Posts</Button>
                  <Button onClick={() => setFeedFilter("following")} variant="ghost" className={cn("h-8 rounded-xl text-[10px] font-bold uppercase px-3", feedFilter === "following" ? "bg-pink-600 text-white" : "text-white/60")}>Following</Button>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search feed..."
                    className="h-9 w-48 bg-white/5 border-white/10 text-xs rounded-xl text-white"
                  />
                  <Button onClick={() => setLayoutMode(layoutMode === "single" ? "grid" : "single")} variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-white/10 text-white">
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Posts Stream */}
              <div className={cn("space-y-6", layoutMode === "grid" && "grid grid-cols-2 gap-6 space-y-0")}>
                {isPostsLoading ? (
                  <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-pink-400 mx-auto" /></div>
                ) : filteredPosts.length === 0 ? (
                  <div className="py-20 text-center text-white/40 text-xs uppercase font-bold tracking-widest bg-white/5 rounded-3xl border border-white/10">
                    No social posts found
                  </div>
                ) : filteredPosts.map((post) => {
                  const isLiked = (post.likedBy || []).includes(user?.uid);
                  const isBookmarked = bookmarks.has(post.id);
                  const isHiddenSpoiler = post.isSpoiler && !revealedSpoilers.has(post.id);

                  return (
                    <Card key={post.id} className="glass-card rounded-[2.5rem] p-6 border-white/10 bg-black/40 space-y-4 hover:border-white/20 transition-all">
                      {/* Post Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className={cn("relative rounded-full p-0.5 cursor-pointer", post.aura && `aura-${post.aura}`)}
                            onClick={() => setSelectedMember(allUsers?.find(u => u.id === post.authorId))}
                          >
                            <Avatar className="w-10 h-10 border-2 border-white/10">
                              <AvatarImage src={post.authorPhoto} />
                              <AvatarFallback className="bg-pink-500 text-white font-bold">{post.authorName?.[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={cn("text-xs font-black uppercase tracking-wider text-white cursor-pointer", post.nameplate && `nameplate-${post.nameplate}`)} onClick={() => setSelectedMember(allUsers?.find(u => u.id === post.authorId))}>
                                {post.authorName}
                              </span>
                              <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />
                            </div>
                            <span className="text-[9px] text-white/40 font-bold uppercase">
                              {post.timestamp?.seconds ? new Date(post.timestamp.seconds * 1000).toLocaleString() : "Just now"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button onClick={() => handleTranslatePost(post.id, post.content)} variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/50 hover:text-white">
                            <Languages className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => toggleBookmark(post.id)} variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", isBookmarked ? "text-amber-400" : "text-white/50 hover:text-white")}>
                            <Bookmark className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="relative">
                        {isHiddenSpoiler ? (
                          <div 
                            onClick={() => setRevealedSpoilers(prev => new Set([...prev, post.id]))}
                            className="p-6 rounded-2xl bg-white/5 border border-dashed border-amber-500/40 text-center cursor-pointer hover:bg-white/10 transition-colors"
                          >
                            <EyeOff className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Spoiler Content — Click to Reveal</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs text-white/90 font-medium leading-relaxed italic whitespace-pre-line">
                              {post.content}
                            </p>

                            {/* Translated text overlay if exists */}
                            {translatedPosts[post.id] && (
                              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 italic">
                                🌐 {translatedPosts[post.id]}
                              </div>
                            )}

                            {/* Attached Media Image */}
                            {post.imageUrl && (
                              <div className="rounded-2xl overflow-hidden border border-white/10 max-h-96">
                                <img src={post.imageUrl} alt="Post attachment" className="w-full h-full object-cover" />
                              </div>
                            )}

                            {/* Interactive Poll Rendering */}
                            {post.poll && (
                              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                  <BarChart2 className="w-4 h-4" /> {post.poll.question}
                                </span>
                                {post.poll.options?.map((opt: any, idx: number) => {
                                  const totalVotes = post.poll.options.reduce((acc: number, curr: any) => acc + (curr.votes || 0), 0);
                                  const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                                  return (
                                    <div key={idx} onClick={() => handleVotePoll(post, idx)} className="relative p-3 rounded-xl bg-black/40 border border-white/10 cursor-pointer overflow-hidden group">
                                      <div className="absolute inset-y-0 left-0 bg-indigo-500/20 transition-all" style={{ width: `${pct}%` }} />
                                      <div className="relative z-10 flex justify-between text-xs font-bold text-white">
                                        <span>{opt.text}</span>
                                        <span className="text-indigo-400">{pct}% ({opt.votes || 0})</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Post Actions Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-4">
                          <Button onClick={() => handleLikePost(post)} variant="ghost" size="sm" className={cn("h-9 px-3 rounded-xl text-xs font-bold gap-1.5", isLiked ? "text-pink-500 bg-pink-500/10" : "text-white/60 hover:text-white")}>
                            <Heart className={cn("w-4 h-4", isLiked && "fill-pink-500")} /> {post.likes || 0}
                          </Button>

                          <Button onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-xs font-bold text-white/60 hover:text-white gap-1.5">
                            <MessageSquare className="w-4 h-4" /> {post.commentsCount || 0}
                          </Button>

                          <Button onClick={() => handleRepost(post)} variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-xs font-bold text-white/60 hover:text-white gap-1.5">
                            <Share2 className="w-4 h-4" /> Share
                          </Button>
                        </div>
                      </div>

                      {/* Comment Input Thread Section */}
                      {activeCommentPostId === post.id && (
                        <div className="pt-3 border-t border-white/10 space-y-3">
                          <div className="flex gap-2">
                            <Input
                              value={commentTextMap[post.id] || ""}
                              onChange={(e) => setCommentTextMap(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Write a comment..."
                              className="h-10 bg-white/5 border-white/10 rounded-xl text-xs text-white"
                            />
                            <Button onClick={() => handleAddComment(post.id)} className="h-10 px-4 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs">
                              Send
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Trending Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Trending Hashtags Card */}
              <Card className="glass-card rounded-[2.5rem] p-6 border-white/10 bg-gradient-to-br from-pink-500/10 via-black/40 to-transparent shadow-xl space-y-4">
                <h3 className="text-lg font-black uppercase italic text-pink-400 flex items-center gap-2">
                  <Flame className="w-5 h-5 animate-pulse" /> Trending Hashtags
                </h3>

                <div className="space-y-2">
                  {trendingHashtags.length === 0 ? (
                    <p className="text-xs text-white/40 italic">No trending topics yet</p>
                  ) : trendingHashtags.map(([tag, count], i) => (
                    <div key={i} onClick={() => setSearchQuery(tag)} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-pink-500/40 transition-all flex items-center justify-between cursor-pointer group">
                      <div>
                        <span className="text-xs font-bold text-white group-hover:text-pink-400 transition-colors">{tag}</span>
                        <p className="text-[9px] text-white/40 uppercase font-bold">{count} posts</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommended Members Card */}
              <Card className="glass-card rounded-[2.5rem] p-6 border-white/10 bg-black/40 space-y-4">
                <h3 className="text-lg font-black uppercase italic text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" /> Creators to Follow
                </h3>

                <div className="space-y-3">
                  {visibleUsers.slice(0, 4).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-9 h-9 border border-white/10">
                          <AvatarImage src={m.photoURL} />
                          <AvatarFallback className="bg-secondary text-xs font-bold">{m.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold text-white truncate max-w-[100px]">{m.displayName?.replace(/^@+/, "")}</span>
                      </div>
                      <Button onClick={() => handleFollow(m)} variant="outline" className="h-8 px-3 rounded-xl text-[10px] font-bold border-white/20 text-white">
                        {followingIds.has(m.id) ? "Following" : "Follow"}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── GROUPS TAB ── */}
        <TabsContent value="groups" className="animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
            <Card onClick={() => setIsCreatingGroup(true)} className="glass-card rounded-[3rem] border-4 border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center space-y-6 group hover:border-pink-500/40 transition-all cursor-pointer">
              <div className="w-20 h-20 rounded-[2.5rem] bg-secondary/50 flex items-center justify-center group-hover:bg-pink-500/20 transition-all shadow-xl">
                <Plus className="w-10 h-10 text-muted-foreground group-hover:text-pink-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Create Group</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Build a new Hub community</p>
              </div>
            </Card>

            {groups?.map(group => (
              <Card key={group.id} onClick={() => { setSelectedGroupFilter(group.id); setActiveTab("feed"); toast({ title: `Filtered feed by ${group.name}` }); }} className="glass-card rounded-[3rem] border-white/10 overflow-hidden hover:border-pink-500/40 transition-all group cursor-pointer shadow-2xl flex flex-col">
                <div className="h-32 bg-gradient-to-br from-pink-500/30 to-purple-500/30 p-8 flex justify-between items-start relative">
                  <Badge className="bg-black/60 border-none text-[8px] px-3 font-black z-10">{group.isPrivate ? "PRIVATE" : "PUBLIC"}</Badge>
                  <Users className="w-10 h-10 text-white/40 group-hover:text-white transition-colors z-10" />
                </div>
                <CardContent className="p-8 flex-1 space-y-6">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none group-hover:text-pink-400 transition-colors text-white">{group.name}</h3>
                  <p className="text-sm font-medium italic text-muted-foreground line-clamp-3 leading-relaxed">{group.description}</p>
                  <div className="pt-4 flex justify-between items-center border-t border-white/5">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">{group.memberCount || 1} Members</span>
                    <Button variant="ghost" className="h-9 px-6 rounded-xl font-black uppercase text-[9px] text-pink-400 hover:bg-pink-500/10">View Wall</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── REGISTRY MEMBERS TAB ── */}
        <TabsContent value="members" className="animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleUsers.map(u => (
              <Card key={u.id} className="glass-card rounded-[2.5rem] p-8 border-white/5 flex flex-col items-center text-center gap-6 group hover:border-pink-500/20 transition-all text-foreground bg-black/20">
                <div className={cn("relative rounded-full p-1.5 transition-all duration-500", u.aura && `aura-${u.aura}`)}>
                  <Avatar className="w-24 h-24 rounded-full border-4 border-pink-500/20 shadow-xl group-hover:scale-105 transition-transform cursor-pointer" onClick={() => setSelectedMember(u)}>
                    <AvatarImage src={u.photoURL} />
                    <AvatarFallback className="bg-secondary text-2xl font-black">{u.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h4 className={cn("text-xl font-black uppercase italic tracking-tight truncate w-48 px-2 py-1", u.nameplate && `nameplate-${u.nameplate}`)}>
                    {u.displayName?.replace(/^@+/, "")}
                  </h4>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">@{u.username || "member"}</p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button onClick={() => setSelectedMember(u)} variant="outline" className="flex-1 rounded-xl h-10 text-[9px] font-black uppercase border-white/10 text-white">Profile</Button>
                  {u.id !== user?.uid && (
                    <Button onClick={() => handleFollow(u)} className={cn("flex-1 rounded-xl h-10 font-black uppercase text-[9px] shadow-xl", followingIds.has(u.id) ? "bg-secondary text-white" : "bg-pink-600 text-white")}>
                      {followingIds.has(u.id) ? "Unfollow" : "Follow"}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── MEMBER PROFILE DIALOG ── */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="w-full max-w-2xl p-0 overflow-hidden bg-[#0c0c16]/95 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl text-foreground">
          <DialogHeader className="sr-only">
            <DialogTitle>Member Profile: {selectedMember?.displayName || 'Profile'}</DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <div className="h-32 w-full relative overflow-hidden z-10">
              <RenderBanner bannerKey={selectedMember?.banner} className="absolute inset-0 w-full h-full object-cover" />
              {!selectedMember?.banner && <div className="absolute inset-0 bg-gradient-to-r from-pink-900 to-purple-900" />}
              <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-rose-600 z-50">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="px-6 relative z-20 flex justify-between items-end -mt-16 mb-4">
              <div className="relative p-1 rounded-[3rem] bg-[#0c0c16] z-20">
                <RenderDecor decorKey={selectedMember?.decor} />
                <RenderAura auraKey={selectedMember?.aura} />
                <RenderHat hatKey={selectedMember?.hat} />
                <RenderPet petKey={selectedMember?.pet} />
                
                <Avatar className="w-28 h-28 border-[6px] border-[#0c0c16] rounded-[2.2rem] shadow-2xl overflow-hidden bg-secondary relative z-20">
                  <AvatarImage src={selectedMember?.photoURL || ""} className="object-cover" />
                  <AvatarFallback className="bg-pink-500 text-3xl font-black text-white">{selectedMember?.displayName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/5 mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <FlameIcon className="w-4 h-4 text-purple-400 fill-purple-400" />
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <Award className="w-4 h-4 text-pink-400 fill-pink-400" />
              </div>
            </div>

            <div className="px-8 pb-4">
              <h4 className={cn("text-3xl font-black tracking-tighter italic uppercase leading-none break-words", getNameplateClass(selectedMember?.nameplate))}>
                {selectedMember?.displayName?.replace(/^@+/, "") || "Member"}
              </h4>
              <p className="text-[10px] text-muted-foreground font-black tracking-widest mt-1">@{selectedMember?.username || "member"}</p>
            </div>

            <div className="px-8 py-4 space-y-4 border-t border-white/5">
              <div>
                <h5 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">About Me</h5>
                <p className="text-xs text-white/80 font-bold italic">{selectedMember?.aboutMe || "Multiverse voyager & code explorer across Xakteir."}</p>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => handleFollow(selectedMember)} className="flex-1 h-11 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold text-xs">
                  {followingIds.has(selectedMember?.id) ? "Unfollow" : "Follow Member"}
                </Button>
                <Button onClick={() => { setSelectedMember(null); toast({ title: "Opening Direct Chat..." }); }} variant="outline" className="flex-1 h-11 border-white/10 text-white rounded-xl font-bold text-xs">
                  Direct Message
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CREATE STORY MODAL ── */}
      <Dialog open={showStoryModal} onOpenChange={setShowStoryModal}>
        <DialogContent className="glass-card border-white/20 rounded-[2.5rem] max-w-md text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-2">
              <Plus className="w-5 h-5 text-pink-400" /> Publish 24h Story
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              value={newStoryText}
              onChange={(e) => setNewStoryText(e.target.value)}
              placeholder="What's your quick story highlight today?"
              className="bg-white/5 border-white/10 text-xs text-white resize-none h-24 rounded-2xl"
            />
            <Button onClick={handleCreateStory} className="w-full h-11 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs">
              Share Story
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── ANALYTICS MODAL ── */}
      <SocialAnalyticsModal
        open={showAnalytics}
        onOpenChange={setShowAnalytics}
        totalPosts={posts?.length || 0}
        totalLikes={posts?.reduce((acc, p) => acc + (p.likes || 0), 0) || 0}
        totalComments={posts?.reduce((acc, p) => acc + (p.commentsCount || 0), 0) || 0}
        followersCount={followingIds.size}
      />

      {/* ── GROUP CREATION MODAL ── */}
      <GroupCreateModal
        open={isCreatingGroup}
        onOpenChange={setIsCreatingGroup}
        onCreateGroup={async (g) => {
          if (!user || !firestore) return;
          await addDoc(collection(firestore, "groups"), {
            name: g.name,
            description: g.description,
            isPrivate: g.isPrivate,
            bannerUrl: g.bannerUrl,
            ownerId: user.uid,
            memberCount: 1,
            timestamp: serverTimestamp()
          });
        }}
      />
    </div>
  );
}
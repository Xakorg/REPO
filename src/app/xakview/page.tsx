"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Share2, 
  ThumbsUp, 
  Tv, 
  TrendingUp, 
  Eye, 
  Search, 
  Loader2, 
  Video as VideoIcon, 
  UserPlus, 
  Monitor, 
  Radio, 
  Send, 
  UserMinus, 
  LayoutGrid, 
  ChevronRight, 
  Circle, 
  Activity,
  Flame,
  TvIcon,
  CheckCircle2,
  Bell,
  MessageSquare,
  Users as UsersIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc, serverTimestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const INVIDIOUS_INSTANCES = [
  "https://yewtu.be",
  "https://invidious.flokinet.to",
  "https://invidious.nerdvpn.de",
  "https://iv.melmac.space",
  "https://invidious.projectsegfaut.im"
];

const searchYoutubeVideos = async (queryText: string) => {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(queryText)}&type=video`);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          id: `yt_${item.videoId}`,
          youtubeId: item.videoId,
          title: item.title,
          author: item.author || "YouTube Creator",
          authorId: "youtube_" + (item.author ? item.author.replace(/\s+/g, "").toLowerCase() : "creator"),
          authorPhoto: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(item.author || item.videoId)}`,
          views: item.viewCount || Math.floor(Math.random() * 500000) + 50000,
          likes: Math.floor((item.viewCount || 100000) * 0.05),
          description: item.description || `YouTube video by ${item.author || "Creator"}.`,
          isYoutube: true
        }));
      }
    } catch (e) {
      console.warn(`Failed YouTube search via ${instance}`, e);
    }
  }
  return [];
};

export default function XakViewPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<"videos" | "live" | "creators">("videos");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoState, setSelectedVideo] = useState<any>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [liveChatInput, setLiveChatInput] = useState("");

  const [youtubeImportInput, setYoutubeImportInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([]);
  const [isYTSearching, setIsYTSearching] = useState(false);
  
  const [liveChats, setLiveChats] = useState<Array<{ user: string, text: string }>>([
    { user: "SpecterX", text: "this stream is crazy fire!" },
    { user: "Hacker_Zero", text: "what's the music track?" },
    { user: "RL_God", text: "Calculated." },
    { user: "NeonViper", text: "Insane mechanical plays here!" }
  ]);

  useEffect(() => { setMounted(true); }, []);

  // Debounced search for YouTube videos
  useEffect(() => {
    if (!searchQuery.trim()) {
      setYoutubeVideos([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsYTSearching(true);
      const results = await searchYoutubeVideos(searchQuery);
      setYoutubeVideos(results);
      setIsYTSearching(false);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleImportYoutube = async (url: string) => {
    if (!url || !firestore) return;
    const reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(reg);
    if (!match) {
      toast({ variant: "destructive", title: "Invalid Link", description: "Please enter a valid YouTube video URL." });
      return;
    }
    const videoId = match[1];
    setIsImporting(true);
    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      
      await addDocumentNonBlocking(collection(firestore, "videos"), {
        title: data.title || "YouTube Video",
        youtubeId: videoId,
        author: data.author_name || "YouTube Creator",
        authorId: "youtube_" + (data.author_name ? data.author_name.replace(/\s+/g, "").toLowerCase() : "creator"),
        authorPhoto: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.author_name || videoId)}`,
        description: `YouTube video by ${data.author_name || "Creator"}. Imported to XakView.`,
        views: Math.floor(Math.random() * 900000) + 100000,
        likes: Math.floor(Math.random() * 50000) + 5000,
        timestamp: serverTimestamp()
      });
      toast({ title: "Video Imported!", description: `"${data.title}" has been added to XakView.` });
      setYoutubeImportInput("");
    } catch (err) {
      await addDocumentNonBlocking(collection(firestore, "videos"), {
        title: "Imported YouTube Video",
        youtubeId: videoId,
        author: "YouTube Creator",
        authorId: "youtube_creator",
        authorPhoto: `https://api.dicebear.com/7.x/identicon/svg?seed=${videoId}`,
        description: "YouTube Video imported into XakView.",
        views: 45000,
        likes: 2100,
        timestamp: serverTimestamp()
      });
      toast({ title: "Imported with default metadata", description: "Direct YouTube Link import successful." });
      setYoutubeImportInput("");
    } finally {
      setIsImporting(false);
    }
  };

  // Fetch videos from DB
  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "videos"), orderBy("timestamp", "desc"), limit(50));
  }, [firestore]);

  const { data: dbVideos, isLoading: isVideosLoading } = useCollection(videosQuery);

  // Fetch creators/users from DB
  const creatorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), limit(100));
  }, [firestore]);

  const { data: dbCreators, isLoading: isCreatorsLoading } = useCollection(creatorsQuery);

  // Filter videos based on search & merge dynamic YouTube results
  const filteredVideos = useMemo(() => {
    const localList = dbVideos || [];
    let list = [...localList];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v => 
        v.title?.toLowerCase().includes(q) || 
        v.description?.toLowerCase().includes(q)
      );
    }
    // Append unique youtube results
    const combined = [...list];
    youtubeVideos.forEach(yt => {
      if (!combined.some(v => v.youtubeId === yt.youtubeId)) {
        combined.push(yt);
      }
    });
    return combined;
  }, [dbVideos, searchQuery, youtubeVideos]);

  // Filter creators based on search
  const filteredCreators = useMemo(() => {
    const list = dbCreators || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(c => 
      c.displayName?.toLowerCase().includes(q) || 
      c.username?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [dbCreators, searchQuery]);

  const activeVideo = selectedVideoState || filteredVideos?.[0];

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !activeVideo) return null;
    return query(collection(firestore, "videos", activeVideo.id, "comments"), orderBy("timestamp", "desc"), limit(20));
  }, [firestore, activeVideo]);

  const { data: dbComments } = useCollection(commentsQuery);

  const comments = useMemo(() => {
    return dbComments || [];
  }, [dbComments]);

  // Subscriptions logic
  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "following");
  }, [firestore, user]);

  const { data: following } = useCollection(followingQuery);

  const isFollowingCreator = (creatorId: string) => {
    return following?.some(f => f.id === creatorId);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !commentInput.trim() || !activeVideo) return;
    addDocumentNonBlocking(collection(firestore, "videos", activeVideo.id, "comments"), {
      userId: user.uid,
      userName: user.displayName?.replace(/^@+/, "") || "Member",
      userPhoto: user.photoURL || "",
      text: commentInput,
      timestamp: serverTimestamp()
    });
    setCommentInput("");
  };

  const toggleFollow = (creatorId: string, creatorName: string, creatorPhoto: string) => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Sign in to subscribe to creators." });
      return;
    }
    
    const ref = doc(firestore, "users", user.uid, "following", creatorId);
    const followingActive = isFollowingCreator(creatorId);

    if (followingActive) {
      deleteDocumentNonBlocking(ref);
      toast({ title: "Unsubscribed", description: `You have unsubscribed from ${creatorName}.` });
    } else {
      setDocumentNonBlocking(ref, { 
        id: creatorId, 
        displayName: creatorName, 
        photoURL: creatorPhoto || "", 
        timestamp: serverTimestamp() 
      }, { merge: true });

      toast({ 
        title: "Subscribed!", 
        description: `Successfully subscribed to ${creatorName}. Notifications active!` 
      });

      // Trigger a simulated video upload notification after 5 seconds
      setTimeout(async () => {
        const videoTitles = [
          "My secret strategy for coding web applications",
          "Conquering the ultimate gaming tournament!",
          "Special community update and workspace showcase",
          "Behind the scenes vlog & project planning"
        ];
        const randomTitle = videoTitles[Math.floor(Math.random() * videoTitles.length)];
        
        const notifRef = collection(firestore, "users", user.uid, "notifications");
        await addDocumentNonBlocking(notifRef, {
          title: `New Video from ${creatorName}`,
          message: `${creatorName} just uploaded a new video: "${randomTitle}"! Go watch it now in XakView.`,
          type: "social",
          read: false,
          timestamp: serverTimestamp()
        });
      }, 5000);
    }
  };

  // Simulate active stream chat messages
  useEffect(() => {
    if (activeViewTab !== 'live') return;
    const interval = setInterval(() => {
      const users = ["PixelVandal", "SoberRobloxian", "ChronoTrig", "XakteirArchitect", "GlitchKid", "MatrixRunner", "NeonViper", "RL_Legend"];
      const msgs = [
        "Let's gooo! 🎉",
        "Is this live?",
        "Xakteir OS handles this so smoothly.",
        "Lofi study beats are helping me code.",
        "RLCS has the best community.",
        "Subscribe to this creator!",
        "Calculated.",
        "Wow! Incredible mechanical play!",
        "No way that just happened 😂",
        "Awesome stream setup!"
      ];
      const randUser = users[Math.floor(Math.random() * users.length)];
      const randMsg = msgs[Math.floor(Math.random() * msgs.length)];
      setLiveChats(prev => [...prev.slice(-20), { user: randUser, text: randMsg }]);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeViewTab]);

  const handlePostLiveChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChatInput.trim()) return;
    const displayName = user?.displayName?.replace(/^@+/, "") || "Member";
    setLiveChats(prev => [...prev, { user: displayName, text: liveChatInput }]);
    setLiveChatInput("");
  };

  const liveVideos = useMemo(() => {
    return filteredVideos.filter(v => v.isLive === true);
  }, [filteredVideos]);

  const activeLiveVideo = liveVideos?.[0];

  if (!mounted) return null;

  return (
    <div className="space-y-10 animate-fade-in py-6 max-w-[1600px] mx-auto text-foreground px-6 pb-20">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="absolute top-0 right-0 p-10 opacity-5"><TvIcon className="w-64 h-64 -rotate-12 text-rose-500" /></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-[1.5rem] bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg">
            <Tv className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">XakView</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2 uppercase text-[10px] tracking-widest">
              <Radio className="w-3 h-3 text-rose-500 animate-pulse" /> Content Multiverse
            </p>
          </div>
        </div>
        
        {/* App Tabs Navigator */}
        <div className="flex bg-black/45 p-1 rounded-2xl border border-white/5 relative z-20">
          <button 
            onClick={() => setActiveViewTab("videos")}
            className={cn(
              "px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeViewTab === "videos" ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            Videos
          </button>
          <button 
            onClick={() => setActiveViewTab("live")}
            className={cn(
              "px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeViewTab === "live" ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-500 fill-red-500" /> Livestreams
          </button>
          <button 
            onClick={() => setActiveViewTab("creators")}
            className={cn(
              "px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeViewTab === "creators" ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            Creators
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
          {/* YouTube Link Importer */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              value={youtubeImportInput}
              onChange={(e) => setYoutubeImportInput(e.target.value)}
              placeholder="Paste YouTube watch URL..."
              className="bg-red-950/20 border-red-500/20 h-12 rounded-2xl px-4 text-xs font-bold focus:border-red-500/50 focus:ring-red-500 text-white min-w-[200px]"
            />
            <Button
              onClick={() => handleImportYoutube(youtubeImportInput)}
              disabled={isImporting || !youtubeImportInput.trim()}
              className="h-12 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase shrink-0 border-none"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Import"}
            </Button>
          </div>

          <div className="relative group shrink-0 w-64">
            {isYTSearching ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500 animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-rose-500 transition-colors" />
            )}
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search youtube & local..."
              className="bg-black/60 border-white/10 h-12 rounded-2xl pl-10 pr-4 text-xs font-bold focus:border-rose-500/50 focus:ring-rose-500 uppercase text-white"
            />
          </div>
          <Link href="/xakview/studio">
            <Button variant="outline" className="h-12 px-6 rounded-2xl border-white/10 font-black text-xs uppercase bg-white/5">
              <LayoutGrid className="w-4 h-4 mr-2" /> Studio
            </Button>
          </Link>
        </div>
      </header>

      {/* Videos View */}
      {activeViewTab === "videos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Video Frame */}
          <div className="lg:col-span-8 space-y-10">
            <div className="relative aspect-video rounded-[4rem] overflow-hidden bg-black shadow-2xl border-4 border-white/10">
              {isVideosLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-zinc-950">
                  <Loader2 className="w-12 h-12 animate-spin text-rose-500 opacity-20" />
                  <p className="text-[10px] font-black uppercase text-rose-500/40 tracking-widest">Loading multiverse...</p>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-zinc-950/80 p-10 text-center">
                  <VideoIcon className="w-16 h-16 text-rose-500/20 animate-pulse" />
                  <h3 className="text-xl font-black uppercase tracking-widest text-zinc-400">No videos matching query</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase">Publish your first broadcast shard in XakStudio!</p>
                </div>
              ) : activeVideo?.youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-none"
                />
              ) : activeVideo?.url ? (
                <video 
                  key={activeVideo.id} 
                  src={activeVideo.url} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-zinc-950">
                  <Loader2 className="w-12 h-12 animate-spin text-rose-500 opacity-20" />
                  <p className="text-[10px] font-black uppercase text-rose-500/40 tracking-widest">Loading shard...</p>
                </div>
              )}
            </div>

            {/* Video Details */}
            {activeVideo && (
              <div className="space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase italic leading-none">{activeVideo.title}</h2>
                      {activeVideo.youtubeId && (
                        <Badge className="bg-red-600 text-white font-black text-[9px] px-3 py-1 uppercase rounded-full border-none">YouTube</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-rose-500" /> {activeVideo.views?.toLocaleString() || 0} views</span>
                      <span className="flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-rose-500" /> {activeVideo.likes?.toLocaleString() || 0} likes</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => setIsLiked(!isLiked)} variant="outline" className={cn("rounded-2xl h-12 px-6 font-black text-xs transition-all bg-white/5", isLiked ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "border-white/10")}>
                      <ThumbsUp className={cn("w-4 h-4 mr-2", isLiked && "fill-rose-500")} /> {isLiked ? "Saved" : "Like"}
                    </Button>
                    <Button variant="outline" className="rounded-2xl border-white/10 h-12 px-6 font-black text-xs bg-white/5"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
                  </div>
                </div>

                {/* Creator Card */}
                <Card className="p-8 bg-secondary/10 rounded-[3rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-16 h-16 rounded-[1.5rem] border-4 border-rose-500/20 shadow-2xl">
                      <AvatarImage src={activeVideo.authorPhoto || `https://api.dicebear.com/7.x/identicon/svg?seed=${activeVideo.authorId}`} />
                      <AvatarFallback className="bg-rose-500 text-white font-black text-xl">{activeVideo.author?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                        {activeVideo.author || 'Member'}
                        <CheckCircle2 className="w-4 h-4 text-rose-500 fill-current" />
                      </h4>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Creator ID: {activeVideo.authorId?.slice(0, 8)}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => toggleFollow(activeVideo.authorId || "custom", activeVideo.author || "Member", activeVideo.authorPhoto || "")} 
                    className={cn(
                      "h-12 px-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all border-none", 
                      isFollowingCreator(activeVideo.authorId) 
                        ? "bg-zinc-800 text-white hover:bg-zinc-700" 
                        : "bg-white text-black hover:bg-rose-600 hover:text-white"
                    )}
                  >
                    {isFollowingCreator(activeVideo.authorId) ? (
                      <><UserMinus className="w-4.5 h-4.5 mr-2" /> Unsubscribe</>
                    ) : (
                      <><UserPlus className="w-4.5 h-4.5 mr-2" /> Subscribe</>
                    )}
                  </Button>
                </Card>

                {/* Comments Section */}
                <Tabs defaultValue="comments" className="space-y-6">
                  <TabsList className="bg-black/40 border border-white/5 rounded-2xl h-14 p-1">
                    <TabsTrigger value="comments" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">Comments ({comments?.length || 0})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comments" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    <form onSubmit={handlePostComment} className="flex gap-4">
                      <Input 
                        value={commentInput} 
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Add a public comment..." 
                        className="bg-black/40 border-white/10 h-14 rounded-2xl px-6 font-bold text-xs" 
                      />
                      <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-rose-600 shrink-0 border-none"><Send className="w-6 h-6" /></Button>
                    </form>
                    <div className="space-y-6">
                      {comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-6 animate-in fade-in">
                          <Avatar className="w-10 h-10 rounded-xl shrink-0">
                            <AvatarImage src={comment.userPhoto} />
                            <AvatarFallback className="bg-rose-600 text-white font-bold">{comment.userName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase italic text-rose-500">@{comment.userName}</span>
                              <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">
                                {comment.timestamp?.seconds ? new Date(comment.timestamp.seconds * 1000).toLocaleTimeString() : 'Just Now'}
                              </span>
                            </div>
                            <p className="text-sm font-medium italic opacity-80 text-zinc-200">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          {/* Recommended Side Rail */}
          <aside className="lg:col-span-4 space-y-10">
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic flex items-center gap-4 px-4">
              <TrendingUp className="w-6 h-6 text-rose-500" /> Recommended
            </h3>
            
            <ScrollArea className="h-[900px] pr-4">
              <div className="space-y-6 pb-20">
                {filteredVideos.map((video) => (
                  <div 
                    key={video.id} 
                    onClick={() => setSelectedVideo(video)} 
                    className={cn(
                      "flex gap-5 group cursor-pointer p-4 rounded-[2.5rem] transition-all duration-300 border-4", 
                      activeVideo?.id === video.id 
                        ? "bg-rose-500/10 border-rose-500/30 shadow-2xl scale-[1.02]" 
                        : "border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className="relative w-44 h-28 rounded-2xl overflow-hidden shrink-0 shadow-xl bg-black border border-white/5">
                      <Image 
                        src={`https://picsum.photos/seed/${video.id}/400/225`} 
                        alt="Thumb" 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" 
                      />
                      {video.youtubeId && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-[8px] font-black uppercase rounded text-white z-20">YouTube</div>
                      )}
                    </div>
                    <div className="space-y-2 py-1 flex-1 overflow-hidden">
                      <h4 className="text-sm font-black text-zinc-200 line-clamp-2 uppercase italic tracking-tight group-hover:text-rose-500 transition-colors leading-tight">{video.title}</h4>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase italic">@{video.author || "Member"}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">{video.views?.toLocaleString() || 0} Views</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        </div>
      )}

      {/* Livestreams View */}
      {activeViewTab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main stream player frame */}
          <div className="lg:col-span-8 space-y-8">
            {activeLiveVideo ? (
              <>
                <div className="relative aspect-video rounded-[4rem] overflow-hidden bg-black shadow-2xl border-4 border-white/10">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeLiveVideo.youtubeId}?autoplay=1&mute=1`}
                    title="Active Livestream"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-none"
                  />
                  <div className="absolute top-6 left-6 px-6 py-2 bg-red-600 border border-white/15 rounded-full text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-2xl animate-pulse">
                    <Circle className="w-2.5 h-2.5 fill-current text-white animate-ping" /> Live
                  </div>
                  <div className="absolute top-6 right-6 px-6 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-2xl">
                    <Eye className="w-4 h-4 text-rose-500" /> {activeLiveVideo.spectators || "1.2k"} Watching
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-full">{activeLiveVideo.category || "General Broadcast"}</span>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{activeLiveVideo.title}</h2>
                  <p className="text-sm text-zinc-400 font-bold leading-relaxed">{activeLiveVideo.description}</p>
                </div>
              </>
            ) : (
              <div className="w-full aspect-video rounded-[4rem] bg-zinc-950/80 flex flex-col items-center justify-center p-10 text-center border-4 border-white/10">
                <Radio className="w-16 h-16 text-rose-500/20 animate-pulse mb-4" />
                <h3 className="text-xl font-black uppercase tracking-widest text-zinc-400">No active livestreams</h3>
                <p className="text-xs font-bold text-zinc-500 uppercase">No live feeds detected in this multiverse coordinate.</p>
              </div>
            )}
          </div>

          {/* Interactive Live Chat */}
          {activeLiveVideo && (
            <div className="lg:col-span-4 flex flex-col h-[600px] lg:h-[680px] bg-zinc-950/60 border-4 border-white/10 rounded-[3rem] shadow-3xl overflow-hidden">
              <div className="p-6 border-b-2 border-white/10 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-rose-500" />
                  <h3 className="text-[12px] font-black uppercase tracking-widest text-white italic">Live Chat Feed</h3>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_green]" />
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {liveChats.map((chat, idx) => (
                    <div key={idx} className="text-xs bg-white/5 border border-white/5 p-3 rounded-2xl animate-in slide-in-from-bottom-1 duration-150">
                      <span className="font-black text-rose-500 uppercase tracking-wide mr-2">@{chat.user}:</span>
                      <span className="text-zinc-300 font-medium italic">{chat.text}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <form onSubmit={handlePostLiveChat} className="p-6 border-t-2 border-white/10 bg-black/40 flex gap-3">
                <Input 
                  value={liveChatInput}
                  onChange={(e) => setLiveChatInput(e.target.value)}
                  placeholder="Send a live message..."
                  className="bg-black/60 border-white/5 h-12 rounded-xl text-xs font-bold text-white"
                />
                <Button type="submit" size="icon" className="h-12 w-12 rounded-xl bg-rose-600 border-none shrink-0"><Send className="w-5 h-5" /></Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Creators Directory View */}
      {activeViewTab === "creators" && (
        <div className="space-y-10">
          <header className="space-y-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Creators Network</h2>
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.5em]">Verified Content Nodes</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isCreatorsLoading ? (
              <div className="py-20 flex justify-center col-span-4"><Loader2 className="animate-spin text-rose-500 w-12 h-12" /></div>
            ) : filteredCreators.length === 0 ? (
              <div className="py-20 text-center opacity-25 space-y-4 col-span-4">
                <UsersIcon className="w-16 h-16 mx-auto text-rose-500 animate-pulse" />
                <p className="text-sm font-black uppercase tracking-widest text-zinc-400">No creators found</p>
              </div>
            ) : (
              filteredCreators.map((creator) => {
                const avatarUrl = creator.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${creator.id}`;
                const verified = creator.classroomRole === 'teacher' || creator.email === 'admin@xakteir.com';
                return (
                  <Card key={creator.id} className="glass-card rounded-[3rem] p-8 border-4 border-white/10 hover:border-rose-500/30 transition-all duration-300 flex flex-col justify-between bg-zinc-950/40 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><TvIcon className="w-32 h-32 text-rose-500" /></div>
                    
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 rounded-2xl border-2 border-rose-500/20 shadow-xl">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback className="bg-rose-500 text-white font-black text-xl">{creator.displayName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-1.5 leading-none">
                            {creator.displayName || creator.username || 'Member'}
                            {verified && (
                              <CheckCircle2 className="w-4 h-4 text-rose-500 fill-current" />
                            )}
                          </h4>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">@{creator.username || 'user'}</p>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 font-bold leading-relaxed italic">{creator.bio || "Active member node of the Xakteir ecosystem."}</p>
                    </div>

                    <div className="pt-8 space-y-4 relative z-10">
                      <Button 
                        onClick={() => toggleFollow(creator.id, creator.displayName || creator.username || "Member", avatarUrl)}
                        className={cn(
                          "w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-none transition-all",
                          isFollowingCreator(creator.id)
                            ? "bg-zinc-800 text-white hover:bg-zinc-700"
                            : "bg-white text-black hover:bg-rose-600 hover:text-white"
                        )}
                      >
                        {isFollowingCreator(creator.id) ? (
                          <><UserMinus className="w-4.5 h-4.5 mr-2" /> Unsubscribe</>
                        ) : (
                          <><UserPlus className="w-4.5 h-4.5 mr-2" /> Subscribe</>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

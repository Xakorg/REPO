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
  Users as UsersIcon,
  Sliders,
  Settings,
  AlertTriangle,
  Target,
  Trophy,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from "@/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


export default function XakViewPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<
    "videos" | "live" | "creators" | "history" | "shorts"
  >("videos");


  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoState, setSelectedVideo] = useState<any>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [liveChatInput, setLiveChatInput] = useState("");



  const [liveChats, setLiveChats] = useState<
    Array<{ user: string; text: string }>
  >([
    { user: "SpecterX", text: "this stream is crazy fire!" },
    { user: "Hacker_Zero", text: "what's the music track?" },
    { user: "RL_God", text: "Calculated." },
    { user: "NeonViper", text: "Insane mechanical plays here!" },
  ]);

  const [watchHistory, setWatchHistory] = useState<any[]>([]);

  // Mock Feature States
  const [theaterMode, setTheaterMode] = useState(false);
  const [ambientMode, setAmbientMode] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [loopVideo, setLoopVideo] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1x");
  const [quality, setQuality] = useState("1080p");
  const [pipActive, setPipActive] = useState(false);
  const [miniplayerActive, setMiniplayerActive] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard Shortcuts (J, K, L, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;
      switch (e.key.toLowerCase()) {
        case "k":
        case " ":
          e.preventDefault();
          toast({
            title: "Keyboard Shortcut",
            description: "Play/Pause toggled",
          });
          break;
        case "j":
          toast({ title: "Keyboard Shortcut", description: "Rewind 10s" });
          break;
        case "l":
          toast({
            title: "Keyboard Shortcut",
            description: "Fast forward 10s",
          });
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toast]);

  // Load history on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("xakview_watch_history");
      if (saved) {
        try {
          setWatchHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse watch history", e);
        }
      }
    }
  }, []);





  // Fetch videos from DB
  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "videos"),
      orderBy("timestamp", "desc"),
      limit(50),
    );
  }, [firestore]);

  const { data: dbVideos, isLoading: isVideosLoading } =
    useCollection(videosQuery);

  // Fetch creators/users from DB
  const creatorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), limit(100));
  }, [firestore]);

  const { data: dbCreators, isLoading: isCreatorsLoading } =
    useCollection(creatorsQuery);

  // Filter videos based on search
  const filteredVideos = useMemo(() => {
    const localList = dbVideos || [];
    let list = [...localList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [dbVideos, searchQuery]);

  // Filter creators based on search
  const filteredCreators = useMemo(() => {
    const list = dbCreators || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.displayName?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q),
    );
  }, [dbCreators, searchQuery]);

  const activeVideo = selectedVideoState || filteredVideos?.[0];

  // Add activeVideo to history when it changes
  useEffect(() => {
    if (!activeVideo || !activeVideo.id) return;
    setWatchHistory((prev) => {
      if (prev.length > 0 && prev[0].id === activeVideo.id) return prev;
      const filtered = prev.filter((v) => v.id !== activeVideo.id);
      const updated = [
        { ...activeVideo, watchedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, 50);
      localStorage.setItem("xakview_watch_history", JSON.stringify(updated));
      return updated;
    });
  }, [activeVideo?.id]);

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !activeVideo) return null;
    return query(
      collection(firestore, "videos", activeVideo.id, "comments"),
      orderBy("timestamp", "desc"),
      limit(20),
    );
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
    return following?.some((f) => f.id === creatorId);
  };

  const handleSeedContent = async () => {
    if (!firestore) return;
    const dummyVideos = [
      {
        title: "Welcome to XakView! 🚀",
        description: "Your new home for developer content. Start uploading today to secure your Founding Creator badge and earn XakCoins for every video!",
        authorId: "xakteir_admin",
        author: "Xakteir Official",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        category: "Announcements",
        type: "video/mp4",
        views: 120500,
        likes: 5400,
        timestamp: serverTimestamp(),
      },
      {
        title: "Top 5 Features of Xakteir Suite 2026",
        description: "A deep dive into the latest innovations in Xakteir Suite, including AI integration, real-time collaboration, and the new UI engine.",
        authorId: "xakteir_admin",
        author: "Xakteir Official",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        category: "Tech",
        type: "video/mp4",
        views: 89000,
        likes: 3200,
        timestamp: serverTimestamp(),
      },
      {
        title: "How to Build a Gamified App in 10 Minutes",
        description: "Watch how we built a gamified video platform using React, Firebase, and Tailwind CSS. Don't forget to like and subscribe!",
        authorId: "xakteir_admin",
        author: "Xakteir Official",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        category: "Education",
        type: "video/mp4",
        views: 45000,
        likes: 2100,
        timestamp: serverTimestamp(),
      }
    ];

    try {
      for (const video of dummyVideos) {
        await addDocumentNonBlocking(collection(firestore, "videos"), video);
      }
      toast({ title: "Seeding Complete", description: "Official Xakteir Content has been injected." });
    } catch (e) {
      toast({ variant: "destructive", title: "Seeding Failed" });
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !commentInput.trim() || !activeVideo) return;
    addDocumentNonBlocking(
      collection(firestore, "videos", activeVideo.id, "comments"),
      {
        userId: user.uid,
        userName: user.displayName?.replace(/^@+/, "") || "Member",
        userPhoto: user.photoURL || "",
        text: commentInput,
        timestamp: serverTimestamp(),
      },
    );
    setCommentInput("");
  };

  const toggleFollow = (
    creatorId: string,
    creatorName: string,
    creatorPhoto: string,
  ) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Sign in to subscribe to creators.",
      });
      return;
    }

    const ref = doc(firestore, "users", user.uid, "following", creatorId);
    const followingActive = isFollowingCreator(creatorId);

    if (followingActive) {
      deleteDocumentNonBlocking(ref);
      toast({
        title: "Unsubscribed",
        description: `You have unsubscribed from ${creatorName}.`,
      });
    } else {
      setDocumentNonBlocking(
        ref,
        {
          id: creatorId,
          displayName: creatorName,
          photoURL: creatorPhoto || "",
          timestamp: serverTimestamp(),
        },
        { merge: true },
      );

      toast({
        title: "Subscribed!",
        description: `Successfully subscribed to ${creatorName}. Notifications active!`,
      });

      // Trigger a simulated video upload notification after 5 seconds
      setTimeout(async () => {
        const videoTitles = [
          "My secret strategy for coding web applications",
          "Conquering the ultimate gaming tournament!",
          "Special community update and workspace showcase",
          "Behind the scenes vlog & project planning",
        ];
        const randomTitle =
          videoTitles[Math.floor(Math.random() * videoTitles.length)];

        const notifRef = collection(
          firestore,
          "users",
          user.uid,
          "notifications",
        );
        await addDocumentNonBlocking(notifRef, {
          title: `New Video from ${creatorName}`,
          message: `${creatorName} just uploaded a new video: "${randomTitle}"! Go watch it now in XakView.`,
          type: "social",
          read: false,
          timestamp: serverTimestamp(),
        });
      }, 5000);
    }
  };

  // Simulate active stream chat messages
  useEffect(() => {
    if (activeViewTab !== "live") return;
    const interval = setInterval(() => {
      const users = [
        "PixelVandal",
        "SoberRobloxian",
        "ChronoTrig",
        "XakteirCreator",
        "GlitchKid",
        "MatrixRunner",
        "NeonViper",
        "RL_Legend",
      ];
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
        "Awesome stream setup!",
      ];
      const randUser = users[Math.floor(Math.random() * users.length)];
      const randMsg = msgs[Math.floor(Math.random() * msgs.length)];
      setLiveChats((prev) => [
        ...prev.slice(-20),
        { user: randUser, text: randMsg },
      ]);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeViewTab]);

  const handlePostLiveChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChatInput.trim()) return;
    const displayName = user?.displayName?.replace(/^@+/, "") || "Member";
    setLiveChats((prev) => [
      ...prev,
      { user: displayName, text: liveChatInput },
    ]);
    setLiveChatInput("");
  };

  const liveVideos = useMemo(() => {
    return filteredVideos.filter((v) => v.isLive === true);
  }, [filteredVideos]);

  const activeLiveVideo = liveVideos?.[0];

  if (!mounted) return null;

  return (
    <div className="space-y-10 animate-fade-in py-6 max-w-[1600px] mx-auto text-foreground px-6 pb-20">

      {/* Weekly Challenge Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-orange-500 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-4 border-white/20 gap-6">
         <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
            <Trophy className="w-48 h-48 -rotate-12 text-white" />
         </div>
         <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border-2 border-white/30 shrink-0">
               <Target className="w-8 h-8 text-white" />
            </div>
            <div>
               <h3 className="text-white text-2xl font-black uppercase italic tracking-tighter">Weekly Challenge</h3>
               <p className="text-white/90 font-bold text-sm">Show us your coolest coding project! Upload your video to earn 100 bonus coins.</p>
            </div>
         </div>
         <Link href="/xakview/studio" className="relative z-10">
            <Button className="bg-white text-rose-600 hover:bg-zinc-100 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs shadow-xl">
               Join Challenge
            </Button>
         </Link>
      </div>

      {/* Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <TvIcon className="w-64 h-64 -rotate-12 text-rose-500" />
        </div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-[1.5rem] bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg">
            <Tv className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">
              XakView
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2 uppercase text-[10px] tracking-widest">
              <Radio className="w-3 h-3 text-rose-500 animate-pulse" /> Content
              Multiverse
            </p>
          </div>
          
          {process.env.NODE_ENV === "development" && (
             <Button variant="outline" size="sm" onClick={handleSeedContent} className="ml-4 border-rose-500/30 text-rose-400 bg-rose-500/10 text-xs font-black uppercase tracking-widest">
                [DEV] Seed DB
             </Button>
          )}
        </div>

        {/* App Tabs Navigator */}
        <div className="flex bg-black/45 p-1 rounded-2xl border border-white/5 relative z-20">
          <button
            onClick={() => setActiveViewTab("videos")}
            className={cn(
              "px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeViewTab === "videos"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30"
                : "text-muted-foreground hover:bg-white/5",
            )}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveViewTab("shorts")}
            className={cn(
              "px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeViewTab === "shorts"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30"
                : "text-muted-foreground hover:bg-white/5",
            )}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" /> Shorts
          </button>
          <button
            onClick={() => setActiveViewTab("live")}
            className={cn(
              "px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeViewTab === "live"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30"
                : "text-muted-foreground hover:bg-white/5",
            )}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-500 fill-red-500" />{" "}
            Livestreams
          </button>
          <button
            onClick={() => setActiveViewTab("creators")}
            className={cn(
              "px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeViewTab === "creators"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30"
                : "text-muted-foreground hover:bg-white/5",
            )}
          >
            Creators
          </button>
          <button
            onClick={() => setActiveViewTab("history")}
            className={cn(
              "px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeViewTab === "history"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30"
                : "text-muted-foreground hover:bg-white/5",
            )}
          >
            History
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 relative z-10 w-full md:w-auto">

          <div className="relative group shrink-0 w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-rose-500 transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search local..."
              className="bg-black/60 border-white/10 h-12 rounded-2xl pl-10 pr-4 text-xs font-bold focus:border-rose-500/50 focus:ring-rose-500 uppercase text-white"
            />
          </div>
          <Link href="/xakview/studio">
            <Button
              variant="outline"
              className="h-12 px-6 rounded-2xl border-white/10 font-black text-xs uppercase bg-white/5"
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Studio
            </Button>
          </Link>
        </div>
      </header>

      {/* Videos View */}
      {activeViewTab === "videos" && (
        <div
          className={cn(
            "grid gap-12",
            theaterMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12",
          )}
        >
          {/* Main Video Frame */}
          <div
            className={cn(
              "space-y-10",
              theaterMode ? "w-full" : "lg:col-span-8",
            )}
          >
            <div
              className={cn(
                "relative rounded-[4rem] overflow-hidden bg-black shadow-2xl border-4 border-white/10 transition-all duration-500",
                theaterMode ? "aspect-[21/9] max-h-[80vh]" : "aspect-video",
                ambientMode
                  ? "shadow-[0_0_100px_rgba(225,29,72,0.3)] border-rose-500/20"
                  : "",
              )}
            >
              {isVideosLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-zinc-950">
                  <Loader2 className="w-12 h-12 animate-spin text-rose-500 opacity-20" />
                  <p className="text-[10px] font-black uppercase text-rose-500/40 tracking-widest">
                    Loading multiverse...
                  </p>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-zinc-950/80 p-10 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 to-orange-500/10 opacity-50"></div>
                  <Target className="w-20 h-20 text-rose-500 animate-pulse relative z-10" />
                  <div className="relative z-10 max-w-lg">
                     <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic mb-2">
                       Feed Empty? Be the First!
                     </h3>
                     <p className="text-sm font-bold text-rose-200/80 uppercase">
                       Upload the first video and your content is GUARANTEED to be seen by every single person on the platform. The Early Adopter advantage is yours!
                     </p>
                  </div>
                  <Link href="/xakview/studio" className="relative z-10 mt-4">
                     <Button className="bg-rose-600 hover:bg-rose-500 text-white rounded-full px-8 h-12 font-black uppercase tracking-widest text-xs shadow-[0_0_40px_rgba(225,29,72,0.6)]">
                       Claim the Spotlight
                     </Button>
                  </Link>
                </div>
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
                  <p className="text-[10px] font-black uppercase text-rose-500/40 tracking-widest">
                    Loading video...
                  </p>
                </div>
              )}

              {/* Mock Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-2 opacity-0 hover:opacity-100 transition-opacity">
                {/* Timeline Marker / Chapters */}
                <div className="w-full h-1 bg-white/20 rounded-full flex overflow-hidden cursor-pointer">
                  <div
                    className="h-full bg-rose-500 w-1/3 border-r-2 border-black"
                    title="Intro"
                  ></div>
                  <div
                    className="h-full bg-rose-400 w-1/4 border-r-2 border-black"
                    title="Main Content"
                  ></div>
                  <div
                    className="h-full bg-rose-300 w-5/12"
                    title="Outro"
                  ></div>
                </div>
                <div className="flex items-center justify-between text-white text-xs">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCcEnabled(!ccEnabled)}
                      className={cn(
                        "font-bold",
                        ccEnabled ? "text-rose-500" : "text-white",
                      )}
                    >
                      CC
                    </button>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(e.target.value)}
                      className="bg-transparent border-none outline-none font-bold"
                    >
                      <option value="0.25x" className="text-black">
                        0.25x
                      </option>
                      <option value="0.5x" className="text-black">
                        0.5x
                      </option>
                      <option value="1x" className="text-black">
                        1x
                      </option>
                      <option value="1.5x" className="text-black">
                        1.5x
                      </option>
                      <option value="2x" className="text-black">
                        2x
                      </option>
                    </select>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="bg-transparent border-none outline-none font-bold"
                    >
                      <option value="4K" className="text-black">
                        4K
                      </option>
                      <option value="1080p" className="text-black">
                        1080p
                      </option>
                      <option value="720p" className="text-black">
                        720p
                      </option>
                      <option value="480p" className="text-black">
                        480p
                      </option>
                    </select>
                  </div>
                  <div className="flex gap-4 items-center">
                    <button
                      onClick={() => setAutoPlay(!autoPlay)}
                      title="Autoplay Next"
                    >
                      {autoPlay ? "Autoplay ON" : "Autoplay OFF"}
                    </button>
                    <button
                      onClick={() => setLoopVideo(!loopVideo)}
                      title="Loop Video"
                    >
                      {loopVideo ? "Loop ON" : "Loop OFF"}
                    </button>
                    <button
                      onClick={() =>
                        toast({
                          title: "SponsorBlock",
                          description: "Sponsor segments skipped",
                        })
                      }
                      className="text-green-400"
                    >
                      SponsorBlock
                    </button>
                    <button
                      onClick={() =>
                        toast({
                          title: "VR 360",
                          description: "VR Mode enabled",
                        })
                      }
                    >
                      VR 360
                    </button>
                    <button
                      onClick={() =>
                        toast({
                          title: "Cast",
                          description: "Searching for devices...",
                        })
                      }
                    >
                      Cast to TV
                    </button>
                    <button
                      onClick={() => setMiniplayerActive(!miniplayerActive)}
                    >
                      Miniplayer
                    </button>
                    <button onClick={() => setPipActive(!pipActive)}>
                      PiP
                    </button>
                    <button onClick={() => setTheaterMode(!theaterMode)}>
                      {theaterMode ? "Default View" : "Theater Mode"}
                    </button>
                    <button onClick={() => setAmbientMode(!ambientMode)}>
                      {ambientMode ? "Ambient OFF" : "Ambient ON"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Details */}
            {activeVideo && (
              <div className="space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase italic leading-none">
                        {activeVideo.title}
                      </h2>

                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      <span className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-rose-500" />{" "}
                        {activeVideo.views?.toLocaleString() || 0} views
                      </span>
                      <span className="flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-rose-500" />{" "}
                        {activeVideo.likes?.toLocaleString() || 0} likes
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4 md:mt-0 justify-end">
                    <Button
                      onClick={() => setIsLiked(!isLiked)}
                      variant="outline"
                      className={cn(
                        "rounded-2xl h-12 px-6 font-black text-xs transition-all bg-white/5",
                        isLiked
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                          : "border-white/10",
                      )}
                    >
                      <ThumbsUp
                        className={cn(
                          "w-4 h-4 mr-2",
                          isLiked && "fill-rose-500",
                        )}
                      />{" "}
                      {activeVideo.likes?.toLocaleString() || 0}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 h-12 px-6 font-black text-xs bg-white/5"
                      onClick={() => toast({ title: "Disliked" })}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2 rotate-180" /> Dislike
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 h-12 px-6 font-black text-xs bg-white/5"
                    >
                      <Share2 className="w-4 h-4 mr-2" /> Share
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toast({ title: "Added to Watch Later" })}
                      className="rounded-2xl border-white/10 h-12 px-6 font-black text-xs bg-white/5"
                    >
                      Watch Later
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toast({ title: "Saved to Playlist" })}
                      className="rounded-2xl border-white/10 h-12 px-6 font-black text-xs bg-white/5"
                    >
                      Save to Playlist
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        toast({
                          title: "Analytics",
                          description: "Showing creator analytics...",
                        })
                      }
                      className="rounded-2xl border-white/10 h-12 px-6 font-black text-xs bg-white/5"
                    >
                      <Activity className="w-4 h-4 mr-2" /> Analytics
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Exporting MP4...",
                          description: "Video export started. Please wait.",
                        });
                        setTimeout(
                          () =>
                            toast({
                              title: "Export Complete",
                              description: "MP4 has been downloaded.",
                            }),
                          2000,
                        );
                      }}
                      className="rounded-2xl border-white/10 h-12 px-6 font-black text-xs bg-white/5"
                    >
                      Export MP4
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Exporting MP3...",
                          description: "Audio extraction started. Please wait.",
                        });
                        setTimeout(
                          () =>
                            toast({
                              title: "Export Complete",
                              description: "MP3 has been downloaded.",
                            }),
                          2000,
                        );
                      }}
                      className="rounded-2xl border-white/10 h-12 px-6 font-black text-xs bg-white/5"
                    >
                      Export MP3
                    </Button>
                  </div>
                </div>

                {/* Creator Card */}
                <Card className="p-8 bg-secondary/10 rounded-[3rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-16 h-16 rounded-[1.5rem] border-4 border-rose-500/20 shadow-2xl">
                      <AvatarImage
                        src={
                          activeVideo.authorPhoto ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${activeVideo.authorId}`
                        }
                      />
                      <AvatarFallback className="bg-rose-500 text-white font-black text-xl">
                        {activeVideo.author?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                        {activeVideo.author || "Member"}
                        <CheckCircle2 className="w-4 h-4 text-rose-500 fill-current" />
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-2 py-0 font-black uppercase tracking-widest text-[9px] animate-pulse ml-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                          Founding Creator 🌟
                        </Badge>
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Creator ID: {activeVideo.authorId?.slice(0, 8)}
                        </p>
                        <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                          1.2M Subscribers
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => toast({ title: "Notifications enabled" })}
                      variant="outline"
                      className="h-12 w-12 rounded-xl border-white/10 bg-white/5"
                    >
                      <Bell className="w-4.5 h-4.5" />
                    </Button>
                    <Button
                      onClick={() =>
                        toggleFollow(
                          activeVideo.authorId || "custom",
                          activeVideo.author || "Member",
                          activeVideo.authorPhoto || "",
                        )
                      }
                      className={cn(
                        "h-12 px-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all border-none",
                        isFollowingCreator(activeVideo.authorId)
                          ? "bg-zinc-800 text-white hover:bg-zinc-700"
                          : "bg-white text-black hover:bg-rose-600 hover:text-white",
                      )}
                    >
                      {isFollowingCreator(activeVideo.authorId) ? (
                        <>
                          <UserMinus className="w-4.5 h-4.5 mr-2" /> Unsubscribe
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4.5 h-4.5 mr-2" /> Subscribe
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Comments Section */}
                <Tabs defaultValue="comments" className="space-y-6">
                  <TabsList className="bg-black/40 border border-white/5 rounded-2xl h-14 p-1">
                    <TabsTrigger
                      value="comments"
                      className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest"
                    >
                      Comments ({comments?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="comments"
                    className="space-y-8 animate-in slide-in-from-bottom-2 duration-300"
                  >
                    <form onSubmit={handlePostComment} className="flex gap-4">
                      <Input
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Add a public comment..."
                        className="bg-black/40 border-white/10 h-14 rounded-2xl px-6 font-bold text-xs"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-14 w-14 rounded-2xl bg-rose-600 shrink-0 border-none"
                      >
                        <Send className="w-6 h-6" />
                      </Button>
                    </form>
                    <div className="space-y-6">
                      {comments.map((comment: any) => (
                        <div
                          key={comment.id}
                          className="flex gap-6 animate-in fade-in"
                        >
                          <Avatar className="w-10 h-10 rounded-xl shrink-0">
                            <AvatarImage src={comment.userPhoto} />
                            <AvatarFallback className="bg-rose-600 text-white font-bold">
                              {comment.userName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase italic text-rose-500">
                                @{comment.userName}
                              </span>
                              <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">
                                {comment.timestamp?.seconds
                                  ? new Date(
                                      comment.timestamp.seconds * 1000,
                                    ).toLocaleTimeString()
                                  : "Just Now"}
                              </span>
                            </div>
                            <p className="text-sm font-medium italic opacity-80 text-zinc-200">
                              {comment.text}
                            </p>
                            <div className="flex gap-4 mt-2">
                              <button
                                className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white"
                                onClick={() => toast({ title: "Like Comment" })}
                              >
                                Like
                              </button>
                              <button
                                className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white"
                                onClick={() =>
                                  toast({ title: "Dislike Comment" })
                                }
                              >
                                Dislike
                              </button>
                              <button
                                className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white"
                                onClick={() =>
                                  toast({ title: "Reply to Comment" })
                                }
                              >
                                Reply
                              </button>
                            </div>
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
          {!theaterMode && (
            <aside className="lg:col-span-4 space-y-10">
              
              {/* Top Creators Leaderboard */}
              <div className="bg-black/40 rounded-[3rem] p-8 border-4 border-white/5 space-y-6 shadow-2xl">
                 <h3 className="text-xl font-black text-rose-500 uppercase tracking-tighter italic flex items-center gap-3">
                   <Trophy className="w-6 h-6" /> Top Creators This Week
                 </h3>
                 <div className="space-y-4">
                    {filteredVideos.length > 0 ? (
                       Object.entries(filteredVideos.reduce((acc, v) => {
                          if (v.author) acc[v.author] = (acc[v.author] || 0) + (v.views || 0);
                          return acc;
                       }, {} as Record<string, number>))
                       .sort((a, b) => b[1] - a[1])
                       .slice(0, 5)
                       .map(([author, views], idx) => (
                          <div key={author} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-rose-500/30 transition-colors">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center font-black text-[10px] text-white">{idx + 1}</div>
                                <p className="text-xs font-black uppercase italic text-white">{author}</p>
                             </div>
                             <Badge className="bg-rose-500/20 text-rose-400 border-none text-[9px] font-black">{views.toLocaleString()} Views</Badge>
                          </div>
                       ))
                    ) : (
                       <div className="py-6 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Be the first to claim the #1 spot!</p>
                       </div>
                    )}
                 </div>
              </div>

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
                          : "border-transparent hover:bg-white/5",
                      )}
                    >
                      <div className="relative w-44 h-28 rounded-2xl overflow-hidden shrink-0 shadow-xl bg-black border border-white/5">
                        <Image
                          src={video.thumbnail || `https://picsum.photos/seed/${video.id}/400/225`}
                          alt="Thumb"
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                        />

                      </div>
                      <div className="space-y-2 py-1 flex-1 overflow-hidden">
                        <h4 className="text-sm font-black text-zinc-200 line-clamp-2 uppercase italic tracking-tight group-hover:text-rose-500 transition-colors leading-tight">
                          {video.title}
                        </h4>
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase italic">
                            @{video.author || "Member"}
                          </p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">
                            {video.views?.toLocaleString() || 0} Views
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </aside>
          )}
        </div>
      )}

      {/* Shorts / Reels View */}
      {activeViewTab === "shorts" && (
        <div className="flex flex-col items-center gap-8 py-10 h-[80vh] overflow-y-auto snap-y snap-mandatory">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="relative w-full max-w-[400px] aspect-[9/16] bg-black rounded-[2rem] border-2 border-white/10 shadow-2xl snap-center shrink-0 flex items-center justify-center overflow-hidden group"
            >
              <video
                src="https://www.w3schools.com/html/mov_bbb.mp4"
                loop
                autoPlay
                muted
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute right-4 bottom-20 flex flex-col gap-6">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full bg-black/40 backdrop-blur text-white hover:bg-rose-600"
                >
                  <ThumbsUp className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full bg-black/40 backdrop-blur text-white hover:bg-rose-600"
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full bg-black/40 backdrop-blur text-white hover:bg-rose-600"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
              <div className="absolute bottom-6 left-6 right-16 text-white">
                <h4 className="font-black text-lg">Amazing Short {i}</h4>
                <p className="text-xs opacity-70">@creator_{i} • 1.2M views</p>
              </div>
            </div>
          ))}
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
                  <video
                    src={activeLiveVideo.url}
                    controls
                    autoPlay
                    muted
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-6 left-6 px-6 py-2 bg-red-600 border border-white/15 rounded-full text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-2xl animate-pulse">
                    <Circle className="w-2.5 h-2.5 fill-current text-white animate-ping" />{" "}
                    Live
                  </div>
                  <div className="absolute top-6 right-6 px-6 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-2xl">
                    <Eye className="w-4 h-4 text-rose-500" />{" "}
                    {activeLiveVideo.spectators || "1.2k"} Watching
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {activeLiveVideo.category || "General Broadcast"}
                  </span>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                    {activeLiveVideo.title}
                  </h2>
                  <p className="text-sm text-zinc-400 font-bold leading-relaxed">
                    {activeLiveVideo.description}
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full aspect-video rounded-[4rem] bg-zinc-950/80 flex flex-col items-center justify-center p-10 text-center border-4 border-white/10">
                <Radio className="w-16 h-16 text-rose-500/20 animate-pulse mb-4" />
                <h3 className="text-xl font-black uppercase tracking-widest text-zinc-400">
                  No active livestreams
                </h3>
                <p className="text-xs font-bold text-zinc-500 uppercase">
                  No live feeds detected in this multiverse coordinate.
                </p>
              </div>
            )}
          </div>

          {/* Interactive Live Chat */}
          {activeLiveVideo && (
            <div className="lg:col-span-4 flex flex-col h-[600px] lg:h-[680px] bg-zinc-950/60 border-4 border-white/10 rounded-[3rem] shadow-3xl overflow-hidden">
              <div className="p-6 border-b-2 border-white/10 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-rose-500" />
                  <h3 className="text-[12px] font-black uppercase tracking-widest text-white italic">
                    Live Chat Feed
                  </h3>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_green]" />
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {liveChats.map((chat, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-white/5 border border-white/5 p-3 rounded-2xl animate-in slide-in-from-bottom-1 duration-150"
                    >
                      <span className="font-black text-rose-500 uppercase tracking-wide mr-2">
                        @{chat.user}:
                      </span>
                      <span className="text-zinc-300 font-medium italic">
                        {chat.text}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <form
                onSubmit={handlePostLiveChat}
                className="p-6 border-t-2 border-white/10 bg-black/40 flex flex-col gap-3"
              >
                <div className="flex gap-3">
                  <Input
                    value={liveChatInput}
                    onChange={(e) => setLiveChatInput(e.target.value)}
                    placeholder="Send a live message..."
                    className="bg-black/60 border-white/5 h-12 rounded-xl text-xs font-bold text-white"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-12 w-12 rounded-xl bg-rose-600 border-none shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={() =>
                    toast({
                      title: "Super Chat Sent!",
                      description: "Donated $5 to the creator.",
                    })
                  }
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black uppercase text-xs h-10 rounded-xl"
                >
                  Send Super Chat ($5)
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Creators Directory View */}
      {activeViewTab === "creators" && (
        <div className="space-y-10">
          <header className="space-y-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
              Creators Network
            </h2>
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.5em]">
              Verified Content Nodes
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isCreatorsLoading ? (
              <div className="py-20 flex justify-center col-span-4">
                <Loader2 className="animate-spin text-rose-500 w-12 h-12" />
              </div>
            ) : filteredCreators.length === 0 ? (
              <div className="py-20 text-center opacity-25 space-y-4 col-span-4">
                <UsersIcon className="w-16 h-16 mx-auto text-rose-500 animate-pulse" />
                <p className="text-sm font-black uppercase tracking-widest text-zinc-400">
                  No creators found
                </p>
              </div>
            ) : (
              filteredCreators.map((creator) => {
                const avatarUrl =
                  creator.photoURL ||
                  `https://api.dicebear.com/7.x/identicon/svg?seed=${creator.id}`;
                const verified =
                  creator.classroomRole === "teacher" ||
                  creator.email === "admin@xakteir.com";
                return (
                  <Card
                    key={creator.id}
                    className="glass-card rounded-[3rem] p-8 border-4 border-white/10 hover:border-rose-500/30 transition-all duration-300 flex flex-col justify-between bg-zinc-950/40 relative overflow-hidden group shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                      <TvIcon className="w-32 h-32 text-rose-500" />
                    </div>

                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 rounded-2xl border-2 border-rose-500/20 shadow-xl">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback className="bg-rose-500 text-white font-black text-xl">
                            {creator.displayName?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-1.5 leading-none">
                            {creator.displayName ||
                              creator.username ||
                              "Member"}
                            {verified && (
                              <CheckCircle2 className="w-4 h-4 text-rose-500 fill-current" />
                            )}
                          </h4>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">
                            @{creator.username || "user"}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 font-bold leading-relaxed italic">
                        {creator.bio ||
                          "Active member node of the Xakteir ecosystem."}
                      </p>
                    </div>

                    <div className="pt-8 space-y-4 relative z-10">
                      <Button
                        onClick={() =>
                          toggleFollow(
                            creator.id,
                            creator.displayName || creator.username || "Member",
                            avatarUrl,
                          )
                        }
                        className={cn(
                          "w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-none transition-all",
                          isFollowingCreator(creator.id)
                            ? "bg-zinc-800 text-white hover:bg-zinc-700"
                            : "bg-white text-black hover:bg-rose-600 hover:text-white",
                        )}
                      >
                        {isFollowingCreator(creator.id) ? (
                          <>
                            <UserMinus className="w-4.5 h-4.5 mr-2" />{" "}
                            Unsubscribe
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4.5 h-4.5 mr-2" /> Subscribe
                          </>
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

      {/* Watch History View */}
      {activeViewTab === "history" && (
        <div className="space-y-10">
          <header className="flex justify-between items-center bg-black/40 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="space-y-2 relative z-10">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                Watch History
              </h2>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.5em]">
                Your Recently Watched Videos
              </p>
            </div>
            {watchHistory.length > 0 && (
              <Button
                onClick={() => {
                  setWatchHistory([]);
                  localStorage.removeItem("xakview_watch_history");
                  toast({
                    title: "History Cleared",
                    description: "Your watch history has been wiped.",
                  });
                }}
                variant="outline"
                className="rounded-2xl border-white/10 h-12 px-6 font-black text-xs uppercase bg-white/5 hover:bg-rose-600 hover:text-white transition-all relative z-10"
              >
                Clear History
              </Button>
            )}
          </header>

          {watchHistory.length === 0 ? (
            <div className="py-20 text-center opacity-25 space-y-4">
              <Play className="w-16 h-16 mx-auto text-rose-500 animate-pulse" />
              <p className="text-sm font-black uppercase tracking-widest text-zinc-400">
                No watch history yet
              </p>
              <p className="text-xs font-bold text-zinc-500 uppercase">
                Start watching videos to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {watchHistory.map((video) => (
                <Card
                  key={`${video.id}-${video.watchedAt}`}
                  onClick={() => {
                    setSelectedVideo(video);
                    setActiveViewTab("videos");
                  }}
                  className="glass-card rounded-[3rem] p-6 border-4 border-white/10 hover:border-rose-500/30 transition-all duration-300 flex flex-col justify-between bg-zinc-950/40 relative overflow-hidden group shadow-2xl cursor-pointer"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl bg-black border border-white/5 mb-4">
                    <Image
                      src={video.thumbnail || `https://picsum.photos/seed/${video.id}/400/225`}
                      alt="Thumb"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                    />

                  </div>
                  <div className="space-y-2 py-1 flex-1 overflow-hidden">
                    <h4 className="text-sm font-black text-zinc-200 line-clamp-2 uppercase italic tracking-tight group-hover:text-rose-500 transition-colors leading-tight">
                      {video.title}
                    </h4>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase italic">
                        @{video.author || "Member"}
                      </p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">
                        Watched:{" "}
                        {new Date(video.watchedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

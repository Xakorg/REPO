
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
  MoreVertical, 
  ChevronRight, 
  Circle, 
  Activity 
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

export default function XakViewPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  const [selectedVideoState, setSelectedVideo] = useState<any>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "videos"), orderBy("timestamp", "desc"), limit(50));
  }, [firestore]);

  const { data: dbVideos, isLoading } = useCollection(videosQuery);
  const activeVideo = selectedVideoState || dbVideos?.[0];

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !activeVideo) return null;
    return query(collection(firestore, "videos", activeVideo.id, "comments"), orderBy("timestamp", "desc"), limit(20));
  }, [firestore, activeVideo]);

  const { data: comments } = useCollection(commentsQuery);

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "following");
  }, [firestore, user]);
  const { data: following } = useCollection(followingQuery);
  const isFollowing = following?.some(f => f.id === activeVideo?.authorId);

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

  const handleFollow = () => {
    if (!user || !firestore || !activeVideo) return;
    const ref = doc(firestore, "users", user.uid, "following", activeVideo.authorId);
    if (isFollowing) {
      deleteDocumentNonBlocking(ref);
      toast({ title: "Unsubscribed" });
    } else {
      setDocumentNonBlocking(ref, { 
        id: activeVideo.authorId, 
        displayName: activeVideo.author, 
        photoURL: activeVideo.authorPhoto || "", 
        timestamp: serverTimestamp() 
      }, { merge: true });
      toast({ title: "Subscribed!" });
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-10 animate-fade-in py-6 max-w-[1600px] mx-auto text-foreground px-6 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><Monitor className="w-64 h-64 -rotate-12 text-rose-500" /></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-[1.5rem] bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg">
            <Tv className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">XakView</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2 uppercase text-[10px] tracking-widest"><Radio className="w-3 h-3 text-rose-500 animate-pulse" /> Multiverse Content</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto relative z-10">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-rose-500 transition-colors" />
            <Input placeholder="Search videos..." className="bg-secondary/50 border-white/5 h-12 rounded-2xl pl-11 focus:ring-rose-500 font-bold text-xs" />
          </div>
          <Link href="/xakview/studio">
            <Button variant="outline" className="h-12 px-6 rounded-2xl border-white/10 font-black text-xs uppercase">
              <LayoutGrid className="w-4 h-4 mr-2" /> Studio
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
          <div className="relative aspect-video rounded-[4rem] overflow-hidden bg-black shadow-2xl border-4 border-white/10">
            {activeVideo?.localUrl ? (
              <video 
                key={activeVideo.id} 
                src={activeVideo.localUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-zinc-950">
                 <Loader2 className="w-12 h-12 animate-spin text-rose-500 opacity-20" />
                 <p className="text-[10px] font-black uppercase text-rose-500/40 tracking-widest">Loading...</p>
              </div>
            )}
          </div>

          <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase italic leading-none">{activeVideo?.title}</h2>
                <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-rose-500" /> {activeVideo?.views || 0}</span>
                  <span className="flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-rose-500" /> {activeVideo?.likes || 0}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setIsLiked(!isLiked)} variant="outline" className={cn("rounded-2xl h-12 px-6 font-black text-xs transition-all", isLiked ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "border-white/10")}>
                  <ThumbsUp className={cn("w-4 h-4 mr-2", isLiked && "fill-rose-500")} /> {isLiked ? "Saved" : "Like"}
                </Button>
                <Button variant="outline" className="rounded-2xl border-white/10 h-12 px-6 font-black text-xs"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
              </div>
            </div>

            <Card className="p-8 bg-secondary/20 rounded-[3rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="flex items-center gap-6">
                <Avatar className="w-16 h-16 rounded-[1.5rem] border-4 border-rose-500/20 shadow-2xl">
                  <AvatarImage src={activeVideo?.authorPhoto} />
                  <AvatarFallback className="bg-rose-500 text-white font-black text-xl">{activeVideo?.author?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-2xl font-black text-foreground uppercase italic tracking-tight">{activeVideo?.author || 'Member'}</h4>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Creator ID: {activeVideo?.authorId?.slice(0, 8)}</p>
                </div>
              </div>
              <Button onClick={handleFollow} className={cn("h-12 px-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all", isFollowing ? "bg-secondary text-foreground" : "bg-white text-black hover:bg-rose-600 hover:text-white")}>
                 {isFollowing ? <><UserMinus className="w-4 h-4 mr-2" /> Unsubscribe</> : <><UserPlus className="w-4 h-4 mr-2" /> Subscribe</>}
              </Button>
            </Card>

            <Tabs defaultValue="comments" className="space-y-6">
               <TabsList className="bg-black/40 border border-white/5 rounded-2xl h-14 p-1">
                  <TabsTrigger value="comments" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">Comments ({comments?.length || 0})</TabsTrigger>
                  <TabsTrigger value="live" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest text-rose-500"><Radio className="w-3 h-3 mr-2 animate-pulse" /> Live</TabsTrigger>
               </TabsList>
               
               <TabsContent value="comments" className="space-y-8 animate-in slide-in-from-bottom-2">
                  <form onSubmit={handlePostComment} className="flex gap-4">
                     <Input 
                      value={commentInput} 
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Add a comment..." 
                      className="bg-black/40 border-white/10 h-14 rounded-2xl px-6 font-bold text-xs" 
                     />
                     <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-rose-600 shrink-0"><Send className="w-6 h-6" /></Button>
                  </form>
                  <div className="space-y-6">
                     {comments?.map(comment => (
                       <div key={comment.id} className="flex gap-6 animate-in fade-in">
                          <Avatar className="w-10 h-10 rounded-xl shrink-0"><AvatarImage src={comment.userPhoto} /><AvatarFallback>{comment.userName[0]}</AvatarFallback></Avatar>
                          <div className="space-y-1">
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase italic text-rose-500">@{comment.userName}</span>
                                <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">{comment.timestamp?.seconds ? new Date(comment.timestamp.seconds * 1000).toLocaleTimeString() : '...'}</span>
                             </div>
                             <p className="text-sm font-medium italic opacity-80">{comment.text}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </TabsContent>
            </Tabs>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-10">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic flex items-center gap-4">
              <TrendingUp className="w-6 h-6 text-rose-500" /> Recommended
            </h3>
          </div>
          
          <ScrollArea className="h-[900px] pr-4">
            <div className="space-y-6 pb-20">
              {dbVideos?.map((video) => (
                <div key={video.id} onClick={() => setSelectedVideo(video)} className={cn("flex gap-5 group cursor-pointer p-4 rounded-[2.5rem] transition-all duration-300 border-4", activeVideo?.id === video.id ? "bg-rose-500/10 border-rose-500/30 shadow-2xl scale-[1.02]" : "border-transparent hover:bg-white/5")}>
                  <div className="relative w-44 h-28 rounded-2xl overflow-hidden shrink-0 shadow-xl bg-black">
                    <Image src={`https://picsum.photos/seed/${video.id}/400/225`} alt="Thumb" fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" />
                  </div>
                  <div className="space-y-2 py-1 flex-1 overflow-hidden">
                    <h4 className="text-sm font-black text-foreground line-clamp-2 uppercase italic tracking-tight group-hover:text-rose-500 transition-colors leading-tight">{video.title}</h4>
                    <div className="flex flex-col gap-1">
                       <p className="text-[10px] font-black text-muted-foreground uppercase italic">@{video.author}</p>
                       <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">{video.views} Views</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

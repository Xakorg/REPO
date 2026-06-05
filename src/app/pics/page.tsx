"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  ImageIcon, 
  Heart, 
  Share2, 
  Plus, 
  Loader2, 
  Camera,
  Lock,
  FolderOpen,
  LayoutGrid,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  FolderPlus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface Album {
  id: string;
  name: string;
  description: string;
  coverImage: string;
}

interface Pic {
  id: string;
  url: string;
  title: string;
  likes: number;
  albumId: string;
  authorId: string;
  authorName: string;
  timestamp?: any;
}

// No default mock datasets

export default function XakPicsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "albums">("feed");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  // Slideshow overlay state
  const [slideshowIdx, setSlideshowIdx] = useState<number | null>(null);

  // Create album state
  const [albumName, setAlbumName] = useState("");
  const [albumDesc, setAlbumDesc] = useState("");
  const [albumCover, setAlbumCover] = useState("");
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);

  // Upload picture state
  const [picTitle, setPicTitle] = useState("");
  const [picUrl, setPicUrl] = useState("");
  const [picAlbumId, setPicAlbumId] = useState("");
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch public pics from Firestore
  const picsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "public_pics"), orderBy("timestamp", "desc"), limit(100));
  }, [firestore]);

  const { data: dbPics, isLoading } = useCollection(picsQuery);

  // Combine database pics
  const pics = useMemo(() => {
    return (dbPics || []) as Pic[];
  }, [dbPics]);

  // Fetch albums from Firestore
  const albumsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "pics_albums"), orderBy("timestamp", "desc"));
  }, [firestore, user]);

  const { data: dbAlbums } = useCollection(albumsQuery);

  const albums = useMemo(() => {
    return (dbAlbums || []) as Album[];
  }, [dbAlbums]);

  useEffect(() => {
    if (albums.length > 0 && !picAlbumId) {
      setPicAlbumId(albums[0].id);
    }
  }, [albums, picAlbumId]);

  // Filtered pictures based on album selection
  const filteredPics = useMemo(() => {
    if (!selectedAlbumId) return pics;
    return pics.filter(p => p.albumId === selectedAlbumId);
  }, [pics, selectedAlbumId]);

  const handleCreateAlbum = async () => {
    if (!user || !firestore || !albumName.trim()) return;
    try {
      const cover = albumCover.trim() || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";
      const albumsRef = collection(firestore, "users", user.uid, "pics_albums");
      await addDocumentNonBlocking(albumsRef, {
        name: albumName,
        description: albumDesc,
        coverImage: cover,
        timestamp: serverTimestamp()
      });
      toast({ title: "Album Created!", description: `"${albumName}" is ready.` });
      setAlbumName("");
      setAlbumDesc("");
      setAlbumCover("");
      setIsAlbumOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create album." });
    }
  };

  const handlePublishPic = async () => {
    if (!user || !firestore || !picTitle.trim() || !picUrl.trim()) return;
    try {
      const picsRef = collection(firestore, "public_pics");
      await addDocumentNonBlocking(picsRef, {
        title: picTitle,
        url: picUrl,
        likes: 0,
        albumId: picAlbumId,
        authorId: user.uid,
        authorName: user.displayName?.replace(/^@+/, "") || "Member",
        timestamp: serverTimestamp()
      });
      toast({ title: "Shard Published!", description: `"${picTitle}" is live.` });
      setPicTitle("");
      setPicUrl("");
      setIsPublishOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to publish pic." });
    }
  };

  const handleLike = async (pic: Pic) => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Authentication Required" });
      return;
    }
    if (pic.id.startsWith("pic-")) {
      pic.likes += 1;
      toast({ title: "Liked! (Demo)" });
      return;
    }
    try {
      const picRef = doc(firestore, "public_pics", pic.id);
      await updateDoc(picRef, { likes: (pic.likes || 0) + 1 });
      toast({ title: "Liked!" });
    } catch (e) {
      console.error(e);
    }
  };

  // Slideshow Navigation
  const prevSlide = () => {
    if (slideshowIdx === null) return;
    setSlideshowIdx(prev => (prev !== null && prev > 0) ? prev - 1 : filteredPics.length - 1);
  };

  const nextSlide = () => {
    if (slideshowIdx === null) return;
    setSlideshowIdx(prev => (prev !== null && prev < filteredPics.length - 1) ? prev + 1 : 0);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-[1600px] mx-auto py-6 md:py-10 animate-fade-in px-4 md:px-6 space-y-8 md:space-y-12 pb-32">
      {/* Header Panel */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-10 bg-card/40 backdrop-blur-xl p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border-2 md:border-4 border-white/10 shadow-2xl relative overflow-hidden text-foreground">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Camera className="w-40 md:w-80 h-40 md:h-80 -rotate-12 text-pink-500" /></div>
        <div className="relative z-10 flex items-center gap-4 md:gap-8">
          <div className="w-12 h-12 md:w-24 md:h-24 rounded-2xl md:rounded-[3rem] bg-pink-500/10 flex items-center justify-center border-2 md:border-4 border-pink-500/20 shadow-xl shadow-pink-900/20">
            <ImageIcon className="w-6 h-6 md:w-12 md:h-12 text-pink-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">XakPicks</h1>
            <p className="text-[8px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] flex items-center gap-2 md:gap-4 mt-2 md:mt-4 italic">
              <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-pink-500 animate-pulse shadow-[0_0_10px_pink]" /> Media Registry
            </p>
          </div>
        </div>

        {/* Buttons Panel */}
        <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
          {/* Create Album Trigger */}
          <Dialog open={isAlbumOpen} onOpenChange={setIsAlbumOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 md:h-18 px-8 rounded-xl md:rounded-[2rem] border-2 border-white/10 bg-white/5 text-white font-black uppercase text-[9px] md:text-xs tracking-widest hover:bg-white/10 transition-all shadow-xl">
                <FolderPlus className="w-4.5 h-4.5 mr-3 text-pink-500" /> Create Album
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-4 border-white/10 rounded-[3rem] text-white p-10 max-w-md shadow-[0_30px_100px_rgba(0,0,0,0.9)]">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-pink-500">Create Album</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Album Name</label>
                  <Input value={albumName} onChange={(e) => setAlbumName(e.target.value)} placeholder="Summer Shards" className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Description</label>
                  <Input value={albumDesc} onChange={(e) => setAlbumDesc(e.target.value)} placeholder="Visual assets and study logs..." className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Cover Image URL</label>
                  <Input value={albumCover} onChange={(e) => setAlbumCover(e.target.value)} placeholder="https://images.unsplash.com/..." className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold" />
                </div>
                <Button onClick={handleCreateAlbum} className="w-full h-14 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest border-none mt-2">
                  Deploy Album Node
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Publish Photo Trigger */}
          <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
            <DialogTrigger asChild>
              <Button className="bg-pink-600 hover:bg-pink-500 h-12 md:h-18 px-8 md:px-12 rounded-xl md:rounded-[2rem] font-black uppercase text-[9px] md:text-xs tracking-widest shadow-xl text-white border-b-4 md:border-b-8 border-pink-900 active:border-b-0 transition-all italic border-none">
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-3" /> Publish Shard
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-4 border-white/10 rounded-[3rem] text-white p-10 max-w-md shadow-[0_30px_100px_rgba(0,0,0,0.9)]">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-pink-500">Publish Photo Shard</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Photo Title</label>
                  <Input value={picTitle} onChange={(e) => setPicTitle(e.target.value)} placeholder="Synth sunset" className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Image URL</label>
                  <Input value={picUrl} onChange={(e) => setPicUrl(e.target.value)} placeholder="https://images.unsplash.com/..." className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Target Album</label>
                  <select 
                    value={picAlbumId} 
                    onChange={(e) => setPicAlbumId(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/5 h-12 rounded-xl text-xs font-bold px-3 text-white outline-none focus:border-pink-500/40"
                  >
                    {albums.map((alb) => (
                      <option key={alb.id} value={alb.id}>{alb.name}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={handlePublishPic} className="w-full h-14 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest border-none mt-2">
                  Publish Shard Live
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Primary Tab Navigation */}
      <div className="space-y-10">
        <div className="flex bg-secondary/35 p-1 rounded-2xl border border-white/5 max-w-md">
          <button 
            onClick={() => { setActiveTab("feed"); setSelectedAlbumId(null); }}
            className={cn(
              "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === "feed" && !selectedAlbumId ? "bg-pink-600 text-white" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            Public Feed
          </button>
          <button 
            onClick={() => setActiveTab("albums")}
            className={cn(
              "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === "albums" ? "bg-pink-600 text-white" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            Albums Directory
          </button>
        </div>

        {/* Public Feed Tab */}
        {activeTab === "feed" && (
          <div className="space-y-10">
            {isLoading ? (
              <div className="py-40 flex flex-col items-center justify-center space-y-6">
                <Loader2 className="animate-spin w-12 h-12 text-pink-500 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-pink-500/40">Syncing Media...</p>
              </div>
            ) : filteredPics.length === 0 ? (
              <div className="py-40 text-center opacity-10 space-y-8">
                <ImageIcon className="w-48 h-48 mx-auto animate-float" />
                <p className="text-2xl font-black uppercase tracking-[1em]">Feed Empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {filteredPics.map((pic, idx) => (
                  <Card 
                    key={pic.id} 
                    className="glass-card group hover:-translate-y-3 transition-all duration-500 rounded-[2.5rem] overflow-hidden border-4 border-white/10 hover:border-pink-500/40 shadow-2xl bg-zinc-950/40 flex flex-col justify-between"
                  >
                    <div 
                      onClick={() => setSlideshowIdx(idx)}
                      className="relative aspect-square overflow-hidden bg-black cursor-pointer"
                    >
                      <img 
                        src={pic.url} 
                        alt="Gallery Shard" 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-[1.5s]" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10">
                        <div className="text-[8px] font-black uppercase text-pink-500 tracking-wider">Title</div>
                        <div className="text-sm font-black text-white italic truncate">{pic.title}</div>
                      </div>
                    </div>
                    <CardContent className="p-6 flex justify-between items-center bg-black/40 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={() => handleLike(pic)} 
                          variant="ghost" 
                          size="icon" 
                          className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white transition-all border border-pink-500/20"
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </Button>
                        <span className="text-lg font-black italic tabular-nums text-white">{pic.likes || 0}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[7px] font-black uppercase text-zinc-500 tracking-widest">Publisher</div>
                        <div className="text-[10px] font-black text-zinc-300">@{pic.authorName}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Albums Tab */}
        {activeTab === "albums" && !selectedAlbumId && (
          albums.length === 0 ? (
            <div className="py-20 text-center opacity-20 space-y-8 w-full col-span-3">
              <FolderOpen className="w-32 h-32 mx-auto animate-float text-pink-500" />
              <p className="text-xl font-black uppercase tracking-[0.5em] text-white">No Albums Created</p>
              <p className="text-xs font-bold text-muted-foreground uppercase">Create your first album node above to organize your shards.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {albums.map((album) => {
                const albumCount = pics.filter(p => p.albumId === album.id).length;
                return (
                  <Card 
                    key={album.id}
                    onClick={() => { setSelectedAlbumId(album.id); setActiveTab("feed"); }}
                    className="glass-card rounded-[3rem] overflow-hidden border-4 border-white/10 hover:border-pink-500/40 hover:-translate-y-2 transition-all duration-300 bg-zinc-950/40 shadow-2xl cursor-pointer group"
                  >
                    <div className="relative h-60 bg-black overflow-hidden">
                      <img 
                        src={album.coverImage} 
                        alt="Cover" 
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6 space-y-2">
                        <Badge className="bg-pink-600 text-white font-black text-[8px] uppercase tracking-widest px-3 py-1 border-none">{albumCount} Shards</Badge>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">{album.name}</h3>
                        <p className="text-xs text-zinc-300 font-medium leading-relaxed italic">{album.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Filtered Album Indicator Bar */}
      {selectedAlbumId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-zinc-950/90 backdrop-blur-md border border-white/15 px-6 py-3 rounded-full flex items-center gap-6 shadow-3xl animate-bounce">
          <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">
            Viewing Album: <span className="text-pink-500 italic">{albums.find(a => a.id === selectedAlbumId)?.name}</span>
          </span>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setSelectedAlbumId(null)}
            className="w-8 h-8 rounded-full bg-white/5 text-white hover:bg-rose-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Fullscreen Slideshow Overlay Modal */}
      {slideshowIdx !== null && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-md flex flex-col justify-between p-10 animate-in fade-in duration-300">
          <header className="flex justify-between items-center text-white">
            <div>
              <div className="text-[10px] font-black uppercase text-pink-500 tracking-[0.4em] italic">XakPicks Gallery Viewer</div>
              <h3 className="text-2xl font-black uppercase italic tracking-tight">{filteredPics[slideshowIdx].title}</h3>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setSlideshowIdx(null)}
              className="w-14 h-14 rounded-full border border-white/10 hover:bg-rose-600/20 text-white"
            >
              <X className="w-6 h-6" />
            </Button>
          </header>

          <div className="flex-1 flex items-center justify-between gap-10">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={prevSlide}
              className="w-16 h-16 rounded-full border border-white/10 hover:bg-white/5 text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            <div className="relative max-w-4xl max-h-[65vh] aspect-square flex items-center justify-center overflow-hidden">
              <img 
                src={filteredPics[slideshowIdx].url} 
                alt="Slideshow" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-3xl border-2 border-white/10 animate-in zoom-in-95 duration-300"
              />
            </div>

            <Button 
              size="icon" 
              variant="ghost" 
              onClick={nextSlide}
              className="w-16 h-16 rounded-full border border-white/10 hover:bg-white/5 text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>

          <footer className="flex justify-between items-center text-white max-w-3xl mx-auto w-full border-t border-white/5 pt-6">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => handleLike(filteredPics[slideshowIdx as number])}
                className="h-14 px-8 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-black uppercase text-xs tracking-wider"
              >
                <Heart className="w-5 h-5 mr-3 fill-current" /> Like Shard ({filteredPics[slideshowIdx].likes})
              </Button>
              <a 
                href={filteredPics[slideshowIdx].url} 
                target="_blank" 
                rel="noreferrer" 
                className="h-14 px-8 border border-white/10 hover:bg-white/5 rounded-xl font-black uppercase text-xs tracking-wider flex items-center gap-2"
              >
                View Source <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Published by</div>
              <div className="text-sm font-black text-white italic">@{filteredPics[slideshowIdx].authorName}</div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

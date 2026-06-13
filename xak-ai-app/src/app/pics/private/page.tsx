
"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Lock, 
  FolderPlus, 
  ImageIcon, 
  ArrowLeft,
  Loader2, 
  Trash2, 
  Download, 
  Settings, 
  Upload,
  Grid,
  ShieldCheck,
  Search,
  Menu,
  Plus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage } from "@/firebase";
import { collection, query, orderBy, addDoc, doc, serverTimestamp, where, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function PrivatePicsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const albumsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "albums"), orderBy("createdAt", "desc"));
  }, [firestore, user]);

  const mediaQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    let q = collection(firestore, "users", user.uid, "private_media");
    if (activeAlbum) {
      return query(q, where("albumId", "==", activeAlbum), orderBy("timestamp", "desc"));
    }
    return query(q, orderBy("timestamp", "desc"));
  }, [firestore, user, activeAlbum]);

  const { data: albums } = useCollection(albumsQuery);
  const { data: mediaItems, isLoading } = useCollection(mediaQuery);

  const handleCreateAlbum = async () => {
    if (!user || !firestore) return;
    const name = prompt("Enter album name:");
    if (!name) return;
    await addDoc(collection(firestore, "users", user.uid, "albums"), {
      name,
      createdAt: serverTimestamp(),
      count: 0
    });
    toast({ title: "Album Created" });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user || !firestore || !storage) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const storageRef = ref(storage, `private_media/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(prog);
          },
          () => resolve(),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(firestore, "users", user.uid, "private_media"), {
              name: file.name,
              url,
              type: file.type.startsWith('video') ? 'video' : 'image',
              albumId: activeAlbum,
              timestamp: serverTimestamp()
            });
            resolve();
          }
        );
      });
    }
    setIsUploading(false);
    setUploadProgress(0);
    toast({ title: "Media Secured", description: "Photos added to your private vault." });
  };

  if (!mounted) return null;
  if (!user) return <div className="p-32 text-center text-foreground font-black uppercase italic">Sign in to access your Private Vault.</div>;

  const SidebarContent = () => (
    <div className="flex flex-col h-full gap-6 p-6">
      <header className="glass-card p-8 rounded-[3rem] border-amber-500/20 bg-amber-500/5 space-y-4">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-900/40">
               <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Private</h2>
         </div>
         <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] leading-relaxed italic">
           Media Encryption Active.
         </p>
      </header>

      <div className="flex flex-col gap-3">
         <Button onClick={() => fileInputRef.current?.click()} className="h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest border-b-8 border-primary/20 active:border-b-0 transition-all">
           <Upload className="w-5 h-5 mr-3" /> Sync Media
         </Button>
         <Button onClick={handleCreateAlbum} variant="outline" className="h-14 rounded-2xl border-white/10 font-black uppercase text-[10px] text-muted-foreground hover:bg-white/5">
           <FolderPlus className="w-5 h-5 mr-3" /> New Album
         </Button>
      </div>

      <Card className="flex-1 glass-card rounded-[2.5rem] border-white/10 overflow-hidden flex flex-col bg-black/40">
         <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white italic">Directory</h3>
            <Badge variant="outline" className="text-[8px] font-black border-white/10 text-primary">{albums?.length || 0}</Badge>
         </div>
         <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
               <button 
                onClick={() => setActiveAlbum(null)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl transition-all border text-[10px] font-black uppercase tracking-widest",
                  !activeAlbum ? "bg-primary/10 border-primary/20 text-primary shadow-lg" : "text-muted-foreground border-transparent hover:bg-white/5"
                )}
               >
                  <div className="flex items-center gap-4"><Grid className="w-4 h-4" /><span>All Photos</span></div>
               </button>
               {albums?.map(album => (
                 <button 
                  key={album.id}
                  onClick={() => setActiveAlbum(album.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl transition-all border text-[10px] font-black uppercase tracking-widest",
                    activeAlbum === album.id ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-lg" : "text-muted-foreground border-transparent hover:bg-white/5"
                  )}
                 >
                    <div className="flex items-center gap-4"><ImageIcon className="w-4 h-4" /><span className="truncate max-w-[120px]">{album.name}</span></div>
                 </button>
               ))}
            </div>
         </ScrollArea>
      </Card>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-4 md:py-10 animate-fade-in px-4 md:px-6 text-foreground h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] flex gap-4 md:gap-10">
      <div className="hidden lg:flex w-80 flex-col">
        <SidebarContent />
      </div>

      <div className="flex-1 flex flex-col gap-6 md:gap-10 overflow-hidden">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-6 w-full">
              <Link href="/pics">
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 border-2 border-white/5 hover:bg-white/5 text-muted-foreground transition-all"><ArrowLeft className="w-6 h-6" /></Button>
              </Link>
              <div className="flex-1 overflow-hidden">
                <h1 className="text-3xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none truncate drop-shadow-2xl">
                  {activeAlbum ? albums?.find(a => a.id === activeAlbum)?.name : "Private Vault"}
                </h1>
                <p className="flex text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] mt-2 items-center gap-3 italic">
                  <ShieldCheck className="w-4 h-4 animate-pulse" /> Verified Media Library
                </p>
              </div>
              <div className="flex lg:hidden">
                 <Sheet>
                    <SheetTrigger asChild>
                       <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/10 bg-card/40 shadow-xl">
                         <Menu className="w-6 h-6 text-white/60" />
                       </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80 bg-zinc-950 border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.9)]">
                       <SidebarContent />
                    </SheetContent>
                 </Sheet>
              </div>
           </div>
           
           <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80 group">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                 <Input placeholder="Search encrypted media..." className="h-14 pl-14 bg-card/40 border-white/10 rounded-2xl text-sm font-bold italic shadow-inner" />
              </div>
              <Button variant="ghost" size="icon" className="h-14 w-14 border-2 border-white/5 rounded-2xl hover:bg-white/5 shadow-lg"><Settings className="w-6 h-6 text-muted-foreground" /></Button>
           </div>
        </header>

        {isUploading && (
          <Card className="p-6 md:p-8 bg-amber-500/10 border-4 border-amber-500/20 rounded-[2.5rem] md:rounded-[3.5rem] animate-in slide-in-from-top-4 shadow-2xl">
             <div className="flex justify-between items-center mb-4 text-[10px] font-black uppercase text-amber-500 tracking-widest italic">
                <span className="flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin" /> Synchronizing Media...</span>
                <span className="text-xl tabular-nums">{uploadProgress}%</span>
             </div>
             <Progress value={uploadProgress} className="h-3 bg-black/60 rounded-full border border-white/5 shadow-inner" />
          </Card>
        )}

        <Card className="flex-1 glass-card rounded-[2.5rem] md:rounded-[5rem] border-4 border-white/10 overflow-hidden flex flex-col shadow-[0_50px_150px_rgba(0,0,0,0.8)] bg-zinc-950/40">
           <ScrollArea className="flex-1">
              <div className="p-6 md:p-16">
                 {isLoading ? (
                   <div className="py-40 flex flex-col items-center justify-center space-y-8">
                      <Loader2 className="animate-spin w-16 h-16 text-amber-500 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-amber-500/30">Decrypting Media...</p>
                   </div>
                 ) : !mediaItems || mediaItems.length === 0 ? (
                   <div className="py-40 flex flex-col items-center justify-center text-center space-y-10 opacity-20 group">
                      <Lock className="w-24 h-24 md:w-40 md:h-40 group-hover:scale-110 transition-transform duration-700" />
                      <div className="space-y-4">
                         <h3 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">Vault_Empty</h3>
                         <p className="text-[11px] font-black uppercase tracking-[0.8em]">Registry Zero Detected</p>
                      </div>
                      <Button onClick={() => fileInputRef.current?.click()} className="h-16 px-12 bg-primary rounded-2xl font-black uppercase italic tracking-widest shadow-2xl pointer-events-auto">
                        <Plus className="w-6 h-6 mr-3" /> Initial Sync
                      </Button>
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-10">
                      {mediaItems.map(item => (
                        <Card key={item.id} className="group relative rounded-[2rem] md:rounded-[4rem] overflow-hidden border-4 border-white/5 hover:border-amber-500/40 transition-all duration-500 bg-zinc-950 aspect-square shadow-2xl">
                           {item.type === 'video' ? (
                             <video src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                           ) : (
                             <img src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[2s]" alt={item.name} />
                           )}
                           
                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                           <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-500">
                              <Badge className="bg-amber-600 text-white border-none text-[8px] font-black uppercase tracking-widest px-4 shadow-2xl">{item.type}</Badge>
                              <div className="flex gap-3">
                                 <button onClick={() => deleteDoc(doc(firestore!, "users", user.uid, "private_media", item.id))} className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-xl border-2 border-white/10 flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-xl active:scale-90"><Trash2 className="w-5 h-5" /></button>
                                 <button className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-xl border-2 border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl active:scale-90"><Download className="w-5 h-5" /></button>
                              </div>
                           </div>
                        </Card>
                      ))}
                   </div>
                 )}
              </div>
           </ScrollArea>
        </Card>
        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={(e) => handleUpload(e.target.files)} />
      </div>
    </div>
  );
}

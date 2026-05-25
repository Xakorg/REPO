
"use client";

import { useState, useRef, useEffect } from "react";
import { 
  HardDrive, 
  Search, 
  Trash2, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  Upload, 
  FolderOpen, 
  File, 
  Clock, 
  Star, 
  Users, 
  ShieldCheck, 
  Lock, 
  ChevronDown, 
  Eye, 
  X, 
  Download,
  Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";

export default function XakDrivePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const filesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "drive_files"),
      orderBy("timestamp", "desc"),
      limit(100)
    );
  }, [firestore, user]);

  const { data: driveFiles, isLoading } = useCollection(filesQuery);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !user || !firestore || !storage) return;
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const storageRef = ref(storage, `drive/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          (err) => { toast({ variant: "destructive", title: "Error", description: "Upload failed." }); reject(err); },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            addDocumentNonBlocking(collection(firestore, "users", user.uid, "drive_files"), {
              name: file.name,
              size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
              type: file.type || "unknown",
              url,
              timestamp: serverTimestamp()
            });
            resolve();
          }
        );
      });
    }
    setIsUploading(false);
    setUploadProgress(0);
    toast({ title: "Upload Complete" });
  };

  const handleDelete = () => {
    if (!user || !firestore || selectedIds.length === 0) return;
    for (const id of selectedIds) {
      deleteDocumentNonBlocking(doc(firestore, "users", user.uid, "drive_files", id));
    }
    setSelectedIds([]);
    toast({ title: "Files Deleted" });
  };

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground animate-fade-in">
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
          <div className="absolute inset-0 arcade-grid opacity-10" />
          <div className="relative z-10 space-y-12 max-w-5xl">
            <Badge variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-500/5 px-6 py-2 rounded-full font-black uppercase text-xs">Storage</Badge>
            <div className="space-y-6">
              <h1 className="text-6xl md:text-[8.5rem] font-black tracking-tighter uppercase italic leading-[0.85] text-white">
                Safe. Secure. <br />
                <span className="text-amber-500 flex items-center justify-center gap-4">Everywhere</span>
              </h1>
              <p className="text-xl md:text-3xl text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-3xl mx-auto italic opacity-60">Private library for your files and media.</p>
            </div>
            <Link href="/auth"><Button className="h-20 px-16 bg-amber-500 text-black rounded-[2rem] font-black text-xl uppercase italic shadow-2xl">Initialize Drive</Button></Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-6 animate-fade-in px-6 text-white h-[calc(100vh-140px)] flex gap-8">
      <div className="w-80 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleFileUpload(e.target.files)} />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full h-16 bg-primary hover:bg-primary/90 rounded-[1.8rem] font-black uppercase text-xs tracking-widest italic shadow-xl border-b-8 border-primary/20 active:border-b-0">
            <Upload className="w-5 h-5 mr-3" /> Upload Files
          </Button>
          <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 font-black uppercase text-[10px] text-muted-foreground"><FolderOpen className="w-4 h-4 mr-3" /> New Folder</Button>
        </div>
        
        <Card className="flex-1 glass-card border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col bg-black/40">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Directory</h3>
            <Badge variant="outline" className="text-[8px] border-white/10">{driveFiles?.length || 0}</Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
                {[
                  { label: "My Drive", icon: HardDrive, active: true },
                  { label: "Shared", icon: Users },
                  { label: "Recent", icon: Clock },
                  { label: "Starred", icon: Star },
                ].map(item => (
                  <button key={item.label} className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all border border-transparent", item.active ? "bg-primary/10 border-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5")}>
                    <div className="flex items-center gap-4"><item.icon className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span></div>
                  </button>
                ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <header className="flex justify-between items-end bg-card/40 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20"><HardDrive className="w-8 h-8 text-amber-500" /></div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">XakDrive</h1>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[8px] mt-2 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Protected Vault</p>
            </div>
          </div>
          <div className="flex gap-4">
             {selectedIds.length > 0 && <Button onClick={handleDelete} variant="ghost" className="h-12 px-6 rounded-xl text-rose-500 font-black uppercase text-[10px]"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>}
             <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search drive..." className="pl-12 h-12 bg-black/40 border-none rounded-xl text-xs font-bold" />
             </div>
          </div>
        </header>

        <Card className="flex-1 glass-card rounded-[3.5rem] border-white/10 overflow-hidden flex flex-col shadow-2xl bg-black/20">
          {isUploading && (
            <div className="p-6 bg-primary/10 border-b border-primary/20 space-y-3">
               <div className="flex justify-between text-[8px] font-black uppercase text-primary"><span>Uploading...</span><span>{uploadProgress}%</span></div>
               <Progress value={uploadProgress} className="h-1 bg-black/40" />
            </div>
          )}
          <ScrollArea className="flex-1">
            <div className="p-10">
               {isLoading ? (
                 <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {driveFiles?.map(file => (
                      <Card 
                        key={file.id} 
                        onClick={() => setSelectedIds(prev => prev.includes(file.id) ? prev.filter(i => i !== file.id) : [...prev, file.id])}
                        onDoubleClick={() => setPreviewFile(file)}
                        className={cn(
                          "group cursor-pointer rounded-[2.5rem] overflow-hidden border-4 transition-all duration-300 bg-zinc-950/50 aspect-square relative flex flex-col",
                          selectedIds.includes(file.id) ? "border-primary scale-[1.02]" : "border-white/5 hover:border-white/20"
                        )}
                      >
                         <div className="flex-1 flex items-center justify-center p-6 relative">
                            {file.type.includes('image') ? <img src={file.url} className="w-full h-full object-cover opacity-60 rounded-xl" /> : <File className="w-12 h-12 text-muted-foreground opacity-40" />}
                            <div className="absolute top-4 right-4">{selectedIds.includes(file.id) && <CheckCircle2 className="w-5 h-5 text-primary" />}</div>
                         </div>
                         <div className="p-4 bg-black/40 border-t border-white/5 space-y-1">
                            <h4 className="text-[10px] font-black text-foreground uppercase italic truncate">{file.name}</h4>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">{file.size}</p>
                         </div>
                      </Card>
                    ))}
                 </div>
               )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
         <DialogContent className="max-w-6xl glass-card rounded-[4rem] border-white/20 p-0 overflow-hidden bg-black/90">
            <DialogHeader className="sr-only"><DialogTitle>File Preview: {previewFile?.name}</DialogTitle></DialogHeader>
            <div className="flex flex-col h-[80vh]">
               <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                  <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-4"><Eye className="w-6 h-6 text-primary" /> {previewFile?.name}</h3>
                  <div className="flex gap-4">
                     <Button onClick={() => setPreviewFile(null)} variant="ghost" size="icon" className="rounded-full"><X className="w-6 h-6" /></Button>
                  </div>
               </div>
               <div className="flex-1 flex items-center justify-center p-12">
                  {previewFile?.type.includes('image') ? <img src={previewFile.url} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl" /> : <div className="text-center space-y-8 opacity-20"><File className="w-32 h-32 mx-auto" /><p className="text-2xl font-black uppercase italic">Preview Unavailable</p></div>}
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

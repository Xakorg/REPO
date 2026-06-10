"use client";

import { useState, useRef, useEffect } from "react";
import { 
  HardDrive, Search, Trash2, Plus, Loader2, CheckCircle2, Upload, 
  FolderOpen, File, Clock, Star, Users, ShieldCheck, Lock, 
  ChevronDown, Eye, X, Download, Cloud, Folder, FolderLock, 
  KeyRound, Settings, Share2, History, Users2, DownloadCloud, 
  PieChart, Copy, Image as ImageIcon, Trash, Tag, StarOff, 
  Activity, Mail, CalendarClock, LockKeyhole, Scissors, 
  SlidersHorizontal, Code, Link as LinkIcon, Grid, List, 
  SearchCode, FileArchive, PlaySquare, WifiOff, FileSignature, FileEdit
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
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";

const DB_NAME = 'xakteir-drive';
const STORE_NAME = 'handles';
const KEY_NAME = 'root-directory';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(handle, KEY_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(KEY_NAME);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function clearDirectoryHandle(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(KEY_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

type DriveMode = 'cloud' | 'local' | 'starred' | 'photos' | 'trash' | 'vault';

export default function XakDrivePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [driveMode, setDriveMode] = useState<DriveMode>('cloud');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  // Local File System Access states
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [hasFolderPermission, setHasFolderPermission] = useState(false);
  const [localFiles, setLocalFiles] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ocrSearchEnabled, setOcrSearchEnabled] = useState(false);
  
  // Drag and Drop
  const [isDragging, setIsDragging] = useState(false);

  // Mocked state for new UI features
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showVaultDialog, setShowVaultDialog] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    setMounted(true); 
    loadSavedFolder();
  }, []);

  const filesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "drive_files"),
      orderBy("timestamp", "desc"),
      limit(100)
    );
  }, [firestore, user]);

  const { data: driveFiles, isLoading } = useCollection(filesQuery);

  const loadSavedFolder = async () => {
    try {
      const handle = await loadDirectoryHandle();
      if (handle) {
        setFolderHandle(handle);
        const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          setHasFolderPermission(true);
          scanLocalFolder(handle);
        } else {
          setHasFolderPermission(false);
        }
      }
    } catch (e) {
      console.error("Failed loading saved directory handle", e);
    }
  };

  const requestFolderPermission = async () => {
    if (!folderHandle) return;
    try {
      const permission = await (folderHandle as any).requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        setHasFolderPermission(true);
        scanLocalFolder(folderHandle);
        toast({ title: "Local Folder Unlocked", description: "Successfully established local directory connection." });
      } else {
        setHasFolderPermission(false);
        toast({ variant: "destructive", title: "Access Denied", description: "Browser directory permission was rejected." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Authorization error", description: "Browser aborted verification protocol." });
    }
  };

  const pickLocalFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setFolderHandle(handle);
      await saveDirectoryHandle(handle);
      setHasFolderPermission(true);
      scanLocalFolder(handle);
      setDriveMode('local');
      toast({ title: "Directory Connected", description: `Linked "${handle.name}" directory successfully.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Directory Picker Cancelled" });
    }
  };

  const scanLocalFolder = async (handle: FileSystemDirectoryHandle) => {
    setIsScanning(true);
    try {
      const filesList: any[] = [];
      for await (const entry of (handle as any).values()) {
        if (entry.kind === 'file') {
          const fileObj = await (entry as FileSystemFileHandle).getFile();
          filesList.push({
            id: entry.name,
            name: entry.name,
            type: fileObj.type || 'binary',
            size: (fileObj.size / (1024 * 1024)).toFixed(2) + " MB",
            fileObject: fileObj,
            handle: entry,
            timestamp: new Date(fileObj.lastModified)
          });
        } else {
          filesList.push({
            id: entry.name,
            name: entry.name,
            type: 'directory',
            size: '--',
            handle: entry,
            timestamp: new Date()
          });
        }
      }
      setLocalFiles(filesList);
    } catch (err) {
      toast({ variant: "destructive", title: "Folder Scan Failed", description: "Could not read local directories." });
    } finally {
      setIsScanning(false);
    }
  };

  const disconnectFolder = async () => {
    await clearDirectoryHandle();
    setFolderHandle(null);
    setHasFolderPermission(false);
    setLocalFiles([]);
    setDriveMode('cloud');
    toast({ title: "Folder Disconnected" });
  };

  useEffect(() => {
    if (driveMode === 'local' && hasFolderPermission && driveFiles && localFiles.length > 0) {
      const missingFiles = localFiles.filter(lf => 
        lf.type !== 'directory' && !driveFiles.some(cf => cf.name === lf.name)
      );

      missingFiles.forEach(lf => {
        if (!storage || !user || !firestore) return;
        const storageRef = ref(storage, `drive/${user.uid}/${Date.now()}_${lf.name}`);
        const uploadTask = uploadBytesResumable(storageRef, lf.fileObject);
        uploadTask.on('state_changed', null, null, async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            addDocumentNonBlocking(collection(firestore, "users", user.uid, "drive_files"), {
              name: lf.name,
              size: lf.size,
              type: lf.type || "unknown",
              url,
              timestamp: serverTimestamp()
            });
        });
      });
    }
  }, [driveFiles, localFiles, driveMode, hasFolderPermission, user, firestore, storage]);

  const handleFileUpload = async (files: FileList | File[] | null) => {
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteCloudFile = () => {
    if (!user || !firestore || selectedIds.length === 0) return;
    for (const id of selectedIds) {
      // Mock trash functionality: In reality, we could flag as deleted or move to trash collection
      deleteDocumentNonBlocking(doc(firestore, "users", user.uid, "drive_files", id));
    }
    setSelectedIds([]);
    toast({ title: "Moved to Trash", description: "Files will be permanently deleted in 30 days." });
  };

  const handleOpenPreview = (file: any) => {
    if (driveMode === 'local') {
      const blobUrl = URL.createObjectURL(file.fileObject);
      setPreviewFile({
        ...file,
        url: blobUrl
      });
    } else {
      setPreviewFile(file);
    }
  };

  const handleDownloadFile = (file: any) => {
    const link = document.createElement('a');
    link.href = file.url || URL.createObjectURL(file.fileObject);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLocalFiles = localFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCloudFiles = driveFiles?.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
    <div className="max-w-[1600px] mx-auto py-6 animate-fade-in px-6 text-white h-[calc(100vh-140px)] flex gap-8 dark">
      
      {/* Sidebar Controllers */}
      <div className="w-80 flex flex-col gap-6 shrink-0 h-full">
        <div className="flex flex-col gap-3">
          {driveMode === 'cloud' ? (
            <>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleFileUpload(e.target.files)} />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full h-16 bg-primary hover:bg-primary/95 text-black rounded-[1.8rem] font-black uppercase text-xs tracking-widest italic shadow-xl">
                <Upload className="w-5 h-5 mr-3 text-black" /> Upload Files
              </Button>
            </>
          ) : (
            <Button onClick={pickLocalFolder} className="w-full h-16 bg-amber-500 hover:bg-amber-400 text-black rounded-[1.8rem] font-black uppercase text-xs tracking-widest italic shadow-xl">
              <FolderOpen className="w-5 h-5 mr-3 text-black" /> Sync Another Folder
            </Button>
          )}
          
          <Button onClick={pickLocalFolder} variant="outline" className="w-full h-14 rounded-2xl border-white/10 font-black uppercase text-[10px] text-white hover:bg-white/5"><Plus className="w-4 h-4 mr-3" /> Connect Native Drive</Button>
        </div>
        
        <Card className="flex-1 glass-card border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col bg-black/40">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Drive Navigation</h3>
            <Badge variant="outline" className="text-[8px] border-white/10">
              {driveMode === 'cloud' ? (driveFiles?.length || 0) : localFiles.length}
            </Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              <button onClick={() => setDriveMode('cloud')} className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left", driveMode === 'cloud' ? "bg-primary/10 border-primary/25 text-primary font-black" : "text-muted-foreground hover:bg-white/5")}>
                <div className="flex items-center gap-4"><Cloud className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Cloud Drive Vault</span></div>
              </button>

              <button onClick={() => { if (folderHandle) setDriveMode('local'); else pickLocalFolder(); }} className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left", driveMode === 'local' ? "bg-amber-500/10 border-amber-500/25 text-amber-500 font-black" : "text-muted-foreground hover:bg-white/5")}>
                <div className="flex items-center gap-4">
                  <Folder className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-44">
                    {folderHandle ? `Local: ${folderHandle.name}` : "Connect Local Folder"}
                  </span>
                </div>
              </button>

              <button onClick={() => setDriveMode('starred')} className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left", driveMode === 'starred' ? "bg-yellow-500/10 border-yellow-500/25 text-yellow-500 font-black" : "text-muted-foreground hover:bg-white/5")}>
                <div className="flex items-center gap-4"><Star className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Starred</span></div>
              </button>

              <button onClick={() => setDriveMode('photos')} className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left", driveMode === 'photos' ? "bg-pink-500/10 border-pink-500/25 text-pink-500 font-black" : "text-muted-foreground hover:bg-white/5")}>
                <div className="flex items-center gap-4"><ImageIcon className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Auto Backup Photos</span></div>
              </button>

              <button onClick={() => { setShowVaultDialog(true); }} className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left", driveMode === 'vault' ? "bg-purple-500/10 border-purple-500/25 text-purple-500 font-black" : "text-muted-foreground hover:bg-white/5")}>
                <div className="flex items-center gap-4"><LockKeyhole className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Secure Vault</span></div>
              </button>

              <button onClick={() => setDriveMode('trash')} className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left", driveMode === 'trash' ? "bg-rose-500/10 border-rose-500/25 text-rose-500 font-black" : "text-muted-foreground hover:bg-white/5")}>
                <div className="flex items-center gap-4"><Trash className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Trash Bin</span></div>
              </button>

              <button className="w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left text-muted-foreground hover:bg-white/5">
                <div className="flex items-center gap-4"><Copy className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Find Duplicates</span></div>
              </button>

              <button className="w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left text-muted-foreground hover:bg-white/5">
                <div className="flex items-center gap-4"><CalendarClock className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Automated Backups</span></div>
              </button>

              <button className="w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left text-muted-foreground hover:bg-white/5">
                <div className="flex items-center gap-4"><Code className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Developer API</span></div>
              </button>

              {folderHandle && (
                <button 
                  onClick={disconnectFolder}
                  className="w-full flex items-center p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-xs font-black uppercase tracking-widest mt-10 justify-center gap-2"
                >
                  <FolderLock className="w-3.5 h-3.5" /> Disconnect Local
                </button>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><PieChart className="w-3 h-3" /> Storage Quota</span>
              <span className="text-[8px] font-bold text-white">45 GB / 100 GB</span>
            </div>
            <Progress value={45} className="h-1.5 bg-white/5 mb-2" />
            <button className="text-[9px] text-primary hover:text-primary/80 font-bold uppercase tracking-widest w-full text-center mt-2">Upgrade Storage Plan</button>
          </div>
        </Card>
      </div>

      {/* Main Drive Display Container */}
      <div 
        className={cn("flex-1 flex flex-col gap-6 overflow-hidden h-full rounded-[3.5rem] transition-all border-4", isDragging ? "border-primary bg-primary/5" : "border-transparent")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <header className="flex justify-between items-end bg-[#0a0a15]/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl shrink-0">
          <div className="flex items-center gap-6">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", 
              driveMode === 'cloud' ? "bg-primary/10 border-primary/20 text-primary" : 
              driveMode === 'local' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
              driveMode === 'vault' ? "bg-purple-500/10 border-purple-500/20 text-purple-500" :
              "bg-white/5 border-white/10 text-white"
            )}>
              <HardDrive className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                {driveMode === 'cloud' ? 'Cloud Drive' : 
                 driveMode === 'local' ? `Native: ${folderHandle?.name || 'Local'}` :
                 driveMode === 'starred' ? 'Starred Favorites' :
                 driveMode === 'vault' ? 'Secure Vault' :
                 driveMode === 'photos' ? 'Auto Backup Photos' : 'Trash Bin'}
              </h1>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[8px] mt-2 flex items-center gap-2">
                <ShieldCheck className={cn("w-3.5 h-3.5", driveMode === 'local' ? 'text-amber-500' : 'text-primary')} /> 
                {driveMode === 'cloud' ? 'Secure Remote Storage' : 
                 driveMode === 'local' ? 'Native Sandbox Directory' : 
                 driveMode === 'vault' ? 'End-to-End Encrypted Storage' :
                 'Filtered View'}
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
             <div className="flex gap-2 mr-2 bg-black/40 p-1 rounded-xl">
               <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg", viewMode === 'grid' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}><Grid className="w-4 h-4" /></button>
               <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg", viewMode === 'list' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}><List className="w-4 h-4" /></button>
             </div>
             
             {driveMode === 'cloud' && (
                 <Button variant="secondary" className="h-12 px-4 rounded-xl font-black uppercase text-[10px] hidden lg:flex"><Users2 className="w-4 h-4 mr-2" /> Real-time Collaborate</Button>
             )}
             
             {selectedIds.length > 0 && (
               <div className="flex gap-2 animate-in fade-in">
                 <Button onClick={() => setShowShareDialog(true)} variant="secondary" className="h-12 px-4 rounded-xl font-black uppercase text-[10px]"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
                 <Button onClick={() => setShowHistoryDialog(true)} variant="secondary" className="h-12 px-4 rounded-xl font-black uppercase text-[10px]"><History className="w-4 h-4 mr-2" /> History</Button>
                 <Button onClick={handleDeleteCloudFile} variant="ghost" className="h-12 px-6 rounded-xl text-rose-500 hover:bg-rose-500/10 font-black uppercase text-[10px]"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
               </div>
             )}
             
             <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..." 
                  className="pl-12 pr-10 h-12 bg-black/45 border-none rounded-xl text-xs font-bold text-white focus-visible:ring-1 focus-visible:ring-white/10" 
                />
                <button onClick={() => { setOcrSearchEnabled(!ocrSearchEnabled); toast({ title: ocrSearchEnabled ? "OCR Search Disabled" : "OCR Search Enabled", description: "Advanced image and PDF text search toggled." }) }} className={cn("absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded", ocrSearchEnabled ? "text-primary bg-primary/20" : "text-muted-foreground hover:text-white")}>
                  <SearchCode className="w-4 h-4" />
                </button>
             </div>
          </div>
        </header>

        {/* Files Area */}
        <Card className="flex-1 glass-card rounded-[3.5rem] border-white/10 overflow-hidden flex flex-col shadow-2xl bg-black/20">
          
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center rounded-[3.5rem] border-4 border-dashed border-primary">
              <div className="text-center space-y-4 pointer-events-none">
                <Upload className="w-24 h-24 text-primary mx-auto animate-bounce" />
                <h2 className="text-4xl font-black text-white uppercase italic">Drop Files to Upload</h2>
              </div>
            </div>
          )}

          {/* File Upload Progress */}
          {driveMode === 'cloud' && isUploading && (
            <div className="p-6 bg-primary/10 border-b border-primary/20 space-y-3 shrink-0">
               <div className="flex justify-between text-[8px] font-black uppercase text-primary"><span>Uploading to cloud (Resumable)...</span><span>{uploadProgress}%</span></div>
               <Progress value={uploadProgress} className="h-1 bg-black/40" />
            </div>
          )}

          {/* LOCAL FILE MODE AWAITING BROWSER CONFIRMATION */}
          {driveMode === 'local' && folderHandle && !hasFolderPermission && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in fade-in">
              <div className="w-20 h-20 bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-3xl flex items-center justify-center animate-bounce">
                <FolderLock className="w-10 h-10 text-amber-500" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-xl font-black uppercase italic text-white tracking-tighter">Permission Required</h3>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  Allow this tab to check picked folders when you enter the site. Click the button below to confirm native directory access in your browser.
                </p>
              </div>
              <Button onClick={requestFolderPermission} className="h-14 px-8 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl shadow-xl flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-black" /> Grant Local Access
              </Button>
            </div>
          )}
          
          {driveMode === 'vault' && !vaultUnlocked && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in fade-in">
              <Lock className="w-20 h-20 text-purple-500 mb-4" />
              <h3 className="text-2xl font-black uppercase italic text-white">Secure Vault Locked</h3>
              <p className="text-sm text-muted-foreground max-w-md">Access your extra-secure encrypted files. Requires a separate password.</p>
              <Button onClick={() => setVaultUnlocked(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-black uppercase rounded-xl h-12 px-8">Unlock Vault</Button>
            </div>
          )}

          {/* GRID/LIST DISPLAY */}
          {(!['vault'].includes(driveMode) || vaultUnlocked) && (
            <ScrollArea className="flex-1">
              <div className="p-10">
                 {isLoading || isScanning ? (
                   <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>
                 ) : (driveMode === 'local' && filteredLocalFiles.length === 0) || (driveMode !== 'local' && filteredCloudFiles.length === 0) ? (
                   <div className="py-20 flex flex-col items-center justify-center space-y-4 opacity-30">
                     <File className="w-16 h-16 text-white" />
                     <div className="text-center text-white italic font-black uppercase tracking-widest text-xs">No files found in this view</div>
                   </div>
                 ) : (
                   <div className={cn("gap-6", viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "flex flex-col")}>
                      {/* Render Files */}
                      {(driveMode === 'local' ? filteredLocalFiles : filteredCloudFiles).map(file => (
                        <Card 
                          key={file.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIds(prev => prev.includes(file.id) ? prev.filter(i => i !== file.id) : [...prev, file.id]);
                          }}
                          onDoubleClick={() => handleOpenPreview(file)}
                          className={cn(
                            "group cursor-pointer overflow-hidden transition-all duration-300 bg-zinc-950/50 relative flex",
                            viewMode === 'grid' ? "rounded-[2.5rem] border-4 aspect-square flex-col" : "rounded-2xl border-2 flex-row items-center p-4 gap-4 h-20",
                            selectedIds.includes(file.id) ? "border-primary scale-[1.02] shadow-[0_0_30px_rgba(var(--primary),0.2)]" : "border-white/5 hover:border-white/20"
                          )}
                        >
                           <div className={cn("relative overflow-hidden", viewMode === 'grid' ? "flex-1 flex items-center justify-center p-6" : "w-12 h-12 flex-shrink-0")}>
                              {file.type.includes('image') ? (
                                <img src={file.url || (file.fileObject ? URL.createObjectURL(file.fileObject) : '')} className="w-full h-full object-cover opacity-60 rounded-xl" />
                              ) : file.type.includes('zip') ? (
                                <FileArchive className="w-full h-full text-blue-400 opacity-60" />
                              ) : file.type.includes('video') ? (
                                <PlaySquare className="w-full h-full text-red-400 opacity-60" />
                              ) : file.type === 'directory' ? (
                                <Folder className="w-full h-full text-amber-500/40" />
                              ) : (
                                <File className="w-full h-full text-muted-foreground opacity-40" />
                              )}
                              {selectedIds.includes(file.id) && <div className={cn("absolute", viewMode === 'grid' ? "top-4 right-4" : "top-0 right-0")}><CheckCircle2 className="w-5 h-5 text-primary" /></div>}
                           </div>
                           <div className={cn("bg-black/45 space-y-1", viewMode === 'grid' ? "p-4 border-t border-white/5" : "flex-1 border-none bg-transparent p-0 flex justify-between items-center")}>
                              <div>
                                <h4 className="text-[10px] font-black text-foreground uppercase italic truncate">{file.name}</h4>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">{file.size} // {driveMode}</p>
                              </div>
                              {viewMode === 'list' && (
                                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {file.type === 'directory' && <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10" title="Custom Folder Icon"><ImageIcon className="w-4 h-4 text-purple-500" /></Button>}
                                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10"><Star className="w-4 h-4 text-yellow-500" /></Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10"><Tag className="w-4 h-4 text-green-500" /></Button>
                                </div>
                              )}
                           </div>
                        </Card>
                      ))}
                   </div>
                 )}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>

      {/* Dynamic File Viewer & Download Modal */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
         <DialogContent className="max-w-6xl glass-card rounded-[4rem] border-white/20 p-0 overflow-hidden bg-black/95">
            <DialogHeader className="sr-only"><DialogTitle>File Preview: {previewFile?.name}</DialogTitle></DialogHeader>
            <div className="flex flex-col h-[80vh] text-white">
               <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                  <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-4"><Eye className="w-6 h-6 text-primary animate-pulse" /> {previewFile?.name}</h3>
                  <div className="flex gap-4 items-center">
                     {previewFile?.type.includes('image') && (
                       <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 font-black uppercase text-[10px]"><FileEdit className="w-4 h-4 mr-2" /> Built-in Editor</Button>
                     )}
                     {previewFile?.type.includes('video') && (
                       <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 font-black uppercase text-[10px]"><Scissors className="w-4 h-4 mr-2" /> Trim Video</Button>
                     )}
                     {previewFile?.type.includes('zip') && (
                       <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 font-black uppercase text-[10px]"><FileArchive className="w-4 h-4 mr-2" /> Extract Zip</Button>
                     )}
                     <Button variant="ghost" className="text-white hover:bg-white/5"><WifiOff className="w-4 h-4 mr-2" /> Offline Toggle</Button>
                     <Button onClick={() => handleDownloadFile(previewFile)} className="bg-primary hover:bg-primary/80 text-black font-black uppercase text-xs h-10 px-5 rounded-lg flex items-center gap-2"><Download className="w-4 h-4" /> Download File</Button>
                     <Button onClick={() => setPreviewFile(null)} variant="ghost" size="icon" className="rounded-full hover:bg-white/5"><X className="w-6 h-6 text-white" /></Button>
                  </div>
               </div>
               <div className="flex-1 flex items-center justify-center p-12">
                  {previewFile?.type.includes('image') ? (
                    <img src={previewFile.url} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl border border-white/10" />
                  ) : previewFile?.type.includes('video') ? (
                    <div className="text-center space-y-4">
                      <PlaySquare className="w-32 h-32 mx-auto text-red-400" />
                      <p className="text-2xl font-black uppercase italic">Media Stream</p>
                      <Button className="mt-4 bg-red-500 hover:bg-red-400 text-white">Stream Now</Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-8 opacity-30">
                      <File className="w-32 h-32 mx-auto text-primary" />
                      <p className="text-2xl font-black uppercase italic">Universal Viewer Locked</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest max-w-sm mx-auto">Supports 50+ formats. Double click or use the download action above to extract this logic stream directly.</p>
                    </div>
                  )}
               </div>
            </div>
         </DialogContent>
      </Dialog>
      
      {/* MOCKED MODALS */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="glass-card bg-black/90 border-white/10 text-white rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase italic text-xl flex items-center gap-2"><Share2 className="w-5 h-5 text-primary" /> Share File</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Share Link (Expiring in 24h)</label>
              <div className="flex gap-2">
                <Input readOnly value="https://xakchat.com/d/mock-share-link-123" className="bg-black/50 border-white/10 text-white" />
                <Button size="icon" className="bg-primary hover:bg-primary/80 text-black"><Copy className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="space-y-2 border-t border-white/10 pt-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Lock className="w-3 h-3" /> Password Protection</label>
              <Input type="password" placeholder="Set a password for the link..." className="bg-black/50 border-white/10 text-white" />
            </div>
            <div className="space-y-2 border-t border-white/10 pt-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Users2 className="w-3 h-3" /> Granular Permissions</label>
              <select className="w-full bg-black/50 border-white/10 text-white h-10 rounded-md px-3 text-sm">
                <option>Anyone with link can View</option>
                <option>Anyone with link can Comment</option>
                <option>Anyone with link can Edit</option>
              </select>
            </div>
            <div className="space-y-2 border-t border-white/10 pt-4">
              <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5"><Mail className="w-4 h-4 mr-2" /> Send as Mail Attachment</Button>
              <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5"><FileSignature className="w-4 h-4 mr-2" /> Generate File Request Link</Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowShareDialog(false)} className="bg-primary hover:bg-primary/80 text-black font-black uppercase w-full">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="glass-card bg-black/90 border-white/10 text-white rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase italic text-xl flex items-center gap-2"><History className="w-5 h-5 text-primary" /> Version History & Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[1, 2, 3].map((v) => (
              <div key={v} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-sm font-bold">Version {4-v}.0</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{v === 1 ? 'Current' : `Edited 2 days ago`}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/20 hover:text-primary">Restore</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

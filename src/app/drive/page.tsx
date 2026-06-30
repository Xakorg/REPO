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
  SearchCode, FileArchive, PlaySquare, WifiOff, FileSignature, FileEdit,
  Video, Music, FileText, FileCode2
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
import { collection, query, orderBy, limit, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";

// --- IndexedDB Local File Handling ---
const DB_NAME = 'xakteir-drive';
const STORE_NAME = 'handles';
const KEY_NAME = 'root-directory';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE_NAME); };
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

type DriveMode = 'cloud' | 'local' | 'starred' | 'trash' | 'vault';
type ContextMenuState = { x: number; y: number; file: any } | null;

export default function XakDrivePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [driveMode, setDriveMode] = useState<DriveMode>('cloud');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  
  // Local File System
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [hasFolderPermission, setHasFolderPermission] = useState(false);
  const [localFiles, setLocalFiles] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  // Drag and Drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vault
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const VAULT_PIN = "0000"; // Hardcoded for demo

  // Context Menu & Preview
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState<string>("");

  useEffect(() => { 
    setMounted(true); 
    loadSavedFolder();
    
    // Close context menu on global click
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const filesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "drive_files"),
      orderBy("timestamp", "desc"),
      limit(200)
    );
  }, [firestore, user]);

  const { data: driveFilesRaw, isLoading } = useCollection(filesQuery);

  // Filter files based on Vault status
  const driveFiles = (driveFilesRaw || []).filter(f => {
    if (driveMode === 'vault') return f.isVaulted;
    if (driveMode === 'trash') return false; // not implemented
    return !f.isVaulted; // Cloud, Starred, etc hide vaulted files
  }).filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Local Folder Logic
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
        toast({ title: "Local Folder Unlocked" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Access Denied" });
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
      toast({ title: "Directory Connected" });
    } catch (e) {
      // cancelled
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
        }
      }
      setLocalFiles(filesList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  // Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !storage || !firestore || !user) return;
    const file = e.target.files[0];
    await uploadToCloud(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!storage || !firestore || !user) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadToCloud(file);
    }
  };

  const uploadToCloud = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    const storageRef = ref(storage!, `users/${user!.uid}/drive/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        setIsUploading(false);
        toast({ variant: "destructive", title: "Upload failed" });
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await addDocumentNonBlocking(`users/${user!.uid}/drive_files`, {
          name: file.name,
          url: downloadURL,
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
          type: file.type,
          timestamp: serverTimestamp(),
          isVaulted: driveMode === 'vault'
        });
        setIsUploading(false);
        toast({ title: "Upload Complete" });
      }
    );
  };

  // Context Menu Actions
  const handleContextMenu = (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handlePreview = async (file: any) => {
    setPreviewFile(file);
    setPreviewContent("");
    
    // If text or code, fetch content
    if (file.type?.includes("text") || file.type?.includes("json") || file.name.match(/\.(js|ts|jsx|tsx|md|json|txt|py|go|html|css)$/)) {
      try {
        if (file.url) {
          const res = await fetch(file.url);
          const text = await res.text();
          setPreviewContent(text);
        } else if (file.fileObject) {
          const text = await file.fileObject.text();
          setPreviewContent(text);
        }
      } catch (err) {
        setPreviewContent("Failed to load text content.");
      }
    }
  };

  const handleToggleVault = async (file: any) => {
    if (!firestore || !user || !file.url) return; // Only cloud files for now
    await updateDoc(doc(firestore, `users/${user.uid}/drive_files`, file.id), {
      isVaulted: !file.isVaulted
    });
    toast({ title: file.isVaulted ? "Removed from Vault" : "Moved to Vault" });
  };

  const handleDelete = async (file: any) => {
    if (!firestore || !user || !file.url) return;
    await deleteDocumentNonBlocking(`users/${user.uid}/drive_files`, file.id);
    toast({ title: "File deleted" });
  };

  // Helpers
  const getFileIcon = (type: string, name: string) => {
    if (type.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type.includes("video")) return <Video className="w-8 h-8 text-pink-500" />;
    if (type.includes("audio")) return <Music className="w-8 h-8 text-yellow-500" />;
    if (name.match(/\.(js|ts|jsx|tsx|py|go|html|css)$/)) return <FileCode2 className="w-8 h-8 text-green-500" />;
    if (type.includes("pdf") || name.match(/\.(pdf|txt|md|docx)$/)) return <FileText className="w-8 h-8 text-orange-500" />;
    return <File className="w-8 h-8 text-zinc-500" />;
  };

  if (!mounted || !user) return <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-white"><Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" /><h1>Loading Drive...</h1></div>;

  return (
    <div 
      className="h-screen bg-zinc-950 text-white flex overflow-hidden font-sans select-none"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); if (e.clientX === 0) setIsDragging(false); }}
      onDrop={handleDrop}
    >
      {/* DRAG OVERLAY */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-blue-600/20 backdrop-blur-xl border-4 border-blue-500 border-dashed flex flex-col items-center justify-center rounded-3xl m-4"
          >
            <Upload className="w-24 h-24 text-blue-400 mb-6 animate-bounce" />
            <h2 className="text-4xl font-black text-white tracking-tight">Drop files to upload</h2>
            <p className="text-blue-200 mt-2">Uploading to {driveMode === 'vault' ? 'The Vault' : 'Cloud Storage'}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTEXT MENU */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 w-56 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <div className="px-3 py-2 border-b border-white/5 mb-1 truncate">
              <span className="text-xs font-medium text-zinc-400">{contextMenu.file.name}</span>
            </div>
            <button onClick={() => handlePreview(contextMenu.file)} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center">
              <Eye className="w-4 h-4 mr-2" /> Preview
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center">
              <Download className="w-4 h-4 mr-2" /> Download
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center">
              <Share2 className="w-4 h-4 mr-2" /> Share Link
            </button>
            <div className="h-px bg-white/10 my-1 mx-2" />
            <button onClick={() => handleToggleVault(contextMenu.file)} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-yellow-600 hover:text-white flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2" /> {contextMenu.file.isVaulted ? "Remove from Vault" : "Move to Vault"}
            </button>
            <div className="h-px bg-white/10 my-1 mx-2" />
            <button onClick={() => handleDelete(contextMenu.file)} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white flex items-center">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <div className="w-64 bg-zinc-900/50 border-r border-white/5 flex flex-col pt-6 pb-4">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Xakteir Drive</h1>
        </div>

        <div className="px-3 space-y-1">
          <p className="px-3 text-xs font-black uppercase tracking-wider text-zinc-500 mb-2 mt-4">Storage</p>
          <button 
            onClick={() => setDriveMode('cloud')} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'cloud' ? "bg-blue-600/20 text-blue-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <HardDrive className="w-4 h-4 mr-3" /> My Cloud
          </button>
          <button 
            onClick={() => setDriveMode('local')} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'local' ? "bg-blue-600/20 text-blue-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <FolderOpen className="w-4 h-4 mr-3" /> Local Folders
          </button>
          
          <p className="px-3 text-xs font-black uppercase tracking-wider text-zinc-500 mb-2 mt-6">Quick Access</p>
          <button 
            onClick={() => setDriveMode('starred')} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'starred' ? "bg-yellow-500/20 text-yellow-500" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <Star className="w-4 h-4 mr-3" /> Starred
          </button>
          
          <p className="px-3 text-xs font-black uppercase tracking-wider text-zinc-500 mb-2 mt-6">Security</p>
          <button 
            onClick={() => { setDriveMode('vault'); setVaultUnlocked(false); }} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'vault' ? "bg-purple-500/20 text-purple-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <LockKeyhole className="w-4 h-4 mr-3" /> The Vault
          </button>
          <button 
            onClick={() => setDriveMode('trash')} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'trash' ? "bg-red-500/20 text-red-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <Trash className="w-4 h-4 mr-3" /> Trash
          </button>
        </div>

        <div className="mt-auto px-6">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">Storage</span>
              <span className="text-xs font-medium text-blue-400">45%</span>
            </div>
            <Progress value={45} className="h-1.5 bg-zinc-700" />
            <p className="text-[10px] text-zinc-500 mt-2">45 GB of 100 GB used</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Action Bar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-lg font-medium capitalize flex items-center gap-2">
              {driveMode === 'cloud' && <HardDrive className="w-5 h-5 text-blue-400" />}
              {driveMode === 'local' && <FolderOpen className="w-5 h-5 text-blue-400" />}
              {driveMode === 'vault' && <LockKeyhole className="w-5 h-5 text-purple-400" />}
              {driveMode === 'starred' && <Star className="w-5 h-5 text-yellow-400" />}
              {driveMode === 'trash' && <Trash className="w-5 h-5 text-red-400" />}
              {driveMode.replace("-", " ")}
            </h2>
            
            <div className="relative w-96 ml-8 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder="Search files..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border-none pl-9 h-9 rounded-full focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-900 rounded-lg p-1">
              <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded-md transition-colors", viewMode === 'grid' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white")}><Grid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-md transition-colors", viewMode === 'list' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white")}><List className="w-4 h-4" /></button>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <Button onClick={() => fileInputRef.current?.click()} className="h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4 mr-1.5" /> New File
            </Button>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="absolute top-16 left-0 right-0 h-1 bg-zinc-800 z-20">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {/* VAULT PIN SCREEN */}
        {driveMode === 'vault' && !vaultUnlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950">
            <LockKeyhole className="w-16 h-16 text-purple-500 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            <h2 className="text-2xl font-bold mb-2">The Vault is Locked</h2>
            <p className="text-zinc-400 mb-8 text-sm">Enter your PIN to view secure files.</p>
            <div className="flex flex-col gap-4">
              <Input 
                type="password" 
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="****"
                maxLength={4}
                className="w-48 text-center text-2xl tracking-[0.5em] h-14 bg-zinc-900 border-white/10"
              />
              <Button 
                onClick={() => {
                  if (pinInput === VAULT_PIN) { setVaultUnlocked(true); setPinInput(""); }
                  else { toast({ variant: "destructive", title: "Incorrect PIN" }); setPinInput(""); }
                }}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500"
              >
                Unlock
              </Button>
            </div>
          </div>
        ) : (
          /* FILE BROWSER */
          <ScrollArea className="flex-1 p-6">
            
            {/* Local Folder Permission Request */}
            {driveMode === 'local' && folderHandle && !hasFolderPermission && (
              <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex flex-col items-center text-center">
                <FolderLock className="w-12 h-12 text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium text-yellow-400 mb-2">Browser security requires re-authentication</h3>
                <p className="text-zinc-400 text-sm mb-4">Click below to unlock `{folderHandle.name}`.</p>
                <Button onClick={requestFolderPermission} className="bg-yellow-500 text-black hover:bg-yellow-400">Unlock Folder</Button>
              </div>
            )}

            {driveMode === 'local' && !folderHandle && (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-white/5 rounded-2xl">
                <FolderOpen className="w-12 h-12 mb-4 text-zinc-600" />
                <p className="mb-4 text-sm">Connect a local folder to sync</p>
                <Button onClick={pickLocalFolder} variant="outline" className="border-white/10">Select Folder</Button>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {(driveMode === 'local' ? localFiles : driveFiles).map(file => (
                  <div 
                    key={file.id}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                    onDoubleClick={() => handlePreview(file)}
                    className="group relative flex flex-col items-center p-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10"
                  >
                    <div className="w-20 h-20 mb-4 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 shadow-sm group-hover:shadow-md transition-all group-hover:scale-105">
                      {/* Thumbnail Preview for Images */}
                      {file.type?.includes("image") && file.url ? (
                        <img src={file.url} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        getFileIcon(file.type || "", file.name)
                      )}
                    </div>
                    <span className="text-xs font-medium text-center w-full truncate px-1 text-zinc-300 group-hover:text-white">{file.name}</span>
                    <span className="text-[10px] text-zinc-500 mt-1">{file.size || "Unknown"}</span>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="flex flex-col gap-1">
                <div className="flex items-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-white/5 mb-2">
                  <div className="w-10"></div>
                  <div className="flex-1">Name</div>
                  <div className="w-32">Date Modified</div>
                  <div className="w-24 text-right">Size</div>
                </div>
                {(driveMode === 'local' ? localFiles : driveFiles).map(file => (
                  <div 
                    key={file.id}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                    onDoubleClick={() => handlePreview(file)}
                    className="flex items-center px-4 py-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="w-10 flex justify-center">
                      {getFileIcon(file.type || "", file.name)}
                    </div>
                    <div className="flex-1 font-medium text-sm text-zinc-300 group-hover:text-white truncate pr-4">{file.name}</div>
                    <div className="w-32 text-xs text-zinc-500">
                      {file.timestamp?.toDate ? file.timestamp.toDate().toLocaleDateString() : file.timestamp?.toLocaleDateString() || "Just now"}
                    </div>
                    <div className="w-24 text-right text-xs text-zinc-500">{file.size}</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Empty States */}
            {driveFiles.length === 0 && driveMode !== 'local' && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 pt-20">
                <HardDrive className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">No files here yet</p>
                <p className="text-sm mt-2">Drag and drop files to upload</p>
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {/* ADVANCED FILE PREVIEWER */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-6xl w-[90vw] h-[85vh] p-0 bg-zinc-950 border-white/10 flex flex-col overflow-hidden gap-0 rounded-2xl shadow-2xl">
          <DialogHeader className="px-4 py-3 border-b border-white/10 bg-zinc-900/50 flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="flex items-center gap-3 text-sm font-medium">
              {previewFile && getFileIcon(previewFile.type || "", previewFile.name)}
              {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 relative bg-black/50 overflow-hidden flex items-center justify-center">
            {previewFile?.type?.includes("image") ? (
              <img src={previewFile.url} className="max-w-full max-h-full object-contain" />
            ) : previewFile?.type?.includes("video") ? (
              <video src={previewFile.url} controls className="max-w-full max-h-full outline-none" autoPlay />
            ) : previewFile?.type?.includes("audio") ? (
              <div className="w-full max-w-md p-6 bg-zinc-900 rounded-2xl border border-white/5">
                <Music className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
                <audio src={previewFile.url} controls className="w-full outline-none" autoPlay />
              </div>
            ) : previewContent !== "" ? (
              <div className="w-full h-full text-left">
                {previewFile.name.match(/\.(js|ts|jsx|tsx|json|py|html|css)$/) ? (
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    defaultLanguage={previewFile.name.split('.').pop() === 'js' ? 'javascript' : previewFile.name.split('.').pop()}
                    value={previewContent}
                    options={{ readOnly: true, minimap: { enabled: false } }}
                  />
                ) : (
                  <ScrollArea className="h-full p-6">
                    <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">{previewContent}</pre>
                  </ScrollArea>
                )}
              </div>
            ) : (
              <div className="text-center text-zinc-500">
                <File className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <p>No preview available for this file type.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.open(previewFile.url, "_blank")}>
                  Download File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  Video, Music, FileText, FileCode2, ChevronRight, FolderPlus, Palette, PenLine, RotateCcw,
  RefreshCw, Laptop
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

async function saveDirectoryHandle(handle: FileSystemDirectoryHandle) {
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(handle, KEY_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

type DriveMode = 'cloud' | 'local' | 'starred' | 'trash' | 'vault' | 'recent' | 'sync';
type ContextMenuState = { x: number; y: number; file: any } | null;
type EmptyContextMenuState = { x: number; y: number } | null;
type FolderPath = { id: string; name: string };
type SortBy = 'name' | 'date' | 'size';
type SortOrder = 'asc' | 'desc';

const FOLDER_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6b7280"];
const MAX_STORAGE_GB = 100;

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
  
  // Advanced States
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  
  // Folder Navigation State
  const [currentPath, setCurrentPath] = useState<FolderPath[]>([{ id: 'root', name: 'My Cloud' }]);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Rename & Share State
  const [renameFile, setRenameFile] = useState<any>(null);
  const [newFileName, setNewFileName] = useState("");
  const [shareFile, setShareFile] = useState<any>(null);

  const currentFolderId = currentPath[currentPath.length - 1].id;

  // Drag and Drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vault
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const VAULT_PIN = "0000"; 

  // Context Menu & Preview
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [emptyContextMenu, setEmptyContextMenu] = useState<EmptyContextMenuState>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState<string>("");

  // Sync Engine State
  const [localDirHandle, setLocalDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  useEffect(() => { 
    setMounted(true); 
    
    // Attempt to load saved sync handle on boot
    loadDirectoryHandle().then(handle => {
      if (handle) setLocalDirHandle(handle);
    }).catch(console.error);
    
    // Close context menus on global click
    const handleGlobalClick = () => {
      setContextMenu(null);
      setEmptyContextMenu(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const filesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "drive_files"),
      orderBy("timestamp", "desc"),
      limit(1000)
    );
  }, [firestore, user]);

  const { data: driveFilesRaw, isLoading } = useCollection(filesQuery);

  // Storage Calculation
  const calculateStorage = () => {
    if (!driveFilesRaw) return 0;
    let totalMB = 0;
    driveFilesRaw.forEach(f => {
      if (!f.isFolder && f.size && f.size.includes("MB")) {
        totalMB += parseFloat(f.size);
      }
    });
    return (totalMB / 1024).toFixed(2); // Convert MB to GB
  };

  const usedStorageGB = parseFloat(calculateStorage());
  const storagePercentage = Math.min((usedStorageGB / MAX_STORAGE_GB) * 100, 100);

  // Filter and Sort
  const driveFiles = (driveFilesRaw || []).filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (driveMode === 'trash') return f.isTrashed;
    if (f.isTrashed) return false;

    if (driveMode === 'vault') return f.isVaulted;
    if (driveMode === 'starred') return f.isStarred && !f.isVaulted;
    
    if (driveMode === 'recent') {
      return !f.isVaulted && !f.isFolder;
    }
    
    if (driveMode === 'sync') return false; // Sync tab has custom UI

    return !f.isVaulted && (f.parentId || 'root') === currentFolderId;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortBy === 'date') {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    }
    if (sortBy === 'size') {
      const sizeA = parseFloat(a.size) || 0;
      const sizeB = parseFloat(b.size) || 0;
      return sortOrder === 'asc' ? sizeA - sizeB : sizeB - sizeA;
    }
    return 0;
  });

  // Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !storage || !firestore || !user) return;
    
    if (usedStorageGB >= MAX_STORAGE_GB) {
      toast({ variant: "destructive", title: "Storage Full", description: "Please delete some files to upload more." });
      return;
    }

    const file = e.target.files[0];
    await uploadToCloud(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!storage || !firestore || !user) return;
    if (usedStorageGB >= MAX_STORAGE_GB) {
      toast({ variant: "destructive", title: "Storage Full" });
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadToCloud(file);
    }
  };

  const uploadToCloud = async (file: File | Blob, customName?: string, bypassFolderId?: string) => {
    setIsUploading(true);
    setUploadProgress(0);
    const fileName = customName || (file as File).name || "Untitled";
    const storageRef = ref(storage!, `users/${user!.uid}/drive/${Date.now()}_${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file as Blob);

    return new Promise<void>((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => { 
          const progress = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 100;
          setUploadProgress(progress); 
        }, 
        (error) => { setIsUploading(false); toast({ variant: "destructive", title: "Upload failed" }); reject(error); }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDocumentNonBlocking(collection(firestore!, 'users', user!.uid, 'drive_files'), {
            name: fileName,
            url: downloadURL,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            type: file.type || "application/octet-stream",
            timestamp: serverTimestamp(),
            isVaulted: driveMode === 'vault',
            isTrashed: false,
            parentId: bypassFolderId || currentFolderId,
            isFolder: false
          });
          setIsUploading(false);
          toast({ title: "File created" });
          resolve();
        }
      );
    });
  };

  // Sync Engine Logic
  const selectSyncFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await saveDirectoryHandle(handle);
      setLocalDirHandle(handle);
      toast({ title: "Local Sync Folder Linked!" });
    } catch (e) {
      console.error(e);
    }
  };

  const verifySyncPermission = async (handle: FileSystemDirectoryHandle) => {
    const options = { mode: 'readwrite' };
    if ((await (handle as any).queryPermission(options)) === 'granted') return true;
    if ((await (handle as any).requestPermission(options)) === 'granted') return true;
    return false;
  };

  const runBidirectionalSync = async () => {
    if (!localDirHandle || !driveFilesRaw) return;
    const hasPermission = await verifySyncPermission(localDirHandle);
    if (!hasPermission) {
      toast({ variant: "destructive", title: "Permission Denied to Local Folder" });
      return;
    }

    setIsSyncing(true);
    setSyncLogs([]);
    const log = (msg: string) => setSyncLogs(prev => [...prev, msg]);
    log(`Starting Sync with ${localDirHandle.name}...`);

    try {
      // 1. Read Local Files (Flat level for now to prevent browser crashes)
      const localFiles = new Map<string, FileSystemFileHandle>();
      for await (const entry of (localDirHandle as any).values()) {
        if (entry.kind === 'file') {
          localFiles.set(entry.name, entry);
        }
      }

      // 2. Read Cloud Files (Root level only for flat sync mapping)
      const cloudFiles = driveFilesRaw.filter(f => !f.isFolder && !f.isTrashed && f.parentId === 'root');
      const cloudFileNames = new Set(cloudFiles.map(f => f.name));

      // 3. Local -> Cloud
      log(`Scanning ${localFiles.size} local files...`);
      for (const [name, handle] of localFiles.entries()) {
        if (!cloudFileNames.has(name)) {
          log(`Uploading ${name} to Cloud...`);
          const file = await handle.getFile();
          await uploadToCloud(file, name, 'root');
        }
      }

      // 4. Cloud -> Local
      log(`Scanning cloud files...`);
      for (const cloudFile of cloudFiles) {
        if (!localFiles.has(cloudFile.name) && cloudFile.url) {
          log(`Downloading ${cloudFile.name} to Local Folder...`);
          try {
            const res = await fetch(cloudFile.url);
            const blob = await res.blob();
            const fileHandle = await (localDirHandle as any).getFileHandle(cloudFile.name, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
          } catch (err) {
            log(`Failed to download ${cloudFile.name}`);
          }
        }
      }

      log("Sync Complete! ✅");
      toast({ title: "Sync Complete" });
    } catch (e) {
      log(`Sync Error: ${(e as any).message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Folder Actions
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !user || !firestore) return;
    await addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'drive_files'), {
      name: newFolderName.trim(),
      isFolder: true,
      timestamp: serverTimestamp(),
      isVaulted: driveMode === 'vault',
      isTrashed: false,
      parentId: currentFolderId,
      color: "#3b82f6" 
    });
    setNewFolderName("");
    setShowNewFolderDialog(false);
    toast({ title: "Folder created" });
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentPath(prev => [...prev, { id: folderId, name: folderName }]);
    setSearchQuery("");
    setSelectedFiles(new Set());
  };

  const navigateToBreadcrumb = (index: number) => {
    setCurrentPath(prev => prev.slice(0, index + 1));
    setSelectedFiles(new Set());
  };

  const handleCreateBlankFile = async (name: string, type: string) => {
    if (!storage || !firestore || !user) return;
    const blob = new Blob([' '], { type }); // 1 byte to prevent 0-byte errors
    await uploadToCloud(blob, name);
  };

  // Rename Actions
  const handleRenameSubmit = async () => {
    if (!firestore || !user || !renameFile || !newFileName.trim()) return;
    await updateDoc(doc(firestore, 'users', user.uid, 'drive_files', renameFile.id), { name: newFileName.trim() });
    setRenameFile(null);
    setNewFileName("");
    toast({ title: "Renamed successfully" });
  };

  // Context Menu Actions
  const handleItemContextMenu = (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEmptyContextMenu(null);
    if (!selectedFiles.has(file.id)) {
      setSelectedFiles(new Set([file.id]));
    }
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleEmptySpaceContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (driveMode === 'sync') return;
    setContextMenu(null);
    setEmptyContextMenu({ x: e.clientX, y: e.clientY });
  };

  const toggleSelection = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const newSelection = new Set(selectedFiles);
    if (e.ctrlKey || e.metaKey) {
      if (newSelection.has(fileId)) newSelection.delete(fileId);
      else newSelection.add(fileId);
    } else {
      newSelection.clear();
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const executeBatch = async (action: (f: any) => Promise<void>) => {
    if (!firestore || !user) return;
    const filesToProcess = driveFilesRaw?.filter(f => selectedFiles.has(f.id)) || [];
    await Promise.all(filesToProcess.map(action));
    setSelectedFiles(new Set());
  };

  const handlePreview = async (file: any) => {
    if (file.isFolder) {
      navigateToFolder(file.id, file.name);
      return;
    }

    setPreviewFile(file);
    setPreviewContent("");
    
    if (file.type?.includes("text") || file.type?.includes("json") || file.name.match(/\.(js|ts|jsx|tsx|md|json|txt|py|go|html|css)$/)) {
      try {
        if (file.url) {
          const res = await fetch(file.url);
          setPreviewContent(await res.text());
        }
      } catch (err) {
        setPreviewContent("Failed to load text content.");
      }
    }
  };

  const handleBatchToggleVault = async () => {
    await executeBatch(async (f) => updateDoc(doc(firestore!, 'users', user!.uid, 'drive_files', f.id), { isVaulted: !f.isVaulted }));
    toast({ title: `Updated Vault settings` });
  };

  const handleBatchToggleStar = async () => {
    await executeBatch(async (f) => updateDoc(doc(firestore!, 'users', user!.uid, 'drive_files', f.id), { isStarred: !f.isStarred }));
    toast({ title: `Updated Star settings` });
  };

  const handleSetColor = async (file: any, color: string) => {
    if (!firestore || !user) return; 
    await updateDoc(doc(firestore, 'users', user.uid, 'drive_files', file.id), { color });
  };

  const handleBatchTrash = async () => {
    await executeBatch(async (f) => updateDoc(doc(firestore!, 'users', user!.uid, 'drive_files', f.id), { isTrashed: true }));
    toast({ title: `Moved to Trash` });
  };

  const handleBatchRestore = async () => {
    await executeBatch(async (f) => updateDoc(doc(firestore!, 'users', user!.uid, 'drive_files', f.id), { isTrashed: false }));
    toast({ title: `Restored files` });
  };

  const handleBatchPermanentDelete = async () => {
    await executeBatch(async (f) => deleteDocumentNonBlocking(doc(firestore!, 'users', user!.uid, 'drive_files', f.id)));
    toast({ title: `Permanently deleted` });
  };

  // Helpers
  const getFileIcon = (type: string, name: string, isFolder?: boolean, color?: string) => {
    if (isFolder) return <Folder className="w-10 h-10 transition-colors" style={{ fill: color || '#3b82f6', color: color || '#3b82f6' }} />;
    if (type.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type.includes("video")) return <Video className="w-8 h-8 text-pink-500" />;
    if (type.includes("audio")) return <Music className="w-8 h-8 text-yellow-500" />;
    if (type.includes("zip") || name.match(/\.(zip|tar|gz|rar)$/)) return <FileArchive className="w-8 h-8 text-red-500" />;
    if (name.match(/\.(js|ts|jsx|tsx|py|go|html|css)$/)) return <FileCode2 className="w-8 h-8 text-green-500" />;
    if (type.includes("pdf") || name.match(/\.(pdf|txt|md|docx)$/)) return <FileText className="w-8 h-8 text-orange-500" />;
    return <File className="w-8 h-8 text-zinc-500" />;
  };

  if (!mounted || !user) return <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-white"><Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" /><h1>Loading Drive...</h1></div>;

  const isBatchMode = selectedFiles.size > 1;

  return (
    <div 
      className="h-screen bg-zinc-950 text-white flex overflow-hidden font-sans select-none"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); if (e.clientX === 0) setIsDragging(false); }}
      onDrop={handleDrop}
      onClick={() => setSelectedFiles(new Set())}
    >
      {/* DRAG OVERLAY */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-blue-600/20 backdrop-blur-xl border-4 border-blue-500 border-dashed flex flex-col items-center justify-center rounded-3xl m-4 pointer-events-none"
          >
            <Upload className="w-24 h-24 text-blue-400 mb-6 animate-bounce" />
            <h2 className="text-4xl font-black text-white tracking-tight">Drop files to upload</h2>
            <p className="text-blue-200 mt-2">Uploading to {currentPath[currentPath.length-1].name}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILE/FOLDER CONTEXT MENU */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 w-60 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <div className="px-3 py-2 border-b border-white/5 mb-1 truncate flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 truncate pr-2">
                {isBatchMode ? `${selectedFiles.size} items selected` : contextMenu.file.name}
              </span>
              {!isBatchMode && contextMenu.file.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
            </div>
            
            {!isBatchMode && (
              <button onClick={() => handlePreview(contextMenu.file)} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center">
                {contextMenu.file.isFolder ? <FolderOpen className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {contextMenu.file.isFolder ? "Open Folder" : "Preview"}
              </button>
            )}

            {driveMode === 'trash' ? (
              <>
                <button onClick={handleBatchRestore} className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-green-600 hover:text-white flex items-center">
                  <RotateCcw className="w-4 h-4 mr-2" /> Restore
                </button>
                <div className="h-px bg-white/10 my-1 mx-2" />
                <button onClick={handleBatchPermanentDelete} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Permanently
                </button>
              </>
            ) : (
              <>
                <button onClick={handleBatchToggleStar} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-yellow-600 hover:text-white flex items-center">
                  <Star className="w-4 h-4 mr-2" /> Toggle Star
                </button>
                
                {!isBatchMode && (
                  <>
                    <button onClick={() => { setRenameFile(contextMenu.file); setNewFileName(contextMenu.file.name); }} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center">
                      <PenLine className="w-4 h-4 mr-2" /> Rename
                    </button>
                    {!contextMenu.file.isFolder && (
                      <button onClick={() => setShareFile(contextMenu.file)} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center">
                        <Share2 className="w-4 h-4 mr-2" /> Share Link
                      </button>
                    )}
                    {!contextMenu.file.isFolder && (
                      <button className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center" onClick={() => window.open(contextMenu.file.url, "_blank")}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </button>
                    )}
                  </>
                )}

                {!isBatchMode && contextMenu.file.isFolder && (
                  <div className="px-3 py-2 border-t border-white/5 mt-1">
                    <span className="text-xs text-zinc-500 mb-2 flex items-center"><Palette className="w-3 h-3 mr-1"/> Folder Color</span>
                    <div className="flex gap-2">
                      {FOLDER_COLORS.map(color => (
                        <button 
                          key={color} 
                          onClick={() => handleSetColor(contextMenu.file, color)}
                          className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-125"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-px bg-white/10 my-1 mx-2" />
                <button onClick={handleBatchToggleVault} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-purple-600 hover:text-white flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Toggle Vault
                </button>
                <div className="h-px bg-white/10 my-1 mx-2" />
                <button onClick={handleBatchTrash} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" /> Move to Trash
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* EMPTY SPACE CONTEXT MENU */}
      <AnimatePresence>
        {emptyContextMenu && driveMode !== 'trash' && driveMode !== 'recent' && driveMode !== 'sync' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 w-56 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden"
            style={{ top: emptyContextMenu.y, left: emptyContextMenu.x }}
          >
            <div className="px-3 py-2 border-b border-white/5 mb-1 truncate flex items-center text-xs font-medium text-zinc-400">
              New Item in {currentPath[currentPath.length-1].name}
            </div>
            
            <button onClick={(e) => { e.stopPropagation(); setShowNewFolderDialog(true); setEmptyContextMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center">
              <FolderPlus className="w-4 h-4 mr-2" /> New Folder
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleCreateBlankFile("Untitled.txt", "text/plain"); setEmptyContextMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center">
              <FileText className="w-4 h-4 mr-2" /> New Text File
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleCreateBlankFile("Archive.zip", "application/zip"); setEmptyContextMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center">
              <FileArchive className="w-4 h-4 mr-2" /> New Zip File
            </button>
            
            <div className="h-px bg-white/10 my-1 mx-2" />
            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); setEmptyContextMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center">
              <Upload className="w-4 h-4 mr-2" /> Upload File
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE DIALOG */}
      <Dialog open={!!shareFile} onOpenChange={(open) => !open && setShareFile(null)}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Share {shareFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center">
            {shareFile && (
              <div className="bg-white p-4 rounded-xl shadow-xl mb-6">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareFile.url)}`} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <p className="text-sm text-zinc-400 text-center mb-4">Anyone with this link or QR code can download this file directly.</p>
            <div className="flex w-full gap-2">
              <Input value={shareFile?.url || ""} readOnly className="bg-black border-white/10 text-xs" />
              <Button onClick={() => { navigator.clipboard.writeText(shareFile?.url || ""); toast({ title: "Link copied!" }); }} className="bg-blue-600 hover:bg-blue-500">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RENAME DIALOG */}
      <Dialog open={!!renameFile} onOpenChange={(open) => !open && setRenameFile(null)}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newFileName} 
              onChange={e => setNewFileName(e.target.value)} 
              placeholder="e.g. Script.py" 
              className="bg-black/50 border-white/10"
              autoFocus
              onKeyDown={e => e.key === "Enter" && handleRenameSubmit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFile(null)}>Cancel</Button>
            <Button onClick={handleRenameSubmit} className="bg-blue-600 hover:bg-blue-500">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW FOLDER DIALOG */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newFolderName} 
              onChange={e => setNewFolderName(e.target.value)} 
              placeholder="e.g. Project Assets" 
              className="bg-black/50 border-white/10"
              autoFocus
              onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} className="bg-blue-600 hover:bg-blue-500">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SIDEBAR */}
      <div className="w-64 bg-zinc-900/50 border-r border-white/5 flex flex-col pt-6 pb-4 shrink-0">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Xakteir Drive</h1>
        </div>

        <div className="px-3 space-y-1">
          <p className="px-3 text-xs font-black uppercase tracking-wider text-zinc-500 mb-2 mt-4">Storage</p>
          <button 
            onClick={() => { setDriveMode('cloud'); setCurrentPath([{id: 'root', name: 'My Cloud'}]); }} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'cloud' ? "bg-blue-600/20 text-blue-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <HardDrive className="w-4 h-4 mr-3" /> My Cloud
          </button>
          <button 
            onClick={() => setDriveMode('sync')} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'sync' ? "bg-green-600/20 text-green-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <RefreshCw className="w-4 h-4 mr-3" /> Sync Engine
          </button>
          
          <p className="px-3 text-xs font-black uppercase tracking-wider text-zinc-500 mb-2 mt-6">Quick Access</p>
          <button 
            onClick={() => setDriveMode('recent')} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'recent' ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <Clock className="w-4 h-4 mr-3" /> Recent Activity
          </button>
          <button 
            onClick={() => setDriveMode('starred')} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'starred' ? "bg-yellow-500/20 text-yellow-500" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <Star className="w-4 h-4 mr-3" /> Starred
          </button>
          <button 
            onClick={() => setDriveMode('trash')} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'trash' ? "bg-red-500/20 text-red-500" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <Trash className="w-4 h-4 mr-3" /> Trash
          </button>
          
          <p className="px-3 text-xs font-black uppercase tracking-wider text-zinc-500 mb-2 mt-6">Security</p>
          <button 
            onClick={() => { setDriveMode('vault'); setVaultUnlocked(false); }} 
            className={cn("w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", driveMode === 'vault' ? "bg-purple-500/20 text-purple-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}
          >
            <LockKeyhole className="w-4 h-4 mr-3" /> The Vault
          </button>
        </div>

        <div className="mt-auto px-6">
          <Button onClick={() => setShowNewFolderDialog(true)} variant="outline" className="w-full mb-4 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5">
            <FolderPlus className="w-4 h-4 mr-2" /> New Folder
          </Button>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">Storage</span>
              <span className={cn("text-xs font-medium", storagePercentage > 90 ? "text-red-400" : "text-blue-400")}>
                {storagePercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={storagePercentage} className="h-1.5 bg-zinc-700" indicatorColor={storagePercentage > 90 ? "bg-red-500" : "bg-blue-500"} />
            <p className="text-[10px] text-zinc-500 mt-2">{usedStorageGB} GB of {MAX_STORAGE_GB} GB used</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Action Bar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            {/* Breadcrumbs */}
            {driveMode === 'cloud' || driveMode === 'vault' ? (
              <div className="flex items-center text-lg font-medium whitespace-nowrap overflow-x-auto hide-scrollbar">
                {driveMode === 'vault' && <LockKeyhole className="w-5 h-5 text-purple-400 mr-2" />}
                {driveMode === 'vault' && <span className="text-purple-400 mr-2">Vault</span>}
                
                {currentPath.map((crumb, idx) => (
                  <div key={crumb.id} className="flex items-center">
                    {idx > 0 && <ChevronRight className="w-4 h-4 mx-2 text-zinc-600 shrink-0" />}
                    <button 
                      onClick={() => navigateToBreadcrumb(idx)}
                      className={cn("hover:text-blue-400 transition-colors truncate max-w-[200px]", idx === currentPath.length - 1 ? "text-white" : "text-zinc-500")}
                    >
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <h2 className="text-lg font-medium capitalize flex items-center gap-2">
                {driveMode === 'starred' && <Star className="w-5 h-5 text-yellow-400" />}
                {driveMode === 'trash' && <Trash className="w-5 h-5 text-red-400" />}
                {driveMode === 'recent' && <Clock className="w-5 h-5 text-blue-400" />}
                {driveMode === 'sync' && <RefreshCw className="w-5 h-5 text-green-400" />}
                {driveMode === 'sync' ? 'Sync Engine' : driveMode}
              </h2>
            )}
            
            {driveMode !== 'sync' && (
              <div className="relative w-64 ml-auto hidden md:block shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border-none pl-9 h-9 rounded-full focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>
            )}
          </div>

          {driveMode !== 'sync' && (
            <div className="flex items-center gap-3 ml-4">
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 border-white/10 bg-zinc-900">
                    <SlidersHorizontal className="w-4 h-4 mr-2" /> Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-white/10 text-white">
                  <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('asc'); }}>Name (A-Z)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('desc'); }}>Name (Z-A)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>Newest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>Oldest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('size'); setSortOrder('desc'); }}>Largest Size</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex bg-zinc-900 rounded-lg p-1">
                <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded-md transition-colors", viewMode === 'grid' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white")}><Grid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-md transition-colors", viewMode === 'list' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white")}><List className="w-4 h-4" /></button>
              </div>
              
              {driveMode !== 'trash' && (
                <>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <Button onClick={() => fileInputRef.current?.click()} className="h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4 mr-1.5" /> Upload
                  </Button>
                </>
              )}
            </div>
          )}
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
        ) : driveMode === 'sync' ? (
          /* SYNC ENGINE SCREEN */
          <div className="flex-1 overflow-auto p-8 flex flex-col items-center justify-center bg-zinc-950 relative">
            <Laptop className="w-20 h-20 text-green-500 mb-6 drop-shadow-[0_0_25px_rgba(34,197,94,0.4)]" />
            <h1 className="text-3xl font-bold tracking-tight mb-4">Web Sync Engine</h1>
            
            {!localDirHandle ? (
              <div className="text-center max-w-md">
                <p className="text-zinc-400 mb-8">Link a folder on your computer to Xakteir Drive. We will automatically sync files directly from your browser to your local hard drive.</p>
                <Button onClick={selectSyncFolder} size="lg" className="bg-green-600 hover:bg-green-500 w-full h-14 text-lg">
                  Link Local Folder
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-2xl bg-zinc-900/50 border border-white/10 rounded-2xl p-8 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-6 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <FolderOpen className="w-5 h-5 text-blue-400" />
                  <span className="font-mono text-sm text-zinc-300">Linked: {localDirHandle.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setLocalDirHandle(null)} className="h-6 px-2 text-xs ml-2 hover:bg-red-500/20 hover:text-red-400">Unlink</Button>
                </div>
                
                <Button 
                  onClick={runBidirectionalSync} 
                  disabled={isSyncing}
                  size="lg" 
                  className={cn("w-full h-14 text-lg font-semibold transition-all", isSyncing ? "bg-zinc-700" : "bg-green-600 hover:bg-green-500")}
                >
                  {isSyncing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Syncing in Progress...</> : <><RefreshCw className="w-5 h-5 mr-2" /> Start Bidirectional Sync</>}
                </Button>

                {syncLogs.length > 0 && (
                  <div className="w-full mt-6 bg-black/50 border border-white/5 rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs text-zinc-400">
                    {syncLogs.map((log, i) => (
                      <div key={i} className="mb-1 pb-1 border-b border-white/5 last:border-0">{log}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* FILE BROWSER */
          <ScrollArea className="flex-1">
            <div 
              className="min-h-full p-6" 
              onContextMenu={handleEmptySpaceContextMenu}
            >
              {/* Grid View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {driveFiles.map(file => (
                    <motion.div 
                      layoutId={file.id}
                      key={file.id}
                      onClick={(e) => toggleSelection(e, file.id)}
                      onContextMenu={(e) => handleItemContextMenu(e, file)}
                      onDoubleClick={() => handlePreview(file)}
                      className={cn(
                        "group relative flex flex-col items-center p-4 rounded-xl transition-all cursor-pointer border",
                        selectedFiles.has(file.id) ? "bg-blue-600/20 border-blue-500/50" : "border-transparent hover:border-white/10 hover:bg-white/5"
                      )}
                    >
                      {file.isStarred && (
                        <div className="absolute top-2 right-2 z-10"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /></div>
                      )}
                      <div className={cn(
                        "w-20 h-20 mb-4 bg-zinc-900 flex items-center justify-center border shadow-sm group-hover:shadow-md transition-all group-hover:scale-105",
                        file.isFolder ? "border-transparent bg-transparent shadow-none" : "rounded-2xl border-white/5"
                      )}>
                        {/* Thumbnail Preview for Images */}
                        {file.type?.includes("image") && file.url ? (
                          <img src={file.url} alt="" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          getFileIcon(file.type || "", file.name, file.isFolder, file.color)
                        )}
                      </div>
                      <span className="text-xs font-medium text-center w-full truncate px-1 text-zinc-300 group-hover:text-white">{file.name}</span>
                      <span className="text-[10px] text-zinc-500 mt-1">{file.isFolder ? "Folder" : (file.size || "Unknown")}</span>
                    </motion.div>
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
                  {driveFiles.map(file => (
                    <div 
                      key={file.id}
                      onClick={(e) => toggleSelection(e, file.id)}
                      onContextMenu={(e) => handleItemContextMenu(e, file)}
                      onDoubleClick={() => handlePreview(file)}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors group relative",
                        selectedFiles.has(file.id) ? "bg-blue-600/20" : "hover:bg-white/5"
                      )}
                    >
                      <div className="w-10 flex justify-center relative">
                        {getFileIcon(file.type || "", file.name, file.isFolder, file.color)}
                        {file.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 absolute -bottom-1 -right-1" />}
                      </div>
                      <div className="flex-1 font-medium text-sm text-zinc-300 group-hover:text-white truncate pr-4 ml-4">{file.name}</div>
                      <div className="w-32 text-xs text-zinc-500">
                        {file.timestamp?.toDate ? file.timestamp.toDate().toLocaleDateString() : "Just now"}
                      </div>
                      <div className="w-24 text-right text-xs text-zinc-500">{file.isFolder ? "--" : file.size}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Empty States */}
              {driveFiles.length === 0 && !isLoading && (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-zinc-500 pt-32">
                  <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">This folder is empty</p>
                  <p className="text-sm mt-2">Right-click anywhere to create a new file or folder.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* ADVANCED FILE PREVIEWER */}
      <Dialog open={!!previewFile && !previewFile.isFolder} onOpenChange={(open) => !open && setPreviewFile(null)}>
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

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, ShoppingBag, Sparkles, UploadCloud, FolderUp, CheckCircle, FileArchive, Code, Link2 } from "lucide-react";
import { useFirestore, useFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { upload } from "@vercel/blob/client";
import JSZip from "jszip";

type Step = "UPLOAD" | "PROCESSING" | "DETAILS" | "SUCCESS";

export default function GamesCreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("UPLOAD");
  
  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Game Details State
  const [gameTitle, setGameTitle] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [gameTags, setGameTags] = useState("");
  const [gameControls, setGameControls] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  
  // Final Published URL
  const [publishedUrl, setPublishedUrl] = useState("");
  
  // Firebase
  const firestore = useFirestore();
  const { storage, user } = useFirebase();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // --- Upload Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const processFiles = async (files: FileList) => {
    if (!firestore || !user) {
      alert("Please sign in to publish games.");
      return;
    }
    
    setStep("PROCESSING");
    setProcessingLog(["Starting processing..."]);
    setProcessingProgress(10);
    
    const file = files[0];
    const gameId = `game_${Date.now()}`;
    let filesToUpload: { path: string; file: Blob }[] = [];
    
    try {
      if (file.name.endsWith('.zip')) {
        setProcessingLog(prev => [...prev, `Extracting ${file.name}...`]);
        const zip = await JSZip.loadAsync(file);
        
        let indexHtmlFound = false;
        
        const zipFiles = Object.keys(zip.files);
        for (const relativePath of zipFiles) {
          const zipEntry = zip.files[relativePath];
          if (!zipEntry.dir) {
            const blob = await zipEntry.async("blob");
            filesToUpload.push({ path: relativePath, file: blob });
            if (relativePath.includes('index.html')) {
              indexHtmlFound = true;
            }
          }
        }
        
        if (!indexHtmlFound) {
          setProcessingLog(prev => [...prev, "ERROR: No index.html found in ZIP."]);
          setTimeout(() => setStep("UPLOAD"), 3000);
          return;
        }
        
      } else if (file.name.endsWith('.html')) {
        setProcessingLog(prev => [...prev, `Processing single HTML file...`]);
        filesToUpload.push({ path: 'index.html', file: file });
      } else if (files.length > 1) { // Directory upload
        setProcessingLog(prev => [...prev, `Processing folder with ${files.length} files...`]);
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const path = f.webkitRelativePath || f.name;
          filesToUpload.push({ path: path, file: f });
        }
      } else {
        setProcessingLog(prev => [...prev, "ERROR: Unsupported file format."]);
        setTimeout(() => setStep("UPLOAD"), 3000);
        return;
      }
      
      setProcessingProgress(40);
      setProcessingLog(prev => [...prev, `Uploading ${filesToUpload.length} files to XAKTEIR servers...`]);
      
      let uploadedCount = 0;
      let indexUrl = "";
      
      for (const item of filesToUpload) {
        // Vercel Blob structure: user-games/{uid}/{gameId}/{path}
        const blobPath = `user-games/${user.uid}/${gameId}/${item.path}`;
        
        const newBlob = await upload(blobPath, item.file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        
        uploadedCount++;
        setProcessingProgress(40 + Math.floor((uploadedCount / filesToUpload.length) * 50));
        
        if (item.path.endsWith('index.html')) {
          indexUrl = newBlob.url;
        }
      }
      
      setPublishedUrl(indexUrl);
      setProcessingProgress(100);
      setProcessingLog(prev => [...prev, "Your Project is Perfect!"]);
      
      setTimeout(() => {
        setStep("DETAILS");
      }, 1500);
      
    } catch (err: any) {
      setProcessingLog(prev => [...prev, `ERROR: ${err.message}`]);
      setTimeout(() => setStep("UPLOAD"), 3000);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    
    try {
      await addDoc(collection(firestore, "publishedProjects"), {
        name: gameTitle,
        description: gameDescription,
        tags: gameTags.split(",").map(t => t.trim()),
        controls: gameControls,
        thumbnailUrl: thumbnailUrl,
        url: publishedUrl,
        developerId: user.uid,
        createdAt: serverTimestamp(),
      });
      setStep("SUCCESS");
    } catch (error) {
      alert("Failed to save project details.");
      console.error(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-amber-500/30">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-6 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/games')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black tracking-tighter italic flex items-center gap-2">
            XAKTEIR<span className="text-amber-500">STUDIO</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => router.push('/games')}
            className="hidden md:flex px-4 py-2 bg-white/5 hover:bg-white/20 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-colors items-center gap-2 text-white/70 hover:text-white"
          >
            <Play className="w-4 h-4" /> Play
          </button>
          <button 
            onClick={() => router.push('/games/store')}
            className="hidden md:flex px-4 py-2 bg-white/5 hover:bg-white/20 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-colors items-center gap-2 text-white/70 hover:text-white"
          >
            <ShoppingBag className="w-4 h-4" /> Store
          </button>
          <button 
            className="hidden md:flex px-4 py-2 bg-white/20 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-colors items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Create
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="pt-32 pb-20 px-10 max-w-5xl mx-auto min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: UPLOAD */}
          {step === "UPLOAD" && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-5xl font-black tracking-tighter mb-4 text-center">Publish to the Store</h2>
              <p className="text-zinc-400 mb-12 text-center max-w-lg">
                Upload A folder, Zip File, or Single HTML file to begin publishing to Xakteir Game Store.
              </p>
              
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full max-w-3xl aspect-[2/1] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
              >
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <UploadCloud className="w-10 h-10 text-white/50" />
                </div>
                <p className="text-xl font-bold mb-2">Drag and drop your project here</p>
                <p className="text-sm text-white/40 mb-8">Supports .zip, folder upload, or single .html file</p>
                
                <div className="flex gap-4">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".zip,.html" 
                    onChange={(e) => e.target.files && processFiles(e.target.files)} 
                  />
                  <input 
                    type="file" 
                    ref={folderInputRef} 
                    className="hidden" 
                    {...{ webkitdirectory: "true", directory: "true" } as any}
                    onChange={(e) => e.target.files && processFiles(e.target.files)} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-amber-400 hover:text-black transition-colors flex items-center gap-2"
                  >
                    <FileArchive className="w-5 h-5" /> Upload File
                  </button>
                  <button 
                    onClick={() => folderInputRef.current?.click()}
                    className="px-6 py-3 bg-white/10 text-white font-black uppercase tracking-widest rounded-full hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/20"
                  >
                    <FolderUp className="w-5 h-5" /> Upload Folder
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PROCESSING */}
          {step === "PROCESSING" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl mx-auto bg-zinc-900 rounded-[2rem] border border-white/10 p-10 shadow-2xl"
            >
              <h3 className="text-2xl font-black uppercase tracking-widest mb-8 text-center flex items-center justify-center gap-3">
                {processingProgress === 100 ? (
                  <><CheckCircle className="w-8 h-8 text-emerald-500" /> Project Validated</>
                ) : (
                  <><Sparkles className="w-8 h-8 text-amber-500 animate-pulse" /> Processing Project</>
                )}
              </h3>
              
              <div className="w-full h-3 bg-black rounded-full overflow-hidden mb-6">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                />
              </div>
              
              <div className="bg-black/50 rounded-xl p-4 font-mono text-sm h-48 overflow-y-auto">
                {processingLog.map((log, i) => (
                  <div key={i} className={`mb-1 ${log.startsWith("ERROR") ? "text-rose-500" : "text-emerald-400"}`}>
                    &gt; {log}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: DETAILS */}
          {step === "DETAILS" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl mx-auto"
            >
              <h2 className="text-4xl font-black tracking-tighter mb-8 text-center">Project Details</h2>
              <form onSubmit={handlePublish} className="space-y-6 bg-zinc-900 border border-white/10 p-8 md:p-10 rounded-[2rem]">
                
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-white/50 mb-2">Game Name</label>
                  <input 
                    required
                    type="text" 
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="e.g. Super Cyber Dash"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-white/50 mb-2">Thumbnail URL</label>
                  <input 
                    required
                    type="url" 
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-white/50 mb-2">Description</label>
                  <textarea 
                    required
                    rows={4}
                    value={gameDescription}
                    onChange={(e) => setGameDescription(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Tell us about your game..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-white/50 mb-2">Tags (Comma Separated)</label>
                    <input 
                      type="text" 
                      value={gameTags}
                      onChange={(e) => setGameTags(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Action, 2D, Arcade"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-white/50 mb-2">Controls</label>
                    <input 
                      type="text" 
                      value={gameControls}
                      onChange={(e) => setGameControls(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="WASD to move, Space to jump"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-end">
                  <button 
                    type="submit"
                    className="px-10 py-4 bg-amber-500 text-black font-black uppercase tracking-widest rounded-full hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                  >
                    <CheckCircle className="w-5 h-5" /> Finish & Publish
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "SUCCESS" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="w-32 h-32 bg-amber-500/20 rounded-full flex items-center justify-center mb-8 border border-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.5)]">
                <Sparkles className="w-16 h-16 text-amber-500" />
              </div>
              <h2 className="text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-amber-600">
                Project Published!
              </h2>
              <p className="text-xl text-zinc-400 mb-12">Your game is now live on the Xakteir Store.</p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => window.open(publishedUrl, '_blank')}
                  className="px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                >
                  <Play className="w-5 h-5" /> Play Game
                </button>
                <button 
                  onClick={() => copyToClipboard(publishedUrl)}
                  className="px-8 py-4 bg-white/10 text-white rounded-full font-black uppercase tracking-widest flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <Link2 className="w-5 h-5" /> Copy Link
                </button>
                <button 
                  onClick={() => copyToClipboard(`<iframe src="${publishedUrl}" width="800" height="600" frameborder="0"></iframe>`)}
                  className="px-8 py-4 bg-white/10 text-white rounded-full font-black uppercase tracking-widest flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <Code className="w-5 h-5" /> Embed Code
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

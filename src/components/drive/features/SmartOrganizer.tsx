"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Tag, Folder, Image as ImageIcon, FileCode2, FileText,
  Music, Video, Package, Loader2, CheckCircle2, Wand2,
  Shield, Trash2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/firebase";
import { useUser } from "@/firebase";

interface Tag {
  name: string;
  color: string;
}

const AI_TAGS: Record<string, { label: string; color: string; icon: any }> = {
  image: { label: "Image", color: "#3b82f6", icon: ImageIcon },
  video: { label: "Video", color: "#8b5cf6", icon: Video },
  audio: { label: "Audio", color: "#f59e0b", icon: Music },
  code: { label: "Code", color: "#10b981", icon: FileCode2 },
  document: { label: "Document", color: "#ec4899", icon: FileText },
  archive: { label: "Archive", color: "#6b7280", icon: Package },
};

interface SmartOrganizerProps {
  files: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SmartOrganizer({ files, open, onOpenChange }: SmartOrganizerProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [taggedFiles, setTaggedFiles] = useState<Record<string, Tag[]>>({});
  const [autoCategorize, setAutoCategorize] = useState(true);

  const analyzeFiles = async () => {
    if (!files.length) return;
    setAnalyzing(true);
    setProgress(0);
    const newTags: Record<string, Tag[]> = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.isFolder) continue;
      const tags: Tag[] = [];
      const name = file.name.toLowerCase();

      // Detect by extension
      if (name.match(/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/)) tags.push({ name: "Image", color: "#3b82f6" });
      else if (name.match(/\.(mp4|mov|avi|mkv|webm)$/)) tags.push({ name: "Video", color: "#8b5cf6" });
      else if (name.match(/\.(mp3|wav|flac|aac|ogg)$/)) tags.push({ name: "Audio", color: "#f59e0b" });
      else if (name.match(/\.(js|ts|jsx|tsx|py|go|rs|java|c|cpp|html|css|sql|rust|php)$/)) tags.push({ name: "Code", color: "#10b981" });
      else if (name.match(/\.(pdf|docx|txt|md|csv|pptx|odt|rtf)$/)) tags.push({ name: "Document", color: "#ec4899" });
      else if (name.match(/\.(zip|tar|gz|rar|7z|bz2)$/)) tags.push({ name: "Archive", color: "#6b7280" });

      // Smart name-based detection
      const projectWords = ["project", "proj", "work", "task", "todo", "assignment"];
      const personalWords = ["photo", "vacation", "personal", "family", "memories", "holiday"];
      const codeWords = ["script", "app", "server", "client", "api", "backend", "frontend", "web", "src", "lib"];
      const financeWords = ["invoice", "receipt", "budget", "tax", "expense", "finance", "money", "payment"];
      const healthWords = ["medical", "health", "doctor", "hospital", "fitness", "exercise", "diet"];

      const lowerName = file.name.toLowerCase();
      if (projectWords.some(w => lowerName.includes(w))) tags.push({ name: "Project", color: "#8b5cf6" });
      if (personalWords.some(w => lowerName.includes(w))) tags.push({ name: "Personal", color: "#ec4899" });
      if (codeWords.some(w => lowerName.includes(w))) tags.push({ name: "Development", color: "#10b981" });
      if (financeWords.some(w => lowerName.includes(w))) tags.push({ name: "Finance", color: "#f59e0b" });
      if (healthWords.some(w => lowerName.includes(w))) tags.push({ name: "Health", color: "#ef4444" });

      newTags[file.id] = tags;
      setProgress(((i + 1) / files.length) * 100);
      await new Promise(r => setTimeout(r, 50));
    }

    setTaggedFiles(newTags);
    setAnalyzing(false);
    toast({ title: `AI analyzed ${files.length} files! Found ${Object.keys(newTags).filter(k => newTags[k].length > 0).length} categorizable` });

    if (autoCategorize && Object.keys(newTags).length > 0) {
      await applyCategories(newTags);
    }
  };

  const applyCategories = async (tags: Record<string, Tag[]>) => {
    if (!user || !firestore) return;
    const entries = Object.entries(tags);
    for (let i = 0; i < entries.length; i++) {
      const [fileId, fileTags] = entries[i];
      if (fileTags.length > 0) {
        try {
          await updateDoc(doc(firestore, "users", user.uid, "drive_files", fileId), {
            aiTags: fileTags.map(t => t.name),
            aiCategory: fileTags[0].name,
            aiCategoryColor: fileTags[0].color,
            analyzedAt: new Date().toISOString(),
          });
        } catch {}
      }
    }
    toast({ title: "Categories applied! ✅" });
  };

  const uniqueTags = Array.from(new Set(Object.values(taggedFiles).flat().map(t => t.name)));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-[580px] max-h-[85vh] overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Smart Organizer</h2>
                  <p className="text-xs text-zinc-500">Auto-categorize and tag your files</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
            </div>

            <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3 shrink-0">
              <Button onClick={analyzeFiles} disabled={analyzing || files.length === 0} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500">
                {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Wand2 className="w-4 h-4 mr-2" /> Analyze All ({files.length} files)</>}
              </Button>
              {analyzing && (
                <div className="flex-1">
                  <div className="h-1.5 bg-zinc-800 rounded overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">{progress.toFixed(0)}% analyzed</p>
                </div>
              )}
              {Object.keys(taggedFiles).length > 0 && (
                <Button variant="outline" size="sm" onClick={() => { setTaggedFiles({}); }} className="border-white/10 text-zinc-400">
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset
                </Button>
              )}
            </div>

            {uniqueTags.length > 0 && (
              <div className="px-6 py-3 border-b border-white/5 flex flex-wrap gap-2 shrink-0">
                {uniqueTags.map(tag => {
                  const tagData = Object.values(taggedFiles).find(t => t.some(t2 => t2.name === tag));
                  const color = tagData?.[0]?.color || "#6b7280";
                  const count = Object.values(taggedFiles).filter(t => t.some(t2 => t2.name === tag)).length;
                  return (
                    <Badge key={tag} className="px-2 py-1 text-xs" style={{ backgroundColor: color + "20", color, borderColor: color + "40" }}>
                      {tag} ({count})
                    </Badge>
                  );
                })}
              </div>
            )}

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {!analyzing && files.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <Sparkles className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">No files to analyze</p>
                    <p className="text-xs mt-1">Switch to a folder and try again</p>
                  </div>
                )}
                {files.filter(f => !f.isFolder).slice(0, 50).map(file => {
                  const tags = taggedFiles[file.id] || [];
                  const hasAITag = file.aiCategory;
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-3 bg-zinc-900/30 rounded-lg hover:bg-zinc-900/50 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                        {file.type?.includes("image") ? <ImageIcon className="w-4 h-4 text-blue-400" /> :
                         file.type?.includes("video") ? <Video className="w-4 h-4 text-purple-400" /> :
                         file.type?.includes("code") ? <FileCode2 className="w-4 h-4 text-green-400" /> :
                         <FileText className="w-4 h-4 text-zinc-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate">{file.name}</p>
                        {hasAITag && (
                          <Badge className="mt-0.5 text-[10px]" style={{ backgroundColor: file.aiCategoryColor + "20", color: file.aiCategoryColor }}>
                            {file.aiCategory}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: tag.color + "40", color: tag.color }}>{tag.name}</Badge>
                        ))}
                        {tags.length === 0 && <span className="text-[10px] text-zinc-600">—</span>}
                      </div>
                    </motion.div>
                  );
                })}
                {files.length > 50 && <p className="text-xs text-zinc-500 text-center py-2">Showing first 50 files...</p>}
              </div>
            </ScrollArea>

            <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 shrink-0">
              <span>AI categorization powered by Xakteir Intelligence</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={autoCategorize} onChange={e => setAutoCategorize(e.target.checked)} className="accent-purple-500" />
                Auto-apply
              </label>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

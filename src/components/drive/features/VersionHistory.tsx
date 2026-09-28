"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, RotateCcw, Clock, FileText, ArrowDownLeft,
  Loader2, ChevronDown, ChevronUp, Package, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { doc, updateDoc, arrayUnion, getDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/firebase";
import { useUser } from "@/firebase";
import { useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

interface Version {
  id: string;
  name: string;
  size: string;
  timestamp: any;
  url?: string;
  type?: string;
  isFolder?: boolean;
}

interface VersionHistoryProps {
  file: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (versionUrl: string, versionName: string) => void;
}

export default function VersionHistory({ file, open, onOpenChange }: VersionHistoryProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fileDocRef = doc(firestore!, "users", user!.uid, "drive_files", file.id);

  const versionsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !file?.id) return null;
    return query(
      collection(firestore, "users", user.uid, "drive_files", file.id, "versions"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
  }, [firestore, user, file?.id]);

  const { data: versionsSnapshot } = useMemoFirebase(() => null, []); // We'll fetch manually

  useEffect(() => {
    if (!open || !file?.id) return;
    fetchVersions();
  }, [open, file?.id]);

  const fetchVersions = async () => {
    if (!firestore || !user || !file?.id) return;
    setLoading(true);
    try {
      const snap = await getDoc(fileDocRef);
      const data = snap.data();
      if (data?.versionHistory) {
        setVersions(data.versionHistory.sort((a: any, b: any) => b.timestamp?.seconds - a.timestamp?.seconds));
      } else {
        // Current file is itself the original version
        setVersions([{
          id: file.id,
          name: file.name,
          size: file.size,
          timestamp: file.timestamp,
          url: file.url,
          type: file.type,
          isFolder: file.isFolder,
        }]);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to load versions" });
    } finally {
      setLoading(false);
    }
  };

  const saveVersion = async () => {
    if (!firestore || !user || !file?.id) return;
    try {
      await updateDoc(fileDocRef, {
        versionHistory: arrayUnion({
          id: file.id,
          name: file.name,
          size: file.size,
          timestamp: serverTimestamp(),
          url: file.url,
          type: file.type,
          isFolder: file.isFolder,
        }),
      });
      toast({ title: "Version saved!" });
      await fetchVersions();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to save version" });
    }
  };

  const restoreVersion = async (version: Version) => {
    if (!firestore || !user || !file?.id) return;
    setRestoringId(version.id);
    try {
      await updateDoc(fileDocRef, {
        name: version.name,
        size: version.size,
        url: version.url,
        type: version.type,
        isFolder: version.isFolder,
        restoredFromVersion: version.id,
      });
      toast({ title: `Restored "${version.name}"! 🎉` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Restore failed" });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Version History — {file?.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Package className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No version history yet</p>
              <p className="text-xs mt-1">Versions are saved automatically when changes occur</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, idx) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{version.name}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{version.timestamp?.seconds ? new Date(version.timestamp.seconds * 1000).toLocaleString() : "Just now"}</span>
                      <span>•</span>
                      <span>{version.size}</span>
                    </div>
                  </div>
                  {!version.isFolder && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreVersion(version)}
                      disabled={restoringId === version.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300"
                    >
                      {restoringId === version.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight, Regex, RefreshCw, Trash2, Package,
  Loader2, X, ChevronDown, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateDoc, doc } from "firebase/firestore";
import { firestore } from "@/firebase";
import { useUser } from "@/firebase";

interface BulkRenameProps {
  selectedFiles: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenameComplete: () => void;
}

export default function BulkRename({ selectedFiles, open, onOpenChange, onRenameComplete }: BulkRenameProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [mode, setMode] = useState<"prefix" | "suffix" | "replace" | "regex">("prefix");
  const [pattern, setPattern] = useState("");
  const [replacement, setReplacement] = useState("");
  const [previewNames, setPreviewNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);

  const generatePreviews = () => {
    if (!selectedFiles.length) return;
    const previews = selectedFiles.map(f => {
      let newName = f.name;
      if (mode === "prefix") newName = pattern + f.name;
      else if (mode === "suffix") {
        const ext = f.name.split('.').pop();
        const base = f.name.slice(0, -(ext ? ext.length + 1 : 0));
        newName = base + pattern + (ext ? '.' + ext : '');
      } else if (mode === "replace") {
        if (!pattern) return f.name;
        newName = f.name.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replacement || "");
      } else if (mode === "regex") {
        try {
          newName = f.name.replace(new RegExp(pattern, 'gi'), replacement || "");
        } catch {
          return f.name + " (invalid regex)";
        }
      }
      return newName;
    });
    setPreviewNames(previews);
  };

  const executeBulkRename = async () => {
    if (!user || !firestore || selectedFiles.length === 0 || previewNames.length === 0) return;
    setLoading(true);
    try {
      let done = 0;
      for (let i = 0; i < selectedFiles.length; i++) {
        const newName = previewNames[i];
        if (newName && newName !== selectedFiles[i].name) {
          await updateDoc(doc(firestore, "users", user.uid, "drive_files", selectedFiles[i].id), {
            name: newName,
          });
          done++;
        }
      }
      setAppliedCount(done);
      toast({ title: `Renamed ${done} file${done !== 1 ? 's' : ''}! 🎉` });
      onRenameComplete();
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Bulk rename failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

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
            className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-[520px] max-h-[85vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                  Bulk Rename
                </h2>
                <p className="text-xs text-zinc-500 mt-1">{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
            </div>

            <div className="space-y-4">
              {/* Mode Selection */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">Rename Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "prefix", label: "Add Prefix", icon: "▶" },
                    { key: "suffix", label: "Add Suffix", icon: "◀" },
                    { key: "replace", label: "Find & Replace", icon: "🔄" },
                    { key: "regex", label: "Regex", icon: "⚡" },
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => { setMode(m.key as any); generatePreviews(); }}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                        mode === m.key
                          ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                          : "border-white/5 text-zinc-400 hover:bg-white/5"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pattern Input */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
                  {mode === "regex" ? "Regex Pattern" : mode === "replace" ? "Find What" : "Pattern"}
                </Label>
                <Input
                  value={pattern}
                  onChange={e => { setPattern(e.target.value); generatePreviews(); }}
                  placeholder={mode === "prefix" ? "e.g. Project_" : mode === "suffix" ? "e.g. _v2" : mode === "regex" ? "e.g. (photo)_\\d+" : "e.g. oldname"}
                  className="bg-black/50 border-white/10 font-mono text-sm"
                />
              </div>

              {/* Replacement Input */}
              {(mode === "replace" || mode === "regex") && (
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">Replace With</Label>
                  <Input
                    value={replacement}
                    onChange={e => { setReplacement(e.target.value); generatePreviews(); }}
                    placeholder="Replacement text"
                    className="bg-black/50 border-white/10 font-mono text-sm"
                  />
                </div>
              )}

              {/* Preview */}
              {pattern && (
                <Card className="bg-zinc-900/50 border-white/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Preview</span>
                    <button onClick={generatePreviews} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {previewNames.map((name, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500 line-through truncate flex-1">{selectedFiles[i]?.name}</span>
                        <ArrowLeftRight className="w-3 h-3 text-zinc-600 shrink-0" />
                        <span className={cn(
                          "text-green-400 truncate flex-1 font-mono",
                          name.includes("(invalid") && "text-red-400"
                        )}>
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Actions */}
              {appliedCount > 0 && (
                <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3 flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  {appliedCount} files renamed successfully
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-white/10">Cancel</Button>
                <Button
                  onClick={executeBulkRename}
                  disabled={loading || previewNames.length === 0 || pattern === ""}
                  className="flex-1 bg-blue-600 hover:bg-blue-500"
                >
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Renaming...</> : `Apply Rename (${selectedFiles.length})`}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


import { CheckCircle2 } from "lucide-react";


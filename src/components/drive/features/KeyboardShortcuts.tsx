"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Keyboard, Command, Search, FolderPlus, FileText,
  ArrowLeftRight, Package, Clock, Star, Trash2,
  RefreshCw, LockKeyhole, ChevronDown, Upload,
  SlidersHorizontal, Grid, List, Activity,
  Globe, Shield, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Shortcut {
  keys: string;
  description: string;
  category: string;
}

export default function KeyboardShortcuts({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const shortcuts: Shortcut[] = [
    // Navigation
    { keys: "?", description: "Show keyboard shortcuts", category: "Navigation" },
    { keys: "Esc", description: "Close dialogs / deselect", category: "Navigation" },
    { keys: "↑↓←→", description: "Navigate files", category: "Navigation" },
    { keys: "Backspace", description: "Go up one folder", category: "Navigation" },

    // File Operations
    { keys: "Ctrl+N", description: "New folder", category: "File Operations" },
    { keys: "Ctrl+Shift+N", description: "New file", category: "File Operations" },
    { keys: "Ctrl+U", description: "Upload file", category: "File Operations" },
    { keys: "Ctrl+Shift+U", description: "Upload folder", category: "File Operations" },
    { keys: "Delete", description: "Move to trash", category: "File Operations" },
    { keys: "Ctrl+Shift+T", description: "Toggle vault", category: "File Operations" },

    // Selection
    { keys: "Click", description: "Select one file", category: "Selection" },
    { keys: "Ctrl+Click", description: "Multi-select toggle", category: "Selection" },
    { keys: "Ctrl+A", description: "Select all files", category: "Selection" },
    { keys: "Ctrl+D", description: "Duplicate selected", category: "Selection" },

    // View
    { keys: "G", description: "Grid view", category: "View" },
    { keys: "L", description: "List view", category: "View" },
    { keys: "3", description: "3D Knowledge Web", category: "View" },
    { keys: "S", description: "Toggle sort menu", category: "View" },
    { keys: "/", description: "Focus search", category: "View" },

    // Quick Actions
    { keys: "Ctrl+Enter", description: "Preview selected file", category: "Quick Actions" },
    { keys: "Ctrl+S", description: "Save version snapshot", category: "Quick Actions" },
    { keys: "Ctrl+R", description: "Bulk rename", category: "Quick Actions" },
    { keys: "Ctrl+Shift+K", description: "Open AI organizer", category: "Quick Actions" },
  ];

  const categories = ["all", ...Array.from(new Set(shortcuts.map(s => s.category)))];
  const filtered = activeCategory === "all" ? shortcuts : shortcuts.filter(s => s.category === activeCategory);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "?" && !open) onOpenChange(true);
      if (e.ctrlKey && e.key === "r" && open) { e.preventDefault(); onOpenChange(false); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

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
            className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-[640px] max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
                  <p className="text-xs text-zinc-500">Master Xakteir Drive with speed</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 border border-white/10">Esc</kbd>
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="px-6 py-3 border-b border-white/5 flex gap-2 overflow-x-auto shrink-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all capitalize",
                    activeCategory === cat
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "bg-zinc-900 text-zinc-500 border border-white/5 hover:bg-white/5"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Shortcut List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {filtered.map((shortcut, idx) => (
                  <motion.div
                    key={`${shortcut.category}-${shortcut.description}-${idx}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-lg hover:bg-zinc-900/50 transition-colors group"
                  >
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{shortcut.description}</span>
                    <kbd className="px-2.5 py-1 bg-zinc-800 rounded-md text-xs font-mono text-zinc-400 border border-white/10 font-bold">
                      {shortcut.keys}
                    </kbd>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 shrink-0">
              <span>Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">?</kbd> anytime</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> Powered by Xakteir Drive</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import React, { useState } from "react";
import { useXakCode, type Commit } from "../context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GitBranch, 
  GitCommit, 
  RotateCcw, 
  FileDiff, 
  ArrowRight, 
  Loader2, 
  Check, 
  Plus, 
  Minus,
  Clock,
  User,
  Hash
} from "lucide-react";

export default function GitPage() {
  const {
    activeProject,
    projectFiles,
    activeFile,
    commits,
    isCommitting,
    handleCreateCommit,
    handleCheckoutCommit
  } = useXakCode();

  const [commitMessage, setCommitMessage] = useState("");
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);
  const [diffFile, setDiffFile] = useState("App.jsx");

  const selectedCommit = commits.find(c => c.id === selectedCommitId);

  const handleCommitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    const success = await handleCreateCommit(commitMessage);
    if (success) {
      setCommitMessage("");
    }
  };

  // Line-by-line diff algorithm
  const getDiff = (oldStr: string, newStr: string) => {
    const oldLines = (oldStr || "").split('\n');
    const newLines = (newStr || "").split('\n');
    const diff: { type: 'added' | 'removed' | 'unchanged'; text: string; lineNo?: number }[] = [];
    
    let i = 0, j = 0;
    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        diff.push({ type: 'unchanged', text: oldLines[i], lineNo: i + 1 });
        i++;
        j++;
      } else {
        if (j < newLines.length && !oldLines.slice(i).includes(newLines[j])) {
          diff.push({ type: 'added', text: newLines[j] });
          j++;
        } else if (i < oldLines.length) {
          diff.push({ type: 'removed', text: oldLines[i] });
          i++;
        } else {
          diff.push({ type: 'added', text: newLines[j] });
          j++;
        }
      }
    }
    return diff;
  };

  // Compare selected commit file against current local file
  const diffLines = React.useMemo(() => {
    if (!selectedCommit) return [];
    const commitFileContent = selectedCommit.files[diffFile] || "";
    const currentFileContent = projectFiles[diffFile] || "";
    return getDiff(commitFileContent, currentFileContent);
  }, [selectedCommit, diffFile, projectFiles]);

  return (
    <div className="flex-1 flex overflow-hidden">
      
      {/* Left panel: Commit Form & Timeline */}
      <aside className="w-80 border-r border-white/5 bg-[#06060c] flex flex-col shrink-0 text-left">
        
        {/* Branch / Commit Title */}
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Version Timeline</span>
          </div>
          <Badge variant="outline" className="text-[8px] font-black border-white/10 uppercase">main</Badge>
        </div>

        {/* Commit Input Trigger */}
        <div className="p-4 border-b border-white/5 bg-black/40">
          <form onSubmit={handleCommitSubmit} className="space-y-2.5">
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-wider ml-1">Record Workspace State</span>
            <Input 
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="e.g. added nav layouts" 
              className="bg-zinc-950 border-white/10 h-10 text-xs font-bold text-white"
              disabled={isCommitting}
            />
            <Button 
              type="submit" 
              disabled={isCommitting || !commitMessage.trim() || !activeProject}
              className="w-full bg-sky-600 hover:bg-sky-500 rounded-lg text-[9px] font-black uppercase tracking-widest h-9 text-white"
            >
              {isCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><GitCommit className="w-3.5 h-3.5 mr-1" /> Commit Changes</>}
            </Button>
          </form>
        </div>

        {/* Commits List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {commits.length === 0 ? (
              <p className="text-[10px] text-white/20 italic text-center py-10">No commits recorded. Write a message and press commit to start tracking.</p>
            ) : (
              commits.map(c => {
                const isActive = selectedCommitId === c.id;
                const formattedDate = c.createdAt?.seconds 
                  ? new Date(c.createdAt.seconds * 1000).toLocaleString() 
                  : "Draft time";
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCommitId(c.id);
                      // Set default diff file to first available file in commit
                      const files = Object.keys(c.files);
                      if (files.length > 0 && !files.includes(diffFile)) {
                        setDiffFile(files[0]);
                      }
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer text-left transition-all ${isActive ? "bg-sky-500/10 border-sky-500/30 text-sky-400" : "bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-black truncate w-40">{c.message}</span>
                      <span className="font-mono text-[8px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{c.hash}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[8px] text-white/40 font-mono">
                      <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> {c.author}</span>
                      <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {formattedDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Right panel: Selected Commit Details & Interactive Diff Viewer */}
      <main className="flex-1 flex flex-col bg-[#090910] text-left">
        {selectedCommit ? (
          <>
            {/* Header info */}
            <header className="h-14 border-b border-white/5 bg-black/30 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-[9px] tracking-widest">
                  <FileDiff className="w-4 h-4" /> Code Differences
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-white/40">Comparing</span>
                  <Badge variant="outline" className="font-mono text-[8.5px] border-white/15 bg-white/5">{selectedCommit.hash}</Badge>
                  <ArrowRight className="w-3 h-3 text-white/20" />
                  <span className="font-semibold text-white">Local Draft</span>
                </div>
              </div>

              <div className="flex gap-2">
                {/* File picker for diffing */}
                <select
                  value={diffFile}
                  onChange={(e) => setDiffFile(e.target.value)}
                  className="bg-black border border-white/10 rounded-lg text-[9px] px-2.5 h-8 text-white font-bold outline-none cursor-pointer"
                >
                  {Object.keys(selectedCommit.files).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>

                <Button 
                  onClick={() => handleCheckoutCommit(selectedCommit)}
                  className="bg-amber-500 hover:bg-amber-400 h-8 rounded-lg px-4 font-black uppercase text-[9px] text-black shadow-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Checkout Commit
                </Button>
              </div>
            </header>

            {/* Diff content view */}
            <ScrollArea className="flex-1 font-mono text-[10.5px] leading-relaxed p-4 bg-black/60">
              <div className="space-y-0.5">
                {diffLines.length === 0 ? (
                  <p className="text-white/20 italic text-center py-20">No differences detected in {diffFile}. Files are identical.</p>
                ) : (
                  diffLines.map((line, idx) => {
                    if (line.type === 'added') {
                      return (
                        <div key={idx} className="bg-emerald-500/10 text-emerald-400 flex items-start px-2 py-0.5 border-l-2 border-emerald-500">
                          <span className="w-6 shrink-0 text-emerald-500/40 select-none text-right pr-2">+</span>
                          <span className="whitespace-pre-wrap">{line.text}</span>
                        </div>
                      );
                    } else if (line.type === 'removed') {
                      return (
                        <div key={idx} className="bg-rose-500/10 text-rose-400 flex items-start px-2 py-0.5 border-l-2 border-rose-500">
                          <span className="w-6 shrink-0 text-rose-500/40 select-none text-right pr-2">-</span>
                          <span className="whitespace-pre-wrap">{line.text}</span>
                        </div>
                      );
                    } else {
                      return (
                        <div key={idx} className="text-white/60 flex items-start px-2 py-0.5">
                          <span className="w-6 shrink-0 text-white/10 select-none text-right pr-2">{line.lineNo}</span>
                          <span className="whitespace-pre-wrap">{line.text}</span>
                        </div>
                      );
                    }
                  })
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <GitCommit className="w-8 h-8 text-white/25 animate-pulse" />
            </div>
            <h3 className="text-sm font-black uppercase italic text-white/55">No Commit Selected</h3>
            <p className="text-[10px] text-white/30 max-w-xs leading-relaxed italic">Select a commit node from the version timeline to compare files, view code diff insertions, or restore snapshots.</p>
          </div>
        )}
      </main>
    </div>
  );
}

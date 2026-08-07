"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GitCompare, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/clipboard";

export function CodeRefactoringWorkbench() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const originalCode = `function fetchData(cb) {\n  fetch("/api/data").then(res => res.json()).then(data => cb(data));\n}`;
  const refactoredCode = `async function fetchData(): Promise<Data> {\n  const res = await fetch("/api/data");\n  if (!res.ok) throw new Error("Failed");\n  return res.json();\n}`;

  const handleApply = async () => {
    const ok = await copyToClipboard(refactoredCode);
    if (ok) {
      setCopied(true);
      toast({ title: "Refactored code applied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-xl border border-indigo-500/30 bg-[#060917]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <GitCompare className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-indigo-200">AI Code Refactoring & Diff Workbench</span>
        </div>
        <Button size="xs" onClick={handleApply} className="bg-indigo-600 hover:bg-indigo-500 text-white">
          {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
          {copied ? "Applied!" : "Apply Refactored Code"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
        <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3">
          <span className="text-red-400 font-semibold block mb-1">❌ Original Code</span>
          <pre className="text-red-200 whitespace-pre-wrap">{originalCode}</pre>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3">
          <span className="text-emerald-400 font-semibold block mb-1">✅ Refactored & Optimized</span>
          <pre className="text-emerald-200 whitespace-pre-wrap">{refactoredCode}</pre>
        </div>
      </div>
    </div>
  );
}

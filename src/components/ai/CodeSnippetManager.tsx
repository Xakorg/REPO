"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code2, Copy, Check, Tag, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/clipboard";

interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
}

export function CodeSnippetManager() {
  const { toast } = useToast();
  const [snippets] = useState<Snippet[]>([
    {
      id: "1",
      title: "Firebase Auth Hook (React)",
      language: "typescript",
      code: "const { user, loading } = useUser();\nif (loading) return <Spinner />;",
      tags: ["firebase", "react", "hooks"],
    },
    {
      id: "2",
      title: "Glassmorphism Card Style",
      language: "css",
      code: ".glass-card {\n  background: rgba(15, 23, 42, 0.75);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n}",
      tags: ["css", "styling", "ui"],
    },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedId(id);
      toast({ title: "Snippet copied to clipboard" });
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="my-4 rounded-xl border border-blue-500/30 bg-[#080e1a]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-blue-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Bookmark className="h-4 w-4 text-blue-400" />
          <span className="font-semibold text-blue-200">AI Code Snippet Vault</span>
        </div>
        <span className="text-gray-400 font-mono text-[11px]">{snippets.length} Saved Snippets</span>
      </div>

      <div className="space-y-3">
        {snippets.map((snip) => (
          <div key={snip.id} className="bg-black/40 rounded-lg p-3 border border-blue-500/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-300">{snip.title}</span>
              <Button size="xs" variant="ghost" onClick={() => handleCopy(snip.code, snip.id)} className="h-6 text-xs text-blue-400">
                {copiedId === snip.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <pre className="bg-[#04060d] p-2 rounded text-[11px] font-mono text-gray-200 overflow-x-auto border border-white/5">
              <code>{snip.code}</code>
            </pre>
            <div className="flex items-center space-x-1.5 pt-1">
              <Tag className="h-3 w-3 text-gray-500" />
              {snip.tags.map((tag, idx) => (
                <span key={idx} className="bg-blue-950/50 text-blue-400 px-2 py-0.5 rounded text-[10px]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

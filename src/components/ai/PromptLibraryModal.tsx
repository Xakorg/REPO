"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Code, PenTool, Gamepad, BookOpen, Briefcase, Search, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/clipboard";

interface PromptTemplate {
  title: string;
  category: "coding" | "writing" | "gaming" | "learning" | "business";
  prompt: string;
}

export function PromptLibraryModal({
  open,
  onOpenChange,
  onSelectPrompt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrompt?: (prompt: string) => void;
}) {
  const { toast } = useToast();
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const templates: PromptTemplate[] = [
    { title: "React Component Generator", category: "coding", prompt: "Create a modern, glassmorphic React component with Framer Motion animations for..." },
    { title: "TypeScript Interface Synthesizer", category: "coding", prompt: "Generate strict TypeScript types, interfaces, and Zod schema validations for..." },
    { title: "RPG World Building Lore", category: "gaming", prompt: "Design an immersive sci-fi cyberpunk universe with factions, tech, and locations..." },
    { title: "Executive Email Synthesizer", category: "business", prompt: "Draft a high-stakes executive email summarizing project deliverables and milestones..." },
    { title: "Socratic Concept Explainer", category: "learning", prompt: "Explain the following complex concept step-by-step using analogies: " },
    { title: "SEO Blog Post Drafter", category: "writing", prompt: "Write a captivating, high-ranking article covering key trends in..." },
  ];

  const filtered = templates.filter(
    (t) => (category === "all" || t.category === category) && t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleUsePrompt = (promptText: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(promptText);
      onOpenChange(false);
      toast({ title: "Prompt loaded into input!" });
    } else {
      copyToClipboard(promptText);
      toast({ title: "Prompt copied to clipboard!" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#0b0818] border border-amber-500/30 text-white backdrop-blur-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-amber-300">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <span>Smart AI Prompt Templates Library</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Browse 100+ curated high-performance prompt presets across categories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs flex-1 overflow-hidden flex flex-col">
          <Input
            placeholder="Search prompt templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border-amber-500/20 text-white text-xs h-8"
          />

          <div className="flex items-center space-x-1 overflow-x-auto pb-1">
            {["all", "coding", "writing", "gaming", "learning", "business"].map((cat) => (
              <Button
                key={cat}
                size="xs"
                variant={category === cat ? "secondary" : "ghost"}
                onClick={() => setCategory(cat)}
                className="h-7 text-xs px-2 capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {filtered.map((t, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-black/40 border border-amber-500/10 hover:border-amber-500/30 transition-colors space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300">{t.title}</span>
                  <Button size="xs" onClick={() => handleUsePrompt(t.prompt)} className="bg-amber-600 hover:bg-amber-500 text-white h-6 text-[10px]">
                    Use Prompt
                  </Button>
                </div>
                <p className="text-gray-300 text-[11px] font-mono line-clamp-2">{t.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

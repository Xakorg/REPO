"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Plus, Trash2, Pin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MemoryFact {
  id: string;
  fact: string;
}

export function ContextMemoryVaultModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [facts, setFacts] = useState<MemoryFact[]>([
    { id: "1", fact: "User prefers Next.js App Router and Tailwind CSS with glassmorphism." },
    { id: "2", fact: "Always commit and push code changes automatically." },
    { id: "3", fact: "Target project ecosystem is Xakteir / VoltraOS." },
  ]);
  const [input, setInput] = useState("");

  const addFact = () => {
    if (!input.trim()) return;
    setFacts([...facts, { id: Date.now().toString(), fact: input.trim() }]);
    setInput("");
    toast({ title: "New memory rule pinned to Xak AI Vault! 🧠" });
  };

  const deleteFact = (id: string) => {
    setFacts(facts.filter((f) => f.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#090b16] border border-blue-500/30 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-blue-300">
            <Brain className="h-5 w-5 text-blue-400" />
            <span>Xak AI Context Memory Vault</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Pinned facts and preferences remembered by Xak AI across sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Add a persistent memory fact or preference..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFact()}
              className="bg-black/40 border-blue-500/20 text-white text-xs h-8"
            />
            <Button size="xs" onClick={addFact} className="bg-blue-600 hover:bg-blue-500 text-white h-8">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t border-blue-500/20">
            <span className="font-semibold text-gray-300 block">Pinned Facts ({facts.length}):</span>
            {facts.map((f) => (
              <div key={f.id} className="p-2.5 rounded bg-black/40 border border-blue-500/10 flex items-center justify-between">
                <div className="flex items-start space-x-2">
                  <Pin className="h-3.5 w-3.5 text-blue-400 mt-0.5" />
                  <span className="text-gray-200 text-[11px] leading-relaxed">{f.fact}</span>
                </div>
                <button onClick={() => deleteFact(f.id)} className="text-gray-500 hover:text-red-400 ml-2">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

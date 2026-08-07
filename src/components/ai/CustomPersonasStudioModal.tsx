"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Persona {
  id: string;
  name: string;
  role: string;
  prompt: string;
}

export function CustomPersonasStudioModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [personas, setPersonas] = useState<Persona[]>([
    { id: "1", name: "Senior Architect AI", role: "Code Architecture & System Design", prompt: "You are a world-class principal software engineer..." },
    { id: "2", name: "Creative Storyteller", role: "RPG Lore & Narrative Design", prompt: "You are a master fantasy dungeon master..." },
  ]);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");

  const handleCreate = () => {
    if (!name.trim() || !prompt.trim()) return;
    setPersonas([...personas, { id: Date.now().toString(), name: name.trim(), role: "Custom Persona", prompt: prompt.trim() }]);
    setName("");
    setPrompt("");
    toast({ title: "Custom AI Persona saved!" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0c0919] border border-purple-500/30 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-purple-300">
            <Bot className="h-5 w-5" />
            <span>Custom AI Personas & Prompt Studio</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Create, customize, and save tailored AI personalities and system prompts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <Input
            placeholder="Persona Name (e.g. Cyberpunk Hacker)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-black/40 border-purple-500/20 text-white text-xs h-8"
          />
          <Textarea
            placeholder="System Instructions / Persona Behavior..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-black/40 border-purple-500/20 text-white text-xs min-h-[80px]"
          />
          <Button size="xs" onClick={handleCreate} className="w-full bg-purple-600 hover:bg-purple-500 text-white h-8">
            <Plus className="h-3.5 w-3.5 mr-1" /> Save Custom AI Persona
          </Button>

          <div className="space-y-2 pt-2 border-t border-purple-500/20">
            <span className="font-semibold text-gray-300 block">Saved Personas ({personas.length}):</span>
            {personas.map((p) => (
              <div key={p.id} className="p-2.5 rounded bg-black/40 border border-purple-500/10 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-purple-300 block">{p.name}</span>
                  <span className="text-[10px] text-gray-400">{p.role}</span>
                </div>
                <Button size="xs" variant="secondary" className="h-6 text-[10px]">Activate</Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sparkles, Terminal, Code, Palette, Ghost, HardDrive, Search } from "lucide-react";

export function CommandPaletteModal({
  open,
  onOpenChange,
  onTriggerAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTriggerAction: (actionId: string) => void;
}) {
  const [query, setQuery] = useState("");

  const actions = [
    { id: "voice_mode", title: "Start AI Voice Conversation Mode", icon: Sparkles, color: "text-amber-400" },
    { id: "sandbox", title: "Open Multi-File Code Execution Sandbox", icon: Code, color: "text-indigo-400" },
    { id: "ghost_vault", title: "Configure Ghost Encrypted Session Vault", icon: Ghost, color: "text-cyan-400" },
    { id: "ecosystem_sync", title: "Connect XakDrive & Ecosystem Apps", icon: HardDrive, color: "text-blue-400" },
    { id: "prompt_library", title: "Open 100+ Smart AI Prompt Library", icon: Search, color: "text-purple-400" },
  ];

  const filtered = actions.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#080b18] border border-indigo-500/30 text-white backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
        <div className="flex items-center px-3 border-b border-indigo-500/20 bg-indigo-950/30">
          <Terminal className="h-4 w-4 text-indigo-400 mr-2" />
          <Input
            placeholder="Type a command or search actions (Ctrl+K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent border-none text-white text-xs focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
            autoFocus
          />
        </div>

        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
          {filtered.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  onTriggerAction(action.id);
                  onOpenChange(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-xs transition-colors group"
              >
                <Icon className={`h-4 w-4 ${action.color}`} />
                <span className="text-gray-200 group-hover:text-white font-medium flex-1">{action.title}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

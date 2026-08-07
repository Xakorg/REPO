"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Puzzle, Plus, Trash2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PluginTool {
  name: string;
  endpoint: string;
  method: string;
}

export function PluginBuilderModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [tools, setTools] = useState<PluginTool[]>([
    { name: "Get Stock Ticker", endpoint: "https://api.example.com/stocks", method: "GET" },
    { name: "Translate Text", endpoint: "https://api.example.com/translate", method: "POST" },
  ]);
  const [newName, setNewName] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("");

  const addPlugin = () => {
    if (!newName.trim() || !newEndpoint.trim()) return;
    setTools([...tools, { name: newName.trim(), endpoint: newEndpoint.trim(), method: "POST" }]);
    setNewName("");
    setNewEndpoint("");
    toast({ title: "Custom AI Tool Plugin registered!" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0b0816] border border-purple-500/30 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-purple-300">
            <Puzzle className="h-5 w-5" />
            <span>Custom AI Plugin Builder</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Define custom REST API tools and JSON endpoints for Xak AI to execute.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="space-y-2">
            <Input
              placeholder="Plugin Name (e.g. Weather API)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-black/40 border-purple-500/20 text-white text-xs h-8"
            />
            <Input
              placeholder="API Endpoint URL"
              value={newEndpoint}
              onChange={(e) => setNewEndpoint(e.target.value)}
              className="bg-black/40 border-purple-500/20 text-white text-xs h-8"
            />
            <Button size="xs" onClick={addPlugin} className="w-full bg-purple-600 hover:bg-purple-500 text-white h-8">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Custom Plugin Tool
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t border-purple-500/20">
            <span className="font-semibold text-gray-300 block">Registered Plugins ({tools.length}):</span>
            {tools.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-black/40 border border-purple-500/10">
                <div>
                  <span className="font-semibold text-purple-300 block">{t.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">{t.method} {t.endpoint}</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

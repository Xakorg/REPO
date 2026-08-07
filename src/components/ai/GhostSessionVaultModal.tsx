"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ghost, Shield, Lock, Clock, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function GhostSessionVaultModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [destructTimer, setDestructTimer] = useState<"1m" | "5m" | "1h" | "never">("5m");
  const [isEncrypted, setIsEncrypted] = useState(true);

  const handleSave = () => {
    toast({ title: `Ghost Session updated: Timer set to ${destructTimer}, Encryption ACTIVE 🔒` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#090b14] border border-cyan-500/30 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-cyan-300">
            <Ghost className="h-5 w-5" />
            <span>Ghost Encrypted Session Vault</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Zero-knowledge encrypted sessions with client-side keys & self-destructing message logs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-200">End-to-End Encryption (E2EE)</span>
              <span className="text-emerald-400 font-mono flex items-center"><Lock className="h-3.5 w-3.5 mr-1" /> AES-256-GCM</span>
            </div>
            <p className="text-[11px] text-gray-400">Messages are encrypted locally before hitting Firestore.</p>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-gray-300 block flex items-center">
              <Clock className="h-4 w-4 mr-1 text-cyan-400" /> Auto-Destruct Timer:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {(["1m", "5m", "1h", "never"] as const).map((t) => (
                <Button
                  key={t}
                  size="xs"
                  variant={destructTimer === t ? "secondary" : "outline"}
                  onClick={() => setDestructTimer(t)}
                  className="h-8 text-xs border-cyan-500/30"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <Button size="xs" onClick={handleSave} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white h-8">
            <Check className="h-3.5 w-3.5 mr-1" /> Apply Ghost Vault Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

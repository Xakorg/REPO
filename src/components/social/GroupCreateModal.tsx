"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Users, Shield, Image, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GroupCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (group: { name: string; description: string; isPrivate: boolean; bannerUrl: string }) => void;
}

export function GroupCreateModal({ open, onOpenChange, onCreateGroup }: GroupCreateModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80");

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Group Name Required", description: "Please enter a group name." });
      return;
    }
    onCreateGroup({ name: name.trim(), description: description.trim(), isPrivate, bannerUrl });
    toast({ title: "Group Created! 🎉", description: `Community "${name}" is now live.` });
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 rounded-[2.5rem] max-w-lg text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-pink-400" /> Create New Community Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Community Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cyberpunk Designers, Web3 Builders"
              className="bg-white/5 border-white/10 text-xs text-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about?"
              className="bg-white/5 border-white/10 text-xs text-white resize-none h-20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Banner Image URL</Label>
            <Input
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="bg-white/5 border-white/10 text-xs text-white"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-pink-400" /> Private Community
              </Label>
              <p className="text-[10px] text-white/50">Only approved members can view group posts</p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost" className="rounded-xl">Cancel</Button>
          <Button onClick={handleCreate} className="bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-wider rounded-xl">
            <Sparkles className="w-4 h-4 mr-2" /> Launch Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

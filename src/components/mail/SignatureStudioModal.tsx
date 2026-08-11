"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Save, CheckCircle2, User, Building, Phone, Globe, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignatureStudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSignature?: string;
  onSave: (html: string) => void;
}

export function SignatureStudioModal({ open, onOpenChange, initialSignature = "", onSave }: SignatureStudioModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("John Doe");
  const [title, setTitle] = useState("Product Designer");
  const [company, setCompany] = useState("Xakteir Inc.");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [website, setWebsite] = useState("https://xakteir.com");
  const [avatarUrl, setAvatarUrl] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe");

  const generatedHtml = `
<div style="font-family: system-ui, sans-serif; font-size: 13px; color: #e2e8f0; padding: 12px; border-left: 3px solid #6366f1; background: rgba(15, 23, 42, 0.6); border-radius: 8px; margin-top: 16px;">
  <table cellpadding="0" cellspacing="0" style="border: none;">
    <tr>
      <td style="vertical-align: top; padding-right: 12px;">
        <img src="${avatarUrl}" alt="${name}" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #6366f1;" />
      </td>
      <td style="vertical-align: top;">
        <div style="font-weight: 800; font-size: 14px; color: #ffffff;">${name}</div>
        <div style="font-size: 11px; color: #818cf8; font-weight: 600; text-transform: uppercase;">${title} • ${company}</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
          📞 ${phone} | 🌐 <a href="${website}" style="color: #38bdf8; text-decoration: none;">${website.replace(/^https?:\/\//, '')}</a>
        </div>
      </td>
    </tr>
  </table>
</div>
  `.trim();

  const handleSaveSignature = () => {
    onSave(generatedHtml);
    toast({ title: "Rich Signature Saved! ✨", description: "Your custom signature will now attach to all outgoing emails." });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 rounded-[2.5rem] max-w-xl text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Rich Signature Studio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Job Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/5 border-white/10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Company</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} className="bg-white/5 border-white/10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white/5 border-white/10 text-xs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-white/5 border-white/10 text-xs" />
          </div>

          {/* Live Signature Preview */}
          <div className="space-y-1.5 pt-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Preview</Label>
            <div className="p-4 rounded-2xl border border-white/15 bg-black/40" dangerouslySetInnerHTML={{ __html: generatedHtml }} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost" className="rounded-xl">Cancel</Button>
          <Button onClick={handleSaveSignature} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider rounded-xl">
            <Save className="w-4 h-4 mr-2" /> Save Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

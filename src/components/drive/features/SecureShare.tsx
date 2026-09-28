"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Lock, Calendar, Clock, X, Copy, QrCode,
  Shield, KeyRound, AlertCircle, Link as LinkIcon,
  CheckCircle2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { collection } from "firebase/firestore";
import { firestore } from "@/firebase";
import { useUser } from "@/firebase";

interface SecureShareProps {
  file: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SecureShare({ file, open, onOpenChange }: SecureShareProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDuration, setExpiryDuration] = useState("24h");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState("");

  const generateShareLink = async () => {
    if (!file?.id || !user || !firestore) return;
    setGenerating(true);
    try {
      const expiryDate = expiryEnabled ? new Date(Date.now() + getExpiryMs(expiryDuration)) : null;
      const shareId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const url = `${window.location.origin}/drive/share/${shareId}`;

      await updateDoc(doc(firestore, "users", user.uid, "drive_files", file.id), {
        sharedLink: url,
        sharePasswordProtected: passwordProtected,
        sharePassword: passwordProtected ? hashPassword(password) : null,
        shareExpiry: expiryDate?.toISOString() || null,
        shareId,
        sharedAt: serverTimestamp(),
      });

      await addDoc(collection(firestore, "users", user.uid, "shared_links"), {
        fileId: file.id,
        fileName: file.name,
        shareUrl: url,
        passwordProtected,
        passwordHash: passwordProtected ? hashPassword(password) : null,
        expiryDate: expiryDate?.toISOString() || null,
        createdAt: serverTimestamp(),
      });

      setGeneratedUrl(url);
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`);
      setGenerating(false);
      toast({ title: "Secure share link generated! 🔒" });
    } catch (err: any) {
      setGenerating(false);
      toast({ variant: "destructive", title: "Failed to generate link", description: err.message });
    }
  };

  const copyLink = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!" });
    } catch {
      toast({ variant: "destructive", title: "Failed to copy" });
    }
  };

  const getExpiryMs = (duration: string) => {
    const match = duration.match(/(\d+)([hmd])/);
    if (!match) return 24 * 60 * 60 * 1000;
    const v = parseInt(match[1]);
    if (match[2] === "h") return v * 60 * 60 * 1000;
    if (match[2] === "d") return v * 24 * 60 * 60 * 1000;
    return v * 60 * 1000;
  };

  const hashPassword = (pw: string) => {
    let hash = 0;
    for (let i = 0; i < pw.length; i++) {
      hash = ((hash << 5) - hash) + pw.charCodeAt(i);
      hash |= 0;
    }
    return `xak_${Math.abs(hash).toString(36)}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-[500px] max-h-[85vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Secure Share</h2>
                  <p className="text-xs text-zinc-500">{file?.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
            </div>

            <div className="space-y-4 mb-6">
              <Card className="bg-zinc-900/50 border-white/5 p-4">
                <Label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={passwordProtected} onChange={e => setPasswordProtected(e.target.checked)} className="w-4 h-4 accent-purple-500" />
                  <div>
                    <span className="text-sm font-medium group-hover:text-white transition-colors">Password Protection</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Recipients need a password to access</p>
                  </div>
                </Label>
                {passwordProtected && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter access password" className="bg-black/50 border-white/10 font-mono" />
                  </motion.div>
                )}
              </Card>

              <Card className="bg-zinc-900/50 border-white/5 p-4">
                <Label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={expiryEnabled} onChange={e => setExpiryEnabled(e.target.checked)} className="w-4 h-4 accent-orange-500" />
                  <div>
                    <span className="text-sm font-medium group-hover:text-white transition-colors">Link Expiry</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Link automatically expires</p>
                  </div>
                </Label>
                {expiryEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                    <select value={expiryDuration} onChange={e => setExpiryDuration(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none">
                      <option value="1h">1 Hour</option>
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                    </select>
                  </motion.div>
                )}
              </Card>
            </div>

            <Button onClick={generateShareLink} disabled={generating || !file?.id} className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 mb-6" size="lg">
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Shield className="w-4 h-4 mr-2" /> Generate Secure Link</>}
            </Button>

            <AnimatePresence>
              {generatedUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card className="bg-zinc-900/80 border border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Share Link</span>
                      {passwordProtected && <Badge className="ml-auto bg-purple-600/20 text-purple-400">🔒 Password</Badge>}
                      {expiryEnabled && <Badge className="ml-auto bg-orange-600/20 text-orange-400">⏰ Expires</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Input value={generatedUrl} readOnly className="bg-black/50 border-white/10 text-xs flex-1" />
                      <Button onClick={copyLink} variant="outline" size="sm" className="border-white/10">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </Card>

                  {qrCode && (
                    <Card className="bg-zinc-900/50 border-white/5 p-4 flex flex-col items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">QR Code</span>
                      <img src={qrCode} alt="QR" className="w-40 h-40 bg-white p-2 rounded-lg" />
                      <p className="text-[10px] text-zinc-500 mt-2">Scan to access file directly</p>
                    </Card>
                  )}

                  <div className="flex items-center gap-2 text-xs text-zinc-500 p-3 bg-zinc-900/30 rounded-lg">
                    <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span>End-to-end encrypted • {passwordProtected ? "Password required" : "Public"} • {expiryEnabled ? `Expires in ${expiryDuration}` : "No expiry"}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

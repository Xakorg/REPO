"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HardDrive, FileText, Mail, Calendar, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EcosystemIntegrationsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [syncedApps, setSyncedApps] = useState<string[]>(["XakDrive", "XakNotes"]);

  const toggleSync = (appName: string) => {
    if (syncedApps.includes(appName)) {
      setSyncedApps(syncedApps.filter((a) => a !== appName));
      toast({ title: `Disconnected ${appName} from Xak AI` });
    } else {
      setSyncedApps([...syncedApps, appName]);
      toast({ title: `Connected ${appName} to Xak AI` });
    }
  };

  const ecosystemApps = [
    { name: "XakDrive", desc: "Access user files, images, and documents", icon: HardDrive, color: "text-blue-400" },
    { name: "XakNotes", desc: "Read and create workspace notebooks & checklists", icon: FileText, color: "text-emerald-400" },
    { name: "XakMail", desc: "Draft emails, read inbox threads, and auto-compose", icon: Mail, color: "text-purple-400" },
    { name: "XakCalendar", desc: "Inspect schedule, deadlines, and milestone goals", icon: Calendar, color: "text-amber-400" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0a0d18] border border-indigo-500/30 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-indigo-300">
            <HardDrive className="h-5 w-5" />
            <span>Deep Ecosystem Integrations</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Connect Xak AI to your Xakteir ecosystem apps to read/write data directly from chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {ecosystemApps.map((app) => {
            const isConnected = syncedApps.includes(app.name);
            const Icon = app.icon;
            return (
              <div key={app.name} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${app.color}`} />
                  <div>
                    <span className="font-semibold text-sm block">{app.name}</span>
                    <span className="text-xs text-gray-400">{app.desc}</span>
                  </div>
                </div>
                <Button
                  size="xs"
                  variant={isConnected ? "secondary" : "outline"}
                  onClick={() => toggleSync(app.name)}
                  className="h-8 text-xs border-indigo-500/30"
                >
                  {isConnected ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" /> : null}
                  {isConnected ? "Connected" : "Connect"}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

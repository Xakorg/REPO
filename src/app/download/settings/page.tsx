"use client";

import Link from "next/link";
import { ArrowLeft, Settings, Shield, Bell, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 text-white space-y-8 animate-fade-in">
      <header className="flex items-center gap-6">
        <Link href="./">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">App Settings</h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Configure preferences and defaults</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card p-8 border-white/10 rounded-[2.5rem] bg-zinc-950/40 space-y-6">
          <h3 className="text-lg font-black uppercase italic flex items-center gap-3"><Shield className="w-5 h-5 text-primary" /> Privacy & Security</h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-bold uppercase tracking-wider">Configure visibility and telemetry for this app.</p>
        </Card>
        
        <Card className="glass-card p-8 border-white/10 rounded-[2.5rem] bg-zinc-950/40 space-y-6">
          <h3 className="text-lg font-black uppercase italic flex items-center gap-3"><Bell className="w-5 h-5 text-primary" /> Alerts</h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-bold uppercase tracking-wider">Configure notifications and notifications layout.</p>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Card } from "@/components/ui/card";
import { ShieldCheck, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 space-y-16 animate-fade-in px-6 text-foreground">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-900/20">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none text-foreground">Privacy Policy</h1>
        <p className="text-sm font-bold uppercase tracking-[0.4em] text-muted-foreground/60">Last updated: October 2024</p>
      </header>

      <div className="space-y-8">
        <Card className="glass-card rounded-[3.5rem] p-12 border-white/10 shadow-2xl space-y-12 bg-black/40">
          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-emerald-500">Information We Collect</h2>
            <div className="text-lg text-muted-foreground font-medium leading-relaxed italic space-y-2">
              <p>We may collect:</p>
              <ul className="list-disc pl-8 space-y-1">
                <li>Email address (for account creation)</li>
                <li>Password (securely stored via Firebase Authentication)</li>
                <li>Basic usage data (e.g., login timestamps, device type)</li>
              </ul>
              <p className="mt-4">We do not collect sensitive personal information.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-emerald-500">1. How We Use Your Information</h2>
            <div className="text-lg text-muted-foreground font-medium leading-relaxed italic space-y-2">
              <p>We use your information to:</p>
              <ul className="list-disc pl-8 space-y-1">
                <li>create and manage your account</li>
                <li>provide access to Xakteir apps</li>
                <li>improve platform performance</li>
              </ul>
              <p className="mt-4">We do not sell or share your data with third parties.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-emerald-500">2. Authentication</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              Xakteir uses Firebase Authentication, which securely handles login credentials. Passwords are never stored in plain text.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-emerald-500">3. Cookies</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              The Service may use cookies for login sessions and basic functionality.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-emerald-500">4. Data Security</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              We use industry‑standard security practices, including Firebase’s built‑in protections. However, no online service is 100% secure.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-emerald-500">5. Changes to This Policy</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              We may update this Privacy Policy as the project evolves.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-emerald-500">6. Contact</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              For privacy questions, contact: <span className="text-white font-bold">privacy@xakteir.com</span>
            </p>
          </div>
        </Card>

        <div className="flex justify-center pt-10">
          <Link href="/">
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-white">
              <ChevronLeft className="w-4 h-4 mr-2" /> Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Card } from "@/components/ui/card";
import { ScrollText, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 space-y-16 animate-fade-in px-6 text-foreground">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
            <ScrollText className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none text-foreground">Terms of Service</h1>
        <p className="text-sm font-bold uppercase tracking-[0.4em] text-muted-foreground/60">Last updated: October 2024</p>
      </header>

      <div className="space-y-8">
        <Card className="glass-card rounded-[3.5rem] p-12 border-white/10 shadow-2xl space-y-12 bg-black/40">
          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-primary">1. Acceptance of Terms</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              By accessing or using Xakteir Hub (“the Service”), you agree to these Terms of Service. If you do not agree, please do not use the Service.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-primary">2. Description of Service</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              Xakteir Hub is an experimental multi‑app platform currently in development. Features may change, be added, or be removed at any time.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-primary">3. Accounts</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              To use certain features, you must create an account. You agree to provide accurate information and keep your login credentials secure. You are responsible for all activity under your account.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-primary">4. User Conduct</h2>
            <div className="text-lg text-muted-foreground font-medium leading-relaxed italic space-y-2">
              <p>You agree not to:</p>
              <ul className="list-disc pl-8 space-y-1">
                <li>use the Service for illegal activities</li>
                <li>attempt to hack, disrupt, or misuse the platform</li>
                <li>impersonate others or submit harmful content</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-primary">5. Intellectual Property</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              All content, branding, and code associated with Xakteir belong to the project developers unless otherwise stated.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-primary">6. Availability</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              The Service is provided “as is” with no guarantees of uptime, reliability, or performance. Features may be experimental.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-primary">7. Termination</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              We may suspend or terminate accounts that violate these Terms or misuse the platform.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-primary">8. Changes to Terms</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              We may update these Terms at any time. Continued use of the Service means you accept the updated Terms.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-primary">9. Contact</h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
              For questions about these Terms, contact: <span className="text-white font-bold">contact@xakteir.com</span>
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

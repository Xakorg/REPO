"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Rocket, Heart, Sparkles, Star, Users, Mail, Info } from "lucide-react";
import { GlitchLogo } from "@/components/ui/glitch-logo";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-20 py-20 animate-fade-in px-6 text-foreground">
      <header className="text-center space-y-8">
        <div className="flex justify-center">
          <GlitchLogo className="scale-[2]" />
        </div>
        <div className="space-y-4">
          <h1 className="text-7xl font-black tracking-tighter text-foreground uppercase italic leading-tight">The Xakteir Vision</h1>
          <p className="text-xl text-muted-foreground font-bold uppercase tracking-[0.2em]">Everything In One Place // Made For You</p>
        </div>
      </header>

      {/* Main Project Story */}
      <section className="space-y-12">
        <div className="flex items-center justify-center gap-4 text-primary">
          <Info className="w-8 h-8 animate-pulse" />
          <h2 className="text-5xl font-black text-foreground uppercase italic tracking-tighter">About Xakteir</h2>
        </div>
        
        <Card className="glass-card rounded-[4rem] p-12 md:p-16 border-white/10 bg-black/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Rocket className="w-80 h-80 -rotate-12" />
          </div>
          <CardContent className="p-0 space-y-8 relative z-10">
            <p className="text-2xl leading-relaxed font-medium italic text-foreground/90">
              Xakteir is an independent development project created by a small team exploring the idea of a unified digital hub. Our goal is to build a space where communication, creativity, and entertainment come together under one account and one clean interface.
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground italic">
              We are currently in early development, experimenting with features such as Mail, Notes, Social, and Games. Xakteir is not a registered company yet — it is a growing project driven by curiosity, learning, and the desire to build something useful.
            </p>
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Share Feedback</p>
                  <a href="/feedback" className="text-lg font-bold text-primary hover:text-primary/80 transition-colors underline decoration-2 underline-offset-4">Post an Anonymous Review</a>
                </div>
              </div>
              <Badge variant="outline" className="border-white/10 text-[10px] font-black uppercase px-6 py-2 rounded-full">Early Access v4.2.8</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Founders Section */}
      <section className="space-y-12">
        <div className="flex items-center justify-center gap-4 text-blue-400">
          <Users className="w-8 h-8" />
          <h2 className="text-5xl font-black text-foreground uppercase italic tracking-tighter">The Team</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Card className="glass-card rounded-[4rem] p-12 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden group shadow-2xl transition-all hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <span className="text-9xl">😎</span>
            </div>
            <CardContent className="p-0 space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                <Badge className="bg-primary text-white font-black uppercase text-[10px] tracking-widest px-4 py-1">Founder</Badge>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">Ridwan</h2>
              </div>
              <div className="space-y-4">
                <p className="text-lg leading-relaxed font-bold text-foreground/90 italic">
                  "Since my dad got me a laptop, I have always loved coding and computers."
                </p>
                <p className="text-sm leading-relaxed font-medium text-muted-foreground">
                  I decided that in the future, I will own a massive company called Xakteir. The purpose of this version of Xakteir is for people to see it, give feedback, and eventually start a company with my brother.
                </p>
                <p className="text-sm leading-relaxed font-black text-primary uppercase tracking-widest pt-4">
                  "I hope my story encourages others to think big, but start small."
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-[4rem] p-12 border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent relative overflow-hidden group shadow-2xl transition-all hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <span className="text-9xl">😁</span>
            </div>
            <CardContent className="p-0 space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                <Badge className="bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest px-4 py-1">Co-Founder</Badge>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">Rayhan</h2>
              </div>
              <div className="h-40 flex flex-col items-center justify-center border-4 border-dashed border-white/5 rounded-[2rem] opacity-20 group-hover:opacity-40 transition-opacity">
                <Sparkles className="w-10 h-10 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Development in Progress...</p>
              </div>
              <p className="text-sm text-muted-foreground font-medium italic">
                Rayhan is working on new features for the Hub core. Stay tuned for future updates!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="text-center opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Xakteir v4.2.8 // Founded by Ridwan & Rayhan</p>
      </footer>
    </div>
  );
}
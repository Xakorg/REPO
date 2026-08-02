"use client";

import { useUser } from "@/firebase";
import { MessageSquare, Zap, ShieldCheck, Gamepad2, Brain, Loader2, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const FEATURE_CATEGORIES = [
  {
    title: "Core Messaging",
    icon: MessageSquare,
    color: "text-emerald-500",
    features: [
      "1-to-1 & Group Messaging", "Threaded Replies", "Message Reactions", "@Mentions", "Voice & Video Messages", "Message Editing & Deletion", "Scheduled & Disappearing Messages", "Pinned Messages", "Smart AI Search"
    ]
  },
  {
    title: "Servers & Communities",
    icon: Users,
    color: "text-blue-500",
    features: [
      "Public & Private Servers", "Roles & Permissions System", "Channel Categories", "Announcement Channels", "Community Discovery", "QR-Code Joining", "Invite Links", "Verified Communities", "Server Templates", "Server Analytics", "AI Moderation Tools", "Manual Moderation Tools", "Auto Moderation Rules", "XP & Leveling System", "Server Achievements", "Server Boosts", "Community Events", "Community Announcements", "Temporary Event Channels", "Dynamic Roles", "Member Activity Tracking"
    ]
  },
  {
    title: "Voice & Video",
    icon: Video,
    color: "text-rose-500",
    features: [
      "HD Group Voice & Video Calls", "Drop-in Voice Spaces", "Screen & Window Sharing", "Noise Suppression", "Voice Filters", "Call Recording", "Live Captions & Translation", "Mute/Deafen Controls"
    ]
  },
  {
    title: "Gaming & Social",
    icon: Gamepad2,
    color: "text-purple-500",
    features: [
      "Instant Play Mini-Games", "Server Tournaments", "Seasonal Events", "User Profiles & Themes", "Friend Activity Presence", "Hangout Rooms", "RSVP System", "Animated Profiles", "Trust Score System"
    ]
  },
  {
    title: "AI Features",
    icon: Brain,
    color: "text-primary",
    features: [
      "Chat Summarization", "“Catch me up” button", "Smart Reply Suggestions", "AI Translations", "AI voice translation", "AI moderation", "Spam Detection", "Toxicity Filtering", "Smart Notification Filtering"
    ]
  },
  {
    title: "Privacy & Security",
    icon: ShieldCheck,
    color: "text-emerald-400",
    features: [
      "End-to-end encryption", "Invisible/Ghost Mode", "Block & Report System", "Login Alerts", "Privacy Level Slider", "Two-Factor Auth Support", "Hidden & Locked Chats"
    ]
  }
];

export default function ChatDashboardPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  const cleanDisplayName = user?.displayName?.replace(/^@+/, "") || "Member";

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#05030d] text-foreground animate-fade-in overflow-y-auto pb-40">
        <section className="flex flex-col items-center justify-center text-center px-6 relative overflow-hidden pt-32 pb-40">
          <div className="absolute inset-0 arcade-grid opacity-10" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 space-y-12 max-w-6xl"
          >
            <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-8 py-3 rounded-full font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">
              XAKCHAT — PRO COMMUNICATION
            </Badge>
            <div className="space-y-6">
              <h1 className="text-6xl md:text-[9rem] font-black tracking-tighter uppercase italic leading-[0.85] text-white drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                Everything <br />
                <span className="text-emerald-500 flex items-center justify-center gap-4">Connects</span>
              </h1>
              <p className="text-xl md:text-4xl text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-4xl mx-auto italic opacity-60">
                A hybrid social, gaming, and professional experience.
              </p>
            </div>
            <div className="pt-10">
              <Link href="/auth">
                <Button className="h-24 px-20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2.5rem] font-black text-2xl uppercase italic shadow-[0_30px_100px_rgba(16,185,129,0.5)] hover:shadow-[0_40px_120px_rgba(16,185,129,0.7)] transition-all duration-300 active:scale-95 border-b-[12px] border-emerald-800 active:border-b-0 hover:-translate-y-2">
                  Join the Hub
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 relative z-10">
          {FEATURE_CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="h-full"
            >
              <Card className="h-full glass-card p-12 rounded-[4rem] border-white/5 space-y-8 group hover:border-emerald-500/40 transition-all bg-black/40 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className={cn("w-20 h-20 rounded-[2.5rem] bg-zinc-900 flex items-center justify-center border-4 border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl relative z-10", cat.color)}>
                  <cat.icon className="w-10 h-10" />
                </div>
                <div className="space-y-4 relative z-10">
                  <h3 className="text-3xl font-black uppercase italic text-white tracking-tight">{cat.title}</h3>
                  <ul className="space-y-3">
                    {cat.features.slice(0, 5).map(f => (
                      <li key={f} className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80 italic">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" /> {f}
                      </li>
                    ))}
                    <li className="text-[10px] font-black uppercase text-primary tracking-widest pt-2">...and much more</li>
                  </ul>
                </div>
              </Card>
            </motion.div>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950 animate-fade-in relative">
      <div className="absolute inset-0 arcade-grid opacity-[0.02] pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="max-w-xl space-y-8 z-10"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="w-24 h-24 rounded-[2.5rem] bg-black/40 border-4 border-white/10 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:shadow-[0_0_80px_rgba(16,185,129,0.3)] transition-shadow duration-500"
        >
          <MessageSquare className="w-12 h-12 text-white" style={{ stroke: "url(#mesh-gradient)", fill: "url(#mesh-gradient)", fillOpacity: 0.15 }} />
        </motion.div>
        <div className="space-y-3">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Welcome, {cleanDisplayName}!</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">XakChat Portal Active</p>
        </div>
        <p className="text-sm text-muted-foreground font-bold italic leading-relaxed max-w-md mx-auto">
          Connect with friends in private DMs or jump into server text channels from the sidebar rail!
        </p>
        <div className="pt-4 grid grid-cols-2 gap-4">
          <Card className="glass-panel p-6 rounded-2xl text-left hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">Public Channels</h3>
            <p className="text-[10px] text-muted-foreground mt-2 italic font-medium leading-relaxed">Join Xakteir Hub channels to discuss tech, design, and market topics.</p>
          </Card>
          <Card className="glass-panel p-6 rounded-2xl text-left hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">Private DMs</h3>
            <p className="text-[10px] text-muted-foreground mt-2 italic font-medium leading-relaxed">Transcribe secure 1-on-1 DMs with any hub member.</p>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart2, Users, Heart, Eye, TrendingUp, MessageSquare, ShieldCheck, Zap } from "lucide-react";

interface SocialAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  followersCount: number;
}

export function SocialAnalyticsModal({ open, onOpenChange, totalPosts, totalLikes, totalComments, followersCount }: SocialAnalyticsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 rounded-[2.5rem] max-w-2xl text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-pink-400" /> Social Analytics & Engagement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Key Stat Counters */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Total Posts</span>
              <div className="text-2xl font-black text-white">{totalPosts}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Total Likes</span>
              <div className="text-2xl font-black text-pink-400">{totalLikes}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Comments</span>
              <div className="text-2xl font-black text-indigo-400">{totalComments}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Followers</span>
              <div className="text-2xl font-black text-emerald-400">{followersCount}</div>
            </div>
          </div>

          {/* Engagement Chart */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Post Impressions & Reach (7 Days)
            </h4>

            <div className="h-32 flex items-end justify-between gap-3 pt-4 px-2">
              {[
                { day: "Mon", val: 120 },
                { day: "Tue", val: 340 },
                { day: "Wed", val: 280 },
                { day: "Thu", val: 510 },
                { day: "Fri", val: 430 },
                { day: "Sat", val: 680 },
                { day: "Sun", val: 590 },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-t from-pink-500/20 to-pink-500/60 hover:to-pink-500/90 rounded-t-lg transition-all relative group" style={{ height: `${(bar.val / 700) * 100}%` }}>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/20 whitespace-nowrap">
                      {bar.val} views
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white/50">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/60 pt-2 border-t border-white/10">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Xak AI Safety Shield Active</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-pink-400" /> Real-time Firestore Sync</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

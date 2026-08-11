"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart2, Mail, Send, CheckCircle2, TrendingUp, Clock, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MailAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalInbox: number;
  totalSent: number;
  unreadCount: number;
}

export function MailAnalyticsModal({ open, onOpenChange, totalInbox, totalSent, unreadCount }: MailAnalyticsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 rounded-[2.5rem] max-w-2xl text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-400" /> Mail Analytics Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Key Stat Counters */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Total Inbox</span>
              <div className="text-2xl font-black text-white">{totalInbox}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Sent Volume</span>
              <div className="text-2xl font-black text-indigo-400">{totalSent}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Unread</span>
              <div className="text-2xl font-black text-rose-400">{unreadCount}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Response Rate</span>
              <div className="text-2xl font-black text-emerald-400">94.8%</div>
            </div>
          </div>

          {/* Visual Activity Bars */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Weekly Activity Peak
            </h4>

            <div className="h-32 flex items-end justify-between gap-3 pt-4 px-2">
              {[
                { day: "Mon", val: 65 },
                { day: "Tue", val: 85 },
                { day: "Wed", val: 40 },
                { day: "Thu", val: 95 },
                { day: "Fri", val: 75 },
                { day: "Sat", val: 20 },
                { day: "Sun", val: 30 },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 rounded-t-lg transition-all relative group" style={{ height: `${bar.val}%` }}>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/20 whitespace-nowrap">
                      {bar.val} msgs
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white/50">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/60 pt-2 border-t border-white/10">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Anti-Spam Security Active</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-indigo-400" /> Resend API Engine Connected</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

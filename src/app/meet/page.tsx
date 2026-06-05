"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Users,
  Video as VideoIcon,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser } from "@/firebase";

export default function XakMeetLobbyPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [customRoomId, setCustomRoomId] = useState("");
  const [activeTab, setActiveTab] = useState<"lobby" | "create" | "join">("lobby");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateMeeting = () => {
    const meetingId =
      customRoomId.trim().toUpperCase() ||
      Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/meet/${meetingId}`);
  };

  const handleJoinMeeting = () => {
    if (!roomCode.trim()) return;
    router.push(`/meet/${roomCode.trim().toUpperCase()}`);
  };

  if (!mounted || isUserLoading) return null;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 text-center space-y-12 animate-fade-in text-foreground relative overflow-hidden bg-black">
      <div className="absolute inset-0 arcade-grid opacity-15 pointer-events-none" />
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {activeTab === "lobby" && (
        <div className="space-y-12 z-10 max-w-4xl w-full animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-4">
            <div className="w-32 h-32 rounded-[3.5rem] bg-rose-500/10 border-4 border-rose-500/20 flex items-center justify-center mx-auto shadow-2xl animate-float">
              <VideoIcon className="w-16 h-16 text-rose-500" />
            </div>
            <h1 className="text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
              XakMeet
            </h1>
            <p className="text-muted-foreground font-black uppercase tracking-[0.6em] text-[10px]">
              Instant WebRTC Video Calls
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              className="glass-card p-12 rounded-[4rem] border-white/10 space-y-8 bg-zinc-950/40 group hover:border-rose-500/40 transition-all cursor-pointer shadow-2xl hover:shadow-rose-500/5 animate-in slide-in-from-left-4 duration-300"
              onClick={() => setActiveTab("create")}
            >
              <Plus className="w-16 h-16 text-rose-500 mx-auto transition-transform group-hover:scale-110" />
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Create Meeting</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                Start a new room and share the link.
              </p>
              <Button className="w-full h-14 bg-rose-600 hover:bg-rose-500 rounded-2xl font-black uppercase text-xs transition-all duration-300 border-b-4 border-rose-900 active:border-b-0">
                Initialize
              </Button>
            </Card>

            <Card
              className="glass-card p-12 rounded-[4rem] border-white/10 space-y-8 bg-zinc-950/40 group hover:border-blue-500/40 transition-all cursor-pointer shadow-2xl hover:shadow-blue-500/5 animate-in slide-in-from-right-4 duration-300"
              onClick={() => setActiveTab("join")}
            >
              <Users className="w-16 h-16 text-blue-500 mx-auto transition-transform group-hover:scale-110" />
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Join Meeting</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                Connect with a room ID or shared link.
              </p>
              <Button className="w-full h-14 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase text-xs transition-all duration-300 border-b-4 border-blue-900 active:border-b-0">
                Connect
              </Button>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "create" && (
        <Card className="glass-card p-12 rounded-[4rem] border-white/10 space-y-10 bg-zinc-950/60 w-full max-w-xl z-10 animate-in zoom-in-95 duration-300">
          <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">New Room</h2>
          {!user ? (
            <div className="space-y-6">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                Sign in is required to create a new meeting room. Unauthenticated users can only join existing meetings.
              </p>
              <Button asChild className="w-full h-16 bg-rose-600 rounded-2xl font-black uppercase text-xs">
                <Link href="/auth">Sign In to Create</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 pl-2">
                  Custom Room ID (optional)
                </label>
                <Input
                  value={customRoomId}
                  onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
                  placeholder="E.G. CHAT-ROOM"
                  className="h-16 bg-black/60 border-white/10 rounded-2xl text-center font-black text-xl tracking-widest text-white focus:border-rose-500/50 focus:ring-0 transition-all"
                />
              </div>
              <Button
                onClick={handleCreateMeeting}
                className="w-full h-20 bg-rose-600 hover:bg-rose-500 text-white rounded-[2rem] font-black uppercase text-xl shadow-xl transition-all border-b-8 border-rose-900 active:border-b-0 flex items-center justify-center gap-3"
              >
                Start call <ArrowRight className="w-6 h-6" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            onClick={() => setActiveTab("lobby")}
            className="text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:bg-transparent text-white"
          >
            Cancel
          </Button>
        </Card>
      )}

      {activeTab === "join" && (
        <Card className="glass-card p-12 rounded-[4rem] border-white/10 space-y-10 bg-zinc-950/60 w-full max-w-xl z-10 animate-in zoom-in-95 duration-300">
          <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Connect</h2>
          <div className="space-y-4 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 pl-2">
              Enter Room ID
            </label>
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="E.G. ROOM-ID"
              className="h-16 bg-black/60 border-white/10 rounded-2xl text-center font-black text-xl tracking-widest text-white focus:border-blue-500/50 focus:ring-0 transition-all"
            />
          </div>
          <Button
            onClick={handleJoinMeeting}
            disabled={!roomCode.trim()}
            className="w-full h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase text-xl shadow-xl transition-all border-b-8 border-blue-900 active:border-b-0 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
          >
            Join call <ArrowRight className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("lobby")}
            className="text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:bg-transparent text-white"
          >
            Cancel
          </Button>
        </Card>
      )}
    </div>
  );
}

"use client";

import { Users, UserPlus, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_FRIENDS = [
  { id: 1, name: "NeonNinja", status: "online", activity: "Lobby" },
  { id: 2, name: "PixelQueen", status: "online", activity: "Playing 1v1 Duel" },
  { id: 3, name: "CyberSamurai", status: "offline", activity: "Last seen 2h ago" },
  { id: 4, name: "GlitchHunter", status: "offline", activity: "Last seen 1d ago" },
];

export function FriendsSidebar() {
  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/60 backdrop-blur-xl border-l border-white/10 p-6 pointer-events-auto flex flex-col font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-white font-bold text-xl flex items-center gap-2">
          <Users className="w-6 h-6 text-[#855cd6]" />
          Social
        </h2>
        <button className="text-white/60 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/20">
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      {/* Friends List */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        {MOCK_FRIENDS.map(friend => (
          <div key={friend.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                   {/* Fallback avatar */}
                   <span className="text-white font-bold">{friend.name.charAt(0)}</span>
                </div>
                <Circle className={cn(
                  "w-3 h-3 absolute -bottom-1 -right-1 rounded-full fill-current",
                  friend.status === "online" ? "text-emerald-500" : "text-zinc-500"
                )} />
              </div>
              
              <div className="flex flex-col">
                <span className={cn("font-bold text-sm", friend.status === "online" ? "text-white" : "text-white/50")}>
                  {friend.name}
                </span>
                <span className="text-xs text-white/40 truncate w-32">
                  {friend.activity}
                </span>
              </div>
            </div>

            {friend.status === "online" && (
              <button className="opacity-0 group-hover:opacity-100 bg-[#855cd6] hover:bg-[#7042c1] text-white text-xs font-bold px-3 py-1.5 rounded transition-all">
                Invite
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}

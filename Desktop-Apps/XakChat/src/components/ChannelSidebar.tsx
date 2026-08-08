import { useState } from "react";
import { Hash, Volume2, Plus, Mic, MicOff, Headphones, HeadphoneOff } from "lucide-react";

export interface ChannelItem {
  id: string;
  name: string;
  type: "text" | "voice";
  category: string;
  unread?: boolean;
}

export interface DirectMessageUser {
  uid: string;
  name: string;
  avatar?: string;
  status: "online" | "idle" | "dnd" | "offline";
  customStatus?: string;
}

interface ChannelSidebarProps {
  serverName: string;
  channels: ChannelItem[];
  dms: DirectMessageUser[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  onSelectDM?: (uid: string) => void;
  onAddChannel?: () => void;
  currentUser?: {
    name: string;
    tag: string;
    avatar?: string;
  };
}

export function ChannelSidebar({
  serverName,
  channels,
  dms,
  activeChannelId,
  onSelectChannel,
  onSelectDM,
  onAddChannel,
  currentUser = { name: "Xakteir Member", tag: "#0001" },
}: ChannelSidebarProps) {
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  // Group channels by category
  const categories = Array.from(new Set(channels.map((c) => c.category)));

  return (
    <div className="w-60 bg-[#09071b]/95 border-r border-white/10 flex flex-col justify-between select-none relative z-30">
      {/* Header: Server Name */}
      <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between font-black text-sm text-white tracking-wide">
        <span className="truncate">{serverName}</span>
        <button
          onClick={onAddChannel}
          className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          title="Create Channel"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Channels & DMs Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Categories & Channels */}
        {categories.map((cat) => {
          const catChannels = channels.filter((c) => c.category === cat);
          return (
            <div key={cat} className="space-y-1">
              <div className="px-2 font-bold text-[10px] uppercase tracking-widest text-emerald-400/70 flex items-center justify-between">
                <span>{cat}</span>
              </div>
              {catChannels.map((channel) => {
                const isActive = activeChannelId === channel.id;
                const isVoice = channel.type === "voice";
                return (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {isVoice ? (
                      <Volume2 className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400 animate-pulse" : "text-gray-500"}`} />
                    ) : (
                      <Hash className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-gray-500"}`} />
                    )}
                    <span className="truncate">{channel.name}</span>
                    {channel.unread && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Direct Messages Section */}
        {dms.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-white/10">
            <div className="px-2 font-bold text-[10px] uppercase tracking-widest text-indigo-400/70 flex items-center justify-between">
              <span>Direct Messages</span>
            </div>
            {dms.map((dm) => (
              <button
                key={dm.uid}
                onClick={() => onSelectDM?.(dm.uid)}
                className="w-full flex items-center space-x-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
              >
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/50 flex items-center justify-center font-bold text-[10px] text-white">
                    {dm.name.substring(0, 1)}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#09071b] ${
                      dm.status === "online" ? "bg-emerald-400" : "bg-gray-500"
                    }`}
                  />
                </div>
                <span className="truncate font-medium">{dm.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Status Bar at Bottom */}
      <div className="h-14 bg-black/50 border-t border-white/10 px-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center font-black text-xs text-white">
              {currentUser.name.substring(0, 1)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#09071b]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">{currentUser.name}</p>
            <p className="text-[10px] font-mono text-emerald-400/80 truncate">Online</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setMuted(!muted)}
            className={`p-1.5 rounded-md transition-colors ${
              muted ? "bg-rose-500/20 text-rose-400" : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            title={muted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {muted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setDeafened(!deafened)}
            className={`p-1.5 rounded-md transition-colors ${
              deafened ? "bg-rose-500/20 text-rose-400" : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            title={deafened ? "Undeafen Audio" : "Deafen Audio"}
          >
            {deafened ? <HeadphoneOff className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

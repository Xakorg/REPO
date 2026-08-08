import { useState } from "react";
import { MessageSquare, Minus, Square, X, Search, ShieldCheck } from "lucide-react";

interface TitleBarProps {
  serverName?: string;
  channelName?: string;
  onSearch?: (query: string) => void;
}

export function TitleBar({ serverName = "XakChat Home", channelName = "general", onSearch }: TitleBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => {
    if ((window as any).__TAURI__) {
      (window as any).__TAURI__.window.getCurrentWindow().minimize();
    }
  };

  const handleMaximize = () => {
    if ((window as any).__TAURI__) {
      (window as any).__TAURI__.window.getCurrentWindow().toggleMaximize();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if ((window as any).__TAURI__) {
      (window as any).__TAURI__.window.getCurrentWindow().close();
    }
  };

  return (
    <div className="drag-region h-11 bg-[#05030d]/95 border-b border-white/10 flex items-center justify-between px-3 text-xs select-none relative z-50">
      {/* Left: App branding & active location */}
      <div className="flex items-center space-x-2.5">
        <div className="no-drag w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <span className="font-black italic tracking-tighter text-emerald-400 text-sm">
          XAKCHAT <span className="text-[10px] font-mono text-emerald-500/70 not-italic uppercase ml-1 border border-emerald-500/30 px-1.5 py-0.5 rounded">Desktop Pro</span>
        </span>
        <div className="h-4 w-px bg-white/10 mx-1" />
        <span className="text-gray-400 font-medium text-xs truncate max-w-[200px]">
          {serverName} <span className="text-gray-600">/</span> #{channelName}
        </span>
      </div>

      {/* Center: Search & Status */}
      <div className="no-drag flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs w-64 focus-within:border-emerald-500/50 transition-colors">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search servers, channels, DMs..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch?.(e.target.value);
          }}
          className="bg-transparent border-none text-white focus:outline-none w-full text-xs placeholder:text-gray-500"
        />
      </div>

      {/* Right: Window Controls */}
      <div className="no-drag flex items-center space-x-1">
        <div className="flex items-center space-x-1 mr-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>E2EE Active</span>
        </div>

        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-rose-600 text-gray-400 hover:text-white transition-colors"
          title="Close Window"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

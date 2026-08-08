import { Plus, MessageSquare, Compass, Settings } from "lucide-react";

export interface ServerItem {
  id: string;
  name: string;
  icon?: string;
  color: string;
  unreadCount?: number;
}

interface ServerSidebarProps {
  servers: ServerItem[];
  activeServerId: string;
  onSelectServer: (id: string) => void;
  onAddServer: () => void;
}

export function ServerSidebar({ servers, activeServerId, onSelectServer, onAddServer }: ServerSidebarProps) {
  return (
    <div className="w-[72px] bg-[#070514]/90 border-r border-white/10 flex flex-col items-center py-3 space-y-2 select-none relative z-40">
      {/* Main Home Server */}
      <button
        onClick={() => onSelectServer("home")}
        className={`relative group w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          activeServerId === "home"
            ? "bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/40"
            : "bg-white/5 hover:bg-emerald-500/20 text-emerald-400 hover:text-white hover:rounded-xl"
        }`}
        title="XakChat Home"
      >
        <MessageSquare className="w-6 h-6" />
        {activeServerId === "home" && (
          <div className="absolute -left-3 top-2.5 w-1.5 h-7 bg-emerald-400 rounded-r-full" />
        )}
      </button>

      {/* Discovery Server */}
      <button
        onClick={() => onSelectServer("discover")}
        className={`relative group w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          activeServerId === "discover"
            ? "bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-500/40"
            : "bg-white/5 hover:bg-teal-500/20 text-teal-400 hover:text-white hover:rounded-xl"
        }`}
        title="Server Discovery"
      >
        <Compass className="w-6 h-6" />
        {activeServerId === "discover" && (
          <div className="absolute -left-3 top-2.5 w-1.5 h-7 bg-teal-400 rounded-r-full" />
        )}
      </button>

      <div className="w-8 h-px bg-white/10 my-1" />

      {/* Community Servers List */}
      <div className="flex-1 w-full flex flex-col items-center space-y-2 overflow-y-auto px-2">
        {servers.map((server) => {
          const isActive = activeServerId === server.id;
          return (
            <button
              key={server.id}
              onClick={() => onSelectServer(server.id)}
              className={`relative group w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm uppercase transition-all duration-300 border ${
                isActive
                  ? "bg-emerald-600 border-emerald-400 text-white rounded-xl shadow-lg shadow-emerald-600/30"
                  : "bg-white/5 border-white/10 hover:border-emerald-500/40 text-gray-300 hover:text-white hover:rounded-xl"
              }`}
              title={server.name}
            >
              {server.icon ? (
                <img src={server.icon} alt={server.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                server.name.substring(0, 2)
              )}

              {isActive && (
                <div className="absolute -left-3 top-2.5 w-1.5 h-7 bg-emerald-400 rounded-r-full" />
              )}

              {server.unreadCount && server.unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#070514]">
                  {server.unreadCount}
                </span>
              ) : null}
            </button>
          );
        })}

        {/* Add Server Button */}
        <button
          onClick={onAddServer}
          className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-emerald-500/20 border border-dashed border-white/20 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-all duration-300 hover:rounded-xl"
          title="Create or Join a Server"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="w-8 h-px bg-white/10 my-1" />

      {/* Settings / Extensions Trigger */}
      <button
        onClick={() => onSelectServer("settings")}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          activeServerId === "settings"
            ? "bg-indigo-600 text-white rounded-xl"
            : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white hover:rounded-xl"
        }`}
        title="App Settings & Customization"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
}

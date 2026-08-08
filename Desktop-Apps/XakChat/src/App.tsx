import { useState } from "react";
import { TitleBar } from "./components/TitleBar";
import { ServerSidebar, type ServerItem } from "./components/ServerSidebar";
import { ChannelSidebar, type ChannelItem, type DirectMessageUser } from "./components/ChannelSidebar";
import { ChatArea, type ChatMessage } from "./components/ChatArea";

export default function App() {
  const [activeServerId, setActiveServerId] = useState("home");
  const [activeChannelId, setActiveChannelId] = useState("general");

  const [servers, setServers] = useState<ServerItem[]>([
    { id: "xakteir", name: "Xakteir Core", color: "bg-emerald-600", unreadCount: 3 },
    { id: "gaming", name: "Gaming Hub", color: "bg-purple-600" },
    { id: "dev", name: "Dev Centre", color: "bg-indigo-600" },
  ]);

  const [channels] = useState<ChannelItem[]>([
    { id: "general", name: "general", type: "text", category: "WELCOME", unread: true },
    { id: "announcements", name: "announcements", type: "text", category: "WELCOME" },
    { id: "logic-lab", name: "logic-lab", type: "text", category: "LOBBY" },
    { id: "design-studio", name: "design-studio", type: "text", category: "LOBBY" },
    { id: "general-lounge", name: "General Lounge", type: "voice", category: "VOICE SPACES" },
    { id: "gaming-pod-a", name: "Gaming Pod A", type: "voice", category: "VOICE SPACES" },
  ]);

  const [dms] = useState<DirectMessageUser[]>([
    { uid: "u1", name: "Xak AI Bot", status: "online" },
    { uid: "u2", name: "CyberNinja", status: "idle" },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      sender: "Xak AI Bot",
      content: "Welcome to XakChat Desktop Pro! 🥳🚀 All communications are secured with end-to-end encryption.",
      timestamp: "12:30 PM",
      reactions: { "🔥": 4, "🚀": 7 },
    },
    {
      id: "m2",
      sender: "CyberNinja",
      content: "Here is the sample code snippet for the Tauri window controller:",
      timestamp: "12:32 PM",
      codeSnippet: {
        language: "typescript",
        code: "import { getCurrentWindow } from '@tauri-apps/api/window';\nawait getCurrentWindow().minimize();",
      },
    },
  ]);

  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: "You",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const current = m.reactions?.[emoji] || 0;
          return { ...m, reactions: { ...m.reactions, [emoji]: current + 1 } };
        }
        return m;
      })
    );
  };

  const activeServer = servers.find((s) => s.id === activeServerId) || { name: "XakChat Desktop" };
  const activeChannel = channels.find((c) => c.id === activeChannelId) || { name: "general", type: "text" as const };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#05030d] text-white overflow-hidden font-sans">
      {/* Top Native Titlebar */}
      <TitleBar serverName={activeServer.name} channelName={activeChannel.name} />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leftmost Server Icons Sidebar */}
        <ServerSidebar
          servers={servers}
          activeServerId={activeServerId}
          onSelectServer={(id) => setActiveServerId(id)}
          onAddServer={() => {
            const name = prompt("Enter Server Name:");
            if (name) {
              setServers([...servers, { id: `srv_${Date.now()}`, name, color: "bg-emerald-600" }]);
            }
          }}
        />

        {/* Channel Categories Sidebar */}
        <ChannelSidebar
          serverName={activeServer.name}
          channels={channels}
          dms={dms}
          activeChannelId={activeChannelId}
          onSelectChannel={(id) => setActiveChannelId(id)}
        />

        {/* Central Chat Stream */}
        <ChatArea
          channelName={activeChannel.name}
          channelType={activeChannel.type}
          messages={messages}
          onSendMessage={handleSendMessage}
          onAddReaction={handleAddReaction}
        />
      </div>
    </div>
  );
}

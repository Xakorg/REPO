import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageSquare, Users, Send, Search, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function XakchatSidebar({ activeGameId, activeGameTitle }: { activeGameId?: string; activeGameTitle?: string }) {
  const [activeTab, setActiveTab] = useState<"friends" | "chat">("friends");
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<{sender: string, text: string, type?: "invite" | "text", gameId?: string}[]>([
    { sender: "Ridwan", text: "Hey! Ready to play?" },
    { sender: "You", text: "Yeah, let's go!" }
  ]);
  const [messageInput, setMessageInput] = useState("");

  const handleSend = () => {
    if (!messageInput.trim()) return;
    setMessages(prev => [...prev, { sender: "You", text: messageInput }]);
    setMessageInput("");
  };

  const handleInvite = () => {
    if (!activeGameId) return;
    setMessages(prev => [...prev, { 
      sender: "You", 
      text: `Invited you to play ${activeGameTitle || activeGameId}`, 
      type: "invite", 
      gameId: activeGameId 
    }]);
  };

  const MOCK_FRIENDS = [
    { id: "1", name: "Ridwan", status: "online", playing: "Neon Vanguard" },
    { id: "2", name: "Aisha", status: "offline" },
    { id: "3", name: "Zayn", status: "online", playing: "Void Sentinel" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-indigo-500/50 transition-colors border border-white/20">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
        </button>
      </SheetTrigger>
      <SheetContent className="bg-[#0f0f15] border-l border-white/10 text-white font-sans flex flex-col p-0 w-[400px]">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black uppercase tracking-wider flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" /> 
              Social Hub
            </h2>
          </div>
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
            <button 
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === "friends" ? "bg-indigo-500 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            >
              Friends
            </button>
            <button 
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === "chat" ? "bg-indigo-500 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            >
              Chats
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col relative">
          <AnimatePresence mode="wait">
            {activeTab === "friends" ? (
              <motion.div 
                key="friends"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-2 flex-1"
              >
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input 
                    type="text" 
                    placeholder="Find friends..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {MOCK_FRIENDS.map(f => (
                  <div key={f.id} onClick={() => { setSelectedFriend(f.name); setActiveTab("chat"); }} className="group p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer transition-all flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">
                        {f.name[0]}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f0f15] ${f.status === "online" ? "bg-emerald-500" : "bg-zinc-500"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{f.name}</div>
                      {f.playing ? (
                        <div className="text-xs text-indigo-400 font-medium">Playing {f.playing}</div>
                      ) : (
                        <div className="text-xs text-white/40 capitalize">{f.status}</div>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                {!selectedFriend ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/30 p-8 text-center gap-4">
                    <MessageSquare className="w-12 h-12" />
                    <p className="text-sm">Select a friend from the Friends tab to start chatting.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                      <div className="font-bold">{selectedFriend}</div>
                      {activeGameId && (
                        <button onClick={handleInvite} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors">
                          <Swords className="w-3.5 h-3.5" /> Invite
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-end min-h-[300px]">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl p-3 ${
                            msg.type === "invite" 
                              ? "bg-gradient-to-r from-amber-500 to-orange-600 border border-orange-400/50" 
                              : msg.sender === "You" ? "bg-indigo-600" : "bg-white/10"
                          }`}>
                            {msg.type === "invite" && <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Game Invite</div>}
                            <div className="text-sm">{msg.text}</div>
                            {msg.type === "invite" && msg.sender !== "You" && (
                              <button className="mt-2 w-full py-1.5 bg-black/30 hover:bg-black/50 rounded text-xs font-bold transition-colors">
                                Click to Join
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-black/20 shrink-0">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={messageInput}
                          onChange={e => setMessageInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSend()}
                          placeholder="Send a message..." 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button onClick={handleSend} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 shrink-0 flex justify-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Powered by Xakchat
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MessageSquare, Users, Send, Search, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, addDoc, serverTimestamp, setDoc, doc, getDoc } from "firebase/firestore";

export function XakchatSidebar({ activeGameId, activeGameTitle }: { activeGameId?: string; activeGameTitle?: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [activeTab, setActiveTab] = useState<"friends" | "chat">("friends");
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch Users (Friends List)
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), limit(50));
  }, [firestore]);
  const { data: allUsers } = useCollection(usersQuery);
  
  const friendsList = (allUsers || []).filter(u => u.id !== user?.uid).filter(u => 
    searchQuery ? u.username?.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  // 2. Chat Room Logic
  const dmChatId = selectedFriend && user 
    ? `dm_${[user.uid, selectedFriend.id].sort().join("_")}` 
    : null;

  // Initialize chat doc if it doesn't exist when we select a friend
  useEffect(() => {
    if (!firestore || !user || !selectedFriend || !dmChatId) return;
    
    const checkAndInitChat = async () => {
      try {
        const dmRef = doc(firestore, "chats", dmChatId);
        const snap = await getDoc(dmRef);
        if (!snap.exists()) {
          await setDoc(dmRef, {
            id: dmChatId,
            participants: [user.uid, selectedFriend.id].sort(),
            public: false,
            createdAt: serverTimestamp(),
            type: "dm"
          });
        }
      } catch (e) {
        console.error("Error checking DM:", e);
      }
    };
    checkAndInitChat();
  }, [firestore, user, selectedFriend, dmChatId]);

  // 3. Fetch Messages
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !dmChatId) return null;
    return query(
      collection(firestore, "chats", dmChatId, "messages"),
      orderBy("timestamp", "asc"),
      limit(50)
    );
  }, [firestore, dmChatId]);
  
  const { data: messages } = useCollection(messagesQuery);

  // 4. Send Message
  const handleSend = async () => {
    if (!messageInput.trim() || !firestore || !user || !dmChatId) return;
    
    const text = messageInput;
    setMessageInput("");
    
    try {
      await addDoc(collection(firestore, "chats", dmChatId, "messages"), {
        text,
        senderId: user.uid,
        senderName: user.displayName || user.username || "Unknown",
        timestamp: serverTimestamp(),
        type: "text"
      });
    } catch (e) {
      console.error("Error sending message:", e);
    }
  };

  // 5. Send Game Invite
  const handleInvite = async () => {
    if (!activeGameId || !firestore || !user || !dmChatId) return;
    try {
      await addDoc(collection(firestore, "chats", dmChatId, "messages"), {
        text: `Invited you to play ${activeGameTitle || activeGameId}`,
        senderId: user.uid,
        senderName: user.displayName || user.username || "Unknown",
        timestamp: serverTimestamp(),
        type: "invite",
        gameId: activeGameId
      });
    } catch (e) {
      console.error("Error sending invite:", e);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-indigo-500/50 transition-colors border border-white/20 relative group">
          <MessageSquare className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 border border-[#0f0f15]" />
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
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === "friends" ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            >
              Players
            </button>
            <button 
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === "chat" ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            >
              Chat
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col relative no-scrollbar">
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find players..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {!user && (
                  <div className="text-center p-4 text-white/40 text-sm font-bold uppercase">
                    Please log in to use Xakchat.
                  </div>
                )}

                {user && friendsList.map(f => (
                  <div 
                    key={f.id} 
                    onClick={() => { setSelectedFriend(f); setActiveTab("chat"); }} 
                    className="group p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 cursor-pointer transition-all flex items-center gap-3"
                  >
                    <div className="relative">
                      {f.photoURL ? (
                        <img src={f.photoURL} alt="avatar" className="w-10 h-10 rounded-full object-cover bg-zinc-800" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">
                          {(f.username || f.displayName || "?")[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f0f15] ${f.online ? "bg-emerald-500" : "bg-zinc-500"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{f.username || f.displayName || "Unknown User"}</div>
                      {f.statusText ? (
                        <div className="text-xs text-indigo-400 font-medium truncate max-w-[200px]">{f.statusEmoji} {f.statusText}</div>
                      ) : (
                        <div className="text-xs text-white/40 capitalize">{f.online ? "Online" : "Offline"}</div>
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
                    <p className="text-sm font-medium">Select a player from the Players tab to start chatting.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5 sticky top-0 z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs">
                          {(selectedFriend.username || selectedFriend.displayName || "?")[0]?.toUpperCase()}
                        </div>
                        <div className="font-bold">{selectedFriend.username || selectedFriend.displayName || "Unknown User"}</div>
                      </div>
                      {activeGameId && (
                        <button onClick={handleInvite} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                          <Swords className="w-3.5 h-3.5" /> Invite
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col min-h-[300px] no-scrollbar">
                      {messages?.length === 0 && (
                        <div className="text-center text-white/20 text-xs font-bold uppercase tracking-widest mt-auto mb-4">
                          Beginning of conversation
                        </div>
                      )}
                      
                      {messages?.map((msg) => {
                        const isMe = msg.senderId === user?.uid;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 ${
                              msg.type === "invite" 
                                ? "bg-gradient-to-r from-amber-500 to-orange-600 border border-orange-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                                : isMe ? "bg-indigo-600" : "bg-white/10"
                            }`}>
                              {msg.type === "invite" && <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80 flex items-center gap-1"><Swords className="w-3 h-3"/> Game Invite</div>}
                              <div className="text-sm font-medium">{msg.text}</div>
                              {msg.type === "invite" && !isMe && msg.gameId && (
                                <button onClick={() => window.location.href = `/game/${msg.gameId}`} className="mt-2 w-full py-1.5 bg-black/40 hover:bg-black/60 rounded text-xs font-bold transition-colors uppercase tracking-widest">
                                  Click to Join
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 bg-black/40 shrink-0 border-t border-white/5 sticky bottom-0 z-10">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={messageInput}
                          onChange={e => setMessageInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSend()}
                          placeholder="Send a message..." 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button onClick={handleSend} disabled={!messageInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-lg transition-colors">
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
        <div className="p-4 border-t border-white/10 shrink-0 flex justify-center bg-black/20">
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_5px_rgba(99,102,241,0.8)]" />
            Powered by Xakchat
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}

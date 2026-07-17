"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";

interface ThreadPanelProps {
  message: any;
  onClose: () => void;
  channelId?: string; // if in server
  dmId?: string;      // if in dm
}

export function ThreadPanel({ message, onClose, channelId, dmId }: ThreadPanelProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [replyText, setReplyText] = useState("");
  
  // Construct path to replies subcollection
  let repliesPath = "";
  if (dmId) {
    repliesPath = `dms/${dmId}/messages/${message.id}/replies`;
  } else if (channelId) {
    repliesPath = `channels/${channelId}/messages/${message.id}/replies`;
  }

  // Fetch replies
  const q = firestore && repliesPath ? query(collection(firestore, repliesPath), orderBy("timestamp", "asc")) : null;
  const { data: replies } = useCollection(q);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !firestore || !user) return;

    try {
      await addDoc(collection(firestore, repliesPath), {
        content: replyText,
        uid: user.uid,
        sender: user.displayName || user.email?.split("@")[0] || "User",
        photoURL: user.photoURL || "",
        timestamp: serverTimestamp(),
      });
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#05050a] border-l border-white/10 w-80 animate-in slide-in-from-right">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <h3 className="font-bold">Thread</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original Message */}
        <div className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
          <img src={message.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender}`} className="w-8 h-8 rounded-full" alt="avatar" />
          <div>
            <div className="font-bold text-sm text-primary">{message.sender}</div>
            <div className="text-sm text-zinc-300 mt-1 break-words whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>

        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center mt-4 border-b border-white/10 leading-[0.1em]">
          <span className="bg-[#05050a] px-2">{replies?.length || 0} Replies</span>
        </div>

        {/* Replies */}
        {replies?.map((r: any) => (
          <div key={r.id} className="flex gap-3">
            <img src={r.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.sender}`} className="w-8 h-8 rounded-full" alt="avatar" />
            <div>
              <div className="font-bold text-xs">{r.sender} <span className="text-[10px] text-zinc-500 font-normal ml-2">{r.timestamp?.toDate()?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
              <div className="text-sm text-zinc-300 mt-1 break-words">{r.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-black border-t border-white/10">
        <form onSubmit={handleSend} className="relative">
          <button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
            <Paperclip className="w-4 h-4" />
          </button>
          <Input 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to thread..." 
            className="pl-9 pr-10 bg-white/5 border-white/10 rounded-full h-10"
          />
          <button type="submit" disabled={!replyText.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-black p-1.5 rounded-full disabled:opacity-50">
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
}

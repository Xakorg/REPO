"use client";

import { useEffect, useState, useRef } from "react";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageSquare, X } from "lucide-react";

export default function QuickReplyPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<any>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus automatically
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Make window draggable
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";
  }, []);

  useEffect(() => {
    async function fetchLastChat() {
      if (!user || !firestore) return;
      
      try {
        // Fetch the most recently updated DM or Server
        // For this implementation, we'll assume DMs are stored in 'users/{uid}/dms'
        // and we sort by updatedAt desc.
        const q = query(
          collection(firestore, "users", user.uid, "dms"),
          orderBy("updatedAt", "desc"),
          limit(1)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setChat({ id: doc.id, ...doc.data() });
        }
      } catch (err) {
        console.error("Failed to fetch last chat", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLastChat();
  }, [user, firestore]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !firestore || !chat) return;

    setSending(true);
    try {
      await addDoc(collection(firestore, "users", user.uid, "dms", chat.id, "messages"), {
        text: input,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });
      
      // Close the window after sending
      if (typeof window !== "undefined" && (window as any).electron) {
        (window as any).electron.window.close(); // Using standard window closeIPC
      } else {
        setInput(""); // Fallback if not electron
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const closeWindow = () => {
    if (typeof window !== "undefined" && (window as any).electron) {
      (window as any).electron.window.close();
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-zinc-950/95 backdrop-blur-2xl border border-white/20 rounded-2xl flex flex-col shadow-2xl overflow-hidden" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-white/80">
            Reply to <span className="text-white">{chat?.displayName || "Last Chat"}</span>
          </span>
        </div>
        <button 
          onClick={closeWindow}
          className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <form onSubmit={handleSend} className="p-4 flex-1 flex flex-col justify-end" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="relative">
          <Input 
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a quick reply..."
            className="w-full bg-black/50 border-white/10 focus-visible:border-primary pr-12 rounded-xl"
            disabled={sending || !chat}
            autoFocus
          />
          <button 
            type="submit" 
            disabled={sending || !input.trim() || !chat}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";
import { X, Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc } from "firebase/firestore";

interface BookmarksPanelProps {
  onClose: () => void;
}

export function BookmarksPanel({ onClose }: BookmarksPanelProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const q = firestore && user ? query(collection(firestore, "users", user.uid, "bookmarks"), orderBy("savedAt", "desc")) : null;
  const { data: bookmarks } = useCollection(q);

  const handleDelete = async (bookmarkId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(doc(firestore, "users", user.uid, "bookmarks", bookmarkId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#05050a] border-l border-white/10 w-80 animate-in slide-in-from-right z-40 relative">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <h3 className="font-bold flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-500" /> Bookmarks
        </h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!bookmarks || bookmarks.length === 0 ? (
          <div className="text-center text-white/40 italic text-sm mt-10">No bookmarks yet.</div>
        ) : (
          bookmarks.map((bm: any) => (
            <div key={bm.id} className="bg-white/5 p-3 rounded-xl border border-white/10 relative group">
              <button 
                onClick={() => handleDelete(bm.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <div className="font-bold text-xs text-primary mb-1 flex items-center justify-between">
                <span>{bm.senderName || bm.sender}</span>
                {bm.channelName && <span className="text-[9px] text-zinc-500">{bm.channelName}</span>}
              </div>
              <div className="text-sm text-zinc-300 break-words whitespace-pre-wrap">{bm.content}</div>
              <div className="text-[9px] text-zinc-500 mt-2 text-right">
                {bm.savedAt?.toDate()?.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

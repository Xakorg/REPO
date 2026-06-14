"use client";

import { Users, UserPlus, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, where } from "firebase/firestore";
import { useMemo } from "react";

export function FriendsSidebar() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch all users
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), limit(100));
  }, [firestore]);
  const { data: allUsers, isLoading: loadingUsers } = useCollection(usersQuery);

  // Fetch friendships
  const friendshipsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "friendships"));
  }, [firestore, user]);
  const { data: friendships, isLoading: loadingFriends } = useCollection(friendshipsQuery);

  // Extract friend IDs
  const friendIds = useMemo(() => {
    if (!friendships || !user) return [];
    const accepted = friendships.filter(f => f.status === "accepted" && (f.requesterId === user.uid || f.recipientEmail?.toLowerCase() === user.email?.toLowerCase()));
    return accepted.map(f => f.requesterId === user.uid ? f.recipientId : f.requesterId);
  }, [friendships, user]);

  // Map active friends profile details
  const activeFriends = useMemo(() => {
    if (!allUsers || friendIds.length === 0) return [];
    return allUsers.filter(u => friendIds.includes(u.id));
  }, [allUsers, friendIds]);

  const isLoading = loadingUsers || loadingFriends;
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
        {isLoading ? (
          <div className="flex justify-center py-8">
             <Loader2 className="w-8 h-8 animate-spin text-[#855cd6] opacity-50" />
          </div>
        ) : activeFriends.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm font-bold">
            No friends online.<br/>Add some friends to play with!
          </div>
        ) : (
          activeFriends.map(friend => (
            <div key={friend.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                     <span className="text-white font-bold">{(friend.username || friend.displayName || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  {/* Mocking online status for now since presence isn't fully implemented in DB */}
                  <Circle className={cn(
                    "w-3 h-3 absolute -bottom-1 -right-1 rounded-full fill-current",
                    "text-emerald-500" 
                  )} />
                </div>
                
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white">
                    {friend.username || friend.displayName || "Unknown"}
                  </span>
                  <span className="text-xs text-white/40 truncate w-32">
                    In Lobby
                  </span>
                </div>
              </div>

              <button className="opacity-0 group-hover:opacity-100 bg-[#855cd6] hover:bg-[#7042c1] text-white text-xs font-bold px-3 py-1.5 rounded transition-all">
                Invite
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

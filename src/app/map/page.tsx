"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Map as MapIcon, 
  Navigation, 
  Search, 
  Plus, 
  Minus, 
  Compass, 
  Loader2,
  Users as UsersIcon,
  UserPlus,
  Check,
  X,
  CompassIcon,
  RefreshCw,
  Locate
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, setDoc, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function XakteirMapsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "friends">("map");

  // Friends states
  const [friendSearch, setFriendSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Map refs
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const watchIdRef = useRef<number | null>(null);

  // Load Leaflet Assets dynamically
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(link);
        document.head.removeChild(script);
      } catch (e) {}
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Sync Geolocation and Watch Position
  useEffect(() => {
    if (!user || !firestore) return;

    if (navigator.geolocation) {
      // 1. Get initial position
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocation(coords);
          setLoading(false);
          updateUserLocation(coords.lat, coords.lon);
        },
        () => {
          const fallback = { lat: 51.5074, lon: -0.1278 }; // London Hub Proxy
          setLocation(fallback);
          setLoading(false);
        }
      );

      // 2. Watch location for real-time tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocation(coords);
          updateUserLocation(coords.lat, coords.lon);
        },
        null,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocation({ lat: 51.5074, lon: -0.1278 });
      setLoading(false);
    }
  }, [user, firestore]);

  const updateUserLocation = async (lat: number, lon: number) => {
    if (!user || !firestore) return;
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        location: { lat, lon },
        lastActiveMap: serverTimestamp()
      });
    } catch (e) {}
  };

  // Fetch all users to map friend profiles
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), limit(100));
  }, [firestore]);
  const { data: allUsers } = useCollection(usersQuery);

  // Fetch friendships
  const friendshipsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "friendships"));
  }, [firestore, user]);
  const { data: friendships } = useCollection(friendshipsQuery);

  // Filter pending requests received by current user
  const pendingRequests = useMemo(() => {
    if (!friendships || !user) return [];
    return friendships.filter(f => f.recipientEmail?.toLowerCase() === user.email?.toLowerCase() && f.status === "pending");
  }, [friendships, user]);

  // Extract friend IDs
  const friendIds = useMemo(() => {
    if (!friendships || !user) return [];
    const accepted = friendships.filter(f => f.status === "accepted" && (f.requesterId === user.uid || f.recipientEmail?.toLowerCase() === user.email?.toLowerCase()));
    return accepted.map(f => f.requesterId === user.uid ? f.recipientId : f.requesterId);
  }, [friendships, user]);

  // Map active friends profile details containing location
  const activeFriends = useMemo(() => {
    if (!allUsers || friendIds.length === 0) return [];
    return allUsers.filter(u => friendIds.includes(u.id));
  }, [allUsers, friendIds]);

  // Leaflet Map Initialization and Markers updates
  useEffect(() => {
    if (!leafletLoaded || !location) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      mapRef.current = L.map("leaflet-map-holder", { zoomControl: false }).setView([location.lat, location.lon], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20
      }).addTo(mapRef.current);
    }

    // Update Me marker
    if (markersRef.current["me"]) {
      markersRef.current["me"].setLatLng([location.lat, location.lon]);
    } else {
      const meAvatar = user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`;
      const meIcon = L.divIcon({
        className: 'custom-me-marker-div',
        html: `<div style="position:relative; width:42px; height:42px; display:flex; align-items:center; justify-content:center;">
          <div style="background-image: url('${meAvatar}'); background-size: cover; background-position: center; width:36px; height:36px; border-radius:50%; border:3px solid #3b82f6; box-shadow:0 0 15px rgba(59,130,246,0.7); background-color:#0f172a;"></div>
          <div style="position:absolute; bottom:2px; right:2px; background:#22c55e; width:10px; height:10px; border-radius:50%; border:1.5px solid white;"></div>
        </div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });
      markersRef.current["me"] = L.marker([location.lat, location.lon], { icon: meIcon })
        .addTo(mapRef.current)
        .bindPopup("<b>Me (You)</b>");
    }

    // Clean up markers of users who are no longer active friends
    const activeFriendIds = activeFriends.map(f => f.id);
    Object.keys(markersRef.current).forEach(id => {
      if (id !== "me" && !activeFriendIds.includes(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Update friends markers
    activeFriends.forEach(friend => {
      if (friend.location?.lat && friend.location?.lon) {
        if (markersRef.current[friend.id]) {
          markersRef.current[friend.id].setLatLng([friend.location.lat, friend.location.lon]);
        } else {
          const friendAvatar = friend.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${friend.id}`;
          const friendIcon = L.divIcon({
            className: 'custom-friend-marker-div',
            html: `<div style="position:relative; width:42px; height:42px; display:flex; align-items:center; justify-content:center;">
              <div style="background-image: url('${friendAvatar}'); background-size: cover; background-position: center; width:36px; height:36px; border-radius:50%; border:3px solid #ec4899; box-shadow:0 0 15px rgba(236,72,153,0.7); background-color:#0f172a;"></div>
              <div style="position:absolute; bottom:2px; right:2px; background:#ec4899; width:10px; height:10px; border-radius:50%; border:1.5px solid white;"></div>
            </div>`,
            iconSize: [42, 42],
            iconAnchor: [21, 21]
          });
          markersRef.current[friend.id] = L.marker([friend.location.lat, friend.location.lon], { icon: friendIcon })
            .addTo(mapRef.current)
            .bindPopup(`<b>${friend.displayName || "Friend Node"}</b><br/>Location coordinates updated.`);
        }
      }
    });

  }, [leafletLoaded, location, activeFriends]);

  const handleSendFriendRequest = async () => {
    if (!user || !firestore || !friendSearch.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const target = friendSearch.trim().toLowerCase();
      // Find matching user by email
      const q = query(collection(firestore, "users"), where("email", "==", target));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast({ variant: "destructive", title: "User Not Found", description: "No profile matches this email address." });
        setIsProcessing(false);
        return;
      }

      const friendDoc = snap.docs[0];
      const friendData = friendDoc.data();

      if (friendDoc.id === user.uid) {
        toast({ variant: "destructive", title: "Error", description: "You cannot friend yourself." });
        setIsProcessing(false);
        return;
      }

      const id = [user.uid, friendDoc.id].sort().join("_");
      await setDoc(doc(firestore, "friendships", id), {
        id,
        requesterId: user.uid,
        requesterName: user.displayName?.replace(/^@+/, "") || "Member",
        requesterEmail: user.email,
        recipientId: friendDoc.id,
        recipientName: friendData.displayName?.replace(/^@+/, "") || friendData.username || "Member",
        recipientEmail: friendData.email,
        status: "pending",
        timestamp: serverTimestamp()
      });

      toast({ title: "Request Sent!", description: `Friend request sent to ${friendData.email}.` });
      setFriendSearch("");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send request." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptFriend = async (friendshipId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "friendships", friendshipId), {
        status: "accepted",
        acceptedAt: serverTimestamp()
      });
      toast({ title: "Friend Request Accepted!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to accept request." });
    }
  };

  const handleDeclineFriend = async (friendshipId: string) => {
    if (!firestore) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, "friendships", friendshipId));
      toast({ title: "Request Declined" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error declined request" });
    }
  };

  const panToTarget = (lat: number, lon: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 15);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto py-6 animate-fade-in px-6 h-[calc(100vh-140px)] flex flex-col gap-6 text-foreground">
      {/* Header Panel */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 glass-card p-6 rounded-[2.5rem] border-white/10 shadow-2xl relative z-[100] bg-black/40">
        <div className="flex items-center gap-4 pl-4 border-r border-white/10 pr-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><MapIcon className="w-6 h-6 text-blue-500" /></div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Ecosystem Maps</h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-black/45 p-1 rounded-xl border border-white/5 relative z-20">
          <button 
            onClick={() => setActiveTab("map")}
            className={cn("px-6 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "map" ? "bg-blue-600 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5")}
          >
            Map View
          </button>
          <button 
            onClick={() => setActiveTab("friends")}
            className={cn("px-6 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2", activeTab === "friends" ? "bg-blue-600 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5")}
          >
            <UsersIcon className="w-3.5 h-3.5" /> Friends Locator ({activeFriends.length})
          </button>
        </div>

        <div className="flex items-center gap-4 pr-4">
          <Button onClick={() => { if (location) panToTarget(location.lat, location.lon); }} variant="ghost" size="icon" className="rounded-xl h-11 w-11 hover:bg-white/5"><Locate className="w-6 h-6 text-blue-400" /></Button>
          <Badge className="bg-blue-600 text-white font-black text-[9px] px-4 py-2 border-none">GRID LATENCY: ACTIVE</Badge>
        </div>
      </header>

      {/* Main split stage */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left Side: Map Holder */}
        <div className="flex-1 bg-zinc-950 rounded-[4rem] border-8 border-white/5 relative overflow-hidden shadow-2xl h-full min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Syncing Geo-Registry...</p>
            </div>
          ) : (
            <div id="leaflet-map-holder" className="w-full h-full" />
          )}

          {/* Map zoom controls */}
          <div className="absolute bottom-10 right-10 flex flex-col gap-4 z-[400]">
            <Card className="glass-card p-2 rounded-3xl border-white/10 flex flex-col gap-2 shadow-2xl bg-black/60">
              <Button size="icon" variant="ghost" onClick={() => mapRef.current?.zoomIn()} className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary text-white"><Plus className="w-5 h-5" /></Button>
              <Button size="icon" variant="ghost" onClick={() => mapRef.current?.zoomOut()} className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary text-white"><Minus className="w-5 h-5" /></Button>
            </Card>
          </div>
        </div>

        {/* Right Side: Friends / Add requests panel */}
        {activeTab === "friends" && (
          <aside className="w-full lg:w-96 glass-card p-8 rounded-[3rem] border-4 border-white/10 bg-zinc-950/40 shadow-3xl flex flex-col gap-8 shrink-0 overflow-y-auto h-full">
            {/* Add Friend form */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-white flex items-center gap-2"><UserPlus className="w-4.5 h-4.5 text-blue-500" /> Link Friend Node</h3>
              <div className="flex gap-2">
                <Input
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="Friend's email..."
                  className="bg-black/60 border-white/5 h-11 rounded-xl text-xs font-bold text-white"
                />
                <Button 
                  onClick={handleSendFriendRequest} 
                  disabled={isProcessing || !friendSearch.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-11 px-4 font-black text-xs border-none"
                >
                  Link
                </Button>
              </div>
            </div>

            {/* Friend Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-4 border-t border-white/5 pt-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pending Requests ({pendingRequests.length})</h4>
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-white">@{req.requesterName}</p>
                        <p className="text-[8px] font-bold text-zinc-500 truncate max-w-[160px]">{req.requesterEmail}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleAcceptFriend(req.id)} size="icon" className="w-8 h-8 rounded-lg bg-green-600 hover:bg-green-500 border-none text-white"><Check className="w-4 h-4" /></Button>
                        <Button onClick={() => handleDeclineFriend(req.id)} size="icon" className="w-8 h-8 rounded-lg bg-rose-600 hover:bg-rose-500 border-none text-white"><X className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active friends listing */}
            <div className="space-y-4 border-t border-white/5 pt-6 flex-1 flex flex-col min-h-0">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Friends Location ({activeFriends.length})</h4>
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {activeFriends.map((friend) => {
                  const hasLoc = friend.location?.lat && friend.location?.lon;
                  return (
                    <div 
                      key={friend.id} 
                      onClick={() => { if (hasLoc) panToTarget(friend.location.lat, friend.location.lon); }}
                      className={cn(
                        "p-4 bg-white/5 border rounded-2xl flex items-center justify-between transition-all select-none",
                        hasLoc ? "border-pink-500/20 hover:border-pink-500/40 cursor-pointer" : "border-transparent opacity-50"
                      )}
                    >
                      <div>
                        <h4 className="text-sm font-black text-white uppercase italic">{friend.displayName || friend.username || "Member"}</h4>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase mt-1 tracking-wider">
                          {hasLoc ? `Coordinates: ${friend.location.lat.toFixed(4)}, ${friend.location.lon.toFixed(4)}` : "Geo Offline"}
                        </p>
                      </div>
                      {hasLoc && (
                        <Navigation className="w-4.5 h-4.5 text-pink-500 rotate-45 animate-pulse" />
                      )}
                    </div>
                  );
                })}

                {activeFriends.length === 0 && (
                  <div className="py-20 text-center opacity-25 space-y-4">
                    <UsersIcon className="w-12 h-12 mx-auto text-zinc-500 animate-float" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No Friend Nodes Linked</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

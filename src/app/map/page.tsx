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
  RefreshCw,
  Locate,
  ArrowLeftRight,
  Play,
  Pause,
  Square,
  FastForward,
  Gauge,
  ShieldAlert,
  Car,
  Bike,
  Footprints,
  MapPin,
  Flag,
  CircleDot,
  CheckCircle2,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, setDoc, getDocs, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- EIRCODE DATABASE & RESOLVER ---
const EIRCODE_DATABASE: Record<string, { name: string, lat: number, lon: number }> = {
  "D01": { name: "Dublin 1", lat: 53.3533, lon: -6.2603 },
  "D02": { name: "Dublin 2", lat: 53.3414, lon: -6.2576 },
  "D03": { name: "Dublin 3", lat: 53.3644, lon: -6.2238 },
  "D04": { name: "Dublin 4", lat: 53.3248, lon: -6.2255 },
  "D05": { name: "Dublin 5", lat: 53.3831, lon: -6.1953 },
  "D06": { name: "Dublin 6", lat: 53.3184, lon: -6.2736 },
  "D06W": { name: "Dublin 6W", lat: 53.3072, lon: -6.2991 },
  "D07": { name: "Dublin 7", lat: 53.3578, lon: -6.2872 },
  "D08": { name: "Dublin 8", lat: 53.3377, lon: -6.2828 },
  "D09": { name: "Dublin 9", lat: 53.3794, lon: -6.2514 },
  "D10": { name: "Dublin 10", lat: 53.3424, lon: -6.3486 },
  "D11": { name: "Dublin 11", lat: 53.3929, lon: -6.2942 },
  "D12": { name: "Dublin 12", lat: 53.3195, lon: -6.3218 },
  "D13": { name: "Dublin 13", lat: 53.3957, lon: -6.1558 },
  "D14": { name: "Dublin 14", lat: 53.2982, lon: -6.2435 },
  "D15": { name: "Dublin 15", lat: 53.3854, lon: -6.3815 },
  "D16": { name: "Dublin 16", lat: 53.2797, lon: -6.2764 },
  "D17": { name: "Dublin 17", lat: 53.4024, lon: -6.1989 },
  "D18": { name: "Dublin 18", lat: 53.2555, lon: -6.1953 },
  "D20": { name: "Dublin 20", lat: 53.3512, lon: -6.3689 },
  "D22": { name: "Dublin 22", lat: 53.3248, lon: -6.3986 },
  "D24": { name: "Dublin 24", lat: 53.2845, lon: -6.3742 },
  "T12": { name: "Cork City Southside", lat: 51.8904, lon: -8.4716 },
  "T23": { name: "Cork City Northside", lat: 51.9124, lon: -8.4795 },
  "T37": { name: "Carrigaline", lat: 51.8018, lon: -8.3888 },
  "T45": { name: "Cobh", lat: 51.8510, lon: -8.2974 },
  "T56": { name: "Midleton", lat: 51.9150, lon: -8.1747 },
  "H91": { name: "Galway City", lat: 53.2707, lon: -9.0568 },
  "V94": { name: "Limerick City", lat: 52.6638, lon: -8.6268 },
  "X91": { name: "Waterford City", lat: 52.2593, lon: -7.1101 },
  "R95": { name: "Kilkenny City", lat: 52.6541, lon: -7.2448 },
  "V93": { name: "Killarney", lat: 52.0599, lon: -9.5044 },
  "F91": { name: "Sligo Town", lat: 54.2766, lon: -8.4761 },
  "N37": { name: "Athlone", lat: 53.4229, lon: -7.9365 },
  "Y35": { name: "Wexford Town", lat: 52.3369, lon: -6.4633 },
  "W91": { name: "Naas", lat: 53.2185, lon: -6.6669 },
  "A91": { name: "Dundalk", lat: 53.9979, lon: -6.4060 },
  "A92": { name: "Drogheda", lat: 53.7144, lon: -6.3483 },
  "A65": { name: "Maynooth", lat: 53.3814, lon: -6.5914 },
  "E41": { name: "Thurles", lat: 52.6806, lon: -7.8136 },
  "F23": { name: "Castlebar", lat: 53.8519, lon: -9.2989 },
  "K32": { name: "Ardee", lat: 53.8550, lon: -6.5386 },
  "P17": { name: "Kinsale", lat: 51.7061, lon: -8.5303 },
  "P24": { name: "Cobh Country", lat: 51.8744, lon: -8.2541 },
  "P25": { name: "Youghal", lat: 51.9542, lon: -7.8504 },
  "P31": { name: "Macroom", lat: 51.9028, lon: -8.9592 },
  "P36": { name: "Bandon", lat: 51.7454, lon: -8.7424 },
  "P43": { name: "Clonakilty", lat: 51.6214, lon: -8.8894 },
  "P47": { name: "Dunmanway", lat: 51.7208, lon: -9.1125 },
  "P51": { name: "Mallow", lat: 52.1354, lon: -8.6433 },
  "P56": { name: "Charleville", lat: 52.3533, lon: -8.6833 },
  "P61": { name: "Fermoy", lat: 52.1481, lon: -8.2778 },
  "P67": { name: "Mitchelstown", lat: 52.2775, lon: -8.2694 },
  "P72": { name: "Bantry", lat: 51.6800, lon: -9.4500 },
  "P75": { name: "Skibbereen", lat: 51.5519, lon: -9.2636 },
  "P81": { name: "Castletownbere", lat: 51.6500, lon: -9.9000 },
  "P85": { name: "Bantry Country", lat: 51.7000, lon: -9.5500 },
};

const EIRCODE_REGEX = /^[A-Z0-9]{3}[A-Z0-9]{4}$/;

const resolveEirCodeLocal = (code: string) => {
  const clean = code.replace(/\s+/g, "").toUpperCase();
  if (clean.length !== 7) return null;
  
  // Dublin 6W special case
  let routingKey = "";
  if (clean.startsWith("D6W")) {
    routingKey = "D6W";
  } else {
    routingKey = clean.substring(0, 3);
  }
  
  const base = EIRCODE_DATABASE[routingKey];
  if (!base) return null;
  
  // Extract unique 4-character suffix
  const suffix = clean.substring(routingKey.length);
  
  // Hash suffix to generate a deterministic offset
  let hash = 0;
  for (let i = 0; i < suffix.length; i++) {
    hash += suffix.charCodeAt(i) * (i + 1);
  }
  
  // Deterministic offset within ~1km range
  const latOffset = Math.sin(hash) * 0.007; 
  const lonOffset = Math.cos(hash) * 0.011; 
  
  return {
    lat: base.lat + latOffset,
    lon: base.lon + lonOffset,
    name: `${clean.substring(0, 3)} ${clean.substring(3)} (EirCode Area: ${base.name})`
  };
};

// --- HELPER MATH FUNCTIONS ---
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function getPositionAtDistance(coords: [number, number][], distance: number): [number, number] | null {
  if (!coords || coords.length === 0) return null;
  if (distance <= 0) return coords[0];
  
  let accumulatedDistance = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i+1];
    const d = getDistance(p1[0], p1[1], p2[0], p2[1]);
    
    if (accumulatedDistance + d >= distance) {
      const remaining = distance - accumulatedDistance;
      const ratio = remaining / d;
      const lat = p1[0] + (p2[0] - p1[0]) * ratio;
      const lon = p1[1] + (p2[1] - p1[1]) * ratio;
      return [lat, lon];
    }
    accumulatedDistance += d;
  }
  return coords[coords.length - 1];
}

const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

const formatDuration = (seconds: number) => {
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} hr${hrs > 1 ? 's' : ''} ${remMins} min`;
  }
  return `${mins} min`;
};

const renderTurnIcon = (modifier: string) => {
  const mod = (modifier || "").toLowerCase();
  if (mod.includes("left")) {
    return <ArrowUpLeft className="w-7 h-7 text-white" />;
  }
  if (mod.includes("right")) {
    return <ArrowUpRight className="w-7 h-7 text-white" />;
  }
  if (mod.includes("straight") || mod.includes("continue")) {
    return <ArrowUp className="w-7 h-7 text-white" />;
  }
  if (mod.includes("arrive") || mod.includes("destination")) {
    return <Flag className="w-7 h-7 text-emerald-400 fill-emerald-400" />;
  }
  return <CircleDot className="w-7 h-7 text-white" />;
};

export default function XakteirMapsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [mapLayer, setMapLayer] = useState<"dark" | "light" | "osm" | "satellite">("dark");

  // Search points state
  const [startQuery, setStartQuery] = useState("My Location");
  const [destQuery, setDestQuery] = useState("");
  const [startPoint, setStartPoint] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [destPoint, setDestPoint] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [startSuggestions, setStartSuggestions] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [activeSearchInput, setActiveSearchInput] = useState<"start" | "dest" | null>(null);
  const [travelMode, setTravelMode] = useState<"driving" | "cycling" | "walking">("driving");
  
  // Route details
  const [routeDetails, setRouteDetails] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);

  // Journey simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [simDistanceTravelled, setSimDistanceTravelled] = useState(0); 
  const [simSpeed, setSimSpeed] = useState(0); 
  const [simSpeedLimit, setSimSpeedLimit] = useState(50); 
  const [simMultiplier, setSimMultiplier] = useState(5); 
  const [simManualSpeedOverride, setSimManualSpeedOverride] = useState<number | null>(null);
  const [arrived, setArrived] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStepProgress, setCurrentStepProgress] = useState({ instruction: "", distanceRemaining: 0, modifier: "" });

  // Friends states
  const [friendSearch, setFriendSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Map refs
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const watchIdRef = useRef<number | null>(null);
  const tileLayerRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);
  const endMarkerRef = useRef<any>(null);
  const carMarkerRef = useRef<any>(null);
  const routeBgPolylineRef = useRef<any>(null);
  const routeFgPolylineRef = useRef<any>(null);

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
    const handleSuccess = (pos: GeolocationPosition) => {
      const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      setLocation(coords);
      setLoading(false);
      setStartPoint({ lat: coords.lat, lon: coords.lon, name: "My Location" });
      setStartQuery("My Location");
      updateUserLocation(coords.lat, coords.lon);
    };

    const handleFailure = () => {
      // Graceful fallback to Dublin City Centre, Ireland
      const fallback = { lat: 53.3498, lon: -6.2603 };
      setLocation(fallback);
      setLoading(false);
      setStartPoint({ lat: fallback.lat, lon: fallback.lon, name: "Dublin City Centre" });
      setStartQuery("Dublin City Centre");
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleFailure);

      // Watch location only if user is authenticated and firestore exists
      if (user && firestore) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            setLocation(coords);
            updateUserLocation(coords.lat, coords.lon);
          },
          null,
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } else {
      handleFailure();
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

  // Leaflet Map Initialization
  useEffect(() => {
    if (!leafletLoaded || !location) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      mapRef.current = L.map("leaflet-map-holder", { zoomControl: false }).setView([location.lat, location.lon], 13);
      
      // Setup Map Click Listener
      mapRef.current.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        const popupContent = document.createElement("div");
        popupContent.className = "flex flex-col gap-2 p-1.5 font-sans";
        popupContent.innerHTML = `
          <p class="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Select Action</p>
          <button id="btn-set-start" class="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Set as Start</button>
          <button id="btn-set-dest" class="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition">Set Destination</button>
        `;
        
        const popup = L.popup()
          .setLatLng([lat, lng])
          .setContent(popupContent)
          .openOn(mapRef.current);
          
        setTimeout(() => {
          const startBtn = document.getElementById("btn-set-start");
          const destBtn = document.getElementById("btn-set-dest");
          if (startBtn) {
            startBtn.onclick = () => {
              setStartPoint({ lat, lon: lng, name: `Map Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
              setStartQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              mapRef.current.closePopup();
            };
          }
          if (destBtn) {
            destBtn.onclick = () => {
              setDestPoint({ lat, lon: lng, name: `Map Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
              setDestQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              mapRef.current.closePopup();
            };
          }
        }, 60);
      });
    }

    // Update Me marker
    if (markersRef.current["me"]) {
      markersRef.current["me"].setLatLng([location.lat, location.lon]);
    } else {
      const meAvatar = user?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.uid || 'guest'}`;
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

  }, [leafletLoaded, location, activeFriends, user]);

  // Handle layer switching
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let url = "";
    let attr = "";

    if (mapLayer === "light") {
      url = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      attr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
    } else if (mapLayer === "osm") {
      url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      attr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    } else if (mapLayer === "satellite") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    } else {
      url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      attr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }

    tileLayerRef.current = L.tileLayer(url, {
      attribution: attr,
      maxZoom: 20
    }).addTo(mapRef.current);
  }, [mapLayer, leafletLoaded]);

  // Update markers for route points
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (startPoint) {
      if (startMarkerRef.current) {
        startMarkerRef.current.setLatLng([startPoint.lat, startPoint.lon]);
      } else {
        startMarkerRef.current = L.marker([startPoint.lat, startPoint.lon], {
          icon: L.divIcon({
            className: "start-marker",
            html: `<div style="display:flex; align-items:center; justify-content:center; width:30px; height:30px; background:rgba(34,197,94,0.2); border:2.5px solid #22c55e; border-radius:50%; box-shadow:0 0 10px rgba(34,197,94,0.5);">
              <div style="width:10px; height:10px; background:#22c55e; border-radius:50%;"></div>
            </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(mapRef.current).bindPopup(`<b>Start Point</b><br/>${startPoint.name}`);
      }
    } else {
      if (startMarkerRef.current) {
        startMarkerRef.current.remove();
        startMarkerRef.current = null;
      }
    }

    if (destPoint) {
      if (endMarkerRef.current) {
        endMarkerRef.current.setLatLng([destPoint.lat, destPoint.lon]);
      } else {
        endMarkerRef.current = L.marker([destPoint.lat, destPoint.lon], {
          icon: L.divIcon({
            className: "dest-marker-pulse",
            html: `<div style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; animation: bounce-marker 1s infinite alternate;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
              </svg>
            </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36]
          })
        }).addTo(mapRef.current).bindPopup(`<b>Destination Point</b><br/>${destPoint.name}`);
      }
    } else {
      if (endMarkerRef.current) {
        endMarkerRef.current.remove();
        endMarkerRef.current = null;
      }
    }
  }, [startPoint, destPoint, leafletLoaded]);

  // Route drawing logic
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (routeBgPolylineRef.current) {
      routeBgPolylineRef.current.remove();
      routeBgPolylineRef.current = null;
    }
    if (routeFgPolylineRef.current) {
      routeFgPolylineRef.current.remove();
      routeFgPolylineRef.current = null;
    }

    if (routeCoords.length > 0) {
      routeBgPolylineRef.current = L.polyline(routeCoords, {
        color: "#2563eb",
        weight: 9,
        opacity: 0.35,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(mapRef.current);

      routeFgPolylineRef.current = L.polyline(routeCoords, {
        color: "#3b82f6",
        weight: 5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(mapRef.current);

      if (!isSimulating) {
        mapRef.current.fitBounds(L.polyline(routeCoords).getBounds(), {
          padding: [60, 60]
        });
      }
    }
  }, [routeCoords, leafletLoaded, isSimulating]);

  // Car animation updates
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (!isSimulating) {
      if (carMarkerRef.current) {
        carMarkerRef.current.remove();
        carMarkerRef.current = null;
      }
      return;
    }

    const pos = getPositionAtDistance(routeCoords, simDistanceTravelled);
    if (!pos) return;

    const nextPos = getPositionAtDistance(routeCoords, simDistanceTravelled + 4);
    const bearing = nextPos ? getBearing(pos[0], pos[1], nextPos[0], nextPos[1]) : 0;

    if (carMarkerRef.current) {
      carMarkerRef.current.setLatLng(pos);
      carMarkerRef.current.setIcon(L.divIcon({
        className: 'car-navigation-marker',
        html: `<div style="transform: rotate(${bearing}deg); transition: transform 0.1s ease; display:flex; align-items:center; justify-content:center; width:44px; height:44px;">
          <div style="position: absolute; width:34px; height:34px; background:rgba(59,130,246,0.3); border:2px solid #60a5fa; border-radius:50%; animation: pulse-radar 2s infinite; pointer-events:none;"></div>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2.5px 6px rgba(0,0,0,0.6));">
            <path d="M12 2L19 19L12 15L5 19L12 2Z" fill="#3b82f6" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round"/>
          </svg>
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      }));
    } else {
      carMarkerRef.current = L.marker(pos, {
        icon: L.divIcon({
          className: 'car-navigation-marker',
          html: `<div style="transform: rotate(${bearing}deg); display:flex; align-items:center; justify-content:center; width:44px; height:44px;">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L19 19L12 15L5 19L12 2Z" fill="#3b82f6" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round"/>
            </svg>
          </div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        })
      }).addTo(mapRef.current);
    }

    mapRef.current.setView(pos, Math.max(16, mapRef.current.getZoom()));
  }, [simDistanceTravelled, isSimulating, leafletLoaded]);

  // Suggestions fetching debounces
  useEffect(() => {
    if (activeSearchInput !== "start" || startQuery === "My Location" || startQuery.trim().length < 3) {
      setStartSuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      const suggestions = await getSuggestions(startQuery);
      setStartSuggestions(suggestions);
    }, 450);
    return () => clearTimeout(delay);
  }, [startQuery, activeSearchInput]);

  useEffect(() => {
    if (activeSearchInput !== "dest" || destQuery.trim().length < 3) {
      setDestSuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      const suggestions = await getSuggestions(destQuery);
      setDestSuggestions(suggestions);
    }, 450);
    return () => clearTimeout(delay);
  }, [destQuery, activeSearchInput]);

  // Calculate route auto-run on inputs change
  useEffect(() => {
    if (startPoint && destPoint) {
      handleCalculateRoute();
    }
  }, [startPoint, destPoint, travelMode]);

  // Main Simulation Loop
  useEffect(() => {
    if (!isSimulating || !routeDetails || routeCoords.length === 0) return;

    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000; // time delta in seconds
      lastTime = now;

      setSimDistanceTravelled((prevDist) => {
        const currentPos = getPositionAtDistance(routeCoords, prevDist);
        const nextPos = getPositionAtDistance(routeCoords, prevDist + 15);

        let limit = 50; 
        const totalDistance = routeDetails.distance;

        // Apply dynamic speed limits based on distance
        if (prevDist < 400 || (totalDistance - prevDist) < 400) {
          limit = 50; // Urban
        } else if (totalDistance > 8000) {
          limit = 120; // Motorway
        } else if (totalDistance > 2500) {
          limit = 80; // National
        } else {
          limit = 60; // Regional
        }

        // Speed limit adjustment for curves
        if (currentPos && nextPos) {
          const currentBearing = getBearing(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
          const farPos = getPositionAtDistance(routeCoords, prevDist + 45);
          if (farPos) {
            const farBearing = getBearing(nextPos[0], nextPos[1], farPos[0], farPos[1]);
            const angleDiff = Math.abs(currentBearing - farBearing);
            const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;
            
            if (normalizedDiff > 35) {
              limit = Math.min(limit, 30); 
            } else if (normalizedDiff > 15) {
              limit = Math.min(limit, 50); 
            }
          }
        }

        setSimSpeedLimit(limit);

        // Adjust speed
        let targetSpeed = limit;
        if (simManualSpeedOverride !== null) {
          targetSpeed = simManualSpeedOverride;
        }

        // Random organic speed wobble
        const fluctuation = Math.sin(now / 1500) * 1.5;
        const finalTarget = Math.max(0, targetSpeed + (simManualSpeedOverride !== null ? 0 : fluctuation));

        setSimSpeed((prevSpeed) => {
          const diff = finalTarget - prevSpeed;
          const rate = diff > 0 ? 8 : 15; // Accelerates slower, decelerates quicker
          const newSpeed = prevSpeed + diff * (rate * dt);
          return Math.max(0, newSpeed);
        });

        // Compute step distance
        const speedMs = (simSpeed || 0.1) / 3.6;
        const step = speedMs * dt * simMultiplier;
        const nextDist = prevDist + step;

        if (nextDist >= totalDistance) {
          clearInterval(interval);
          setIsSimulating(false);
          setArrived(true);
          return totalDistance;
        }

        return nextDist;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isSimulating, routeCoords, routeDetails, simMultiplier, simManualSpeedOverride, simSpeed]);

  // Synchronize route instructions
  useEffect(() => {
    if (!routeDetails || !steps || steps.length === 0 || !isSimulating) return;

    let currentStep = steps[0];
    let nextStep = steps[1];
    let nextIdx = 0;

    for (let i = 0; i < steps.length; i++) {
      if (simDistanceTravelled >= steps[i].startDistance && simDistanceTravelled < steps[i].endDistance) {
        currentStep = steps[i];
        nextStep = steps[i + 1] || null;
        nextIdx = i;
        break;
      }
    }

    setCurrentStepIndex(nextIdx);
    const distRemaining = currentStep.endDistance - simDistanceTravelled;

    let instruction = "";
    let modifier = "";

    if (nextStep) {
      instruction = `In ${formatDistance(distRemaining)}, ${nextStep.maneuver.instruction}`;
      modifier = nextStep.maneuver.modifier || nextStep.maneuver.type || "";
    } else {
      instruction = "Arriving at destination shortly";
      modifier = "arrive";
    }

    setCurrentStepProgress({
      instruction,
      distanceRemaining: distRemaining,
      modifier
    });
  }, [simDistanceTravelled, routeDetails, steps, isSimulating]);

  // Global Geocoding Suggestion Engine
  const getSuggestions = async (queryStr: string) => {
    // Check if valid EirCode format first
    const eirClean = queryStr.replace(/\s+/g, "").toUpperCase();
    if (EIRCODE_REGEX.test(eirClean)) {
      const resolved = resolveEirCodeLocal(eirClean);
      if (resolved) {
        return [{
          name: `EirCode: ${queryStr.toUpperCase()} (${resolved.name})`,
          lat: resolved.lat,
          lon: resolved.lon
        }];
      }
    }

    // Call OSM Nominatim API
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "XakteirMaps/1.0"
        }
      });
      const data = await res.json();
      return data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      }));
    } catch (e) {
      return [];
    }
  };

  // Fetch Route from OSRM
  const fetchRoute = async (start: { lat: number, lon: number }, end: { lat: number, lon: number }, mode: "driving" | "cycling" | "walking") => {
    const profile = mode === "driving" ? "car" : mode === "cycling" ? "bike" : "foot";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson&steps=true`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === "Ok") {
        return data.routes[0];
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleCalculateRoute = async () => {
    if (!startPoint || !destPoint) return;

    setRoutingLoading(true);
    setRouteDetails(null);
    setRouteCoords([]);
    setSteps([]);
    setArrived(false);
    setIsSimulating(false);
    setSimDistanceTravelled(0);
    setSimSpeed(0);

    const route = await fetchRoute(startPoint, destPoint, travelMode);
    setRoutingLoading(false);

    if (!route) {
      toast({ variant: "destructive", title: "Routing Error", description: "Could not map a driving/walking route between these points." });
      return;
    }

    const coords = route.geometry.coordinates.map((coord: any) => [coord[1], coord[0]] as [number, number]);
    setRouteCoords(coords);
    setRouteDetails(route);

    let accum = 0;
    const stepsWithDistances = route.legs[0].steps.map((step: any) => {
      const start = accum;
      accum += step.distance;
      return {
        ...step,
        startDistance: start,
        endDistance: accum
      };
    });
    setSteps(stepsWithDistances);
  };

  const handleSendFriendRequest = async () => {
    if (!user || !firestore || !friendSearch.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const target = friendSearch.trim().toLowerCase();
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

  const swapStartEnd = () => {
    if (isSimulating) return;
    const tempPoint = startPoint;
    const tempQuery = startQuery;
    setStartPoint(destPoint);
    setStartQuery(destQuery);
    setDestPoint(tempPoint);
    setDestQuery(tempQuery);
  };

  const startJourney = () => {
    if (!routeDetails || routeCoords.length === 0) return;
    setIsSimulating(true);
    setSimDistanceTravelled(0);
    setSimSpeed(0);
    setArrived(false);
    setSimManualSpeedOverride(null);
  };

  const resetJourney = () => {
    setIsSimulating(false);
    setRouteDetails(null);
    setRouteCoords([]);
    setSteps([]);
    setDestPoint(null);
    setDestQuery("");
    setArrived(false);
    setSimDistanceTravelled(0);
  };

  // Speedometer Dash math
  const maxSpeed = 180;
  const radius = 42;
  const circ = 2 * Math.PI * radius; // ~263.89
  const arcLength = circ * 0.75; // 270 degree dial = ~197.92
  const speedRatio = Math.min(simSpeed, maxSpeed) / maxSpeed;
  const strokeDashoffset = arcLength - speedRatio * arcLength;
  const isSpeeding = simSpeed > simSpeedLimit;

  return (
    <div className="w-full h-[calc(100vh-68px)] animate-fade-in text-foreground relative overflow-hidden flex flex-col">
      <style>{`
        @keyframes bounce-marker {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }
        @keyframes pulse-radar {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes pulse-speeding {
          0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.8); }
          50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.9); border-color: rgba(239, 68, 68, 1); }
        }
        .speeding-alert-container {
          animation: pulse-speeding 1s infinite;
        }
      `}</style>

      {/* Main stage - takes up full viewport */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-zinc-950 z-[900]">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Syncing Geo-Registry...</p>
          </div>
        ) : (
          <div id="leaflet-map-holder" className="w-full h-full rounded-none border-none z-10" />
        )}

        {/* FLOATING MAP LAYERS PICKER (Bottom-Left) */}
        {!loading && (
          <div className="absolute bottom-10 left-10 z-[400] flex gap-2">
            <Card className="glass-card p-1.5 rounded-2xl border-white/10 flex gap-1 shadow-2xl bg-black/60">
              <Button 
                size="sm" 
                variant={mapLayer === "dark" ? "default" : "ghost"}
                onClick={() => setMapLayer("dark")}
                className={cn("text-[9px] font-black uppercase tracking-wider h-8 rounded-lg px-3", mapLayer === "dark" ? "bg-blue-600" : "text-white")}
              >
                Dark
              </Button>
              <Button 
                size="sm" 
                variant={mapLayer === "light" ? "default" : "ghost"}
                onClick={() => setMapLayer("light")}
                className={cn("text-[9px] font-black uppercase tracking-wider h-8 rounded-lg px-3", mapLayer === "light" ? "bg-blue-600" : "text-white")}
              >
                Light
              </Button>
              <Button 
                size="sm" 
                variant={mapLayer === "osm" ? "default" : "ghost"}
                onClick={() => setMapLayer("osm")}
                className={cn("text-[9px] font-black uppercase tracking-wider h-8 rounded-lg px-3", mapLayer === "osm" ? "bg-blue-600" : "text-white")}
              >
                Street
              </Button>
              <Button 
                size="sm" 
                variant={mapLayer === "satellite" ? "default" : "ghost"}
                onClick={() => setMapLayer("satellite")}
                className={cn("text-[9px] font-black uppercase tracking-wider h-8 rounded-lg px-3", mapLayer === "satellite" ? "bg-blue-600" : "text-white")}
              >
                Satellite
              </Button>
            </Card>
          </div>
        )}

        {/* Map zoom controls */}
        <div className="absolute bottom-10 right-10 flex flex-col gap-4 z-[400]">
          <Card className="glass-card p-2 rounded-3xl border-white/10 flex flex-col gap-2 shadow-2xl bg-black/60">
            <Button size="icon" variant="ghost" onClick={() => mapRef.current?.zoomIn()} className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary text-white"><Plus className="w-5 h-5" /></Button>
            <Button size="icon" variant="ghost" onClick={() => mapRef.current?.zoomOut()} className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary text-white"><Minus className="w-5 h-5" /></Button>
          </Card>
        </div>

        {/* FLOATING FRIENDS LIST TOGGLE (Top-Right) */}
        {!loading && (
          <div className="absolute top-6 right-6 z-[400] flex gap-3 pointer-events-auto">
            <Button
              onClick={() => setFriendsOpen(!friendsOpen)}
              className={cn(
                "glass-card border-white/10 text-white rounded-2xl flex items-center gap-2 h-12 px-5 font-black text-xs uppercase tracking-widest",
                friendsOpen ? "bg-pink-600/90 hover:bg-pink-500/90 border-pink-500" : "bg-black/75 hover:bg-black/90"
              )}
            >
              <UsersIcon className="w-4 h-4 text-pink-500" />
              Friends ({activeFriends.length})
            </Button>
            <Button 
              onClick={() => { if (location) panToTarget(location.lat, location.lon); }} 
              variant="ghost" 
              size="icon" 
              className="glass-card bg-black/75 hover:bg-black/90 border-white/10 rounded-2xl h-12 w-12 text-blue-400"
            >
              <Locate className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* GOOGLE MAPS FLOATING SEARCH / ROUTE BUILDER (Top-Left) */}
        {!loading && !isSimulating && (
          <div className="absolute top-6 left-6 z-[400] w-[380px] max-w-[calc(100vw-50px)] pointer-events-auto">
            <Card className="glass-card p-6 rounded-[2.5rem] bg-black/75 border-white/10 shadow-3xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <MapIcon className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h1 className="text-sm font-black text-white tracking-tighter uppercase italic leading-none">Xakteir Maps</h1>
                    <p className="text-[7px] font-black uppercase text-zinc-500 tracking-wider mt-0.5">Journey Planner</p>
                  </div>
                </div>
                {routeDetails && (
                  <Button onClick={resetJourney} size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Start & End Input Container */}
              <div className="relative flex flex-col gap-3">
                {/* Vertical connecting line indicator */}
                <div className="absolute left-4.5 top-9.5 bottom-9.5 w-0.5 border-l-2 border-dashed border-zinc-700 pointer-events-none"></div>

                {/* Start Point */}
                <div className="flex items-center gap-3 relative">
                  <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30 shrink-0 z-10">
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      value={startQuery}
                      onFocus={() => setActiveSearchInput("start")}
                      onBlur={() => setTimeout(() => setActiveSearchInput(null), 200)}
                      onChange={(e) => { setStartQuery(e.target.value); if (startPoint) setStartPoint(null); }}
                      placeholder="Enter start location or EirCode..."
                      className="bg-zinc-950/80 border-white/5 h-10 rounded-xl text-xs font-bold text-white pl-4 pr-10"
                    />
                    {startQuery !== "My Location" && (
                      <button 
                        onClick={() => { setStartQuery("My Location"); if (location) setStartPoint({ lat: location.lat, lon: location.lon, name: "My Location" }); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-blue-400 hover:text-blue-300"
                      >
                        GPS
                      </button>
                    )}
                  </div>
                </div>

                {/* Swap Button in between */}
                <div className="flex justify-end pr-4 -my-2.5">
                  <Button 
                    onClick={swapStartEnd} 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="w-7 h-7 bg-zinc-900 border border-white/5 rounded-full hover:bg-zinc-800 text-zinc-400"
                  >
                    <ArrowLeftLeftRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Destination Point */}
                <div className="flex items-center gap-3 relative">
                  <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 shrink-0 z-10">
                    <MapPin className="w-4.5 h-4.5 text-red-500" />
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      value={destQuery}
                      onFocus={() => setActiveSearchInput("dest")}
                      onBlur={() => setTimeout(() => setActiveSearchInput(null), 200)}
                      onChange={(e) => { setDestQuery(e.target.value); if (destPoint) setDestPoint(null); }}
                      placeholder="Choose destination or EirCode..."
                      className="bg-zinc-950/80 border-white/5 h-10 rounded-xl text-xs font-bold text-white pl-4"
                    />
                  </div>
                </div>

                {/* Autocomplete Suggestions */}
                {activeSearchInput === "start" && startSuggestions.length > 0 && (
                  <Card className="absolute top-[44px] left-12 right-0 z-[500] bg-zinc-950/95 border-white/10 rounded-2xl p-2 max-h-48 overflow-y-auto shadow-2xl flex flex-col gap-1">
                    {startSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onMouseDown={() => {
                          setStartPoint({ lat: s.lat, lon: s.lon, name: s.name });
                          setStartQuery(s.name);
                          setStartSuggestions([]);
                        }}
                        className="w-full text-left p-2.5 hover:bg-white/5 rounded-lg text-[10px] font-bold text-zinc-300 truncate"
                      >
                        {s.name}
                      </button>
                    ))}
                  </Card>
                )}

                {activeSearchInput === "dest" && destSuggestions.length > 0 && (
                  <Card className="absolute top-[96px] left-12 right-0 z-[500] bg-zinc-950/95 border-white/10 rounded-2xl p-2 max-h-48 overflow-y-auto shadow-2xl flex flex-col gap-1">
                    {destSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onMouseDown={() => {
                          setDestPoint({ lat: s.lat, lon: s.lon, name: s.name });
                          setDestQuery(s.name);
                          setDestSuggestions([]);
                        }}
                        className="w-full text-left p-2.5 hover:bg-white/5 rounded-lg text-[10px] font-bold text-zinc-300 truncate"
                      >
                        {s.name}
                      </button>
                    ))}
                  </Card>
                )}
              </div>

              {/* Transportation Mode Pickers */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                <Button
                  size="sm"
                  variant={travelMode === "driving" ? "default" : "ghost"}
                  onClick={() => setTravelMode("driving")}
                  className={cn("h-9 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider border border-white/5", travelMode === "driving" ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-white/5")}
                >
                  <Car className="w-3.5 h-3.5" /> Drive
                </Button>
                <Button
                  size="sm"
                  variant={travelMode === "cycling" ? "default" : "ghost"}
                  onClick={() => setTravelMode("cycling")}
                  className={cn("h-9 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider border border-white/5", travelMode === "cycling" ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-white/5")}
                >
                  <Bike className="w-3.5 h-3.5" /> Cycle
                </Button>
                <Button
                  size="sm"
                  variant={travelMode === "walking" ? "default" : "ghost"}
                  onClick={() => setTravelMode("walking")}
                  className={cn("h-9 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider border border-white/5", travelMode === "walking" ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-white/5")}
                >
                  <Footprints className="w-3.5 h-3.5" /> Walk
                </Button>
              </div>

              {/* Route Loading state */}
              {routingLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-blue-400 text-xs font-black uppercase tracking-widest">
                  <Loader2 className="w-4 h-4 animate-spin" /> Routing Path...
                </div>
              )}

              {/* Route stats & Start Journey panel */}
              {routeDetails && !routingLoading && (
                <div className="flex flex-col gap-4 pt-2 border-t border-white/10">
                  <div className="flex justify-between items-center bg-zinc-950/50 p-4 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-lg font-black text-white">{formatDuration(routeDetails.duration)}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mt-0.5">Distance: {formatDistance(routeDetails.distance)}</p>
                    </div>
                    <Badge className="bg-emerald-600 text-white uppercase text-[8px] font-black py-1.5 px-3">Fastest Route</Badge>
                  </div>

                  <Button 
                    onClick={startJourney}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] h-12 w-full font-black text-xs uppercase tracking-widest border-none flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Navigation className="w-4.5 h-4.5 rotate-45" /> Start Journey
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ACTIVE NAVIGATION HUD - TOP BANNER (Green Turn Indicators) */}
        {isSimulating && currentStepProgress && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] w-[450px] max-w-[calc(100vw-30px)]">
            <Card className="bg-emerald-600 border border-emerald-500 rounded-[2.2rem] p-5 shadow-3xl flex items-center gap-4 text-white">
              <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center border border-white/10 shrink-0">
                {renderTurnIcon(currentStepProgress.modifier)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-black tracking-tight leading-tight uppercase line-clamp-2">{currentStepProgress.instruction}</h2>
                <p className="text-[9px] font-bold tracking-widest uppercase text-emerald-200 mt-0.5">Route Navigation HUD</p>
              </div>
            </Card>
          </div>
        )}

        {/* ACTIVE NAVIGATION HUD - BOTTOM DASHBOARD PANEL (Speedometer, limit, progress) */}
        {isSimulating && routeDetails && (
          <div className="absolute bottom-6 left-6 right-6 z-[400] flex flex-col md:flex-row gap-4 justify-between items-center pointer-events-none">
            
            {/* SPEED HUD (LEFT) */}
            <div className="flex gap-4 items-center pointer-events-auto">
              {/* Circular Speedometer */}
              <Card className={cn(
                "glass-card p-4 rounded-[2.5rem] bg-black/80 flex items-center gap-4 shrink-0 transition-all border-white/10",
                isSpeeding && "speeding-alert-container border-rose-500/80"
              )}>
                <div className="relative w-24 h-24 flex items-center justify-center">
                  {/* SVG Gauge */}
                  <svg className="w-24 h-24 transform -rotate-225" viewBox="0 0 100 100">
                    {/* Grey dial background */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="7"
                      strokeDasharray={arcLength}
                      className="stroke-round"
                    />
                    {/* Active Speed line */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke={isSpeeding ? "#ef4444" : "#10b981"}
                      strokeWidth="7"
                      strokeDasharray={arcLength}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-100 ease-out"
                      style={{ strokeLinecap: "round" }}
                    />
                  </svg>
                  {/* Digital display */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={cn("text-2xl font-black italic tracking-tighter leading-none", isSpeeding ? "text-rose-500" : "text-white")}>
                      {Math.round(simSpeed)}
                    </span>
                    <span className="text-[7px] font-black uppercase text-zinc-500 tracking-wider">km/h</span>
                  </div>
                </div>

                {/* Speed Limit Sign & Warning text */}
                <div className="flex flex-col items-center pr-2">
                  {/* European/Irish Circular Speed Limit Sign */}
                  <div className={cn(
                    "w-12 h-12 rounded-full border-4 border-rose-600 bg-white flex items-center justify-center shadow-lg shrink-0",
                    isSpeeding && "animate-bounce"
                  )}>
                    <span className="text-zinc-950 font-black text-sm tracking-tighter">{simSpeedLimit}</span>
                  </div>
                  <span className="text-[7px] font-black uppercase tracking-wider text-zinc-400 mt-1">Limit</span>
                </div>
              </Card>

              {/* Over speed warning indicator */}
              {isSpeeding && (
                <Card className="bg-rose-600 text-white rounded-2xl px-4 py-2 border-none flex items-center gap-2 text-[9px] font-black uppercase tracking-widest animate-pulse shadow-lg shrink-0">
                  <ShieldAlert className="w-4 h-4 animate-bounce" /> SPEED ALERT!
                </Card>
              )}
            </div>

            {/* SIMULATION CONTROLS & TRIP STATUS (MIDDLE / RIGHT) */}
            <Card className="glass-card p-6 rounded-[2.5rem] bg-black/85 border-white/10 shadow-3xl w-full md:max-w-2xl pointer-events-auto flex flex-col md:flex-row items-center gap-6">
              
              {/* Stats Panel */}
              <div className="flex-1 w-full space-y-2 border-r border-white/10 pr-6">
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Remaining ETA</p>
                    <p className="text-base font-black text-white mt-0.5">
                      {formatDuration(((routeDetails.distance - simDistanceTravelled) / (simSpeed || 30)) * 3.6)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Distance</p>
                    <p className="text-xs font-black text-zinc-300 mt-0.5">
                      {formatDistance(routeDetails.distance - simDistanceTravelled)} left
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <Progress 
                  value={(simDistanceTravelled / routeDetails.distance) * 100}
                  className="h-2 bg-zinc-950 border border-white/5 rounded-full"
                />
              </div>

              {/* Control elements */}
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <div className="flex gap-2 justify-center">
                  {/* Pause/Play */}
                  <Button 
                    size="icon" 
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={cn("w-10 h-10 rounded-xl border-none text-white", isSimulating ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500")}
                  >
                    {isSimulating ? <Pause className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5 fill-white" />}
                  </Button>

                  {/* Speed rate multiplier (toggle rates) */}
                  <Button
                    size="sm"
                    onClick={() => setSimMultiplier(prev => prev === 1 ? 5 : prev === 5 ? 10 : prev === 10 ? 25 : prev === 25 ? 50 : 1)}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 h-10 rounded-xl px-3 text-[9px] font-black uppercase text-white tracking-widest shrink-0"
                  >
                    Rate: {simMultiplier}x
                  </Button>

                  {/* End simulation */}
                  <Button 
                    size="icon" 
                    onClick={resetJourney}
                    className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 hover:bg-rose-950 text-rose-500"
                  >
                    <Square className="w-4 h-4 fill-rose-500" />
                  </Button>
                </div>

                {/* Manual speed override slider */}
                <div className="w-44 flex flex-col gap-1 mx-auto">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-zinc-400">
                    <span>Manual Cruise</span>
                    <span className={simManualSpeedOverride !== null ? "text-blue-400" : "text-zinc-500"}>
                      {simManualSpeedOverride !== null ? `${simManualSpeedOverride} km/h` : "Auto"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[simManualSpeedOverride !== null ? simManualSpeedOverride : 50]}
                      onValueChange={(val) => setSimManualSpeedOverride(val[0])}
                      min={0}
                      max={160}
                      step={5}
                      className="flex-1"
                    />
                    {simManualSpeedOverride !== null && (
                      <button 
                        onClick={() => setSimManualSpeedOverride(null)}
                        className="text-[8px] font-black text-rose-500 uppercase tracking-widest"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* FLOATING COLLAPSIBLE FRIENDS PANEL (Right Side Overlay) */}
        {friendsOpen && !loading && (
          <aside className="absolute right-6 top-22 bottom-6 w-96 max-w-[calc(100vw-50px)] glass-card p-6 rounded-[2.5rem] border-white/10 bg-zinc-950/85 shadow-3xl flex flex-col gap-6 overflow-y-auto z-[400] pointer-events-auto">
            {/* Add Friend form */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase italic tracking-tighter text-white flex items-center gap-2"><UserPlus className="w-4.5 h-4.5 text-blue-500" /> Link Friend Node</h3>
              <div className="flex gap-2">
                <Input
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="Friend's email..."
                  className="bg-black/60 border-white/5 h-10 rounded-xl text-xs font-bold text-white"
                />
                <Button 
                  onClick={handleSendFriendRequest} 
                  disabled={isProcessing || !friendSearch.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-10 px-4 font-black text-xs border-none"
                >
                  Link
                </Button>
              </div>
            </div>

            {/* Friend Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-4 border-t border-white/5 pt-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Pending Requests ({pendingRequests.length})</h4>
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
            <div className="space-y-4 border-t border-white/5 pt-4 flex-1 flex flex-col min-h-0">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Active Friends Location ({activeFriends.length})</h4>
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

      {/* TRIP CELEBRATION MODAL OVERLAY */}
      {arrived && routeDetails && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
          <Card className="glass-card max-w-md w-full p-8 rounded-[3.5rem] border-white/10 bg-zinc-950/90 text-center flex flex-col items-center gap-6 relative overflow-hidden shadow-3xl">
            {/* Background grid */}
            <div className="absolute inset-0 arcade-grid opacity-5 pointer-events-none" />
            
            {/* Success icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Journey Completed!</h2>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">You have arrived safely at your destination.</p>
            </div>

            {/* Trip summary details */}
            <div className="w-full bg-zinc-900/50 rounded-3xl p-5 border border-white/5 grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Total Distance</span>
                <span className="text-sm font-black text-white">{formatDistance(routeDetails.distance)}</span>
              </div>
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Travel Duration</span>
                <span className="text-sm font-black text-white">{formatDuration(routeDetails.duration)}</span>
              </div>
            </div>

            <Button 
              onClick={() => { setArrived(false); resetJourney(); }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest w-full h-12 rounded-2xl border-none shadow-lg mt-2"
            >
              Back to Planner
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

// Subcomponent replacement for vertical double arrow icon since lucide doesn't have it standard
function ArrowLeftLeftRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 3 4-4 4 4" />
      <path d="M12 0v20" />
      <path d="m16 21-4 4-4-4" />
    </svg>
  );
}

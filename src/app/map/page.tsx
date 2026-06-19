"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  ArrowUpRight,
  Volume2,
  VolumeX,
  Layers,
  CloudRain,
  Star,
  Heart,
  Home,
  Briefcase,
  Camera,
  Calendar,
  Share2,
  Code2,
  Thermometer,
  Ruler,
  Flame,
  AlertTriangle,
  Globe,
  ChevronRight,
  ChevronLeft,
  Copy,
  ExternalLink,
  Wifi,
  WifiOff,
  Coffee,
  TreePine,
  Building2,
  Fuel,
  Hospital,
  Hotel,
  Clock,
  SlidersHorizontal,
  Info,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, setDoc, getDocs, limit, addDoc, onSnapshot, orderBy } from "firebase/firestore";
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
  "H91": { name: "Galway City", lat: 53.2707, lon: -9.0568 },
  "V94": { name: "Limerick City", lat: 52.6638, lon: -8.6268 },
  "X91": { name: "Waterford City", lat: 52.2593, lon: -7.1101 },
  "IRL": { name: "Ireland (Dublin)", lat: 53.3498, lon: -6.2603 },
  "GBR": { name: "United Kingdom (London)", lat: 51.5074, lon: -0.1278 },
  "FRA": { name: "France (Paris)", lat: 48.8566, lon: 2.3522 },
  "DEU": { name: "Germany (Berlin)", lat: 52.5200, lon: 13.4050 },
  "ESP": { name: "Spain (Madrid)", lat: 40.4168, lon: -3.7038 },
  "ITA": { name: "Italy (Rome)", lat: 41.9028, lon: 12.4964 },
  "USA": { name: "United States (New York)", lat: 40.7128, lon: -74.0060 },
  "POI1": { name: "Cliffs of Moher", lat: 52.9719, lon: -9.4265 },
  "POI2": { name: "Giant's Causeway", lat: 55.2408, lon: -6.5116 },
  "POI3": { name: "Blarney Castle", lat: 51.9292, lon: -8.5708 },
  "POI4": { name: "Guinness Storehouse", lat: 53.3419, lon: -6.2867 },
  "POI6": { name: "Trinity College", lat: 53.3438, lon: -6.2546 },
};

const EIRCODE_REGEX = /^[A-Z0-9]{3}[A-Z0-9]{4}$/;

const resolveEirCodeLocal = (code: string) => {
  const clean = code.replace(/\s+/g, "").toUpperCase();
  if (clean.length !== 7) return null;
  let routingKey = "";
  if (clean.startsWith("D6W")) {
    routingKey = "D6W";
  } else {
    routingKey = clean.substring(0, 3);
  }
  const base = EIRCODE_DATABASE[routingKey];
  if (!base) return null;
  const suffix = clean.substring(routingKey.length);
  let hash = 0;
  for (let i = 0; i < suffix.length; i++) {
    hash += suffix.charCodeAt(i) * (i + 1);
  }
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
  const R = 6371000;
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

// POI category definitions
const POI_CATEGORIES = [
  { key: "restaurant", label: "Restaurants", emoji: "🍽️", color: "#f97316", amenity: "restaurant" },
  { key: "fuel", label: "Fuel", emoji: "⛽", color: "#eab308", amenity: "fuel" },
  { key: "hospital", label: "Hospitals", emoji: "🏥", color: "#ef4444", amenity: "hospital" },
  { key: "atm", label: "ATMs", emoji: "🏧", color: "#22c55e", amenity: "atm" },
  { key: "hotel", label: "Hotels", emoji: "🏨", color: "#8b5cf6", amenity: "hotel" },
  { key: "park", label: "Parks", emoji: "🌳", color: "#10b981", amenity: null, leisure: "park" },
] as const;

// Map style definitions
const MAP_STYLES = [
  { key: "dark", label: "Dark", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr: "© OpenStreetMap © CARTO" },
  { key: "light", label: "Light", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attr: "© OpenStreetMap © CARTO" },
  { key: "osm", label: "Street", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "© OpenStreetMap contributors" },
  { key: "satellite", label: "Satellite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "© Esri" },
  { key: "terrain", label: "Terrain", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attr: "© OpenStreetMap © OpenTopoMap" },
  { key: "retro", label: "Retro", url: "https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", attr: "© OpenStreetMap © HOT" },
] as const;

type MapStyleKey = typeof MAP_STYLES[number]["key"];

export default function XakteirMapsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Core state
  const [location, setLocation] = useState<{lat: number, lon: number, speed?: number | null, accuracy?: number | null} | null>(null);
  const [loading, setLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapStyleKey>("dark");

  // Search / route state
  const [startQuery, setStartQuery] = useState("My Location");
  const [destQuery, setDestQuery] = useState("");
  const [startPoint, setStartPoint] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [destPoint, setDestPoint] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [startSuggestions, setStartSuggestions] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [activeSearchInput, setActiveSearchInput] = useState<"start" | "dest" | null>(null);
  const [travelMode, setTravelMode] = useState<"driving" | "cycling" | "walking">("driving");
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
  const [isNavigatingLive, setIsNavigatingLive] = useState(false);
  const lastTimeRef = useRef<number>(Date.now());
  const lastDistRef = useRef<number>(0);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const spokenRef = useRef<{ stepIndex: number; announced: boolean; closeAnnounced: boolean; nowAnnounced: boolean }>({
    stepIndex: -1, announced: false, closeAnnounced: false, nowAnnounced: false
  });

  // Friends state
  const [friendSearch, setFriendSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ---- FEATURE 1: Traffic Layer ----
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const trafficLayerRef = useRef<any>(null);

  // ---- FEATURE 5: Saved Places ----
  const [savedPlacesOpen, setSavedPlacesOpen] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [addPlaceMode, setAddPlaceMode] = useState(false);
  const [pendingPlaceLatlng, setPendingPlaceLatlng] = useState<{lat: number; lng: number} | null>(null);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceIcon, setNewPlaceIcon] = useState<"home" | "work" | "star" | "heart">("star");
  const savedPlaceMarkersRef = useRef<Record<string, any>>({});

  // ---- FEATURE 6: POI Layers ----
  const [activePOI, setActivePOI] = useState<Set<string>>(new Set());
  const [poiOpen, setPoiOpen] = useState(false);
  const poiMarkersRef = useRef<Record<string, any[]>>({});

  // ---- FEATURE 7: Weather Overlay ----
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [precipEnabled, setPrecipEnabled] = useState(false);
  const [cloudsEnabled, setCloudsEnabled] = useState(false);
  const [weatherOpacity, setWeatherOpacity] = useState(0.6);
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const precipLayerRef = useRef<any>(null);
  const cloudsLayerRef = useRef<any>(null);
  const OWM_KEY = process.env.NEXT_PUBLIC_OWM_KEY || "439d4b804bc8187953eb36d2a8c26a02";

  // ---- FEATURE 8: Event Pins ----
  const [eventPinsOpen, setEventPinsOpen] = useState(false);
  const [mapEvents, setMapEvents] = useState<any[]>([]);
  const [addEventMode, setAddEventMode] = useState(false);
  const [pendingEventLatlng, setPendingEventLatlng] = useState<{lat: number; lng: number} | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const eventMarkersRef = useRef<Record<string, any>>({});

  // ---- FEATURE 11: Measure Distance ----
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<{lat: number; lng: number}[]>([]);
  const measureMarkersRef = useRef<any[]>([]);
  const measurePolylineRef = useRef<any>(null);

  // ---- FEATURE 12: Geolocation Tracking (enhanced) ----
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const accuracyCircleRef = useRef<any>(null);
  const pulseDotRef = useRef<any>(null);

  // ---- FEATURE 13: Photo Map ----
  const [photosOpen, setPhotosOpen] = useState(false);
  const [mapPhotos, setMapPhotos] = useState<any[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);
  const [photoLayerEnabled, setPhotoLayerEnabled] = useState(false);
  const photoMarkersRef = useRef<Record<string, any>>({});
  const [addPhotoMode, setAddPhotoMode] = useState(false);
  const [pendingPhotoLatlng, setPendingPhotoLatlng] = useState<{lat: number; lng: number} | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  // ---- FEATURE 14: Boundary Viewer ----
  const [boundaryEnabled, setBoundaryEnabled] = useState(false);
  const boundaryLayersRef = useRef<any[]>([]);

  // ---- FEATURE 15: Offline Mode ----
  const [isOnline, setIsOnline] = useState(true);
  const [offlineBannerVisible, setOfflineBannerVisible] = useState(false);

  // ---- FEATURE 16: Location Share Link ----
  const [sharedLocationMarkerRef] = useState<React.MutableRefObject<any>>({ current: null });

  // ---- FEATURE 17: Embed Mode ----
  const [isEmbedMode, setIsEmbedMode] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);

  // ---- FEATURE 18: Historical Slider ----
  const [historyMode, setHistoryMode] = useState(false);
  const [historyYear, setHistoryYear] = useState(2020);
  const historyLayerRef = useRef<any>(null);

  // ---- FEATURE 19: Heatmap ----
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const heatmapLayerRef = useRef<any>(null);
  const heatmapScriptLoaded = useRef(false);

  // ---- FEATURE 10: Explore Nearby ----
  const [exploreOpen, setExploreOpen] = useState(false);
  const [exploreResults, setExploreResults] = useState<any[]>([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreCategory, setExploreCategory] = useState("coffee");

  // ---- Context Menu (Feature 20: Reverse Geocode) ----
  const [contextMenu, setContextMenu] = useState<{x: number; y: number; lat: number; lng: number} | null>(null);
  const [reverseGeoResult, setReverseGeoResult] = useState<any>(null);
  const [reverseGeoLoading, setReverseGeoLoading] = useState(false);

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
  const locationShareIntervalRef = useRef<any>(null);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);

  // ---- FEATURE 9: Search Autocomplete (existing) + topbar search ----
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSuggestions, setGlobalSuggestions] = useState<{name: string; lat: number; lon: number}[]>([]);
  const [globalSearchActive, setGlobalSearchActive] = useState(false);
  const globalSearchMarkerRef = useRef<any>(null);

  // ---- LEFT SIDEBAR PANELS ----
  const [leftPanel, setLeftPanel] = useState<"route" | "saved" | "poi" | "explore" | "events" | "photos" | "measure" | null>("route");

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

    // Check URL params for embed mode, shared location, etc.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("embed") === "true") setIsEmbedMode(true);
    }

    return () => {
      try {
        document.head.removeChild(link);
        document.head.removeChild(script);
      } catch (e) {}
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (locationShareIntervalRef.current) {
        clearInterval(locationShareIntervalRef.current);
      }
    };
  }, []);

  // ---- FEATURE 15: Online/Offline detection ----
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineBannerVisible(false);
      toast({ title: "✅ Connected", description: "You are back online." });
    };
    const handleOffline = () => {
      setIsOnline(false);
      setOfflineBannerVisible(true);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) setOfflineBannerVisible(true);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync Geolocation and Watch Position
  useEffect(() => {
    const handleSuccess = (pos: GeolocationPosition) => {
      const coords = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        speed: pos.coords.speed,
        accuracy: pos.coords.accuracy
      };
      setLocation(coords);
      setLoading(false);
      setStartPoint({ lat: coords.lat, lon: coords.lon, name: "My Location" });
      setStartQuery("My Location");
      updateUserLocation(coords.lat, coords.lon);
    };

    const handleFailure = () => {
      const fallback = { lat: 53.3498, lon: -6.2603, speed: 0, accuracy: null };
      setLocation(fallback);
      setLoading(false);
      setStartPoint({ lat: fallback.lat, lon: fallback.lon, name: "Dublin City Centre" });
      setStartQuery("Dublin City Centre");
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleFailure);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy
          };
          setLocation(coords);
          if (user && firestore) {
            updateUserLocation(coords.lat, coords.lon);
          }
        },
        null,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      handleFailure();
    }
  }, [user, firestore]);

  // ---- FEATURE 16: Handle shared location from URL params ----
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    const params = new URLSearchParams(window.location.search);
    const sharedLat = parseFloat(params.get("lat") || "");
    const sharedLng = parseFloat(params.get("lng") || "");
    const sharedZoom = parseInt(params.get("zoom") || "13");
    if (!isNaN(sharedLat) && !isNaN(sharedLng)) {
      mapRef.current.setView([sharedLat, sharedLng], sharedZoom);
      if (sharedLocationMarkerRef.current) sharedLocationMarkerRef.current.remove();
      sharedLocationMarkerRef.current = L.marker([sharedLat, sharedLng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:#a855f7;border:3px solid white;border-radius:50%;width:20px;height:20px;box-shadow:0 0 12px #a855f7;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(mapRef.current).bindPopup("<b>📍 Shared Location</b>").openPopup();
    }
  }, [leafletLoaded, mapRef.current]);

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

  // Fetch all users
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

  const pendingRequests = useMemo(() => {
    if (!friendships || !user) return [];
    return friendships.filter(f => f.recipientEmail?.toLowerCase() === user.email?.toLowerCase() && f.status === "pending");
  }, [friendships, user]);

  const friendIds = useMemo(() => {
    if (!friendships || !user) return [];
    const accepted = friendships.filter(f => f.status === "accepted" && (f.requesterId === user.uid || f.recipientEmail?.toLowerCase() === user.email?.toLowerCase()));
    return accepted.map(f => f.requesterId === user.uid ? f.recipientId : f.requesterId);
  }, [friendships, user]);

  const activeFriends = useMemo(() => {
    if (!allUsers || friendIds.length === 0) return [];
    return allUsers.filter(u => friendIds.includes(u.id));
  }, [allUsers, friendIds]);

  // ---- FEATURE 8: Load map events from Firestore ----
  useEffect(() => {
    if (!firestore) return;
    const unsub = onSnapshot(collection(firestore, "mapEvents"), (snap) => {
      setMapEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [firestore]);

  // ---- FEATURE 13: Load photos from Firestore ----
  useEffect(() => {
    if (!firestore) return;
    const unsub = onSnapshot(collection(firestore, "mapPhotos"), (snap) => {
      setMapPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [firestore]);

  // ---- FEATURE 5: Load saved places from Firestore ----
  useEffect(() => {
    if (!firestore || !user) return;
    const unsub = onSnapshot(
      collection(firestore, "users", user.uid, "savedPlaces"),
      (snap) => {
        setSavedPlaces(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsub();
  }, [firestore, user]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!leafletLoaded || !location) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      mapRef.current = L.map("leaflet-map-holder", { zoomControl: false }).setView([location.lat, location.lon], 13);

      // Map click handler (multi-purpose)
      mapRef.current.on("click", (e: any) => {
        const { lat, lng } = e.latlng;

        // Close context menu on map click
        setContextMenu(null);
        setReverseGeoResult(null);

        // Measure mode
        if (measureMode) {
          setMeasurePoints(prev => [...prev, { lat, lng }]);
          return;
        }

        // Add event mode
        if (addEventMode) {
          setPendingEventLatlng({ lat, lng });
          return;
        }

        // Add photo mode
        if (addPhotoMode) {
          setPendingPhotoLatlng({ lat, lng });
          return;
        }

        // Add place mode
        if (addPlaceMode) {
          setPendingPlaceLatlng({ lat, lng });
          return;
        }

        // Default popup
        const popupContent = document.createElement("div");
        popupContent.className = "flex flex-col gap-2 p-1.5 font-sans";
        popupContent.innerHTML = `
          <p class="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Select Action</p>
          <button id="btn-set-start" class="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Set as Start</button>
          <button id="btn-set-dest" class="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition">Set Destination</button>
        `;

        L.popup()
          .setLatLng([lat, lng])
          .setContent(popupContent)
          .openOn(mapRef.current);

        setTimeout(() => {
          const startBtn = document.getElementById("btn-set-start");
          const destBtn = document.getElementById("btn-set-dest");
          if (startBtn) {
            startBtn.onclick = () => {
              setStartPoint({ lat, lon: lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
              setStartQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              mapRef.current.closePopup();
            };
          }
          if (destBtn) {
            destBtn.onclick = () => {
              setDestPoint({ lat, lon: lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
              setDestQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              mapRef.current.closePopup();
            };
          }
        }, 60);
      });

      // ---- FEATURE 20: Right-click context menu (reverse geocode) ----
      mapRef.current.on("contextmenu", (e: any) => {
        const { lat, lng } = e.latlng;
        const containerPoint = e.containerPoint;
        setContextMenu({ x: containerPoint.x, y: containerPoint.y, lat, lng });
        setReverseGeoResult(null);
        setReverseGeoLoading(true);
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: { "User-Agent": "XakteirMaps/1.0", "Accept-Language": "en" }
        })
          .then(r => r.json())
          .then(data => {
            setReverseGeoResult(data);
            setReverseGeoLoading(false);
          })
          .catch(() => setReverseGeoLoading(false));
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

    // Clean up old friend markers
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
            .bindPopup(`<b>${friend.displayName || "Friend"}</b><br/>Sharing location`);
        }
      }
    });

  }, [leafletLoaded, location, activeFriends, user, measureMode, addEventMode, addPhotoMode, addPlaceMode]);

  // Tile layer switching (Features 2 + 18)
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    if (historyMode) {
      // ---- FEATURE 18: Historical Esri Wayback ----
      if (historyLayerRef.current) historyLayerRef.current.remove();
      const waybackUrl = `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${historyYear}/{z}/{y}/{x}`;
      historyLayerRef.current = L.tileLayer(waybackUrl, {
        attribution: `© Esri Wayback ${historyYear}`,
        maxZoom: 18,
        errorTileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      }).addTo(mapRef.current);
      tileLayerRef.current = historyLayerRef.current;
    } else {
      const style = MAP_STYLES.find(s => s.key === mapLayer) || MAP_STYLES[0];
      tileLayerRef.current = L.tileLayer(style.url, {
        attribution: style.attr,
        maxZoom: 20
      }).addTo(mapRef.current);
    }
  }, [mapLayer, leafletLoaded, historyMode, historyYear]);

  // ---- FEATURE 1: Traffic layer toggle ----
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;
    if (trafficEnabled) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = L.tileLayer(
          "https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png",
          { opacity: 0.6, attribution: "© OpenStreetMap traffic data" }
        ).addTo(mapRef.current);
      }
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.remove();
        trafficLayerRef.current = null;
      }
    }
  }, [trafficEnabled, leafletLoaded]);

  // ---- FEATURE 7: Weather overlay ----
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (precipEnabled) {
      if (!precipLayerRef.current) {
        precipLayerRef.current = L.tileLayer(
          `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
          { opacity: weatherOpacity, attribution: "© OpenWeatherMap" }
        ).addTo(mapRef.current);
      } else {
        precipLayerRef.current.setOpacity(weatherOpacity);
      }
    } else {
      if (precipLayerRef.current) { precipLayerRef.current.remove(); precipLayerRef.current = null; }
    }

    if (cloudsEnabled) {
      if (!cloudsLayerRef.current) {
        cloudsLayerRef.current = L.tileLayer(
          `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
          { opacity: weatherOpacity, attribution: "© OpenWeatherMap" }
        ).addTo(mapRef.current);
      } else {
        cloudsLayerRef.current.setOpacity(weatherOpacity);
      }
    } else {
      if (cloudsLayerRef.current) { cloudsLayerRef.current.remove(); cloudsLayerRef.current = null; }
    }
  }, [precipEnabled, cloudsEnabled, weatherOpacity, leafletLoaded]);

  // Fetch current weather for map center
  useEffect(() => {
    if (!location || !weatherOpen) return;
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${OWM_KEY}&units=metric`)
      .then(r => r.json())
      .then(d => setCurrentWeather(d))
      .catch(() => {});
  }, [location, weatherOpen]);

  // ---- FEATURE 11: Measure distance drawing ----
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear old measure markers/lines
    measureMarkersRef.current.forEach(m => m.remove());
    measureMarkersRef.current = [];
    if (measurePolylineRef.current) { measurePolylineRef.current.remove(); measurePolylineRef.current = null; }

    if (measurePoints.length === 0) return;

    measurePoints.forEach((pt, i) => {
      const m = L.circleMarker([pt.lat, pt.lng], {
        radius: 6,
        fillColor: "#f59e0b",
        color: "#ffffff",
        weight: 2,
        fillOpacity: 1
      }).addTo(mapRef.current).bindTooltip(`Point ${i + 1}`, { permanent: false });
      measureMarkersRef.current.push(m);
    });

    if (measurePoints.length > 1) {
      const latlngs = measurePoints.map(p => [p.lat, p.lng] as [number, number]);
      measurePolylineRef.current = L.polyline(latlngs, { color: "#f59e0b", weight: 3, dashArray: "8,6" }).addTo(mapRef.current);
      // Show total distance tooltip on last point
      let totalDist = 0;
      for (let i = 0; i < measurePoints.length - 1; i++) {
        totalDist += getDistance(measurePoints[i].lat, measurePoints[i].lng, measurePoints[i+1].lat, measurePoints[i+1].lng);
      }
      const last = measurePoints[measurePoints.length - 1];
      L.popup()
        .setLatLng([last.lat, last.lng])
        .setContent(`<b>Total: ${formatDistance(totalDist)}</b>`)
        .openOn(mapRef.current);
    }
  }, [measurePoints, leafletLoaded]);

  // ---- FEATURE 12: Geolocation tracking (pulsing dot + accuracy circle) ----
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || !location) return;
    const L = (window as any).L;
    if (!L) return;

    if (trackingEnabled) {
      // Accuracy circle
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng([location.lat, location.lon]);
        if (location.accuracy) accuracyCircleRef.current.setRadius(location.accuracy);
      } else {
        accuracyCircleRef.current = L.circle([location.lat, location.lon], {
          radius: location.accuracy || 50,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
          weight: 1.5
        }).addTo(mapRef.current);
      }
      // Pulsing dot
      if (pulseDotRef.current) {
        pulseDotRef.current.setLatLng([location.lat, location.lon]);
      } else {
        pulseDotRef.current = L.marker([location.lat, location.lon], {
          icon: L.divIcon({
            className: "",
            html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:24px;height:24px;background:rgba(59,130,246,0.3);border-radius:50%;animation:pulse-radar 1.5s infinite;"></div>
              <div style="width:12px;height:12px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 0 8px #3b82f6;"></div>
            </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(mapRef.current);
      }
      mapRef.current.panTo([location.lat, location.lon]);
    } else {
      if (accuracyCircleRef.current) { accuracyCircleRef.current.remove(); accuracyCircleRef.current = null; }
      if (pulseDotRef.current) { pulseDotRef.current.remove(); pulseDotRef.current = null; }
    }
  }, [trackingEnabled, location, leafletLoaded]);

  // ---- FEATURE 8: Event pin markers ----
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    // Remove markers for events no longer present
    const currentIds = new Set(mapEvents.map(e => e.id));
    Object.keys(eventMarkersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        eventMarkersRef.current[id].remove();
        delete eventMarkersRef.current[id];
      }
    });

    mapEvents.forEach(ev => {
      if (!ev.lat || !ev.lng) return;
      if (eventMarkersRef.current[ev.id]) return;
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#7c3aed;border:2px solid white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(124,58,237,0.6);">📅</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      eventMarkersRef.current[ev.id] = L.marker([ev.lat, ev.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(`<b>${ev.name}</b><br/>${ev.date || ""}<br/><span style="font-size:11px">${ev.description || ""}</span>`);
    });
  }, [mapEvents, leafletLoaded]);

  // ---- FEATURE 13: Photo markers ----
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || !photoLayerEnabled) return;
    const L = (window as any).L;
    if (!L) return;

    const currentIds = new Set(mapPhotos.map(p => p.id));
    Object.keys(photoMarkersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        photoMarkersRef.current[id].remove();
        delete photoMarkersRef.current[id];
      }
    });

    mapPhotos.forEach(ph => {
      if (!ph.lat || !ph.lng || !ph.url) return;
      if (photoMarkersRef.current[ph.id]) return;
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:36px;height:36px;border-radius:6px;border:2px solid white;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.5);cursor:pointer;">
          <img src="${ph.url}" style="width:100%;height:100%;object-fit:cover;" />
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      photoMarkersRef.current[ph.id] = L.marker([ph.lat, ph.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(`<b>${ph.caption || "Photo"}</b>`);
    });
  }, [mapPhotos, photoLayerEnabled, leafletLoaded]);

  // Remove photo markers when layer disabled
  useEffect(() => {
    if (!photoLayerEnabled) {
      Object.values(photoMarkersRef.current).forEach(m => m.remove());
      photoMarkersRef.current = {};
    }
  }, [photoLayerEnabled]);

  // ---- FEATURE 5: Saved places markers ----
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    const currentIds = new Set(savedPlaces.map(p => p.id));
    Object.keys(savedPlaceMarkersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        savedPlaceMarkersRef.current[id].remove();
        delete savedPlaceMarkersRef.current[id];
      }
    });

    savedPlaces.forEach(pl => {
      if (!pl.lat || !pl.lng) return;
      if (savedPlaceMarkersRef.current[pl.id]) return;
      const emojiMap: Record<string, string> = { home: "🏠", work: "💼", star: "⭐", heart: "❤️" };
      const emoji = emojiMap[pl.icon] || "📍";
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#1e293b;border:2px solid #60a5fa;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(96,165,250,0.5);">${emoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      savedPlaceMarkersRef.current[pl.id] = L.marker([pl.lat, pl.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(`<b>${pl.name}</b>`);
    });
  }, [savedPlaces, leafletLoaded]);

  // ---- FEATURE 19: Heatmap ----
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (!heatmapEnabled) {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.remove();
        heatmapLayerRef.current = null;
      }
      return;
    }

    const loadHeat = () => {
      const points = [
        ...mapEvents.filter(e => e.lat && e.lng).map(e => [e.lat, e.lng, 0.8]),
        ...mapPhotos.filter(p => p.lat && p.lng).map(p => [p.lat, p.lng, 0.6]),
      ];
      if (heatmapLayerRef.current) heatmapLayerRef.current.remove();
      if (typeof (L as any).heatLayer !== "undefined" && points.length > 0) {
        heatmapLayerRef.current = (L as any).heatLayer(points, {
          radius: 35,
          blur: 25,
          maxZoom: 17,
          gradient: { 0.2: "#2563eb", 0.5: "#f59e0b", 1.0: "#ef4444" }
        }).addTo(mapRef.current);
      }
    };

    if (!heatmapScriptLoaded.current) {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";
      s.onload = () => { heatmapScriptLoaded.current = true; loadHeat(); };
      document.head.appendChild(s);
    } else {
      loadHeat();
    }
  }, [heatmapEnabled, mapEvents, mapPhotos, leafletLoaded]);

  // ---- FEATURE 3: Location sharing (friends) ----
  useEffect(() => {
    if (!user || !firestore || !location) return;
    if (locationSharingEnabled) {
      const shareNow = async () => {
        try {
          await updateDoc(doc(firestore, "users", user.uid), {
            sharingLocation: true,
            location: { lat: location.lat, lon: location.lon, timestamp: serverTimestamp() }
          });
        } catch (e) {}
      };
      shareNow();
      locationShareIntervalRef.current = setInterval(shareNow, 30000);
    } else {
      if (locationShareIntervalRef.current) {
        clearInterval(locationShareIntervalRef.current);
        locationShareIntervalRef.current = null;
      }
      if (user && firestore) {
        updateDoc(doc(firestore, "users", user.uid), { sharingLocation: false }).catch(() => {});
      }
    }
    return () => {
      if (locationShareIntervalRef.current) clearInterval(locationShareIntervalRef.current);
    };
  }, [locationSharingEnabled, user, firestore, location]);

  // Route markers
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
      if (startMarkerRef.current) { startMarkerRef.current.remove(); startMarkerRef.current = null; }
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
        }).addTo(mapRef.current).bindPopup(`<b>Destination</b><br/>${destPoint.name}`);
      }
    } else {
      if (endMarkerRef.current) { endMarkerRef.current.remove(); endMarkerRef.current = null; }
    }
  }, [startPoint, destPoint, leafletLoaded]);

  // Route polyline
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (routeBgPolylineRef.current) { routeBgPolylineRef.current.remove(); routeBgPolylineRef.current = null; }
    if (routeFgPolylineRef.current) { routeFgPolylineRef.current.remove(); routeFgPolylineRef.current = null; }

    if (routeCoords.length > 0) {
      routeBgPolylineRef.current = L.polyline(routeCoords, {
        color: "#2563eb", weight: 9, opacity: 0.35, lineCap: "round", lineJoin: "round"
      }).addTo(mapRef.current);
      routeFgPolylineRef.current = L.polyline(routeCoords, {
        color: "#3b82f6", weight: 5, opacity: 0.9, lineCap: "round", lineJoin: "round"
      }).addTo(mapRef.current);
      if (!isSimulating && !isNavigatingLive) {
        mapRef.current.fitBounds(L.polyline(routeCoords).getBounds(), { padding: [60, 60] });
      }
    }
  }, [routeCoords, leafletLoaded, isSimulating, isNavigatingLive]);

  // Car animation
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (!isSimulating && !isNavigatingLive) {
      if (carMarkerRef.current) { carMarkerRef.current.remove(); carMarkerRef.current = null; }
      return;
    }

    let pos: [number, number] | null = null;
    let bearing = 0;

    if (isSimulating) {
      pos = getPositionAtDistance(routeCoords, simDistanceTravelled);
      if (pos) {
        const nextPos = getPositionAtDistance(routeCoords, simDistanceTravelled + 4);
        bearing = nextPos ? getBearing(pos[0], pos[1], nextPos[0], nextPos[1]) : 0;
      }
    } else if (isNavigatingLive && location) {
      pos = [location.lat, location.lon];
      const { closestIdx } = findClosestPointAndDistance(routeCoords, location.lat, location.lon);
      if (closestIdx !== undefined && closestIdx < routeCoords.length - 1) {
        const nextPoint = routeCoords[closestIdx + 1];
        bearing = getBearing(pos[0], pos[1], nextPoint[0], nextPoint[1]);
      }
    }

    if (!pos) return;

    const iconHtml = `<div style="transform: rotate(${bearing}deg); transition: transform 0.1s ease; display:flex; align-items:center; justify-content:center; width:44px; height:44px;">
      <div style="position: absolute; width:34px; height:34px; background:rgba(59,130,246,0.3); border:2px solid #60a5fa; border-radius:50%; animation: pulse-radar 2s infinite; pointer-events:none;"></div>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2.5px 6px rgba(0,0,0,0.6));">
        <path d="M12 2L19 19L12 15L5 19L12 2Z" fill="#3b82f6" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round"/>
      </svg>
    </div>`;

    if (carMarkerRef.current) {
      carMarkerRef.current.setLatLng(pos);
      carMarkerRef.current.setIcon(L.divIcon({ className: 'car-navigation-marker', html: iconHtml, iconSize: [44, 44], iconAnchor: [22, 22] }));
    } else {
      carMarkerRef.current = L.marker(pos, {
        icon: L.divIcon({ className: 'car-navigation-marker', html: iconHtml, iconSize: [44, 44], iconAnchor: [22, 22] })
      }).addTo(mapRef.current);
    }

    mapRef.current.setView(pos, Math.max(16, mapRef.current.getZoom()));
  }, [simDistanceTravelled, isSimulating, isNavigatingLive, location, leafletLoaded]);

  // Suggestions debounce
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

  // ---- FEATURE 9: Global search autocomplete ----
  useEffect(() => {
    if (!globalSearchActive || globalSearch.trim().length < 3) {
      setGlobalSuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      const suggestions = await getSuggestions(globalSearch);
      setGlobalSuggestions(suggestions);
    }, 400);
    return () => clearTimeout(delay);
  }, [globalSearch, globalSearchActive]);

  // Route auto-calculate
  useEffect(() => {
    if (startPoint && destPoint) {
      handleCalculateRoute();
    }
  }, [startPoint, destPoint, travelMode]);

  // Simulation loop
  useEffect(() => {
    if (!isSimulating || !routeDetails || routeCoords.length === 0) return;
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setSimDistanceTravelled((prevDist) => {
        const currentPos = getPositionAtDistance(routeCoords, prevDist);
        const nextPos = getPositionAtDistance(routeCoords, prevDist + 15);
        let limit = 50;
        const totalDistance = routeDetails.distance;

        if (travelMode === "walking") { limit = 5; }
        else if (travelMode === "cycling") { limit = 15; }
        else {
          if (prevDist < 400 || (totalDistance - prevDist) < 400) { limit = 50; }
          else if (totalDistance > 8000) { limit = 120; }
          else if (totalDistance > 2500) { limit = 80; }
          else { limit = 60; }

          if (currentPos && nextPos) {
            const currentBearing = getBearing(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
            const farPos = getPositionAtDistance(routeCoords, prevDist + 45);
            if (farPos) {
              const farBearing = getBearing(nextPos[0], nextPos[1], farPos[0], farPos[1]);
              const angleDiff = Math.abs(currentBearing - farBearing);
              const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;
              if (normalizedDiff > 35) { limit = Math.min(limit, 30); }
              else if (normalizedDiff > 15) { limit = Math.min(limit, 50); }
            }
          }
        }

        setSimSpeedLimit(limit);
        let targetSpeed = limit;
        if (simManualSpeedOverride !== null) { targetSpeed = simManualSpeedOverride; }
        const fluctuation = Math.sin(now / 1500) * (travelMode === "walking" ? 0.2 : travelMode === "cycling" ? 0.8 : 1.5);
        const finalTarget = Math.max(0, targetSpeed + (simManualSpeedOverride !== null ? 0 : fluctuation));

        setSimSpeed((prevSpeed) => {
          const diff = finalTarget - prevSpeed;
          const rate = diff > 0 ? 8 : 15;
          const newSpeed = prevSpeed + diff * (rate * dt);
          return Math.max(0, newSpeed);
        });

        const speedMs = (simSpeed || 0.1) / 3.6;
        const step = speedMs * dt * simMultiplier;
        const nextDist = prevDist + step;

        if (nextDist >= totalDistance) {
          clearInterval(interval);
          setIsSimulating(false);
          setArrived(true);
          speakText("You have arrived at your destination. Journey completed.");
          return totalDistance;
        }

        return nextDist;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isSimulating, routeCoords, routeDetails, simMultiplier, simManualSpeedOverride, simSpeed]);

  // Route instructions sync
  useEffect(() => {
    if (!routeDetails || !steps || steps.length === 0 || (!isSimulating && !isNavigatingLive)) return;
    let currentStep = steps[0];
    let nextStep = steps[1];
    let nextIdx = 0;

    for (let i = 0; i < steps.length; i++) {
      if (simDistanceTravelled >= steps[i].startDistance && simDistanceTravelled < steps[i].endDistance) {
        currentStep = steps[i]; nextStep = steps[i + 1] || null; nextIdx = i; break;
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

    setCurrentStepProgress({ instruction, distanceRemaining: distRemaining, modifier });
  }, [simDistanceTravelled, routeDetails, steps, isSimulating, isNavigatingLive]);

  // Live navigation projection
  useEffect(() => {
    if (!isNavigatingLive || !location || !routeCoords || routeCoords.length === 0 || !routeDetails) return;
    const { point, distanceAlong } = findClosestPointAndDistance(routeCoords, location.lat, location.lon);
    if (point) {
      setSimDistanceTravelled(distanceAlong);
      let limitVal = 50;
      const totalDistance = routeDetails.distance;
      if (distanceAlong < 400 || (totalDistance - distanceAlong) < 400) { limitVal = 50; }
      else if (totalDistance > 8000) { limitVal = 120; }
      else if (totalDistance > 2500) { limitVal = 80; }
      else { limitVal = 60; }
      setSimSpeedLimit(limitVal);

      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      const dDist = distanceAlong - lastDistRef.current;
      if (location.speed !== null && location.speed !== undefined) {
        setSimSpeed(location.speed * 3.6);
      } else if (dt > 0.5) {
        setSimSpeed(Math.max(0, (dDist / dt) * 3.6));
        lastTimeRef.current = now;
        lastDistRef.current = distanceAlong;
      }

      if (distanceAlong >= totalDistance - 15) {
        setIsNavigatingLive(false);
        setArrived(true);
        speakText("You have arrived at your destination. Journey completed.");
      }
    }
  }, [location, isNavigatingLive, routeCoords, routeDetails]);

  function findClosestPointAndDistance(coords: [number, number][], userLat: number, userLon: number) {
    if (!coords || coords.length === 0) return { point: null, distanceAlong: 0, closestIdx: 0 };
    let minDistance = Infinity;
    let closestIdx = 0;
    let closestPoint: [number, number] = coords[0];
    for (let i = 0; i < coords.length; i++) {
      const d = getDistance(userLat, userLon, coords[i][0], coords[i][1]);
      if (d < minDistance) { minDistance = d; closestIdx = i; closestPoint = coords[i]; }
    }
    let distanceAlong = 0;
    for (let i = 0; i < closestIdx; i++) {
      distanceAlong += getDistance(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]);
    }
    return { point: closestPoint, distanceAlong, closestIdx };
  }

  // Voice turn instructions
  useEffect(() => {
    if ((!isSimulating && !isNavigatingLive) || !routeDetails || !steps || steps.length === 0 || currentStepIndex === -1) {
      spokenRef.current = { stepIndex: -1, announced: false, closeAnnounced: false, nowAnnounced: false };
      return;
    }
    const currentStep = steps[currentStepIndex];
    const nextStep = steps[currentStepIndex + 1];
    const distRemaining = currentStep.endDistance - simDistanceTravelled;

    if (spokenRef.current.stepIndex !== currentStepIndex) {
      spokenRef.current = { stepIndex: currentStepIndex, announced: false, closeAnnounced: false, nowAnnounced: false };
    }

    if (nextStep) {
      const instruction = nextStep.maneuver.instruction;
      if (!spokenRef.current.announced && distRemaining > 150) {
        speakText(`In ${formatDistance(distRemaining)}, ${instruction}`);
        spokenRef.current.announced = true;
      }
      if (!spokenRef.current.closeAnnounced && distRemaining <= 120 && distRemaining > 30) {
        speakText(`In 100 meters, ${instruction}`);
        spokenRef.current.closeAnnounced = true;
      }
      if (!spokenRef.current.nowAnnounced && distRemaining <= 25) {
        speakText(instruction);
        spokenRef.current.nowAnnounced = true;
      }
    } else {
      if (!spokenRef.current.announced) {
        speakText("You are arriving at your destination.");
        spokenRef.current.announced = true;
      }
    }
  }, [simDistanceTravelled, currentStepIndex, isSimulating, isNavigatingLive, steps, routeDetails, voiceMuted]);

  // ---- Core Functions ----
  const speakText = (text: string) => {
    if (voiceMuted) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getSuggestions = async (queryStr: string) => {
    const eirClean = queryStr.replace(/\s+/g, "").toUpperCase();
    if (EIRCODE_REGEX.test(eirClean)) {
      const resolved = resolveEirCodeLocal(eirClean);
      if (resolved) {
        return [{ name: `EirCode: ${queryStr.toUpperCase()} (${resolved.name})`, lat: resolved.lat, lon: resolved.lon }];
      }
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=5`;
      const res = await fetch(url, { headers: { "Accept-Language": "en-US,en;q=0.9", "User-Agent": "XakteirMaps/1.0" } });
      const data = await res.json();
      return data.map((item: any) => ({ name: item.display_name, lat: parseFloat(item.lat), lon: parseFloat(item.lon) }));
    } catch (e) {
      return [];
    }
  };

  const fetchRoute = async (start: { lat: number, lon: number }, end: { lat: number, lon: number }, mode: "driving" | "cycling" | "walking") => {
    const url = `https://router.project-osrm.org/route/v1/car/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson&steps=true`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === "Ok" && data.routes && data.routes[0]) {
        const route = data.routes[0];
        let speedMps = 13.89;
        if (mode === "cycling") speedMps = 4.17;
        else if (mode === "walking") speedMps = 1.39;
        route.duration = route.distance / speedMps;
        if (route.legs) {
          route.legs.forEach((leg: any) => {
            leg.duration = leg.distance / speedMps;
            if (leg.steps) leg.steps.forEach((step: any) => { step.duration = step.distance / speedMps; });
          });
        }
        return route;
      }
    } catch (e) { console.error(e); }
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
      toast({ variant: "destructive", title: "Routing Error", description: "Could not find a route between these points." });
      return;
    }

    const coords = route.geometry.coordinates.map((coord: any) => [coord[1], coord[0]] as [number, number]);
    setRouteCoords(coords);
    setRouteDetails(route);

    let accum = 0;
    const stepsWithDistances = route.legs[0].steps.map((step: any) => {
      const start = accum;
      accum += step.distance;
      return { ...step, startDistance: start, endDistance: accum };
    });
    setSteps(stepsWithDistances);
  };

  // ---- FEATURE 6: POI layer toggle ----
  const togglePOI = async (categoryKey: string) => {
    if (!mapRef.current || !leafletLoaded || !location) return;
    const L = (window as any).L;
    if (!L) return;

    const newActive = new Set(activePOI);
    if (newActive.has(categoryKey)) {
      newActive.delete(categoryKey);
      poiMarkersRef.current[categoryKey]?.forEach((m: any) => m.remove());
      poiMarkersRef.current[categoryKey] = [];
    } else {
      newActive.add(categoryKey);
      const cat = POI_CATEGORIES.find(c => c.key === categoryKey);
      if (!cat) return;

      const bbox = mapRef.current.getBounds();
      const s = bbox.getSouth().toFixed(4), w = bbox.getWest().toFixed(4), n = bbox.getNorth().toFixed(4), e = bbox.getEast().toFixed(4);
      const cacheKey = `poi_${categoryKey}_${s}_${w}_${n}_${e}`;
      let nodes: any[] = [];

      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        nodes = JSON.parse(cached);
      } else {
        try {
          const amenityTag = cat.amenity ? `amenity=${cat.amenity}` : `leisure=${(cat as any).leisure}`;
          const overpassQuery = `[out:json];node[${amenityTag}](${s},${w},${n},${e});out 30;`;
          const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
          const data = await res.json();
          nodes = data.elements || [];
          sessionStorage.setItem(cacheKey, JSON.stringify(nodes));
        } catch (e) { toast({ variant: "destructive", title: "POI Error", description: "Could not load points of interest." }); }
      }

      poiMarkersRef.current[categoryKey] = nodes.slice(0, 30).map((node: any) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${cat.color};border:2px solid white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${cat.emoji}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        return L.marker([node.lat, node.lon], { icon })
          .addTo(mapRef.current)
          .bindPopup(`<b>${cat.emoji} ${node.tags?.name || cat.label}</b>${node.tags?.opening_hours ? `<br/>🕐 ${node.tags.opening_hours}` : ""}`);
      });
    }
    setActivePOI(newActive);
  };

  // ---- FEATURE 10: Explore Nearby ----
  const handleExplore = async () => {
    if (!mapRef.current || !location) return;
    setExploreLoading(true);
    setExploreResults([]);

    const center = mapRef.current.getCenter();
    const lat = center.lat;
    const lng = center.lng;
    const radius = 1000;

    const categoryMap: Record<string, string> = {
      coffee: "[amenity=cafe]",
      parks: "[leisure=park]",
      museums: "[tourism=museum]",
      restaurants: "[amenity=restaurant]",
    };

    const tag = categoryMap[exploreCategory] || "[amenity=cafe]";

    try {
      const q = `[out:json];node${tag}(around:${radius},${lat},${lng});out 20;`;
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
      const data = await res.json();
      const results = (data.elements || []).map((el: any) => ({
        id: el.id,
        name: el.tags?.name || "Unnamed",
        lat: el.lat,
        lng: el.lon,
        distance: getDistance(lat, lng, el.lat, el.lon),
        tags: el.tags
      })).sort((a: any, b: any) => a.distance - b.distance);
      setExploreResults(results);
    } catch (e) {
      toast({ variant: "destructive", title: "Explore Error", description: "Could not fetch nearby places." });
    }
    setExploreLoading(false);
  };

  // ---- FEATURE 14: Boundary Viewer ----
  const toggleBoundaries = async () => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (boundaryEnabled) {
      boundaryLayersRef.current.forEach(l => l.remove());
      boundaryLayersRef.current = [];
      setBoundaryEnabled(false);
      return;
    }

    setBoundaryEnabled(true);
    const center = mapRef.current.getCenter();

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(center.lat + "," + center.lng)}&format=json&polygon_geojson=1&limit=3`,
        { headers: { "User-Agent": "XakteirMaps/1.0" } }
      );
      const data = await res.json();

      const colors = ["#3b82f6", "#10b981", "#f59e0b"];
      data.slice(0, 3).forEach((item: any, i: number) => {
        if (item.geojson) {
          try {
            const layer = L.geoJSON(item.geojson, {
              style: { color: colors[i], weight: 2, fillOpacity: 0.05, fillColor: colors[i] }
            }).addTo(mapRef.current).bindPopup(`<b>${item.display_name}</b>`);
            boundaryLayersRef.current.push(layer);
          } catch (e) {}
        }
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Boundary Error", description: "Could not load boundaries." });
      setBoundaryEnabled(false);
    }
  };

  // ---- FEATURE 16: Share location link ----
  const shareLocationLink = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    const url = `${window.location.origin}/map?lat=${center.lat.toFixed(6)}&lng=${center.lng.toFixed(6)}&zoom=${zoom}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "📋 Link Copied!", description: "Share this link to show your current map view." });
    });
  };

  // ---- FEATURE 17: Embed code ----
  const getEmbedCode = () => {
    if (!mapRef.current) return "";
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    const url = `${window.location.origin}/map?lat=${center.lat.toFixed(6)}&lng=${center.lng.toFixed(6)}&zoom=${zoom}&embed=true`;
    return `<iframe src="${url}" width="800" height="500" style="border:none;border-radius:12px;" allowfullscreen></iframe>`;
  };

  // ---- FEATURE 5: Save a place ----
  const handleSavePlace = async () => {
    if (!user || !firestore || !pendingPlaceLatlng || !newPlaceName.trim()) return;
    try {
      await addDoc(collection(firestore, "users", user.uid, "savedPlaces"), {
        name: newPlaceName.trim(),
        icon: newPlaceIcon,
        lat: pendingPlaceLatlng.lat,
        lng: pendingPlaceLatlng.lng,
        createdAt: serverTimestamp()
      });
      toast({ title: "✅ Place Saved!", description: newPlaceName });
      setPendingPlaceLatlng(null);
      setNewPlaceName("");
      setAddPlaceMode(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save place." });
    }
  };

  // ---- FEATURE 8: Save event ----
  const handleSaveEvent = async () => {
    if (!firestore || !pendingEventLatlng || !newEventName.trim()) return;
    try {
      await addDoc(collection(firestore, "mapEvents"), {
        name: newEventName.trim(),
        date: newEventDate,
        description: newEventDesc,
        lat: pendingEventLatlng.lat,
        lng: pendingEventLatlng.lng,
        userId: user?.uid || "anonymous",
        createdAt: serverTimestamp()
      });
      toast({ title: "📅 Event Added!", description: newEventName });
      setPendingEventLatlng(null);
      setNewEventName(""); setNewEventDate(""); setNewEventDesc("");
      setAddEventMode(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save event." });
    }
  };

  // ---- FEATURE 13: Save photo pin ----
  const handleSavePhoto = async () => {
    if (!firestore || !pendingPhotoLatlng || !newPhotoUrl.trim()) return;
    try {
      await addDoc(collection(firestore, "mapPhotos"), {
        url: newPhotoUrl.trim(),
        caption: newPhotoCaption,
        lat: pendingPhotoLatlng.lat,
        lng: pendingPhotoLatlng.lng,
        userId: user?.uid || "anonymous",
        createdAt: serverTimestamp()
      });
      toast({ title: "📸 Photo Pinned!" });
      setPendingPhotoLatlng(null);
      setNewPhotoUrl(""); setNewPhotoCaption("");
      setAddPhotoMode(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save photo." });
    }
  };

  // ---- FEATURE 1: Incident reporting ----
  const reportIncident = async (type: string) => {
    if (!firestore || !location) return;
    try {
      await addDoc(collection(firestore, "mapIncidents"), {
        type,
        lat: location.lat,
        lng: location.lon,
        userId: user?.uid || "anonymous",
        timestamp: serverTimestamp()
      });
      toast({ title: `🚨 Incident Reported`, description: `${type} reported at your location.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not report incident." });
    }
  };

  // Friend functions
  const handleSendFriendRequest = async () => {
    if (!user || !firestore || !friendSearch.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const target = friendSearch.trim().toLowerCase();
      const q = query(collection(firestore, "users"), where("email", "==", target));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ variant: "destructive", title: "User Not Found", description: "No profile matches this email." });
        setIsProcessing(false); return;
      }
      const friendDoc = snap.docs[0];
      const friendData = friendDoc.data();
      if (friendDoc.id === user.uid) {
        toast({ variant: "destructive", title: "Error", description: "You cannot friend yourself." });
        setIsProcessing(false); return;
      }
      const id = [user.uid, friendDoc.id].sort().join("_");
      await setDoc(doc(firestore, "friendships", id), {
        id, requesterId: user.uid,
        requesterName: user.displayName?.replace(/^@+/, "") || "Member",
        requesterEmail: user.email,
        recipientId: friendDoc.id,
        recipientName: friendData.displayName?.replace(/^@+/, "") || friendData.username || "Member",
        recipientEmail: friendData.email,
        status: "pending", timestamp: serverTimestamp()
      });
      toast({ title: "Request Sent!" });
      setFriendSearch("");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send request." });
    } finally { setIsProcessing(false); }
  };

  const handleAcceptFriend = async (friendshipId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "friendships", friendshipId), { status: "accepted", acceptedAt: serverTimestamp() });
      toast({ title: "Friend Request Accepted!" });
    } catch (e) { toast({ variant: "destructive", title: "Error", description: "Failed to accept." }); }
  };

  const handleDeclineFriend = async (friendshipId: string) => {
    if (!firestore) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, "friendships", friendshipId));
      toast({ title: "Request Declined" });
    } catch (e) { toast({ variant: "destructive", title: "Error", description: "Failed to decline." }); }
  };

  const panToTarget = (lat: number, lon: number) => {
    if (mapRef.current) { mapRef.current.setView([lat, lon], 15); }
  };

  const swapStartEnd = () => {
    if (isSimulating || isNavigatingLive) return;
    const tempPoint = startPoint; const tempQuery = startQuery;
    setStartPoint(destPoint); setStartQuery(destQuery);
    setDestPoint(tempPoint); setDestQuery(tempQuery);
  };

  const startJourney = () => {
    if (!routeDetails || routeCoords.length === 0) return;
    setIsSimulating(true); setIsNavigatingLive(false);
    setSimDistanceTravelled(0); setSimSpeed(0); setArrived(false);
    setSimManualSpeedOverride(null);
    speakText("Starting journey. Head towards your destination.");
  };

  const startLiveNavigation = () => {
    if (!routeDetails || routeCoords.length === 0) return;
    setIsNavigatingLive(true); setIsSimulating(false);
    setSimDistanceTravelled(0); setSimSpeed(0); setArrived(false);
    setSimManualSpeedOverride(null);
    if (location) {
      const { distanceAlong } = findClosestPointAndDistance(routeCoords, location.lat, location.lon);
      setSimDistanceTravelled(distanceAlong);
      lastDistRef.current = distanceAlong;
    } else { lastDistRef.current = 0; }
    lastTimeRef.current = Date.now();
    speakText("Starting live navigation. Head towards your destination.");
  };

  const resetJourney = () => {
    setIsSimulating(false); setIsNavigatingLive(false);
    setRouteDetails(null); setRouteCoords([]);
    setSteps([]); setDestPoint(null); setDestQuery("");
    setArrived(false); setSimDistanceTravelled(0); setSimSpeed(0);
  };

  // Speedometer math
  const maxSpeed = 180;
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const arcLength = circ * 0.75;
  const speedRatio = Math.min(simSpeed, maxSpeed) / maxSpeed;
  const strokeDashoffset = arcLength - speedRatio * arcLength;
  const isSpeeding = simSpeed > simSpeedLimit;

  // Measure distance total
  const measureTotalDistance = useMemo(() => {
    if (measurePoints.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      total += getDistance(measurePoints[i].lat, measurePoints[i].lng, measurePoints[i+1].lat, measurePoints[i+1].lng);
    }
    return total;
  }, [measurePoints]);

  // If embed mode, show minimal UI
  if (isEmbedMode) {
    return (
      <div className="w-full h-screen relative overflow-hidden">
        <style>{`
          @keyframes bounce-marker { 0% { transform: translateY(0); } 100% { transform: translateY(-8px); } }
          @keyframes pulse-radar { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
        `}</style>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          </div>
        ) : (
          <div id="leaflet-map-holder" className="w-full h-full" />
        )}
        <div className="absolute top-3 left-3 z-[400] bg-black/70 rounded-lg px-3 py-1.5 text-white text-xs font-bold">
          🗺️ Xakteir Maps
        </div>
        <div className="absolute bottom-3 right-3 z-[400] flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => mapRef.current?.zoomIn()} className="h-9 w-9 bg-black/70 text-white rounded-lg">
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => mapRef.current?.zoomOut()} className="h-9 w-9 bg-black/70 text-white rounded-lg">
            <Minus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

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
        .speeding-alert-container { animation: pulse-speeding 1s infinite; }
        .map-cursor-measure { cursor: crosshair !important; }
      `}</style>

      {/* ---- FEATURE 15: Offline Banner ---- */}
      {offlineBannerVisible && (
        <div className="absolute top-0 left-0 right-0 z-[1100] bg-amber-500 text-black text-center py-1.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Offline Mode — Showing cached map tiles
          <button onClick={() => setOfflineBannerVisible(false)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="flex-1 w-full h-full relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-zinc-950 z-[900]">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Syncing Geo-Registry...</p>
          </div>
        ) : (
          <div id="leaflet-map-holder" className={cn("w-full h-full rounded-none border-none z-10", measureMode && "map-cursor-measure")} />
        )}

        {/* ---- FEATURE 20: Context Menu (Right-click reverse geocode) ---- */}
        {contextMenu && (
          <div
            className="absolute z-[800] bg-zinc-900/95 border border-white/10 rounded-2xl shadow-2xl p-3 min-w-[220px]"
            style={{ left: contextMenu.x, top: contextMenu.y, transform: "translate(5px, 5px)" }}
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">📍 What's Here?</p>
            {reverseGeoLoading ? (
              <div className="flex items-center gap-2 text-zinc-400 text-xs"><Loader2 className="w-3 h-3 animate-spin" /> Looking up...</div>
            ) : reverseGeoResult ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-white leading-snug">{reverseGeoResult.display_name || "Unknown location"}</p>
                <p className="text-[10px] text-zinc-400">{contextMenu.lat.toFixed(6)}, {contextMenu.lng.toFixed(6)}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${contextMenu.lat.toFixed(6)}, ${contextMenu.lng.toFixed(6)}`);
                      toast({ title: "📋 Coordinates copied!" });
                      setContextMenu(null);
                    }}
                    className="flex-1 text-[9px] font-black uppercase bg-blue-600 text-white rounded-lg py-1.5 hover:bg-blue-500 flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Coords
                  </button>
                  <button
                    onClick={() => setContextMenu(null)}
                    className="text-[9px] font-black uppercase bg-zinc-800 text-zinc-300 rounded-lg py-1.5 px-2 hover:bg-zinc-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ---- FEATURE 9: Global Search Bar (Top Center) ---- */}
        {!loading && !isSimulating && !isNavigatingLive && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] w-[340px] max-w-[calc(100vw-200px)] pointer-events-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                onFocus={() => setGlobalSearchActive(true)}
                onBlur={() => setTimeout(() => { setGlobalSearchActive(false); setGlobalSuggestions([]); }, 200)}
                placeholder="Search places, addresses..."
                className="bg-black/80 border-white/10 text-white text-sm pl-9 pr-4 h-11 rounded-2xl shadow-2xl font-medium backdrop-blur-md"
              />
              {globalSuggestions.length > 0 && globalSearchActive && (
                <Card className="absolute top-13 left-0 right-0 z-[500] bg-zinc-950/98 border-white/10 rounded-2xl p-2 max-h-56 overflow-y-auto shadow-2xl">
                  {globalSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onMouseDown={() => {
                        if (!mapRef.current) return;
                        const L = (window as any).L;
                        mapRef.current.setView([s.lat, s.lon], 14);
                        if (globalSearchMarkerRef.current) globalSearchMarkerRef.current.remove();
                        globalSearchMarkerRef.current = L.marker([s.lat, s.lon])
                          .addTo(mapRef.current)
                          .bindPopup(`<b>${s.name.slice(0, 60)}</b>`)
                          .openPopup();
                        setGlobalSearch(s.name.slice(0, 60));
                        setGlobalSuggestions([]);
                      }}
                      className="w-full text-left p-2.5 hover:bg-white/5 rounded-lg text-[10px] font-bold text-zinc-300 truncate flex items-center gap-2"
                    >
                      <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                      {s.name.slice(0, 70)}
                    </button>
                  ))}
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ---- Top-Right Controls ---- */}
        {!loading && (
          <div className="absolute top-6 right-6 z-[400] flex gap-2 pointer-events-auto flex-wrap justify-end">
            {/* Friends toggle */}
            <Button
              onClick={() => setFriendsOpen(!friendsOpen)}
              className={cn(
                "glass-card border-white/10 text-white rounded-2xl flex items-center gap-2 h-10 px-4 font-black text-[10px] uppercase tracking-widest",
                friendsOpen ? "bg-pink-600/90 hover:bg-pink-500/90 border-pink-500" : "bg-black/75 hover:bg-black/90"
              )}
            >
              <UsersIcon className="w-4 h-4 text-pink-400" />
              Friends ({activeFriends.length})
            </Button>

            {/* Find Me / Track */}
            <Button
              onClick={() => {
                setTrackingEnabled(!trackingEnabled);
                if (!trackingEnabled && location) panToTarget(location.lat, location.lon);
              }}
              className={cn(
                "glass-card border-white/10 rounded-2xl h-10 w-10 flex items-center justify-center",
                trackingEnabled ? "bg-blue-600/90 text-white" : "bg-black/75 text-blue-400 hover:bg-black/90"
              )}
            >
              <Locate className="w-4 h-4" />
            </Button>

            {/* Share Location Link */}
            <Button
              onClick={shareLocationLink}
              className="glass-card border-white/10 bg-black/75 hover:bg-black/90 rounded-2xl h-10 w-10 flex items-center justify-center text-purple-400"
              title="Share map view"
            >
              <Share2 className="w-4 h-4" />
            </Button>

            {/* Embed Button */}
            <Button
              onClick={() => setEmbedModalOpen(true)}
              className="glass-card border-white/10 bg-black/75 hover:bg-black/90 rounded-2xl h-10 w-10 flex items-center justify-center text-cyan-400"
              title="Get embed code"
            >
              <Code2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ---- LEFT SIDEBAR PANEL TOGGLE ---- */}
        {!loading && !isSimulating && !isNavigatingLive && (
          <div className="absolute top-6 left-6 z-[400] flex flex-col gap-2 pointer-events-auto">
            {/* Panel selector icons */}
            {[
              { key: "route", icon: <Navigation className="w-4 h-4" />, label: "Route", color: "text-blue-400" },
              { key: "saved", icon: <Star className="w-4 h-4" />, label: "Saved", color: "text-yellow-400" },
              { key: "poi", icon: <MapPin className="w-4 h-4" />, label: "POI", color: "text-orange-400" },
              { key: "explore", icon: <Globe className="w-4 h-4" />, label: "Explore", color: "text-green-400" },
              { key: "events", icon: <Calendar className="w-4 h-4" />, label: "Events", color: "text-purple-400" },
              { key: "photos", icon: <Camera className="w-4 h-4" />, label: "Photos", color: "text-pink-400" },
              { key: "measure", icon: <Ruler className="w-4 h-4" />, label: "Measure", color: "text-amber-400" },
            ].map(panel => (
              <Button
                key={panel.key}
                onClick={() => setLeftPanel(leftPanel === panel.key as any ? null : panel.key as any)}
                className={cn(
                  "glass-card border-white/10 rounded-2xl h-10 w-10 flex items-center justify-center transition-all",
                  leftPanel === panel.key ? "bg-blue-600/80 text-white" : `bg-black/75 hover:bg-black/90 ${panel.color}`
                )}
                title={panel.label}
              >
                {panel.icon}
              </Button>
            ))}
          </div>
        )}

        {/* ---- LEFT PANEL CONTENT ---- */}
        {!loading && !isSimulating && !isNavigatingLive && leftPanel && (
          <div className="absolute top-6 left-16 z-[400] w-[360px] max-w-[calc(100vw-100px)] pointer-events-auto max-h-[calc(100vh-160px)] overflow-y-auto">
            <Card className="glass-card p-5 rounded-[2rem] bg-black/80 border-white/10 shadow-2xl flex flex-col gap-4">

              {/* ---- Route Panel ---- */}
              {leftPanel === "route" && (
                <>
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

                  <div className="relative flex flex-col gap-3">
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
                          <button onClick={() => { setStartQuery("My Location"); if (location) setStartPoint({ lat: location.lat, lon: location.lon, name: "My Location" }); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-blue-400 hover:text-blue-300">
                            GPS
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pr-4 -my-2.5">
                      <Button onClick={swapStartEnd} type="button" variant="ghost" size="icon" className="w-7 h-7 bg-zinc-900 border border-white/5 rounded-full hover:bg-zinc-800 text-zinc-400">
                        <ArrowLeftLeftRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 relative">
                      <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 shrink-0 z-10">
                        <MapPin className="w-4 h-4 text-red-500" />
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

                    {activeSearchInput === "start" && startSuggestions.length > 0 && (
                      <Card className="absolute top-[44px] left-12 right-0 z-[500] bg-zinc-950/95 border-white/10 rounded-2xl p-2 max-h-48 overflow-y-auto shadow-2xl flex flex-col gap-1">
                        {startSuggestions.map((s, idx) => (
                          <button key={idx} onMouseDown={() => { setStartPoint({ lat: s.lat, lon: s.lon, name: s.name }); setStartQuery(s.name); setStartSuggestions([]); }}
                            className="w-full text-left p-2.5 hover:bg-white/5 rounded-lg text-[10px] font-bold text-zinc-300 truncate">
                            {s.name}
                          </button>
                        ))}
                      </Card>
                    )}

                    {activeSearchInput === "dest" && destSuggestions.length > 0 && (
                      <Card className="absolute top-[96px] left-12 right-0 z-[500] bg-zinc-950/95 border-white/10 rounded-2xl p-2 max-h-48 overflow-y-auto shadow-2xl flex flex-col gap-1">
                        {destSuggestions.map((s, idx) => (
                          <button key={idx} onMouseDown={() => { setDestPoint({ lat: s.lat, lon: s.lon, name: s.name }); setDestQuery(s.name); setDestSuggestions([]); }}
                            className="w-full text-left p-2.5 hover:bg-white/5 rounded-lg text-[10px] font-bold text-zinc-300 truncate">
                            {s.name}
                          </button>
                        ))}
                      </Card>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(["driving", "cycling", "walking"] as const).map(mode => (
                      <Button key={mode} size="sm" variant={travelMode === mode ? "default" : "ghost"}
                        onClick={() => setTravelMode(mode)}
                        className={cn("h-9 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider border border-white/5",
                          travelMode === mode ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-white/5")}>
                        {mode === "driving" && <><Car className="w-3.5 h-3.5" /> Drive</>}
                        {mode === "cycling" && <><Bike className="w-3.5 h-3.5" /> Cycle</>}
                        {mode === "walking" && <><Footprints className="w-3.5 h-3.5" /> Walk</>}
                      </Button>
                    ))}
                  </div>

                  {routingLoading && (
                    <div className="flex items-center justify-center gap-2 py-4 text-blue-400 text-xs font-black uppercase tracking-widest">
                      <Loader2 className="w-4 h-4 animate-spin" /> Routing Path...
                    </div>
                  )}

                  {routeDetails && !routingLoading && (
                    <div className="flex flex-col gap-4 pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center bg-zinc-950/50 p-4 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-lg font-black text-white">{formatDuration(routeDetails.duration)}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mt-0.5">Distance: {formatDistance(routeDetails.distance)}</p>
                        </div>
                        <Badge className="bg-emerald-600 text-white uppercase text-[8px] font-black py-1.5 px-3">Fastest Route</Badge>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button onClick={startLiveNavigation} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] h-12 w-full font-black text-xs uppercase tracking-widest border-none flex items-center justify-center gap-2 shadow-lg">
                          <Locate className="w-4 h-4" /> Start GPS Navigation
                        </Button>
                        <Button onClick={startJourney} className="bg-blue-600/30 hover:bg-blue-500/40 text-blue-400 rounded-[1.5rem] h-11 w-full font-black text-[10px] uppercase tracking-widest border border-blue-500/20 flex items-center justify-center gap-2">
                          <FastForward className="w-4 h-4" /> Simulate Walkthrough
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ---- Saved Places Panel (Feature 5) ---- */}
              {leftPanel === "saved" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-white uppercase italic flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Saved Places</h2>
                    <Button onClick={() => setAddPlaceMode(!addPlaceMode)} size="sm"
                      className={cn("text-[9px] font-black uppercase h-7 rounded-lg px-3", addPlaceMode ? "bg-yellow-500 text-black" : "bg-zinc-800 text-yellow-400")}>
                      {addPlaceMode ? "Cancel" : "+ Add"}
                    </Button>
                  </div>
                  {addPlaceMode && (
                    <div className="bg-zinc-900/60 rounded-2xl p-4 border border-white/5 space-y-3">
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Click on map to drop pin</p>
                      {pendingPlaceLatlng && (
                        <>
                          <p className="text-[10px] text-blue-400 font-bold">📍 {pendingPlaceLatlng.lat.toFixed(4)}, {pendingPlaceLatlng.lng.toFixed(4)}</p>
                          <Input value={newPlaceName} onChange={e => setNewPlaceName(e.target.value)} placeholder="Place name..." className="bg-black/60 border-white/5 h-9 rounded-xl text-xs text-white" />
                          <div className="grid grid-cols-4 gap-2">
                            {(["home", "work", "star", "heart"] as const).map(ic => (
                              <button key={ic} onClick={() => setNewPlaceIcon(ic)}
                                className={cn("h-10 rounded-xl text-lg border", newPlaceIcon === ic ? "bg-yellow-500/20 border-yellow-500" : "bg-zinc-800/60 border-white/5")}>
                                {ic === "home" ? "🏠" : ic === "work" ? "💼" : ic === "star" ? "⭐" : "❤️"}
                              </button>
                            ))}
                          </div>
                          <Button onClick={handleSavePlace} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs rounded-xl h-9">Save Place</Button>
                        </>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    {savedPlaces.map(pl => (
                      <div key={pl.id} onClick={() => panToTarget(pl.lat, pl.lng)}
                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:border-yellow-500/30 transition-all">
                        <span className="text-lg">{pl.icon === "home" ? "🏠" : pl.icon === "work" ? "💼" : pl.icon === "star" ? "⭐" : "❤️"}</span>
                        <div>
                          <p className="text-xs font-black text-white">{pl.name}</p>
                          <p className="text-[9px] text-zinc-500">{pl.lat?.toFixed(3)}, {pl.lng?.toFixed(3)}</p>
                        </div>
                      </div>
                    ))}
                    {savedPlaces.length === 0 && <p className="text-center text-zinc-600 text-xs py-6">No saved places yet</p>}
                  </div>
                </>
              )}

              {/* ---- POI Layer Panel (Feature 6) ---- */}
              {leftPanel === "poi" && (
                <>
                  <h2 className="text-sm font-black text-white uppercase italic flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-400" /> Points of Interest</h2>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider -mt-2">Toggle categories to see nearby places</p>
                  <div className="grid grid-cols-2 gap-2">
                    {POI_CATEGORIES.map(cat => (
                      <button key={cat.key} onClick={() => togglePOI(cat.key)}
                        className={cn("flex items-center gap-2 p-3 rounded-2xl border text-left transition-all",
                          activePOI.has(cat.key) ? "border-white/30 bg-white/10" : "border-white/5 bg-white/3 hover:bg-white/5")}>
                        <span className="text-lg">{cat.emoji}</span>
                        <div>
                          <p className="text-[10px] font-black text-white">{cat.label}</p>
                          {activePOI.has(cat.key) && <p className="text-[8px] text-emerald-400 font-bold">Active</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ---- Explore Nearby Panel (Feature 10) ---- */}
              {leftPanel === "explore" && (
                <>
                  <h2 className="text-sm font-black text-white uppercase italic flex items-center gap-2"><Globe className="w-4 h-4 text-green-400" /> Explore Nearby</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "coffee", label: "☕ Coffee", },
                      { key: "parks", label: "🌳 Parks" },
                      { key: "museums", label: "🏛️ Museums" },
                      { key: "restaurants", label: "🍽️ Restaurants" },
                    ].map(c => (
                      <button key={c.key} onClick={() => setExploreCategory(c.key)}
                        className={cn("p-2.5 rounded-xl border text-[10px] font-black uppercase text-left transition-all",
                          exploreCategory === c.key ? "bg-green-600/20 border-green-500/50 text-green-400" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/8")}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleExplore} disabled={exploreLoading} className="bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase h-10 rounded-xl w-full flex items-center justify-center gap-2">
                    {exploreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search 1km Radius
                  </Button>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {exploreResults.map((r, i) => (
                      <div key={r.id || i} onClick={() => panToTarget(r.lat, r.lng)}
                        className="p-3 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:border-green-500/30 transition-all">
                        <p className="text-xs font-black text-white">{r.name}</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">{formatDistance(r.distance)} away</p>
                      </div>
                    ))}
                    {exploreResults.length === 0 && !exploreLoading && <p className="text-center text-zinc-600 text-xs py-4">Hit 'Search' to explore</p>}
                  </div>
                </>
              )}

              {/* ---- Event Pins Panel (Feature 8) ---- */}
              {leftPanel === "events" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-white uppercase italic flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-400" /> Map Events</h2>
                    <Button onClick={() => setAddEventMode(!addEventMode)} size="sm"
                      className={cn("text-[9px] font-black uppercase h-7 rounded-lg px-3", addEventMode ? "bg-purple-500 text-white" : "bg-zinc-800 text-purple-400")}>
                      {addEventMode ? "Cancel" : "+ Add Event"}
                    </Button>
                  </div>
                  {addEventMode && (
                    <div className="bg-zinc-900/60 rounded-2xl p-4 border border-white/5 space-y-3">
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Click map to drop event pin</p>
                      {pendingEventLatlng && (
                        <>
                          <p className="text-[10px] text-purple-400 font-bold">📅 {pendingEventLatlng.lat.toFixed(4)}, {pendingEventLatlng.lng.toFixed(4)}</p>
                          <Input value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="Event name..." className="bg-black/60 border-white/5 h-9 rounded-xl text-xs text-white" />
                          <Input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="bg-black/60 border-white/5 h-9 rounded-xl text-xs text-white" />
                          <Input value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} placeholder="Description..." className="bg-black/60 border-white/5 h-9 rounded-xl text-xs text-white" />
                          <Button onClick={handleSaveEvent} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl h-9">Create Event</Button>
                        </>
                      )}
                    </div>
                  )}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {mapEvents.map(ev => (
                      <div key={ev.id} onClick={() => ev.lat && panToTarget(ev.lat, ev.lng)}
                        className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-2xl cursor-pointer hover:border-purple-500/40">
                        <p className="text-xs font-black text-white">📅 {ev.name}</p>
                        {ev.date && <p className="text-[9px] text-purple-400">{ev.date}</p>}
                        {ev.description && <p className="text-[9px] text-zinc-500 mt-0.5">{ev.description}</p>}
                      </div>
                    ))}
                    {mapEvents.length === 0 && <p className="text-center text-zinc-600 text-xs py-4">No events yet. Add one!</p>}
                  </div>
                </>
              )}

              {/* ---- Photo Map Panel (Feature 13) ---- */}
              {leftPanel === "photos" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-white uppercase italic flex items-center gap-2"><Camera className="w-4 h-4 text-pink-400" /> Photo Map</h2>
                    <Button onClick={() => setPhotoLayerEnabled(!photoLayerEnabled)} size="sm"
                      className={cn("text-[9px] font-black uppercase h-7 rounded-lg px-3", photoLayerEnabled ? "bg-pink-600 text-white" : "bg-zinc-800 text-pink-400")}>
                      {photoLayerEnabled ? "Hide Layer" : "Show Layer"}
                    </Button>
                  </div>
                  <Button onClick={() => setAddPhotoMode(!addPhotoMode)} size="sm"
                    className={cn("text-[9px] font-black uppercase h-7 rounded-lg px-3 w-full", addPhotoMode ? "bg-pink-500 text-white" : "bg-zinc-800 text-pink-400 hover:bg-zinc-700")}>
                    {addPhotoMode ? "Cancel Pin Mode" : "+ Pin a Photo"}
                  </Button>
                  {addPhotoMode && (
                    <div className="bg-zinc-900/60 rounded-2xl p-4 border border-white/5 space-y-3">
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Click map to place photo</p>
                      {pendingPhotoLatlng && (
                        <>
                          <Input value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} placeholder="Photo URL..." className="bg-black/60 border-white/5 h-9 rounded-xl text-xs text-white" />
                          <Input value={newPhotoCaption} onChange={e => setNewPhotoCaption(e.target.value)} placeholder="Caption..." className="bg-black/60 border-white/5 h-9 rounded-xl text-xs text-white" />
                          <Button onClick={handleSavePhoto} className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black text-xs rounded-xl h-9">Pin Photo</Button>
                        </>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {mapPhotos.map(ph => (
                      <div key={ph.id} onClick={() => setLightboxPhoto(ph)} className="cursor-pointer group relative">
                        <img src={ph.url} alt={ph.caption || "Photo"} className="w-full h-20 object-cover rounded-xl border border-white/5 group-hover:border-pink-500/50 transition-all" onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/100x80/1e293b/60a5fa?text=Photo"; }} />
                        {ph.caption && <p className="text-[9px] text-zinc-400 font-bold mt-1 truncate">{ph.caption}</p>}
                      </div>
                    ))}
                    {mapPhotos.length === 0 && <p className="text-center text-zinc-600 text-xs py-4 col-span-2">No photos pinned yet</p>}
                  </div>
                </>
              )}

              {/* ---- Measure Distance Panel (Feature 11) ---- */}
              {leftPanel === "measure" && (
                <>
                  <h2 className="text-sm font-black text-white uppercase italic flex items-center gap-2"><Ruler className="w-4 h-4 text-amber-400" /> Measure Distance</h2>
                  <Button onClick={() => { setMeasureMode(!measureMode); if (measureMode) setMeasurePoints([]); }}
                    className={cn("w-full h-10 rounded-xl font-black text-xs uppercase", measureMode ? "bg-amber-500 text-black" : "bg-amber-600/20 text-amber-400 border border-amber-500/30")}>
                    {measureMode ? "🔴 Stop Measuring" : "📏 Start Measuring"}
                  </Button>
                  {measureMode && <p className="text-[9px] text-zinc-400 text-center">Click on map to add measurement points</p>}
                  {measurePoints.length > 0 && (
                    <>
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-amber-400">{formatDistance(measureTotalDistance)}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-1">{measurePoints.length} points</p>
                      </div>
                      <Button onClick={() => setMeasurePoints([])} variant="ghost" size="sm" className="text-zinc-500 hover:text-red-400 text-xs uppercase font-black w-full">
                        <X className="w-3 h-3 mr-1" /> Clear Points
                      </Button>
                    </>
                  )}
                </>
              )}

            </Card>
          </div>
        )}

        {/* ---- BOTTOM LEFT: Map Layers & Feature Toggles ---- */}
        {!loading && (
          <div className="absolute bottom-10 left-10 z-[400] flex flex-col gap-2">
            {/* Map Style Switcher (Feature 2) */}
            <Card className="glass-card p-1.5 rounded-2xl border-white/10 flex gap-1 shadow-2xl bg-black/60">
              {MAP_STYLES.map(style => (
                <Button key={style.key} size="sm" variant={mapLayer === style.key ? "default" : "ghost"}
                  onClick={() => { setMapLayer(style.key); setHistoryMode(false); }}
                  className={cn("text-[8px] font-black uppercase tracking-wider h-8 rounded-lg px-2.5", mapLayer === style.key && !historyMode ? "bg-blue-600" : "text-white")}>
                  {style.label}
                </Button>
              ))}
            </Card>

            {/* Overlay Toggles Row */}
            <Card className="glass-card p-1.5 rounded-2xl border-white/10 flex gap-1 shadow-2xl bg-black/60 flex-wrap">
              {/* Traffic (Feature 1) */}
              <Button size="sm" onClick={() => setTrafficEnabled(!trafficEnabled)}
                className={cn("text-[8px] font-black uppercase tracking-wider h-8 rounded-lg px-2", trafficEnabled ? "bg-orange-600 text-white" : "text-zinc-400 hover:bg-white/5")}>
                🚦 Traffic
              </Button>
              {/* Weather (Feature 7) */}
              <Button size="sm" onClick={() => setWeatherOpen(!weatherOpen)}
                className={cn("text-[8px] font-black uppercase tracking-wider h-8 rounded-lg px-2", weatherOpen ? "bg-sky-600 text-white" : "text-zinc-400 hover:bg-white/5")}>
                ☁️ Weather
              </Button>
              {/* Heatmap (Feature 19) */}
              <Button size="sm" onClick={() => setHeatmapEnabled(!heatmapEnabled)}
                className={cn("text-[8px] font-black uppercase tracking-wider h-8 rounded-lg px-2", heatmapEnabled ? "bg-red-600 text-white" : "text-zinc-400 hover:bg-white/5")}>
                🔥 Heatmap
              </Button>
              {/* Boundaries (Feature 14) */}
              <Button size="sm" onClick={toggleBoundaries}
                className={cn("text-[8px] font-black uppercase tracking-wider h-8 rounded-lg px-2", boundaryEnabled ? "bg-blue-700 text-white" : "text-zinc-400 hover:bg-white/5")}>
                🗺️ Bounds
              </Button>
              {/* History (Feature 18) */}
              <Button size="sm" onClick={() => setHistoryMode(!historyMode)}
                className={cn("text-[8px] font-black uppercase tracking-wider h-8 rounded-lg px-2", historyMode ? "bg-amber-700 text-white" : "text-zinc-400 hover:bg-white/5")}>
                🕰️ History
              </Button>
              {/* Location sharing (Feature 3) */}
              {user && (
                <Button size="sm" onClick={() => setLocationSharingEnabled(!locationSharingEnabled)}
                  className={cn("text-[8px] font-black uppercase tracking-wider h-8 rounded-lg px-2", locationSharingEnabled ? "bg-green-700 text-white" : "text-zinc-400 hover:bg-white/5")}>
                  {locationSharingEnabled ? "📡 Sharing" : "📡 Share"}
                </Button>
              )}
            </Card>

            {/* Weather panel (Feature 7) */}
            {weatherOpen && (
              <Card className="glass-card p-4 rounded-2xl border-white/10 bg-black/80 shadow-2xl space-y-3 w-72">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-2">☁️ Weather Overlay</h3>
                {currentWeather && currentWeather.main && (
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-3xl">{currentWeather.weather?.[0]?.main === "Rain" ? "🌧️" : currentWeather.weather?.[0]?.main === "Clouds" ? "☁️" : currentWeather.weather?.[0]?.main === "Snow" ? "❄️" : "☀️"}</span>
                    <div>
                      <p className="text-sm font-black text-white">{Math.round(currentWeather.main.temp)}°C</p>
                      <p className="text-[9px] text-zinc-400">{currentWeather.weather?.[0]?.description} · {currentWeather.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Precipitation</span>
                  <button onClick={() => setPrecipEnabled(!precipEnabled)} className={cn("w-10 h-5 rounded-full transition-all", precipEnabled ? "bg-blue-500" : "bg-zinc-700")} style={{ position: "relative" }}>
                    <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", precipEnabled ? "left-5" : "left-0.5")} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Cloud Cover</span>
                  <button onClick={() => setCloudsEnabled(!cloudsEnabled)} className={cn("w-10 h-5 rounded-full transition-all", cloudsEnabled ? "bg-blue-500" : "bg-zinc-700")} style={{ position: "relative" }}>
                    <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", cloudsEnabled ? "left-5" : "left-0.5")} />
                  </button>
                </div>
                {(precipEnabled || cloudsEnabled) && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] text-zinc-500 uppercase font-bold"><span>Opacity</span><span>{Math.round(weatherOpacity * 100)}%</span></div>
                    <Slider value={[weatherOpacity]} onValueChange={([v]) => setWeatherOpacity(v)} min={0.1} max={1} step={0.05} className="w-full" />
                  </div>
                )}
              </Card>
            )}

            {/* History slider (Feature 18) */}
            {historyMode && (
              <Card className="glass-card p-4 rounded-2xl border-white/10 bg-black/80 shadow-2xl space-y-2 w-72">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">🕰️ Historical Imagery: {historyYear}</h3>
                <Slider value={[historyYear]} onValueChange={([v]) => setHistoryYear(v)} min={1900} max={2023} step={1} className="w-full" />
                <div className="flex justify-between text-[8px] text-zinc-500 font-bold"><span>1900</span><span>2023</span></div>
                <p className="text-[9px] text-zinc-500">Showing Esri Wayback satellite imagery for {historyYear}</p>
              </Card>
            )}

            {/* Traffic incident report (Feature 1) */}
            {trafficEnabled && (
              <Card className="glass-card p-3 rounded-2xl border-white/10 bg-black/80 shadow-2xl space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-orange-400">Report Incident</p>
                <div className="flex gap-2 flex-wrap">
                  {["Accident", "Road Closure", "Congestion", "Hazard"].map(type => (
                    <button key={type} onClick={() => reportIncident(type)}
                      className="text-[8px] font-black uppercase bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-lg px-2 py-1.5 hover:bg-orange-600/40 transition-all">
                      {type}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ---- Map zoom controls ---- */}
        <div className="absolute bottom-10 right-10 flex flex-col gap-4 z-[400]">
          <Card className="glass-card p-2 rounded-3xl border-white/10 flex flex-col gap-2 shadow-2xl bg-black/60">
            <Button size="icon" variant="ghost" onClick={() => mapRef.current?.zoomIn()} className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary text-white"><Plus className="w-5 h-5" /></Button>
            <Button size="icon" variant="ghost" onClick={() => mapRef.current?.zoomOut()} className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary text-white"><Minus className="w-5 h-5" /></Button>
          </Card>
        </div>

        {/* ---- Friends Panel (Top-Right) ---- */}
        {friendsOpen && !loading && (
          <aside className="absolute right-6 top-20 bottom-6 w-96 max-w-[calc(100vw-50px)] glass-card p-6 rounded-[2.5rem] border-white/10 bg-zinc-950/85 shadow-3xl flex flex-col gap-6 overflow-y-auto z-[400] pointer-events-auto">
            {/* Location sharing toggle (Feature 3) */}
            {user && (
              <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <div>
                  <p className="text-xs font-black text-white">Share My Location</p>
                  <p className="text-[9px] text-zinc-500">Broadcast to friends every 30s</p>
                </div>
                <button onClick={() => setLocationSharingEnabled(!locationSharingEnabled)}
                  className={cn("w-12 h-6 rounded-full transition-all relative", locationSharingEnabled ? "bg-blue-500" : "bg-zinc-700")}>
                  <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", locationSharingEnabled ? "left-7" : "left-1")} />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase italic tracking-tighter text-white flex items-center gap-2"><UserPlus className="w-4 h-4 text-blue-500" /> Link Friend Node</h3>
              <div className="flex gap-2">
                <Input value={friendSearch} onChange={(e) => setFriendSearch(e.target.value)} placeholder="Friend's email..."
                  className="bg-black/60 border-white/5 h-10 rounded-xl text-xs font-bold text-white" />
                <Button onClick={handleSendFriendRequest} disabled={isProcessing || !friendSearch.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-10 px-4 font-black text-xs border-none">
                  Link
                </Button>
              </div>
            </div>

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

            <div className="space-y-4 border-t border-white/5 pt-4 flex-1 flex flex-col min-h-0">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Active Friends ({activeFriends.length})</h4>
              <div className="space-y-3 overflow-y-auto flex-1">
                {activeFriends.map((friend) => {
                  const hasLoc = friend.location?.lat && friend.location?.lon;
                  return (
                    <div key={friend.id} onClick={() => { if (hasLoc) panToTarget(friend.location.lat, friend.location.lon); }}
                      className={cn("p-4 bg-white/5 border rounded-2xl flex items-center justify-between transition-all select-none",
                        hasLoc ? "border-pink-500/20 hover:border-pink-500/40 cursor-pointer" : "border-transparent opacity-50")}>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase italic">{friend.displayName || friend.username || "Member"}</h4>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase mt-1 tracking-wider">
                          {hasLoc ? `${friend.location.lat.toFixed(4)}, ${friend.location.lon.toFixed(4)}` : "Geo Offline"}
                        </p>
                      </div>
                      {hasLoc && <Navigation className="w-4 h-4 text-pink-500 rotate-45 animate-pulse" />}
                    </div>
                  );
                })}
                {activeFriends.length === 0 && (
                  <div className="py-16 text-center opacity-25 space-y-3">
                    <UsersIcon className="w-12 h-12 mx-auto text-zinc-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No Friend Nodes Linked</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* ---- ACTIVE NAVIGATION HUD ---- */}
        {(isSimulating || isNavigatingLive) && currentStepProgress && (
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

        {/* ---- ACTIVE NAVIGATION BOTTOM DASHBOARD ---- */}
        {(isSimulating || isNavigatingLive) && routeDetails && (
          <div className="absolute bottom-6 left-6 right-6 z-[400] flex flex-col md:flex-row gap-4 justify-between items-center pointer-events-none">
            <div className="flex gap-4 items-center pointer-events-auto">
              <Card className={cn("glass-card p-4 rounded-[2.5rem] bg-black/80 flex items-center gap-4 shrink-0 transition-all border-white/10", isSpeeding && "speeding-alert-container border-rose-500/80")}>
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-225" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeDasharray={arcLength} />
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke={isSpeeding ? "#ef4444" : "#10b981"} strokeWidth="7" strokeDasharray={arcLength} strokeDashoffset={strokeDashoffset} className="transition-all duration-100 ease-out" style={{ strokeLinecap: "round" }} />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={cn("text-2xl font-black italic tracking-tighter leading-none", isSpeeding ? "text-rose-500" : "text-white")}>{Math.round(simSpeed)}</span>
                    <span className="text-[7px] font-black uppercase text-zinc-500 tracking-wider">km/h</span>
                  </div>
                </div>
                <div className="flex flex-col items-center pr-2">
                  <div className={cn("w-12 h-12 rounded-full border-4 border-rose-600 bg-white flex items-center justify-center shadow-lg shrink-0", isSpeeding && "animate-bounce")}>
                    <span className="text-zinc-950 font-black text-sm tracking-tighter">{simSpeedLimit}</span>
                  </div>
                  <span className="text-[7px] font-black uppercase tracking-wider text-zinc-400 mt-1">Limit</span>
                </div>
              </Card>

              {isSpeeding && (
                <Card className="bg-rose-600 text-white rounded-2xl px-4 py-2 border-none flex items-center gap-2 text-[9px] font-black uppercase tracking-widest animate-pulse shadow-lg shrink-0">
                  <ShieldAlert className="w-4 h-4 animate-bounce" /> SPEED ALERT!
                </Card>
              )}
            </div>

            <Card className="glass-card p-6 rounded-[2.5rem] bg-black/85 border-white/10 shadow-3xl w-full md:max-w-2xl pointer-events-auto flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 w-full space-y-2 border-r border-white/10 pr-6">
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Remaining ETA</p>
                    <p className="text-base font-black text-white mt-0.5">{formatDuration(((routeDetails.distance - simDistanceTravelled) / (simSpeed || 30)) * 3.6)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Distance</p>
                    <p className="text-xs font-black text-zinc-300 mt-0.5">{formatDistance(routeDetails.distance - simDistanceTravelled)} left</p>
                  </div>
                </div>
                <Progress value={(simDistanceTravelled / routeDetails.distance) * 100} className="h-2 bg-zinc-950 border border-white/5 rounded-full" />
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto">
                <div className="flex gap-2 justify-center items-center">
                  {isNavigatingLive ? (
                    <Badge className="bg-emerald-600/80 text-white uppercase text-[8px] font-black py-1.5 px-3 animate-pulse">LIVE GPS ACTIVE</Badge>
                  ) : (
                    <>
                      <Button size="icon" onClick={() => setIsSimulating(!isSimulating)}
                        className={cn("w-10 h-10 rounded-xl border-none text-white", isSimulating ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500")}>
                        {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </Button>
                      <Button size="sm" onClick={() => setSimMultiplier(prev => prev === 1 ? 5 : prev === 5 ? 10 : prev === 10 ? 25 : prev === 25 ? 50 : 1)}
                        className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 h-10 rounded-xl px-3 text-[9px] font-black uppercase text-white tracking-widest shrink-0">
                        {simMultiplier}x
                      </Button>
                    </>
                  )}
                  <Button size="icon" onClick={resetJourney} className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 hover:bg-rose-950 text-rose-500">
                    <Square className="w-4 h-4 fill-rose-500" />
                  </Button>
                  <Button size="icon" onClick={() => setVoiceMuted(!voiceMuted)} className="w-10 h-10 rounded-xl border border-white/5 text-white bg-zinc-900 hover:bg-zinc-800">
                    {voiceMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
                  </Button>
                </div>

                {!isNavigatingLive && (
                  <div className="w-44 flex flex-col gap-1 mx-auto">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-zinc-400">
                      <span>Manual Cruise</span>
                      <span className={simManualSpeedOverride !== null ? "text-blue-400" : "text-zinc-500"}>
                        {simManualSpeedOverride !== null ? `${simManualSpeedOverride} km/h` : "Auto"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Slider value={[simManualSpeedOverride !== null ? simManualSpeedOverride : 50]} onValueChange={(val) => setSimManualSpeedOverride(val[0])} min={0} max={160} step={5} className="flex-1" />
                      {simManualSpeedOverride !== null && (
                        <button onClick={() => setSimManualSpeedOverride(null)} className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Clear</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ---- FEATURE 17: Embed Modal ---- */}
      {embedModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
          <Card className="glass-card max-w-lg w-full p-8 rounded-[3rem] border-white/10 bg-zinc-950/95 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white uppercase italic flex items-center gap-2"><Code2 className="w-5 h-5 text-cyan-400" /> Embed This Map</h2>
              <Button size="icon" variant="ghost" onClick={() => setEmbedModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></Button>
            </div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Copy this code to embed the map on any webpage:</p>
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-cyan-300 break-all select-all">
              {getEmbedCode()}
            </div>
            <Button onClick={() => { navigator.clipboard.writeText(getEmbedCode()); toast({ title: "📋 Embed code copied!" }); setEmbedModalOpen(false); }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase h-11 rounded-2xl flex items-center justify-center gap-2">
              <Copy className="w-4 h-4" /> Copy Embed Code
            </Button>
          </Card>
        </div>
      )}

      {/* ---- FEATURE 13: Photo Lightbox ---- */}
      {lightboxPhoto && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[1000] flex items-center justify-center p-6" onClick={() => setLightboxPhoto(null)}>
          <div className="max-w-2xl w-full space-y-4" onClick={e => e.stopPropagation()}>
            <img src={lightboxPhoto.url} alt={lightboxPhoto.caption} className="w-full max-h-[70vh] object-contain rounded-3xl border border-white/10 shadow-2xl" />
            {lightboxPhoto.caption && <p className="text-center text-white font-bold text-sm">{lightboxPhoto.caption}</p>}
            <Button onClick={() => setLightboxPhoto(null)} variant="ghost" className="w-full text-zinc-400 hover:text-white uppercase font-black text-xs">Close</Button>
          </div>
        </div>
      )}

      {/* ---- TRIP CELEBRATION MODAL ---- */}
      {arrived && routeDetails && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
          <Card className="glass-card max-w-md w-full p-8 rounded-[3.5rem] border-white/10 bg-zinc-950/90 text-center flex flex-col items-center gap-6 relative overflow-hidden shadow-3xl">
            <div className="absolute inset-0 opacity-5 pointer-events-none" />
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Journey Completed!</h2>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">You have arrived safely at your destination.</p>
            </div>
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
            <Button onClick={() => { setArrived(false); resetJourney(); }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest w-full h-12 rounded-2xl border-none shadow-lg mt-2">
              Back to Planner
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

// Subcomponent for vertical double arrow icon
function ArrowLeftLeftRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 3 4-4 4 4" />
      <path d="M12 0v20" />
      <path d="m16 21-4 4-4-4" />
    </svg>
  );
}

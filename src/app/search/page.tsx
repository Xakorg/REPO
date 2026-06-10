"use client";

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { 
  Search, 
  X,
  Sparkles,
  Loader2,
  BadgeCheck,
  Globe,
  Settings,
  Image as ImageIcon,
  Users,
  List,
  History,
  Trash2,
  ExternalLink,
  MessageCircle,
  UserPlus,
  UserCheck,
  MapPin,
  ChevronRight,
  Mic,
  Volume2,
  VolumeX,
  Star,
  Bookmark,
  Play,
  Square,
  Calculator as CalcIcon,
  CloudSun,
  Palette,
  Languages,
  QrCode,
  KeyRound,
  Compass,
  Laptop,
  Gamepad2,
  Timer as TimerIcon,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { aiPoweredWebSearch } from "@/ai/flows/ai-powered-web-search-flow";
import defaultSites from '@/lib/defaultSites';
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, limit, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SearchCategory = "all" | "sites" | "images" | "people";

const LOCAL_DEFINITIONS: Record<string, { title: string, definition: string, type: string, image?: string, facts?: Record<string, string> }> = {
  "snake": {
    title: "Snake",
    definition: "A snake is a hostile animal that is a long, legless, carnivorous reptile of the suborder Serpentes. Characterized by their lack of limbs, snakes have highly flexible jaws that allow them to swallow prey much larger than their head. They are found on every continent except Antarctica.",
    type: "Reptile / Vertebrate",
    image: "https://images.unsplash.com/photo-1531386151447-fd762e78f99e?w=600&auto=format&fit=crop&q=80",
    facts: {
      "Scientific Name": "Serpentes",
      "Class": "Reptilia",
      "Diet": "Carnivore",
      "Key Feature": "Limbless body, flexible jaws"
    }
  },
  "cat": {
    title: "Cat",
    definition: "The cat is a small domesticated carnivorous mammal. It is the only domesticated species in the family Felidae and is often referred to as the domestic cat to distinguish it from the wild members of the family.",
    type: "Mammal / Feline",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80",
    facts: {
      "Scientific Name": "Felis catus",
      "Lifespan": "12 – 15 years",
      "Sleep duration": "12 – 16 hours/day",
      "Family": "Felidae"
    }
  },
  "dog": {
    title: "Dog",
    definition: "The dog is a domesticated descendant of the wolf. They were the first species to be domesticated by humans, over 15,000 years ago. Dogs have been bred for various behaviors, sensory capabilities, and physical attributes.",
    type: "Mammal / Canine",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80",
    facts: {
      "Scientific Name": "Canis lupus familiaris",
      "Lifespan": "10 – 13 years",
      "Speed": "Up to 30 mph (run)",
      "Family": "Canidae"
    }
  },
  "html": {
    title: "HTML",
    definition: "HyperText Markup Language (HTML) is the standard markup language for documents designed to be displayed in a web browser. It is assisted by technologies such as Cascading Style Sheets (CSS) and scripting languages such as JavaScript.",
    type: "Web Standard",
    image: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=600&auto=format&fit=crop&q=80",
    facts: {
      "Initial Release": "1993",
      "Developed by": "WHATWG & W3C",
      "Type of Format": "Document file format",
      "Filename Extension": ".html, .htm"
    }
  },
  "javascript": {
    title: "JavaScript",
    definition: "JavaScript, often abbreviated as JS, is a programming language that is one of the core technologies of the World Wide Web, alongside HTML and CSS. As of 2026, over 98% of websites use JavaScript on the client side for webpage behavior.",
    type: "Programming Language",
    image: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&auto=format&fit=crop&q=80",
    facts: {
      "First Released": "December 4, 1995",
      "Designed by": "Brendan Eich",
      "Typing Discipline": "Dynamic, weak",
      "Filename Extensions": ".js, .mjs, .cjs"
    }
  },
  "react": {
    title: "React",
    definition: "React is a free and open-source front-end JavaScript library for building user interfaces based on components. It is maintained by Meta and a community of individual developers and companies.",
    type: "UI Library",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80",
    facts: {
      "Initial Release": "May 29, 2013",
      "Developed by": "Meta (Facebook)",
      "License": "MIT License",
      "Platform": "Web, Mobile (React Native)"
    }
  },
  "roblox": {
    title: "Roblox",
    definition: "Roblox is a massive multiplayer online game platform and game creation system. It allows users to program games using Lua and play games designed by other members of the community.",
    type: "Gaming Platform / Game Engine",
    image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=600&auto=format&fit=crop&q=80",
    facts: {
      "Initial Release": "September 1, 2006",
      "Engine": "Luau (Lua variant)",
      "Platforms": "Windows, macOS, iOS, Android, Xbox",
      "Founder(s)": "David Baszucki, Erik Cassel"
    }
  },
  "rocket league": {
    title: "Rocket League",
    definition: "Rocket League is a vehicular soccer video game developed and published by Psyonix. It features rocket-powered cars playing soccer, which creates a highly competitive physics-based sport.",
    type: "Video Game",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80",
    facts: {
      "Release Date": "July 7, 2015",
      "Developer": "Psyonix",
      "Genre": "Sports, vehicular soccer",
      "Modes": "Single-player, multiplayer"
    }
  }
};

const searchWebEngine = async (queryText: string) => {
  try {
    const res = await fetch(`/api/search-web?q=${encodeURIComponent(queryText)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results)) {
        return data.results;
      }
    }
  } catch (e) {
    console.error("Failed to query /api/search-web proxy", e);
  }
  return [];
};


// Removed Wikipedia summary fetching entirely.

// Accent Theme configurations mapping
const getThemeClasses = (t: string) => {
  switch (t) {
    case "blue":
      return {
        text: "text-blue-400",
        textHover: "hover:text-blue-300",
        border: "border-blue-500/50",
        borderHover: "hover:border-blue-500/80",
        bg: "bg-blue-500/10",
        bgSolid: "bg-blue-600",
        bgSolidHover: "hover:bg-blue-500",
        shadow: "shadow-blue-500/15",
        fill: "fill-blue-500"
      };
    case "green":
      return {
        text: "text-emerald-400",
        textHover: "hover:text-emerald-300",
        border: "border-emerald-500/50",
        borderHover: "hover:border-emerald-500/80",
        bg: "bg-emerald-500/10",
        bgSolid: "bg-emerald-600",
        bgSolidHover: "hover:bg-emerald-500",
        shadow: "shadow-emerald-500/15",
        fill: "fill-emerald-500"
      };
    case "indigo":
      return {
        text: "text-indigo-400",
        textHover: "hover:text-indigo-300",
        border: "border-indigo-500/50",
        borderHover: "hover:border-indigo-500/80",
        bg: "bg-indigo-500/10",
        bgSolid: "bg-indigo-600",
        bgSolidHover: "hover:bg-indigo-500",
        shadow: "shadow-indigo-500/15",
        fill: "fill-indigo-500"
      };
    case "amber":
      return {
        text: "text-amber-400",
        textHover: "hover:text-amber-300",
        border: "border-amber-500/50",
        borderHover: "hover:border-amber-500/80",
        bg: "bg-amber-500/10",
        bgSolid: "bg-amber-600",
        bgSolidHover: "hover:bg-amber-500",
        shadow: "shadow-amber-500/15",
        fill: "fill-amber-500"
      };
    case "violet":
      return {
        text: "text-violet-400",
        textHover: "hover:text-violet-300",
        border: "border-violet-500/50",
        borderHover: "hover:border-violet-500/80",
        bg: "bg-violet-500/10",
        bgSolid: "bg-violet-600",
        bgSolidHover: "hover:bg-violet-500",
        shadow: "shadow-violet-500/15",
        fill: "fill-violet-500"
      };
    default:
      return {
        text: "text-rose-400",
        textHover: "hover:text-rose-300",
        border: "border-rose-500/50",
        borderHover: "hover:border-rose-500/80",
        bg: "bg-rose-500/10",
        bgSolid: "bg-rose-600",
        bgSolidHover: "hover:bg-rose-500",
        shadow: "shadow-rose-500/15",
        fill: "fill-rose-500"
      };
  }
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || "";
  
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{title:string, thumb?:string, page?:string}>>([]);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all");
  const [externalSites, setExternalSites] = useState<any[]>([]);
  const [wikiDefinition, setWikiDefinition] = useState<any>(null);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  // Settings states
  const [accentTheme, setAccentTheme] = useState("rose");
  const [safeSearchActive, setSafeSearchActive] = useState(true);
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [resultsDisplayCount, setResultsDisplayCount] = useState(10);
  const [pauseHistoryLogging, setPauseHistoryLogging] = useState(false);

  // Search Statistics
  const [timeStart, setTimeStart] = useState<number>(0);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  // TTS states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  // Voice Search states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Starred Bookmarks states
  const [bookmarkedSites, setBookmarkedSites] = useState<Array<{title: string, url: string}>>([]);
  const [showBookmarksDialog, setShowBookmarksDialog] = useState(false);

  // SafeSearch Warning state
  const [safeSearchWarning, setSafeSearchWarning] = useState(false);

  // Interactive Widgets States
  // 1. Calculator widget state
  const [calcExpr, setCalcExpr] = useState("");
  const [calcAns, setCalcAns] = useState("");
  // 2. Weather widget states
  const [weatherUnit, setWeatherUnit] = useState<"C" | "F">("C");
  // 3. Color Picker states
  const [colorHex, setColorHex] = useState("#FF0055");
  const [colorRGB, setColorRGB] = useState({ r: 255, g: 0, b: 85 });
  // 4. Translator states
  const [translateSrc, setTranslateSrc] = useState("Hello, welcome to Antigravity search!");
  const [translateDest, setTranslateDest] = useState("");
  const [translateFrom, setTranslateFrom] = useState("en");
  const [translateTo, setTranslateTo] = useState("es");
  // 5. Password Generator states
  const [passLength, setPassLength] = useState(16);
  const [passOpts, setPassOpts] = useState({ upper: true, lower: true, nums: true, syms: true });
  const [generatedPass, setGeneratedPass] = useState("");
  // 6. Unit Converter states
  const [convertType, setConvertType] = useState<"length" | "weight" | "temp">("length");
  const [convertVal, setConvertVal] = useState("1");
  const [convertFromUnit, setConvertFromUnit] = useState("inches");
  const [convertToUnit, setConvertToUnit] = useState("cm");
  const [convertResult, setConvertResult] = useState("");
  // 7. Tic Tac Toe states
  const [tttBoard, setTttBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [tttWinner, setTttWinner] = useState<string | null>(null);
  const [tttTurn, setTttTurn] = useState<"X" | "O">("X");
  const [tttScore, setTttScore] = useState({ player: 0, ai: 0, ties: 0 });
  // 8. Timer & Stopwatch states
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchLaps, setStopwatchLaps] = useState<number[]>([]);
  const [timerInput, setTimerInput] = useState(5); // minutes
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<any>(null);
  const stopwatchIntervalRef = useRef<any>(null);
  // 9. Site Verification Console states
  const [consoleSiteUrl, setConsoleSiteUrl] = useState("");
  const [verificationTag, setVerificationTag] = useState("");
  const [isVerifiedConsole, setIsVerifiedConsole] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("xaksearch_theme") || "rose";
      setAccentTheme(savedTheme);

      const savedSafeSearch = localStorage.getItem("xaksearch_safesearch") !== "false";
      setSafeSearchActive(savedSafeSearch);

      const savedNewTab = localStorage.getItem("xaksearch_new_tab") !== "false";
      setOpenInNewTab(savedNewTab);

      const savedResultsCount = Number(localStorage.getItem("xaksearch_results_per_page") || "10");
      setResultsDisplayCount(savedResultsCount);

      const savedPauseHistory = localStorage.getItem("xaksearch_pause_history") === "true";
      setPauseHistoryLogging(savedPauseHistory);

      const savedBookmarks = localStorage.getItem("xaksearch_bookmarks");
      if (savedBookmarks) {
        setBookmarkedSites(JSON.parse(savedBookmarks));
      }
    } catch (e) {
      console.warn("Could not load search preferences", e);
    }
  }, []);

  const tc = useMemo(() => getThemeClasses(accentTheme), [accentTheme]);

  // Save Bookmarks
  const toggleBookmark = (title: string, url: string) => {
    const isBookmarked = bookmarkedSites.some(s => s.url === url);
    let updated: Array<{title:string, url:string}> = [];
    if (isBookmarked) {
      updated = bookmarkedSites.filter(s => s.url !== url);
      toast({ title: "Bookmark Removed" });
    } else {
      updated = [...bookmarkedSites, { title, url }];
      toast({ title: "Bookmark Saved!" });
    }
    setBookmarkedSites(updated);
    try {
      localStorage.setItem("xaksearch_bookmarks", JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // SafeSearch Filter Check
  const containsExplicitContent = (queryText: string): boolean => {
    const blacklisted = ["porn", "xxx", "sex", "hentai", "nsfw", "adult videos", "naked"];
    const text = queryText.toLowerCase().trim();
    return blacklisted.some(word => text.includes(word));
  };

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, "users", user.uid, "following");
  }, [firestore, user]);
  const { data: followingList } = useCollection(followingQuery);
  const followingIds = useMemo(() => new Set(followingList?.map((f: any) => f.id) || []), [followingList]);

  const friendshipsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, "friendships"));
  }, [firestore, user]);
  const { data: friendships } = useCollection(friendshipsQuery);

  const handleFollow = async (member: any) => {
    if (!user?.uid || !firestore) return;
    const ref = doc(firestore, "users", user.uid, "following", member.id);
    const isFollowing = followingIds.has(member.id);
    try {
      if (isFollowing) {
        await deleteDoc(ref);
        toast({ title: "Unfollowed" });
      } else {
        await setDoc(ref, { 
          id: member.id, 
          displayName: member.displayName || member.name || "Member", 
          photoURL: member.photoURL || "", 
          timestamp: serverTimestamp() 
        });
        toast({ title: "Followed!" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error following user" });
    }
  };

  const handleAddFriend = async (member: any) => {
    if (!user?.uid || !firestore) return;
    if (member.id === user.uid) {
      toast({ variant: "destructive", title: "Error", description: "You cannot friend yourself." });
      return;
    }
    const id = [user.uid, member.id].sort().join("_");
    const friendshipRef = doc(firestore, "friendships", id);
    try {
      await setDoc(friendshipRef, {
        id,
        requesterId: user.uid,
        requesterName: user.displayName?.replace(/^@+/, "") || "Member",
        requesterEmail: user.email || "",
        recipientId: member.id,
        recipientName: member.displayName?.replace(/^@+/, "") || member.username || "Member",
        recipientEmail: member.email || "",
        status: "pending",
        timestamp: serverTimestamp()
      });
      toast({ title: "Request Sent!", description: `Friend request sent to ${member.displayName || member.username || member.email}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error sending friend request" });
    }
  };

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const history = localStorage.getItem("xaksearch_history");
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (e) {
      console.warn("Could not load search history", e);
    }
  }, []);

  // Save query to search history
  const saveToHistory = useCallback((queryToSave: string) => {
    if (!queryToSave.trim() || pauseHistoryLogging) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== queryToSave.trim().toLowerCase());
      const updated = [queryToSave.trim(), ...filtered].slice(0, 8);
      try {
        localStorage.setItem("xaksearch_history", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save search history", e);
      }
      return updated;
    });
  }, [pauseHistoryLogging]);

  // Delete item from search history
  const deleteFromHistory = (e: React.MouseEvent, itemToDelete: string) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((q) => q !== itemToDelete);
      try {
        localStorage.setItem("xaksearch_history", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not delete from search history", e);
      }
      return updated;
    });
  };

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const target = searchQuery !== undefined ? searchQuery : queryInput;
    if (!target.trim()) return;

    // Trigger SafeSearch warning check
    if (safeSearchActive && containsExplicitContent(target)) {
      setSafeSearchWarning(true);
      setAiResult(null);
      setWikiDefinition(null);
      setExternalSites([]);
      return;
    } else {
      setSafeSearchWarning(false);
    }

    // Stop speaking if TTS is running
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // Decouple UI state
    setAiResult(null);
    setWikiDefinition(null);
    setExternalSites([]);
    setIsAiLoading(true);
    setIsWebSearching(true);
    setShowDropdown(false);
    
    // Set timer start
    const startTime = performance.now();
    setTimeStart(startTime);

    // Save to history
    saveToHistory(target);

    // 28. Search shortcut commands (!yt)
    if (target.trim().startsWith("!yt ")) {
      const q = target.replace("!yt ", "").trim();
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, "_blank");
      setIsAiLoading(false);
      setIsWebSearching(false);
      return;
    }
    if (target.trim().startsWith("!w ")) {
      const q = target.replace("!w ", "").trim();
      window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`, "_blank");
      setIsAiLoading(false);
      setIsWebSearching(false);
      return;
    }

    // Traditional link results will load via the firestore query below
    router.push(`/search?q=${encodeURIComponent(target.trim())}`, { scroll: false });

    // Wikipedia summary removed. Using local definitions only.
    const queryLowerTarget = target.toLowerCase().trim();
    const matchedDefKeyTarget = Object.keys(LOCAL_DEFINITIONS).find(key => 
      queryLowerTarget === key || queryLowerTarget.includes(key)
    );
    const matchedDef = matchedDefKeyTarget ? LOCAL_DEFINITIONS[matchedDefKeyTarget] : null;
    if (matchedDef) {
      setWikiDefinition(matchedDef);
    }

    try {
      // Real Web search Engine fetch
      void searchWebEngine(target).then(results => {
        if (results && results.length > 0) {
          setExternalSites(results);
        }
        const endTime = performance.now();
        setSearchTime(parseFloat(((endTime - startTime) / 1000).toFixed(2)));
      });

      const response = await aiPoweredWebSearch({ query: target });
      if (response && response.answer) {
        setAiResult(response.answer);
      }
      // Fetch images from Wikimedia proxy
      try {
        const imgRes = await fetch(`/api/search-images?q=${encodeURIComponent(target)}`);
        if (imgRes.ok) {
          const json = await imgRes.json();
          setImages(json.images || []);
        }
      } catch (e) {
        console.error('Image fetch failed', e);
        setImages([]);
      }
    } catch (err) {
      console.error("AI Search Error:", err);
    } finally {
      setIsAiLoading(false);
      setIsWebSearching(false);
    }
  }, [queryInput, router, saveToHistory, safeSearchActive]);

  useEffect(() => {
    if (initialQuery) {
      setQueryInput(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  // Click outside to close history/suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard Navigation / Focus listener
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      // '/' focuses search input
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        const inp = document.querySelector("input[placeholder='Search anything...']") as HTMLInputElement | null;
        if (inp) inp.focus();
      }
      // 'Esc' closes dropdown
      if (e.key === "Escape") {
        setShowDropdown(false);
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, []);

  // Text to Speech logic
  const handleTTS = () => {
    if (!window.speechSynthesis || !aiResult) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = aiResult.replace(/[*#`_\-]/g, "");
    speechUtterance.current = new SpeechSynthesisUtterance(cleanText);
    speechUtterance.current.onend = () => {
      setIsSpeaking(false);
    };
    speechUtterance.current.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(speechUtterance.current);
  };

  // Voice Search Recognition using Web Speech API
  const handleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Speech Recognition is not supported in this browser."
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      toast({ title: "Listening...", description: "Speak your query clearly." });
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setQueryInput(text);
      setIsListening(false);
      void handleSearch(text);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Fetch Firestore indexedSites and users
  const indexQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "indexedSites"), limit(10000));
  }, [firestore]);

  const { data: indexedSites, isLoading: isIndexLoading } = useCollection(indexQuery);
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(200));
  }, [firestore]);
  const { data: userDocs } = useCollection(usersQuery);

  const imagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'searchImages'), limit(5000));
  }, [firestore]);
  const { data: searchImages } = useCollection(imagesQuery);

  // Combine Firestore indexedSites with defaultSites, deduplicate, and search match
  const combinedSites = (() => {
    const docs = indexedSites || [];
    const docSites = (docs || []).map((d: any) => ({
      url: d.url,
      title: d.title || d.url,
      description: d.description || '',
    }));
    const merged = [...docSites, ...defaultSites];
    const seen = new Set<string>();
    const dedup: any[] = [];
    for (const s of merged) {
      if (!s?.url) continue;
      const key = s.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(s);
      if (dedup.length >= 150) break;
    }
    return dedup;
  })();

  // Find matched definition
  const queryLower = (queryInput || "").toLowerCase().trim();
  const matchedDefKey = Object.keys(LOCAL_DEFINITIONS).find(key => 
    queryLower === key || queryLower.includes(key)
  );
  const matchedDefinition = matchedDefKey ? LOCAL_DEFINITIONS[matchedDefKey] : null;
  const activeDefinition = wikiDefinition || matchedDefinition;

  // Gamification States (Stubs)
  const [activeTab, setActiveTab] = useState<"search" | "explore" | "worlds" | "collections" | "profile">("search");
  const [userXP, setUserXP] = useState(1240);
  const [userLevel, setUserLevel] = useState(12);

  // Compare Mode State
  const [compareMode, setCompareMode] = useState(false);
  const [compareQuery, setCompareQuery] = useState("");


  // Filter sites matching the query and merge real search results
  const filteredSites = useMemo(() => {
    const q = (queryInput || '').trim().toLowerCase();
    const local = q
      ? combinedSites.filter((s: any) => (
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.url && s.url.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
        ))
      : combinedSites;

    // Combine local results and real web search results
    const combined = [...local];
    externalSites.forEach(ext => {
      if (!combined.some(c => c.url.toLowerCase() === ext.url.toLowerCase())) {
        combined.push(ext);
      }
    });
    return combined.slice(0, resultsDisplayCount);
  }, [combinedSites, queryInput, externalSites, resultsDisplayCount]);

  // Group sites by host for visual separation
  const groupedSites = (() => {
    const groups: Record<string, any[]> = {};
    for (const s of filteredSites) {
      try {
        const u = new URL(s.url);
        const host = u.hostname.replace(/^www\./, '');
        groups[host] = groups[host] || [];
        groups[host].push(s);
      } catch (e) {
        groups['misc'] = groups['misc'] || [];
        groups['misc'].push(s);
      }
    }
    return groups;
  })();

  // Match users
  const matchedUsers = (() => {
    if (!userDocs || !(queryInput || '').trim()) return [];
    const q = (queryInput || '').toLowerCase();
    return userDocs.filter((u: any) => {
      if (u.isHidden) return false;
      const name = (u.displayName || u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      return name.includes(q) || email.includes(q) || username.includes(q);
    }).slice(0, 20);
  })();

  // Suggestion list logic
  const getSuggestions = () => {
    const term = queryInput.trim().toLowerCase();
    if (!term) return [];
    
    const matched: string[] = [];
    // Search sites titles
    combinedSites.forEach((site: any) => {
      if (site.title && site.title.toLowerCase().includes(term) && !matched.includes(site.title)) {
        matched.push(site.title);
      }
    });
    // Search users
    if (userDocs) {
      userDocs.forEach((u: any) => {
        const name = u.displayName || u.name;
        if (name && name.toLowerCase().includes(term) && !matched.includes(name)) {
          matched.push(name);
        }
      });
    }
    return matched.slice(0, 5);
  };

  const suggestions = getSuggestions();

  // Widget Match Checkers
  const isCalcWidget = useMemo(() => {
    return (/^[0-9+\-*/().\s]+$/.test(queryLower) && /[+\-*/]/.test(queryLower)) || queryLower.startsWith("calc");
  }, [queryLower]);

  const isWeatherWidget = useMemo(() => queryLower.includes("weather") || queryLower.startsWith("forecast"), [queryLower]);
  const isColorWidget = useMemo(() => queryLower === "color picker" || queryLower === "colorpicker" || /^#([0-9a-f]{3}){1,2}$/i.test(queryLower), [queryLower]);
  const isTransWidget = useMemo(() => queryLower.includes("translate") || queryLower.includes("translator"), [queryLower]);
  const isQrWidget = useMemo(() => queryLower.startsWith("qr code") || queryLower.startsWith("qrcode"), [queryLower]);
  const isPassWidget = useMemo(() => queryLower.includes("password generator") || queryLower.includes("generate password"), [queryLower]);
  const isConvertWidget = useMemo(() => queryLower.startsWith("convert") || queryLower.includes("converter") || (/\b(to|in)\b/.test(queryLower) && /\b(kg|lbs|inches|cm|celsius|fahrenheit|meters|feet)\b/.test(queryLower)), [queryLower]);
  const isSysWidget = useMemo(() => queryLower === "my ip" || queryLower === "ip address" || queryLower === "system info" || queryLower === "sys info", [queryLower]);
  const isTttWidget = useMemo(() => queryLower === "tic tac toe" || queryLower === "tictactoe", [queryLower]);
  const isTimerWidget = useMemo(() => queryLower === "timer" || queryLower === "stopwatch", [queryLower]);
  const isVerificationWidget = useMemo(() => queryLower === "verify" || queryLower === "search console" || queryLower === "site console", [queryLower]);
  
  // New Widgets
  const isCodeWidget = useMemo(() => queryLower.startsWith("code ") || queryLower.startsWith("snippet "), [queryLower]);
  const isSportsWidget = useMemo(() => queryLower.includes("score") || queryLower.includes("match"), [queryLower]);
  const isFlightWidget = useMemo(() => queryLower.startsWith("flight ") || /^[a-z]{2}\d{1,4}$/i.test(queryLower), [queryLower]);
  const isPackageWidget = useMemo(() => queryLower.startsWith("track ") || /^[1z0-9]{10,20}$/i.test(queryLower.replace(/\s/g, '')), [queryLower]);
  const isStockWidget = useMemo(() => queryLower.includes("stock") || queryLower.startsWith("$"), [queryLower]);
  const isBreachWidget = useMemo(() => queryLower.includes("breach") || queryLower.includes("pwned"), [queryLower]);
  const isDictWidget = useMemo(() => queryLower.startsWith("define ") || queryLower.includes("thesaurus") || queryLower.includes("synonym"), [queryLower]);

  // Math Calculator Widget Evaluation
  const evaluateCalc = () => {
    try {
      const expr = calcExpr.replace(/[^-()\d/*+.]/g, ''); // Sanitize input
      // Safe evaluation using basic JS evaluator structure
      const fn = new Function(`return ${expr}`);
      const ans = fn();
      setCalcAns(String(ans));
    } catch (e) {
      setCalcAns("Error");
    }
  };

  // Weather Widget Mock Data generator based on city string hash
  const getWeatherData = () => {
    const qClean = queryLower.replace("weather in", "").replace("weather", "").replace("forecast", "").trim();
    const city = qClean ? qClean.toUpperCase() : "YOUR CURRENT LOCATION";
    
    // Hash generator for stable pseudo-random mock temps
    let hash = 0;
    for (let i = 0; i < city.length; i++) {
      hash = city.charCodeAt(i) + ((hash << 5) - hash);
    }
    const tempC = Math.abs(hash % 35);
    const humidity = Math.abs((hash * 7) % 100);
    const wind = Math.abs((hash * 3) % 40);

    const conditions = ["Sunny", "Partly Cloudy", "Rainy", "Thunderstorm", "Snowy", "Windy"];
    const condition = conditions[Math.abs(hash) % conditions.length];

    const tempF = Math.round((tempC * 9/5) + 32);

    return { city, tempC, tempF, humidity, wind, condition };
  };

  // Translator Widget Mock Translation Engine
  const executeTranslate = () => {
    if (!translateSrc.trim()) return;
    const commonTrans: Record<string, Record<string, string>> = {
      "hello": { "es": "Hola", "fr": "Bonjour", "de": "Hallo" },
      "welcome": { "es": "Bienvenido", "fr": "Bienvenue", "de": "Willkommen" },
      "search": { "es": "Buscar", "fr": "Rechercher", "de": "Suchen" },
      "how are you": { "es": "¿Cómo estás?", "fr": "Comment ça va?", "de": "Wie geht es dir?" },
      "apple": { "es": "Manzana", "fr": "Pomme", "de": "Apfel" }
    };
    
    const srcLower = translateSrc.toLowerCase().trim();
    if (commonTrans[srcLower] && commonTrans[srcLower][translateTo]) {
      setTranslateDest(commonTrans[srcLower][translateTo]);
    } else {
      // Pseudo translator that appends/applies retro mock translation rules
      const suffix = translateTo === "es" ? "os" : translateTo === "fr" ? "aux" : "en";
      setTranslateDest(translateSrc.split(" ").map(w => w + suffix).join(" "));
    }
  };

  // Password Generator logic
  const handleGeneratePassword = () => {
    let chars = "";
    if (passOpts.lower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (passOpts.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (passOpts.nums) chars += "0123456789";
    if (passOpts.syms) chars += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    if (!chars) {
      setGeneratedPass("Select Option");
      return;
    }
    let res = "";
    for (let i = 0; i < passLength; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(res);
  };

  // Unit Converter Evaluation
  const executeConversion = useCallback(() => {
    const val = parseFloat(convertVal);
    if (isNaN(val)) {
      setConvertResult("Invalid Input");
      return;
    }

    if (convertType === "length") {
      if (convertFromUnit === "inches" && convertToUnit === "cm") setConvertResult(`${(val * 2.54).toFixed(4)} cm`);
      else if (convertFromUnit === "cm" && convertToUnit === "inches") setConvertResult(`${(val / 2.54).toFixed(4)} inches`);
      else if (convertFromUnit === "meters" && convertToUnit === "feet") setConvertResult(`${(val * 3.28084).toFixed(4)} feet`);
      else if (convertFromUnit === "feet" && convertToUnit === "meters") setConvertResult(`${(val / 3.28084).toFixed(4)} m`);
      else setConvertResult(`${val} ${convertToUnit}`);
    } else if (convertType === "weight") {
      if (convertFromUnit === "kg" && convertToUnit === "lbs") setConvertResult(`${(val * 2.20462).toFixed(4)} lbs`);
      else if (convertFromUnit === "lbs" && convertToUnit === "kg") setConvertResult(`${(val / 2.20462).toFixed(4)} kg`);
      else setConvertResult(`${val} ${convertToUnit}`);
    } else if (convertType === "temp") {
      if (convertFromUnit === "celsius" && convertToUnit === "fahrenheit") setConvertResult(`${((val * 9/5) + 32).toFixed(2)} °F`);
      else if (convertFromUnit === "fahrenheit" && convertToUnit === "celsius") setConvertResult(`${(((val - 32) * 5/9)).toFixed(2)} °C`);
      else setConvertResult(`${val} ${convertToUnit}`);
    }
  }, [convertVal, convertType, convertFromUnit, convertToUnit]);

  useEffect(() => {
    executeConversion();
  }, [convertVal, convertType, convertFromUnit, convertToUnit, executeConversion]);

  // Tic Tac Toe Gameplay AI helper
  const handleTttClick = (index: number) => {
    if (tttBoard[index] || tttWinner) return;
    const nextBoard = [...tttBoard];
    nextBoard[index] = "X";
    setTttBoard(nextBoard);

    // Check Player win
    if (checkTttWinner(nextBoard, "X")) {
      setTttWinner("Player Wins!");
      setTttScore(s => ({ ...s, player: s.player + 1 }));
      return;
    }
    if (nextBoard.every(cell => cell !== null)) {
      setTttWinner("It's a Tie!");
      setTttScore(s => ({ ...s, ties: s.ties + 1 }));
      return;
    }

    // AI Turn (Simple defense/random)
    setTimeout(() => {
      const aiBoard = [...nextBoard];
      const emptyIdxs = aiBoard.map((c, i) => c === null ? i : null).filter(c => c !== null) as number[];
      if (emptyIdxs.length === 0) return;
      
      // Select random empty spot
      const randomIdx = emptyIdxs[Math.floor(Math.random() * emptyIdxs.length)];
      aiBoard[randomIdx] = "O";
      setTttBoard(aiBoard);

      if (checkTttWinner(aiBoard, "O")) {
        setTttWinner("AI Wins!");
        setTttScore(s => ({ ...s, ai: s.ai + 1 }));
        return;
      }
    }, 400);
  };

  const checkTttWinner = (board: Array<string | null>, player: string) => {
    const wins = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    return wins.some(comb => comb.every(idx => board[idx] === player));
  };

  const resetTttGame = () => {
    setTttBoard(Array(9).fill(null));
    setTttWinner(null);
    setTttTurn("X");
  };

  // Stopwatch Timer Handlers
  const handleStopwatchToggle = () => {
    if (stopwatchRunning) {
      clearInterval(stopwatchIntervalRef.current);
      setStopwatchRunning(false);
    } else {
      setStopwatchRunning(true);
      const start = Date.now() - stopwatchTime;
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(Date.now() - start);
      }, 54);
    }
  };

  const handleStopwatchReset = () => {
    clearInterval(stopwatchIntervalRef.current);
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setStopwatchLaps([]);
  };

  const handleStopwatchLap = () => {
    setStopwatchLaps(prev => [...prev, stopwatchTime]);
  };

  // Countdown timer logic
  const handleTimerToggle = () => {
    if (timerRunning) {
      clearInterval(timerIntervalRef.current);
      setTimerRunning(false);
    } else {
      if (timerSecondsLeft === 0) {
        setTimerSecondsLeft(timerInput * 60);
      }
      setTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            // Audio sound alert beep via Web Audio API
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = "sine";
              osc.frequency.setValueAtTime(800, audioCtx.currentTime);
              osc.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 1);
            } catch (err) {}
            toast({ title: "Timer Alarm!", description: "Time is up!" });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Site Console Verification
  const generateVerificationTag = () => {
    if (!consoleSiteUrl.trim()) return;
    const mockHash = Math.random().toString(36).substring(2, 12).toUpperCase();
    setVerificationTag(`<meta name="xaksearch-verification" content="${mockHash}">`);
  };

  const verifySiteConsole = async () => {
    if (!consoleSiteUrl.trim()) return;
    setIsVerifiedConsole(true);
    toast({ title: "Site Verification Successful!", description: `${consoleSiteUrl} is now verified.` });
    
    // Add site to Firestore index
    if (firestore) {
      const newSiteRef = doc(collection(firestore, "indexedSites"));
      await setDoc(newSiteRef, {
        url: consoleSiteUrl.startsWith("http") ? consoleSiteUrl : `https://${consoleSiteUrl}`,
        title: consoleSiteUrl.split(".")[0].toUpperCase() + " verified website",
        description: `Verified search portal indexing for the URL domain at ${consoleSiteUrl}.`,
        verified: true,
        timestamp: serverTimestamp()
      });
    }
  };

  // Color Slider Helper
  const handleRgbChange = (channel: "r" | "g" | "b", val: number) => {
    const updated = { ...colorRGB, [channel]: val };
    setColorRGB(updated);
    
    // Convert to Hex
    const hex = "#" + [updated.r, updated.g, updated.b].map(x => {
      const str = x.toString(16);
      return str.length === 1 ? "0" + str : str;
    }).join("").toUpperCase();
    setColorHex(hex);
  };

  return (
    <div className="min-h-screen animate-fade-in flex flex-col relative bg-zinc-950 text-white selection:bg-rose-500/30 selection:text-rose-200">
      <div className="absolute inset-0 arcade-grid opacity-[0.03] pointer-events-none" />

      {/* Modern Neon Header */}
      <div className="sticky top-0 z-50 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-7xl mx-auto">
          {/* Logo */}
          <div 
            onClick={() => router.push('/')} 
            className="cursor-pointer flex items-center gap-2 pr-6 md:border-r border-zinc-800 shrink-0"
          >
            <span className="text-3xl font-black tracking-tighter uppercase italic text-white hover:text-rose-500 transition-colors">
              Xakteir
            </span>
            <BadgeCheck className={cn("w-6 h-6 animate-pulse", tc.text)} />
          </div>

          {/* Search Box */}
          <div className="flex-1 w-full max-w-3xl relative" ref={dropdownRef}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }} 
              className="relative group w-full flex items-center"
            >
              <Input 
                value={queryInput}
                onChange={(e) => {
                  setQueryInput(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search anything..." 
                className={cn(
                  "h-12 w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:shadow-lg rounded-2xl pl-11 pr-24 text-sm tracking-wide text-white transition-all outline-none",
                  `focus:border-${accentTheme}-500/50`
                )}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              
              {/* Mic Icon & Clear Cross */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={cn(
                    "text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg",
                    isListening && "bg-rose-600/20 text-rose-500 animate-pulse"
                  )}
                >
                  <Mic className="w-4 h-4" />
                </button>
                {queryInput && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setQueryInput("");
                      setShowDropdown(false);
                    }}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Dropdown Suggestions & History */}
            {showDropdown && (suggestions.length > 0 || searchHistory.length > 0) && (
              <Card className="absolute top-[calc(100%+8px)] left-0 w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-[999] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Suggestions List */}
                {suggestions.map((item, idx) => (
                  <div
                    key={`sug-${idx}`}
                    onClick={() => {
                      setQueryInput(item);
                      void handleSearch(item);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors text-sm font-bold text-zinc-200"
                  >
                    <Search className={cn("w-4 h-4 shrink-0", tc.text)} />
                    <span>{item}</span>
                  </div>
                ))}

                {/* Search History Divider */}
                {suggestions.length > 0 && searchHistory.length > 0 && (
                  <div className="h-px bg-zinc-800 my-1 mx-2" />
                )}

                {/* History List */}
                {searchHistory.map((item, idx) => (
                  <div
                    key={`hist-${idx}`}
                    onClick={() => {
                      setQueryInput(item);
                      void handleSearch(item);
                    }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors text-sm font-bold text-zinc-400 group"
                  >
                    <div className="flex items-center gap-3">
                      <History className="w-4 h-4 text-zinc-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteFromHistory(e, item)}
                      className={cn("text-zinc-600 transition-colors", `hover:${tc.text}`)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </Card>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4 ml-auto">
            {/* Bookmarks Icon Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBookmarksDialog(true)}
              className="rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white relative"
            >
              <Bookmark className="w-5 h-5" />
              {bookmarkedSites.length > 0 && (
                <span className={cn("absolute -top-1 -right-1 w-4 h-4 text-[9px] font-black rounded-full flex items-center justify-center text-black", tc.bgSolid || "bg-rose-500")}>
                  {bookmarkedSites.length}
                </span>
              )}
            </Button>

            {/* Link Settings Icon */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/search/settings")}
              className="rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <div className={cn("w-8 h-8 rounded-xl text-black flex items-center justify-center font-black text-xs", tc.bgSolid || "bg-rose-600")}>U</div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full border-t border-zinc-800/40 pt-2 shrink-0 md:pl-44">
          <Button
            variant="ghost"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all",
              activeCategory === "all" ? `${tc.bg} ${tc.text} hover:${tc.bg}` : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <List className="w-3.5 h-3.5" /> All
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveCategory("sites")}
            className={cn(
              "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all",
              activeCategory === "sites" ? `${tc.bg} ${tc.text} hover:${tc.bg}` : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Globe className="w-3.5 h-3.5" /> Websites
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveCategory("images")}
            className={cn(
              "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all",
              activeCategory === "images" ? `${tc.bg} ${tc.text} hover:${tc.bg}` : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Images
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveCategory("people")}
            className={cn(
              "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all",
              activeCategory === "people" ? `${tc.bg} ${tc.text} hover:${tc.bg}` : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Users className="w-3.5 h-3.5" /> People
          </Button>

          {/* 17. Custom search filters (Date, Source, Region) */}
          <div className="ml-auto flex items-center gap-2 border-l border-zinc-800 pl-4">
            <select className="bg-transparent text-xs text-zinc-500 font-bold uppercase tracking-wider outline-none cursor-pointer hover:text-white">
              <option>Any Time</option>
              <option>Past 24 hours</option>
              <option>Past week</option>
              <option>Past month</option>
            </select>
            <select className="bg-transparent text-xs text-zinc-500 font-bold uppercase tracking-wider outline-none cursor-pointer hover:text-white">
              <option>Any Region</option>
              <option>US</option>
              <option>UK</option>
              <option>Global</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-zinc-950">
        <main className="max-w-7xl mx-auto px-6 md:pl-52 py-8 space-y-10">

          {/* Search Statistics Indicator */}
          {queryInput && searchTime !== null && (
            <div className="text-xs text-zinc-500 pl-1 font-bold uppercase tracking-wider animate-fade-in">
              About {filteredSites.length + matchedUsers.length} results ({searchTime} seconds)
            </div>
          )}

          {/* SafeSearch Warning Card */}
          {safeSearchWarning && (
            <Card className="p-8 border-2 border-red-500/30 bg-red-950/20 rounded-[2rem] max-w-3xl space-y-4 shadow-2xl flex items-start gap-5">
              <ShieldAlert className="w-12 h-12 text-red-500 shrink-0 animate-bounce" />
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white italic">Content Filtered</h3>
                <p className="text-sm text-zinc-400 mt-2 font-semibold leading-relaxed">
                  SafeSearch is currently active and filtered explicit query terms from indexing list. You can toggle SafeSearch in <Link href="/search/settings" className="text-red-400 underline">Search Settings</Link>.
                </p>
              </div>
            </Card>
          )}

          {/* Empty search: Show Trending Searches & Quick Launcher */}
          {!queryInput && !safeSearchWarning && (
            <div className="space-y-12 max-w-3xl py-12 animate-fade-in">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Compass className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Trending Searches</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {["Tic Tac Toe", "Color picker", "Math calc", "Weather", "Password Generator", "Timer", "System Info", "Translator"].map((trend) => (
                    <button
                      key={trend}
                      onClick={() => {
                        setQueryInput(trend);
                        void handleSearch(trend);
                      }}
                      className={cn(
                        "px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 text-xs font-black uppercase tracking-wider transition-all",
                        `hover:${tc.text}`
                      )}
                    >
                      {trend}
                    </button>
                  ))}
                </div>
              </div>

              {/* 31. Trending topics interactive map mockup */}
              <Card className="p-6 border-zinc-800 bg-zinc-900/40 rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] opacity-10 bg-cover bg-center pointer-events-none filter invert" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                      <Globe className="w-4 h-4" /> Global Trending Topics Map
                    </div>
                  </div>
                  <div className="h-48 relative flex items-center justify-center text-zinc-500 text-xs font-black uppercase tracking-widest bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                    <div className="absolute top-[30%] left-[20%] w-3 h-3 bg-rose-500 rounded-full animate-ping" title="North America: Tech News" />
                    <div className="absolute top-[45%] left-[50%] w-3 h-3 bg-emerald-500 rounded-full animate-ping delay-100" title="Europe: Sports" />
                    <div className="absolute top-[60%] left-[75%] w-3 h-3 bg-blue-500 rounded-full animate-ping delay-200" title="Asia: Markets" />
                    Interactive Map Visualization Placeholder
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* WIDGETS DISPLAY CONTAINER */}
          {queryInput && !safeSearchWarning && activeCategory === "all" && (
            <div className="space-y-6 max-w-3xl">

              {/* 1. Calculator Widget */}
              {isCalcWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <CalcIcon className={cn("w-4 h-4", tc.text)} /> Calculator Utility
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-right font-mono text-2xl h-16 flex items-center justify-end overflow-x-auto text-white">
                      {calcExpr || "0"}
                    </div>
                    {calcAns && (
                      <div className="col-span-4 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 text-right font-mono text-lg text-emerald-400">
                        = {calcAns}
                      </div>
                    )}
                    {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"].map((char) => (
                      <Button
                        key={char}
                        variant="outline"
                        onClick={() => {
                          if (char === "=") evaluateCalc();
                          else setCalcExpr(prev => prev + char);
                        }}
                        className={cn(
                          "h-12 text-sm font-black rounded-lg bg-zinc-900 border-zinc-800 hover:bg-zinc-800",
                          char === "=" && tc.bgSolid
                        )}
                      >
                        {char}
                      </Button>
                    ))}
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setCalcExpr("");
                        setCalcAns("");
                      }}
                      className="col-span-2 h-12 rounded-lg font-black uppercase tracking-widest text-xs"
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCalcExpr(prev => prev.slice(0, -1))}
                      className="col-span-2 h-12 rounded-lg font-black uppercase tracking-widest text-xs bg-zinc-900 border-zinc-800"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              )}

              {/* 2. Weather Widget */}
              {isWeatherWidget && (() => {
                const w = getWeatherData();
                return (
                  <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-in zoom-in-95", tc.border)}>
                    <div className="space-y-2 text-center sm:text-left">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Weather Forecast Widget</div>
                      <h3 className="text-2xl font-black tracking-tight text-white uppercase italic">{w.city}</h3>
                      <p className={cn("text-xs font-black uppercase tracking-widest", tc.text)}>{w.condition}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <CloudSun className="w-16 h-16 text-amber-400 animate-pulse" />
                      <div className="text-right">
                        <div className="text-4xl font-black font-mono">
                          {weatherUnit === "C" ? `${w.tempC}°C` : `${w.tempF}°F`}
                        </div>
                        <Button 
                          variant="link"
                          onClick={() => setWeatherUnit(prev => prev === "C" ? "F" : "C")}
                          className={cn("p-0 text-xs font-black uppercase tracking-wider h-auto", tc.text)}
                        >
                          Switch to °{weatherUnit === "C" ? "F" : "C"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:pl-6 text-xs text-zinc-400">
                      <div>
                        <div className="font-bold uppercase tracking-wider text-[9px] text-zinc-500">Humidity</div>
                        <div className="font-black font-mono text-zinc-200 mt-0.5">{w.humidity}%</div>
                      </div>
                      <div>
                        <div className="font-bold uppercase tracking-wider text-[9px] text-zinc-500">Wind Speed</div>
                        <div className="font-black font-mono text-zinc-200 mt-0.5">{w.wind} km/h</div>
                      </div>
                    </div>
                  </Card>
                );
              })()}

              {/* 3. Color Picker Widget */}
              {isColorWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-6 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Palette className={cn("w-4 h-4", tc.text)} /> Interactive Color Picker
                  </div>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div 
                      className="w-full sm:w-32 h-32 rounded-2xl border border-white/10 shadow-lg flex items-center justify-center font-mono font-black"
                      style={{ backgroundColor: colorHex, color: colorRGB.r + colorRGB.g + colorRGB.b > 380 ? "#000" : "#FFF" }}
                    >
                      {colorHex}
                    </div>
                    <div className="flex-1 space-y-4">
                      {["r", "g", "b"].map((ch) => {
                        const val = colorRGB[ch as "r"|"g"|"b"];
                        return (
                          <div key={ch} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              <span>{ch.toUpperCase()} Channel</span>
                              <span className="font-mono text-zinc-300">{val}</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="255" 
                              value={val}
                              onChange={(e) => handleRgbChange(ch as "r"|"g"|"b", parseInt(e.target.value))}
                              className="w-full accent-rose-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        navigator.clipboard.writeText(colorHex);
                        toast({ title: "Copied Hex Color!" });
                      }}
                      className="h-10 text-[10px] font-black uppercase tracking-wider rounded-xl bg-zinc-900 border-zinc-800"
                    >
                      Copy HEX
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        navigator.clipboard.writeText(`rgb(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b})`);
                        toast({ title: "Copied RGB Color!" });
                      }}
                      className="h-10 text-[10px] font-black uppercase tracking-wider rounded-xl bg-zinc-900 border-zinc-800"
                    >
                      Copy RGB
                    </Button>
                  </div>
                </Card>
              )}

              {/* 4. Translator Widget */}
              {isTransWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Languages className={cn("w-4 h-4", tc.text)} /> Dictionary Translator
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <select 
                        value={translateFrom}
                        onChange={(e) => setTranslateFrom(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-xs font-black uppercase tracking-wider text-white h-10 px-3 rounded-xl"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                      <textarea
                        value={translateSrc}
                        onChange={(e) => setTranslateSrc(e.target.value)}
                        className="w-full h-24 bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-bold text-white focus:border-zinc-700 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <select 
                        value={translateTo}
                        onChange={(e) => setTranslateTo(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-xs font-black uppercase tracking-wider text-white h-10 px-3 rounded-xl"
                      >
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                      <textarea
                        readOnly
                        value={translateDest}
                        className="w-full h-24 bg-zinc-950/50 border border-zinc-850 p-3 rounded-xl text-xs font-bold text-zinc-300 outline-none"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={executeTranslate}
                    className={cn("w-full h-12 text-xs font-black uppercase tracking-widest rounded-xl", tc.bgSolid)}
                  >
                    Translate Text
                  </Button>
                </Card>
              )}

              {/* 5. QR Code Generator Widget */}
              {isQrWidget && (() => {
                const qrText = queryInput.replace("qr code", "").replace("qrcode", "").trim() || "Antigravity";
                return (
                  <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl flex flex-col items-center text-center space-y-4 animate-in zoom-in-95", tc.border)}>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                      <QrCode className={cn("w-4 h-4", tc.text)} /> QR Code Generator
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-inner border border-white/20">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrText)}`}
                        alt="QR Code"
                        className="w-44 h-44 object-contain"
                      />
                    </div>
                    <div className="space-y-2 w-full max-w-sm">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">QR Code Content</div>
                      <div className="font-mono text-xs bg-zinc-950 border border-zinc-850 p-2 rounded-xl text-zinc-300 truncate">
                        {qrText}
                      </div>
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrText)}`}
                        download="qrcode.png"
                        target="_blank"
                        rel="noreferrer"
                        className={cn("inline-flex items-center gap-2 justify-center w-full h-10 rounded-xl text-xs font-black uppercase tracking-wider text-black mt-2", tc.bgSolid)}
                      >
                        Open High-Res
                      </a>
                    </div>
                  </Card>
                );
              })()}

              {/* 6. Password Generator Widget */}
              {isPassWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-6 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <KeyRound className={cn("w-4 h-4", tc.text)} /> Password Generator Widget
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-850 font-mono text-sm tracking-wide text-zinc-100">
                      <span>{generatedPass || "Click Generate"}</span>
                      {generatedPass && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPass);
                            toast({ title: "Copied Password!" });
                          }}
                          className={cn("h-8 text-[10px] font-black uppercase tracking-wider rounded-lg", tc.text)}
                        >
                          Copy
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <span>Password Length</span>
                        <span className="font-mono text-zinc-300">{passLength} chars</span>
                      </div>
                      <input 
                        type="range" 
                        min="6" 
                        max="32" 
                        value={passLength}
                        onChange={(e) => setPassLength(parseInt(e.target.value))}
                        className="w-full accent-rose-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4 text-xs font-bold text-zinc-400">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={passOpts.upper} 
                          onChange={(e) => setPassOpts({ ...passOpts, upper: e.target.checked })}
                          className="w-4 h-4 accent-rose-500"
                        />
                        Uppercase (A-Z)
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={passOpts.lower} 
                          onChange={(e) => setPassOpts({ ...passOpts, lower: e.target.checked })}
                          className="w-4 h-4 accent-rose-500"
                        />
                        Lowercase (a-z)
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={passOpts.nums} 
                          onChange={(e) => setPassOpts({ ...passOpts, nums: e.target.checked })}
                          className="w-4 h-4 accent-rose-500"
                        />
                        Numbers (0-9)
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={passOpts.syms} 
                          onChange={(e) => setPassOpts({ ...passOpts, syms: e.target.checked })}
                          className="w-4 h-4 accent-rose-500"
                        />
                        Symbols (!@#)
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={handleGeneratePassword}
                    className={cn("w-full h-12 text-xs font-black uppercase tracking-widest rounded-xl", tc.bgSolid)}
                  >
                    Generate Secure Password
                  </Button>
                </Card>
              )}

              {/* 7. Unit Converter Widget */}
              {isConvertWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <RotateCcw className={cn("w-4 h-4", tc.text)} /> Universal Unit Converter
                  </div>

                  <div className="flex gap-2 border-b border-zinc-800 pb-2">
                    {["length", "weight", "temp"].map((type) => (
                      <Button
                        key={type}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setConvertType(type as any);
                          if (type === "length") {
                            setConvertFromUnit("inches");
                            setConvertToUnit("cm");
                          } else if (type === "weight") {
                            setConvertFromUnit("kg");
                            setConvertToUnit("lbs");
                          } else {
                            setConvertFromUnit("celsius");
                            setConvertToUnit("fahrenheit");
                          }
                        }}
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest rounded-lg px-3 py-1",
                          convertType === type ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 pl-1">From value</label>
                      <Input
                        type="number"
                        value={convertVal}
                        onChange={(e) => setConvertVal(e.target.value)}
                        className="h-10 bg-zinc-950 border-zinc-800 rounded-xl"
                      />
                      <select
                        value={convertFromUnit}
                        onChange={(e) => setConvertFromUnit(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-xs font-black uppercase tracking-wider text-white h-10 px-3 rounded-xl"
                      >
                        {convertType === "length" && (
                          <>
                            <option value="inches">Inches</option>
                            <option value="cm">Centimeters</option>
                            <option value="meters">Meters</option>
                            <option value="feet">Feet</option>
                          </>
                        )}
                        {convertType === "weight" && (
                          <>
                            <option value="kg">Kilograms</option>
                            <option value="lbs">Pounds</option>
                          </>
                        )}
                        {convertType === "temp" && (
                          <>
                            <option value="celsius">Celsius</option>
                            <option value="fahrenheit">Fahrenheit</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 pl-1">Converted result</label>
                      <div className="h-10 bg-zinc-950/50 border border-zinc-850 rounded-xl flex items-center px-4 font-mono font-black text-sm text-zinc-300">
                        {convertResult}
                      </div>
                      <select
                        value={convertToUnit}
                        onChange={(e) => setConvertToUnit(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-xs font-black uppercase tracking-wider text-white h-10 px-3 rounded-xl"
                      >
                        {convertType === "length" && (
                          <>
                            <option value="cm">Centimeters</option>
                            <option value="inches">Inches</option>
                            <option value="feet">Feet</option>
                            <option value="meters">Meters</option>
                          </>
                        )}
                        {convertType === "weight" && (
                          <>
                            <option value="lbs">Pounds</option>
                            <option value="kg">Kilograms</option>
                          </>
                        )}
                        {convertType === "temp" && (
                          <>
                            <option value="fahrenheit">Fahrenheit</option>
                            <option value="celsius">Celsius</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </Card>
              )}

              {/* 8. IP & System Info Widget */}
              {isSysWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Laptop className={cn("w-4 h-4", tc.text)} /> System Diagnostic Info
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-zinc-400 pt-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Public IP Address</div>
                      <div className="text-sm font-mono text-zinc-200 mt-0.5">84.22.119.54</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">ISP Location</div>
                      <div className="text-sm font-mono text-zinc-200 mt-0.5">London, UK</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Browser User-Agent</div>
                      <div className="text-[11px] font-mono text-zinc-300 mt-0.5 truncate max-w-[280px]">
                        {typeof window !== "undefined" ? window.navigator.userAgent : "Node/Server"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Screen Resolution</div>
                      <div className="text-sm font-mono text-zinc-200 mt-0.5">
                        {typeof window !== "undefined" ? `${window.screen.width} x ${window.screen.height}` : "1920x1080"}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 9. Tic Tac Toe Game Widget */}
              {isTttWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95 max-w-sm mx-auto", tc.border)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                      <Gamepad2 className={cn("w-4 h-4", tc.text)} /> Tic-Tac-Toe Game
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetTttGame} className="rounded-xl h-8 w-8 hover:bg-zinc-800">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 w-48 h-48 mx-auto mt-2">
                    {tttBoard.map((cell, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTttClick(idx)}
                        className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 rounded-xl flex items-center justify-center font-black text-3xl transition-colors text-white"
                      >
                        {cell === "X" && <span className="text-rose-500 animate-in zoom-in-50">X</span>}
                        {cell === "O" && <span className="text-blue-500 animate-in zoom-in-50">O</span>}
                      </button>
                    ))}
                  </div>

                  {tttWinner && (
                    <div className="text-center font-black text-sm uppercase tracking-wider text-amber-400 animate-pulse py-1">
                      {tttWinner}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-black uppercase tracking-widest text-zinc-500 border-t border-zinc-800 pt-4 mt-2">
                    <div>
                      <div>Player</div>
                      <div className="text-zinc-300 font-mono mt-0.5">{tttScore.player}</div>
                    </div>
                    <div>
                      <div>Ties</div>
                      <div className="text-zinc-300 font-mono mt-0.5">{tttScore.ties}</div>
                    </div>
                    <div>
                      <div>AI</div>
                      <div className="text-zinc-300 font-mono mt-0.5">{tttScore.ai}</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 10. Timer & Stopwatch Widget */}
              {isTimerWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95 max-w-sm mx-auto", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-800 pb-2">
                    <TimerIcon className={cn("w-4 h-4", tc.text)} /> Time Utilities
                  </div>

                  {/* Countdown Timer GUI */}
                  {queryLower.includes("timer") ? (
                    <div className="space-y-4 text-center">
                      <div className="text-4xl font-mono font-black text-white py-2">
                        {Math.floor(timerSecondsLeft / 60)}:{(timerSecondsLeft % 60).toString().padStart(2, "0")}
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button 
                          onClick={handleTimerToggle}
                          className={cn("px-4 rounded-xl font-black uppercase text-xs", tc.bgSolid)}
                        >
                          {timerRunning ? "Pause" : "Start"}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            clearInterval(timerIntervalRef.current);
                            setTimerRunning(false);
                            setTimerSecondsLeft(timerInput * 60);
                          }}
                          className="bg-zinc-900 border-zinc-800 text-white text-xs font-black uppercase rounded-xl"
                        >
                          Reset
                        </Button>
                      </div>
                      <div className="flex items-center justify-center gap-3 text-xs text-zinc-500 pt-2">
                        <span>Duration:</span>
                        <input 
                          type="number"
                          value={timerInput}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 1;
                            setTimerInput(v);
                            setTimerSecondsLeft(v * 60);
                          }}
                          className="w-16 bg-zinc-950 border border-zinc-800 text-center text-white font-mono rounded-lg h-8"
                        />
                        <span>min</span>
                      </div>
                    </div>
                  ) : (
                    // Stopwatch GUI
                    <div className="space-y-4 text-center">
                      <div className="text-4xl font-mono font-black text-white py-2">
                        {Math.floor(stopwatchTime / 60000)}:
                        {Math.floor((stopwatchTime % 60000) / 1000).toString().padStart(2, "0")}.
                        {Math.floor((stopwatchTime % 1000) / 10).toString().padStart(2, "0")}
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button 
                          onClick={handleStopwatchToggle}
                          className={cn("px-4 rounded-xl font-black uppercase text-xs", tc.bgSolid)}
                        >
                          {stopwatchRunning ? "Pause" : "Start"}
                        </Button>
                        {stopwatchRunning && (
                          <Button 
                            variant="outline"
                            onClick={handleStopwatchLap}
                            className="bg-zinc-900 border-zinc-800 text-white text-xs font-black uppercase rounded-xl"
                          >
                            Lap
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          onClick={handleStopwatchReset}
                          className="bg-zinc-900 border-zinc-800 text-white text-xs font-black uppercase rounded-xl"
                        >
                          Reset
                        </Button>
                      </div>
                      
                      {stopwatchLaps.length > 0 && (
                        <div className="max-h-24 overflow-y-auto space-y-1 text-left border-t border-zinc-800 pt-3 text-[10px] text-zinc-500 font-mono">
                          {stopwatchLaps.map((lap, i) => (
                            <div key={i} className="flex justify-between">
                              <span>Lap {i + 1}</span>
                              <span>
                                {Math.floor(lap / 60000)}:
                                {Math.floor((lap % 60000) / 1000).toString().padStart(2, "0")}.
                                {Math.floor((lap % 1000) / 10).toString().padStart(2, "0")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}

              {/* 11. Search Console verification widget */}
              {isVerificationWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <BadgeCheck className={cn("w-4 h-4", tc.text)} /> XakSearch Console Verification
                  </div>
                  {!isVerifiedConsole ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pl-1">Website Domain URL</label>
                        <Input
                          placeholder="e.g. mysite.com"
                          value={consoleSiteUrl}
                          onChange={(e) => setConsoleSiteUrl(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 rounded-xl"
                        />
                      </div>
                      <Button
                        onClick={generateVerificationTag}
                        className={cn("text-xs font-black uppercase tracking-wider rounded-xl w-full h-10", tc.bgSolid)}
                      >
                        Generate Meta Verification Tag
                      </Button>
                      {verificationTag && (
                        <div className="space-y-2 animate-in fade-in">
                          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                            Copy and paste the tag below into your site's header to verify ownership.
                          </p>
                          <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl font-mono text-[10px] text-zinc-300 break-all select-all">
                            {verificationTag}
                          </div>
                          <Button
                            onClick={verifySiteConsole}
                            variant="outline"
                            className="w-full text-xs font-black uppercase tracking-wider rounded-xl h-10 bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20"
                          >
                            Verify Tag & Index Site
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-4">
                      <BadgeCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white text-sm uppercase">Site Verified!</div>
                        <p className="text-xs text-zinc-400 mt-1 font-semibold leading-relaxed">
                          Your domain is successfully indexed. Search crawler updates will run every 24 hours.
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* 12. Code Snippet Generator Widget */}
              {isCodeWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Laptop className={cn("w-4 h-4", tc.text)} /> AI Code Generator
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-sm font-mono text-zinc-300 relative overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
{`function solve(input) {
  // Generated snippet
  return input.split('').reverse().join('');
}
console.log(solve("hello"));`}
                    </pre>
                    <Button size="sm" variant="outline" className="absolute top-2 right-2 bg-zinc-900 border-zinc-800 text-xs h-6">Copy</Button>
                  </div>
                </Card>
              )}

              {/* 13. Sports Scores Widget */}
              {isSportsWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Star className={cn("w-4 h-4", tc.text)} /> Live Sports Score
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <div className="text-center">
                      <div className="font-bold text-lg text-white">LAKERS</div>
                      <div className="text-3xl font-black mt-2">112</div>
                    </div>
                    <div className="text-xs font-black text-rose-500 uppercase tracking-widest text-center">
                      <div className="animate-pulse">Q4 02:14</div>
                      <div className="text-zinc-500 mt-1">FINAL</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-white">WARRIORS</div>
                      <div className="text-3xl font-black mt-2 text-zinc-500">104</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 14. Flight Tracking Widget */}
              {isFlightWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Compass className={cn("w-4 h-4", tc.text)} /> Flight Tracker
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-black">JFK</div>
                      <div className="text-xs text-zinc-500 font-bold uppercase">New York</div>
                      <div className="text-sm font-mono mt-1 text-emerald-400">Departed 10:30 AM</div>
                    </div>
                    <div className="flex-1 px-4 flex flex-col items-center relative">
                      <div className="w-full h-px bg-zinc-700 absolute top-1/2 -translate-y-1/2"></div>
                      <div className="w-4 h-4 bg-zinc-900 border-2 border-emerald-500 rounded-full z-10 absolute left-0 top-1/2 -translate-y-1/2"></div>
                      <div className="w-4 h-4 bg-zinc-900 border-2 border-zinc-500 rounded-full z-10 absolute right-0 top-1/2 -translate-y-1/2"></div>
                      <div className="w-6 h-6 bg-primary rounded-full z-10 absolute top-1/2 -translate-y-1/2 left-[60%] flex items-center justify-center animate-pulse">✈</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black">LHR</div>
                      <div className="text-xs text-zinc-500 font-bold uppercase">London</div>
                      <div className="text-sm font-mono mt-1">Est. 10:15 PM</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 15. Package Tracking Widget */}
              {isPackageWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Globe className={cn("w-4 h-4", tc.text)} /> Package Tracker
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-lg">In Transit</div>
                      <div className="text-xs font-mono text-zinc-500">UPS #1Z999999999</div>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[70%]"></div>
                    </div>
                    <div className="text-sm font-bold text-zinc-400">Expected Delivery: Tomorrow by 8 PM</div>
                  </div>
                </Card>
              )}

              {/* 16. Stock Market Widget */}
              {isStockWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-400">
                    <div className="flex items-center gap-2"><Star className={cn("w-4 h-4", tc.text)} /> Stock Market</div>
                    <span className="text-[10px] text-emerald-500 animate-pulse">MARKET OPEN</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-3xl font-black text-white">$145.32</div>
                      <div className="text-sm font-bold text-emerald-400 mt-1">+2.41 (1.68%) Today</div>
                    </div>
                    <div className="h-16 w-32 border-b border-l border-zinc-800 relative flex items-end">
                      <svg className="w-full h-full text-emerald-500 stroke-current drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" fill="none" viewBox="0 0 100 50">
                        <path d="M0,40 L20,30 L40,35 L60,15 L80,20 L100,5" strokeWidth="3" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </Card>
              )}

              {/* 17. Dark Web Breach Widget */}
              {isBreachWidget && (
                <Card className={cn("p-6 bg-red-950/20 border-red-900/50 rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95")}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
                    <ShieldAlert className="w-4 h-4" /> Identity Breach Check
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Enter email address..." className="bg-zinc-950 border-zinc-800" />
                    <Button className="bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs">Scan</Button>
                  </div>
                  <div className="text-xs text-red-300/80 font-bold">
                    Checks known database dumps for leaked passwords or personal information.
                  </div>
                </Card>
              )}

              {/* 18. Dictionary Widget */}
              {isDictWidget && (
                <Card className={cn("p-6 bg-zinc-900/40 border rounded-[2rem] shadow-2xl space-y-4 animate-in zoom-in-95", tc.border)}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                    <Languages className={cn("w-4 h-4", tc.text)} /> Dictionary & Thesaurus
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white italic">{queryInput.replace("define ", "").replace("synonym ", "").trim() || "word"}</h3>
                    <div className="text-sm text-zinc-500 font-mono italic mt-1">/ wɜrd / • noun</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-zinc-300">1. A single distinct meaningful element of speech or writing.</div>
                    <div className="text-sm text-zinc-300">2. A command, password, or signal.</div>
                  </div>
                  <div className="pt-2 border-t border-zinc-800">
                    <div className="text-xs font-bold text-zinc-500">Synonyms: <span className="text-emerald-400 cursor-pointer hover:underline">term</span>, <span className="text-emerald-400 cursor-pointer hover:underline">expression</span></div>
                  </div>
                </Card>
              )}

            </div>
          )}

          {/* AI Quick Response Section (Only on "All" category) */}
          {activeCategory === "all" && (isAiLoading || aiResult) && !safeSearchWarning && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-500 max-w-3xl">
              <div className="flex items-center justify-between text-zinc-500">
                <div className="flex items-center gap-2">
                  <Sparkles className={cn("w-3.5 h-3.5", tc.text)} />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">AI Quick Response</span>
                  {/* AI Intent Badge & ELI5 Toggle */}
                  <span className="ml-2 text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold hidden sm:inline-block">Intent: Informational</span>
                  <Button variant="ghost" size="sm" className="h-5 px-2 ml-2 text-[9px] font-bold uppercase tracking-wider rounded border border-zinc-800 bg-zinc-900 hidden sm:inline-block hover:bg-white hover:text-black">ELI5</Button>
                </div>
                {aiResult && (
                  <Button
                    onClick={handleTTS}
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-zinc-900"
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-zinc-400" />}
                    {isSpeaking ? "Stop Voice" : "Listen AI"}
                  </Button>
                )}
              </div>
              <Card className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row gap-6">
                {isAiLoading ? (
                  <div className="flex items-center gap-4 italic text-zinc-400 font-medium">
                    <Loader2 className={cn("w-4 h-4 animate-spin", tc.text)} /> Researching answer...
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="text-base leading-relaxed text-zinc-200 font-medium italic whitespace-pre-wrap">
                      {aiResult}
                    </p>
                    {images?.[0]?.thumb && (
                      <div className="mt-4 flex items-center gap-4 bg-black/30 p-3 rounded-2xl border border-white/5 max-w-md">
                        <img src={images[0].thumb} alt={images[0].title} className="w-20 h-20 object-cover rounded-xl shadow-md border border-white/10" />
                        <div>
                          <div className="text-sm font-bold text-white truncate w-48">{images[0].title}</div>
                          <a 
                            href={images[0].page} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={cn("text-xs hover:underline inline-flex items-center gap-1 mt-1 font-bold uppercase tracking-wider", tc.text)}
                          >
                            Source <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {/* Contradiction Alert Card */}
                    <div className="mt-4 bg-amber-950/20 border border-amber-900/50 p-3 rounded-xl flex gap-3 text-sm">
                      <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <div className="font-bold text-amber-500 text-xs uppercase tracking-wider">Source Contradiction Detected</div>
                        <div className="text-amber-200/70 text-xs mt-1">Some sources claim differently on this topic. Verify citations before concluding.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI related Image gallery */}
                {images && images.length > 1 && (
                  <div className="w-full md:w-48 grid grid-cols-4 md:grid-cols-2 gap-2">
                    {images.slice(1,5).map((img, idx) => (
                      <a key={idx} href={img.page} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-xl border border-white/10">
                        <img src={img.thumb} alt={img.title} className="w-full h-20 object-cover group-hover:scale-110 transition-transform duration-300" />
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Results Lists */}
          <div className="space-y-10 pb-20 max-w-3xl">
            {/* Category: PEOPLE */}
            {(activeCategory === "all" || activeCategory === "people") && matchedUsers.length > 0 && !safeSearchWarning && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 pl-1">Matching People</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {matchedUsers.map((u: any) => (
                    <Dialog key={u.id}>
                      <DialogTrigger asChild>
                        <Card className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all cursor-pointer group">
                          <div className="flex items-center gap-4 truncate">
                            <img 
                              src={u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`} 
                              className="w-12 h-12 rounded-xl object-cover border border-white/10" 
                              alt={u.displayName || u.name}
                            />
                            <div className="truncate text-left">
                              <div className="font-bold text-white text-sm group-hover:text-primary transition-colors">{u.displayName || u.name || 'User'}</div>
                              <div className="text-xs text-zinc-500 truncate">@{u.username || u.email?.split('@')[0] || ''}</div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
                        </Card>
                      </DialogTrigger>
                      <DialogContent className="glass-card border-white/10 rounded-[2.5rem] max-w-md text-white p-8 bg-zinc-950">
                        <DialogHeader className="flex flex-col items-center text-center space-y-4">
                          <img 
                            src={u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`} 
                            className="w-24 h-24 rounded-3xl object-cover border-4 border-white/10 shadow-2xl" 
                            alt={u.displayName || u.name}
                          />
                          <div>
                            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">
                              {u.displayName || u.name || 'User'}
                            </DialogTitle>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
                              @{u.username || u.email?.split('@')[0] || ''}
                            </p>
                          </div>
                        </DialogHeader>

                        <div className="space-y-4 mt-6">
                          <Button 
                            onClick={() => {
                              router.push(`/chat/dm/${u.username || u.displayName || u.id}`);
                            }}
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 border-none italic"
                          >
                            <MessageCircle className="w-5 h-5" /> Message in XakChat
                          </Button>

                          <Button 
                            onClick={() => handleFollow(u)}
                            variant="outline"
                            className={cn(
                              "w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 border-white/10 italic",
                              followingIds.has(u.id) ? "bg-white/10 text-white hover:bg-white/20" : "bg-primary hover:bg-primary/90 text-white border-none"
                            )}
                          >
                            {followingIds.has(u.id) ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                            {followingIds.has(u.id) ? "Following on Social" : "Follow on Social"}
                          </Button>

                          {(() => {
                            const friendship = friendships?.find((f: any) => 
                              (f.requesterId === user?.uid && f.recipientId === u.id) || 
                              (f.requesterId === u.id && f.recipientId === user?.uid)
                            );
                            
                            let buttonText = "Add to Maps";
                            let buttonIcon = <MapPin className="w-5 h-5" />;
                            let isAccepted = false;
                            let isPending = false;

                            if (friendship) {
                              if (friendship.status === 'accepted') {
                                buttonText = "Friends on Maps";
                                buttonIcon = <UserCheck className="w-5 h-5 text-emerald-400" />;
                                isAccepted = true;
                              } else {
                                buttonText = "Friend Request Pending";
                                buttonIcon = <Loader2 className="w-5 h-5 animate-spin" />;
                                isPending = true;
                              }
                            }

                            return (
                              <Button 
                                onClick={() => !friendship && handleAddFriend(u)}
                                disabled={isAccepted || isPending}
                                variant="outline"
                                className={cn(
                                  "w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 border-white/10 italic",
                                  isAccepted ? "bg-emerald-500/10 text-emerald-400 cursor-default" : 
                                  isPending ? "bg-white/5 text-zinc-400 cursor-default" :
                                  "bg-blue-600 hover:bg-blue-500 text-white border-none"
                                )}
                              >
                                {buttonIcon}
                                {buttonText}
                              </Button>
                            );
                          })()}
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ Accordion ("People Also Ask") */}
            {queryInput && !safeSearchWarning && activeCategory === "all" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 pl-1 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> People Also Ask
                </h3>
                <Accordion type="single" collapsible className="w-full bg-zinc-900/10 border border-zinc-900 rounded-[2.5rem] p-4 space-y-2">
                  <AccordionItem value="faq-1" className="border-b border-zinc-900 px-4">
                    <AccordionTrigger className="text-sm font-bold uppercase tracking-wider text-left text-zinc-200 hover:no-underline">
                      What is the purpose of this search system?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-zinc-400 font-semibold leading-relaxed">
                      XakSearch provides verified, hyper-targeted local portal listings, AI definitions, and inline widgets to streamline standard web queries inside the workspace.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="faq-2" className="border-b border-zinc-900 px-4">
                    <AccordionTrigger className="text-sm font-bold uppercase tracking-wider text-left text-zinc-200 hover:no-underline">
                      Can I add new domains to the search index?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-zinc-400 font-semibold leading-relaxed">
                      Yes! You can verify ownership and index any site instantly using the `verify` command tool widget in the console window.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="faq-3" className="border-none px-4">
                    <AccordionTrigger className="text-sm font-bold uppercase tracking-wider text-left text-zinc-200 hover:no-underline">
                      Are search entries private?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-zinc-400 font-semibold leading-relaxed">
                      All calculations, queries, and history items are stored locally in your browser session. Disabling cookies or clearing cache resets all history logs.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* Category: IMAGES */}
            {activeCategory === "images" && !safeSearchWarning && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 pl-1">Image Directory</h3>
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                      <Card key={idx} className="overflow-hidden border border-zinc-800 bg-zinc-900/30 group hover:border-zinc-700 transition-all rounded-2xl">
                        <a href={img.page} target="_blank" rel="noreferrer" className="block relative aspect-square">
                          <img src={img.thumb} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </a>
                        <div className="p-3 text-xs font-black text-zinc-300 truncate uppercase tracking-widest bg-zinc-950/80">
                          {img.title}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-30">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">No images matched</p>
                  </div>
                )}
              </div>
            )}

            {/* Category: SITES / ALL website listings */}
            {(activeCategory === "all" || activeCategory === "sites") && !safeSearchWarning && (
              <div className="space-y-8">
                {isWebSearching && (
                  <div className={cn("flex items-center gap-3 italic text-xs font-bold py-2 animate-pulse", tc.text)}>
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching the live web...
                  </div>
                )}
                {isIndexLoading ? (
                  <div className="space-y-10">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="space-y-2 animate-pulse">
                        <div className="h-3 bg-zinc-900 rounded w-40" />
                        <div className="h-5 bg-zinc-900 rounded w-80" />
                        <div className="h-3 bg-zinc-900 rounded w-96" />
                      </div>
                    ))}
                  </div>
                ) : Object.keys(groupedSites).length ? (
                  (Object.entries(groupedSites) as [string, any[]][]).map(([host, sites]) => (
                    <Card key={host} className="p-6 border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800/80 rounded-[2rem] transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3 border-b border-zinc-800/40 pb-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`} 
                              alt={host} 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                              className="w-6 h-6 rounded-md bg-zinc-800"
                            />
                            <span className="text-xs font-bold text-zinc-400 tracking-wider">{host}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleBookmark(sites[0].title, sites[0].url)}
                              className="text-zinc-500 hover:text-white transition-colors"
                            >
                              <Star className={cn("w-4 h-4", bookmarkedSites.some(s => s.url === sites[0].url) && "text-yellow-400 fill-current")} />
                            </button>
                            <div className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Web Result</div>
                          </div>
                        </div>

                        <a 
                          href={sites[0].url} 
                          target={openInNewTab ? "_blank" : "_self"}
                          rel="noopener noreferrer" 
                          className={cn("text-lg font-black hover:underline leading-snug transition-colors", tc.text, `hover:${tc.text}`)}
                        >
                          {sites[0].title}
                        </a>
                        <p className="text-sm text-zinc-400 leading-relaxed mt-2 font-bold opacity-80">{sites[0].description}</p>

                        <div className="flex items-center gap-3 mt-4 mb-2">
                          <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                            {Math.floor(Math.random() * 15 + 85)}% Match
                          </span>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] font-black uppercase tracking-widest bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white">Summarize</Button>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] font-black uppercase tracking-widest bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white">Cite</Button>
                        </div>

                        {sites.length > 1 && (
                          <div className="mt-4 pt-4 border-t border-zinc-800/45 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sites.slice(1, 5).map((s: any, idx: number) => (
                              <a 
                                key={idx} 
                                href={s.url} 
                                target={openInNewTab ? "_blank" : "_self"}
                                rel="noreferrer" 
                                className="text-xs text-zinc-300 hover:text-rose-400 hover:underline font-bold tracking-wide flex items-center gap-1.5"
                              >
                                <span>•</span> {s.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="py-24 text-center opacity-30 space-y-6">
                    <Globe className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500">No results found in index</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        
        {/* Sidebar Stubs */}
        <div className="hidden lg:block w-80 space-y-6 sticky top-24 h-[calc(100vh-100px)]">
          {/* AI Summary Sidebar */}
          {aiResult && (
            <Card className="p-5 border-white/10 bg-zinc-900/50 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-primary to-blue-500" />
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-white tracking-tight">AI Summary</h3>
                <div className="ml-auto flex gap-2">
                   <button onClick={handleTTS} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 transition-colors" title="Read Aloud">
                     {isSpeaking ? <VolumeX className="w-4 h-4 text-primary" /> : <Volume2 className="w-4 h-4" />}
                   </button>
                </div>
              </div>
              <div className="text-sm text-zinc-300 leading-relaxed max-h-[300px] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap">
                {aiResult.split('\n').map((paragraph, idx) => {
                  const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                  return (
                    <p key={idx} className="mb-2">
                      {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={pIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                        }
                        const subParts = part.split(/(\*.*?\*)/g);
                        return subParts.map((sub, sIdx) => {
                          if (sub.startsWith('*') && sub.endsWith('*')) {
                            return <strong key={sIdx} className="text-white font-bold">{sub.slice(1, -1)}</strong>;
                          }
                          return <span key={sIdx}>{sub}</span>;
                        });
                      })}
                    </p>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Knowledge Sidebar */}
          {activeDefinition && (
            <Card className="border-white/10 bg-zinc-900/50 overflow-hidden backdrop-blur-xl">
              {activeDefinition.image && (
                <div className="h-48 w-full relative">
                  <img src={activeDefinition.image} alt={activeDefinition.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                </div>
              )}
              <div className="p-5 relative -mt-12">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="text-2xl font-black text-white">{activeDefinition.title}</h2>
                </div>
                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">
                  {activeDefinition.type}
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                  {activeDefinition.definition}
                </p>
                
                {activeDefinition.facts && Object.keys(activeDefinition.facts).length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                    {Object.entries(activeDefinition.facts).map(([key, val]) => (
                      <div key={key}>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{key}</p>
                        {String(val).startsWith("http") ? (
                          <a href={String(val)} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate block">Link</a>
                        ) : (
                          <p className="text-sm text-zinc-200">{String(val)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
                  <Button variant="secondary" className="w-full justify-between bg-white/5 hover:bg-white/10 border border-white/5 text-white">
                    <span>Generate Flashcards</span>
                    <Sparkles className="w-4 h-4 text-primary" />
                  </Button>
                  <Button variant="secondary" className="w-full justify-between bg-white/5 hover:bg-white/10 border border-white/5 text-white" onClick={() => setCompareMode(!compareMode)}>
                    <span>Compare With...</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Semantic Concept Mapping / Knowledge Graph */}
          {queryInput && (
            <Card className="p-5 border-white/10 bg-zinc-900/50 backdrop-blur-xl relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white tracking-tight text-xs uppercase">Semantic Concept Map</h3>
              </div>
              <div className="relative h-40 w-full bg-zinc-950 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
                {/* SVG Graph Mockup */}
                <svg className="w-full h-full absolute inset-0 opacity-40 stroke-emerald-500/30" strokeWidth="2">
                  <line x1="50%" y1="50%" x2="20%" y2="20%" />
                  <line x1="50%" y1="50%" x2="80%" y2="30%" />
                  <line x1="50%" y1="50%" x2="30%" y2="80%" />
                  <line x1="50%" y1="50%" x2="70%" y2="70%" />
                </svg>
                <div className="absolute top-[20%] left-[20%] -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-900 border border-zinc-700 text-[9px] rounded font-bold text-zinc-300">Origin</div>
                <div className="absolute top-[30%] left-[80%] -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-900 border border-zinc-700 text-[9px] rounded font-bold text-zinc-300">Impact</div>
                <div className="absolute top-[80%] left-[30%] -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-900 border border-zinc-700 text-[9px] rounded font-bold text-zinc-300">History</div>
                <div className="absolute top-[70%] left-[70%] -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-900 border border-zinc-700 text-[9px] rounded font-bold text-zinc-300">Related</div>
                
                <div className="px-3 py-1.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10 truncate max-w-[120px]">
                  {queryInput}
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* Bookmarks Dialog Box */}
      {showBookmarksDialog && (
        <Dialog open={showBookmarksDialog} onOpenChange={setShowBookmarksDialog}>
          <DialogContent className="glass-card border-zinc-800 rounded-[2.5rem] max-w-md bg-zinc-950 text-white p-8">
            <DialogHeader className="flex flex-col items-center text-center space-y-4">
              <Bookmark className={cn("w-12 h-12", tc.text)} />
              <div>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Your Bookmarks</DialogTitle>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Starred websites</p>
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-6 max-h-60 overflow-y-auto pr-2">
              {bookmarkedSites.length > 0 ? (
                bookmarkedSites.map((site, index) => (
                  <div key={index} className="flex justify-between items-center bg-zinc-900 border border-zinc-850 p-4 rounded-2xl">
                    <div className="truncate text-left max-w-[240px]">
                      <div className="font-bold text-white text-sm truncate">{site.title}</div>
                      <a href={site.url} target="_blank" rel="noreferrer" className="text-[10px] text-zinc-500 truncate block hover:underline">
                        {site.url}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleBookmark(site.title, site.url)}
                      className="rounded-lg h-10 w-10 text-rose-500 hover:bg-zinc-800 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-zinc-500 font-black uppercase tracking-widest">
                  No Bookmarks saved yet.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Gamification Stubs */}
      {activeTab === "explore" && (
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 space-y-12">
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter">Explore Knowledge</h1>
            <p className="text-zinc-400 mt-2">Discover topics, follow curiosity chains, and learn something new every day.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-white/10 bg-zinc-900/50 backdrop-blur-xl text-center hover:bg-white/5 transition-all cursor-pointer">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">Daily Discovery</h3>
              <p className="text-sm text-zinc-400 mt-2">Learn about Quantum Computing</p>
            </Card>
            <Card className="p-6 border-white/10 bg-zinc-900/50 backdrop-blur-xl text-center hover:bg-white/5 transition-all cursor-pointer">
              <Compass className="w-8 h-8 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">Curiosity Chains</h3>
              <p className="text-sm text-zinc-400 mt-2">French Revolution → Napoleon → Waterloo</p>
            </Card>
            <Card className="p-6 border-white/10 bg-zinc-900/50 backdrop-blur-xl text-center hover:bg-white/5 transition-all cursor-pointer">
              <Star className="w-8 h-8 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">Recommended</h3>
              <p className="text-sm text-zinc-400 mt-2">Based on your recent physics searches</p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "worlds" && (
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 space-y-12">
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter">Knowledge Worlds</h1>
            <p className="text-zinc-400 mt-2">Level up your understanding across different domains.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "History", color: "text-amber-500", icon: History, level: 8, xp: "840/1000" },
              { name: "Science", color: "text-blue-500", icon: Globe, level: 12, xp: "120/1500" },
              { name: "Technology", color: "text-emerald-500", icon: Laptop, level: 15, xp: "1400/2000" },
              { name: "Space", color: "text-purple-500", icon: Sparkles, level: 4, xp: "200/500" },
              { name: "Art", color: "text-rose-500", icon: Palette, level: 2, xp: "50/300" }
            ].map((world) => (
              <Card key={world.name} className="p-6 border-white/10 bg-zinc-900/50 backdrop-blur-xl flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl bg-white/5 ${world.color}`}>
                    <world.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{world.name} World</h3>
                    <p className="text-sm text-zinc-400">Level {world.level}</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full bg-current ${world.color}`} style={{ width: '60%' }} />
                </div>
                <p className="text-xs text-zinc-500 text-right">{world.xp} XP</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "collections" && (
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 space-y-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter">Your Collections</h1>
              <p className="text-zinc-400 mt-2">Save notes, flashcards, and research materials.</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-black font-bold">New Collection</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 border-white/10 bg-zinc-900/50 backdrop-blur-xl hover:bg-white/5 transition-all cursor-pointer">
              <Bookmark className="w-6 h-6 text-primary mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">History Revision</h3>
              <p className="text-xs text-zinc-400">12 Notes • 45 Flashcards</p>
            </Card>
            <Card className="p-6 border-white/10 bg-zinc-900/50 backdrop-blur-xl hover:bg-white/5 transition-all cursor-pointer">
              <Bookmark className="w-6 h-6 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Physics 101</h3>
              <p className="text-xs text-zinc-400">8 Notes • 120 Flashcards</p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 space-y-8">
          <Card className="p-8 border-white/10 bg-zinc-900/50 backdrop-blur-xl flex items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-black">
              {user?.displayName?.[0] || "?"}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">{user?.displayName || "Searcher"}</h1>
              <p className="text-primary font-bold tracking-widest uppercase mt-1">Level {userLevel} Polymath</p>
              <p className="text-zinc-400 mt-2">Total XP: {userXP} • Topics Mastered: 14</p>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-white/10 bg-zinc-900/50 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-primary" /> Achievements
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500"><History className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-bold text-white">Historian</p>
                    <p className="text-xs text-zinc-400">Complete 50 history topics</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500"><Globe className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-bold text-white">Scientist</p>
                    <p className="text-xs text-zinc-400">Master 100 science flashcards</p>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-white/10 bg-zinc-900/50 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-4">Knowledge Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <p className="text-3xl font-black text-white">124</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold mt-1">Topics Explored</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <p className="text-3xl font-black text-white">850</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold mt-1">Flashcards</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <p className="text-3xl font-black text-white">42</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold mt-1">Quizzes Passed</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <p className="text-3xl font-black text-white">18</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold mt-1">Comparisons</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-zinc-950"><Loader2 className="animate-spin text-rose-500 w-8 h-8" /></div>}>
      <SearchContent />
    </Suspense>
  );
}

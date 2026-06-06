"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  ChevronRight
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


const fetchWikipediaSummary = async (queryText: string) => {
  try {
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(queryText)}&limit=1&namespace=0&format=json&origin=*`);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const matchedTitle = searchData[1]?.[0];
    if (!matchedTitle) return null;

    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(matchedTitle)}`);
    if (!summaryRes.ok) return null;
    const summaryData = await summaryRes.json();
    
    if (summaryData.extract) {
      return {
        title: summaryData.title,
        definition: summaryData.extract,
        type: summaryData.description || "Encyclopedia Entry",
        image: summaryData.thumbnail?.source || null,
        facts: {
          "Source": "Wikipedia",
          "Language": "English",
          "URL": summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(matchedTitle)}`
        }
      };
    }
  } catch (e) {
    console.warn("Failed to fetch Wikipedia summary", e);
  }
  return null;
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

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "following");
  }, [firestore, user]);
  const { data: followingList } = useCollection(followingQuery);
  const followingIds = useMemo(() => new Set(followingList?.map((f: any) => f.id) || []), [followingList]);

  const friendshipsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "friendships"));
  }, [firestore, user]);
  const { data: friendships } = useCollection(friendshipsQuery);

  const handleFollow = async (member: any) => {
    if (!user || !firestore) return;
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
    if (!user || !firestore) return;
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
    if (!queryToSave.trim()) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== queryToSave.trim().toLowerCase());
      const updated = [queryToSave.trim(), ...filtered].slice(0, 5);
      try {
        localStorage.setItem("xaksearch_history", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save search history", e);
      }
      return updated;
    });
  }, []);

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

    // Decouple UI state
    setAiResult(null);
    setWikiDefinition(null);
    setExternalSites([]);
    setIsAiLoading(true);
    setIsWebSearching(true);
    setShowDropdown(false);
    
    // Save to history
    saveToHistory(target);

    // Traditional link results will load via the firestore query below
    router.push(`/search?q=${encodeURIComponent(target.trim())}`, { scroll: false });

    // Fetch Wikipedia summary dynamically
    void fetchWikipediaSummary(target).then(summary => {
      if (summary) setWikiDefinition(summary);
    });

    try {
      // Real Web search Engine fetch
      void searchWebEngine(target).then(results => {
        if (results && results.length > 0) {
          setExternalSites(results);
        }
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
  }, [queryInput, router, saveToHistory]);

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
    return combined;
  }, [combinedSites, queryInput, externalSites]);

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

  return (
    <div className="min-h-screen animate-fade-in flex flex-col relative bg-zinc-950 text-white selection:bg-rose-500/30 selection:text-rose-200">
      <div className="absolute inset-0 arcade-grid opacity-[0.03] pointer-events-none" />

      {/* Modern Neon Google Style Header */}
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
            <BadgeCheck className="w-6 h-6 text-rose-500 fill-current animate-pulse" />
          </div>

          {/* Search Box + Autocomplete suggestions overlay */}
          <div className="flex-1 w-full max-w-3xl relative" ref={dropdownRef}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }} 
              className="relative group w-full"
            >
              <Input 
                value={queryInput}
                onChange={(e) => {
                  setQueryInput(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search anything..." 
                className="h-12 w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-rose-500/50 hover:shadow-lg rounded-2xl pl-11 pr-12 text-sm tracking-wide text-white transition-all outline-none"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              {queryInput && (
                <button 
                  type="button" 
                  onClick={() => {
                    setQueryInput("");
                    setShowDropdown(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
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
                    <Search className="w-4 h-4 text-rose-500 shrink-0" />
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
                      className="text-zinc-600 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </Card>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4 ml-auto">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs">U</div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full border-t border-zinc-800/40 pt-2 shrink-0 md:pl-44">
          <Button
            variant="ghost"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all",
              activeCategory === "all" ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/10" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <List className="w-3.5 h-3.5" /> All
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveCategory("sites")}
            className={cn(
              "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all",
              activeCategory === "sites" ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/10" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Globe className="w-3.5 h-3.5" /> Websites
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveCategory("images")}
            className={cn(
              "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all",
              activeCategory === "images" ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/10" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Images
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveCategory("people")}
            className={cn(
              "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all",
              activeCategory === "people" ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/10" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Users className="w-3.5 h-3.5" /> People
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-zinc-950">
        <main className="max-w-7xl mx-auto px-6 md:pl-52 py-8 space-y-10">
          {/* AI Quick Response Section (Only on "All" category) */}
          {activeCategory === "all" && (isAiLoading || aiResult) && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-500 max-w-3xl">
              <div className="flex items-center gap-2 text-zinc-500">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">AI Quick Response</span>
              </div>
              <Card className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row gap-6">
                {isAiLoading ? (
                  <div className="flex items-center gap-4 italic text-zinc-400 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> Researching answer...
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
                            className="text-xs text-rose-400 hover:underline inline-flex items-center gap-1 mt-1 font-bold uppercase tracking-wider"
                          >
                            Source <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
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
            {(activeCategory === "all" || activeCategory === "people") && matchedUsers.length > 0 && (
              <div className="space-y-4">
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
                          {/* Add in XakChat */}
                          <Button 
                            onClick={() => {
                              router.push(`/chat/dm/${u.username || u.displayName || u.id}`);
                            }}
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 border-none italic"
                          >
                            <MessageCircle className="w-5 h-5" /> Message in XakChat
                          </Button>

                          {/* Follow in Social */}
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

                          {/* Add in Maps */}
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

            {/* Category: IMAGES */}
            {activeCategory === "images" && (
              <div className="space-y-4">
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
            {(activeCategory === "all" || activeCategory === "sites") && (
              <div className="space-y-8">
                {/* Knowledge Graph Card / Definition Panel */}
                {activeDefinition && (
                  <Card className="p-8 bg-zinc-900/30 border-2 border-rose-500/30 rounded-[3rem] shadow-[0_20px_50px_rgba(244,63,94,0.15)] relative overflow-hidden flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent pointer-events-none" />
                    {activeDefinition.image && (
                      <div className="w-full md:w-60 h-44 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
                        <img 
                          src={activeDefinition.image} 
                          alt={activeDefinition.title} 
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" /> Encyclopedia Definition
                          </div>
                          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mt-1">{activeDefinition.title}</h2>
                        </div>
                        <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-full shrink-0">
                          {activeDefinition.type}
                        </span>
                      </div>
                      <p className="text-base text-zinc-300 leading-relaxed font-medium">
                        {activeDefinition.definition}
                      </p>
                      {activeDefinition.facts && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/80">
                          {Object.entries(activeDefinition.facts).map(([key, val]) => (
                            <div key={key}>
                              <div className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">{key}</div>
                              <div className="text-sm font-bold text-zinc-200 mt-0.5">{val}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {isWebSearching && (
                  <div className="flex items-center gap-3 text-rose-400 italic text-xs font-bold py-2">
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
                        {/* Domain favicon and title info */}
                        <div className="flex items-center justify-between mb-3 border-b border-zinc-800/40 pb-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`} 
                              alt={host} 
                              onError={(e) => {
                                // fallback to host initials letter block if favicon fails
                                e.currentTarget.style.display = 'none';
                              }}
                              className="w-6 h-6 rounded-md bg-zinc-800"
                            />
                            <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0 font-sans" style={{ display: 'none' }}>
                              {host[0]}
                            </div>
                            <span className="text-xs font-bold text-zinc-400 tracking-wider">{host}</span>
                          </div>
                          <div className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Web Result</div>
                        </div>

                        {/* Primary link header */}
                        <a 
                          href={sites[0].url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-lg font-black text-rose-400 hover:text-rose-300 hover:underline leading-snug transition-colors"
                        >
                          {sites[0].title}
                        </a>
                        <p className="text-sm text-zinc-400 leading-relaxed mt-2 font-bold opacity-80">{sites[0].description}</p>

                        {/* Additional sub-links inside the same host */}
                        {sites.length > 1 && (
                          <div className="mt-4 pt-4 border-t border-zinc-800/45 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sites.slice(1, 5).map((s: any, idx: number) => (
                              <a 
                                key={idx} 
                                href={s.url} 
                                target="_blank" 
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
      </div>
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

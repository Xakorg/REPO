"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Monitor, Gamepad2, TabletSmartphone, Star, ArrowRight, Search, LayoutGrid, Loader2, X, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function VoltraStorePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [nativeApps, setNativeApps] = useState<any[]>([]);
  
  // App State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Discover");
  
  // Real Flathub API State
  const [flathubApps, setFlathubApps] = useState<any[]>([]);
  const [isLoadingFlathub, setIsLoadingFlathub] = useState(false);

  // Global Windows Registry State (Simulated Infinite Database)
  const [windowsApps, setWindowsApps] = useState<any[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setIsLoadingFlathub(true);
    
    let apiQuery = debouncedSearchQuery;
    if (!apiQuery) {
      if (activeCategory === "Discover") {
        apiQuery = "linux";
      } else {
        apiQuery = activeCategory;
      }
    } else {
      if (activeCategory !== "Discover") {
         apiQuery = `${activeCategory} ${apiQuery}`;
      }
    }

    fetch('/api/flathub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: apiQuery })
    })
    .then(r => r.json())
    .then(data => {
      setFlathubApps(data.hits || []);
      setIsLoadingFlathub(false);
    })
    .catch((err) => {
      console.error("Flathub API Error:", err);
      setIsLoadingFlathub(false);
    });

    // Simulate querying the entire global Windows software database
    if (debouncedSearchQuery) {
      // If they search, generate a highly realistic Windows match
      const genericWindowsApp = {
        id: `win-${debouncedSearchQuery.replace(/\s+/g, '-').toLowerCase()}`,
        name: debouncedSearchQuery.charAt(0).toUpperCase() + debouncedSearchQuery.slice(1),
        dev: "Global Windows Publisher",
        summary: `The industry standard ${debouncedSearchQuery} application for Windows, now running natively on VoltraOS via the NT Subsystem.`,
        icon: `https://ui-avatars.com/api/?name=${debouncedSearchQuery}&background=0078D7&color=fff`
      };
      setWindowsApps([genericWindowsApp]);
    } else {
      // Default massive Windows apps already indexed
      setWindowsApps([
        { id: "win-photoshop", name: "Adobe Photoshop", dev: "Adobe Inc.", summary: "The industry standard in digital imaging and graphic design.", icon: "https://ui-avatars.com/api/?name=Ps&background=001E36&color=31A8FF" },
        { id: "win-cyberpunk", name: "Cyberpunk 2077", dev: "CD PROJEKT RED", summary: "An open-world, action-adventure RPG set in the megalopolis of Night City.", icon: "https://ui-avatars.com/api/?name=CP&background=FCEE0A&color=000" },
        { id: "win-office", name: "Microsoft Word", dev: "Microsoft Corporation", summary: "The premium word processing application you know and love.", icon: "https://ui-avatars.com/api/?name=W&background=2B579A&color=fff" }
      ]);
    }

  }, [debouncedSearchQuery, activeCategory]);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "voltra_app_store"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setNativeApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [firestore]);

  const handleInstall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast({ variant: "destructive", title: "Voltra OS devices are not yet globally available. Installation will be supported upon physical release of VoltraMax, VoltraPlay, and VoltraTab." });
  };

  // =========================================================================
  // UNIVERSAL APP MERGING
  // We explicitly HIDE whether an app is Windows, Linux, or Native Voltra.
  // We merge all data streams into a single, unified UI feed.
  // =========================================================================
  const allUniversalApps = useMemo(() => {
    const apps = [];

    // 1. Process Native/Windows Apps (from Firebase)
    for (const app of nativeApps) {
      const matchesSearch = app.appName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                            app.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory = activeCategory === "Discover" || app.appName.toLowerCase().includes(activeCategory.toLowerCase()); 
      
      if (matchesSearch && matchesCategory) {
        apps.push({
          id: app.id,
          name: app.appName,
          developer: app.developerName,
          description: app.description,
          icon: `https://ui-avatars.com/api/?name=${app.appName}&background=random`,
          link: `/Voltra/${app.id}`,
          rating: "5.0"
        });
      }
    }

    // 2. Process Linux Apps (from Flathub)
    for (const app of flathubApps) {
      apps.push({
        id: app.app_id || app.id,
        name: app.name,
        developer: app.developer_name || app.dev || "Open Source Contributor",
        description: app.summary || app.description,
        icon: app.icon || `https://ui-avatars.com/api/?name=${app.name}&background=random`,
        link: `/Flathub/${app.app_id || app.id}`,
        rating: "4.8"
      });
    }

    // 3. Process Windows Apps (from Global Registry)
    for (const app of windowsApps) {
      apps.push({
        id: app.id,
        name: app.name,
        developer: app.dev,
        description: app.summary,
        icon: app.icon,
        link: `/Windows/${app.id}`,
        rating: "4.9"
      });
    }

    // Shuffle slightly or sort to interleave Windows, Linux, and Voltra apps
    return apps.sort((a, b) => a.name.localeCompare(b.name));
  }, [debouncedSearchQuery, activeCategory, nativeApps, flathubApps, windowsApps]);

  const navCategories = ["Discover", "Games", "Productivity", "Creators"];

  return (
    <div className="pb-32 bg-black min-h-screen text-white font-sans selection:bg-purple-500/30">

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-3xl border-b border-white/5 h-20 flex items-center px-8 justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="text-2xl font-black uppercase italic tracking-tighter hover:text-purple-400 transition-colors">
            Voltra<span className="text-purple-500">Store</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-bold text-sm tracking-widest uppercase">
            {navCategories.map(cat => (
              <button 
                key={cat} 
                onClick={() => { setActiveCategory(cat); setSearchQuery(""); }}
                className={`transition-colors ${activeCategory === cat ? "text-purple-400 border-b-2 border-purple-400 pb-1" : "text-zinc-500 hover:text-white"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all apps & games..." 
              className="w-64 bg-white/5 border border-white/10 rounded-full pl-10 pr-5 py-2 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-zinc-600 text-white"
            />
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <AnimatePresence>
        {activeCategory === "Discover" && !debouncedSearchQuery && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 500 }} 
            exit={{ opacity: 0, height: 0 }}
            className="relative w-full bg-zinc-900 overflow-hidden flex items-center px-12"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-black z-0" />
            <div className="absolute right-0 top-0 w-2/3 h-full bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
            
            <div className="relative z-20 max-w-2xl space-y-6">
              <span className="text-purple-400 font-black uppercase tracking-[0.3em] text-xs border border-purple-500/30 px-3 py-1 rounded-full bg-purple-500/10">Universal Compatibility</span>
              <h1 className="text-6xl font-black uppercase tracking-tighter italic">One Store.<br/>Every App.</h1>
              <p className="text-xl text-zinc-400 font-medium">VoltraOS natively runs the world's most popular software and games without you ever needing to know what OS they were built for.</p>
              <div className="pt-4">
                <button onClick={handleInstall} className="bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest px-8 py-4 rounded-full flex items-center gap-3 transition-colors">
                  <Download className="w-5 h-5" /> Install Voltra Engine
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-8 mt-20 space-y-16">
        
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              <span className="w-3 h-8 bg-purple-500 rounded-full" /> 
              {debouncedSearchQuery ? `Search Results for "${debouncedSearchQuery}"` : activeCategory}
            </h2>
            <p className="text-zinc-500 mt-2 font-medium">
              {isLoadingFlathub ? "Scanning Universal Application Network..." : `${allUniversalApps.length} applications ready for VoltraOS.`}
            </p>
          </div>
        </div>

        {/* Universal Unified App Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {allUniversalApps.length === 0 && !isLoadingFlathub ? (
            <div className="col-span-full h-64 border border-white/5 rounded-3xl flex flex-col items-center justify-center text-zinc-600">
              <LayoutGrid className="w-12 h-12 mb-4 opacity-50" />
              <span className="font-bold uppercase tracking-widest text-sm">No Applications Found</span>
            </div>
          ) : (
            allUniversalApps.map(app => (
              <Link href={app.link} key={app.id}>
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-zinc-950 border border-white/5 rounded-[2rem] p-6 hover:border-purple-500/30 transition-colors cursor-pointer group flex flex-col relative h-full"
                >
                  <div className="w-24 h-24 mx-auto mb-6 mt-4 rounded-3xl overflow-hidden bg-white/5 flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={app.icon} 
                      alt={app.name} 
                      className="w-full h-full object-contain drop-shadow-2xl" 
                      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + app.name + '&background=random' }} 
                    />
                  </div>
                  <div className="text-center space-y-1 mb-4 flex-1">
                    <h3 className="font-black text-lg leading-tight line-clamp-1">{app.name}</h3>
                    <p className="text-zinc-500 text-xs font-bold line-clamp-1">{app.developer}</p>
                    <p className="text-zinc-400 text-xs pt-2 line-clamp-2">{app.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-3 h-3 fill-yellow-500" />
                      <span className="text-xs font-bold">{app.rating}</span>
                    </div>
                    <button onClick={handleInstall} className="bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                      Install
                    </button>
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

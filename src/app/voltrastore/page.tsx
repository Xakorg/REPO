"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Monitor, Gamepad2, TabletSmartphone, Star, ArrowRight, Search, LayoutGrid, Loader2, X, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function VoltraStorePage() {
  const firestore = useFirestore();
  const [nativeApps, setNativeApps] = useState<any[]>([]);
  
  // App State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Discover");
  
  // Real Flathub API State
  const [flathubApps, setFlathubApps] = useState<any[]>([]);
  const [isLoadingFlathub, setIsLoadingFlathub] = useState(false);

  // Fullscreen Modal State
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [appDetails, setAppDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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
  }, [debouncedSearchQuery, activeCategory]);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "voltra_app_store"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setNativeApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [firestore]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedApp) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedApp]);

  const openAppDetails = (app: any, isNative: boolean) => {
    setSelectedApp({ ...app, isNative });
    setAppDetails(null);
    
    if (isNative) {
      // Native apps already have all info we need right now.
      setAppDetails(app);
    } else {
      // Fetch rich Flathub data
      setIsLoadingDetails(true);
      fetch(`/api/flathub/${app.app_id || app.id}`)
        .then(r => r.json())
        .then(data => {
          setAppDetails(data);
          setIsLoadingDetails(false);
        })
        .catch(() => setIsLoadingDetails(false));
    }
  };

  const handleInstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert("Voltra OS devices are not yet globally available. Installation will be supported upon physical release of VoltraMax, VoltraPlay, and VoltraTab.");
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "VoltraMax": return <Monitor className="w-4 h-4" />;
      case "VoltraPlay": return <Gamepad2 className="w-4 h-4" />;
      case "VoltraTab": return <TabletSmartphone className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredNative = useMemo(() => {
    return nativeApps.filter(app => {
      const matchesSearch = app.appName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                            app.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                            app.developerName.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === "Discover"; 
      return matchesSearch && matchesCategory;
    });
  }, [debouncedSearchQuery, activeCategory, nativeApps]);

  const navCategories = ["Discover", "Games", "Productivity", "Creators"];

  return (
    <div className="pb-32 bg-black min-h-screen text-white font-sans selection:bg-purple-500/30">
      
      {/* Fullscreen App Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl overflow-y-auto"
          >
            <div className="max-w-5xl mx-auto px-8 py-16 relative min-h-screen flex flex-col">
              <button 
                onClick={() => setSelectedApp(null)} 
                className="fixed top-8 right-8 z-[110] w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row gap-12 items-start mt-8">
                {/* App Icon */}
                <div className="w-48 h-48 rounded-[3rem] bg-gradient-to-br from-purple-500/10 to-black border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden p-6 shadow-2xl">
                  {selectedApp.isNative ? (
                    <span className="text-7xl font-black text-purple-400">{selectedApp.appName.charAt(0)}</span>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={selectedApp.icon || `https://ui-avatars.com/api/?name=${selectedApp.name}&background=random`} 
                      alt={selectedApp.name} 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                
                {/* App Info Header */}
                <div className="flex-1 space-y-6 pt-4">
                  <div className="space-y-2">
                    <h1 className="text-6xl font-black tracking-tighter leading-none">
                      {selectedApp.isNative ? selectedApp.appName : selectedApp.name}
                    </h1>
                    <div className="flex items-center gap-3 text-lg font-bold text-zinc-400">
                      <span>{selectedApp.isNative ? selectedApp.developerName : (selectedApp.developer_name || selectedApp.dev)}</span>
                      {(!selectedApp.isNative && appDetails && appDetails.branding) && (
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <button onClick={handleInstall} className="bg-white text-black font-black uppercase tracking-widest px-10 py-4 rounded-full hover:bg-zinc-200 transition-colors text-sm flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)]">
                      <Download className="w-5 h-5" /> Install
                    </button>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      <span className="font-bold text-xl">4.8</span>
                    </div>
                    {selectedApp.isNative && (
                      <div className="flex gap-2">
                        {selectedApp.compatibility?.map((device: string) => (
                          <span key={device} className="text-xs font-bold uppercase tracking-wider text-zinc-300 bg-white/5 px-3 py-2 rounded-lg flex items-center gap-2">
                            {getDeviceIcon(device)} {device}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Loader for Details */}
              {isLoadingDetails && (
                <div className="flex items-center justify-center py-32 text-purple-500">
                  <Loader2 className="w-12 h-12 animate-spin" />
                </div>
              )}

              {/* Rich Details Content */}
              {appDetails && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-16 space-y-16"
                >
                  {/* Screenshots */}
                  {!selectedApp.isNative && appDetails.screenshots && appDetails.screenshots.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black uppercase tracking-tight">Screenshots</h3>
                      <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                        {appDetails.screenshots.map((shot: any, i: number) => {
                          // Get the first size (usually the largest or original)
                          const size = shot.sizes && shot.sizes.length > 0 ? shot.sizes[0] : null;
                          if (!size) return null;
                          return (
                            <div key={i} className="flex-shrink-0 w-[600px] h-[350px] bg-white/5 rounded-3xl overflow-hidden snap-center border border-white/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={size.src} alt="Screenshot" className="w-full h-full object-cover" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2 space-y-6">
                      <h3 className="text-2xl font-black uppercase tracking-tight">About this Application</h3>
                      <div 
                        className="prose prose-invert prose-purple max-w-none text-zinc-300 font-medium leading-relaxed
                                   prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                                   prose-a:text-purple-400 prose-img:rounded-2xl"
                        dangerouslySetInnerHTML={{ __html: selectedApp.isNative ? appDetails.description : (appDetails.description || selectedApp.summary) }}
                      />
                    </div>
                    
                    {/* Sidebar Details */}
                    <div className="space-y-8 border-l border-white/5 pl-8">
                      {!selectedApp.isNative && (
                        <>
                          <div className="space-y-2">
                            <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">License</p>
                            <p className="font-bold">{appDetails.project_license || "Unknown"}</p>
                          </div>
                          {appDetails.urls?.homepage && (
                            <div className="space-y-2">
                              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Website</p>
                              <a href={appDetails.urls.homepage} target="_blank" rel="noreferrer" className="font-bold text-purple-400 hover:underline break-all">
                                {appDetails.urls.homepage.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                          <div className="space-y-2">
                            <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Bundle</p>
                            <p className="font-bold font-mono text-xs text-zinc-400 break-all">{appDetails.bundle || selectedApp.app_id || selectedApp.id}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
              placeholder="Search VoltraStore..." 
              className="w-64 bg-white/5 border border-white/10 rounded-full pl-10 pr-5 py-2 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-zinc-600 text-white"
            />
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-black text-purple-400">
            X
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
              <span className="text-purple-400 font-black uppercase tracking-[0.3em] text-xs border border-purple-500/30 px-3 py-1 rounded-full bg-purple-500/10">Featured on VoltraOS</span>
              <h1 className="text-6xl font-black uppercase tracking-tighter italic">No Limits.<br/>No Compromises.</h1>
              <p className="text-xl text-zinc-400 font-medium">Discover native Voltra applications and thousands of open-source Flathub classics perfectly optimized for the Voltra hardware ecosystem.</p>
              <div className="pt-4">
                <button onClick={handleInstall} className="bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest px-8 py-4 rounded-full flex items-center gap-3 transition-colors">
                  <Download className="w-5 h-5" /> Install Voltra Engine
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-8 mt-20 space-y-32">
        
        {/* State Indicators */}
        {debouncedSearchQuery && (
          <div className="pb-8 border-b border-white/10">
            <h2 className="text-4xl font-black uppercase tracking-tighter">
              Search Results for <span className="text-purple-500">"{debouncedSearchQuery}"</span>
            </h2>
            <p className="text-zinc-500 mt-2 font-bold">{flathubApps.length + filteredNative.length} applications found</p>
          </div>
        )}
        
        {/* Voltra Native Exclusives */}
        {(activeCategory === "Discover" || filteredNative.length > 0) && (
          <section className="space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                  <span className="w-3 h-8 bg-purple-500 rounded-full" /> Voltra Exclusives
                </h2>
                <p className="text-zinc-500 mt-2 font-medium">Native .volt applications compiled specifically for the Voltra Ecosystem.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNative.length === 0 ? (
                <div className="col-span-full h-40 border border-white/5 rounded-3xl flex flex-col items-center justify-center text-zinc-600">
                  <LayoutGrid className="w-8 h-8 mb-3 opacity-50" />
                  <span className="font-bold uppercase tracking-widest text-xs">No Native Apps Found</span>
                </div>
              ) : (
                filteredNative.map(app => (
                  <motion.div 
                    key={app.id}
                    onClick={() => openAppDetails(app, true)}
                    whileHover={{ y: -5 }}
                    className="bg-zinc-950 border border-white/5 rounded-[2rem] p-6 hover:border-purple-500/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-black border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl font-black text-purple-400">{app.appName.charAt(0)}</span>
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                        <h3 className="font-black text-xl truncate pr-4">{app.appName}</h3>
                        <p className="text-zinc-500 text-xs font-bold truncate">{app.developerName}</p>
                        <div className="flex gap-2 flex-wrap">
                          {app.compatibility?.map((device: string) => (
                            <span key={device} className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-white/5 px-2 py-1 rounded-md flex items-center gap-1" title={device}>
                              {getDeviceIcon(device)} <span className="hidden sm:inline">{device.replace('Voltra', '')}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="mt-6 text-sm text-zinc-400 line-clamp-2">{app.description}</p>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-purple-400 tracking-widest bg-purple-500/10 px-3 py-1 rounded-full">Free</span>
                      <button onClick={handleInstall} className="bg-white text-black font-black uppercase tracking-widest text-xs px-5 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-200">
                        Install
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Flathub Integration */}
        {(activeCategory !== "Discover" || flathubApps.length > 0 || !debouncedSearchQuery) && (
          <section className="space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                  <span className="w-3 h-8 bg-blue-500 rounded-full" /> {activeCategory !== "Discover" ? activeCategory : "Global Open Source Hub"}
                </h2>
                <p className="text-zinc-500 mt-2 font-medium">Powered natively by the Flathub V2 API. Infinite possibilities.</p>
              </div>
            </div>

            {isLoadingFlathub ? (
              <div className="col-span-full h-64 border border-white/5 rounded-3xl flex flex-col items-center justify-center text-blue-500">
                <Loader2 className="w-10 h-10 mb-4 animate-spin" />
                <span className="font-bold uppercase tracking-widest text-xs animate-pulse">Syncing with Flathub Nodes...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {flathubApps.length === 0 ? (
                  <div className="col-span-full h-40 border border-white/5 rounded-3xl flex flex-col items-center justify-center text-zinc-600">
                    <LayoutGrid className="w-8 h-8 mb-3 opacity-50" />
                    <span className="font-bold uppercase tracking-widest text-xs">No Apps Found</span>
                  </div>
                ) : (
                  flathubApps.map(app => (
                    <motion.div 
                      key={app.app_id || app.id}
                      layout
                      onClick={() => openAppDetails(app, false)}
                      whileHover={{ y: -5 }}
                      className="bg-zinc-950 border border-white/5 rounded-[2rem] p-6 hover:border-blue-500/30 transition-colors cursor-pointer group flex flex-col relative"
                    >
                      <div className="w-24 h-24 mx-auto mb-6 mt-4 rounded-3xl overflow-hidden bg-white/5 flex items-center justify-center p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={app.icon || `https://ui-avatars.com/api/?name=${app.name}&background=random`} 
                          alt={app.name} 
                          className="w-full h-full object-contain drop-shadow-2xl" 
                          onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + app.name + '&background=random' }} 
                        />
                      </div>
                      <div className="text-center space-y-1 mb-4 flex-1">
                        <h3 className="font-black text-lg leading-tight line-clamp-1">{app.name}</h3>
                        <p className="text-zinc-500 text-xs font-bold line-clamp-1">{app.developer_name || app.dev}</p>
                        <p className="text-zinc-400 text-xs pt-2 line-clamp-2">{app.summary || app.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-3 h-3 fill-yellow-500" />
                          <span className="text-xs font-bold">4.8</span>
                        </div>
                        <button onClick={handleInstall} className="bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-full transition-colors">
                          Get
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

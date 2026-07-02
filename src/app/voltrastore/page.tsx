"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { motion } from "framer-motion";
import { Download, Monitor, Gamepad2, TabletSmartphone, Star, ArrowRight } from "lucide-react";

// Mock Flathub data (Real-world open source apps available via Flathub)
const FLATHUB_APPS = [
  { id: "com.obsproject.Studio", name: "OBS Studio", dev: "OBS Project", desc: "Free and open source software for video recording and live streaming.", img: "https://dl.flathub.org/repo/appstream/x86_64/icons/128x128/com.obsproject.Studio.png", rating: 4.8 },
  { id: "org.videolan.VLC", name: "VLC media player", dev: "VideoLAN", desc: "VLC is a free and open source cross-platform multimedia player.", img: "https://dl.flathub.org/repo/appstream/x86_64/icons/128x128/org.videolan.VLC.png", rating: 4.7 },
  { id: "org.gimp.GIMP", name: "GNU Image Manipulation Program", dev: "The GIMP Team", desc: "Create images and edit photographs.", img: "https://dl.flathub.org/repo/appstream/x86_64/icons/128x128/org.gimp.GIMP.png", rating: 4.5 },
  { id: "com.spotify.Client", name: "Spotify", dev: "Spotify AB", desc: "Play music & podcasts.", img: "https://dl.flathub.org/repo/appstream/x86_64/icons/128x128/com.spotify.Client.png", rating: 4.6 },
  { id: "com.discordapp.Discord", name: "Discord", dev: "Discord Inc.", desc: "Chat for Communities and Friends.", img: "https://dl.flathub.org/repo/appstream/x86_64/icons/128x128/com.discordapp.Discord.png", rating: 4.9 },
];

export default function VoltraStorePage() {
  const firestore = useFirestore();
  const [nativeApps, setNativeApps] = useState<any[]>([]);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "voltra_app_store"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setNativeApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [firestore]);

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

  return (
    <div className="pb-32">
      {/* Hero Header */}
      <div className="relative h-[500px] w-full bg-zinc-900 overflow-hidden flex items-center px-12">
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
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-20 space-y-32">
        
        {/* Voltra Native Exclusives */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                <span className="w-3 h-8 bg-purple-500 rounded-full" /> Voltra Exclusives
              </h2>
              <p className="text-zinc-500 mt-2 font-medium">Native .volt applications compiled specifically for the Voltra Ecosystem.</p>
            </div>
            <button className="text-purple-400 font-bold uppercase tracking-widest text-xs hover:text-purple-300 flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nativeApps.length === 0 ? (
              <div className="col-span-full h-40 border border-white/5 rounded-3xl flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest">
                No Native Apps Published Yet
              </div>
            ) : (
              nativeApps.map(app => (
                <motion.div 
                  key={app.id}
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

        {/* Flathub Integration */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                <span className="w-3 h-8 bg-blue-500 rounded-full" /> Flathub Essentials
              </h2>
              <p className="text-zinc-500 mt-2 font-medium">World-class open source applications ready for VoltraOS.</p>
            </div>
            <button className="text-blue-400 font-bold uppercase tracking-widest text-xs hover:text-blue-300 flex items-center gap-2">
              Explore Flathub <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FLATHUB_APPS.map(app => (
              <motion.div 
                key={app.id}
                whileHover={{ y: -5 }}
                className="bg-zinc-950 border border-white/5 rounded-[2rem] p-6 hover:border-blue-500/30 transition-colors cursor-pointer group flex flex-col"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden bg-white/5 flex items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={app.img} alt={app.name} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + app.name + '&background=random' }} />
                </div>
                <div className="text-center space-y-1 mb-4 flex-1">
                  <h3 className="font-black text-lg leading-tight">{app.name}</h3>
                  <p className="text-zinc-500 text-xs font-bold">{app.dev}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-3 h-3 fill-yellow-500" />
                    <span className="text-xs font-bold">{app.rating}</span>
                  </div>
                  <button onClick={handleInstall} className="bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-full transition-colors">
                    Get
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { 
  Map as MapIcon, 
  Navigation, 
  Search, 
  Plus, 
  Minus, 
  Compass, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function XakteirMapsPage() {
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLoading(false);
        },
        () => {
          setLocation({ lat: 51.5074, lon: -0.1278 }); // Default to London Hub Proxy
          setLoading(false);
        }
      );
    } else {
      setLocation({ lat: 51.5074, lon: -0.1278 });
      setLoading(false);
    }
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto py-6 animate-fade-in px-6 h-[calc(100vh-140px)] flex flex-col gap-6 text-foreground">
      <header className="flex items-center gap-6 glass-card p-6 rounded-[2rem] border-white/10 shadow-2xl relative z-[100] backdrop-blur-3xl bg-black/40">
        <div className="flex items-center gap-4 pl-4 border-r border-white/10 pr-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><MapIcon className="w-6 h-6 text-blue-500" /></div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Ecosystem Maps</h1>
        </div>
        
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-400 transition-colors" />
          <Input placeholder="Find a sector or zone..." className="pl-14 h-12 bg-transparent border-none rounded-xl font-bold italic" />
        </div>

        <div className="flex items-center gap-4 pr-4">
          <Button variant="ghost" size="icon" className="rounded-xl h-11 w-11 hover:bg-white/5"><Compass className="w-6 h-6 text-blue-400" /></Button>
          <Button className="h-11 px-8 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Directions</Button>
        </div>
      </header>

      <div className="flex-1 bg-black rounded-[4rem] border-8 border-white/5 relative overflow-hidden shadow-2xl">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Syncing Geo-Registry...</p>
          </div>
        ) : (
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${location!.lon - 0.01},${location!.lat - 0.01},${location!.lon + 0.01},${location!.lat + 0.01}&layer=mapnik&marker=${location!.lat},${location!.lon}`}
            allowFullScreen
          />
        )}
        
        <div className="absolute bottom-10 right-10 flex flex-col gap-4">
          <Card className="glass-card p-2 rounded-3xl border-white/10 flex flex-col gap-2 shadow-2xl">
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary"><Plus className="w-5 h-5" /></Button>
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary"><Minus className="w-5 h-5" /></Button>
          </Card>
          <Button size="icon" className="h-16 w-16 bg-white text-black rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"><Navigation className="w-8 h-8" /></Button>
        </div>
      </div>
    </div>
  );
}

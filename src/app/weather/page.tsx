
"use client";

import { useState, useEffect } from "react";
import { 
  CloudSun, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Loader2, 
  Search,
  MapPin,
  Sun,
  Cloud,
  CloudLightning
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function XakWeatherPage() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`);
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(51.5, -0.12)
    );
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-12 animate-fade-in px-8 text-foreground space-y-12">
      <header className="flex justify-between items-end">
        <div className="space-y-4">
           <h1 className="text-7xl font-black uppercase italic tracking-tighter leading-none text-white">XakWeather</h1>
           <div className="flex gap-4">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sector..." className="bg-black/40 border-white/10 rounded-xl h-12 w-80 italic" />
              <Button size="icon" className="h-12 w-12 bg-blue-600 rounded-xl"><Search className="w-5 h-5" /></Button>
           </div>
        </div>
        <Badge variant="outline" className="h-14 px-8 border-white/10 bg-white/5 font-black uppercase text-[10px]">Real-Time Telemetry</Badge>
      </header>

      <Card className="glass-card rounded-[4rem] p-20 border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-transparent">
        <div className="absolute top-0 right-0 p-12 opacity-5"><CloudSun className="w-96 h-96 -rotate-12" /></div>
        <div className="relative z-10 flex items-center justify-between">
           <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-muted-foreground">Current Logic</p>
              <h2 className="text-[14rem] font-black italic text-white tracking-tighter leading-none">{Math.round(weather?.current?.temperature_2m || 0)}°</h2>
              <p className="text-4xl font-black uppercase text-blue-400 italic">Sector Normalized</p>
           </div>
           <div className="grid grid-cols-2 gap-8">
              {[
                { label: "Wind Node", val: `${weather?.current?.wind_speed_10m}km/h`, icon: Wind },
                { label: "Atmosphere", val: "Stable", icon: Thermometer },
              ].map(stat => (
                <div key={stat.label} className="p-8 rounded-[2.5rem] bg-black/40 border-2 border-white/5 space-y-4">
                   <stat.icon className="w-8 h-8 text-blue-400" />
                   <div>
                      <p className="text-[9px] font-black uppercase text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-black italic text-white">{stat.val}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </Card>
    </div>
  );
}

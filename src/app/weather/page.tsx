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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function XakWeatherPage() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorName, setSectorName] = useState("Local Grid");
  const { toast } = useToast();

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`);
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Error", description: "Failed to connect to weather satellites." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
        setSectorName("Your Location");
      },
      () => {
        fetchWeather(51.5, -0.12);
        setSectorName("London");
      }
    );
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        const { latitude, longitude, name, country } = geoData.results[0];
        await fetchWeather(latitude, longitude);
        setSectorName(`${name}, ${country}`);
        toast({ title: "Sector Synced", description: `Locked telemetry on ${name}, ${country}.` });
        setSearch("");
      } else {
        toast({ variant: "destructive", title: "Sector Not Found", description: "Could not find that location on the grid map." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Search Error", description: "Geocoding uplink failure." });
    } finally {
      setLoading(false);
    }
  };

  // 5-day forecast mock data
  const mockForecast = [
    { day: "MON", temp: 22, wind: 12, code: 0, label: "Sunny", icon: Sun, color: "text-amber-400" },
    { day: "TUE", temp: 19, wind: 18, code: 3, label: "Partly Cloudy", icon: CloudSun, color: "text-blue-300" },
    { day: "WED", temp: 15, wind: 25, code: 61, label: "Showers", icon: CloudRain, color: "text-sky-500" },
    { day: "THU", temp: 14, wind: 30, code: 80, label: "Thunderstorm", icon: CloudLightning, color: "text-purple-400" },
    { day: "FRI", temp: 18, wind: 10, code: 1, label: "Mostly Clear", icon: Cloud, color: "text-zinc-400" }
  ];

  return (
    <div className="max-w-[1600px] mx-auto py-12 animate-fade-in px-8 text-foreground space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
           <h1 className="text-7xl font-black uppercase italic tracking-tighter leading-none text-white">XakWeather</h1>
           <form onSubmit={handleSearch} className="flex gap-4">
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search sector (e.g. Tokyo, Paris)..." 
                className="bg-black/40 border-white/10 rounded-xl h-12 w-80 italic text-white" 
              />
              <Button type="submit" size="icon" className="h-12 w-12 bg-blue-600 rounded-xl border-none"><Search className="w-5 h-5" /></Button>
           </form>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="h-14 px-8 border-white/10 bg-white/5 font-black uppercase text-[10px] text-zinc-300 tracking-wider">
            Real-Time Telemetry
          </Badge>
        </div>
      </header>

      {loading ? (
        <Card className="glass-card rounded-[4rem] p-20 border-white/10 shadow-2xl flex flex-col items-center justify-center space-y-6 bg-zinc-950/40 min-h-[400px]">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
          <p className="text-xs font-black uppercase tracking-widest text-blue-500/60 animate-pulse">Syncing Atmosphere Arrays...</p>
        </Card>
      ) : (
        <Card className="glass-card rounded-[4rem] p-16 md:p-20 border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="absolute top-0 right-0 p-12 opacity-5"><CloudSun className="w-96 h-96 -rotate-12 text-blue-500" /></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" /> {sectorName}
                </p>
                <h2 className="text-[10rem] md:text-[14rem] font-black italic text-white tracking-tighter leading-none">{Math.round(weather?.current?.temperature_2m || 0)}°</h2>
                <p className="text-3xl font-black uppercase text-blue-400 italic">Sector Normalized</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full lg:w-auto">
                {[
                  { label: "Wind Node", val: `${weather?.current?.wind_speed_10m || 0} km/h`, icon: Wind },
                  { label: "Atmosphere", val: "Stable", icon: Thermometer },
                ].map(stat => (
                  <div key={stat.label} className="p-8 rounded-[2.5rem] bg-black/40 border-2 border-white/5 space-y-4 shadow-xl">
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
      )}

      {/* 5-Day Forecast Grid */}
      <div className="space-y-6">
        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">5-Day Sector Forecast</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {mockForecast.map((fc, index) => {
            const Icon = fc.icon;
            return (
              <div 
                key={fc.day} 
                className="glass-card rounded-[2.5rem] p-8 border-2 border-white/5 bg-black/40 text-center space-y-6 hover:border-blue-500/20 transition-all duration-300 group hover:scale-[1.02] shadow-xl"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{fc.day}</p>
                <div className="flex justify-center">
                  <Icon className={cn("w-14 h-14 animate-float", fc.color)} style={{ animationDelay: `${index * 0.2}s` }} />
                </div>
                <div>
                  <p className="text-4xl font-black italic text-white">{fc.temp}°</p>
                  <p className="text-[9px] font-black uppercase text-blue-400 mt-2">{fc.label}</p>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between text-[8px] font-bold text-zinc-500 uppercase">
                  <span>Wind</span>
                  <span>{fc.wind} km/h</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weather Warnings Section */}
      <div className="space-y-6">
        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Sector Hazards & Alerts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card rounded-[2.5rem] p-8 border-rose-500/20 bg-rose-950/10 text-foreground relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute top-0 right-0 p-6 opacity-5"><CloudLightning className="w-40 h-40 text-rose-500" /></div>
            <div className="space-y-4 relative z-10">
              <Badge className="bg-rose-600 text-white font-black uppercase tracking-widest px-3 py-1 text-[8px] border-none">Active Alert</Badge>
              <h4 className="text-2xl font-black uppercase italic text-rose-400 tracking-tight leading-tight">Gale Force Winds</h4>
              <p className="text-xs font-semibold text-zinc-300 leading-relaxed">High pressure anomaly detected in Northern Grid. Expect wind gusts exceeding 45km/h over the next 24 cycles.</p>
            </div>
            <div className="mt-6 text-[8px] font-black uppercase text-rose-500 tracking-wider">Severity: Moderate // Priority Red</div>
          </Card>

          <Card className="glass-card rounded-[2.5rem] p-8 border-amber-500/20 bg-amber-950/10 text-foreground relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute top-0 right-0 p-6 opacity-5"><Wind className="w-40 h-40 text-amber-500" /></div>
            <div className="space-y-4 relative z-10">
              <Badge className="bg-amber-600 text-white font-black uppercase tracking-widest px-3 py-1 text-[8px] border-none">Advisory</Badge>
              <h4 className="text-2xl font-black uppercase italic text-amber-400 tracking-tight leading-tight">Solar Flares</h4>
              <p className="text-xs font-semibold text-zinc-300 leading-relaxed">Mild geomagnetic storm may disrupt wireless node sync. Shielding is advised for high-frequency neural relays.</p>
            </div>
            <div className="mt-6 text-[8px] font-black uppercase text-amber-500 tracking-wider">Severity: Minor // Info Yellow</div>
          </Card>

          <Card className="glass-card rounded-[2.5rem] p-8 border-emerald-500/20 bg-emerald-950/10 text-foreground relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute top-0 right-0 p-6 opacity-5"><Sun className="w-40 h-40 text-emerald-500" /></div>
            <div className="space-y-4 relative z-10">
              <Badge className="bg-emerald-600 text-white font-black uppercase tracking-widest px-3 py-1 text-[8px] border-none">Atmosphere Status</Badge>
              <h4 className="text-2xl font-black uppercase italic text-emerald-400 tracking-tight leading-tight">Stable Core</h4>
              <p className="text-xs font-semibold text-zinc-300 leading-relaxed">Central sub-grid weather shield is functioning at 98.4% efficiency. Atmospheric density within safety parameters.</p>
            </div>
            <div className="mt-6 text-[8px] font-black uppercase text-emerald-500 tracking-wider">Severity: Clear // Status Green</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

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
  CloudLightning,
  Droplets,
  Gauge,
  Umbrella,
  Snowflake,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const getWeatherDetails = (code?: number) => {
  if (code === undefined) return { icon: Cloud, label: "Unknown", color: "text-zinc-400" };
  if (code === 0) return { icon: Sun, label: "Clear", color: "text-amber-400" };
  if (code === 1 || code === 2 || code === 3) return { icon: CloudSun, label: "Partly Cloudy", color: "text-blue-300" };
  if (code === 45 || code === 48) return { icon: Cloud, label: "Fog", color: "text-zinc-400" };
  if (code >= 51 && code <= 55) return { icon: CloudRain, label: "Drizzle", color: "text-sky-400" };
  if (code >= 61 && code <= 65) return { icon: CloudRain, label: "Rain", color: "text-sky-500" };
  if (code >= 71 && code <= 77) return { icon: Snowflake, label: "Snow", color: "text-white" };
  if (code >= 80 && code <= 82) return { icon: CloudRain, label: "Showers", color: "text-blue-500" };
  if (code >= 95) return { icon: CloudLightning, label: "Thunderstorm", color: "text-purple-400" };
  return { icon: Cloud, label: "Unknown", color: "text-zinc-400" };
};

const getFunnyComment = (code?: number, wind?: number) => {
  if (code === undefined) return "Calibrating sensors...";
  if (wind && wind > 40) return "It's super windy! Hold onto your hats!";
  if (code === 0) return "Not a cloud in sight. Go get some vitamin D!";
  if (code === 1 || code === 2 || code === 3) return "A bit cloudy, but nothing to cry about.";
  if (code === 45 || code === 48) return "Foggy outside. Silent Hill vibes.";
  if (code >= 51 && code <= 55) return "It's drizzling! Not too rainy! Ok to cycle!";
  if (code >= 61 && code <= 65) return "It's properly raining. Umbrellas at the ready.";
  if (code >= 71 && code <= 77) return "Snow! Time to build a slightly misshapen snowman.";
  if (code >= 80 && code <= 82) return "Don't go outside! It's really dangerous! Flooding possible!";
  if (code >= 95) return "Thunderstorms! Zeus is having a bad day.";
  return "Weather is weather. You'll survive.";
};

export default function XakWeatherPage() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorName, setSectorName] = useState("Local Grid");
  const { toast } = useToast();

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=auto`;
      const res = await fetch(url);
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

  const getHazards = () => {
    if (!weather?.current) return [];
    const hazards = [];
    if (weather.current.wind_speed_10m > 40) {
      hazards.push({
        title: "Gale Force Winds", desc: `Wind gusts currently at ${weather.current.wind_speed_10m} km/h. Secure loose objects.`,
        severity: "Priority Red", icon: Wind, color: "text-rose-500", border: "border-rose-500/20", bg: "bg-rose-950/10", badge: "bg-rose-600"
      });
    }
    if (weather.current.precipitation > 2) {
      hazards.push({
        title: "Heavy Precipitation", desc: `Currently raining heavily (${weather.current.precipitation}mm). Risk of localized flooding.`,
        severity: "Priority Orange", icon: CloudRain, color: "text-amber-500", border: "border-amber-500/20", bg: "bg-amber-950/10", badge: "bg-amber-600"
      });
    }
    if (weather.current.weather_code >= 95) {
      hazards.push({
        title: "Thunderstorm Warning", desc: "Electrical storm detected in sector. Remain indoors.",
        severity: "Priority Red", icon: CloudLightning, color: "text-rose-500", border: "border-rose-500/20", bg: "bg-rose-950/10", badge: "bg-rose-600"
      });
    }
    if (hazards.length === 0) {
      hazards.push({
        title: "Stable Core", desc: "Atmospheric conditions are within optimal safety parameters. All clear.",
        severity: "Status Green", icon: ShieldCheck, color: "text-emerald-500", border: "border-emerald-500/20", bg: "bg-emerald-950/10", badge: "bg-emerald-600"
      });
    }
    return hazards;
  };

  const currentIconDetails = getWeatherDetails(weather?.current?.weather_code);
  const CurrentHeroIcon = currentIconDetails.icon;

  return (
    <div className="max-w-[1600px] mx-auto py-12 animate-fade-in px-8 text-foreground space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
           <h1 className="text-7xl font-black uppercase italic tracking-tighter leading-none text-white">Xakteir Weather</h1>
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
        <>
          <Card className="glass-card rounded-[4rem] p-16 md:p-20 border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-transparent">
            <div className="absolute top-0 right-0 p-12 opacity-5"><CurrentHeroIcon className="w-96 h-96 -rotate-12 text-blue-500" /></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.6em] text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> {sectorName}
                  </p>
                  <h2 className="text-[10rem] md:text-[14rem] font-black italic text-white tracking-tighter leading-none">{Math.round(weather?.current?.temperature_2m || 0)}°</h2>
                  <p className="text-xl md:text-3xl font-black uppercase text-blue-400 italic">
                    {getFunnyComment(weather?.current?.weather_code, weather?.current?.wind_speed_10m)}
                  </p>
               </div>
               <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                  {[
                    { label: "Wind Speed", val: `${weather?.current?.wind_speed_10m || 0} km/h`, icon: Wind },
                    { label: "Feels Like", val: `${Math.round(weather?.current?.apparent_temperature || 0)}°`, icon: Thermometer },
                    { label: "Humidity", val: `${weather?.current?.relative_humidity_2m || 0}%`, icon: Droplets },
                    { label: "Pressure", val: `${weather?.current?.surface_pressure || 0} hPa`, icon: Gauge },
                  ].map(stat => (
                    <div key={stat.label} className="p-6 rounded-[2rem] bg-black/40 border-2 border-white/5 space-y-4 shadow-xl flex flex-col justify-center min-w-[160px]">
                       <stat.icon className="w-6 h-6 text-blue-400" />
                       <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-black italic text-white">{stat.val}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </Card>

          {/* Hourly Forecast Timeline */}
          {weather?.hourly && (
            <div className="space-y-6">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Next 12 Hours</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {weather.hourly.time.slice(0, 12).map((timeStr: string, idx: number) => {
                  const hourDetails = getWeatherDetails(weather.hourly.weather_code[idx]);
                  const HIcon = hourDetails.icon;
                  const date = new Date(timeStr);
                  const isNow = idx === 0;
                  return (
                    <div key={timeStr} className={cn("min-w-[120px] snap-center glass-card rounded-[2rem] p-6 border-2 flex flex-col items-center justify-center space-y-4 shadow-lg shrink-0", isNow ? "border-blue-500/50 bg-blue-950/20" : "border-white/5 bg-black/40")}>
                      <p className="text-[10px] font-black uppercase text-zinc-400">
                        {isNow ? "Now" : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <HIcon className={cn("w-8 h-8", hourDetails.color)} />
                      <p className="text-2xl font-black italic text-white">{Math.round(weather.hourly.temperature_2m[idx])}°</p>
                      <p className="text-[8px] font-black uppercase text-blue-400 flex items-center gap-1">
                        <Umbrella className="w-3 h-3" /> {weather.hourly.precipitation_probability[idx]}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5-Day Forecast Grid */}
          {weather?.daily && (
            <div className="space-y-6">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">5-Day Sector Forecast</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {weather.daily.time.slice(0, 5).map((timeStr: string, index: number) => {
                  const dDetails = getWeatherDetails(weather.daily.weather_code[index]);
                  const DIcon = dDetails.icon;
                  const date = new Date(timeStr);
                  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
                  const dayName = index === 0 ? "TODAY" : days[date.getDay()];
                  
                  return (
                    <div 
                      key={timeStr} 
                      className="glass-card rounded-[2.5rem] p-8 border-2 border-white/5 bg-black/40 text-center space-y-6 hover:border-blue-500/20 transition-all duration-300 group hover:scale-[1.02] shadow-xl flex flex-col justify-between"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{dayName}</p>
                      <div className="flex justify-center">
                        <DIcon className={cn("w-14 h-14 animate-float", dDetails.color)} style={{ animationDelay: `${index * 0.2}s` }} />
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-4xl font-black italic text-white">{Math.round(weather.daily.temperature_2m_max[index])}°</p>
                          <p className="text-xl font-black italic text-zinc-600">{Math.round(weather.daily.temperature_2m_min[index])}°</p>
                        </div>
                        <p className="text-[9px] font-black uppercase text-blue-400 mt-2">{dDetails.label}</p>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex justify-between text-[8px] font-bold text-zinc-500 uppercase">
                        <span>Wind</span>
                        <span>{Math.round(weather.daily.wind_speed_10m_max[index])} km/h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weather Warnings Section */}
          <div className="space-y-6">
            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Sector Hazards & Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getHazards().map((hazard, i) => (
                <Card key={i} className={cn("glass-card rounded-[2.5rem] p-8 border-2 text-foreground relative overflow-hidden flex flex-col justify-between shadow-xl", hazard.border, hazard.bg)}>
                  <div className="absolute top-0 right-0 p-6 opacity-5"><hazard.icon className={cn("w-40 h-40", hazard.color)} /></div>
                  <div className="space-y-4 relative z-10">
                    <Badge className={cn("text-white font-black uppercase tracking-widest px-3 py-1 text-[8px] border-none", hazard.badge)}>Alert Triggered</Badge>
                    <h4 className={cn("text-2xl font-black uppercase italic tracking-tight leading-tight", hazard.color)}>{hazard.title}</h4>
                    <p className="text-xs font-semibold text-zinc-300 leading-relaxed">{hazard.desc}</p>
                  </div>
                  <div className={cn("mt-6 text-[8px] font-black uppercase tracking-wider", hazard.color)}>{hazard.severity}</div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  CloudSun, CloudRain, Wind, Thermometer, Loader2, Search, MapPin, Sun, Cloud, CloudLightning,
  Droplets, Gauge, Umbrella, Snowflake, AlertTriangle, ShieldCheck, BellRing, BrainCircuit, Activity
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const WeatherRadar = dynamic(() => import("@/components/weather/WeatherRadar"), { ssr: false });

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

export default function XakWeatherPage() {
  const [weather, setWeather] = useState<any>(null);
  const [airQuality, setAirQuality] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorName, setSectorName] = useState("Local Grid");
  const [latLon, setLatLon] = useState({ lat: 51.5, lon: -0.12 });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setLatLon({ lat, lon });
    try {
      // Fetch Weather
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      setWeather(data);

      // Fetch Air Quality & UV
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,uv_index`;
      const aqiRes = await fetch(aqiUrl);
      const aqiData = await aqiRes.json();
      setAirQuality(aqiData);

      // Trigger Alert if severe weather and notifications are enabled
      if (notificationsEnabled) {
         if (data.current.weather_code >= 95 || data.current.wind_speed_10m > 40) {
            new Notification("Severe Weather Alert!", {
               body: "Extreme conditions detected in your sector. Stay indoors.",
               icon: "/favicon.ico"
            });
         }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Error", description: "Failed to connect to weather satellites." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
      }
    }

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

  const requestNotifications = () => {
    if (!("Notification" in window)) {
      toast({ variant: "destructive", description: "Your browser does not support notifications." });
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        setNotificationsEnabled(true);
        toast({ title: "Notifications Enabled", description: "You will now receive extreme weather alerts." });
        new Notification("Xakteir Weather", { body: "Alerts are now active!", icon: "/favicon.ico" });
      }
    });
  };

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

  // AI Meteorologist Logic
  const getAiBriefing = () => {
    if (!weather) return "Initializing neural matrix...";
    const code = weather.current.weather_code;
    const wind = weather.current.wind_speed_10m;
    const aqi = airQuality?.current?.european_aqi;
    
    let text = "";
    if (wind > 40) text += "It's super windy! Hold onto your hats! ";
    else if (code === 0) text += "Not a cloud in sight. Go get some vitamin D! ";
    else if (code === 1 || code === 2 || code === 3) text += "A bit cloudy, but nothing to cry about. ";
    else if (code >= 51 && code <= 55) text += "It's drizzling! Not too rainy! Ok to cycle! ";
    else if (code >= 61 && code <= 65) text += "It's properly raining. Umbrellas at the ready. ";
    else if (code >= 71 && code <= 77) text += "Snow! Time to build a slightly misshapen snowman. ";
    else if (code >= 80 && code <= 82) text += "Don't go outside! It's really dangerous! Flooding possible! ";
    else if (code >= 95) text += "Thunderstorms! Zeus is having a bad day. ";
    else text += "Weather is weather. You'll survive. ";

    if (aqi > 60) text += "Also, the air quality is pretty bad today. Maybe wear a mask.";
    return text;
  };

  return (
    <div className="max-w-[1600px] mx-auto py-12 animate-fade-in px-8 text-foreground space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
           <h1 className="text-7xl font-black uppercase italic tracking-tighter leading-none text-white drop-shadow-md">Xakteir Weather</h1>
           <form onSubmit={handleSearch} className="flex gap-4">
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search sector (e.g. Tokyo, Paris)..." 
                className="bg-black/40 border-white/10 rounded-xl h-12 w-80 italic text-white focus:border-blue-500/50" 
              />
              <Button type="submit" size="icon" className="h-12 w-12 bg-blue-600 hover:bg-blue-700 rounded-xl border-none shadow-lg shadow-blue-900/20"><Search className="w-5 h-5" /></Button>
           </form>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={requestNotifications} 
            variant="outline" 
            className={cn("h-14 px-6 border-white/10 rounded-xl font-black uppercase text-[10px] tracking-wider transition-colors", notificationsEnabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-black/40 text-zinc-300 hover:bg-white/10")}
          >
            <BellRing className="w-4 h-4 mr-2" />
            {notificationsEnabled ? "Alerts Active" : "Enable Alerts"}
          </Button>
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
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
            <Card className="glass-card rounded-[3rem] p-12 md:p-16 border-2 border-white/5 shadow-2xl relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-transparent">
              <div className="absolute top-0 right-0 p-12 opacity-5"><CurrentHeroIcon className="w-96 h-96 -rotate-12 text-blue-500" /></div>
              <div className="relative z-10 flex flex-col items-start justify-between gap-12 h-full">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-400 flex items-center gap-2 drop-shadow-md">
                      <MapPin className="w-3.5 h-3.5" /> {sectorName}
                    </p>
                    <h2 className="text-[8rem] md:text-[12rem] font-black italic text-white tracking-tighter leading-none drop-shadow-2xl">{Math.round(weather?.current?.temperature_2m || 0)}°</h2>
                    <p className="text-xl font-black uppercase text-zinc-400 italic">
                      {currentIconDetails.label}
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    {[
                      { label: "Wind Speed", val: `${weather?.current?.wind_speed_10m || 0} km/h`, icon: Wind, color: "text-sky-400" },
                      { label: "Feels Like", val: `${Math.round(weather?.current?.apparent_temperature || 0)}°`, icon: Thermometer, color: "text-amber-400" },
                      { label: "Humidity", val: `${weather?.current?.relative_humidity_2m || 0}%`, icon: Droplets, color: "text-blue-400" },
                      { label: "Pressure", val: `${weather?.current?.surface_pressure || 0} hPa`, icon: Gauge, color: "text-purple-400" },
                    ].map(stat => (
                      <div key={stat.label} className="p-5 rounded-[1.5rem] bg-black/40 border border-white/5 space-y-3 shadow-lg flex flex-col justify-center">
                         <stat.icon className={cn("w-5 h-5", stat.color)} />
                         <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
                            <p className="text-lg font-black italic text-white">{stat.val}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </Card>

            <div className="space-y-8 flex flex-col">
              <Card className="glass-card rounded-[3rem] p-8 border-2 border-indigo-500/20 bg-[#050508] shadow-[0_0_40px_rgba(99,102,241,0.1)] relative overflow-hidden flex-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">XakBot Meteorologist</h3>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">AI Weather Briefing</p>
                  </div>
                </div>
                
                <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-5 relative z-10 h-[calc(100%-5rem)] flex items-center">
                  <p className="text-sm font-medium text-zinc-300 leading-relaxed italic border-l-2 border-indigo-500 pl-4">
                    "{getAiBriefing()}"
                  </p>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 rounded-[2rem] bg-black/40 border border-white/5 flex flex-col justify-between min-h-[140px]">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Activity className="w-3 h-3 text-emerald-400" /> AQI (EU)</p>
                  <div>
                    <p className="text-4xl font-black italic text-white">{Math.round(airQuality?.current?.european_aqi || 0)}</p>
                    <p className="text-[10px] uppercase font-bold text-emerald-400 mt-1">Air Quality</p>
                  </div>
                </Card>
                <Card className="p-6 rounded-[2rem] bg-black/40 border border-white/5 flex flex-col justify-between min-h-[140px]">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Sun className="w-3 h-3 text-amber-400" /> UV Index</p>
                  <div>
                    <p className="text-4xl font-black italic text-white">{airQuality?.current?.uv_index || 0}</p>
                    <p className="text-[10px] uppercase font-bold text-amber-400 mt-1">Radiation Level</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
            {/* Interactive Radar */}
            <div className="space-y-6">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-500" /> Sector Radar Grid
              </h3>
              <Card className="glass-card rounded-[3rem] border-2 border-white/5 bg-black/40 shadow-2xl h-[400px] overflow-hidden p-2">
                 <WeatherRadar lat={latLon.lat} lon={latLon.lon} />
              </Card>
            </div>

            {/* Weather Warnings Section */}
            <div className="space-y-6">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Sector Hazards & Alerts</h3>
              <div className="grid grid-cols-1 gap-4 h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {getHazards().map((hazard, i) => (
                  <Card key={i} className={cn("glass-card rounded-[2rem] p-6 border-2 text-foreground relative overflow-hidden flex flex-col justify-center shadow-xl", hazard.border, hazard.bg)}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 p-6 opacity-10"><hazard.icon className={cn("w-24 h-24", hazard.color)} /></div>
                    <div className="space-y-2 relative z-10 pr-20">
                      <Badge className={cn("text-white font-black uppercase tracking-widest px-3 py-1 text-[8px] border-none", hazard.badge)}>Alert Triggered</Badge>
                      <h4 className={cn("text-xl font-black uppercase italic tracking-tight leading-tight", hazard.color)}>{hazard.title}</h4>
                      <p className="text-xs font-semibold text-zinc-300 leading-relaxed">{hazard.desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

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
                    <div key={timeStr} className={cn("min-w-[120px] snap-center glass-card rounded-[2rem] p-6 border-2 flex flex-col items-center justify-center space-y-4 shadow-lg shrink-0", isNow ? "border-blue-500/50 bg-blue-950/20" : "border-white/5 bg-black/40 hover:bg-white/5 transition-colors")}>
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
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface WeatherRadarProps {
  lat: number;
  lon: number;
}

export default function WeatherRadar({ lat, lon }: WeatherRadarProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!mapRef.current) {
      mapRef.current = L.map("weather-map", {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lon], 7);

      // Dark theme base map (CartoDB Dark Matter)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(mapRef.current);

      // OpenWeatherMap Precipitation Layer (Free tier standard)
      // We will simulate it using OpenWeatherMap tile layer if possible, or just a generic placeholder layer.
      // Since we don't have an OWM API key, we will add a nice blue tint overlay circle to represent local radar scan area.
      L.circle([lat, lon], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        radius: 100000 // 100km radius scan
      }).addTo(mapRef.current);
      
      // Center marker
      const pulseIcon = L.divIcon({
        className: "bg-blue-500 w-4 h-4 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse",
        iconSize: [16, 16],
      });
      L.marker([lat, lon], { icon: pulseIcon }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lon], 7);
      
      // Clear old layers (except base) and redraw circle
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Circle || layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer);
        }
      });
      
      L.circle([lat, lon], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        radius: 100000
      }).addTo(mapRef.current);
      
      const pulseIcon = L.divIcon({
        className: "bg-blue-500 w-4 h-4 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse",
        iconSize: [16, 16],
      });
      L.marker([lat, lon], { icon: pulseIcon }).addTo(mapRef.current);
    }

    // Fix leaflet container size issues on render
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);

  }, [lat, lon]);

  return <div id="weather-map" className="w-full h-full rounded-[2rem] bg-zinc-900/50 z-0" />;
}

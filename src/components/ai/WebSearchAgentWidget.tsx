"use client";

import { useState } from "react";
import { Globe, Search, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export function WebSearchAgentWidget({ query = "Xakteir VoltraOS updates" }: { query?: string }) {
  const [results] = useState<SearchResult[]>([
    {
      title: "Xakteir Ecosystem & VoltraOS Release Roadmap 2026",
      url: "https://xakteir.io/news/voltraos-roadmap",
      snippet: "VoltraOS delivers zero-latency Wayland graphics compositor and seamless Windows EXE compatibility on Intel Core Ultra hardware.",
    },
    {
      title: "VoltraMax 5-in-1 Folding Tablet Specifications",
      url: "https://xakteir.io/hardware/voltramax",
      snippet: "Features triple 4K displays, 360-degree dual-axis hinge, active vapor chamber cooling, and 100Wh battery.",
    },
  ]);

  return (
    <div className="my-4 rounded-xl border border-sky-500/30 bg-[#040f1a]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-sky-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-sky-400" />
          <span className="font-semibold text-sky-200">AI Web Intelligence & Search Agent</span>
        </div>
        <span className="font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
          🔍 "{query}"
        </span>
      </div>

      <div className="space-y-2">
        {results.map((res, idx) => (
          <div key={idx} className="bg-black/40 rounded-lg p-3 border border-sky-500/10 hover:border-sky-500/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <a href={res.url} target="_blank" rel="noreferrer" className="font-semibold text-sky-300 hover:underline flex items-center">
                {res.title} <ExternalLink className="h-3 w-3 ml-1 text-sky-400" />
              </a>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed">{res.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

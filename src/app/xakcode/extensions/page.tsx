"use client";

import React, { useState } from "react";
import { useXakCode } from "../context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Plug,
  Search,
  Download,
  Trash2,
  Check,
  Star,
  Package,
  Loader2,
  ChevronRight,
  X,
  Zap,
} from "lucide-react";

export default function ExtensionsPage() {
  const {
    plugins,
    isPluginStoreOpen,
    setIsPluginStoreOpen,
    installPlugin,
    uninstallPlugin,
    activeProject,
  } = useXakCode();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [installing, setInstalling] = useState<string | null>(null);

  const categories = ["All", ...new Set(plugins.map((p) => p.category))];

  const filteredPlugins = plugins.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "All" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = async (pluginId: string) => {
    setInstalling(pluginId);
    await installPlugin(pluginId);
    setInstalling(null);
  };

  const handleUninstall = async (pluginId: string) => {
    setInstalling(pluginId);
    await uninstallPlugin(pluginId);
    setInstalling(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950/20 p-6 text-left">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        
        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
            <Plug className="w-7 h-7 text-sky-400" /> Extension Marketplace
          </h2>
          <p className="text-[10px] text-muted-foreground italic leading-relaxed">
            Discover and install powerful extensions to supercharge your XakCode IDE. {plugins.filter(p => p.installed).length} of {plugins.length} extensions installed.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extensions..."
              className="bg-zinc-950 border-white/10 h-10 pl-10 text-xs font-bold text-white focus:border-sky-500 w-full sm:w-80"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "h-8 px-3 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all",
                  filterCategory === cat
                    ? "bg-sky-500/20 border-sky-500/30 text-sky-400"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Plugin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map((plugin) => (
            <Card
              key={plugin.id}
              className={cn(
                "bg-zinc-900/40 border-white/5 p-5 rounded-2xl space-y-4 transition-all hover:border-white/15",
                plugin.installed && "border-sky-500/30"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-xl">
                    {plugin.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{plugin.name}</h3>
                    <p className="text-[8px] text-white/30 font-mono">v{plugin.version}</p>
                  </div>
                </div>
                {plugin.installed && (
                  <Badge className="bg-sky-500/20 text-sky-400 border-none text-[7px] font-bold">INSTALLED</Badge>
                )}
              </div>

              {/* Description */}
              <p className="text-[10px] text-white/60 leading-relaxed">{plugin.description}</p>

              {/* Meta */}
              <div className="flex items-center gap-3 text-[8px] text-white/30 font-mono">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> {plugin.rating}</span>
                <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {plugin.downloads.toLocaleString()}</span>
                <Badge variant="outline" className="text-[7px] border-white/10">{plugin.category}</Badge>
              </div>

              {/* Author */}
              <p className="text-[8px] text-white/20">by {plugin.author}</p>

              {/* Action Button */}
              <Button
                onClick={() => plugin.installed ? handleUninstall(plugin.id) : handleInstall(plugin.id)}
                disabled={installing === plugin.id}
                variant={plugin.installed ? "outline" : "default"}
                className={cn(
                  "w-full h-9 rounded-xl font-black uppercase text-[9px] tracking-wider",
                  plugin.installed
                    ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50"
                    : "bg-sky-600 hover:bg-sky-500 text-white shadow-xl"
                )}
              >
                {installing === plugin.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : plugin.installed ? (
                  <><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Uninstall</>
                ) : (
                  <><Download className="w-3.5 h-3.5 mr-1.5" /> Install</>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {filteredPlugins.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Plug className="w-12 h-12 text-white/10 mb-4" />
            <p className="text-white/30 font-bold">No extensions found.</p>
            <p className="text-white/20 text-xs">Try a different search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

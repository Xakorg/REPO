"use client";

import React, { useState } from "react";
import { useXakCode } from "../context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Download,
  Loader2,
  Star,
  Eye,
  Wand2,
  FolderTree,
  ArrowRight,
  Crown,
} from "lucide-react";

export default function TemplatesPage() {
  const { templates, handleCreateFromTemplate, activeProject } = useXakCode();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = async (templateId: string) => {
    setApplying(templateId);
    await handleCreateFromTemplate(templateId);
    setApplying(null);
  };

  const featuredTemplates = templates.filter((t) => t.featured);
  const otherTemplates = templates.filter((t) => !t.featured);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950/20 p-6 text-left">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        
        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
            <LayoutGrid className="w-7 h-7 text-sky-400" /> Project Templates
          </h2>
          <p className="text-[10px] text-muted-foreground italic leading-relaxed">
            Jump-start your project with professionally designed templates. Choose a template and watch your workspace come to life.
          </p>
        </div>

        {/* Featured Templates */}
        {featuredTemplates.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Featured Templates</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    "bg-zinc-900/40 border-white/5 p-6 rounded-2xl space-y-4 transition-all hover:border-sky-500/30 cursor-pointer group",
                    selectedTemplate === template.id && "border-sky-500/30"
                  )}
                  onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
                >
                  {/* Preview Card */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white group-hover:text-sky-400 transition-colors">{template.name}</h3>
                        <Badge className="bg-amber-500/20 text-amber-400 border-none text-[7px] font-bold">★ FEATURED</Badge>
                      </div>
                      <p className="text-[10px] text-white/50 leading-relaxed mt-1">{template.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-sky-400 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                  </div>

                  {/* Expanded Preview */}
                  {selectedTemplate === template.id && (
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[9px] leading-relaxed text-white/60 max-h-40 overflow-y-auto">
                        <p className="text-sky-400 mb-1">// Preview of {template.name}</p>
                        {Object.keys(template.files).map((fileName) => (
                          <div key={fileName} className="mb-2">
                            <p className="text-emerald-400">{fileName}</p>
                            <p className="text-white/40">{template.files[fileName]?.slice(0, 120)}...</p>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleApply(template.id); }}
                        disabled={applying === template.id}
                        className="w-full bg-sky-600 hover:bg-sky-500 rounded-xl font-black uppercase text-[9px] tracking-wider text-white h-9"
                      >
                        {applying === template.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <><Wand2 className="w-3.5 h-3.5 mr-1.5" /> Apply Template</>
                        )}
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}

        {/* All Other Templates */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-sky-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">All Templates</span>
            <Badge variant="outline" className="text-[7px] border-white/10">{templates.length} total</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {otherTemplates.map((template) => (
              <Card
                key={template.id}
                className="bg-zinc-900/40 border-white/5 p-4 rounded-xl space-y-3 transition-all hover:border-white/15 cursor-pointer group"
                onClick={() => handleApply(template.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-white truncate">{template.name}</h4>
                    <p className="text-[8px] text-white/30">{template.category}</p>
                  </div>
                  <Download className="w-4 h-4 text-white/20 group-hover:text-sky-400 transition-colors shrink-0" />
                </div>
                <p className="text-[9px] text-white/40 line-clamp-2">{template.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



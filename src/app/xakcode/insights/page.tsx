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
  Sparkles,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Lightbulb,
  X,
  CheckCircle,
  ArrowRight,
  Search,
  Shield,
  Zap,
  BarChart3,
  TrendingUp,
  FileCode,
  Clock,
} from "lucide-react";

export default function InsightsPage() {
  const {
    codeText,
    aiInsights,
    isReviewing,
    handleCodeReview,
    clearInsights,
    aiExplanation,
    setAiExplanation,
    aiPrompt,
    setAiPrompt,
    isGenerating,
    handleGenerateCode,
    addAiPromptHistory,
    setIsPluginStoreOpen,
    plugins,
  } = useXakCode();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'review' | 'ai'>('review');

  const handleReview = async () => {
    await handleCodeReview();
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    await handleGenerateCode(aiPrompt);
    const instruction = aiPrompt;
    if (!addAiPromptHistory) return;
    // History is managed in context
  };

  const insightIcons = {
    warning: AlertTriangle,
    suggestion: Lightbulb,
    error: X,
    optimization: CheckCircle,
  };

  const insightColors = {
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    suggestion: "border-sky-500/30 bg-sky-500/5 text-sky-400",
    error: "border-rose-500/30 bg-rose-500/5 text-rose-400",
    optimization: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  };

  // Quick stats
  const stats = {
    totalLines: codeText.split('\n').length,
    totalChars: codeText.length,
    totalWords: codeText.trim().split(/\s+/).filter(Boolean).length,
    totalFiles: 1, // Simplified
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950/20 p-6 text-left">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        
        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-sky-400" /> AI Insights & Workspace Intelligence
          </h2>
          <p className="text-[10px] text-muted-foreground italic leading-relaxed">
            Get AI-powered code reviews, analysis, and smart suggestions to level up your codebase.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Lines", value: stats.totalLines, icon: FileCode, color: "text-sky-400" },
            { label: "Characters", value: stats.totalChars, icon: BarChart3, color: "text-emerald-400" },
            { label: "Words", value: stats.totalWords, icon: TrendingUp, color: "text-amber-400" },
            { label: "Extensions", value: plugins.filter(p => p.installed).length, icon: Zap, color: "text-rose-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-zinc-900/40 border-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-[8px] font-black uppercase tracking-wider text-white/30">{stat.label}</span>
              </div>
              <p className={`text-2xl font-black ${stat.color} mt-1`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-black/40 rounded-xl p-1 border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab('review')}
            className={cn(
              "px-4 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'review' ? "bg-sky-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            <Shield className="w-3 h-3" /> Code Review
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              "px-4 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'ai' ? "bg-sky-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            <Zap className="w-3 h-3" /> AI Assistant
          </button>
        </div>

        {/* Code Review Tab */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            {/* Review Action Bar */}
            <div className="flex gap-3 items-center">
              <Button
                onClick={handleReview}
                disabled={isReviewing}
                className="bg-sky-600 hover:bg-sky-500 h-10 rounded-xl font-black uppercase text-[9px] tracking-wider text-white shadow-xl"
              >
                {isReviewing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isReviewing ? "Analyzing..." : "Run Code Review"}
              </Button>
              {aiInsights.length > 0 && (
                <Button
                  onClick={clearInsights}
                  variant="outline"
                  className="h-10 rounded-xl border-white/10 text-[9px] font-black uppercase hover:bg-white/5 text-white"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" /> Clear Results
                </Button>
              )}
            </div>

            {/* Insights Results */}
            {aiInsights.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {aiInsights.map((insight, idx) => {
                    const Icon = insightIcons[insight.type];
                    const colors = insightColors[insight.type];
                    return (
                      <Card
                        key={idx}
                        className={cn(
                          "border rounded-xl p-4 space-y-2",
                          colors
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <Badge variant="outline" className="text-[7px] font-black uppercase border-current">
                            {insight.type}
                          </Badge>
                          {insight.line && (
                            <span className="text-[8px] font-mono text-white/30">Line {insight.line}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/80 leading-relaxed">{insight.message}</p>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-white/30" />
                          <p className="text-[9px] text-white/50">Suggestion: {insight.suggestion}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/5 rounded-full">
                            <div
                              className="h-1 bg-sky-400 rounded-full"
                              style={{ width: `${Math.round(insight.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-[8px] font-mono text-white/30">{Math.round(insight.confidence * 100)}% confidence</span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <Card className="bg-zinc-900/40 border-white/5 p-12 rounded-2xl text-center">
                <Shield className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <h3 className="text-sm font-black uppercase italic text-white/55 mb-2">Ready for Analysis</h3>
                <p className="text-[10px] text-white/30 max-w-sm mx-auto leading-relaxed">
                  Click "Run Code Review" to analyze your current code for potential issues, optimizations, and best practices.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {/* AI Chat Panel */}
            <Card className="bg-zinc-900/40 border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
                <Sparkles className="w-4 h-4 animate-pulse" /> AI Code Assistant
              </div>

              {/* AI Explanation */}
              {aiExplanation && (
                <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl space-y-2">
                  <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Synthesis</span>
                  <p className="text-[10px] leading-relaxed italic text-white/80">{aiExplanation}</p>
                </div>
              )}

              {/* Quick Prompts */}
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase text-muted-foreground ml-1">Quick Prompts</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Add dark glassmorphic cyber design theme",
                    "Make this more responsive with mobile breakpoints",
                    "Add TypeScript types to all components",
                    "Optimize this code for performance",
                    "Add error boundaries and loading states",
                  ].map((prompt, idx) => (
                    <Button
                      key={idx}
                      onClick={() => { setAiPrompt(prompt); handleGenerateCode(prompt); }}
                      disabled={isGenerating}
                      variant="outline"
                      className="h-10 text-[9px] font-black uppercase justify-start px-4 rounded-xl border-white/5 bg-white/5 hover:bg-sky-500/10 text-white whitespace-normal text-left"
                    >
                      <Zap className="w-3 h-3 mr-2 text-sky-400 shrink-0" /> {prompt}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <form onSubmit={(e) => { e.preventDefault(); handleGenerateCode(aiPrompt); }} className="relative">
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask the AI to change styles or code..."
                  className="h-12 bg-zinc-950 border-white/10 rounded-xl pr-14 text-xs font-bold text-white focus:border-sky-500"
                />
                <Button
                  disabled={isGenerating || !aiPrompt.trim()}
                  type="submit"
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 bg-sky-600 rounded-lg hover:bg-sky-500 shadow-xl transition-all"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                </Button>
              </form>
            </Card>

            {/* AI Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-zinc-900/40 border-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase text-emerald-400">Online</span>
                </div>
                <p className="text-[10px] text-white/50">AI Code Architect is ready to analyze your code.</p>
              </Card>
              <Card className="bg-zinc-900/40 border-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span className="text-[8px] font-black uppercase text-sky-400">Avg Response</span>
                </div>
                <p className="text-[10px] text-white/50">~2.3 seconds for code synthesis.</p>
              </Card>
              <Card className="bg-zinc-900/40 border-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-3 h-3 text-amber-400" />
                  <span className="text-[8px] font-black uppercase text-amber-400">Context Aware</span>
                </div>
                <p className="text-[10px] text-white/50">Uses full project context for accurate suggestions.</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

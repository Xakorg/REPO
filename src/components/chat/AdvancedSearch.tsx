"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Filter,
  Clock,
  Bookmark,
  TrendingUp,
  Hash,
  User,
  Server,
  Globe,
  MessageSquare,
  Image,
  Music,
  Film,
  Star,
  Calendar,
  ChevronRight,
  Zap,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  Paperclip,
  Link,
  Pin,
  Heart,
  Smile,
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, orderBy, limit, Timestamp, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { navigateTo } from "@/lib/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SearchType = "messages" | "users" | "channels" | "servers";
type DateFilter = "today" | "thisWeek" | "thisMonth" | "custom" | "all";
type MessageTypeFilter = "all" | "text" | "image" | "audio" | "poll" | "sticker";

interface SearchResult {
  id: string;
  content?: string;
  sender?: string;
  senderName?: string;
  channelName?: string;
  serverName?: string;
  timestamp?: Timestamp;
  type?: string;
  hasReactions?: boolean;
  hasLinks?: boolean;
  isPinned?: boolean;
  photoURL?: string;
}

interface SearchPreset {
  id: string;
  name: string;
  query: string;
  searchType: SearchType;
  filters: SearchFilters;
  createdAt: Date;
}

interface SearchFilters {
  userFilter?: string;
  dateFilter: DateFilter;
  dateRange?: { from: Date; to: Date };
  messageType: MessageTypeFilter;
  serverFilter?: string;
  channelFilter?: string;
  onlyReactions: boolean;
  onlyPinned: boolean;
  onlyLinks: boolean;
}

interface AdvancedSearchProps {
  open: boolean;
  onClose: () => void;
}

export function AdvancedSearch({ open, onClose }: AdvancedSearchProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [queryText, setQueryText] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("messages");
  const [filters, setFilters] = useState<SearchFilters>({
    dateFilter: "all",
    messageType: "all",
    onlyReactions: false,
    onlyPinned: false,
    onlyLinks: false,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "presets" | "history">("search");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [savedPresets, setSavedPresets] = useState<SearchPreset[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Fetch saved search presets
  const presetsRef = user ? collection(firestore!, "users", user.uid, "searchPresets") : null;
  const presetsQuery = useMemoFirebase(
    () => (presetsRef ? query(presetsRef, orderBy("createdAt", "desc")) : null),
    [presetsRef]
  );
  const { data: presetsData } = useCollection<SearchPreset>(presetsQuery as any);

  // Fetch search history
  const historyRef = user ? collection(firestore!, "users", user.uid, "searchHistory") : null;
  const historyQuery = useMemoFirebase(
    () => (historyRef ? query(historyRef, orderBy("createdAt", "desc"), limit(20)) : null),
    [historyRef]
  );
  const { data: historyData } = useCollection<{ query: string; createdAt: Date }>(historyQuery as any);

  // Update local state from Firebase data
  useEffect(() => {
    if (presetsData) {
      setSavedPresets(presetsData);
    }
  }, [presetsData]);

  useEffect(() => {
    if (historyData) {
      setSearchHistory(historyData.map((h: any) => h.query));
    }
  }, [historyData]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQueryText("");
      setResults([]);
      setActiveTab("search");
    }
  }, [open]);

  // Fuzzy search helper
  const fuzzyMatch = useCallback((text: string, query: string): boolean => {
    if (!query) return true;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    if (lowerText.includes(lowerQuery)) return true;
    // Simple fuzzy: check if all query characters appear in order
    let queryIdx = 0;
    for (const char of lowerText) {
      if (queryIdx < lowerQuery.length && char === lowerQuery[queryIdx]) {
        queryIdx++;
      }
    }
    return queryIdx === lowerQuery.length;
  }, []);

  // Date range helper
  const getDateRangeFilter = useCallback(() => {
    const now = new Date();
    switch (filters.dateFilter) {
      case "today": {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(now) };
      }
      case "thisWeek": {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(now) };
      }
      case "thisMonth": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(now) };
      }
      case "custom": {
        if (filters.dateRange?.from && filters.dateRange?.to) {
          return {
            start: Timestamp.fromDate(filters.dateRange.from),
            end: Timestamp.fromDate(filters.dateRange.to),
          };
        }
        return null;
      }
      default:
        return null;
    }
  }, [filters.dateFilter, filters.dateRange]);

  // Build Firestore query based on search type and filters
  const builtQuery = useMemo(() => {
    if (!queryText.trim() || !firestore || !user) return null;

    const q = queryText.trim();
    const dateRange = getDateRangeFilter();

    switch (searchType) {
      case "messages": {
        let msgQuery: any = collection(firestore, "channels");
        // Build query for messages across channels
        // We query the messages subcollections
        const conditions: any[] = [];
        if (filters.messageType !== "all") {
          conditions.push(where("type", "==", filters.messageType));
        }
        if (filters.onlyReactions) {
          conditions.push(where("hasReactions", "==", true));
        }
        if (filters.onlyPinned) {
          conditions.push(where("isPinned", "==", true));
        }
        if (filters.onlyLinks) {
          conditions.push(where("hasLinks", "==", true));
        }
        if (filters.userFilter) {
          conditions.push(where("uid", "==", filters.userFilter));
        }
        if (dateRange) {
          conditions.push(where("timestamp", ">=", dateRange.start));
          conditions.push(where("timestamp", "<=", dateRange.end));
        }

        const baseQuery = conditions.length > 0
          ? query(collection(firestore, "messages"), ...conditions, orderBy("timestamp", "desc"), limit(50))
          : query(collection(firestore, "messages"), orderBy("timestamp", "desc"), limit(50));
        return baseQuery;
      }
      case "users": {
        return query(
          collection(firestore, "users"),
          where("displayName", ">=", q),
          orderBy("displayName"),
          limit(20)
        );
      }
      case "channels": {
        return query(
          collection(firestore, "channels"),
          where("name", ">=", q),
          orderBy("name"),
          limit(20)
        );
      }
      case "servers": {
        return query(
          collection(firestore, "servers"),
          where("name", ">=", q),
          orderBy("name"),
          limit(20)
        );
      }
      default:
        return null;
    }
  }, [queryText, searchType, filters, firestore, user, getDateRangeFilter]);

  const { data: rawResults } = useCollection(builtQuery as any);

  // Process and fuzzy-filter results
  useEffect(() => {
    if (!rawResults) {
      setResults([]);
      return;
    }

    const filtered = rawResults.filter((result: SearchResult) => {
      if (!queryText.trim()) return true;
      return fuzzyMatch(
        `${result.content || ""} ${result.sender || ""} ${result.senderName || ""} ${result.channelName || ""} ${result.serverName || ""}`,
        queryText
      );
    });

    setResults(filtered.slice(0, 50));
  }, [rawResults, queryText, fuzzyMatch]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (!queryText.trim()) return;
    setIsSearching(true);

    // Save to history
    if (user && firestore) {
      addDocumentNonBlocking(
        collection(firestore, "users", user.uid, "searchHistory"),
        { query: queryText.trim(), searchType, createdAt: serverTimestamp() }
      ).catch(() => {});
    }

    setTimeout(() => setIsSearching(false), 300);
  }, [queryText, searchType, user, firestore]);

  // Save preset
  const handleSavePreset = useCallback(() => {
    if (!user || !firestore || !queryText.trim()) return;

    const preset: SearchPreset = {
      id: `preset_${Date.now()}`,
      name: `Search: ${queryText.trim()}`,
      query: queryText.trim(),
      searchType,
      filters,
      createdAt: new Date(),
    };

    addDocumentNonBlocking(
      collection(firestore, "users", user.uid, "searchPresets"),
      preset
    ).then(() => {
      toast({ title: "Search preset saved!", description: "Quick access to this search." });
    }).catch(() => {
      toast({ title: "Error", description: "Failed to save preset.", variant: "destructive" });
    });
  }, [queryText, searchType, filters, user, firestore, toast]);

  // Delete preset
  const handleDeletePreset = useCallback(
    (presetId: string) => {
      if (!user || !firestore) return;
      // Direct delete using Firestore
      import("firebase/firestore").then(({ deleteDoc, doc }) => {
        deleteDoc(doc(firestore, "users", user.uid, "searchPresets", presetId)).catch(() => {});
      });
      setSavedPresets((prev) => prev.filter((p) => p.id !== presetId));
      toast({ title: "Preset deleted" });
    },
    [user, firestore, toast]
  );

  // Navigate to result
  const handleNavigate = useCallback(
    (result: SearchResult) => {
      let path = "/chat";
      if (result.channelName) {
        path = `/chat/channel/${result.channelName}`;
      } else if (result.serverName) {
        path = `/chat/server/${result.serverName}`;
      }
      navigateTo(path, {});
      onClose();
    },
    [onClose]
  );

  // Result type icon
  const getResultIcon = (type?: string) => {
    switch (type) {
      case "image": return <Image className="w-4 h-4 text-green-400" />;
      case "audio": return <Music className="w-4 h-4 text-blue-400" />;
      case "poll": return <Star className="w-4 h-4 text-amber-400" />;
      case "sticker": return <Smile className="w-4 h-4 text-pink-400" />;
      default: return <MessageSquare className="w-4 h-4 text-zinc-400" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (ts?: Timestamp) => {
    if (!ts) return "";
    try {
      return ts.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Get date filter label
  const getDateFilterLabel = () => {
    switch (filters.dateFilter) {
      case "today": return "Today";
      case "thisWeek": return "This Week";
      case "thisMonth": return "This Month";
      case "custom": return "Custom Range";
      default: return "All Time";
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-2xl bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-panel"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <Input
                ref={inputRef}
                type="text"
                placeholder={`Search ${searchType}...`}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-base placeholder:text-zinc-500 px-0"
              />
              <Badge variant="secondary" className="text-[10px] text-zinc-400 border-white/10">
                {results.length} results
              </Badge>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Type Tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-white/5">
              {[
                { type: "messages" as SearchType, icon: MessageSquare, label: "Messages" },
                { type: "users" as SearchType, icon: User, label: "Users" },
                { type: "channels" as SearchType, icon: Hash, label: "Channels" },
                { type: "servers" as SearchType, icon: Server, label: "Servers" },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2",
                    searchType === type
                      ? "text-primary border-primary bg-white/5"
                      : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <ScrollArea className="h-[480px]">
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {/* Search Tab */}
                  {activeTab === "search" && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {/* Filters Section */}
                      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5" /> Filters
                          </h3>
                          <button
                            onClick={() => setFilters({
                              dateFilter: "all",
                              messageType: "all",
                              onlyReactions: false,
                              onlyPinned: false,
                              onlyLinks: false,
                            })}
                            className="text-[10px] text-primary hover:underline"
                          >
                            Reset all
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Message Type Filter */}
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Type</label>
                            <Select
                              value={filters.messageType}
                              onValueChange={(v: MessageTypeFilter) =>
                                setFilters((f) => ({ ...f, messageType: v }))
                              }
                            >
                              <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  { value: "all", label: "All Types" },
                                  { value: "text", label: "Text" },
                                  { value: "image", label: "Image" },
                                  { value: "audio", label: "Audio" },
                                  { value: "poll", label: "Poll" },
                                  { value: "sticker", label: "Sticker" },
                                ].map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Date Filter */}
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Date</label>
                            <Select
                              value={filters.dateFilter}
                              onValueChange={(v: DateFilter) =>
                                setFilters((f) => ({ ...f, dateFilter: v }))
                              }
                            >
                              <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  { value: "all", label: "All Time" },
                                  { value: "today", label: "Today" },
                                  { value: "thisWeek", label: "This Week" },
                                  { value: "thisMonth", label: "This Month" },
                                  { value: "custom", label: "Custom Range" },
                                ].map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Custom Date Range Picker */}
                        {filters.dateFilter === "custom" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="flex items-center gap-2"
                          >
                            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="h-8 bg-white/5 border-white/10 text-xs flex-1 justify-start">
                                  <Calendar className="w-3.5 h-3.5 mr-2 text-zinc-400" />
                                  {filters.dateRange?.from
                                    ? filters.dateRange.to
                                      ? `${filters.dateRange.from.toLocaleDateString()} - ${filters.dateRange.to.toLocaleDateString()}`
                                      : filters.dateRange.from.toLocaleDateString()
                                    : "Pick date range"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="bg-zinc-950 border-white/10 p-4" align="start">
                                <CalendarComponent
                                  mode="range"
                                  selected={
                                    filters.dateRange
                                      ? { from: filters.dateRange.from, to: filters.dateRange.to }
                                      : undefined
                                  }
                                  onSelect={(range) => {
                                    setFilters((f) => ({
                                      ...f,
                                      dateRange: range
                                        ? { from: range.from || new Date(), to: range.to || new Date() }
                                        : undefined,
                                    }));
                                  }}
                                  numberOfMonths={1}
                                />
                              </PopoverContent>
                            </Popover>
                          </motion.div>
                        )}

                        {/* Toggle Filters */}
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: "onlyReactions" as const, label: "Reactions", icon: Heart, color: "pink" },
                            { key: "onlyPinned" as const, label: "Pinned", icon: Pin, color: "amber" },
                            { key: "onlyLinks" as const, label: "Links", icon: Link, color: "blue" },
                          ].map(({ key, label, icon: Icon, color }) => (
                            <button
                              key={key}
                              onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                                filters[key]
                                  ? `bg-${color}-500/20 border-${color}-500/50 text-${color}-400`
                                  : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300"
                              )}
                            >
                              <Icon className="w-3 h-3" />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Results */}
                      {queryText.trim() && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                              <TrendingUp className="w-3.5 h-3.5" /> Results
                              <span className="text-zinc-500 font-normal text-[10px]">({results.length})</span>
                            </h3>
                          </div>

                          {results.length === 0 ? (
                            <div className="text-center py-8">
                              <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                              <p className="text-sm text-zinc-500">No results found</p>
                              <p className="text-xs text-zinc-600 mt-1">
                                {isSearching ? "Searching..." : "Try different keywords or filters"}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {results.map((result, idx) => (
                                <motion.div
                                  key={result.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.03 }}
                                  onClick={() => handleNavigate(result)}
                                  className="group flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 cursor-pointer transition-all"
                                >
                                  <div className="mt-0.5 shrink-0">
                                    {searchType === "messages" ? (
                                      getResultIcon(result.type)
                                    ) : searchType === "users" ? (
                                      <User className="w-4 h-4 text-primary" />
                                    ) : searchType === "channels" ? (
                                      <Hash className="w-4 h-4 text-cyan-400" />
                                    ) : (
                                      <Server className="w-4 h-4 text-amber-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-sm font-medium text-white group-hover:text-primary transition-colors truncate">
                                        {result.senderName || result.sender || result.channelName || result.serverName || "Unknown"}
                                      </span>
                                      {result.hasReactions && (
                                        <span className="text-[9px] text-pink-400 flex items-center gap-0.5">
                                          <Heart className="w-2.5 h-2.5" />
                                        </span>
                                      )}
                                      {result.isPinned && (
                                        <Badge variant="secondary" className="text-[9px] h-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
                                          <Pin className="w-2 h-2 mr-0.5" /> Pinned
                                        </Badge>
                                      )}
                                    </div>
                                    {result.content && (
                                      <p className="text-xs text-zinc-400 truncate">{result.content}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {formatTimestamp(result.timestamp)}
                                      </span>
                                      {result.channelName && (
                                        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                          <Hash className="w-2.5 h-2.5" />
                                          {result.channelName}
                                        </span>
                                      )}
                                      {result.serverName && (
                                        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                          <Server className="w-2.5 h-2.5" />
                                          {result.serverName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors shrink-0 mt-1" />
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {!queryText.trim() && (
                        <div className="text-center py-12">
                          <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                          <p className="text-sm text-zinc-500">Start typing to search</p>
                          <p className="text-xs text-zinc-600 mt-1">
                            Search messages, users, channels, or servers
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Presets Tab */}
                  {activeTab === "presets" && (
                    <motion.div
                      key="presets"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <Bookmark className="w-3.5 h-3.5" /> Saved Searches
                        </h3>
                        <button
                          onClick={handleSavePreset}
                          disabled={!queryText.trim()}
                          className="flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[11px] font-medium hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          <Plus className="w-3 h-3" /> Save Current
                        </button>
                      </div>

                      {savedPresets.length === 0 ? (
                        <div className="text-center py-8">
                          <Bookmark className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                          <p className="text-sm text-zinc-500">No saved searches yet</p>
                          <p className="text-xs text-zinc-600 mt-1">
                            Save your favorite searches for quick access
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {savedPresets.map((preset) => (
                            <motion.div
                              key={preset.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 cursor-pointer transition-all"
                              onClick={() => {
                                setQueryText(preset.query);
                                setSearchType(preset.searchType);
                                setFilters(preset.filters);
                                setActiveTab("search");
                                handleSearch();
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white truncate">{preset.name}</span>
                                  <Badge variant="secondary" className="text-[9px] h-4 border-white/10">
                                    {preset.searchType}
                                  </Badge>
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">{preset.query}</div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePreset(preset.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* History Tab */}
                  {activeTab === "history" && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> Recent Searches
                        </h3>
                        {searchHistory.length > 0 && (
                          <button
                            onClick={() => setSearchHistory([])}
                            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Clear
                          </button>
                        )}
                      </div>

                      {searchHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                          <p className="text-sm text-zinc-500">No search history</p>
                          <p className="text-xs text-zinc-600 mt-1">
                            Your recent searches appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {searchHistory.map((entry, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => {
                                setQueryText(entry);
                                setActiveTab("search");
                                handleSearch();
                              }}
                              className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 cursor-pointer transition-all"
                            >
                              <Clock className="w-4 h-4 text-zinc-600 shrink-0" />
                              <span className="text-sm text-zinc-300 group-hover:text-white transition-colors flex-1 truncate">
                                {entry}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-primary transition-colors" />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("search")}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                    activeTab === "search" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Search className="w-3 h-3 inline mr-1" /> Search
                </button>
                <button
                  onClick={() => setActiveTab("presets")}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                    activeTab === "presets" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Bookmark className="w-3 h-3 inline mr-1" /> Presets ({savedPresets.length})
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                    activeTab === "history" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Clock className="w-3 h-3 inline mr-1" /> History
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600">Ctrl+K to search</span>
                <button
                  onClick={() => {
                    handleSearch();
                    setActiveTab("presets");
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[11px] font-medium hover:bg-primary/30 transition-all"
                >
                  <Zap className="w-3 h-3" /> Quick Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

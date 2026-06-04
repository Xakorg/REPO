
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  X,
  Sparkles,
  Loader2,
  BadgeCheck,
  Globe,
  Settings,
  MoreVertical,
  ExternalLink
} from "lucide-react";
import { aiPoweredWebSearch } from "@/ai/flows/ai-powered-web-search-flow";
import defaultSites from '@/lib/defaultSites';
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || "";
  
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{title:string, thumb?:string, page?:string}>>([]);
  const firestore = useFirestore();

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const target = searchQuery || queryInput;
    if (!target.trim()) return;

    // Decouple UI state
    setAiResult(null);
    setIsAiLoading(true);
    
    // Traditional link results will load via the firestore query below
    router.push(`/search?q=${encodeURIComponent(target.trim())}`, { scroll: false });

    try {
      const response = await aiPoweredWebSearch({ query: target });
      if (response && response.answer) {
        setAiResult(response.answer);
      }
      // fetch images from our server-side Wikimedia proxy
      try {
        const imgRes = await fetch(`/api/search-images?q=${encodeURIComponent(target)}`);
        if (imgRes.ok) {
          const json = await imgRes.json();
          setImages(json.images || []);
        }
      } catch (e) {
        console.error('Image fetch failed', e);
        setImages([]);
      }
    } catch (err) {
      console.error("AI Search Error:", err);
    } finally {
      setIsAiLoading(false);
    }
  }, [queryInput, router]);

  useEffect(() => {
    if (initialQuery) {
      setQueryInput(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  // Increase indexedSites fetch for larger result sets (client-side pagination recommended)
  const indexQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "indexedSites"), limit(10000));
  }, [firestore]);

  const { data: indexedSites, isLoading: isIndexLoading } = useCollection(indexQuery);
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(200));
  }, [firestore]);
  const { data: userDocs } = useCollection(usersQuery);

  // Fetch a large set of images for search results (use seeding script to populate)
  const imagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'searchImages'), limit(5000));
  }, [firestore]);
  const { data: searchImages } = useCollection(imagesQuery);

  // Always include defaultSites alongside Firestore indexedSites, but only show
  // results that match the user's query. Deduplicate by URL and cap at 100.
  const combinedSites = (() => {
    const docs = indexedSites || [];
    const docSites = (docs || []).map((d: any) => ({
      url: d.url,
      title: d.title || d.url,
      description: d.description || '',
    }));
    const merged = [...docSites, ...defaultSites];
    const seen = new Set<string>();
    const dedup: any[] = [];
    for (const s of merged) {
      if (!s?.url) continue;
      const key = s.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(s);
      if (dedup.length >= 100) break;
    }
    return dedup;
  })();

  // Group sites by host for Google-like grouped results
  const groupedSites = (() => {
    const groups: Record<string, any[]> = {};
    for (const s of combinedSites) {
      try {
        const u = new URL(s.url);
        const host = u.hostname.replace(/^www\./, '');
        groups[host] = groups[host] || [];
        groups[host].push(s);
      } catch (e) {
        groups['misc'] = groups['misc'] || [];
        groups['misc'].push(s);
      }
    }
    return groups;
  })();

  const filteredGroupedSites = (queryInput || '').trim()
    ? Object.fromEntries(Object.entries(groupedSites).map(([host, sites]) => [host, sites.filter((s: any) => {
        const q = (queryInput || '').toLowerCase();
        return (s.title && s.title.toLowerCase().includes(q)) || (s.url && s.url.toLowerCase().includes(q)) || (s.description && s.description.toLowerCase().includes(q));
    })]).filter(([,sites]) => sites.length > 0))
    : groupedSites;

  // Map images by a simple host/key heuristic so results can show multiple images grouped
  const imagesByKey = (() => {
    const map: Record<string, any[]> = {};
    (searchImages || []).forEach((img: any) => {
      const key = (img.source || 'pics').toString();
      map[key] = map[key] || [];
      map[key].push(img);
    });
    return map;
  })();

  const filteredSites = (queryInput || '').trim()
    ? combinedSites.filter((s: any) => {
        const q = (queryInput || '').toLowerCase();
        return (
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.url && s.url.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
        );
      }).slice(0, 100)
    : [];

  const matchedUsers = (() => {
    if (!userDocs || !(queryInput || '').trim()) return [];
    const q = (queryInput || '').toLowerCase();
    return userDocs.filter((u: any) => {
      const name = (u.displayName || u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      return name.includes(q) || email.includes(q) || username.includes(q);
    }).slice(0, 20);
  })();

  return (
    <div className="min-h-screen animate-fade-in flex flex-col relative bg-white">
      {/* Google Style Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-8 py-4 flex flex-col md:flex-row items-center gap-6">
        <div 
          onClick={() => router.push('/')} 
          className="cursor-pointer flex items-center gap-2 pr-6 md:border-r border-zinc-200"
        >
          <span className="text-3xl font-black tracking-tighter uppercase italic text-zinc-900">Xakteir</span>
          <BadgeCheck className="w-6 h-6 text-blue-500 fill-current" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex-1 max-w-3xl relative group">
          <Input 
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search anything..." 
            className="h-11 w-full bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-md focus:border-blue-500 focus:shadow-md rounded-full pl-11 pr-12 text-base transition-all outline-none text-zinc-900"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          {queryInput && (
            <button 
              type="button" 
              onClick={() => setQueryInput("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="w-5 h-5 text-zinc-400" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">U</div>
        </div>
      </div>

      <div className="flex-1 bg-white">
        <main className="max-w-5xl px-8 md:px-32 py-8 space-y-10 text-zinc-900">
          {/* AI Quick Response Section */}
          {(isAiLoading || aiResult) && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-500 max-w-3xl">
              <div className="flex items-center gap-2 text-zinc-400">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">AI Quick Response</span>
              </div>
              <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl relative overflow-hidden shadow-sm flex gap-6">
                {isAiLoading ? (
                  <div className="flex items-center gap-4 italic text-zinc-400 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" /> Researching answer...
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="text-base leading-relaxed text-zinc-800 font-medium italic whitespace-pre-wrap">{aiResult}</p>
                    {images?.[0]?.thumb && (
                      <div className="mt-4 flex items-center gap-4">
                        <img src={images[0].thumb} alt={images[0].title} className="w-28 h-28 object-cover rounded-lg shadow-md" />
                        <div>
                          <div className="text-sm font-bold">{images[0].title}</div>
                          <a href={images[0].page} target="_blank" rel="noreferrer" className="text-xs text-blue-600">Source</a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Image gallery */}
                {images && images.length > 1 && (
                  <div className="w-48 grid grid-cols-2 gap-2">
                    {images.slice(1,5).map((img, idx) => (
                      <a key={idx} href={img.page} target="_blank" rel="noreferrer" className="block">
                        <img src={img.thumb} alt={img.title} className="w-full h-20 object-cover rounded-md" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Result List */}
          <div className="space-y-10 pb-20 max-w-3xl">
            {matchedUsers.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500">People</h3>
                {matchedUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-50">
                    <img src={u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-zinc-900">{u.displayName || u.name || 'User'}</div>
                      <div className="text-xs text-zinc-500">{u.username || u.email || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isIndexLoading ? (
              <div className="space-y-10">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="h-3 bg-zinc-100 rounded w-40" />
                    <div className="h-5 bg-zinc-100 rounded w-80" />
                    <div className="h-3 bg-zinc-100 rounded w-96" />
                  </div>
                ))}
              </div>
            ) : Object.keys(filteredGroupedSites).length ? (
              Object.entries(filteredGroupedSites).map(([host, sites]) => (
                <div key={host} className="group animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1 justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">{host[0]}</div>
                        <span className="text-sm font-bold text-zinc-700">{host}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        {/* quick grouped links heuristic for common hosts */}
                        {host.includes('google') && (
                          <>
                            <a className="px-2 py-1 hover:underline" href={`https://www.${host}/drive`} target="_blank" rel="noreferrer">Drive</a>
                            <a className="px-2 py-1 hover:underline" href={`https://www.${host}/search`} target="_blank" rel="noreferrer">Search</a>
                            <a className="px-2 py-1 hover:underline" href={`https://www.${host}/maps`} target="_blank" rel="noreferrer">Maps</a>
                          </>
                        )}
                        {host.includes('wikipedia') && (
                          <a className="px-2 py-1 hover:underline" href={`https://${host}`} target="_blank" rel="noreferrer">Wiki</a>
                        )}
                      </div>
                    </div>

                    {/* Primary site preview (first site) */}
                    <a href={sites[0].url} target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-blue-700 group-hover:underline leading-tight">
                      {sites[0].title}
                    </a>
                    <p className="text-sm text-zinc-600 leading-relaxed mt-1 italic opacity-80">{sites[0].description}</p>

                    {/* Additional grouped links */}
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {sites.slice(1,7).map((s: any, idx: number) => (
                        <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="text-sm text-zinc-700 hover:underline">{s.title}</a>
                      ))}
                    </div>

                    {/* Show related images for this host if available */}
                    {imagesByKey[host] && imagesByKey[host].length > 0 && (
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {imagesByKey[host].slice(0,8).map((img: any, ii: number) => (
                          <a key={ii} href={img.page || img.source || '#'} target="_blank" rel="noreferrer" className="block">
                            <img src={img.thumb} alt={img.title} className="w-full h-20 object-cover rounded-md" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : !isAiLoading && (
              <div className="py-24 text-center opacity-30 space-y-6">
                <Globe className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
                <p className="text-sm font-black uppercase tracking-[0.4em] text-zinc-400">No results in index</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-zinc-200" /></div>}>
      <SearchContent />
    </Suspense>
  );
}

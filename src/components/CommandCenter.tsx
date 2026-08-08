"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  LayoutGrid, 
  Users, 
  FileText, 
  Gamepad2, 
  History, 
  ArrowRight,
  Zap,
  Command,
  Plus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { navigateTo } from '@/lib/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';

export function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const firestore = useFirestore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQueryInput("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle global custom events from header or buttons to open command palette
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('open-command-center', handleToggle);
    return () => window.removeEventListener('open-command-center', handleToggle);
  }, []);

  // Fetch Firestore users for search
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), limit(10));
  }, [firestore]);
  const { data: usersData } = useCollection(usersQuery);

  const staticActions = [
    { title: 'Open Xakteir Suite', type: 'App', icon: LayoutGrid, href: '/suite' },
    { title: 'Play Games Library', type: 'Games', icon: Gamepad2, href: '/games' },
    { title: 'Create New Document', type: 'Write', icon: FileText, href: '/write' },
    { title: 'Browse Dev Centre', type: 'Dev', icon: Zap, href: '/dev-centre' },
  ];

  const results = useMemo(() => {
    if (!queryInput.trim()) return staticActions;
    
    const term = queryInput.toLowerCase();
    const actions = staticActions.filter(a => a.title.toLowerCase().includes(term) || a.type.toLowerCase().includes(term));
    const users = (usersData || []).filter(u => 
      (u.username && u.username.toLowerCase().includes(term)) || 
      (u.displayName && u.displayName.toLowerCase().includes(term))
    ).map(u => ({
      title: u.displayName || u.username || 'User',
      type: 'User Profile',
      icon: Users,
      href: `/user/${u.id}`
    }));

    return [...actions, ...users];
  }, [queryInput, usersData]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [queryInput]);

  useEffect(() => {
    const handleNavigationKeys = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleNavigate(results[selectedIndex].href);
        }
      }
    };
    window.addEventListener('keydown', handleNavigationKeys);
    return () => window.removeEventListener('keydown', handleNavigationKeys);
  }, [isOpen, results, selectedIndex]);

  const handleNavigate = (href: string) => {
    navigateTo(href, router);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-start justify-center p-6 pt-[15vh] bg-black/80 backdrop-blur-md command-center-overlay">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      
      <Card className="w-full max-w-2xl glass-card rounded-[3rem] border-4 border-white/10 shadow-[0_50px_150px_rgba(0,0,0,0.9)] overflow-hidden relative z-10 command-center-content bg-[#0a0a15]">
        <div className="p-6 border-b-2 border-white/5 flex items-center gap-6 bg-black/40">
          <Search className="w-6 h-6 text-primary" />
          <Input 
            ref={inputRef}
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Type to search anything in the Hub..." 
            className="flex-1 bg-transparent border-none text-2xl font-bold italic focus-visible:ring-0 outline-none placeholder:text-white/10"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
             <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ESC</span>
          </div>
        </div>

        <ScrollArea className="max-h-[500px]">
           <div className="p-6 space-y-10">
              <div className="space-y-4">
                 <p className="px-4 text-[9px] font-black uppercase tracking-[0.4em] text-primary italic">Global Results</p>
                 <div className="space-y-2">
                    {results.length > 0 ? results.map((res: any, i: number) => (
                      <button 
                        key={i}
                        onClick={() => handleNavigate(res.href)}
                        className={cn(
                          "w-full p-6 rounded-2xl flex items-center justify-between group transition-all",
                          i === selectedIndex ? "bg-white/10" : "hover:bg-white/5"
                        )}
                      >
                         <div className="flex items-center gap-6">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                              i === selectedIndex ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10 group-hover:border-primary"
                            )}>
                               <res.icon className={cn(
                                 "w-6 h-6 transition-colors",
                                 i === selectedIndex ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                               )} />
                            </div>
                            <div className="text-left">
                               <h4 className={cn(
                                 "text-xl font-black uppercase italic transition-colors",
                                 i === selectedIndex ? "text-white" : "group-hover:text-white"
                               )}>{res.name}</h4>
                               <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{res.type}</p>
                            </div>
                         </div>
                         <ArrowRight className={cn(
                           "w-5 h-5 text-primary transition-all",
                           i === selectedIndex ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
                         )} />
                      </button>
                    )) : (
                      <div className="py-20 text-center opacity-20 uppercase font-black tracking-widest italic">
                         No items found
                      </div>
                    )}
                 </div>
              </div>

              <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                 <Button variant="ghost" className="h-12 rounded-xl justify-start px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white">
                    <Plus className="w-4 h-4 mr-4" /> New Document
                 </Button>
                 <Button variant="ghost" className="h-12 rounded-xl justify-start px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white">
                    <Plus className="w-4 h-4 mr-4" /> New Game
                 </Button>
              </div>
           </div>
        </ScrollArea>
        
        <footer className="h-12 bg-black/60 border-t border-white/5 flex items-center px-8 justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[8px] font-black uppercase text-muted-foreground">
                 <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center border border-white/10">↑</div>
                 <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center border border-white/10">↓</div>
                 <span>to navigate</span>
              </div>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase text-muted-foreground">
                 <div className="w-10 h-5 rounded bg-white/5 flex items-center justify-center border border-white/10">ENTER</div>
                 <span>to open</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">XakSearch v4.2</span>
           </div>
        </footer>
      </Card>
    </div>
  );
}

export function triggerCommandCenter() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
}

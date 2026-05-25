"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  FileJson, 
  Plus, 
  Layers, 
  Loader2, 
  Trash2, 
  File,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
  Save,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, serverTimestamp, doc } from "firebase/firestore";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

type SuiteApp = 'write' | 'sheet' | 'slide' | 'form';

export default function XakteirSuitePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeApp, setActiveApp] = useState<SuiteApp>('write');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch Documents
  const docsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "suite_docs"),
      orderBy("updatedAt", "desc"),
      limit(100)
    );
  }, [firestore, user]);

  const { data: myDocs, isLoading: loadingDocs } = useCollection(docsQuery);

  // Active Document Data
  const activeDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !selectedDocId) return null;
    return doc(firestore, "users", user.uid, "suite_docs", selectedDocId);
  }, [firestore, user, selectedDocId]);

  const { data: activeDoc } = useDoc(activeDocRef);

  useEffect(() => {
    if (myDocs?.length && !selectedDocId) {
      setSelectedDocId(myDocs[0].id);
    }
  }, [myDocs, selectedDocId]);

  const handleCreateDoc = async () => {
    if (!user || !firestore) return;
    try {
      const newDoc = await addDocumentNonBlocking(collection(firestore, "users", user.uid, "suite_docs"), {
        title: "Untitled Document",
        content: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      if (newDoc) setSelectedDocId(newDoc.id);
      toast({ title: "Document created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Creation error" });
    }
  };

  const handleUpdateContent = (content: string) => {
    if (!activeDocRef) return;
    setIsSaving(true);
    updateDocumentNonBlocking(activeDocRef, {
      content,
      updatedAt: serverTimestamp()
    });
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleUpdateTitle = (title: string) => {
    if (!activeDocRef) return;
    updateDocumentNonBlocking(activeDocRef, {
      title,
      updatedAt: serverTimestamp()
    });
  };

  const handleDeleteDoc = async (id: string) => {
    if (!user || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "users", user.uid, "suite_docs", id));
    if (selectedDocId === id) setSelectedDocId(null);
    toast({ title: "Document deleted" });
  };

  const filteredDocs = myDocs?.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col bg-background text-foreground animate-fade-in overflow-y-auto">
        <section className="flex-1 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden py-32">
          <div className="absolute inset-0 arcade-grid opacity-10" />
          <div className="relative z-10 space-y-12 max-w-5xl">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs">
              Professional Tools
            </Badge>
            <div className="space-y-6">
              <h1 className="text-6xl md:text-[8rem] font-black tracking-tighter uppercase italic leading-[0.9] text-white">
                Work <br />
                <span className="text-primary flex items-center justify-center gap-4">Better</span>
              </h1>
              <p className="text-xl md:text-3xl text-muted-foreground font-bold uppercase tracking-widest max-w-3xl mx-auto italic opacity-60">
                A simple and powerful space for all your documents.
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <Link href="/auth">
                <Button className="h-20 px-16 bg-primary hover:bg-primary/90 text-black rounded-[2rem] font-black text-xl uppercase italic shadow-2xl transition-all active:scale-95">
                  Start Building
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-background text-foreground animate-fade-in overflow-hidden relative">
      <header className="h-16 border-b border-white/5 bg-card/80 backdrop-blur-xl px-8 flex items-center justify-between shadow-2xl relative z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Suite</h2>
          </div>
          <nav className="flex bg-black/40 p-1 rounded-xl border border-white/10 ml-4">
            {[
              { id: 'write', icon: FileText, label: 'Write' },
              { id: 'sheet', icon: FileSpreadsheet, label: 'Sheets' },
              { id: 'slide', icon: Presentation, label: 'Slides' },
              { id: 'form', icon: FileJson, label: 'Forms' },
            ].map(app => (
              <button 
                key={app.id} 
                onClick={() => setActiveApp(app.id as SuiteApp)}
                className={cn(
                  "px-5 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3",
                  activeApp === app.id ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:bg-white/5"
                )}
              >
                <app.icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{app.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
            {isSaving ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-3 h-3" /> Last saved: {activeDoc?.updatedAt ? new Date(activeDoc.updatedAt.seconds * 1000).toLocaleTimeString() : '...'} </>
            )}
          </div>
          <Button onClick={handleCreateDoc} className="bg-primary hover:bg-primary/90 h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl">
             <Plus className="w-4 h-4 mr-2" /> New Doc
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-white/5 bg-zinc-950 flex flex-col z-10 shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white italic">Directory</h3>
              <Badge variant="outline" className="text-[8px] border-white/10 text-primary">{myDocs?.length || 0}</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..." 
                className="h-8 bg-black/40 border-white/5 pl-8 text-[10px] font-bold" 
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {loadingDocs ? (
                <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary opacity-20" /></div>
              ) : filteredDocs.length === 0 ? (
                <div className="py-10 text-center text-[10px] font-black uppercase text-white/20 italic">No items found</div>
              ) : (
                filteredDocs.map(d => (
                  <div 
                    key={d.id} 
                    onClick={() => setSelectedDocId(d.id)}
                    className={cn(
                      "p-4 rounded-2xl flex items-center justify-between group cursor-pointer transition-all border-2",
                      selectedDocId === d.id ? "bg-primary/10 border-primary/20 text-primary shadow-lg" : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <File className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] font-black uppercase truncate italic">{d.title}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDoc(d.id); }} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 transition-all p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Editor */}
        <main className="flex-1 bg-[#0a0a1f] flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 arcade-grid opacity-5 pointer-events-none" />
          
          <div className="h-12 border-b border-white/5 bg-zinc-900/50 flex items-center px-10 gap-8 z-20">
            <div className="flex items-center gap-2 pr-6 border-r border-white/10">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5"><Bold className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5"><Italic className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5"><Underline className="w-4 h-4" /></Button>
            </div>
            <div className="flex items-center gap-2 pr-6 border-r border-white/10">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5"><AlignLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5"><AlignCenter className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5"><AlignRight className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center p-8">
            <Card className={cn(
              "w-full max-w-5xl rounded-[3.5rem] border-4 border-white/10 shadow-2xl min-h-[1000px] relative transition-all duration-700 flex flex-col",
              activeApp === 'sheet' ? "bg-zinc-950" : "bg-white text-zinc-900 shadow-[0_50px_100px_rgba(0,0,0,0.4)]"
            )}>
              {activeApp === 'write' && (
                <div className="flex-1 flex flex-col p-12 md:p-20 space-y-10 animate-in fade-in slide-in-from-bottom-4">
                  {activeDoc ? (
                    <>
                      <Input 
                        value={activeDoc.title}
                        onChange={(e) => handleUpdateTitle(e.target.value)}
                        placeholder="Untitled Document" 
                        className="bg-transparent border-none text-4xl md:text-6xl font-black uppercase italic p-0 h-auto focus-visible:ring-0 text-current tracking-tighter"
                      />
                      <div className="h-1 bg-zinc-100 rounded-full w-full" />
                      <textarea 
                        value={activeDoc.content}
                        onChange={(e) => handleUpdateContent(e.target.value)}
                        placeholder="Start typing..." 
                        className="flex-1 bg-transparent border-none text-xl md:text-2xl font-medium leading-relaxed italic placeholder:opacity-20 outline-none resize-none custom-scrollbar"
                      />
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                      <FileText className="w-32 h-32 mb-8" />
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter text-center">Select a document</h2>
                      <Button onClick={handleCreateDoc} variant="link" className="text-current font-black uppercase mt-4">Create New Page</Button>
                    </div>
                  )}
                </div>
              )}
              
              {activeApp === 'sheet' && (
                <div className="flex-1 flex flex-col p-10 text-white animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Sheets</h1>
                    <Badge variant="outline" className="border-white/10 text-[8px] font-black">ACTIVE</Badge>
                  </div>
                  <div className="grid grid-cols-10 gap-0.5 bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner">
                    <div className="contents">
                      <div className="h-8 bg-zinc-900 border-b border-white/10 flex items-center justify-center text-[10px] font-black opacity-40">#</div>
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-8 bg-zinc-900 border-b border-r border-white/10 flex items-center justify-center text-[10px] font-black opacity-40">
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    {Array.from({ length: 150 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="aspect-[4/1] bg-black/20 border-b border-r border-white/5 hover:bg-primary/10 transition-colors cursor-text flex items-center px-4"
                      />
                    ))}
                  </div>
                </div>
              )}

              {(activeApp === 'slide' || activeApp === 'form') && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-20 text-white">
                  <Presentation className="w-32 h-32 mb-8" />
                  <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Under Construction</h2>
                  <p className="text-sm font-bold uppercase tracking-widest mt-4">System coming soon</p>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
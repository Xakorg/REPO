"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Save, Sparkles, Loader2, Book, StickyNote, Library, Settings, Search, ChevronRight,
  Bold, Italic, Underline, Link, Tags, Users, WifiOff, CheckSquare, Image as ImageIcon, Mic, PenTool, Globe, FileText, Table, Code, Sigma, Download, Presentation, CalendarDays, CheckCircle2, Lock, History, Maximize2, ListTree, Moon, Palette, Youtube, Bell, MoreHorizontal, FileImage, LayoutTemplate, Type, FileUp, Hash, Folder
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

const NOTEBOOKS = [
  { id: 'main', title: 'Main Library', icon: Book },
  { id: 'creative', title: 'Creative', icon: Sparkles },
];

export default function XakNotePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeNotebook, setActiveNotebook] = useState(NOTEBOOKS[0]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI Mockup States
  const [focusMode, setFocusMode] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "notes"),
      orderBy("updatedAt", "desc"),
      limit(100)
    );
  }, [firestore, user]);

  const { data: dbNotes, isLoading } = useCollection(notesQuery);
  const filteredNotes = dbNotes?.filter(n => n.notebookId === activeNotebook.id && (!searchQuery || (n.title || "").toLowerCase().includes(searchQuery.toLowerCase()))) || [];

  useEffect(() => {
    if (filteredNotes.length > 0 && !selectedNote && !searchQuery) {
      setSelectedNote(filteredNotes[0]);
    }
  }, [filteredNotes, selectedNote, searchQuery]);

  const handleSave = async () => {
    if (!firestore || !user || !selectedNote) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid, "notes", selectedNote.id), {
        title: selectedNote.title,
        content: selectedNote.content,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Saved", description: "Changes synced." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNew = async () => {
    if (!firestore || !user) return;
    try {
      await addDoc(collection(firestore, "users", user.uid, "notes"), {
        notebookId: activeNotebook.id,
        title: "Untitled Note",
        content: "",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      toast({ title: "Page Created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !user) return;
    await deleteDoc(doc(firestore, "users", user.uid, "notes", id));
    if (selectedNote?.id === id) setSelectedNote(null);
    toast({ title: "Deleted" });
  };

  if (!user) return <div className="p-32 text-center font-black uppercase italic">Sign in to access Notes.</div>;

  const IconButton = ({ icon: Icon, title, onClick, active, className }: any) => (
    <button title={title} onClick={onClick} className={cn("p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground shrink-0", active && "bg-primary/20 text-primary hover:text-primary hover:bg-primary/30", className)}>
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="fixed inset-0 top-20 z-[50] bg-background flex animate-fade-in text-foreground overflow-hidden">
      {/* LEFT SIDEBAR - Hides in focus mode */}
      {!focusMode && (
        <div className="w-64 border-r border-white/5 bg-zinc-950 flex flex-col">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between h-16">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Library className="w-3.5 h-3.5" /> Workspace
            </h3>
            <IconButton icon={Settings} title="Settings" />
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-2 mb-2">Folders</div>
                {NOTEBOOKS.map(nb => (
                  <button 
                    key={nb.id}
                    onClick={() => setActiveNotebook(nb)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border border-transparent",
                      activeNotebook.id === nb.id ? "bg-primary/10 border-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    <nb.icon className="w-4 h-4" />
                    <span className="text-xs font-black uppercase truncate">{nb.title}</span>
                  </button>
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-2 mb-2">Views</div>
                <button className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-muted-foreground hover:bg-white/5">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs font-black uppercase truncate">Calendar</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-muted-foreground hover:bg-white/5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-black uppercase truncate">Tasks</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-2 mb-2">Tags</div>
                <div className="flex flex-wrap gap-2 px-2">
                  <span className="text-[10px] px-2 py-1 bg-white/5 rounded-full flex items-center gap-1"><Hash className="w-3 h-3"/> idea</span>
                  <span className="text-[10px] px-2 py-1 bg-white/5 rounded-full flex items-center gap-1"><Hash className="w-3 h-3"/> project</span>
                  <span className="text-[10px] px-2 py-1 bg-white/5 rounded-full flex items-center gap-1"><Hash className="w-3 h-3"/> draft</span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* NOTE LIST - Hides in focus mode */}
      {!focusMode && (
        <div className="w-80 border-r border-white/5 bg-zinc-900 flex flex-col">
          <div className="p-6 border-b border-white/5 bg-black/20 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white italic truncate pr-4">{activeNotebook.title}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <IconButton icon={LayoutTemplate} title="New from Template" />
                <Button onClick={handleNew} size="sm" className="h-8 bg-primary text-[9px] font-black uppercase tracking-widest px-3 rounded-xl shadow-lg">New</Button>
              </div>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input 
                placeholder="Search notes, OCR, text..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 pl-9 text-xs h-9 rounded-xl focus-visible:ring-primary/30" 
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary opacity-20" /></div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredNotes.map(note => (
                  <div 
                    key={note.id} 
                    onClick={() => setSelectedNote(note)} 
                    className={cn(
                      "p-6 cursor-pointer transition-all hover:bg-white/5 group relative",
                      selectedNote?.id === note.id ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 truncate">
                        {note.isProtected && <Lock className="w-3 h-3 text-muted-foreground" />}
                        <h3 className="font-black text-foreground uppercase italic tracking-tight truncate text-sm">{note.title || "Untitled"}</h3>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 italic opacity-60">{(note.content || "Empty...").substring(0, 100)}</p>
                    <div className="mt-3 flex items-center gap-3 text-[9px] text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3"/> 2/5</span>
                      <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3"/> 1</span>
                      <div className="flex-1" />
                      <span className="text-[8px] uppercase">{note.updatedAt?.seconds ? new Date(note.updatedAt.seconds * 1000).toLocaleDateString() : 'Now'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* EDITOR AREA */}
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <header className="h-16 border-b border-white/5 bg-card/40 backdrop-blur-xl px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <IconButton icon={Maximize2} title="Focus Mode" active={focusMode} onClick={() => setFocusMode(!focusMode)} />
                <div className="w-px h-4 bg-white/10 mx-2" />
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center text-[10px] font-bold">JD</div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center text-[10px] font-bold">AS</div>
                </div>
                <div className="flex items-center gap-1 ml-4 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                </div>
              </div>

              <div className="flex items-center gap-2">
                <IconButton icon={WifiOff} title="Offline Mode" />
                <IconButton icon={History} title="Version History" />
                <IconButton icon={Bell} title="Reminders" />
                <IconButton icon={Presentation} title="Present" />
                <IconButton icon={Download} title="Export PDF" />
                <IconButton icon={ListTree} title="Table of Contents" active={showOutline} onClick={() => setShowOutline(!showOutline)} />
                <div className="w-px h-4 bg-white/10 mx-2" />
                <IconButton icon={Moon} title="Theme" />
                <IconButton icon={Palette} title="Custom Fonts" />
                <Button onClick={handleSave} disabled={isSaving} className="ml-2 h-9 px-6 bg-primary rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-primary/20 shadow-lg">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
                </Button>
              </div>
            </header>

            {/* Rich Text Toolbar Mockup */}
            <div className="h-12 border-b border-white/5 bg-zinc-950/50 flex items-center px-4 gap-1 overflow-x-auto custom-scrollbar shrink-0">
              <IconButton icon={Bold} title="Bold" />
              <IconButton icon={Italic} title="Italic" />
              <IconButton icon={Underline} title="Underline" />
              <div className="w-px h-4 bg-white/10 mx-2 shrink-0" />
              <IconButton icon={Type} title="Markdown Toggle" />
              <IconButton icon={Link} title="Bi-directional Link" />
              <IconButton icon={CheckSquare} title="Checklist" />
              <IconButton icon={Table} title="Table" />
              <IconButton icon={Code} title="Code Block" />
              <IconButton icon={Sigma} title="Math Equation" />
              <div className="w-px h-4 bg-white/10 mx-2 shrink-0" />
              <IconButton icon={ImageIcon} title="Image Attachment" />
              <IconButton icon={FileImage} title="OCR Extract" />
              <IconButton icon={Mic} title="Audio Record" />
              <IconButton icon={PenTool} title="Draw/Sketch" />
              <div className="w-px h-4 bg-white/10 mx-2 shrink-0" />
              <IconButton icon={Globe} title="Web Clipper" />
              <IconButton icon={Youtube} title="Embed Content" />
              <div className="w-px h-4 bg-white/10 mx-2 shrink-0" />
              <Button size="sm" variant="secondary" className="h-8 gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border-none shrink-0">
                <Sparkles className="w-3 h-3" /> AI Assist
              </Button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Main Editor Body */}
              <ScrollArea className="flex-1">
                <div className={cn("max-w-4xl mx-auto p-12 transition-all", focusMode && "max-w-3xl")}>
                  <div className="mb-8 flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-muted-foreground flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
                      <Folder className="w-3 h-3" /> {activeNotebook.title}
                    </span>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-muted-foreground flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
                      <Hash className="w-3 h-3" /> Add tag
                    </span>
                  </div>
                  
                  <Input 
                    value={selectedNote.title} 
                    onChange={(e) => setSelectedNote({...selectedNote, title: e.target.value})} 
                    className="bg-transparent border-none text-5xl font-black uppercase italic p-0 h-auto focus-visible:ring-0 text-foreground tracking-tighter" 
                  />
                  
                  <textarea 
                    value={selectedNote.content} 
                    onChange={(e) => setSelectedNote({...selectedNote, content: e.target.value})} 
                    placeholder="Start typing... Press '/' for commands" 
                    className="w-full mt-10 bg-transparent border-none text-xl font-medium leading-relaxed outline-none resize-none min-h-[500px]" 
                  />
                </div>
              </ScrollArea>

              {/* Right Sidebar - Outline/TOC */}
              {showOutline && (
                <div className="w-64 border-l border-white/5 bg-zinc-950/50 flex flex-col p-6 animate-fade-in shrink-0">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Table of Contents</h4>
                  <div className="space-y-4 text-sm font-medium">
                    <div className="text-foreground hover:text-primary cursor-pointer truncate transition-colors">1. Introduction</div>
                    <div className="text-muted-foreground hover:text-primary cursor-pointer truncate pl-4 transition-colors">1.1 Background</div>
                    <div className="text-muted-foreground hover:text-primary cursor-pointer truncate pl-4 transition-colors">1.2 Objectives</div>
                    <div className="text-foreground hover:text-primary cursor-pointer truncate transition-colors">2. Implementation</div>
                    <div className="text-muted-foreground hover:text-primary cursor-pointer truncate pl-4 transition-colors">2.1 Setup</div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Quick Note Widget Mockup */}
            <div className="absolute bottom-8 right-8 flex flex-col items-end gap-2 z-50">
              <Button className="w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform border-none">
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 animate-float">
            <StickyNote className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-black uppercase italic">Select a note</h3>
          </div>
        )}
      </div>
    </div>
  );
}


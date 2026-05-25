"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Loader2,
  Book,
  StickyNote,
  Library,
  Settings,
  Search,
  ChevronRight
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

  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "notes"),
      orderBy("updatedAt", "desc"),
      limit(100)
    );
  }, [firestore, user]);

  const { data: dbNotes, isLoading } = useCollection(notesQuery);
  const filteredNotes = dbNotes?.filter(n => n.notebookId === activeNotebook.id) || [];

  useEffect(() => {
    if (filteredNotes.length > 0 && !selectedNote) {
      setSelectedNote(filteredNotes[0]);
    }
  }, [filteredNotes, selectedNote]);

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

  return (
    <div className="fixed inset-0 top-20 z-[50] bg-background flex animate-fade-in text-foreground overflow-hidden">
      <div className="w-64 border-r border-white/5 bg-zinc-950 flex flex-col">
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between h-16">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Library className="w-3.5 h-3.5" /> Library
          </h3>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {NOTEBOOKS.map(nb => (
              <button 
                key={nb.id}
                onClick={() => setActiveNotebook(nb)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl transition-all border border-transparent",
                  activeNotebook.id === nb.id ? "bg-primary/10 border-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5"
                )}
              >
                <nb.icon className="w-4 h-4" />
                <span className="text-xs font-black uppercase truncate">{nb.title}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="w-80 border-r border-white/5 bg-zinc-900 flex flex-col">
        <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between h-16 px-8">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white italic truncate pr-4">{activeNotebook.title}</h3>
          <Button onClick={handleNew} size="sm" className="h-9 bg-primary text-[9px] font-black uppercase tracking-widest px-4 rounded-xl shadow-lg">Add Note</Button>
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
                    "p-8 cursor-pointer transition-all hover:bg-white/5 group relative",
                    selectedNote?.id === note.id ? "bg-primary/5 border-l-4 border-primary" : ""
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-foreground uppercase italic tracking-tight truncate w-40 text-base">{note.title || "Untitled"}</h3>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 italic opacity-60">{(note.content || "Empty...").substring(0, 50)}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {selectedNote ? (
          <>
            <header className="h-16 border-b border-white/5 bg-card/40 backdrop-blur-xl px-10 flex items-center justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="h-10 px-8 bg-primary rounded-xl font-black uppercase text-[10px] tracking-widest text-white">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
              </Button>
            </header>

            <div className="flex-1 p-16 relative overflow-hidden flex flex-col shadow-2xl">
                <Input 
                  value={selectedNote.title} 
                  onChange={(e) => setSelectedNote({...selectedNote, title: e.target.value})} 
                  className="bg-transparent border-none text-6xl font-black uppercase italic p-0 h-auto focus-visible:ring-0 text-foreground tracking-tighter" 
                />
                <textarea 
                  value={selectedNote.content} 
                  onChange={(e) => setSelectedNote({...selectedNote, content: e.target.value})} 
                  placeholder="Start typing..." 
                  className="flex-1 mt-10 bg-transparent border-none text-2xl font-medium leading-relaxed italic outline-none resize-none custom-scrollbar" 
                />
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

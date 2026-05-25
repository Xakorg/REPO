
"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  BarChart3, 
  Trash2, 
  Loader2, 
  Eye, 
  Wand2,
  LayoutGrid,
  ChevronRight,
  Send,
  PlusCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function XakFormsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const formsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "forms"), orderBy("createdAt", "desc"));
  }, [firestore, user]);

  const { data: myForms, isLoading } = useCollection(formsQuery);

  const handleCreate = () => {
    if (!newFormTitle.trim() || !user || !firestore) return;
    setIsCreating(true);
    addDocumentNonBlocking(collection(firestore, "users", user.uid, "forms"), {
      title: newFormTitle,
      description: "New Survey",
      questions: [{ label: "Question 1", type: "text" }],
      createdAt: new Date().toISOString(),
      responseCount: 0
    });
    setNewFormTitle("");
    setIsCreating(false);
    toast({ title: "Form Created" });
  };

  const handleDelete = (id: string) => {
    if (!firestore || !user) return;
    deleteDocumentNonBlocking(doc(firestore, "users", user.uid, "forms", id));
    toast({ title: "Form Deleted" });
  };

  if (!mounted) return null;
  if (!user) return <div className="p-32 text-center font-black uppercase italic">Sign in for access.</div>;

  return (
    <div className="max-w-[1400px] mx-auto py-10 animate-fade-in px-6 space-y-12 text-foreground">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 glass-card p-12 rounded-[4rem] border-white/20 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float">
          <ClipboardList className="w-80 h-80 -rotate-12 text-primary" />
        </div>
        <div className="relative z-10 flex items-center gap-10">
          <div className="w-20 h-20 rounded-[2.2rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-2xl">
            <ClipboardList className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase italic leading-none">XakForms</h1>
            <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] mt-4 flex items-center gap-4 italic">
               <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" /> Survey System Active
            </p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 h-16 px-10 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-xl relative z-10 transition-all active:scale-95 border-b-8 border-primary/20 active:border-b-0">
              <Plus className="w-5 h-5 mr-3" /> New Form
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-foreground p-10 bg-zinc-950">
            <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic">New Form</DialogTitle></DialogHeader>
            <div className="space-y-6 py-6">
              <Input 
                value={newFormTitle} 
                onChange={(e) => setNewFormTitle(e.target.value)} 
                placeholder="Title..." 
                className="h-14 bg-secondary/50 border-white/5 rounded-xl font-bold" 
              />
              <Button onClick={handleCreate} disabled={isCreating || !newFormTitle} className="w-full h-14 bg-primary rounded-2xl font-black uppercase tracking-widest">
                {isCreating ? <Loader2 className="animate-spin" /> : "CREATE FORM"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <main className="lg:col-span-8 space-y-10">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
              <LayoutGrid className="w-8 h-8 text-primary" /> My Forms
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {isLoading ? (
              <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>
            ) : !myForms?.length ? (
              <Card className="col-span-full p-32 text-center glass-card border-white/5 opacity-30 flex flex-col items-center gap-6">
                 <Wand2 className="w-16 h-16" />
                 <p className="text-[10px] font-black uppercase tracking-widest italic">No forms found. Create one to begin.</p>
              </Card>
            ) : (
              myForms.map(form => (
                <Card key={form.id} className="glass-card rounded-[3.5rem] p-10 border-white/10 hover:border-primary/40 transition-all group relative overflow-hidden">
                   <div className="flex justify-between items-start mb-8">
                      <div className="space-y-2">
                         <h4 className="text-3xl font-black uppercase italic tracking-tight group-hover:text-primary transition-colors leading-none">{form.title}</h4>
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{form.responseCount || 0} Responses</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 rounded-xl h-12 border-white/10 font-black text-[9px] uppercase hover:bg-white/5"><Eye className="w-4 h-4 mr-2" /> View</Button>
                      <Button variant="outline" className="flex-1 rounded-xl h-12 border-white/10 font-black text-[9px] uppercase text-primary hover:bg-primary/10"><BarChart3 className="w-4 h-4 mr-2" /> Data</Button>
                      <Button onClick={() => handleDelete(form.id)} variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"><Trash2 className="w-4 h-4" /></Button>
                   </div>
                </Card>
              ))
            )}
          </div>
        </main>

        <aside className="lg:col-span-4 space-y-10">
          <Card className="glass-card rounded-[3.5rem] p-10 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent shadow-xl">
             <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-4 text-primary">
                <BarChart3 className="w-6 h-6 animate-pulse" /> Analytics
             </h3>
             <div className="space-y-8">
                <div className="p-8 bg-black/40 rounded-[2.5rem] border-2 border-white/5 text-center shadow-inner">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 italic">Total Responses</p>
                   <p className="text-6xl font-black text-white italic">{myForms?.reduce((acc, f) => acc + (f.responseCount || 0), 0) || 0}</p>
                </div>
             </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { 
  PenTool, 
  Plus, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Trash2, 
  Download, 
  Share2, 
  CheckCircle2, 
  Loader2, 
  Lock,
  Wand2,
  Zap,
  MoreVertical,
  Activity,
  UserCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function XakSignPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");

  const signQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "sign_documents"), orderBy("timestamp", "desc"));
  }, [firestore, user]);

  const { data: signDocs, isLoading } = useCollection(signQuery);

  const handleCreate = async () => {
    if (!docTitle.trim() || !user || !firestore) return;
    setIsCreating(true);
    try {
      await addDoc(collection(firestore, "users", user.uid, "sign_documents"), {
        title: docTitle,
        content: docContent,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      setDocTitle("");
      setDocContent("");
      toast({ title: "Document Ready" });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSign = async (id: string) => {
    if (!firestore || !user) return;
    await updateDoc(doc(firestore, "users", user.uid, "sign_documents", id), {
      status: 'signed',
      signedAt: serverTimestamp()
    });
    toast({ title: "Identity Authenticated", description: "Digital signature logic applied." });
  };

  if (!user) return <div className="p-32 text-center font-black uppercase italic">Sign in to access XakSign.</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 animate-fade-in px-6 space-y-12 text-foreground">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 glass-card p-12 rounded-[4rem] border-white/20 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float">
          <PenTool className="w-80 h-80 -rotate-12 text-primary" />
        </div>
        <div className="relative z-10 flex items-center gap-10">
          <div className="w-20 h-20 rounded-[2.2rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-2xl">
            <PenTool className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-7xl font-black text-foreground tracking-tighter uppercase italic leading-none">XakSign</h1>
            <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] mt-4 flex items-center gap-4 italic">
               <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" /> Digital Authority Suite
            </p>
          </div>
        </div>

        <Dialog>
           <DialogTrigger asChild>
             <Button className="bg-primary hover:bg-primary/90 h-16 px-12 rounded-[2rem] font-black uppercase text-xs tracking-widest text-white shadow-xl relative z-10 transition-all active:scale-95 border-b-8 border-primary/20 active:border-b-0">
               <Plus className="w-6 h-6 mr-3" /> New Request
             </Button>
           </DialogTrigger>
           <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-2xl text-foreground p-10">
              <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic">New Document Request</DialogTitle></DialogHeader>
              <div className="space-y-6 py-6">
                 <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Document Headline" className="h-14 bg-secondary/50 rounded-xl" />
                 <textarea value={docContent} onChange={(e) => setDocContent(e.target.value)} placeholder="Enter document text..." className="min-h-[200px] w-full bg-secondary/50 rounded-2xl p-6 italic font-medium" />
                 <Button onClick={handleCreate} disabled={isCreating || !docTitle} className="w-full h-16 bg-primary rounded-2xl font-black uppercase">{isCreating ? <Loader2 className="animate-spin w-6 h-6" /> : "SEND REQUEST"}</Button>
              </div>
           </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         <main className="lg:col-span-8 space-y-10">
            <div className="flex gap-4">
               {['all', 'pending', 'signed'].map(f => (
                 <Button key={f} onClick={() => setActiveTab(f)} variant="ghost" className={cn("rounded-full px-10 h-12 font-black uppercase text-[10px] tracking-widest transition-all", activeTab === f ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5")}>{f}</Button>
               ))}
            </div>

            <div className="space-y-6 pb-20">
               {isLoading ? (
                 <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>
               ) : !signDocs?.length ? (
                 <Card className="p-32 text-center glass-card border-white/5 opacity-30 flex flex-col items-center gap-8">
                    <FileText className="w-20 h-20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">No documents in the signing registry.</p>
                 </Card>
               ) : (
                 signDocs.filter(d => activeTab === 'all' || d.status === activeTab).map(docItem => (
                   <Card key={docItem.id} className="glass-card rounded-[3.5rem] p-10 border-white/10 hover:border-primary/30 transition-all group shadow-xl">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                         <div className="flex items-center gap-8">
                            <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 shadow-2xl", docItem.status === 'signed' ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-primary/10 border-primary/30 text-primary")}>
                               <FileText className="w-9 h-9" />
                            </div>
                            <div className="space-y-2">
                               <h4 className="text-3xl font-black uppercase italic tracking-tight group-hover:text-primary transition-colors leading-none">{docItem.title}</h4>
                               <div className="flex items-center gap-4">
                                  <Badge className={cn("border-none text-[8px] font-black uppercase px-4", docItem.status === 'signed' ? "bg-green-600" : "bg-amber-600 animate-pulse")}>{docItem.status}</Badge>
                                  <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40 flex items-center gap-2"><Clock className="w-3 h-3" /> {new Date(docItem.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                               </div>
                            </div>
                         </div>

                         <div className="flex gap-4">
                            {docItem.status === 'pending' && <Button onClick={() => handleSign(docItem.id)} className="h-14 px-10 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Sign Document</Button>}
                            <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(firestore!, "users", user.uid, "sign_documents", docItem.id))} className="h-14 w-14 rounded-2xl text-rose-500 hover:bg-rose-500/10"><Trash2 className="w-5 h-5" /></Button>
                         </div>
                      </div>
                   </Card>
                 ))
               )}
            </div>
         </main>

         <aside className="lg:col-span-4 space-y-10">
            <Card className="glass-card rounded-[3.5rem] p-10 border-white/10 bg-black/40 shadow-xl space-y-8">
               <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-primary"><ShieldCheck className="w-6 h-6 animate-pulse" /> Security Hub</h3>
               <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                     <p className="text-[10px] font-black text-muted-foreground uppercase">Key Protocol</p>
                     <p className="text-sm font-bold text-white italic">Zero-Knowledge RSA_4096_SHA256</p>
                  </div>
                  <div className="flex items-center gap-4 px-2">
                     <Lock className="w-5 h-5 text-green-500" />
                     <span className="text-[9px] font-black uppercase text-muted-foreground">Every signature is hash-linked to the Hub Root.</span>
                  </div>
               </div>
            </Card>

            <Card className="glass-card rounded-[3.5rem] p-10 border-white/10 bg-gradient-to-br from-primary/10 to-transparent shadow-xl text-center space-y-6">
               <Activity className="w-12 h-12 text-primary mx-auto" />
               <h3 className="text-2xl font-black uppercase italic tracking-tighter">Business Logic</h3>
               <p className="text-xs font-medium text-muted-foreground leading-relaxed uppercase italic">Automate your enterprise transmissions with Xakteir API integration.</p>
               <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 font-black uppercase text-[10px]">Developer Portal</Button>
            </Card>
         </aside>
      </div>
    </div>
  );
}

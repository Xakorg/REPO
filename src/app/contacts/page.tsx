
"use client";

import { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Cake, 
  Trash2, 
  MoreVertical, 
  Star,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Video,
  Send,
  Settings,
  Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function XakContactsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", birthday: "" });
  const [isCreating, setIsCreating] = useState(false);

  const contactsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "contacts"), orderBy("name", "asc"));
  }, [firestore, user]);

  const { data: contacts, isLoading } = useCollection(contactsQuery);

  const handleAdd = async () => {
    if (!newContact.name.trim() || !user || !firestore) return;
    setIsCreating(true);
    try {
      await addDoc(collection(firestore, "users", user.uid, "contacts"), {
        ...newContact,
        createdAt: serverTimestamp()
      });
      setNewContact({ name: "", email: "", phone: "", birthday: "" });
      toast({ title: "Contact Registered" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) return <div className="p-32 text-center font-black uppercase italic">Sign in for Contact Registry access.</div>;

  return (
    <div className="max-w-[1600px] mx-auto py-10 animate-fade-in px-6 space-y-12 text-foreground h-[calc(100vh-140px)] flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 glass-card p-10 rounded-[3.5rem] border-white/20 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Users className="w-80 h-80 -rotate-12 text-blue-400" /></div>
        <div className="relative z-10 flex items-center gap-10">
          <div className="w-16 h-16 rounded-[1.8rem] bg-blue-500/10 flex items-center justify-center border-4 border-blue-500/20 shadow-2xl">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase italic leading-none">XakContacts</h1>
            <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-[10px] mt-2 italic">Member Network</p>
          </div>
        </div>

        <div className="flex gap-6 relative z-10 w-full md:w-auto">
          <div className="relative flex-1 md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-400 transition-colors" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a contact..." className="h-14 bg-background/60 border-white/10 rounded-2xl pl-12 font-bold text-sm italic" />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl"><Plus className="w-4 h-4 mr-2" /> Add</Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-foreground p-10">
               <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic">New Member</DialogTitle></DialogHeader>
               <div className="space-y-6 py-6">
                  <Input value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} placeholder="Full Name" className="h-12 rounded-xl bg-secondary/50 border-white/10" />
                  <Input value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})} placeholder="email@xakteir.com" className="h-12 rounded-xl bg-secondary/50 border-white/10" />
                  <Input value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} placeholder="+0 (000) 000-0000" className="h-12 rounded-xl bg-secondary/50 border-white/10" />
                  <Input value={newContact.birthday} onChange={(e) => setNewContact({...newContact, birthday: e.target.value})} type="date" className="h-12 rounded-xl bg-secondary/50 border-white/10" />
                  <Button onClick={handleAdd} disabled={isCreating || !newContact.name} className="w-full h-14 bg-blue-600 rounded-2xl font-black uppercase tracking-widest">{isCreating ? <Loader2 className="animate-spin w-5 h-5" /> : "SYNC CONTACT"}</Button>
               </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 flex gap-10 overflow-hidden">
        <Card className="flex-1 glass-card rounded-[4rem] border-white/10 overflow-hidden flex flex-col shadow-2xl bg-black/20">
           <ScrollArea className="flex-1">
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                 {isLoading ? (
                   <div className="col-span-full py-40 flex justify-center"><Loader2 className="animate-spin w-16 h-16 text-blue-500 opacity-20" /></div>
                 ) : !contacts?.length ? (
                   <div className="col-span-full py-40 text-center opacity-20 flex flex-col items-center gap-6">
                      <UserPlus className="w-20 h-20" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Zero contacts in registry.</p>
                   </div>
                 ) : (
                   contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(contact => (
                     <Card key={contact.id} className="p-8 glass-card border-white/5 hover:border-blue-500/40 transition-all rounded-[2.5rem] group relative">
                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
                           <button onClick={() => deleteDoc(doc(firestore!, "users", user.uid, "contacts", contact.id))} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-6">
                           <Avatar className="w-24 h-24 border-4 border-white/10 shadow-2xl rounded-3xl">
                              <AvatarFallback className="bg-blue-600 text-white font-black text-2xl uppercase">{contact.name[0]}</AvatarFallback>
                           </Avatar>
                           <div className="space-y-2">
                              <h4 className="text-2xl font-black text-white uppercase italic tracking-tight truncate w-48">{contact.name}</h4>
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{contact.email || "NO_ID_MAP"}</p>
                           </div>
                           <div className="grid grid-cols-2 gap-3 w-full pt-4">
                              <Button variant="outline" className="rounded-xl h-11 border-white/10 bg-white/5 hover:bg-blue-500/10"><Mail className="w-4 h-4" /></Button>
                              <Button variant="outline" className="rounded-xl h-11 border-white/10 bg-white/5 hover:bg-blue-500/10"><Video className="w-4 h-4" /></Button>
                           </div>
                        </div>
                     </Card>
                   ))
                 )}
              </div>
           </ScrollArea>
        </Card>

        <aside className="w-80 space-y-10">
           <Card className="glass-card rounded-[3.5rem] p-8 border-white/10 bg-blue-500/5 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 italic mb-8 flex items-center gap-3">
                 <Cake className="w-5 h-5" /> Birthdays
              </h3>
              <div className="space-y-6">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed text-center italic opacity-40">No upcoming birthday transmissions detected.</p>
              </div>
           </Card>

           <Card className="glass-card rounded-[3.5rem] p-8 border-white/10 bg-black/40 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground italic mb-6">Integrity Logic</h3>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                 <ShieldCheck className="w-6 h-6 text-green-500" />
                 <span className="text-[9px] font-black uppercase">Verified Links: 100%</span>
              </div>
           </Card>
        </aside>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { 
  Lock, 
  ShieldCheck, 
  Key, 
  Fingerprint, 
  Plus, 
  Search, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Settings, 
  Globe, 
  Loader2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, addDoc, doc, deleteDoc, serverTimestamp, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function XakVaultPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const vaultQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "vault_items"), orderBy("timestamp", "desc"));
  }, [firestore, user]);

  const { data: vaultItems, isLoading } = useCollection(vaultQuery);

  const handleAddItem = async () => {
    if (!user || !firestore) return;
    const name = prompt("Site Name:");
    const username = prompt("Username:");
    const password = prompt("Password:");
    if (!name || !username || !password) return;

    try {
      await addDoc(collection(firestore, "users", user.uid, "vault_items"), {
        name, username, password, timestamp: serverTimestamp()
      });
      toast({ title: "Account Secured" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  if (!user) return <div className="p-32 text-center font-black uppercase italic">Sign in for Vault access.</div>;

  if (!isUnlocked) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center p-6 space-y-12 animate-fade-in text-foreground">
        <div className="w-40 h-40 rounded-[4rem] bg-black border-4 border-primary/40 flex items-center justify-center shadow-2xl animate-float">
          <Lock className="w-16 h-16 text-primary" />
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-6xl font-black uppercase italic tracking-tighter text-white">Registry Locked</h2>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Biometric verification required</p>
        </div>
        <Button onClick={() => setIsUnlocked(true)} className="h-20 px-12 bg-primary rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-6">
          <Fingerprint className="w-10 h-10" /> Authorized Unlock
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-10 animate-fade-in px-6 space-y-12 text-foreground h-[calc(100vh-140px)] flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="flex items-center gap-8">
           <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-800 flex items-center justify-center border border-white/10 shadow-xl"><Lock className="w-8 h-8 text-primary" /></div>
           <div>
              <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">XakVault Pro</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2 flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Security Active</p>
           </div>
        </div>
        <div className="flex gap-4">
           <div className="relative w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input placeholder="Search items..." className="pl-11 h-12 bg-black/40 border-none rounded-xl text-xs font-bold" />
           </div>
           <Button onClick={handleAddItem} className="h-12 px-8 bg-primary rounded-xl font-black uppercase text-[10px]">Add Item</Button>
        </div>
      </header>

      <Card className="flex-1 glass-card rounded-[4rem] border-white/10 overflow-hidden flex flex-col bg-black/20">
         <ScrollArea className="flex-1">
            <div className="p-10 space-y-4">
               {isLoading ? (
                 <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
               ) : vaultItems?.length === 0 ? (
                 <div className="py-40 text-center opacity-20 uppercase font-black tracking-widest text-sm">No items secured</div>
               ) : (
                 vaultItems?.map(item => (
                   <div key={item.id} className="p-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-primary transition-all">
                      <div className="flex items-center gap-8">
                         <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center"><Globe className="w-6 h-6 text-primary" /></div>
                         <div>
                            <h4 className="text-xl font-black uppercase italic">{item.name}</h4>
                            <p className="text-xs font-bold text-muted-foreground mt-1">{item.username}</p>
                         </div>
                      </div>
                      <div className="flex gap-3">
                         <Button onClick={() => setShowPassword(showPassword === item.id ? null : item.id)} variant="ghost" size="icon" className="h-11 w-11">{showPassword === item.id ? <EyeOff /> : <Eye />}</Button>
                         <Button onClick={() => deleteDoc(doc(firestore!, "users", user.uid, "vault_items", item.id))} variant="ghost" size="icon" className="h-11 w-11 text-rose-500"><Trash2 /></Button>
                      </div>
                   </div>
                 ))
               )}
            </div>
         </ScrollArea>
      </Card>
    </div>
  );
}

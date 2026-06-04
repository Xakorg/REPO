"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Zap, 
  User, 
  Palette, 
  Crown, 
  Flame, 
  Loader2, 
  Sparkles, 
  Gem, 
  Trophy, 
  Star, 
  ShieldCheck, 
  Rocket, 
  Wand2, 
  Gift, 
  Eye,
  CheckCircle2,
  Users,
  Hat,
  PartyPopper,
  Ghost,
  Skull,
  Bot
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { doc, updateDoc, increment, collection, query, limit, addDoc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const SHOP_ITEMS = [
  { id: 1, name: "Neon Pulse Aura", category: "Auras", type: 'aura', key: 'neon', price: 450, color: "text-blue-500", bg: "bg-blue-500/10", rarity: "Epic", description: "A high-frequency rhythmic pulse around your avatar." },
  { id: 2, name: "Neural Glitch Aura", category: "Auras", type: 'aura', key: 'glitch', price: 600, color: "text-primary", bg: "bg-primary/10", rarity: "Legendary", description: "Distort the boundaries of your profile with neural artifacts." },
  { id: 3, name: "Divine Shine Aura", category: "Auras", type: 'aura', key: 'gold', price: 1200, color: "text-amber-500", bg: "bg-amber-500/10", rarity: "Mythic", description: "Radiate energy from the Hub's original power source." },
  { id: 4, name: "Electric Blue Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 300, color: "text-blue-400", bg: "bg-blue-400/10", rarity: "Rare", description: "A vibrant cyan signature for your profile." },
  { id: 5, name: "Gold Elite Tag", category: "Name Plates", type: 'nameplate', key: 'gold', price: 850, color: "text-amber-500", bg: "bg-amber-500/10", rarity: "Legendary", description: "The standard of excellence in the multiverse." },
  { id: 6, name: "Space Cat Orbit", category: "Decorations", type: 'decor', key: 'cat', price: 1500, color: "text-rose-500", bg: "bg-rose-500/10", rarity: "Mythic", description: "An animated cat that orbits your identity." },
  
  // New Hats
  { id: 7, name: "Classic Top Hat", category: "Hats", type: 'hat', key: 'tophat', price: 500, color: "text-zinc-300", bg: "bg-zinc-500/10", rarity: "Rare", description: "A sophisticated black top hat for the distinguished member." },
  { id: 8, name: "Royal Crown", category: "Hats", type: 'hat', key: 'crown', price: 2000, color: "text-amber-400", bg: "bg-amber-500/10", rarity: "Mythic", description: "A golden crown studded with precious gems. Rule the Hub." },
  { id: 9, name: "Wizard Hat", category: "Hats", type: 'hat', key: 'wizard', price: 800, color: "text-purple-400", bg: "bg-purple-500/10", rarity: "Epic", description: "A mystical purple hat imbued with arcane power." },
  { id: 10, name: "Party Hat", category: "Hats", type: 'hat', key: 'party', price: 200, color: "text-pink-400", bg: "bg-pink-500/10", rarity: "Common", description: "A colorful cone hat for celebrations." },
  { id: 11, name: "Cowboy Hat", category: "Hats", type: 'hat', key: 'cowboy', price: 450, color: "text-amber-700", bg: "bg-amber-700/10", rarity: "Rare", description: "A rugged western hat for the bold adventurer." },
  { id: 12, name: "Halo", category: "Hats", type: 'hat', key: 'halo', price: 1500, color: "text-yellow-300", bg: "bg-yellow-500/10", rarity: "Legendary", description: "A divine golden halo that floats above your head." },
  { id: 13, name: "Devil Horns", category: "Hats", type: 'hat', key: 'horns', price: 1200, color: "text-red-500", bg: "bg-red-500/10", rarity: "Epic", description: "Dark crimson horns for the mischievous troublemaker." },
  { id: 14, name: "Baseball Cap", category: "Hats", type: 'hat', key: 'cap', price: 150, color: "text-blue-500", bg: "bg-blue-500/10", rarity: "Common", description: "A casual cap worn backwards for that cool vibe." },
  { id: 15, name: "Viking Helmet", category: "Hats", type: 'hat', key: 'viking', price: 900, color: "text-gray-400", bg: "bg-gray-500/10", rarity: "Epic", description: "A battle-worn helmet with mighty horns." },
  { id: 16, name: "Chef Hat", category: "Hats", type: 'hat', key: 'chef', price: 350, color: "text-white", bg: "bg-white/10", rarity: "Uncommon", description: "A tall white toque for the culinary master." },
  
  // More Auras
  { id: 17, name: "Cosmic Void Aura", category: "Auras", type: 'aura', key: 'cosmic', price: 1800, color: "text-purple-600", bg: "bg-purple-600/10", rarity: "Mythic", description: "The essence of the cosmos swirls around you." },
  { id: 18, name: "Fire Aura", category: "Auras", type: 'aura', key: 'fire', price: 700, color: "text-orange-500", bg: "bg-orange-500/10", rarity: "Epic", description: "Blazing flames dance around your avatar." },
  { id: 19, name: "Ice Aura", category: "Auras", type: 'aura', key: 'ice', price: 700, color: "text-cyan-400", bg: "bg-cyan-500/10", rarity: "Epic", description: "Crystalline ice particles orbit your presence." },
  
  // More Nameplates
  { id: 20, name: "Pro Nameplate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 1200, color: "text-purple-400", bg: "bg-purple-500/10", rarity: "Legendary", description: "A gradient nameplate that shifts between purple and pink." },
  { id: 21, name: "Rainbow Plate", category: "Name Plates", type: 'nameplate', key: 'rainbow', price: 2500, color: "text-pink-500", bg: "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10", rarity: "Mythic", description: "A nameplate that cycles through all colors of the rainbow." },
  
  // More Decorations
  { id: 22, name: "Star Trail", category: "Decorations", type: 'decor', key: 'stars', price: 800, color: "text-yellow-400", bg: "bg-yellow-500/10", rarity: "Epic", description: "Tiny stars trail behind your cursor." },
  { id: 23, name: "Lightning Bolt", category: "Decorations", type: 'decor', key: 'lightning', price: 600, color: "text-yellow-500", bg: "bg-yellow-500/10", rarity: "Rare", description: "Electric bolts crackle around your profile." },
  { id: 24, name: "Cherry Blossom", category: "Decorations", type: 'decor', key: 'sakura', price: 1000, color: "text-pink-300", bg: "bg-pink-300/10", rarity: "Legendary", description: "Delicate pink petals float around you." },
];

export default function ShopPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedItem, setSelectedItem] = useState(SHOP_ITEMS[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [giftTarget, setGiftTarget] = useState("");

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userRef);
  const balance = userData?.currencyBalance || 0;

  const handleSyncItem = async () => {
    if (!user || !firestore) return;
    if (balance < selectedItem.price) {
      toast({ variant: "destructive", title: "Low Credits" });
      return;
    }
    
    setIsSyncing(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid), {
        currencyBalance: increment(-selectedItem.price),
        [selectedItem.type]: selectedItem.key
      });
      toast({ title: "Identity Updated", description: `${selectedItem.name} equipped.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGift = async () => {
    if (!user || !firestore || !giftTarget.trim()) return;
    if (balance < selectedItem.price) {
      toast({ variant: "destructive", title: "Low Credits" });
      return;
    }
    
    setIsSyncing(true);
    try {
      const q = query(collection(firestore, "users"), where("displayName", "==", giftTarget.trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Member Not Found" });
        return;
      }

      const targetId = snap.docs[0].id;
      
      // Deduct balance from sender
      await updateDoc(doc(firestore, "users", user.uid), {
        currencyBalance: increment(-selectedItem.price)
      });

      // Notify recipient
      await addDoc(collection(firestore, "users", targetId, "notifications"), {
        title: "You received a Gift!",
        message: `@${user.displayName?.replace(/^@+/, "")} sent you the ${selectedItem.name}.`,
        type: 'social',
        read: false,
        timestamp: serverTimestamp()
      });

      toast({ title: "Gift Sent!", description: `Logic shard transmitted to @${giftTarget}` });
      setGiftTarget("");
    } catch (e) {
      toast({ variant: "destructive", title: "Transmission Error" });
    } finally {
      setIsSyncing(false);
    }
  };

  const categories = ["All", "Auras", "Name Plates", "Hats", "Decorations"];

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 py-12 animate-fade-in pb-32 px-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 bg-card/40 backdrop-blur-xl p-12 rounded-[4rem] border-4 border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><ShoppingBag className="w-96 h-96 -rotate-12 text-primary" /></div>
        <div className="relative z-10 flex items-center gap-10">
          <div className="w-24 h-24 rounded-[3rem] bg-emerald-500/10 flex items-center justify-center border-4 border-emerald-500/20 shadow-2xl">
            <ShoppingBag className="w-14 h-14 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-8xl font-black text-foreground tracking-tighter uppercase italic leading-none">Market</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-[0.4em] text-xs flex items-center gap-4 mt-4">
              <Zap className="w-5 h-5 text-amber-500 animate-pulse" /> Neural Shard Exchange Active
            </p>
          </div>
        </div>

        <div className="bg-background/60 backdrop-blur-3xl border-4 border-white/10 p-10 rounded-[3.5rem] flex items-center gap-12 shadow-2xl relative z-10">
          <div className="text-right">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-2">My Balance</p>
            <div className="flex items-center gap-4">
              <Flame className="w-10 h-10 text-amber-500 fill-amber-500" />
              <span className="text-6xl font-black text-white italic">{balance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-4">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "w-full flex items-center justify-between p-8 rounded-[2.5rem] border-4 transition-all text-sm font-black uppercase tracking-[0.2em] italic",
                  (activeCategory === cat || (cat === "All" && activeCategory === "All")) 
                    ? "bg-primary text-white border-white/20 shadow-2xl scale-105" 
                    : "bg-white/5 border-white/5 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-6">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {SHOP_ITEMS.filter(i => activeCategory === "All" || i.category === activeCategory).map(item => (
              <Card key={item.id} onClick={() => setSelectedItem(item)} className={cn("glass-card cursor-pointer rounded-[4rem] overflow-hidden border-4 transition-all duration-500 group", selectedItem.id === item.id ? "border-primary shadow-[0_0_80px_rgba(var(--primary),0.4)] scale-[1.02]" : "border-white/5 hover:border-white/20")}>
                <div className={cn("h-64 flex items-center justify-center relative overflow-hidden", item.bg)}>
                  <div className="absolute inset-0 arcade-grid opacity-10" />
                  <div className={cn("w-24 h-24 flex items-center justify-center transition-transform duration-700 group-hover:scale-125", item.color)}>
                {item.type === 'hat' ? <Hat className="w-24 h-24" /> : 
                 item.type === 'decor' ? <Sparkles className="w-24 h-24" /> :
                 item.type === 'aura' ? <Flame className="w-24 h-24" /> :
                 item.type === 'nameplate' ? <User className="w-24 h-24" /> :
                 <User className="w-24 h-24" />}
              </div>
                  <Badge className="absolute top-8 right-8 bg-black/60 border-none text-[10px] font-black uppercase">{item.rarity}</Badge>
                </div>
                <CardContent className="p-12">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-3xl font-black text-foreground uppercase italic tracking-tighter leading-none">{item.name}</h3>
                    <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <span className="text-xl font-black italic">{item.price}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-bold italic line-clamp-3 leading-relaxed opacity-80">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="sticky top-32 space-y-10">
            <Card className="glass-card rounded-[4.5rem] border-4 border-white/10 overflow-hidden shadow-2xl">
              <div className="h-40 bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Visual Preview Station</p>
              </div>
              <CardContent className="p-12 -mt-24 text-center relative z-10">
                <div className={cn(
                  "relative rounded-full p-2 mx-auto transition-all duration-700",
                  selectedItem.type === 'aura' && (
                    selectedItem.key === 'neon' ? "aura-neon" :
                    selectedItem.key === 'glitch' ? "aura-glitch" : "aura-gold"
                  )
                )}>
                  {selectedItem.key === 'cat' && <div className="flying-cat">🐱</div>}
                  <Avatar className="w-48 h-48 border-[12px] border-background rounded-[4rem] shadow-2xl mx-auto overflow-hidden bg-secondary">
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback className="bg-primary text-6xl font-black text-white">{user?.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                <h4 className={cn(
                  "text-5xl font-black tracking-tighter mt-10 italic uppercase leading-none",
                  selectedItem.type === 'nameplate' && (
                    selectedItem.key === 'blue' ? 'nameplate-blue' :
                    selectedItem.key === 'gold' ? 'nameplate-gold' : 'nameplate-pro'
                  )
                )}>
                  {user?.displayName?.replace(/^@+/, "") || "Member"}
                </h4>
              </CardContent>
              <CardFooter className="p-12 pt-0 flex flex-col gap-4">
                <Button onClick={handleSyncItem} disabled={isSyncing} className="w-full bg-emerald-600 hover:bg-emerald-500 h-20 rounded-[2rem] font-black text-lg uppercase italic shadow-xl transition-all active:scale-95 border-b-8 border-emerald-800 active:border-b-0">
                  {isSyncing ? <Loader2 className="w-8 h-8 animate-spin" /> : "Equip Now"}
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                ``   <Button variant="outline" className="w-full h-16 rounded-[2rem] border-white/10 font-black uppercase text-xs tracking-widest text-muted-foreground hover:text-white">
                      <Gift className="w-4 h-4 mr-3" /> Gift to Friend
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-foreground p-10">
                    <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic">Gift Transmission</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Friend's Hub Username</label>
                        <Input value={giftTarget} onChange={(e) => setGiftTarget(e.target.value)} placeholder="username" className="bg-secondary/50 h-14 rounded-xl font-bold" />
                      </div>
                      <Button onClick={handleGift} disabled={isSyncing || !giftTarget} className="w-full h-16 bg-primary rounded-2xl font-black uppercase shadow-xl">Transmit Gift</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

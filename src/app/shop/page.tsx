"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Zap, 
  User, 
  Award, 
  Flame, 
  Loader2, 
  Sparkles, 
  Gift, 
  Clock,
  Sparkle,
  Star
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { doc, updateDoc, increment, collection, query, addDoc, serverTimestamp, getDocs, where, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RenderHat, RenderAura, RenderDecor, getNameplateClass, RenderPet, RenderBanner } from "@/components/RenderHat";
import confetti from "canvas-confetti";

const triggerConfetti = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
};

export default function ShopPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Weekly");
  const [giftTarget, setGiftTarget] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");

  const [previewSetId, setPreviewSetId] = useState<string | null>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userRef);
  const balance = userData?.currencyBalance || 0;

  const systemSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "system_settings", "global");
  }, [firestore]);
  const { data: systemSettings } = useDoc(systemSettingsRef);
  
  const saleMultiplier = systemSettings?.globalSaleMultiplier || 1;
  const isShopLocked = !!systemSettings?.shopLocked;

  // Rotation Logic
  const { weekItems } = useMemo(() => {
    const now = new Date();
    // Get the week number since epoch
    const weekNumber = Math.floor(now.getTime() / (1000 * 60 * 60 * 24 * 7));
    
    // Seeded random items based on week number
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Calculate time remaining until next rotation (Sunday Midnight UTC)
    const nextSunday = new Date(now);
    nextSunday.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay()) % 7 || 7));
    nextSunday.setUTCHours(0, 0, 0, 0);
    
    // Generate 50 items for the week
    const items = [...([] as any[])];
    const selectedWeekly = [];
    const selectionCount = Math.min(50, items.length);
    for(let i=0; i<selectionCount; i++) {
        const randIndex = Math.floor(seededRandom(weekNumber + i * 10) * items.length);
        selectedWeekly.push(items[randIndex]);
        items.splice(randIndex, 1);
    }
    
    return { weekItems: selectedWeekly, nextSunday };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const nextSunday = new Date();
      nextSunday.setUTCDate(new Date().getUTCDate() + ((7 - new Date().getUTCDay()) % 7 || 7));
      nextSunday.setUTCHours(0, 0, 0, 0);
      const distance = nextSunday.getTime() - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = user?.email === 'admin@xakteir.com' || user?.email === 'ridwan123456789100@gmail.com' || userData?.isAdmin === true || userData?.role === 'admin';
  const SHOP_SETS = ([] as any[]).filter((set: any) => !set.isAdmin || isAdmin);

  const displayedItems = activeCategory === "Weekly" 
    ? weekItems 
    : ([] as any[]).filter(i => activeCategory === "All" || i.category === activeCategory);

  const [selectedItem, setSelectedItem] = useState<any>(activeCategory === "Featured Sets" ? null : displayedItems[0]);

  useEffect(() => {
    if (activeCategory === "Featured Sets") {
      setPreviewSetId(SHOP_SETS[0]?.id);
      setSelectedItem(null);
    } else {
      setPreviewSetId(null);
      setSelectedItem(displayedItems[0]);
    }
  }, [activeCategory, displayedItems]);

  const handleSelectItem = (item: any) => {
    setPreviewSetId(null);
    setSelectedItem(item);
  };

  const getPrice = (price: number) => Math.floor(price * saleMultiplier);

  const handleSyncItem = async () => {
    if (!user || !firestore || !selectedItem) return;
    if (isShopLocked) {
      toast({ variant: "destructive", title: "Shop Locked", description: "The marketplace is currently disabled by administrators." });
      return;
    }

    const finalPrice = getPrice(selectedItem.price);
    if (balance < finalPrice) {
      toast({ variant: "destructive", title: "Low Credits" });
      return;
    }
    
    setIsSyncing(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid), {
        currencyBalance: increment(-finalPrice),
        [selectedItem.type]: selectedItem.key,
        inventory: arrayUnion(selectedItem.key)
      });
      triggerConfetti();
      toast({ title: "Identity Updated", description: `${selectedItem.name} equipped.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBuyBundle = async (bundle: any) => {
    if (!user || !firestore) return;
    if (isShopLocked) {
      toast({ variant: "destructive", title: "Shop Locked", description: "The marketplace is currently disabled by administrators." });
      return;
    }

    const finalPrice = getPrice(bundle.price);
    if (balance < finalPrice) {
      toast({ variant: "destructive", title: "Low Credits" });
      return;
    }
    
    setIsSyncing(true);
    try {
      const updateObj: Record<string, any> = {
        currencyBalance: increment(-finalPrice),
        inventory: arrayUnion(...bundle.items.map((i: any) => i.key))
      };
      bundle.items.forEach((item: any) => {
        updateObj[item.type] = item.key;
      });
      await updateDoc(doc(firestore, "users", user.uid), updateObj);
      triggerConfetti();
      toast({ title: "Bundle Acquired!", description: `All items in ${bundle.name} equipped.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGift = async () => {
    if (!user || !firestore || !selectedItem || !giftTarget.trim()) return;
    if (isShopLocked) {
      toast({ variant: "destructive", title: "Shop Locked", description: "The marketplace is currently disabled by administrators." });
      return;
    }

    const finalPrice = getPrice(selectedItem.price);
    if (balance < finalPrice) {
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
      
      await updateDoc(doc(firestore, "users", user.uid), {
        currencyBalance: increment(-finalPrice)
      });

      await updateDoc(doc(firestore, "users", targetId), {
        [selectedItem.type]: selectedItem.key,
        inventory: arrayUnion(selectedItem.key)
      });

      await addDoc(collection(firestore, "users", targetId, "notifications"), {
        title: "You received a Gift!",
        message: `@${user.displayName?.replace(/^@+/, "")} sent you the ${selectedItem.name}.`,
        type: 'social',
        read: false,
        timestamp: serverTimestamp()
      });

      toast({ title: "Gift Sent!", description: `Gift transmitted to @${giftTarget}` });
      setGiftTarget("");
    } catch (e) {
      toast({ variant: "destructive", title: "Transmission Error" });
    } finally {
      setIsSyncing(false);
    }
  };

  const categories = ["Weekly", "Featured Sets", "All", "Pets", "Banners", "Auras", "Name Plates", "Hats", "Decorations"];

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case "Exotic": return "shadow-[0_0_40px_rgba(99,102,241,0.5)] border-indigo-500/50";
      case "Mythic": return "shadow-[0_0_30px_rgba(245,158,11,0.4)] border-amber-500/50";
      case "Legendary": return "shadow-[0_0_25px_rgba(236,72,153,0.4)] border-pink-500/50";
      case "Epic": return "shadow-[0_0_20px_rgba(168,85,247,0.3)] border-purple-500/40";
      case "Rare": return "shadow-[0_0_15px_rgba(59,130,246,0.3)] border-blue-500/30";
      default: return "border-white/10 shadow-lg";
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "Exotic": return "bg-indigo-600 text-white animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.8)]";
      case "Mythic": return "bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.8)]";
      case "Legendary": return "bg-pink-600 text-white";
      case "Epic": return "bg-purple-600 text-white";
      case "Rare": return "bg-blue-600 text-white";
      default: return "bg-zinc-700 text-zinc-100";
    }
  };

  const previewSet = useMemo(() => {
    if (!previewSetId) return null;
    return SHOP_SETS.find(s => s.id === previewSetId);
  }, [previewSetId]);

  const previewHat = previewSet 
    ? previewSet.items.find((i: any) => i.type === 'hat')?.key 
    : (selectedItem?.type === 'hat' ? selectedItem.key : userData?.hat);

  const previewAura = previewSet 
    ? previewSet.items.find((i: any) => i.type === 'aura')?.key 
    : (selectedItem?.type === 'aura' ? selectedItem.key : userData?.aura);

  const previewDecor = previewSet 
    ? previewSet.items.find((i: any) => i.type === 'decor')?.key 
    : (selectedItem?.type === 'decor' ? selectedItem.key : userData?.decor);

  const previewPet = previewSet 
    ? previewSet.items.find((i: any) => i.type === 'pet')?.key 
    : (selectedItem?.type === 'pet' ? selectedItem.key : userData?.pet);

  const previewBanner = previewSet 
    ? previewSet.items.find((i: any) => i.type === 'banner')?.key 
    : (selectedItem?.type === 'banner' ? selectedItem.key : userData?.banner);

  const previewNameplate = previewSet 
    ? previewSet.items.find((i: any) => i.type === 'nameplate')?.key 
    : (selectedItem?.type === 'nameplate' ? selectedItem.key : userData?.nameplate);

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 py-12 animate-fade-in pb-32 px-6 text-white">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 bg-card/40 backdrop-blur-xl p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><ShoppingBag className="w-96 h-96 -rotate-12 text-primary" /></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-10">
          <div className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <ShoppingBag className="w-12 h-12 text-emerald-400 drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-7xl lg:text-8xl font-black text-foreground tracking-tighter uppercase italic leading-none drop-shadow-sm">Market</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-[0.4em] text-xs flex items-center gap-4 mt-4">
              <Zap className="w-4 h-4 text-amber-500 animate-pulse" /> Credit Exchange Active
            </p>
          </div>
        </div>

        <div className="bg-background/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] flex items-center gap-12 shadow-2xl relative z-10 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all">
          <div className="text-right">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-2">My Balance</p>
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-amber-500 fill-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              <span className="text-5xl font-black text-white italic tracking-tight">{balance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-8 py-4 rounded-full border transition-all text-xs font-black uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-3",
              activeCategory === cat
                ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(var(--primary),0.5)] scale-105" 
                : "bg-card/50 backdrop-blur-sm border-white/5 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
            )}
          >
            {cat === "Weekly" && <Sparkle className="w-4 h-4 text-yellow-300" />}
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          
          {activeCategory === "Weekly" && (
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-[3rem] p-8 flex items-center justify-between shadow-xl backdrop-blur-md">
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-widest text-amber-500 flex items-center gap-3">
                        <Star className="w-6 h-6 fill-amber-500" /> Weekly Rotation
                    </h2>
                    <p className="text-sm text-amber-500/70 font-bold uppercase tracking-wider mt-1">Exclusive items available for a limited time</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-amber-500/80 font-black uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
                        <Clock className="w-3 h-3" /> Rotating In
                    </p>
                    <p className="text-2xl font-black text-amber-400 tracking-wider tabular-nums font-mono bg-black/30 px-4 py-2 rounded-xl shadow-inner border border-amber-500/20">
                        {timeRemaining || "Loading..."}
                    </p>
                </div>
            </div>
          )}

          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
            {activeCategory === "Featured Sets" ? (
              SHOP_SETS.map((set, i) => (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: i * 0.1, type: "spring" }}
                >
                  <Card 
                    onClick={() => {
                      setPreviewSetId(set.id);
                      setSelectedItem(null);
                    }}
                    className={cn(
                      "glass-card cursor-pointer rounded-[3rem] overflow-hidden transition-all duration-700 group h-full flex flex-col justify-between border-2 relative", 
                      previewSetId === set.id 
                        ? "shadow-[0_0_80px_rgba(245,158,11,0.6)] border-amber-500/80 scale-[1.03] z-10"
                        : "border-white/10 hover:border-white/30 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                    )}
                  >
                    {/* Holographic Glare Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)] mix-blend-overlay z-50" />
                    <div className={cn("h-48 flex flex-col justify-center p-8 relative overflow-hidden", set.bg)}>
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
                      <div className="flex justify-between items-start z-10">
                        <Badge className="bg-indigo-600 text-white animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.8)] border-none text-[10px] font-black uppercase px-3 py-1">
                          {set.rarity}
                        </Badge>
                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
                          <Zap className="w-5 h-5 text-primary" />
                          <span className="text-lg font-black italic">{getPrice(set.price)}</span>
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mt-6 z-10 leading-none">{set.name}</h3>
                    </div>
                    <CardContent className="p-8 flex-1 flex flex-col justify-between gap-6">
                      <p className="text-sm text-muted-foreground font-bold italic leading-relaxed opacity-85">{set.description}</p>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Includes:</p>
                        <div className="flex flex-wrap gap-2">
                          {set.itemsList.map((item: any, idx: number) => (
                            <span key={idx} className="text-[8px] font-black uppercase tracking-[0.1em] text-white/70 bg-white/5 border border-white/10 px-2 py-1 rounded-md">{item}</span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-8 pt-0 flex gap-4">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewSetId(set.id);
                          setSelectedItem(null);
                        }}
                        variant="outline" 
                        className="flex-1 h-12 rounded-xl border-white/10 text-xs font-black uppercase tracking-wider hover:bg-white/5 bg-transparent"
                      >
                        Preview
                      </Button>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyBundle(set);
                        }}
                        className="flex-1 h-12 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider"
                      >
                        Buy Bundle
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            ) : (
              displayedItems.map((item: any, i: number) => (
                <motion.div
                  key={`${item.id}-${i}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5), type: "spring" }}
                >
                <Card 
                  onClick={() => handleSelectItem(item)} 
                  className={cn(
                      "glass-card cursor-pointer rounded-[3rem] overflow-hidden transition-all duration-700 group h-full relative", 
                      selectedItem?.id === item.id 
                          ? cn("scale-[1.04] border-2 z-10", getRarityGlow(item.rarity))
                          : "border border-white/10 hover:border-white/30 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                  )}
                >
                  {/* Holographic Glare Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_70%)] mix-blend-overlay z-50" />
                  <div className={cn("h-56 flex items-center justify-center relative overflow-hidden", item.bg)}>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
                    <motion.div 
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={cn("w-20 h-20 flex items-center justify-center drop-shadow-xl", item.color)}
                    >
                       {item.type === 'hat' ? <Award className="w-16 h-16" /> : 
                        item.type === 'decor' ? <Sparkles className="w-16 h-16" /> :
                        item.type === 'aura' ? <Flame className="w-16 h-16" /> :
                        item.type === 'nameplate' ? <User className="w-16 h-16" /> :
                        item.type === 'pet' ? <RenderPet petKey={item.key} /> :
                        <User className="w-16 h-16" />}
                    </motion.div>
                    <Badge className={cn("absolute top-6 right-6 border-none text-[10px] font-black uppercase px-3 py-1 shadow-lg", getRarityBadge(item.rarity))}>
                        {item.rarity}
                    </Badge>
                  </div>
                  <CardContent className="p-8 text-left">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter leading-none pr-4">{item.name}</h3>
                      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 shadow-inner shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-lg font-black italic">{getPrice(item.price)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-bold italic line-clamp-2 leading-relaxed opacity-80">{item.description}</p>
                  </CardContent>
                </Card>
                </motion.div>
              ))
            )}
            </AnimatePresence>
            {displayedItems.length === 0 && activeCategory !== "Featured Sets" && (
                <div className="col-span-2 py-20 text-center">
                    <p className="text-muted-foreground font-black uppercase tracking-widest text-lg">No items found in this category.</p>
                </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-12 space-y-8">
            <Card className="glass-card rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl relative w-full text-left bg-[#0c0c16]/95">
              {/* Banner Area */}
              <div className="h-32 w-full relative overflow-hidden z-10">
                <RenderBanner bannerKey={previewBanner} className="absolute inset-0 w-full h-full object-cover" />
                {!previewBanner && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900" />
                )}
                {/* Banner overlay gradient for premium feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {/* User Avatar + Decoration + Badges section */}
              <div className="px-6 relative z-20 flex justify-between items-end -mt-16 mb-4">
                <div className="relative p-1 rounded-[3rem] bg-[#0c0c16] z-20">
                  <RenderDecor decorKey={previewDecor} />
                  <RenderAura auraKey={previewAura} />
                  <RenderHat hatKey={previewHat} />
                  <RenderPet petKey={previewPet} />
                  
                  <Avatar className="w-28 h-28 border-[6px] border-[#0c0c16] rounded-[2.2rem] shadow-2xl overflow-hidden bg-secondary relative z-20">
                    <AvatarImage src={user?.photoURL || ""} className="object-cover" />
                    <AvatarFallback className="bg-primary text-3xl font-black text-white">{user?.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  
                  {/* Discord-style Online Indicator dot */}
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-[#0c0c16] rounded-full z-30" />
                </div>

                {/* Discord-style Profile Badges */}
                <div className="flex gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/5 shadow-md mb-2">
                  {/* Early Supporter Badge */}
                  <div className="w-5 h-5 flex items-center justify-center text-yellow-400 hover:scale-110 transition-transform cursor-pointer" title="Early Supporter">
                    <Star className="w-4 h-4 fill-yellow-400" />
                  </div>
                  {/* HypeSquad Bravery Badge */}
                  <div className="w-5 h-5 flex items-center justify-center text-purple-400 hover:scale-110 transition-transform cursor-pointer" title="HypeSquad Bravery">
                    <Flame className="w-4 h-4 fill-purple-400" />
                  </div>
                  {/* Active Developer Badge */}
                  <div className="w-5 h-5 flex items-center justify-center text-emerald-400 hover:scale-110 transition-transform cursor-pointer" title="Active Developer">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  {/* Nitro / Premium Member Badge */}
                  <div className="w-5 h-5 flex items-center justify-center text-pink-400 hover:scale-110 transition-transform cursor-pointer" title="Xakteir Premium">
                    <Award className="w-4 h-4 fill-pink-400" />
                  </div>
                </div>
              </div>

              {/* Username + Tag */}
              <div className="px-8 pb-4">
                <h4 className={cn(
                  "text-3xl font-black tracking-tighter italic uppercase leading-none break-words relative z-20",
                  getNameplateClass(previewNameplate)
                )}>
                  {user?.displayName?.replace(/^@+/, "") || "Member"}
                </h4>
                <p className="text-[10px] text-muted-foreground font-black tracking-widest mt-1">@{(user?.displayName || "member").replace(/^@+/, "").toLowerCase()}</p>
              </div>

              <div className="px-8 py-2"><hr className="border-white/5" /></div>

              {/* About Me / Bio Section */}
              <div className="px-8 py-4 space-y-4">
                <div>
                  <h5 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">About Me</h5>
                  <p className="text-xs text-white/80 font-bold leading-relaxed italic">
                    {userData?.aboutMe || "Multiverse voyager & code explorer. Exploring the outer edges of the Xakteir ecosystem."}
                  </p>
                </div>

                <div>
                  <h5 className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Xakteir Member Since</h5>
                  <p className="text-xs text-white/60 font-bold">Jun 2024</p>
                </div>
              </div>

              <CardFooter className="p-8 pt-2 flex flex-col gap-4">
                {previewSet ? (
                  <Button 
                    onClick={() => handleBuyBundle(previewSet)} 
                    disabled={isSyncing} 
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black h-16 rounded-[2rem] font-black text-lg uppercase italic shadow-[0_10px_30px_rgba(245,158,11,0.3)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(245,158,11,0.4)] active:translate-y-0 active:shadow-none"
                  >
                    {isSyncing ? <Loader2 className="w-6 h-6 animate-spin" /> : `Acquire Bundle`}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSyncItem} 
                    disabled={isSyncing || !selectedItem} 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-16 rounded-[2rem] font-black text-lg uppercase italic shadow-[0_10px_30px_rgba(var(--primary),0.3)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(var(--primary),0.4)] active:translate-y-0 active:shadow-none"
                  >
                    {isSyncing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Equip Item"}
                  </Button>
                )}
                
                {/* Only show gifting if we are previewing a single item */}
                {!previewSet && selectedItem && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-14 rounded-[2rem] border-white/10 bg-transparent hover:bg-white/5 font-black uppercase text-xs tracking-widest text-muted-foreground hover:text-white transition-all">
                        <Gift className="w-4 h-4 mr-3" /> Gift to Friend
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-foreground p-10 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                      <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Gift Transmission</DialogTitle></DialogHeader>
                      <div className="space-y-6 py-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-2">Recipient's Username</label>
                           <Input 
                              value={giftTarget} 
                              onChange={(e) => setGiftTarget(e.target.value)} 
                              placeholder="username" 
                              className="bg-black/40 border-white/10 h-16 rounded-2xl font-bold text-lg px-6 focus-visible:ring-primary shadow-inner" 
                          />
                        </div>
                        <Button onClick={handleGift} disabled={isSyncing || !giftTarget} className="w-full h-16 bg-primary rounded-2xl font-black uppercase text-lg shadow-xl">Transmit Gift</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

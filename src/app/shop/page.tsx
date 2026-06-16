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
import { doc, updateDoc, increment, collection, query, addDoc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Input } from "@/components/ui/input";
import { RenderHat, RenderAura, RenderDecor, getNameplateClass, RenderPet, RenderBanner } from "@/components/RenderHat";

const ALL_SHOP_ITEMS = [
  // Hats (11 items)
  { id: 1, name: "Classic Top Hat", category: "Hats", type: 'hat', key: 'tophat', price: 500, color: "text-zinc-300", bg: "bg-zinc-500/10", rarity: "Rare", description: "A sophisticated black top hat for the distinguished member." },
  { id: 2, name: "Royal Crown", category: "Hats", type: 'hat', key: 'crown', price: 2000, color: "text-amber-400", bg: "bg-amber-500/10", rarity: "Mythic", description: "A golden crown studded with precious gems." },
  { id: 3, name: "Wizard Hat", category: "Hats", type: 'hat', key: 'wizard', price: 800, color: "text-purple-400", bg: "bg-purple-500/10", rarity: "Epic", description: "A mystical purple hat imbued with arcane power." },
  { id: 4, name: "Party Hat", category: "Hats", type: 'hat', key: 'party', price: 200, color: "text-pink-400", bg: "bg-pink-500/10", rarity: "Common", description: "A colorful cone hat for celebrations." },
  { id: 5, name: "Cowboy Hat", category: "Hats", type: 'hat', key: 'cowboy', price: 450, color: "text-amber-700", bg: "bg-amber-700/10", rarity: "Rare", description: "A rugged western hat for the bold adventurer." },
  { id: 6, name: "Halo", category: "Hats", type: 'hat', key: 'halo', price: 1500, color: "text-yellow-300", bg: "bg-yellow-500/10", rarity: "Legendary", description: "A divine golden halo that floats above your head." },
  { id: 7, name: "Devil Horns", category: "Hats", type: 'hat', key: 'horns', price: 1200, color: "text-red-500", bg: "bg-red-500/10", rarity: "Epic", description: "Dark crimson horns for the mischievous troublemaker." },
  { id: 8, name: "Baseball Cap", category: "Hats", type: 'hat', key: 'cap', price: 150, color: "text-blue-500", bg: "bg-blue-500/10", rarity: "Common", description: "A casual cap worn backwards for that cool vibe." },
  { id: 9, name: "Viking Helmet", category: "Hats", type: 'hat', key: 'viking', price: 900, color: "text-gray-400", bg: "bg-gray-500/10", rarity: "Epic", description: "A battle-worn helmet with mighty horns." },
  { id: 10, name: "Chef Hat", category: "Hats", type: 'hat', key: 'chef', price: 350, color: "text-white", bg: "bg-white/10", rarity: "Uncommon", description: "A tall white toque for the culinary master." },
  { id: 11, name: "Galactic Crown", category: "Hats", type: 'hat', key: 'crown', price: 5000, color: "text-indigo-400", bg: "bg-indigo-500/20", rarity: "Exotic", description: "A crown forged in the heart of a dying star. Rarely seen." },

  // Auras (20 items)
  { id: 12, name: "Neon Pulse Aura", category: "Auras", type: 'aura', key: 'neon', price: 450, color: "text-blue-500", bg: "bg-blue-500/10", rarity: "Epic", description: "A high-frequency rhythmic pulse around your avatar." },
  { id: 13, name: "Cyber Glitch Aura", category: "Auras", type: 'aura', key: 'glitch', price: 600, color: "text-primary", bg: "bg-primary/10", rarity: "Legendary", description: "Distort the boundaries of your profile with digital artifacts." },
  { id: 14, name: "Divine Shine Aura", category: "Auras", type: 'aura', key: 'gold', price: 1200, color: "text-amber-500", bg: "bg-amber-500/10", rarity: "Mythic", description: "Radiate energy from the Hub's original power source." },
  { id: 15, name: "Cosmic Void Aura", category: "Auras", type: 'aura', key: 'glitch', price: 1800, color: "text-purple-600", bg: "bg-purple-600/10", rarity: "Mythic", description: "The essence of the cosmos swirls around you." },
  { id: 16, name: "Fire Aura", category: "Auras", type: 'aura', key: 'gold', price: 700, color: "text-orange-500", bg: "bg-orange-500/10", rarity: "Epic", description: "Blazing flames dance around your avatar." },
  { id: 17, name: "Ice Aura", category: "Auras", type: 'aura', key: 'neon', price: 700, color: "text-cyan-400", bg: "bg-cyan-500/10", rarity: "Epic", description: "Crystalline ice particles orbit your presence." },
  { id: 18, name: "Dark Matter Aura", category: "Auras", type: 'aura', key: 'glitch', price: 4500, color: "text-slate-900", bg: "bg-slate-900/50", rarity: "Exotic", description: "An aura that consumes light itself." },
  { id: 19, name: "Emerald Glow", category: "Auras", type: 'aura', key: 'neon', price: 300, color: "text-emerald-400", bg: "bg-emerald-500/10", rarity: "Rare", description: "A soothing green aura." },
  { id: 20, name: "Ruby Radiance", category: "Auras", type: 'aura', key: 'gold', price: 800, color: "text-red-500", bg: "bg-red-500/10", rarity: "Epic", description: "A fierce red light." },
  { id: 21, name: "Phantom Mist", category: "Auras", type: 'aura', key: 'glitch', price: 1500, color: "text-zinc-400", bg: "bg-zinc-500/10", rarity: "Legendary", description: "Ethereal fog surrounds you." },
  { id: 22, name: "Solar Flare", category: "Auras", type: 'aura', key: 'gold', price: 2200, color: "text-yellow-500", bg: "bg-yellow-500/10", rarity: "Mythic", description: "Blinding solar energy." },
  { id: 23, name: "Lunar Eclipse", category: "Auras", type: 'aura', key: 'glitch', price: 2100, color: "text-indigo-500", bg: "bg-indigo-500/10", rarity: "Mythic", description: "The shadow of the moon." },
  { id: 24, name: "Toxic Fumes", category: "Auras", type: 'aura', key: 'neon', price: 400, color: "text-green-500", bg: "bg-green-500/10", rarity: "Uncommon", description: "Green biohazard mist." },
  { id: 25, name: "Holy Light", category: "Auras", type: 'aura', key: 'gold', price: 1000, color: "text-yellow-200", bg: "bg-yellow-200/10", rarity: "Epic", description: "Blessed light of the heavens." },
  { id: 26, name: "Shadow Step", category: "Auras", type: 'aura', key: 'glitch', price: 900, color: "text-gray-800", bg: "bg-gray-800/10", rarity: "Rare", description: "Darkness trails your movements." },
  { id: 27, name: "Crystal Shards", category: "Auras", type: 'aura', key: 'neon', price: 1300, color: "text-blue-300", bg: "bg-blue-300/10", rarity: "Legendary", description: "Floating crystal fragments." },
  { id: 28, name: "Crimson Storm", category: "Auras", type: 'aura', key: 'glitch', price: 1600, color: "text-rose-600", bg: "bg-rose-600/10", rarity: "Legendary", description: "A violent red tempest." },
  { id: 29, name: "Golden Leaves", category: "Auras", type: 'aura', key: 'gold', price: 500, color: "text-amber-600", bg: "bg-amber-600/10", rarity: "Rare", description: "Autumn leaves falling eternally." },
  { id: 30, name: "Prismatic Shield", category: "Auras", type: 'aura', key: 'neon', price: 2500, color: "text-pink-300", bg: "bg-pink-300/10", rarity: "Mythic", description: "A rainbow colored energy shield." },
  { id: 31, name: "Abyssal Void", category: "Auras", type: 'aura', key: 'glitch', price: 6000, color: "text-fuchsia-900", bg: "bg-fuchsia-900/50", rarity: "Exotic", description: "The deepest, darkest energy." },

  // Nameplates (15 items)
  { id: 32, name: "Electric Blue Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 300, color: "text-blue-400", bg: "bg-blue-400/10", rarity: "Rare", description: "A vibrant cyan signature for your profile." },
  { id: 33, name: "Gold Elite Tag", category: "Name Plates", type: 'nameplate', key: 'gold', price: 850, color: "text-amber-500", bg: "bg-amber-500/10", rarity: "Legendary", description: "The standard of excellence in the multiverse." },
  { id: 34, name: "Pro Nameplate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 1200, color: "text-purple-400", bg: "bg-purple-500/10", rarity: "Legendary", description: "A gradient nameplate that shifts between purple and pink." },
  { id: 35, name: "Rainbow Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 2500, color: "text-pink-500", bg: "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10", rarity: "Mythic", description: "A nameplate that cycles through all colors." },
  { id: 36, name: "Ruby Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 600, color: "text-red-500", bg: "bg-red-500/10", rarity: "Rare", description: "A deep red nameplate." },
  { id: 37, name: "Emerald Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 600, color: "text-emerald-500", bg: "bg-emerald-500/10", rarity: "Rare", description: "A vibrant green nameplate." },
  { id: 38, name: "Diamond Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 1500, color: "text-cyan-300", bg: "bg-cyan-300/10", rarity: "Mythic", description: "Sparkling diamond texture." },
  { id: 39, name: "Obsidian Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 1000, color: "text-zinc-800", bg: "bg-zinc-800/10", rarity: "Epic", description: "Dark, sleek volcanic glass." },
  { id: 40, name: "Amethyst Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 900, color: "text-fuchsia-400", bg: "bg-fuchsia-400/10", rarity: "Epic", description: "A mysterious purple crystal." },
  { id: 41, name: "Topaz Plate", category: "Name Plates", type: 'nameplate', key: 'gold', price: 700, color: "text-yellow-400", bg: "bg-yellow-400/10", rarity: "Rare", description: "Bright yellow gemstone plate." },
  { id: 42, name: "Sapphire Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 800, color: "text-blue-600", bg: "bg-blue-600/10", rarity: "Epic", description: "Deep blue sea color." },
  { id: 43, name: "Pearl Plate", category: "Name Plates", type: 'nameplate', key: 'blue', price: 1100, color: "text-gray-100", bg: "bg-gray-100/10", rarity: "Legendary", description: "Elegant white iridescent plate." },
  { id: 44, name: "Opal Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 1600, color: "text-teal-200", bg: "bg-teal-200/10", rarity: "Mythic", description: "A shifting, multi-colored pastel plate." },
  { id: 45, name: "Magma Plate", category: "Name Plates", type: 'nameplate', key: 'gold', price: 950, color: "text-orange-600", bg: "bg-orange-600/10", rarity: "Epic", description: "A nameplate that burns." },
  { id: 46, name: "Void Plate", category: "Name Plates", type: 'nameplate', key: 'pro', price: 4000, color: "text-slate-900", bg: "bg-slate-900/50", rarity: "Exotic", description: "A plate that absorbs all light." },

  // Decorations (20 items)
  { id: 47, name: "Space Cat Orbit", category: "Decorations", type: 'decor', key: 'cat', price: 1500, color: "text-rose-500", bg: "bg-rose-500/10", rarity: "Mythic", description: "An animated cat that orbits your identity." },
  { id: 48, name: "Star Trail", category: "Decorations", type: 'decor', key: 'stars', price: 800, color: "text-yellow-400", bg: "bg-yellow-500/10", rarity: "Epic", description: "Tiny stars trail behind your cursor." },
  { id: 49, name: "Lightning Bolt", category: "Decorations", type: 'decor', key: 'lightning', price: 600, color: "text-yellow-500", bg: "bg-yellow-500/10", rarity: "Rare", description: "Electric bolts crackle around your profile." },
  { id: 50, name: "Cherry Blossom", category: "Decorations", type: 'decor', key: 'sakura', price: 1000, color: "text-pink-300", bg: "bg-pink-300/10", rarity: "Legendary", description: "Delicate pink petals float around you." },
  { id: 51, name: "Ghost Pet", category: "Decorations", type: 'decor', key: 'ghost', price: 700, color: "text-gray-300", bg: "bg-gray-300/10", rarity: "Epic", description: "A spooky companion." },
  { id: 52, name: "Skull Pet", category: "Decorations", type: 'decor', key: 'skull', price: 750, color: "text-zinc-100", bg: "bg-zinc-100/10", rarity: "Epic", description: "A cursed skull companion." },
  { id: 53, name: "Mini Bot", category: "Decorations", type: 'decor', key: 'bot', price: 1200, color: "text-blue-300", bg: "bg-blue-300/10", rarity: "Legendary", description: "A helpful little drone." },
  { id: 54, name: "Fireflies", category: "Decorations", type: 'decor', key: 'stars', price: 500, color: "text-lime-400", bg: "bg-lime-400/10", rarity: "Rare", description: "Small glowing bugs." },
  { id: 55, name: "Snowflakes", category: "Decorations", type: 'decor', key: 'stars', price: 500, color: "text-sky-200", bg: "bg-sky-200/10", rarity: "Rare", description: "Falling winter snow." },
  { id: 56, name: "Autumn Leaves", category: "Decorations", type: 'decor', key: 'sakura', price: 550, color: "text-orange-400", bg: "bg-orange-400/10", rarity: "Rare", description: "Crisp autumn foliage." },
  { id: 57, name: "Magic Sparks", category: "Decorations", type: 'decor', key: 'stars', price: 900, color: "text-purple-300", bg: "bg-purple-300/10", rarity: "Epic", description: "Arcane energy sparks." },
  { id: 58, name: "Golden Coins", category: "Decorations", type: 'decor', key: 'stars', price: 1100, color: "text-yellow-400", bg: "bg-yellow-400/10", rarity: "Legendary", description: "Raining wealth." },
  { id: 59, name: "Hearts", category: "Decorations", type: 'decor', key: 'sakura', price: 300, color: "text-red-400", bg: "bg-red-400/10", rarity: "Uncommon", description: "Floating symbols of love." },
  { id: 60, name: "Music Notes", category: "Decorations", type: 'decor', key: 'stars', price: 400, color: "text-zinc-400", bg: "bg-zinc-400/10", rarity: "Rare", description: "Melodies in the air." },
  { id: 61, name: "Bubbles", category: "Decorations", type: 'decor', key: 'stars', price: 250, color: "text-cyan-200", bg: "bg-cyan-200/10", rarity: "Common", description: "Soap bubbles floating up." },
  { id: 62, name: "Butterflies", category: "Decorations", type: 'decor', key: 'sakura', price: 850, color: "text-pink-400", bg: "bg-pink-400/10", rarity: "Epic", description: "Beautiful flying insects." },
  { id: 63, name: "Bats", category: "Decorations", type: 'decor', key: 'ghost', price: 650, color: "text-zinc-800", bg: "bg-zinc-800/10", rarity: "Rare", description: "Creatures of the night." },
  { id: 64, name: "Floating Orbs", category: "Decorations", type: 'decor', key: 'stars', price: 1300, color: "text-indigo-300", bg: "bg-indigo-300/10", rarity: "Legendary", description: "Mysterious glowing spheres." },
  { id: 65, name: "Alien Pet", category: "Decorations", type: 'decor', key: 'bot', price: 1800, color: "text-lime-500", bg: "bg-lime-500/10", rarity: "Mythic", description: "A companion from another world." },
  { id: 66, name: "Dragon Hatchling", category: "Decorations", type: 'decor', key: 'cat', price: 4800, color: "text-red-600", bg: "bg-red-600/20", rarity: "Exotic", description: "A tiny, fire-breathing friend." },

  // Pets (3 items)
  { id: 67, name: "Cyber Wolf", category: "Pets", type: 'pet', key: 'cyberwolf', price: 6000, color: "text-sky-400", bg: "bg-sky-500/10", rarity: "Exotic", description: "A loyal holographic wolf companion." },
  { id: 68, name: "Mini Dragon", category: "Pets", type: 'pet', key: 'minidragon', price: 4500, color: "text-red-500", bg: "bg-red-500/10", rarity: "Mythic", description: "A small fire-breathing dragon." },
  { id: 69, name: "Void Entity", category: "Pets", type: 'pet', key: 'voidentity', price: 8000, color: "text-purple-500", bg: "bg-purple-600/20", rarity: "Exotic", description: "An entity from the deep void." },

  // Banners (3 items)
  { id: 70, name: "Matrix Rain", category: "Banners", type: 'banner', key: 'matrix', price: 2000, color: "text-green-500", bg: "bg-green-500/10", rarity: "Legendary", description: "Falling green code background." },
  { id: 71, name: "Retrowave Sunset", category: "Banners", type: 'banner', key: 'retrowave', price: 2500, color: "text-pink-500", bg: "bg-pink-500/10", rarity: "Mythic", description: "A retro 80s synthwave sunset." },
  { id: 72, name: "Galactic Void", category: "Banners", type: 'banner', key: 'galactic', price: 3500, color: "text-indigo-400", bg: "bg-indigo-500/10", rarity: "Exotic", description: "Stare into the endless galaxy." },
];

export default function ShopPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Weekly");
  const [giftTarget, setGiftTarget] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userRef);
  const balance = userData?.currencyBalance || 0;

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
    const items = [...ALL_SHOP_ITEMS];
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

  const displayedItems = activeCategory === "Weekly" 
    ? weekItems 
    : ALL_SHOP_ITEMS.filter(i => activeCategory === "All" || i.category === activeCategory);

  const [selectedItem, setSelectedItem] = useState(displayedItems[0]);

  useEffect(() => {
      setSelectedItem(displayedItems[0]);
  }, [activeCategory, displayedItems]);

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
      
      await updateDoc(doc(firestore, "users", user.uid), {
        currencyBalance: increment(-selectedItem.price)
      });

      await updateDoc(doc(firestore, "users", targetId), {
        [selectedItem.type]: selectedItem.key
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

  const categories = ["Weekly", "All", "Pets", "Banners", "Auras", "Name Plates", "Hats", "Decorations"];

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

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 py-12 animate-fade-in pb-32 px-6">
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
            {displayedItems.map((item, i) => (
              <motion.div
                key={`${item.id}-${i}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5), type: "spring" }}
              >
              <Card 
                onClick={() => setSelectedItem(item)} 
                className={cn(
                    "glass-card cursor-pointer rounded-[3rem] overflow-hidden transition-all duration-500 group h-full", 
                    selectedItem?.id === item.id 
                        ? cn("scale-[1.02] border-2", getRarityGlow(item.rarity))
                        : "border border-white/5 hover:border-white/20 hover:scale-[1.01]"
                )}
              >
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
                      <User className="w-16 h-16" />}
                  </motion.div>
                  <Badge className={cn("absolute top-6 right-6 border-none text-[10px] font-black uppercase px-3 py-1 shadow-lg", getRarityBadge(item.rarity))}>
                      {item.rarity}
                  </Badge>
                </div>
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter leading-none pr-4">{item.name}</h3>
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 shadow-inner shrink-0">
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500/50" />
                      <span className="text-lg font-black italic">{item.price}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-bold italic line-clamp-2 leading-relaxed opacity-80">{item.description}</p>
                </CardContent>
              </Card>
              </motion.div>
            ))}
            </AnimatePresence>
            {displayedItems.length === 0 && (
                <div className="col-span-2 py-20 text-center">
                    <p className="text-muted-foreground font-black uppercase tracking-widest text-lg">No items found in this category.</p>
                </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-12 space-y-8">
            <Card className="glass-card rounded-[3.5rem] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl relative">
              <RenderBanner bannerKey={selectedItem?.type === 'banner' ? selectedItem.key : userData?.banner} />
              <div className="h-48 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 flex items-start justify-center pt-8 relative overflow-hidden z-10">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)]" />
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50 relative z-10 bg-black/50 px-4 py-1 rounded-full backdrop-blur-md">Live Profile Preview</p>
              </div>
              <CardContent className="p-10 -mt-24 text-center relative z-10">
                <div className="relative rounded-full p-2 mx-auto w-max z-20">
                  <RenderDecor decorKey={selectedItem?.type === 'decor' ? selectedItem.key : userData?.decor} />
                  <RenderAura auraKey={selectedItem?.type === 'aura' ? selectedItem.key : userData?.aura} />
                  <RenderHat hatKey={selectedItem?.type === 'hat' ? selectedItem.key : userData?.hat} />
                  <RenderPet petKey={selectedItem?.type === 'pet' ? selectedItem.key : userData?.pet} />
                  
                  <Avatar className="w-40 h-40 border-[8px] border-card rounded-[3rem] shadow-2xl mx-auto overflow-hidden bg-secondary relative z-20">
                    <AvatarImage src={user?.photoURL || ""} className="object-cover" />
                    <AvatarFallback className="bg-primary text-5xl font-black text-white">{user?.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                <h4 className={cn(
                  "text-4xl font-black tracking-tighter mt-8 italic uppercase leading-none break-words relative z-20",
                  getNameplateClass(selectedItem?.type === 'nameplate' ? selectedItem.key : userData?.nameplate)
                )}>
                  {user?.displayName?.replace(/^@+/, "") || "Member"}
                </h4>
              </CardContent>
              <CardFooter className="p-10 pt-0 flex flex-col gap-4">
                <Button 
                    onClick={handleSyncItem} 
                    disabled={isSyncing || !selectedItem} 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-16 rounded-[2rem] font-black text-lg uppercase italic shadow-[0_10px_30px_rgba(var(--primary),0.3)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(var(--primary),0.4)] active:translate-y-0 active:shadow-none"
                >
                  {isSyncing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Equip Item"}
                </Button>
                
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
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

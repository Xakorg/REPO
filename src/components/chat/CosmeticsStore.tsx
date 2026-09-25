"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Crown,
  Heart,
  Star,
  Gem,
  Palette,
  Monitor,
  BellRing,
  Image as ImageIcon,
  MapPin,
  Plus,
  Check,
  X,
  ArrowRight,
  Gift,
  Zap,
  Firework,
  Lock,
  Coins,
  Tag,
  Shield,
  Wand2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RenderHat } from "@/components/RenderHat";

// ─── Types ────────────────────────────────────────────────────────────

type Rarity = "common" | "rare" | "epic" | "legendary";
type CosmeticsType = "border" | "theme" | "effect" | "animation" | "hat";

interface CosmeticItem {
  id: string;
  name: string;
  type: CosmeticsType;
  rarity: Rarity;
  price: number;
  preview: string; // color or gradient string
  equipped: boolean;
  description: string;
  icon: React.ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────

const RARITY_COLORS: Record<Rarity, string> = {
  common: "border-white/20 text-zinc-400",
  rare: "border-cyan-500/50 text-cyan-400",
  epic: "border-purple-500/50 text-purple-400",
  legendary: "border-amber-400/50 text-amber-400",
};

const RARITY_GLOW: Record<Rarity, string> = {
  common: "",
  rare: "shadow-[0_0_15px_rgba(34,211,238,0.3)]",
  epic: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
  legendary: "shadow-[0_0_30px_rgba(251,191,36,0.4)]",
};

const RARITY_BG: Record<Rarity, string> = {
  common: "bg-white/5",
  rare: "bg-gradient-to-br from-cyan-950/40 to-zinc-950/60",
  epic: "bg-gradient-to-br from-purple-950/40 to-zinc-950/60",
  legendary: "bg-gradient-to-br from-amber-950/40 to-yellow-950/40",
};

const CATALOG: CosmeticItem[] = [
  // Avatar Borders & Frames
  {
    id: "border-nova",
    name: "Nova Border",
    type: "border",
    rarity: "rare",
    price: 50,
    preview: "linear-gradient(135deg, #00e5ff, #00ff88)",
    equipped: false,
    description: "A shimmering cyan-green animated border",
    icon: <Monitor className="w-4 h-4" />,
  },
  {
    id: "border-arcade",
    name: "Arcade Frame",
    type: "border",
    rarity: "epic",
    price: 120,
    preview: "linear-gradient(135deg, #ff00c1, #9333ea, #00e5ff)",
    equipped: false,
    description: "Retro arcade pixel-inspired animated frame",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    id: "border-golden",
    name: "Golden Sovereign",
    type: "border",
    rarity: "legendary",
    price: 300,
    preview: "linear-gradient(135deg, #fbbf24, #f59e0b, #fef08a)",
    equipped: false,
    description: "An ornate golden border with legendary glow",
    icon: <Crown className="w-4 h-4" />,
  },
  {
    id: "border-obsidian",
    name: "Obsidian Edge",
    type: "border",
    rarity: "common",
    price: 20,
    preview: "linear-gradient(135deg, #374151, #1f2937)",
    equipped: false,
    description: "A sleek dark obsidian border",
    icon: <Shield className="w-4 h-4" />,
  },

  // Profile Themes
  {
    id: "theme-cyber",
    name: "Cyber Matrix",
    type: "theme",
    rarity: "rare",
    price: 40,
    preview: "linear-gradient(180deg, #0a0a1a, #00ff88, #00e5ff)",
    equipped: false,
    description: "Green matrix digital rain theme",
    icon: <Monitor className="w-4 h-4" />,
  },
  {
    id: "theme-nebula",
    name: "Nebula Dream",
    type: "theme",
    rarity: "epic",
    price: 100,
    preview: "linear-gradient(180deg, #1a0533, #9333ea, #ff00c1)",
    equipped: false,
    description: "Deep space nebula with purple hues",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: "theme-golden",
    name: "Royal Golden",
    type: "theme",
    rarity: "legendary",
    price: 280,
    preview: "linear-gradient(180deg, #1a0f00, #fbbf24, #f59e0b)",
    equipped: false,
    description: "Regal gold theme with shimmering particles",
    icon: <Gem className="w-4 h-4" />,
  },
  {
    id: "theme-void",
    name: "Void Walker",
    type: "theme",
    rarity: "common",
    price: 15,
    preview: "linear-gradient(180deg, #000000, #0f0a1a)",
    equipped: false,
    description: "Pure darkness with subtle hints",
    icon: <EyeOff className="w-4 h-4" />,
  },

  // Message Effects
  {
    id: "effect-sparkle",
    name: "Sparkle Burst",
    type: "effect",
    rarity: "common",
    price: 25,
    preview: "linear-gradient(90deg, #ffffff, #fbbf24, #ffffff)",
    equipped: false,
    description: "Sparkling particles trail your messages",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: "effect-particle",
    name: "Particle Storm",
    type: "effect",
    rarity: "rare",
    price: 60,
    preview: "linear-gradient(90deg, #00e5ff, #00ff88, #9333ea)",
    equipped: false,
    description: "Full particle storm on every sent message",
    icon: <Firework className="w-4 h-4" />,
  },
  {
    id: "effect-gradient",
    name: "Rainbow Flow",
    type: "effect",
    rarity: "epic",
    price: 150,
    preview: "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #9400d3)",
    equipped: false,
    description: "Full rainbow gradient effect on messages",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    id: "effect-legendary-glow",
    name: "Legendary Radiance",
    type: "effect",
    rarity: "legendary",
    price: 400,
    preview: "linear-gradient(90deg, #fbbf24, #f59e0b, #fef08a, #fbbf24)",
    equipped: false,
    description: "Legendary golden glow that follows your messages",
    icon: <Crown className="w-4 h-4" />,
  },

  // Status Animations
  {
    id: "status-pulse",
    name: "Pulse Heart",
    type: "animation",
    rarity: "common",
    price: 30,
    preview: "linear-gradient(135deg, #ef4444, #f87171)",
    equipped: false,
    description: "Animated pulsing heart next to your status",
    icon: <Heart className="w-4 h-4" />,
  },
  {
    id: "status-stars",
    name: "Stellar Aura",
    type: "animation",
    rarity: "rare",
    price: 70,
    preview: "linear-gradient(135deg, #6366f1, #a78bfa)",
    equipped: false,
    description: "Twinkling star particles around your status",
    icon: <Star className="w-4 h-4" />,
  },
  {
    id: "status-fire",
    name: "Inferno Emoji",
    type: "animation",
    rarity: "epic",
    price: 140,
    preview: "linear-gradient(135deg, #f97316, #ef4444)",
    equipped: false,
    description: "Animated fire emoji with smoke trails",
    icon: <Zap className="w-4 h-4" />,
  },
  {
    id: "status-divine",
    name: "Divine Light",
    type: "animation",
    rarity: "legendary",
    price: 350,
    preview: "linear-gradient(135deg, #fef08a, #fbbf24, #ffffff)",
    equipped: false,
    description: "Divine glowing light animation with celestial particles",
    icon: <Crown className="w-4 h-4" />,
  },

  // Hat Accessories
  {
    id: "hat-pirate",
    name: "Pirate Bandana",
    type: "hat",
    rarity: "common",
    price: 35,
    preview: "linear-gradient(135deg, #8B4513, #A0522D)",
    equipped: false,
    description: "A classic pirate bandana",
    icon: <ImageIcon className="w-4 h-4" />,
  },
  {
    id: "hat-wizard",
    name: "Wizard Hat",
    type: "hat",
    rarity: "rare",
    price: 80,
    preview: "linear-gradient(135deg, #7c3aed, #4c1d95)",
    equipped: false,
    description: "A magical wizard hat with star details",
    icon: <Wand2 className="w-4 h-4" />,
  },
  {
    id: "hat-crown",
    name: "Diamond Crown",
    type: "hat",
    rarity: "epic",
    price: 200,
    preview: "linear-gradient(135deg, #fbbf24, #ffffff, #fbbf24)",
    equipped: false,
    description: "A dazzling diamond-encrusted crown",
    icon: <Crown className="w-4 h-4" />,
  },
  {
    id: "hat-angel",
    name: "Angel Halo",
    type: "hat",
    rarity: "legendary",
    price: 450,
    preview: "linear-gradient(135deg, #fef08a, #ffffff, #fef08a)",
    equipped: false,
    description: "A radiant angelic halo with golden glow",
    icon: <Sparkles className="w-4 h-4" />,
  },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: <Sparkles className="w-4 h-4" /> },
  { id: "border", label: "Borders", icon: <Monitor className="w-4 h-4" /> },
  { id: "theme", label: "Themes", icon: <Palette className="w-4 h-4" /> },
  { id: "effect", label: "Effects", icon: <Firework className="w-4 h-4" /> },
  { id: "animation", label: "Status", icon: <BellRing className="w-4 h-4" /> },
  { id: "hat", label: "Hats", icon: <ImageIcon className="w-4 h-4" /> },
];

// ─── Component ────────────────────────────────────────────────────────

interface CosmeticsStoreProps {
  open: boolean;
  onClose: () => void;
}

export function CosmeticsStore({ open, onClose }: CosmeticsStoreProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [equippedItems, setEquippedItems] = useState<string[]>([]);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [credits, setCredits] = useState(0);
  const [previewEquipped, setPreviewEquipped] = useState<string | null>(null);
  const [isPurchaseAnimating, setIsPurchaseAnimating] = useState(false);

  // Firestore references
  const cosmeticsDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid, "cosmetics", "profile");
  }, [firestore, user]);

  const creditsDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid, "credits", "balance");
  }, [firestore, user]);

  const { data: cosmeticsData } = useDoc(cosmeticsDocRef);
  const { data: creditsData } = useDoc(creditsDocRef);

  // Sync data from Firestore
  useEffect(() => {
    if (cosmeticsData) {
      setEquippedItems(cosmeticsData.equipped || []);
      setOwnedItems(cosmeticsData.owned || []);
    }
  }, [cosmeticsData]);

  useEffect(() => {
    if (creditsData) {
      setCredits(creditsData.amount || 0);
    }
  }, [creditsData]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (activeTab === "all") return CATALOG;
    return CATALOG.filter((item) => item.type === activeTab);
  }, [activeTab]);

  // Check if item is owned
  const isOwned = useCallback(
    (itemId: string) => ownedItems.includes(itemId),
    [ownedItems]
  );

  // Check if item is equipped
  const isEquipped = useCallback(
    (itemId: string) => equippedItems.includes(itemId),
    [equippedItems]
  );

  // Equip / Unequip handler
  const handleEquip = useCallback(
    async (itemId: string) => {
      if (!firestore || !user) return;

      const currentlyEquipped = isEquipped(itemId);

      if (currentlyEquipped) {
        // Unequip
        const newEquipped = equippedItems.filter((id) => id !== itemId);
        addDocumentNonBlocking(collection(firestore, "users", user.uid, "cosmetics"), {
          equipped: newEquipped,
          updatedAt: new Date(),
        });
        setEquippedItems(newEquipped);
        setPreviewEquipped(null);
        toast({ title: "Unequipped", description: "Cosmetic removed from active slot." });
      } else if (!isOwned(itemId)) {
        // Purchase
        const item = CATALOG.find((i) => i.id === itemId);
        if (!item) return;

        if (credits < item.price) {
          toast({
            title: "Insufficient Credits",
            description: `You need ${item.price} Xakteir Credits for this item.`,
          });
          return;
        }

        // Deduct credits
        const newCredits = credits - item.price;
        setCredits(newCredits);
        addDocumentNonBlocking(collection(firestore, "users", user.uid, "credits"), {
          amount: newCredits,
          updatedAt: new Date(),
        });

        // Add to owned
        const newOwned = [...ownedItems, itemId];
        setOwnedItems(newOwned);

        // Equip it
        const newEquipped = [...equippedItems, itemId];
        setEquippedItems(newEquipped);
        setPreviewEquipped(itemId);

        setIsPurchaseAnimating(true);
        setTimeout(() => setIsPurchaseAnimating(false), 1500);

        addDocumentNonBlocking(collection(firestore, "users", user.uid, "cosmetics"), {
          owned: newOwned,
          equipped: newEquipped,
          updatedAt: new Date(),
        });

        toast({
          title: "Purchase Complete!",
          description: `Equipped ${item.name} successfully.`,
        });
      } else {
        // Equip owned item
        const newEquipped = [...equippedItems, itemId];
        setEquippedItems(newEquipped);
        setPreviewEquipped(itemId);

        addDocumentNonBlocking(collection(firestore, "users", user.uid, "cosmetics"), {
          equipped: newEquipped,
          updatedAt: new Date(),
        });

        toast({ title: "Equipped!", description: `${CATALOG.find((i) => i.id === itemId)?.name} is now active.` });
      }
    },
    [firestore, user, equippedItems, ownedItems, credits, isEquipped]
  );

  // Get equipped cosmetic type previews
  const equippedBorder = equippedItems.find((id) => CATALOG.find((i) => i.id === id && i.type === "border"));
  const equippedTheme = equippedItems.find((id) => CATALOG.find((i) => i.id === id && i.type === "theme"));
  const equippedHat = equippedItems.find((id) => CATALOG.find((i) => i.id === id && i.type === "hat"));

  const currentBorderItem = equippedBorder ? CATALOG.find((i) => i.id === equippedBorder) : null;
  const currentThemeItem = equippedTheme ? CATALOG.find((i) => i.id === equippedTheme) : null;
  const currentHatItem = equippedHat ? CATALOG.find((i) => i.id === equippedHat) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className={cn(
          "bg-zinc-950/95 backdrop-blur-2xl border border-white/10 text-white max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden p-0",
          isPurchaseAnimating && "animate-pulse"
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Avatar & Status Cosmetics Store</DialogTitle>
          <DialogDescription>Purchase and equip cosmetic items for your avatar.</DialogDescription>
        </DialogHeader>

        <div className="flex h-[85vh] flex-col">
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="w-6 h-6 text-amber-400" />
                {isPurchaseAnimating && (
                  <motion.div
                    className="absolute inset-0 text-amber-400"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.6 }}
                  >
                    <Star className="w-6 h-6 fill-amber-400" />
                  </motion.div>
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Cosmetics Store
                </DialogTitle>
                <p className="text-[10px] text-zinc-500">Avatar & Status Cosmetics</p>
              </div>
            </div>

            {/* Credits Balance */}
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-amber-500/20 rounded-full px-4 py-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-amber-400 text-sm">{credits}</span>
              <span className="text-[10px] text-zinc-500">Xakteir Credits</span>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white hover:bg-white/5">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* ── Left Panel: Preview Area ── */}
            <div className="w-72 border-r border-white/10 bg-zinc-950/50 p-4 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-3 h-3" /> Preview
              </h3>

              {/* Avatar Preview */}
              <motion.div
                className={cn(
                  "relative mx-auto w-32 h-40 rounded-2xl bg-zinc-900 border overflow-hidden flex items-end justify-center",
                  currentBorderItem && RARITY_GLOW[currentBorderItem.rarity]
                )}
                style={currentBorderItem ? { borderColor: currentBorderItem.preview, boxShadow: `0 0 20px ${currentBorderItem.preview}30` } : {}}
                animate={isPurchaseAnimating ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                {/* Background Theme */}
                {currentThemeItem && (
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{ background: currentThemeItem.preview }}
                  />
                )}

                {/* Avatar Base */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-zinc-400">
                      {user?.displayName?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>

                {/* Hat */}
                {currentHatItem && (
                  <motion.div
                    className="absolute -top-4 left-1/2 -translate-x-1/2"
                    animate={currentHatItem.rarity === "legendary" ? { y: [0, -2, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {currentHatItem.rarity === "legendary" ? (
                      <Crown className="w-10 h-10 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                    ) : (
                      <div
                        className="w-10 h-8 rounded-full mx-auto"
                        style={{ background: currentHatItem.preview, boxShadow: `0 0 10px ${currentHatItem.preview}50` }}
                      />
                    )}
                  </motion.div>
                )}

                {/* Rarity glow for legendary */}
                {currentHatItem?.rarity === "legendary" && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-amber-400/50"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                {/* Rare gradient shimmer */}
                {currentHatItem?.rarity === "rare" && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Equipped badge */}
                {equippedItems.length > 0 && (
                  <motion.div
                    className="absolute top-2 right-2 bg-emerald-500/80 rounded-full p-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.div>

              {/* Equipped Items Summary */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Equipped</h4>
                {equippedItems.length === 0 ? (
                  <p className="text-[11px] text-zinc-600 italic">No items equipped</p>
                ) : (
                  <div className="space-y-1">
                    {equippedItems.map((itemId) => {
                      const item = CATALOG.find((i) => i.id === itemId);
                      if (!item) return null;
                      return (
                        <motion.div
                          key={itemId}
                          className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/5 text-[11px]"
                          layout
                        >
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ background: item.preview }}
                          />
                          <span className="text-zinc-300 truncate">{item.name}</span>
                          <Badge
                            variant="outline"
                            className={cn("ml-auto text-[8px] border", RARITY_COLORS[item.rarity])}
                          >
                            {item.rarity}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Credits Earning Section */}
              <div className="mt-auto border border-white/10 rounded-xl bg-zinc-900/50 p-3">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Gift className="w-3 h-3 text-emerald-400" /> Earn Credits
                </h4>
                <div className="space-y-1.5">
                  {[
                    { label: "Send a message", amount: "+5", icon: <Heart className="w-3 h-3 text-red-400" /> },
                    { label: "Voice time (1 min)", amount: "+2", icon: <Zap className="w-3 h-3 text-yellow-400" /> },
                    { label: "Daily login", amount: "+10", icon: <Star className="w-3 h-3 text-amber-400" /> },
                    { label: "Invite a friend", amount: "+25", icon: <Plus className="w-3 h-3 text-cyan-400" /> },
                  ].map((earning) => (
                    <div key={earning.label} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 text-zinc-400">
                        {earning.icon}
                        <span>{earning.label}</span>
                      </div>
                      <span className="text-emerald-400 font-bold">{earning.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Panel: Store Grid ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Category Tabs */}
              <div className="px-4 py-3 border-b border-white/10 bg-zinc-950/50 shrink-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-zinc-900/80 border border-white/10 p-1 w-full justify-start gap-1 overflow-x-auto">
                    {CATEGORIES.map((cat) => (
                      <TabsTrigger
                        key={cat.id}
                        value={cat.id}
                        className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-zinc-400 text-[10px] px-2 py-1.5 rounded-md whitespace-nowrap transition-all"
                      >
                        {cat.icon}
                        <span className="ml-1">{cat.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Store Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                  >
                    {filteredItems.map((item) => {
                      const owned = isOwned(item.id);
                      const equipped = isEquipped(item.id);
                      const canAfford = credits >= item.price;
                      const isLegendary = item.rarity === "legendary";
                      const isRare = item.rarity === "rare";
                      const isEpic = item.rarity === "epic";

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            "relative rounded-xl border overflow-hidden group cursor-pointer transition-all",
                            RARITY_BG[item.rarity],
                            RARITY_GLOW[item.rarity],
                            RARITY_COLORS[item.rarity],
                            equipped && "ring-2 ring-emerald-500/50 ring-offset-1 ring-offset-zinc-950",
                            isLegendary && "animate-pulse" style={{ animationDuration: "3s" }}
                          )}
                          style={isLegendary ? { animationDuration: "3s" } : {}}
                          onClick={() => handleEquip(item.id)}
                        >
                          {/* Rarity border glow */}
                          {isLegendary && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/10 via-transparent to-transparent animate-spin-slow" style={{ animationDuration: '8s' }} />
                          )}
                          {isRare && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
                          )}
                          {isEpic && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-purple-400/10 to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
                          )}

                          {/* Preview gradient */}
                          <div className="relative h-24 bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center overflow-hidden">
                            <div
                              className="absolute inset-0 opacity-60"
                              style={{ background: item.preview }}
                            />
                            <div className="relative z-10">
                              {item.type === "hat" ? (
                                <Crown className="w-8 h-8 text-white/80 drop-shadow-lg" />
                              ) : (
                                item.icon
                              )}
                            </div>
                            {/* Rarity badge */}
                            <div className="absolute top-2 right-2">
                              <Badge variant="outline" className={cn("text-[8px] border font-bold uppercase", RARITY_COLORS[item.rarity])}>
                                {item.rarity}
                              </Badge>
                            </div>
                            {/* Equipped check */}
                            {equipped && (
                              <motion.div
                                className="absolute top-2 left-2 bg-emerald-500 rounded-full p-1"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                            {/* Locked overlay for unowned */}
                            {!owned && !equipped && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-center">
                                  <Lock className="w-6 h-6 text-white/80 mx-auto mb-1" />
                                  <p className="text-[10px] text-white/80">Purchase</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Item info */}
                          <div className="p-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-[11px] font-bold text-white truncate">{item.name}</h4>
                              <span className="text-[10px] font-bold text-amber-400 whitespace-nowrap flex items-center gap-0.5">
                                <Coins className="w-3 h-3" />
                                {item.price}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 line-clamp-1 leading-tight">{item.description}</p>
                            {/* Equip button */}
                            <Button
                              variant={equipped ? "secondary" : "outline"}
                              size="sm"
                              className={cn(
                                "w-full text-[10px] h-7 mt-1",
                                equipped
                                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                                  : !owned
                                  ? canAfford
                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                    : "bg-zinc-800/50 border-zinc-700 text-zinc-500 cursor-not-allowed"
                                  : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                              )}
                              disabled={!owned && !canAfford && !equipped}
                            >
                              {equipped ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" /> Equipped
                                </>
                              ) : !owned ? (
                                canAfford ? (
                                  <>
                                    <Plus className="w-3 h-3 mr-1" /> Buy & Equip
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3 mr-1" /> Need {item.price - credits} more
                                  </>
                                )
                              ) : (
                                <>
                                  <ArrowRight className="w-3 h-3 mr-1" /> Equip
                                </>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>

                {filteredItems.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
                    No items in this category yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Trophy,
  Coins,
  Flame,
  Zap,
  Star,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  Timestamp,
} from "firebase/firestore";

// ─── Types ──────────────────────────────────────────────────────
interface CreditsData {
  balance: number;
  dailyCheckinDate: string | null;
  streak: number;
  totalEarned: number;
  totalSpent: number;
}

interface Transaction {
  id: string;
  type: "earn" | "spend";
  amount: number;
  reason: string;
  timestamp: Timestamp;
  balanceAfter: number;
}

interface LeaderboardEntry {
  id: string;
  displayName: string;
  photoURL: string;
  credits: number;
}

interface EarningActivity {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  current: number;
  goal: number;
  reward: number;
}

// ─── Constants ──────────────────────────────────────────────────
const DAILY_BONUS_BASE = 10;
const STREAK_MULTIPLIER = 1.5;
const CHECKIN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Component ──────────────────────────────────────────────────
interface CreditsRewardsProps {
  open: boolean;
  onClose: () => void;
}

export function CreditsRewards({ open, onClose }: CreditsRewardsProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("earn");
  const [animatingCoins, setAnimatingCoins] = useState(false);
  const [coinFlipKey, setCoinFlipKey] = useState(0);
  const [spendAmount, setSpendAmount] = useState("");
  const [spendTarget, setSpendTarget] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);

  // ─── Firestore References ────────────────────────────────────
  const userCreditsRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid, "credits");
  }, [firestore, user]);

  const userCreditsDoc = useDoc<CreditsData>(
    useMemoFirebase(() => userCreditsRef, [userCreditsRef])
  );

  const userTransactionsRef = useMemo(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "transactions");
  }, [firestore, user]);

  const transactionsQuery = useMemo(() => {
    if (!userTransactionsRef) return null;
    return query(userTransactionsRef, orderBy("timestamp", "desc"), limit(50));
  }, [userTransactionsRef]);

  const transactions = useCollection<Transaction>(
    useMemoFirebase(() => transactionsQuery, [transactionsQuery])
  );

  const leaderboardQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "servers", "global", "leaderboard"),
      orderBy("credits", "desc"),
      limit(10)
    );
  }, [firestore]);

  const leaderboard = useCollection<LeaderboardEntry>(
    useMemoFirebase(() => leaderboardQuery, [leaderboardQuery])
  );

  // ─── Computed Values ─────────────────────────────────────────
  const balance = userCreditsDoc.data?.balance ?? 0;
  const streak = userCreditsDoc.data?.streak ?? 0;
  const dailyCheckinDate = userCreditsDoc.data?.dailyCheckinDate;
  const totalEarned = userCreditsDoc.data?.totalEarned ?? 0;
  const totalSpent = userCreditsDoc.data?.totalSpent ?? 0;

  const canCheckin = useMemo(() => {
    if (!dailyCheckinDate) return true;
    const lastCheckin = new Date(dailyCheckinDate);
    const now = new Date();
    const diff = now.getTime() - lastCheckin.getTime();
    return diff >= CHECKIN_COOLDOWN_MS;
  }, [dailyCheckinDate]);

  const today = new Date().toISOString().split("T")[0];
  const checkedInToday = dailyCheckinDate === today;

  // ─── Earning Activities ──────────────────────────────────────
  const earningActivities = useMemo<EarningActivity[]>(() => {
    const messagesSent = Math.floor(balance / 10) * 10; // Placeholder - would come from actual user stats
    return [
      {
        id: "messages",
        name: "Messages Sent",
        icon: <ChatBubbleMore />, // Using inline placeholder
        description: "Earn 1 credit per 10 messages sent",
        current: Math.floor(Math.random() * 50), // Placeholder
        goal: 10,
        reward: 1,
      },
      {
        id: "voice",
        name: "Voice Channel Time",
        icon: <Headphones />,
        description: "Earn 1 credit per 5 minutes in voice",
        current: Math.floor(Math.random() * 15),
        goal: 5,
        reward: 1,
      },
      {
        id: "reactions",
        name: "Reactions Given",
        icon: <HappyFace />,
        description: "Earn 1 credit per 20 reactions",
        current: Math.floor(Math.random() * 80),
        goal: 20,
        reward: 1,
      },
      {
        id: "dms",
        name: "DMs Sent",
        icon: <MailOpen />,
        description: "Earn 2 credits per DM sent",
        current: Math.floor(Math.random() * 6),
        goal: 1,
        reward: 2,
      },
      {
        id: "events",
        name: "Server Events",
        icon: <CalendarDays />,
        description: "5 credits for participating in events",
        current: Math.random() > 0.5 ? 1 : 0,
        goal: 1,
        reward: 5,
      },
    ];
  }, [balance]);

  // ─── Daily Bonus Calculation ─────────────────────────────────
  const dailyBonus = useMemo(() => {
    return Math.floor(DAILY_BONUS_BASE * (1 + (streak * (STREAK_MULTIPLIER - 1))));
  }, [streak]);

  // ─── Handlers ────────────────────────────────────────────────
  const handleDailyCheckin = useCallback(async () => {
    if (!checkedInToday || !canCheckin || !user || !firestore || checkinLoading) return;

    setCheckinLoading(true);
    try {
      await updateDocumentNonBlocking(doc(firestore, "users", user.uid, "credits"), {
        dailyCheckinDate: today,
        streak: checkedInToday ? streak + 1 : 1,
        balance: (userCreditsDoc.data?.balance ?? 0) + dailyBonus,
        totalEarned: (userCreditsDoc.data?.totalEarned ?? 0) + dailyBonus,
      });

      await addDocumentNonBlocking(collection(firestore, "users", user.uid, "transactions"), {
        type: "earn",
        amount: dailyBonus,
        reason: checkedInToday ? "Daily bonus streak!" : "Daily check-in bonus",
        timestamp: serverTimestamp(),
        balanceAfter: (userCreditsDoc.data?.balance ?? 0) + dailyBonus,
      });

      // Trigger coin animation
      setCoinFlipKey((k) => k + 1);
      setAnimatingCoins(true);
      setTimeout(() => setAnimatingCoins(false), 1500);

      toast({
        title: "🎉 Daily Bonus!",
        description: `+${dailyBonus} Xakteir Credits${streak > 0 ? ` (${(streak + 1)}x streak!)` : ""}`,
      });
    } catch (e) {
      console.error("Checkin failed:", e);
      toast({ variant: "destructive", title: "Check-in Failed", description: "Please try again." });
    } finally {
      setCheckinLoading(false);
    }
  }, [checkedInToday, canCheckin, user, firestore, dailyBonus, streak, checkinLoading, userCreditsDoc.data, toast]);

  const handleEarnCredits = useCallback(
    async (activityId: string) => {
      if (!user || !firestore) return;
      const activity = earningActivities.find((a) => a.id === activityId);
      if (!activity || activity.current < activity.goal) return;

      try {
        await updateDocumentNonBlocking(doc(firestore, "users", user.uid, "credits"), {
          balance: (userCreditsDoc.data?.balance ?? 0) + activity.reward,
          totalEarned: (userCreditsDoc.data?.totalEarned ?? 0) + activity.reward,
        });

        await addDocumentNonBlocking(collection(firestore, "users", user.uid, "transactions"), {
          type: "earn",
          amount: activity.reward,
          reason: `Earned from ${activity.name}`,
          timestamp: serverTimestamp(),
          balanceAfter: (userCreditsDoc.data?.balance ?? 0) + activity.reward,
        });

        setCoinFlipKey((k) => k + 1);
        setAnimatingCoins(true);
        setTimeout(() => setAnimatingCoins(false), 1500);

        toast({
          title: "Credits Earned!",
          description: `+${activity.reward} Xakteir Credits from ${activity.name}`,
        });
      } catch (e) {
        console.error("Earn failed:", e);
        toast({ variant: "destructive", title: "Earn Failed", description: "Please try again." });
      }
    },
    [user, firestore, earningActivities, userCreditsDoc.data, toast]
  );

  const handleSpendCredits = useCallback(async () => {
    const amount = parseInt(spendAmount, 10);
    if (!amount || amount <= 0 || !user || !firestore) return;
    if (amount > balance) {
      toast({ variant: "destructive", title: "Insufficient Credits", description: "You don't have enough Xakteir Credits." });
      return;
    }

    try {
      const newBalance = balance - amount;
      await updateDocumentNonBlocking(doc(firestore, "users", user.uid, "credits"), {
        balance: newBalance,
        totalSpent: (userCreditsDoc.data?.totalSpent ?? 0) + amount,
      });

      await addDocumentNonBlocking(collection(firestore, "users", user.uid, "transactions"), {
        type: "spend",
        amount,
        reason: spendTarget || "Purchase",
        timestamp: serverTimestamp(),
        balanceAfter: newBalance,
      });

      setCoinFlipKey((k) => k + 1);
      setAnimatingCoins(true);
      setTimeout(() => setAnimatingCoins(false), 1500);

      setSpendAmount("");
      setSpendTarget("");

      toast({
        title: "Credits Spent!",
        description: `-${amount} Xakteir Credits on ${spendTarget || "purchase"}`,
      });
    } catch (e) {
      console.error("Spend failed:", e);
      toast({ variant: "destructive", title: "Spend Failed", description: "Please try again." });
    }
  }, [spendAmount, spendTarget, balance, user, firestore, userCreditsDoc.data, toast]);

  const handleRefresh = useCallback(async () => {
    if (!user || !firestore) return;
    try {
      await updateDocumentNonBlocking(doc(firestore, "users", user.uid, "credits"), {
        balance: (userCreditsDoc.data?.balance ?? 0) + 5,
        totalEarned: (userCreditsDoc.data?.totalEarned ?? 0) + 5,
      });
      await addDocumentNonBlocking(collection(firestore, "users", user.uid, "transactions"), {
        type: "earn",
        amount: 5,
        reason: "Refreshed credits",
        timestamp: serverTimestamp(),
        balanceAfter: (userCreditsDoc.data?.balance ?? 0) + 5,
      });
      toast({ title: "Refreshed!", description: "+5 Xakteir Credits" });
    } catch (e) {
      toast({ variant: "destructive", title: "Refresh Failed", description: "Try again." });
    }
  }, [user, firestore, userCreditsDoc.data, toast]);

  // ─── Animated Counter ────────────────────────────────────────
  const [displayBalance, setDisplayBalance] = useState(balance);
  useEffect(() => {
    const start = displayBalance;
    const end = balance;
    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayBalance(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [balance]);

  // ─── Render Helpers ──────────────────────────────────────────
  const renderEarnContent = () => (
    <div className="space-y-4">
      {/* Daily Bonus */}
      <Card className="bg-zinc-950/80 border-white/10 glass-panel">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                {streak > 0 && (
                  <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-rose-500/90 px-1.5 py-0.5 rounded-full">
                    <Flame className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white">{streak}</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm">Daily Bonus</h4>
                <p className="text-xs text-zinc-400">
                  {checkedInToday ? "✓ Checked in today!" : canCheckin ? "Check in for bonus" : "Coming tomorrow"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-400">+{dailyBonus}</p>
              <Badge variant="secondary" className="text-[10px]">
                {streak > 0 ? `${streak}x streak` : "Day 1"}
              </Badge>
            </div>
          </div>

          <AnimatePresence>
            {animatingCoins && (
              <motion.div
                key={coinFlipKey}
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                exit={{ scale: 0, rotateY: -180 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="flex justify-center mt-3"
              >
                <div className="text-3xl">🪙</div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleDailyCheckin}
            disabled={checkedInToday || !canCheckin || checkinLoading}
            className={cn(
              "w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:opacity-90",
              (checkedInToday || !canCheckin) && "opacity-50 cursor-not-allowed"
            )}
            variant="default"
          >
            {checkedInToday ? (
              <><Check className="w-4 h-4 mr-2" />Checked In</>
            ) : checkinLoading ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Claim Daily Bonus</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Earning Activities */}
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <Award className="w-4 h-4 text-primary" /> Earning Activities
      </h3>
      <div className="space-y-2">
        {earningActivities.map((activity) => {
          const progress = Math.min((activity.current / activity.goal) * 100, 100);
          const canEarn = activity.current >= activity.goal;
          return (
            <Card key={activity.id} className="bg-zinc-950/60 border-white/10 glass-panel">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {activity.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{activity.name}</p>
                      <p className="text-[10px] text-zinc-500">{activity.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                      +{activity.reward}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                      initial={false}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 w-12 text-right">
                    {activity.current}/{activity.goal}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEarnCredits(activity.id)}
                    disabled={!canEarn}
                    className={cn(
                      "h-7 px-3 text-xs",
                      canEarn
                        ? "bg-primary/20 text-primary hover:bg-primary/30"
                        : "text-zinc-600 cursor-not-allowed"
                    )}
                  >
                    {canEarn ? "Collect" : "Locked"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderSpendContent = () => (
    <div className="space-y-4">
      {/* Spend Credits Panel */}
      <Card className="bg-zinc-950/80 border-white/10 glass-panel">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" /> Spend Your Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "🎨 Custom Emoji", cost: 50 },
              { name: "🌈 Profile Theme", cost: 100 },
              { name: "🎵 Sound Effect Pack", cost: 75 },
              { name: "💎 Chat Bubble", cost: 30 },
              { name: "⚡ Boost 1hr", cost: 200 },
              { name: "👑 VIP Badge", cost: 500 },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setSpendTarget(item.name.split(" ").slice(1).join(" "));
                  setSpendAmount(item.cost.toString());
                }}
                className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 hover:border-primary/30 transition-all text-left group"
              >
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{item.name}</p>
                <p className="text-xs text-amber-400 mt-1">{item.cost} credits</p>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Amount"
              type="number"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              className="bg-zinc-900 border-white/10 text-white placeholder:text-zinc-500"
            />
            <Input
              placeholder="Item name"
              value={spendTarget}
              onChange={(e) => setSpendTarget(e.target.value)}
              className="bg-zinc-900 border-white/10 text-white placeholder:text-zinc-500 flex-1"
            />
          </div>

          <Button
            onClick={handleSpendCredits}
            disabled={!spendAmount || parseInt(spendAmount, 10) <= 0 || parseInt(spendAmount, 10) > balance}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 border-0 hover:opacity-90"
            variant="default"
          >
            <ArrowDownRight className="w-4 h-4 mr-2" />
            Spend {spendAmount ? parseInt(spendAmount, 10) : 0} Credits
          </Button>
        </CardContent>
      </Card>

      {/* Quick Spend */}
      <div className="flex gap-2">
        {[10, 25, 50, 100].map((val) => (
          <Button
            key={val}
            variant="outline"
            size="sm"
            onClick={() => setSpendAmount(val.toString())}
            disabled={val > balance}
            className={cn(
              "flex-1 border-white/10 text-zinc-400",
              val > balance && "opacity-30 cursor-not-allowed"
            )}
          >
            {val}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderHistoryContent = () => (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-zinc-950/80 border-white/10 glass-panel">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase">Earned</p>
            <p className="text-lg font-bold text-emerald-400">+{totalEarned}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950/80 border-white/10 glass-panel">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase">Spent</p>
            <p className="text-lg font-bold text-rose-400">-{totalSpent}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950/80 border-white/10 glass-panel">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase">Net</p>
            <p className="text-lg font-bold text-primary">{totalEarned - totalSpent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {transactions.isLoading && (
          <div className="text-center text-zinc-500 text-sm py-8">Loading transactions...</div>
        )}
        {!transactions.data || transactions.data.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-8">No transactions yet.</div>
        ) : (
          transactions.data.map((tx, idx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center justify-between bg-zinc-950/60 border border-white/5 rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  tx.type === "earn" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                  {tx.type === "earn" ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{tx.reason}</p>
                  <p className="text-[10px] text-zinc-500">
                    {tx.timestamp?.toDate().toLocaleString() ?? ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-sm font-bold",
                  tx.type === "earn" ? "text-emerald-400" : "text-rose-400"
                )}>
                  {tx.type === "earn" ? "+" : "-"}{tx.amount}
                </p>
                <p className="text-[10px] text-zinc-500">Balance: {tx.balanceAfter}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  const renderLeaderboardContent = () => (
    <div className="space-y-2">
      {leaderboard.isLoading && (
        <div className="text-center text-zinc-500 text-sm py-8">Loading leaderboard...</div>
      )}
      {!leaderboard.data || leaderboard.data.length === 0 ? (
        <div className="text-center text-zinc-500 text-sm py-8">No leaderboard data.</div>
      ) : (
        leaderboard.data.map((entry, idx) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "flex items-center gap-3 bg-zinc-950/60 border rounded-xl p-3",
              idx === 0
                ? "border-amber-500/30 bg-amber-500/5"
                : idx === 1
                ? "border-slate-300/30 bg-slate-300/5"
                : idx === 2
                ? "border-amber-700/30 bg-orange-500/5"
                : "border-white/5"
            )}
          >
            <div className="w-8 flex justify-center">
              {idx === 0 ? (
                <Trophy className="w-5 h-5 text-amber-400" />
              ) : idx === 1 ? (
                <Trophy className="w-5 h-5 text-slate-300" />
              ) : idx === 2 ? (
                <Trophy className="w-5 h-5 text-orange-600" />
              ) : (
                <span className="text-sm font-bold text-zinc-500">{idx + 1}</span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
              <AvatarFallback>{entry.displayName[0]}</AvatarFallback>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{entry.displayName}</p>
              {idx < 3 && (
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Top {idx + 1}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Coins className="w-4 h-4" />
              <span className="font-bold text-sm">{entry.credits}</span>
            </div>
          </motion.div>
        ))
      )}

      {/* Your Rank */}
      <Card className="bg-zinc-950/80 border-white/10 glass-panel mt-4">
        <CardContent className="p-3">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" /> Your Ranking
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                {user?.displayName?.[0] ?? "?"}
              </div>
              <div>
                <p className="text-sm font-medium">{user?.displayName ?? "User"}</p>
                <p className="text-[10px] text-zinc-500">{user?.uid ?? ""}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{balance}</p>
              <Badge variant="outline" className="text-[10px]">
                #{(leaderboard.data ?? []).length + 1}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Main Render ─────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-lg bg-zinc-950 border border-white/10 glass-panel shadow-2xl rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Xakteir Credits</h2>
                    <p className="text-xs text-zinc-400">Virtual Currency System</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleRefresh} className="text-zinc-400 hover:text-white hover:bg-white/10">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Balance Display */}
              <div className="p-4 border-b border-white/10">
                <motion.div
                  key={coinFlipKey}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Coins className="w-8 h-8 text-amber-400" />
                      {animatingCoins && (
                        <motion.div
                          animate={{ rotateY: [0, 180, 360] }}
                          transition={{ duration: 0.8 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <SparklesIcon />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider">Your Balance</p>
                      <motion.p
                        key={displayBalance}
                        className="text-3xl font-black text-amber-400"
                      >
                        {displayBalance.toLocaleString()}
                      </motion.p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      +{totalEarned} earned
                    </Badge>
                    <div className="mt-1">
                      <Badge variant="secondary" className="bg-rose-500/10 text-rose-400 border-rose-500/20">
                        -{totalSpent} spent
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mx-4 mt-4 bg-zinc-900 border border-white/10">
                  {[
                    { id: "earn", label: "Earn", icon: <Award className="w-3.5 h-3.5" /> },
                    { id: "spend", label: "Spend", icon: <Gift className="w-3.5 h-3.5" /> },
                    { id: "history", label: "History", icon: <Clock className="w-3.5 h-3.5" /> },
                    { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="w-3.5 h-3.5" /> },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5"
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Tab Content */}
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      {activeTab === "earn" && renderEarnContent()}
                      {activeTab === "spend" && renderSpendContent()}
                      {activeTab === "history" && renderHistoryContent()}
                      {activeTab === "leaderboard" && renderLeaderboardContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Tabs>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Inline Icon Components (Lucide-style, since we can't import all) ──
function ChatBubbleMore() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M12 8h.01" /><path d="M16 8h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" />
    </svg>
  );
}
function Headphones() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}
function HappyFace() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
  );
}
function MailOpen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M2 3h20v14H2z" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function CalendarDays() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
function AvatarFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-bold text-zinc-400">
      {children}
    </div>
  );
}

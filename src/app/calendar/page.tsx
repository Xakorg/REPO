"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Target, 
  Loader2,
  CheckCircle2,
  Trash2,
  CalendarCheck,
  TrendingUp,
  Award,
  ListTodo
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type GoalCategory = "work" | "personal" | "health" | "learning";

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string; // YYYY-MM-DD
  category: GoalCategory;
  milestones: Milestone[];
  progress: number;
}

const CATEGORY_COLORS: Record<GoalCategory, { bg: string, border: string, text: string, dot: string }> = {
  work: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-500" },
  personal: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400", dot: "bg-pink-500" },
  health: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500" },
  learning: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-500" }
};

export default function XakteirPlanPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New goal form state
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalCat, setGoalCat] = useState<GoalCategory>("work");
  const [goalTargetDate, setGoalTargetDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [milestonesText, setMilestonesText] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Fetch user goals
  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "plan_goals"), orderBy("timestamp", "desc"));
  }, [firestore, user]);

  const { data: dbGoals, isLoading } = useCollection(goalsQuery);

  const goals = useMemo(() => {
    return (dbGoals || []) as Goal[];
  }, [dbGoals]);

  // Generate calendar days (including trailing days of previous/next weeks)
  const days = useMemo(() => {
    const startMonthDay = startOfMonth(currentDate);
    const endMonthDay = endOfMonth(currentDate);
    const startWeekDay = startOfWeek(startMonthDay);
    const endWeekDay = endOfWeek(endMonthDay);
    return eachDayOfInterval({ start: startWeekDay, end: endWeekDay });
  }, [currentDate]);

  const handleCreateGoal = async () => {
    if (!user || !firestore || !goalTitle.trim()) return;

    const milestonesList = milestonesText
      .split("\n")
      .filter(line => line.trim() !== "")
      .map((line, idx) => ({
        id: `m-${Date.now()}-${idx}`,
        title: line.trim(),
        completed: false
      }));

    try {
      const goalsRef = collection(firestore, "users", user.uid, "plan_goals");
      await addDocumentNonBlocking(goalsRef, {
        title: goalTitle,
        description: goalDesc,
        category: goalCat,
        targetDate: goalTargetDate,
        milestones: milestonesList,
        progress: 0,
        timestamp: serverTimestamp()
      });

      toast({ title: "Goal Set!", description: `"${goalTitle}" is added to your calendar.` });
      
      // Reset form
      setGoalTitle("");
      setGoalDesc("");
      setGoalCat("work");
      setMilestonesText("");
      setIsCreateOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Write Error", description: "Failed to save goal." });
    }
  };

  const handleToggleMilestone = async (goal: Goal, milestoneId: string) => {
    if (!user || !firestore || goal.id.startsWith("default-")) {
      // Allow modifying default/mock goals locally in UI
      goal.milestones = goal.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
      const completedCount = goal.milestones.filter(m => m.completed).length;
      goal.progress = Math.round((completedCount / goal.milestones.length) * 100);
      toast({ title: "Milestone Updated (Demo)" });
      return;
    }

    const updatedMilestones = goal.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    const goalRef = doc(firestore, "users", user.uid, "plan_goals", goal.id);
    await updateDoc(goalRef, {
      milestones: updatedMilestones,
      progress
    });
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user || !firestore || goalId.startsWith("default-")) {
      toast({ title: "Demo goal cannot be deleted." });
      return;
    }
    const goalRef = doc(firestore, "users", user.uid, "plan_goals", goalId);
    await deleteDocumentNonBlocking(goalRef);
    toast({ title: "Goal Deleted" });
  };

  const getGoalsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return goals.filter(g => g.targetDate === dateStr);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-[1600px] mx-auto py-10 space-y-10 animate-fade-in px-6 text-foreground pb-20">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-10 rounded-[3rem] border-white/10 bg-black/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><CalendarIcon className="w-64 h-64 -rotate-12 text-amber-500" /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-xl shadow-amber-900/10">
            <CalendarIcon className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Xakteir Plan</h1>
            <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mt-1 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" /> Goals & Timeline Registry
            </p>
          </div>
        </div>

        {/* Date Month Selector */}
        <div className="flex items-center gap-6 relative z-10 bg-black/35 p-1 rounded-2xl border border-white/5">
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-white/5" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </Button>
          <h2 className="text-xl font-black uppercase italic w-44 text-center text-white">{format(currentDate, "MMMM yyyy")}</h2>
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-white/5" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Dialog to Set Goal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-500 text-white h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl border-none">
              <Plus className="w-4 h-4 mr-2" /> Set Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-4 border-white/10 rounded-[3rem] text-white p-10 max-w-xl shadow-[0_30px_100px_rgba(0,0,0,0.9)]">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-amber-500">Define Mission Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Goal Title</label>
                <Input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Complete Web OS Build" className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Description</label>
                <Textarea value={goalDesc} onChange={(e) => setGoalDesc(e.target.value)} placeholder="Document key requirements and link the databases..." className="bg-zinc-900 border-white/5 rounded-xl text-xs font-bold min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Category</label>
                  <select 
                    value={goalCat} 
                    onChange={(e) => setGoalCat(e.target.value as GoalCategory)}
                    className="w-full bg-zinc-900 border border-white/5 h-12 rounded-xl text-xs font-bold px-3 text-white outline-none focus:border-amber-500/40"
                  >
                    <option value="work">Work / Coding</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health / Sports</option>
                    <option value="learning">Education</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Target Date</label>
                  <Input type="date" value={goalTargetDate} onChange={(e) => setGoalTargetDate(e.target.value)} className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Milestones (One per line)</label>
                <Textarea 
                  value={milestonesText} 
                  onChange={(e) => setMilestonesText(e.target.value)} 
                  placeholder="Milestone 1&#10;Milestone 2&#10;Milestone 3" 
                  className="bg-zinc-900 border-white/5 rounded-xl text-xs font-bold min-h-[100px]" 
                />
              </div>
              <Button onClick={handleCreateGoal} className="w-full h-14 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest border-none mt-2">
                Deploy Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-7 gap-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] pb-2">{d}</div>
            ))}
            {days.map((day, i) => {
              const dayGoals = getGoalsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const inMonth = isSameMonth(day, currentDate);

              return (
                <Card 
                  key={i} 
                  onClick={() => {
                    setSelectedDate(day);
                    setGoalTargetDate(format(day, "yyyy-MM-dd"));
                  }}
                  className={cn(
                    "h-32 rounded-[2rem] border-2 transition-all p-4 cursor-pointer flex flex-col justify-between group overflow-hidden bg-zinc-900/10",
                    isSelected ? "bg-amber-500/5 border-amber-500 shadow-2xl scale-[1.01]" : "border-white/5 hover:border-white/10",
                    !inMonth && "opacity-20",
                    isToday && "border-amber-500/30 ring-1 ring-amber-500/20"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className={cn(
                      "text-base font-black italic", 
                      isToday ? "text-amber-500" : "text-zinc-400 group-hover:text-white transition-colors"
                    )}>
                      {format(day, "d")}
                    </span>
                    {dayGoals.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </div>
                  
                  {/* Goal Badges inside day cells */}
                  <div className="space-y-1 overflow-hidden max-h-16">
                    {dayGoals.slice(0, 2).map((g) => {
                      const cfg = CATEGORY_COLORS[g.category] || CATEGORY_COLORS.work;
                      return (
                        <div 
                          key={g.id} 
                          className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase truncate border", cfg.bg, cfg.border, cfg.text)}
                        >
                          {g.title}
                        </div>
                      );
                    })}
                    {dayGoals.length > 2 && (
                      <div className="text-[7px] text-zinc-500 font-bold uppercase pl-1">+{dayGoals.length - 2} more</div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Side: Goals Rail */}
        <aside className="lg:col-span-4 space-y-8 bg-zinc-950/60 p-8 rounded-[3rem] border-4 border-white/10 shadow-3xl">
          <header className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-white">
              <ListTodo className="w-5 h-5 text-amber-500" /> Active Goals
            </h3>
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">{goals.length} goal(s)</span>
          </header>

          <div className="h-[750px] overflow-y-auto pr-2">
            <div className="space-y-6 pb-20">
              {goals.length === 0 ? (
                <div className="py-20 text-center opacity-25 space-y-4">
                  <CalendarIcon className="w-16 h-16 mx-auto text-amber-500 animate-pulse" />
                  <p className="text-sm font-black uppercase tracking-widest text-zinc-400">No active goals set</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Click "Set Goal" above to register a milestone.</p>
                </div>
              ) : (
                goals.map((g) => {
                  const cfg = CATEGORY_COLORS[g.category] || CATEGORY_COLORS.work;
                  return (
                    <Card key={g.id} className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4 hover:border-amber-500/20 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className={cn("px-2.5 py-0.5 rounded text-[8px] font-black uppercase border", cfg.bg, cfg.border, cfg.text)}>
                            {g.category}
                          </span>
                          <h4 className="text-sm font-black text-white uppercase italic tracking-tight mt-2">{g.title}</h4>
                          <p className="text-[10px] text-zinc-400 font-medium leading-relaxed italic mt-1">{g.description}</p>
                        </div>
                        
                        {/* Delete icon */}
                        <button 
                          onClick={() => handleDeleteGoal(g.id)}
                          className="text-zinc-600 hover:text-rose-500 transition-colors p-1 rounded hover:bg-white/5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Progress slider bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase">
                          <span>Milestone Progress</span>
                          <span className="text-amber-500">{g.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 transition-all duration-500" 
                            style={{ width: `${g.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Milestones checklists */}
                      {g.milestones && g.milestones.length > 0 && (
                        <div className="pt-2 border-t border-white/5 space-y-2">
                          <div className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Milestone Checklist</div>
                          <div className="space-y-1.5">
                            {g.milestones.map((m) => (
                              <div 
                                key={m.id} 
                                onClick={() => handleToggleMilestone(g, m.id)}
                                className="flex items-center gap-2 cursor-pointer group/item select-none text-[11px] font-bold text-zinc-300 hover:text-white"
                              >
                                <div className={cn(
                                  "w-4.5 h-4.5 rounded flex items-center justify-center border transition-all",
                                  m.completed 
                                    ? "bg-amber-500/20 border-amber-500 text-amber-500" 
                                    : "border-white/10 group-hover/item:border-amber-500/40"
                                )}>
                                  {m.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                                <span className={cn(m.completed && "line-through text-zinc-500 italic")}>
                                  {m.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[8px] font-black uppercase text-zinc-500 flex items-center gap-1.5 justify-end">
                        <Clock className="w-3 h-3 text-amber-500" /> Target: {g.targetDate}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

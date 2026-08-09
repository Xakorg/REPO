"use client";

import { useState, useMemo } from "react";
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
  CheckCircle2,
  Trash2,
  CalendarCheck,
  ListTodo
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Category = "work" | "personal" | "health" | "learning";

export default function XakteirPlanPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"calendar" | "tasks">("calendar");

  // New Goal / Task State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("work");

  // Firestore Queries
  const goalsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "goals");
  }, [firestore, user]);

  const goalsQuery = useMemoFirebase(() => {
    if (!goalsRef) return null;
    return query(goalsRef, orderBy("createdAt", "desc"));
  }, [goalsRef]);

  const { data: goalsData, isLoading } = useCollection(goalsQuery);

  const handleCreatePlanItem = async () => {
    if (!newTitle.trim() || !goalsRef) return;
    try {
      await addDocumentNonBlocking(goalsRef, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        targetDate: format(selectedDate, "yyyy-MM-dd"),
        category: newCategory,
        status: "todo",
        progress: 0,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Plan item created!", description: `${newTitle} added to Xakteir Plan.` });
      setNewTitle("");
      setNewDesc("");
      setIsDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error creating plan item" });
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  return (
    <div className="min-h-screen bg-[#070514] text-white p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                Xakteir <span className="text-indigo-400">Plan</span>
              </h1>
              <p className="text-xs text-gray-400">Integrated Calendar Timelines & Task Kanban Boards</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-black/50 p-1.5 rounded-2xl border border-white/10 flex items-center space-x-1">
              <Button
                size="sm"
                variant={activeTab === "calendar" ? "secondary" : "ghost"}
                onClick={() => setActiveTab("calendar")}
                className="text-xs font-bold"
              >
                <CalendarIcon className="w-4 h-4 mr-1.5" /> Calendar View
              </Button>
              <Button
                size="sm"
                variant={activeTab === "tasks" ? "secondary" : "ghost"}
                onClick={() => setActiveTab("tasks")}
                className="text-xs font-bold"
              >
                <ListTodo className="w-4 h-4 mr-1.5" /> Task Board
              </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-5 rounded-2xl">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Task / Event
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0c091f] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-lg font-black uppercase text-indigo-400">Add to Xakteir Plan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1">Title</label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Complete Q3 Product Specs"
                      className="bg-black/50 border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1">Description</label>
                    <Textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Details, key outcomes..."
                      className="bg-black/50 border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1">Target Date</label>
                    <Input
                      type="date"
                      value={format(selectedDate, "yyyy-MM-dd")}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="bg-black/50 border-white/10 text-white text-xs"
                    />
                  </div>
                  <Button onClick={handleCreatePlanItem} className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold">
                    Save to Plan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* CALENDAR VIEW */}
        {activeTab === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 bg-[#0c091f]/80 border-white/10 p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black italic uppercase text-white">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center space-x-2">
                  <Button size="icon" variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="border-white/10 h-8 w-8">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCurrentMonth(new Date())} className="border-white/10 text-xs">
                    Today
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="border-white/10 h-8 w-8">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Grid Header */}
              <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 border-b border-white/10 pb-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrent = isSameMonth(day, currentMonth);
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "h-24 p-2 rounded-2xl border text-xs flex flex-col justify-between cursor-pointer transition-all",
                        isCurrent ? "bg-black/40 border-white/10 text-white" : "bg-black/10 border-transparent text-gray-600",
                        isSelected && "border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/20"
                      )}
                    >
                      <span className={cn("font-bold", isSameDay(day, new Date()) && "text-indigo-400 font-black")}>
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Selected Day Agenda */}
            <Card className="bg-[#0c091f]/80 border-white/10 p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-black italic uppercase text-indigo-400">
                Agenda ({format(selectedDate, "MMM d, yyyy")})
              </h3>
              <p className="text-xs text-gray-400">Tasks and events scheduled for this day:</p>

              <div className="space-y-3 pt-2">
                {goalsData && goalsData.filter((g: any) => g.targetDate === format(selectedDate, "yyyy-MM-dd")).length > 0 ? (
                  goalsData
                    .filter((g: any) => g.targetDate === format(selectedDate, "yyyy-MM-dd"))
                    .map((g: any) => (
                      <div key={g.id} className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                        <span className="font-bold text-xs text-white block">{g.title}</span>
                        {g.description && <p className="text-[11px] text-gray-400">{g.description}</p>}
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-gray-500 italic">No plan items scheduled for this date.</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* TASKS KANBAN VIEW */}
        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#0c091f]/80 border-white/10 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-black italic uppercase text-sm text-amber-400">To Do</span>
                <Badge className="bg-amber-500/20 text-amber-300">{goalsData?.length || 0}</Badge>
              </div>

              <div className="space-y-3">
                {goalsData?.map((task: any) => (
                  <div key={task.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                    <span className="font-bold text-xs text-white block">{task.title}</span>
                    {task.description && <p className="text-[11px] text-gray-400">{task.description}</p>}
                    <span className="text-[10px] font-mono text-indigo-400 block">Due: {task.targetDate}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}

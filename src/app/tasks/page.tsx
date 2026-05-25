
"use client";

import { ListTodo, Plus, MoreVertical, Calendar, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function XakTaskPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "goals"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [firestore, user]);

  const { data: goals, isLoading } = useCollection(goalsQuery);

  const pendingGoals = goals?.filter(g => !g.completed) || [];
  const completedGoals = goals?.filter(g => g.completed) || [];

  return (
    <div className="max-w-[1600px] mx-auto py-10 animate-fade-in px-6 space-y-10 text-foreground">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-xl shadow-emerald-900/20">
              <ListTodo className="w-7 h-7 text-emerald-500" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">XakTask</h1>
          </div>
          <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] ml-16 italic">Plan Your Projects // Hub Control</p>
        </div>
        <Button className="h-14 px-10 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl shadow-emerald-900/30">
          <Plus className="w-5 h-5 mr-2" /> New Mission
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-300px)]">
        <div className="flex flex-col gap-6 bg-white/5 p-6 rounded-[3rem] border border-white/5">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Transmission Queue</h3>
            <Badge variant="outline" className="bg-white/5 border-none text-[10px]">{pendingGoals.length}</Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>
              ) : pendingGoals.length === 0 ? (
                <div className="text-center opacity-20 py-20 uppercase font-black tracking-widest text-xs">No Pending Missions</div>
              ) : (
                pendingGoals.map(task => (
                  <Card key={task.id} className="glass-card rounded-[2rem] p-6 border-white/5 hover:border-primary/20 transition-all cursor-pointer shadow-xl group">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="text-[8px] font-black uppercase px-2 py-0.5 border-none bg-blue-500/20 text-blue-500">ACTIVE</Badge>
                      <MoreVertical className="w-4 h-4 text-muted-foreground opacity-40" />
                    </div>
                    <h4 className="text-sm font-black text-foreground uppercase italic mb-6 leading-tight">{task.title}</h4>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase">
                        <Calendar className="w-3 h-3" /> {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '...'}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-secondary/30 flex items-center justify-center border border-white/10">
                        <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-col gap-6 bg-white/5 p-6 rounded-[3rem] border border-white/5">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Completed Shards</h3>
            <Badge variant="outline" className="bg-white/5 border-none text-[10px]">{completedGoals.length}</Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>
              ) : completedGoals.length === 0 ? (
                <div className="text-center opacity-20 py-20 uppercase font-black tracking-widest text-xs">Zero Finished Shards</div>
              ) : (
                completedGoals.map(task => (
                  <Card key={task.id} className="glass-card rounded-[2rem] p-6 border-white/5 opacity-60 grayscale-[0.5] shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="text-[8px] font-black uppercase px-2 py-0.5 border-none bg-emerald-500/20 text-emerald-500">RESOLVED</Badge>
                    </div>
                    <h4 className="text-sm font-black text-foreground uppercase italic mb-6 leading-tight line-through">{task.title}</h4>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase">
                        <Calendar className="w-3 h-3" /> {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '...'}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border border-white/10">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

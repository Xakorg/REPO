
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Target, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

export default function XakteirPlanPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  return (
    <div className="max-w-7xl mx-auto py-10 space-y-12 animate-fade-in px-6 text-foreground">
      <header className="flex justify-between items-center glass-card p-10 rounded-[3rem] border-white/10 bg-black/40">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-xl"><CalendarIcon className="w-8 h-8 text-amber-500" /></div>
          <div><h1 className="text-4xl font-black uppercase italic tracking-tighter">Xakteir Plan</h1><p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Logic Calendar v4.2</p></div>
        </div>
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft /></Button>
          <h2 className="text-2xl font-black uppercase italic w-48 text-center">{format(currentDate, "MMMM yyyy")}</h2>
          <Button variant="ghost" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight /></Button>
        </div>
        <Button className="bg-primary h-12 px-8 rounded-xl font-black uppercase text-[10px]">Add Event</Button>
      </header>

      <div className="grid grid-cols-7 gap-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em]">{d}</div>
        ))}
        {days.map((day, i) => (
          <Card 
            key={i} 
            onClick={() => setSelectedDate(day)}
            className={cn(
              "h-40 rounded-[2.5rem] border-2 transition-all p-6 cursor-pointer group",
              isSameDay(day, selectedDate) ? "bg-primary/10 border-primary shadow-2xl" : "bg-white/5 border-white/5 hover:border-white/10",
              !isSameMonth(day, currentDate) && "opacity-20"
            )}
          >
             <span className={cn("text-xl font-black italic", isSameDay(day, new Date()) ? "text-primary" : "text-white")}>{format(day, "d")}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

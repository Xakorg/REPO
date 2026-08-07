"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskItem {
  id: string;
  title: string;
  status: "todo" | "done";
}

export function KanbanBoardGenerator() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: "1", title: "Set up WebGL shader playground", status: "done" },
    { id: "2", title: "Integrate SpeechRecognition voice mode", status: "todo" },
    { id: "3", title: "Add Ghost auto-destruct timer", status: "todo" },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t))
    );
  };

  const exportToXakTasks = () => {
    toast({ title: "Tasks exported to XakTasks app! 🚀" });
  };

  return (
    <div className="my-4 rounded-xl border border-violet-500/30 bg-[#0d071a]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-violet-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-4 w-4 text-violet-400" />
          <span className="font-semibold text-violet-200">AI Task & Kanban Board Generator</span>
        </div>
        <Button size="xs" onClick={exportToXakTasks} className="bg-violet-600 hover:bg-violet-500 text-white">
          Export to XakTasks <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
              task.status === "done"
                ? "bg-violet-950/20 border-violet-500/20 text-gray-400 line-through"
                : "bg-black/40 border-violet-500/20 text-violet-100 hover:bg-white/5"
            }`}
          >
            <CheckCircle2
              className={`h-4 w-4 ${task.status === "done" ? "text-emerald-400 fill-emerald-400/20" : "text-gray-500"}`}
            />
            <span className="font-medium text-xs flex-1">{task.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
